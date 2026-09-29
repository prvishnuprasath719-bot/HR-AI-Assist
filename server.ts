import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import multer from "multer";
import fs from "fs";
import { google } from "googleapis";


dotenv.config();

const app = express();

app.use(express.json());

// Log every incoming request — makes it immediately visible in the
// terminal whether the frontend is even reaching the backend, and with
// what result, instead of having to guess or add ad-hoc console.logs.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ======================================================
// RESUME UPLOAD CONFIGURATION
// ======================================================

const uploadDir = path.join(process.cwd(), "uploads", "resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )}`;

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX resumes are allowed"));
    }
  },
});

// ======================================================
// MONGODB
// ======================================================

const client = new MongoClient("mongodb://localhost:27017");

let applicantsCollection: any;
let jobsCollection: any;
let usersCollection: any;

const JWT_SECRET = "change-this-to-something-random-and-secret";

// Only these emails are allowed to sign up / log in as a RECRUITER.
const ALLOWED_RECRUITER_EMAILS = [
  "prvishnuprasath@gmail.com",
];

// ======================================================
// DATABASE CONNECTION
// ======================================================

async function connectDB() {
  await client.connect();

  const db = client.db("HR_Project");

  applicantsCollection = db.collection("Applicants");
  jobsCollection = db.collection("jobs");
  usersCollection = db.collection("users");

  // Google Drive sync collections are a secondary feature — if index
  // creation fails (e.g. Mongo permissions, or this is the first run and
  // the index already exists in a slightly different shape), don't let it
  // take down the whole server. Log it and keep going.
  try {
    await initializeDriveSyncCollections();
  } catch (err) {
    console.error(
      "Google Drive sync collections could not be initialized — Drive sync will be unavailable, but the rest of the app will still run:",
      err
    );
  }

  console.log("Connected to MongoDB - HR_Project");
}

async function seedJobsIfEmpty() {
  const count = await jobsCollection.countDocuments();

  if (count === 0) {
    await jobsCollection.insertMany(jobsStore);

    console.log("Seeded initial jobs into MongoDB");
  }
}

// ======================================================
// AUTH ROUTES
// ======================================================

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required",
      });
    }

    const finalRole = role || "seeker";

    if (
      finalRole === "recruiter" &&
      !ALLOWED_RECRUITER_EMAILS.includes(email.toLowerCase())
    ) {
      return res.status(403).json({
        error:
          "Recruiter access is restricted to authorized users only",
      });
    }

    const existing = await usersCollection.findOne({ email });

    if (existing) {
      return res.status(409).json({
        error: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      {
        userId: result.insertedId,
        role: finalRole,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(201).json({
      token,
      name,
      role: finalRole,
    });
  } catch (err) {
    console.error("Signup error:", err);

    res.status(500).json({
      error: "Signup failed",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    if (
      user.role === "recruiter" &&
      !ALLOWED_RECRUITER_EMAILS.includes(
        user.email.toLowerCase()
      )
    ) {
      return res.status(403).json({
        error: "Recruiter access has been revoked for this account",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      token,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      error: "Login failed",
    });
  }
});

// ======================================================
// APPLICANTS ROUTES
// ======================================================

// ---------------- RESUME UPLOAD ----------------

app.post(
  "/api/applicants/upload",
  upload.single("resume"),
  async (req, res) => {
    try {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          error: "Candidate name and email are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Resume file is required",
        });
      }

      const applicant = {
        name: name.trim(),

        email: email.trim().toLowerCase(),

        skills: [],

        experience: 0,

        resume: {
          originalName: req.file.originalname,
          fileName: req.file.filename,
          filePath: `/uploads/resumes/${req.file.filename}`,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },

        applicationStatus: "New",

        uploadedAt: new Date().toISOString(),
      };

      const result =
        await applicantsCollection.insertOne(applicant);

      res.status(201).json({
        success: true,

        message: "Resume uploaded successfully",

        applicant: {
          _id: result.insertedId,
          ...applicant,
        },
      });
    } catch (err) {
      console.error("Resume upload error:", err);

      res.status(500).json({
        error: "Failed to upload resume",
      });
    }
  }
);

// ---------------- GET ALL APPLICANTS ----------------

app.get("/api/applicants", async (req, res) => {
  try {
    const applicants =
      await applicantsCollection.find().toArray();

    res.json(applicants);
  } catch (err) {
    console.error("Fetch applicants error:", err);

    res.status(500).json({
      error: "Failed to fetch applicants",
    });
  }
});

// ---------------- GET SINGLE APPLICANT ----------------

app.get("/api/applicants/:id", async (req, res) => {
  try {
    const applicant =
      await applicantsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });

    if (!applicant) {
      return res.status(404).json({
        error: "Not found",
      });
    }

    res.json(applicant);
  } catch (err) {
    console.error("Fetch applicant error:", err);

    res.status(500).json({
      error: "Failed to fetch applicant",
    });
  }
});

// ---------------- CREATE APPLICANT ----------------

app.post("/api/applicants", async (req, res) => {
  try {
    const {
      name,
      email,
      skills,
      experience,
    } = req.body;

    const result =
      await applicantsCollection.insertOne({
        name,
        email,
        skills,
        experience,
      });

    res.status(201).json({
      insertedId: result.insertedId,
    });
  } catch (err) {
    console.error("Create applicant error:", err);

    res.status(500).json({
      error: "Failed to create applicant",
    });
  }
});

// ---------------- UPDATE APPLICANT ----------------

app.put("/api/applicants/:id", async (req, res) => {
  try {
    const result =
      await applicantsCollection.updateOne(
        {
          _id: new ObjectId(req.params.id),
        },
        {
          $set: req.body,
        }
      );

    res.json(result);
  } catch (err) {
    console.error("Update applicant error:", err);

    res.status(500).json({
      error: "Failed to update applicant",
    });
  }
});

// ---------------- DELETE APPLICANT ----------------

app.delete("/api/applicants/:id", async (req, res) => {
  try {
    const result =
      await applicantsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });

    res.json(result);
  } catch (err) {
    console.error("Delete applicant error:", err);

    res.status(500).json({
      error: "Failed to delete applicant",
    });
  }
});

// ======================================================
// PORT
// ======================================================

const PORT = 3001;

// ======================================================
// GOOGLE DRIVE SYNC CONFIGURATION
// ======================================================
// Google Drive sync is intentionally scheduled every 6 hours.
// The POST /api/drive/sync route is kept only for local testing.
// No Drive event/webhook trigger is used.

const SIX_HOURS = 6 * 60 * 60 * 1000;

const googleDriveDataDir = path.join(process.cwd(), "data");
const googleDriveTokenPath = path.join(
  googleDriveDataDir,
  "google-drive-token.json"
);

if (!fs.existsSync(googleDriveDataDir)) {
  fs.mkdirSync(googleDriveDataDir, { recursive: true });
}

const googleClientSecretPath =
  process.env.GOOGLE_CLIENT_SECRET_FILE ||
  (() => {
    const files = fs
      .readdirSync(process.cwd())
      .filter(
        (fileName) =>
          fileName.startsWith("client_secret_") &&
          fileName.endsWith(".json")
      );

    return files.length > 0
      ? path.join(process.cwd(), files[0])
      : path.join(process.cwd(), "client_secret.json");
  })();

const googleDriveFolderId =
  process.env.GOOGLE_DRIVE_FOLDER_ID || "";

const googleDriveScopes = [
  "https://www.googleapis.com/auth/drive.readonly",
];

let googleOAuthClient: any = null;
let driveClient: any = null;
let driveLastSyncAt: string | null = null;
let driveNextSyncAt: string | null = new Date(
  Date.now() + SIX_HOURS
).toISOString();
let driveSyncRunning = false;
let driveKnownFilesCount = 0;

let processedDriveFilesCollection: any;
let driveSyncHistoryCollection: any;

function getGoogleOAuthClient() {
  if (googleOAuthClient) {
    return googleOAuthClient;
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `http://localhost:${PORT}/api/drive/oauth2callback`;

  // Prefer credentials from environment variables (.env) — safer than
  // relying on a client_secret_*.json file sitting in the project folder,
  // since .env is typically gitignored and a .json file might not be.
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    googleOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    return googleOAuthClient;
  }

  // Fallback: read from a client_secret_*.json file if env vars aren't set.
  if (!fs.existsSync(googleClientSecretPath)) {
    throw new Error(
      `Google OAuth credentials not found. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, or place a client_secret file at: ${googleClientSecretPath}`
    );
  }

  const credentials = JSON.parse(
    fs.readFileSync(googleClientSecretPath, "utf8")
  );

  const installed = credentials.installed || credentials.web;

  if (!installed?.client_id || !installed?.client_secret) {
    throw new Error(
      "Invalid Google OAuth client secret JSON. Expected an installed or web OAuth client."
    );
  }

  googleOAuthClient = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    redirectUri
  );

  return googleOAuthClient;
}

function saveGoogleDriveToken(tokens: any) {
  fs.writeFileSync(
    googleDriveTokenPath,
    JSON.stringify(tokens, null, 2),
    "utf8"
  );
}

function loadGoogleDriveToken() {
  if (!fs.existsSync(googleDriveTokenPath)) {
    return null;
  }

  try {
    return JSON.parse(
      fs.readFileSync(googleDriveTokenPath, "utf8")
    );
  } catch (err) {
    console.error("Failed to read Google Drive token:", err);
    return null;
  }
}

async function initializeGoogleDriveClient() {
  try {
    const oauthClient = getGoogleOAuthClient();
    const tokens = loadGoogleDriveToken();

    if (!tokens) {
      driveClient = null;
      return null;
    }

    oauthClient.setCredentials(tokens);

    oauthClient.on("tokens", (newTokens: any) => {
      const mergedTokens = {
        ...tokens,
        ...newTokens,
      };

      saveGoogleDriveToken(mergedTokens);
    });

    driveClient = google.drive({
      version: "v3",
      auth: oauthClient,
    });

    return driveClient;
  } catch (err) {
    console.error("Google Drive client initialization error:", err);
    driveClient = null;
    return null;
  }
}

function getGoogleAuthorizationUrl() {
  const oauthClient = getGoogleOAuthClient();

  return oauthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: googleDriveScopes,
  });
}

async function listDriveResumeFiles() {
  if (!driveClient) {
    await initializeGoogleDriveClient();
  }

  if (!driveClient) {
    throw new Error(
      "Google Drive is not authorized. Open /api/drive/auth first."
    );
  }

  const allFiles: any[] = [];
  let pageToken: string | undefined = undefined;

  const folderQuery = googleDriveFolderId
    ? `'${googleDriveFolderId}' in parents and `
    : "";

  const query =
    `${folderQuery}trashed = false and ` +
    "(mimeType = 'application/pdf' or " +
    "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')";

  do {
    const response: any = await driveClient.files.list({
      q: query,
      pageSize: 100,
      pageToken,
      orderBy: "modifiedTime desc",
      fields:
        "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents)",
      spaces: "drive",
      corpora: "user",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });

    allFiles.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);

  driveKnownFilesCount = allFiles.length;
  return allFiles;
}

async function downloadDriveFile(file: any) {
  if (!driveClient) {
    await initializeGoogleDriveClient();
  }

  if (!driveClient) {
    throw new Error("Google Drive is not authorized");
  }

  const response = await driveClient.files.get(
    {
      fileId: file.id,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "arraybuffer",
    }
  );

  const buffer = Buffer.from(response.data);

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Resume file is larger than the 5 MB application limit");
  }

  const safeOriginalName = file.name.replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );

  const localFileName = `${Date.now()}-${file.id}-${safeOriginalName}`;
  const localPath = path.join(uploadDir, localFileName);

  fs.writeFileSync(localPath, buffer);

  return {
    localFileName,
    localPath,
    size: buffer.length,
  };
}

function candidateNameFromDriveFile(fileName: string) {
  return fileName
    .replace(/\.(pdf|docx)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Google Drive Candidate";
}

async function recordDriveHistory(entry: any) {
  if (!driveSyncHistoryCollection) {
    return;
  }

  await driveSyncHistoryCollection.insertOne({
    ...entry,
    syncedAt: new Date().toISOString(),
  });
}

async function syncDriveResume(file: any) {
  const existing = await processedDriveFilesCollection.findOne({
    driveFileId: file.id,
  });

  if (existing) {
    return {
      status: "skipped",
      fileId: file.id,
      fileName: file.name,
      message: "Resume was already processed",
    };
  }

  const downloaded = await downloadDriveFile(file);

  const applicant = {
    name: candidateNameFromDriveFile(file.name),
    email: "",
    skills: [],
    experience: 0,
    resume: {
      originalName: file.name,
      fileName: downloaded.localFileName,
      filePath: `/uploads/resumes/${downloaded.localFileName}`,
      mimeType: file.mimeType,
      size: downloaded.size,
    },
    applicationStatus: "New",
    source: "google_drive",
    uploadedAt: new Date().toISOString(),
    drive: {
      fileId: file.id,
      webViewLink: file.webViewLink || null,
      modifiedTime: file.modifiedTime || null,
      createdTime: file.createdTime || null,
    },
  };

  const applicantResult =
    await applicantsCollection.insertOne(applicant);

  await processedDriveFilesCollection.insertOne({
    driveFileId: file.id,
    fileName: file.name,
    applicantId: applicantResult.insertedId,
    modifiedTime: file.modifiedTime || null,
    processedAt: new Date().toISOString(),
  });

  return {
    status: "success",
    fileId: file.id,
    fileName: file.name,
    applicantId: applicantResult.insertedId,
    message: "Resume downloaded and added to HR AI Assist",
  };
}

async function runDriveSync(reason = "scheduled") {
  if (driveSyncRunning) {
    return {
      success: false,
      message: "A Google Drive sync is already running",
      reason,
    };
  }

  driveSyncRunning = true;
  const startedAt = new Date().toISOString();
  let filesFound = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  const results: any[] = [];

  try {
    const files = await listDriveResumeFiles();
    filesFound = files.length;

    for (const file of files) {
      try {
        const result = await syncDriveResume(file);
        results.push(result);

        if (result.status === "success") {
          processed += 1;
        } else if (result.status === "skipped") {
          skipped += 1;
        }
      } catch (err) {
        failed += 1;

        const message =
          err instanceof Error ? err.message : "Unknown sync error";

        const failure = {
          status: "error",
          fileId: file.id,
          fileName: file.name,
          message,
        };

        results.push(failure);

        console.error(
          `Failed to sync Drive file ${file.name}:`,
          err
        );
      }
    }

    driveLastSyncAt = new Date().toISOString();
    driveNextSyncAt = new Date(
      Date.now() + SIX_HOURS
    ).toISOString();

    await recordDriveHistory({
      status: failed > 0 ? "partial" : "success",
      reason,
      startedAt,
      filesFound,
      processed,
      skipped,
      failed,
      message:
        failed > 0
          ? `Drive sync completed with ${failed} error(s)`
          : `Drive sync completed. ${processed} new resume(s) processed.`,
    });

    return {
      success: true,
      reason,
      startedAt,
      completedAt: driveLastSyncAt,
      filesFound,
      processed,
      skipped,
      failed,
      results,
      nextSync: driveNextSyncAt,
    };
  } catch (err) {
    driveLastSyncAt = new Date().toISOString();
    driveNextSyncAt = new Date(
      Date.now() + SIX_HOURS
    ).toISOString();

    const message =
      err instanceof Error ? err.message : "Google Drive sync failed";

    await recordDriveHistory({
      status: "error",
      reason,
      startedAt,
      filesFound,
      processed,
      skipped,
      failed,
      message,
    });

    throw err;
  } finally {
    driveSyncRunning = false;
  }
}

async function initializeDriveSyncCollections() {
  const db = client.db("HR_Project");

  processedDriveFilesCollection = db.collection(
    "driveProcessedFiles"
  );

  driveSyncHistoryCollection = db.collection(
    "driveSyncHistory"
  );

  await processedDriveFilesCollection.createIndex(
    { driveFileId: 1 },
    { unique: true }
  );

  await driveSyncHistoryCollection.createIndex({
    syncedAt: -1,
  });
}

// ======================================================
// JOB DATA
// ======================================================

// In-memory sample data — used ONLY to seed MongoDB once
// on first run.

let jobsStore: any[] = [
  {
    id: "job-1",
    reqId: "REQ-2023-041",
    title: "Senior Product Designer",
    department: "design",
    departmentLabel: "Design & UX",
    location: "Remote, San Francisco",
    employmentType: "full-time",
    salaryRange: "$140,000 - $175,000 USD",
    skills: [
      "Figma",
      "Design Systems",
      "User Research",
      "Prototyping",
      "WCAG",
    ],

    rawSource: {
      source_id: "JD-REQ-2023-041",

      ingestion_timestamp: new Date(
        Date.now() - 3600000 * 2
      ).toISOString(),

      raw_text_payload:
        "Need an experienced designer to lead UX for our core enterprise dashboard. Must have 5+ yrs in Figma, multi-tier design systems, user testing, and working with frontend eng in React/Tailwind. Hybrid or remote.",

      metadata: {
        department: "Design & UX",
        hiring_manager: "Marcus Vance",
        urgency: "High",
        format_detected: "plain_text_block",
      },

      pre_processing_flags: [
        "contains_salary_data",
        "requires_location_parsing",
      ],
    },

    versions: [
      {
        versionNumber: "V3",
        label: "V3 (Optimized) - Current",
        isCurrent: true,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "enabled",

        updatedAt: new Date(
          Date.now() - 3600000
        ).toISOString(),

        summary:
          "Lead the end-to-end design lifecycle for enterprise-grade analytics interfaces. Spearhead cohesive multi-tier design token architecture and collaborate closely with front-end engineering teams.",

        structuredResponsibilities: [
          "Architect, document, and maintain comprehensive cross-platform component design systems in Figma.",
          "Lead user research synthesis, journey mapping, and interactive high-fidelity prototyping sprints.",
          "Partner with engineering leads to ensure pixel-perfect accessibility standards compliance (WCAG 2.1 AA).",
        ],

        structuredQualifications: [
          "5+ years of demonstrable product design experience in high-density SaaS/B2B products.",
          "Deep mastery of Figma variables, autolayout, responsive constraints, and design tokens.",
          "Proven track record of turning ambiguous complex workflows into intuitive user experiences.",
        ],

        performanceInsight:
          "45% higher candidate engagement vs V2. Top-performing posting on LinkedIn.",
      },

      {
        versionNumber: "V2",
        label: "V2 (Standard)",
        isCurrent: false,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "disabled",

        updatedAt: new Date(
          Date.now() - 86400000 * 2
        ).toISOString(),

        summary:
          "Product designer responsible for UI/UX wireframes and team syncs.",

        structuredResponsibilities: [
          "Create mockups for web app interfaces.",
          "Attend sprint planning with development team.",
          "Conduct periodic user feedback sessions.",
        ],

        structuredQualifications: [
          "4+ years UI/UX design experience.",
          "Proficient in design tools.",
        ],
      },

      {
        versionNumber: "V1",
        label: "V1 (Draft)",
        isCurrent: false,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "draft",

        updatedAt: new Date(
          Date.now() - 86400000 * 5
        ).toISOString(),

        summary:
          "Initial draft specification for Senior Designer opening.",

        structuredResponsibilities: [
          "Raw bullet points unrefined.",
        ],

        structuredQualifications: [
          "Degree in HCI or related field.",
        ],
      },
    ],
  },

  {
    id: "job-2",
    reqId: "REQ-2023-042",
    title: "Backend Engineer (Go)",
    department: "engineering",
    departmentLabel: "Engineering & Tech",
    location: "Remote, Austin, TX",
    employmentType: "full-time",
    salaryRange: "$150,000 - $185,000 USD",

    skills: [
      "Go (Golang)",
      "PostgreSQL",
      "gRPC",
      "Distributed Systems",
      "Docker",
      "Kubernetes",
    ],

    rawSource: {
      source_id: "JD-REQ-2023-042",

      ingestion_timestamp: new Date(
        Date.now() - 3600000 * 5
      ).toISOString(),

      raw_text_payload:
        "Looking for backend Go engineer to build high throughput microservices. Low latency gRPC endpoints, PostgreSQL query tuning, Kafka streaming pipeline. 4+ yrs Go experience required.",

      metadata: {
        department: "Engineering",
        hiring_manager: "Elena Rostova",
        urgency: "Medium",
        format_detected: "bullet_notes",
      },

      pre_processing_flags: [
        "contains_technical_stack",
        "requires_latency_spec",
      ],
    },

    versions: [
      {
        versionNumber: "V2",
        label: "V2 (Technical) - Current",
        isCurrent: true,
        platform: "GitHub Jobs",
        platformKey: "github",
        status: "disabled",

        updatedAt: new Date(
          Date.now() - 3600000 * 4
        ).toISOString(),

        summary:
          "Engineer fault-tolerant, distributed backend microservices in Go powering high-concurrency real-time transaction processing.",

        structuredResponsibilities: [
          "Develop low-latency gRPC and RESTful microservices capable of processing 50k+ req/sec.",
          "Design robust PostgreSQL relational schemas with automated partitioning and indexing strategies.",
          "Orchestrate containerized services on Kubernetes with automated CI/CD and OpenTelemetry instrumentation.",
        ],

        structuredQualifications: [
          "4+ years of production experience writing high-performance Go code.",
          "Solid foundations in concurrency models (goroutines, channels, sync primitives).",
          "Experience with message brokers (Kafka, RabbitMQ) and distributed caching.",
        ],
      },

      {
        versionNumber: "V1",
        label: "V1 (General)",
        isCurrent: false,
        platform: "GitHub Jobs",
        platformKey: "github",
        status: "disabled",

        updatedAt: new Date(
          Date.now() - 86400000 * 3
        ).toISOString(),

        summary:
          "Backend engineer for server side development.",

        structuredResponsibilities: [
          "Write backend code in Go.",
          "Maintain databases.",
        ],

        structuredQualifications: [
          "Computer Science degree and coding experience.",
        ],
      },
    ],
  },

  {
    id: "job-3",
    reqId: "REQ-2023-038",
    title: "VP of Marketing",
    department: "sales",
    departmentLabel: "Sales & Marketing",
    location: "New York, NY (Hybrid)",
    employmentType: "full-time",
    salaryRange:
      "$210,000 - $260,000 USD + Equity",

    skills: [
      "Growth Strategy",
      "Demand Generation",
      "Brand Positioning",
      "Team Leadership",
      "Budget Management",
    ],

    rawSource: {
      source_id: "JD-REQ-2023-038",

      ingestion_timestamp: new Date(
        Date.now() - 3600000 * 8
      ).toISOString(),

      raw_text_payload:
        "Senior executive to lead our global marketing organization. Need someone who has scaled B2B SaaS from $10M to $50M ARR. Manage 15-person team across content, growth, product marketing and PR.",

      metadata: {
        department: "Sales & Marketing",
        hiring_manager: "David Sterling (CEO)",
        urgency: "Critical",
        format_detected: "executive_brief",
      },

      pre_processing_flags: [
        "contains_compensation_package",
        "executive_level",
      ],
    },

    versions: [
      {
        versionNumber: "V4",
        label: "V4 (Exec Summary) - Current",
        isCurrent: true,
        platform: "Company Website",
        platformKey: "website",
        status: "enabled",

        updatedAt: new Date(
          Date.now() - 3600000 * 2
        ).toISOString(),

        summary:
          "Spearhead comprehensive go-to-market strategy, brand evolution, and multi-channel demand generation to accelerate high-velocity B2B SaaS growth.",

        structuredResponsibilities: [
          "Direct global marketing budget and lead a multi-disciplinary team spanning product marketing, content, and growth.",
          "Build scalable organic and paid acquisition funnels to surpass qualified pipeline conversion milestones.",
          "Refine enterprise messaging and brand positioning for tier-1 industry analysts and global press.",
        ],

        structuredQualifications: [
          "8+ years in progressive marketing leadership roles with proven track record scaling B2B SaaS revenue.",
          "Analytical acumen in pipeline modeling, customer acquisition cost (CAC), and LTV optimization.",
          "Inspiring leadership presence with experience recruiting and mentoring top tier marketing talent.",
        ],

        performanceInsight:
          "Direct company career site applications increased by 62% under V4 format.",
      },

      {
        versionNumber: "V3",
        label: "V3 (Detailed)",
        isCurrent: false,
        platform: "Company Website",
        platformKey: "website",
        status: "disabled",

        updatedAt: new Date(
          Date.now() - 86400000 * 4
        ).toISOString(),

        summary:
          "Detailed leadership job post.",

        structuredResponsibilities: [
          "Manage marketing teams.",
          "Run ad campaigns.",
        ],

        structuredQualifications: [
          "Senior leadership experience.",
        ],
      },
    ],
  },

  {
    id: "job-4",
    reqId: "REQ-2023-045",
    title: "Customer Success Manager",
    department: "hr",
    departmentLabel: "Customer Experience",
    location: "London, UK / Remote",
    employmentType: "full-time",
    salaryRange: "£65,000 - £80,000 GBP",

    skills: [
      "Client Onboarding",
      "Churn Reduction",
      "Zendesk",
      "Account Expansion",
      "SaaS Training",
    ],

    rawSource: {
      source_id: "JD-REQ-2023-045",

      ingestion_timestamp: new Date(
        Date.now() - 3600000 * 12
      ).toISOString(),

      raw_text_payload:
        "Customer success manager to manage portfolio of 40 mid-market enterprise accounts. Ensure quick onboarding, product adoption, proactive health checks, and drive renewal rates >95%.",

      metadata: {
        department: "Customer Success",
        hiring_manager: "Clara O'Connor",
        urgency: "Medium",
        format_detected: "raw_notes",
      },

      pre_processing_flags: [
        "contains_kpis",
        "requires_portfolio_definition",
      ],
    },

    versions: [
      {
        versionNumber: "V1",
        label: "V1 (Draft) - Current",
        isCurrent: true,
        platform: "Indeed",
        platformKey: "indeed",
        status: "draft",

        updatedAt: new Date(
          Date.now() - 3600000 * 10
        ).toISOString(),

        summary:
          "Champion customer delight and product adoption for mid-market clients, safeguarding retention and identifying strategic expansion opportunities.",

        structuredResponsibilities: [
          "Guide new customers through seamless white-glove onboarding and workflow configuration.",
          "Monitor account health telemetry to preemptively mitigate churn risk.",
          "Lead quarterly business reviews (QBRs) and advocate for client feature requests with product teams.",
        ],

        structuredQualifications: [
          "3+ years in customer success or technical account management within enterprise software.",
          "Exceptional empathy, consultative communication, and proactive problem-solving abilities.",
          "Experience using CRM platforms (Salesforce, HubSpot, Gainsight).",
        ],
      },
    ],
  },

  {
    id: "job-5",
    reqId: "REQ-2023-049",
    title: "Senior React Developer",
    department: "engineering",
    departmentLabel: "Engineering & Tech",
    location: "San Francisco, CA (Hybrid)",
    employmentType: "full-time",
    salaryRange:
      "$130,000 - $165,000 USD",

    skills: [
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Next.js",
      "State Management",
      "WCAG",
    ],

    rawSource: {
      source_id: "JD-REQ-8942-2023",

      ingestion_timestamp: new Date(
        Date.now() - 3600000 * 1
      ).toISOString(),

      raw_text_payload:
        "We are looking for a Senior Frontend Developer to join our core product team. You will be responsible for building complex user interfaces using React and modern CSS frameworks. Candidates should have at least 5 years of experience in frontend development, a strong understanding of state management (Redux, Zustand), and experience with RESTful APIs. Must be proficient in TypeScript. Bonus points for experience with web accessibility standards (WCAG) and performance optimization techniques. Salary range is $130k-$165k depending on experience. This is a hybrid role based in our San Francisco office, requiring 2 days a week in-office.",

      metadata: {
        department: "Engineering",
        hiring_manager: "Sarah Jenkins",
        urgency: "High",
        format_detected: "plain_text_block",
      },

      pre_processing_flags: [
        "contains_salary_data",
        "requires_location_parsing",
      ],
    },

    versions: [
      {
        versionNumber: "V3",
        label: "V3 (Optimized) - Current",
        isCurrent: true,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "enabled",

        updatedAt: new Date(
          Date.now() - 1800000
        ).toISOString(),

        summary:
          "Build and scale mission-critical web applications with cutting-edge React architecture, TypeScript rigor, and responsive design execution.",

        structuredResponsibilities: [
          "Architect performant, accessible component hierarchies using React 19, TypeScript, and Tailwind CSS.",
          "Collaborate with UX designers and backend engineers to integrate RESTful and GraphQL APIs seamlessly.",
          "Enforce code quality, comprehensive unit/integration test coverage, and web performance budgets.",
        ],

        structuredQualifications: [
          "5+ years of modern JavaScript/TypeScript and React ecosystem experience.",
          "Demonstrated mastery of complex state management paradigms and client-side caching.",
          "Deep familiarity with Web Content Accessibility Guidelines (WCAG) and Core Web Vitals optimization.",
        ],

        performanceInsight:
          "45% higher candidate response rate. Optimized keywords for recruiter search indexing.",
      },
    ],
  },
];

// ======================================================
// GEMINI CLIENT
// ======================================================

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,

      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

// ======================================================
// API ROUTES
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    const totalJobs =
      await jobsCollection.countDocuments();

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      totalJobs,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch health status",
    });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const jobs =
      await jobsCollection.find().toArray();

    res.json({
      jobs,
    });
  } catch (err) {
    res.status(500).json({
      error: "Failed to fetch jobs",
    });
  }
});

// ======================================================
// GOOGLE DRIVE API ROUTES
// ======================================================

app.get("/api/drive/auth", async (_req, res) => {
  try {
    res.redirect(getGoogleAuthorizationUrl());
  } catch (err) {
    res.status(500).json({ connected: false, error: err instanceof Error ? err.message : "Unable to create Google authorization URL" });
  }
});

app.get("/api/drive/oauth2callback", async (req, res) => {
  try {
    const code = String(req.query.code || "");
    if (!code) return res.status(400).send("Google authorization code was not provided.");

    const oauthClient = getGoogleOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    saveGoogleDriveToken(tokens);
    oauthClient.setCredentials(tokens);
    googleOAuthClient = oauthClient;
    driveClient = google.drive({ version: "v3", auth: oauthClient });

    res.send("<h2 style='font-family:Arial;color:#137333'>Google Drive authorization successful</h2><p style='font-family:Arial'>You can close this tab and return to HR AI Assist.</p>");
  } catch (err) {
    console.error("Google Drive OAuth callback error:", err);
    res.status(500).send(`Google Drive authorization failed: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
});

app.get("/api/drive/status", async (_req, res) => {
  try {
    const token = loadGoogleDriveToken();
    const processedFiles = await processedDriveFilesCollection.countDocuments();
    res.json({
      connected: Boolean(token && driveClient),
      authorized: Boolean(token),
      folderConfigured: Boolean(googleDriveFolderId),
      totalFiles: driveKnownFilesCount,
      processedFiles,
      pendingFiles: Math.max(driveKnownFilesCount - processedFiles, 0),
      lastSync: driveLastSyncAt,
      nextSync: driveNextSyncAt,
      syncFrequencyHours: 6,
      scheduler: "every 6 hours",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Google Drive status" });
  }
});

app.get("/api/drive/files", async (_req, res) => {
  try {
    const files = await listDriveResumeFiles();
    const ids = files.map((file: any) => file.id);
    const processed = ids.length ? await processedDriveFilesCollection.find({ driveFileId: { $in: ids } }, { projection: { driveFileId: 1 } }).toArray() : [];
    const processedIds = new Set(processed.map((item: any) => item.driveFileId));

    res.json({ files: files.map((file: any) => ({
      id: file.id, name: file.name, mimeType: file.mimeType, size: file.size,
      modifiedTime: file.modifiedTime, createdTime: file.createdTime,
      webViewLink: file.webViewLink, processed: processedIds.has(file.id),
    })) });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to fetch Google Drive files" });
  }
});

app.get("/api/drive/history", async (_req, res) => {
  try {
    const history = await driveSyncHistoryCollection.find().sort({ syncedAt: -1 }).limit(50).toArray();
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Google Drive sync history" });
  }
});

// ANALYTICS-START
// Turns raw driveSyncHistory documents into the numbers shown on the
// Google Drive Sync page. Kept as a pure function (no database access) so it
// is easy to test with sample data.
function computeDriveAnalytics(runs: any[], now: Date = new Date()) {
  // YYYY-MM-DD in the server's local time zone (so "today" matches your clock).
  const localDayKey = (date: Date) => date.toLocaleDateString("en-CA");

  const totals = {
    totalRuns: runs.length,
    successRuns: 0,
    partialRuns: 0,
    failedRuns: 0,
    skippedRuns: 0,
    scheduledRuns: 0,
    manualRuns: 0,
    filesFound: 0,
    filesProcessed: 0,
    filesSkipped: 0,
    filesFailed: 0,
  };

  let lastSuccessAt: string | null = null;
  let lastFailureAt: string | null = null; // most recent "error" or "partial" run
  let lastFailureMessage: string | null = null;

  for (const run of runs) {
    if (run.status === "success") {
      totals.successRuns += 1;
    } else if (run.status === "partial") {
      totals.partialRuns += 1;
    } else if (run.status === "error") {
      totals.failedRuns += 1;
    } else {
      totals.skippedRuns += 1;
    }

    if (run.reason === "scheduled") {
      totals.scheduledRuns += 1;
    } else {
      totals.manualRuns += 1;
    }

    totals.filesFound += Number(run.filesFound) || 0;
    totals.filesProcessed += Number(run.processed) || 0;
    totals.filesSkipped += Number(run.skipped) || 0;
    totals.filesFailed += Number(run.failed) || 0;

    if (
      run.status === "success" &&
      run.syncedAt &&
      (!lastSuccessAt || run.syncedAt > lastSuccessAt)
    ) {
      lastSuccessAt = run.syncedAt;
    }

    if (
      (run.status === "error" || run.status === "partial") &&
      run.syncedAt &&
      (!lastFailureAt || run.syncedAt > lastFailureAt)
    ) {
      lastFailureAt = run.syncedAt;
      lastFailureMessage = run.message || null;
    }
  }

  // Runs that were only a single-file re-check ("skipped") don't count for or
  // against the success rate.
  const ratedRuns = totals.totalRuns - totals.skippedRuns;
  const successRate =
    ratedRuns > 0 ? Math.round((totals.successRuns / ratedRuns) * 100) : 0;

  // Last 7 days (oldest first, today last) for the small bar chart.
  const runsByDay: { date: string; total: number; success: number; failed: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    runsByDay.push({ date: localDayKey(day), total: 0, success: 0, failed: 0 });
  }

  for (const run of runs) {
    if (!run.syncedAt) continue;

    const runDate = new Date(run.syncedAt);
    if (Number.isNaN(runDate.getTime())) continue;

    const bucket = runsByDay.find((day) => day.date === localDayKey(runDate));
    if (!bucket) continue;

    bucket.total += 1;

    if (run.status === "success") {
      bucket.success += 1;
    } else if (run.status === "error" || run.status === "partial") {
      bucket.failed += 1;
    }
  }

  return {
    ...totals,
    successRate,
    lastSuccessAt,
    lastFailureAt,
    lastFailureMessage,
    runsByDay,
  };
}
// ANALYTICS-END

app.get("/api/drive/analytics", async (_req, res) => {
  try {
    if (!driveSyncHistoryCollection) {
      return res.status(503).json({
        error: "Sync history is unavailable because the database collection was not initialized",
      });
    }

    const runs = await driveSyncHistoryCollection
      .find()
      .sort({ syncedAt: -1 })
      .limit(1000)
      .toArray();

    res.json(computeDriveAnalytics(runs));
  } catch (err) {
    console.error("Drive analytics error:", err);
    res.status(500).json({ error: "Failed to compute Google Drive sync analytics" });
  }
});

// Local test endpoint. The automatic 6-hour scheduler does not use the UI.
app.post("/api/drive/sync", async (_req, res) => {
  try {
    res.json(await runDriveSync("manual-test"));
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Google Drive sync failed" });
  }
});

// Browser-friendly version of the same thing — just visit this URL directly
// (GET) instead of needing a terminal/curl/Postman to send a POST request.
app.get("/api/drive/sync-now", async (_req, res) => {
  try {
    const result = await runDriveSync("manual-browser-test");
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Google Drive sync failed" });
  }
});

app.post("/api/drive/sync/:fileId", async (req, res) => {
  try {
    const fileId = req.params.fileId;
    if (!fileId) return res.status(400).json({ error: "Drive file ID is required" });
    if (!driveClient) await initializeGoogleDriveClient();
    if (!driveClient) return res.status(401).json({ error: "Google Drive is not authorized. Open /api/drive/auth first." });

    const response = await driveClient.files.get({ fileId, fields: "id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents", supportsAllDrives: true });
    const file = response.data;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.mimeType)) return res.status(400).json({ error: "Only PDF and DOCX files can be synced as resumes" });

    const result = await syncDriveResume(file);
    await recordDriveHistory({ status: result.status === "success" ? "success" : "skipped", reason: "manual-file-test", filesFound: 1, processed: result.status === "success" ? 1 : 0, skipped: result.status === "skipped" ? 1 : 0, failed: 0, fileId: file.id, fileName: file.name, message: result.message });
    res.json({ success: result.status !== "error", ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : "Failed to sync Drive file" });
  }
});

// ======================================================
// STRUCTURE JOB WITH GEMINI
// ======================================================

app.post("/api/structure-job", async (req, res) => {
  const {
    jobTitle,
    department,
    location,
    employmentType,
    responsibilitiesRaw,
    qualificationsRaw,
    skills,
    targetPlatform = "LinkedIn",
    saveToStore = true,
  } = req.body;

  const rawPayload = `Job Title: ${
    jobTitle || "Untitled Role"
  }\nDepartment: ${
    department || "General"
  }\nLocation: ${
    location || "Remote"
  }\nType: ${
    employmentType || "Full-Time"
  }\n\nRaw Responsibilities:\n${
    responsibilitiesRaw ||
    "No specific raw responsibilities provided"
  }\n\nRaw Qualifications:\n${
    qualificationsRaw ||
    "No specific raw qualifications provided"
  }\n\nSkills: ${(skills || []).join(", ")}`;

  let structuredResult: {
    executiveSummary: string;
    structuredResponsibilities: string[];
    structuredQualifications: string[];
    skillsTaxonomy: {
      category: string;
      skills: string[];
    }[];
    suggestedSalary: string;
    platformOptimizationNote: string;
  } | null = null;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const response =
        await ai.models.generateContent({
          model: "gemini-3.7-flash",

          contents: `You are an expert HR AI recruitment assistant. Transform the following raw job notes into an optimized, highly structured job description formatted for ${targetPlatform}.

Raw Input:
${rawPayload}`,

          config: {
            systemInstruction:
              "You specialize in structuring messy job notes, recruiter intake forms, and role requirements into crisp, professional, bullet-pointed responsibilities, clear qualifications, skill categories, and platform-specific tone adaptations.",

            responseMimeType: "application/json",

            responseSchema: {
              type: Type.OBJECT,

              properties: {
                executiveSummary: {
                  type: Type.STRING,
                  description:
                    "A concise 2-sentence executive summary of the role purpose and high-impact mission.",
                },

                structuredResponsibilities: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description:
                    "3 to 5 clear, action-oriented bullet points starting with strong power verbs.",
                },

                structuredQualifications: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.STRING,
                  },
                  description:
                    "3 to 5 measurable, specific qualification requirements including years of experience and domain skills.",
                },

                skillsTaxonomy: {
                  type: Type.ARRAY,

                  items: {
                    type: Type.OBJECT,

                    properties: {
                      category: {
                        type: Type.STRING,
                      },

                      skills: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.STRING,
                        },
                      },
                    },

                    required: [
                      "category",
                      "skills",
                    ],
                  },

                  description:
                    "Grouped skills into core competencies (e.g. Core Technical, Methodologies, Soft Skills).",
                },

                suggestedSalary: {
                  type: Type.STRING,

                  description:
                    "Realistic benchmark salary bracket (e.g. $130,000 - $160,000 USD).",
                },

                platformOptimizationNote: {
                  type: Type.STRING,

                  description:
                    "Brief note explaining why this structuring optimizes engagement for the selected platform.",
                },
              },

              required: [
                "executiveSummary",
                "structuredResponsibilities",
                "structuredQualifications",
                "skillsTaxonomy",
                "suggestedSalary",
                "platformOptimizationNote",
              ],
            },
          },
        });

      if (response.text) {
        structuredResult = JSON.parse(
          response.text
        );
      }
    }
  } catch (err) {
    console.error(
      "Gemini API structuring error or offline fallback:",
      err
    );
  }

  if (!structuredResult) {
    const linesResp = (
      responsibilitiesRaw || ""
    )
      .split("\n")
      .map((l: string) =>
        l
          .replace(/^[-*•\d.]+\s*/, "")
          .trim()
      )
      .filter((l: string) => l.length > 3);

    const linesQual = (
      qualificationsRaw || ""
    )
      .split("\n")
      .map((l: string) =>
        l
          .replace(/^[-*•\d.]+\s*/, "")
          .trim()
      )
      .filter((l: string) => l.length > 3);

    const formattedResponsibilities =
      linesResp.length > 0
        ? linesResp.map(
            (l: string) =>
              l.charAt(0).toUpperCase() +
              l.slice(1)
          )
        : [
            `Lead the architectural execution and strategic delivery for ${
              jobTitle || "the role"
            }.`,
            "Partner with cross-functional product, design, and engineering teams to accelerate milestone velocity.",
            "Ensure exceptional standards of quality, reliability, and continuous system enhancement.",
          ];

    const formattedQualifications =
      linesQual.length > 0
        ? linesQual.map(
            (l: string) =>
              l.charAt(0).toUpperCase() +
              l.slice(1)
          )
        : [
            "5+ years of demonstrable industry experience in relevant domain workflows.",
            "Proficiency in modern tooling, industry best practices, and team collaboration.",
            "Strong communication skills with an aptitude for problem-solving in high-growth environments.",
          ];

    structuredResult = {
      executiveSummary: `We are seeking an exceptional ${
        jobTitle || "Professional"
      } to spearhead key initiatives within our ${
        department || "core"
      } department. This role drives high-leverage outcomes through systematic execution and collaboration.`,

      structuredResponsibilities:
        formattedResponsibilities,

      structuredQualifications:
        formattedQualifications,

      skillsTaxonomy: [
        {
          category: "Core Competencies",
          skills:
            skills && skills.length
              ? skills
              : [
                  "Domain Expertise",
                  "Strategic Execution",
                  "Problem Solving",
                ],
        },

        {
          category:
            "Collaboration & Delivery",

          skills: [
            "Cross-functional Communication",
            "Agile Planning",
            "Quality Assurance",
          ],
        },
      ],

      suggestedSalary:
        "$135,000 - $170,000 USD",

      platformOptimizationNote: `Tailored for ${targetPlatform} with concise power bullet points and high-density keyword distribution.`,
    };
  }

  const newReqNumber = Math.floor(
    1000 + Math.random() * 9000
  );

  const reqId = `REQ-2026-${newReqNumber}`;

  const newJobId = `job-${Date.now()}`;

  const platformKeyMap: Record<
    string,
    string
  > = {
    LinkedIn: "linkedin",
    "GitHub Jobs": "github",
    "Company Website": "website",
    Indeed: "indeed",
  };

  const newJob = {
    id: newJobId,

    reqId,

    title:
      jobTitle || "Untitled Position",

    department:
      department || "engineering",

    departmentLabel:
      department || "Engineering & Tech",

    location:
      location || "Remote",

    employmentType:
      employmentType || "full-time",

    salaryRange:
      structuredResult.suggestedSalary,

    skills:
      skills || [
        "React",
        "TypeScript",
        "System Design",
      ],

    rawSource: {
      source_id: `JD-${reqId}`,

      ingestion_timestamp:
        new Date().toISOString(),

      raw_text_payload: rawPayload,

      metadata: {
        department:
          department || "Engineering",

        hiring_manager:
          "Recruitment Lead",

        urgency: "High",

        format_detected:
          "structured_intake_form",
      },

      pre_processing_flags: [
        "ai_parsed",
        "taxonomy_generated",
      ],
    },

    versions: [
      {
        versionNumber: "V1",

        label:
          "V1 (AI Structured) - Current",

        isCurrent: true,

        platform: targetPlatform,

        platformKey:
          platformKeyMap[targetPlatform] ||
          "linkedin",

        status: "enabled",

        updatedAt:
          new Date().toISOString(),

        summary:
          structuredResult.executiveSummary,

        structuredResponsibilities:
          structuredResult.structuredResponsibilities,

        structuredQualifications:
          structuredResult.structuredQualifications,

        skillsTaxonomy:
          structuredResult.skillsTaxonomy,

        performanceInsight:
          structuredResult.platformOptimizationNote,
      },
    ],
  };

  if (saveToStore) {
    try {
      await jobsCollection.insertOne(
        newJob
      );
    } catch (err) {
      console.error(
        "Failed to save new job to MongoDB:",
        err
      );
    }
  }

  res.json({
    success: true,
    job: newJob,
    structured: structuredResult,
  });
});

// ======================================================
// VERSION STATUS
// ======================================================

app.patch(
  "/api/jobs/:id/version/:versionNumber/status",
  async (req, res) => {
    const { id, versionNumber } =
      req.params;

    const { status } = req.body;

    try {
      const job =
        await jobsCollection.findOne({
          id,
        });

      if (!job) {
        return res.status(404).json({
          error: "Job not found",
        });
      }

      const ver = job.versions.find(
        (v: any) =>
          v.versionNumber ===
          versionNumber
      );

      if (!ver) {
        return res.status(404).json({
          error: "Version not found",
        });
      }

      ver.status = status;

      ver.updatedAt =
        new Date().toISOString();

      await jobsCollection.updateOne(
        { id },
        {
          $set: {
            versions: job.versions,
          },
        }
      );

      res.json({
        success: true,
        job,
        updatedVersion: ver,
      });
    } catch (err) {
      res.status(500).json({
        error:
          "Failed to update version status",
      });
    }
  }
);

// ======================================================
// SYNC PLATFORMS
// ======================================================

app.post(
  "/api/sync-platforms",
  async (req, res) => {
    try {
      const activeCount =
        await jobsCollection.countDocuments({
          versions: {
            $elemMatch: {
              status: "enabled",
            },
          },
        });

      res.json({
        success: true,

        message: `Synchronized ${activeCount} active job postings across LinkedIn, GitHub Jobs, Indeed, and Company Website.`,

        syncedAt:
          new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({
        error:
          "Failed to sync platforms",
      });
    }
  }
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
  await connectDB();

  await seedJobsIfEmpty();

  // Make uploaded resumes accessible from the browser.
  app.use(
    "/uploads",
    express.static(
      path.join(process.cwd(), "uploads")
    )
  );

  // Create the actual HTTP server ourselves (instead of calling
  // app.listen() directly) so we can hand it to Vite below. This is the
  // fix for full-page reloads instead of proper Hot Module Replacement:
  // without this, Vite spins up its own separate WebSocket server for
  // HMR, which can conflict with ports already in use and silently fall
  // back to reloading the whole page (wiping out React state) instead of
  // patching components in place.
  const httpServer = http.createServer(app);

  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    const vite =
      await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            server: httpServer,
          },
        },

        appType: "spa",
      });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    app.use(
      express.static(distPath)
    );

    app.get("*", (req, res) => {
      res.sendFile(
        path.join(
          distPath,
          "index.html"
        )
      );
    });
  }

  httpServer.listen(
    PORT,
    "0.0.0.0",
    () => {
      console.log(
        `HR AI Assist Server running on http://localhost:${PORT}`
      );

      void initializeGoogleDriveClient();

      setInterval(async () => {
        try {
          console.log("[Google Drive] 6-hour scheduled sync started");
          const result = await runDriveSync("scheduled");
          console.log(`[Google Drive] Scheduled sync completed: ${result.processed} processed, ${result.skipped} skipped, ${result.failed} failed`);
        } catch (err) {
          console.error("[Google Drive] Scheduled sync failed:", err);
        }
      }, SIX_HOURS);

      console.log(`[Google Drive] Automatic sync scheduled every 6 hours. Next sync: ${driveNextSyncAt}`);
    }
  );
}

startServer().catch((err) => {
  console.error("Fatal error during server startup — the server did not start:", err);
  process.exit(1);
});