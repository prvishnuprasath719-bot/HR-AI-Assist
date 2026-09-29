import React, { useEffect, useState, useCallback } from "react";

interface Applicant {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  experience: number;

  resume?: {
    originalName: string;
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
  };

  applicationStatus?: string;
  uploadedAt?: string;
}

export default function ApplicantsScreen() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // GET APPLICANTS
  // ==========================================

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/applicants");

      if (!response.ok) {
        throw new Error("Failed to fetch applicants");
      }

      const data = await response.json();

      // FIX: Handle both direct arrays and wrapped objects like { applicants: [...] }
      let applicantList: Applicant[] = [];
      if (Array.isArray(data)) {
        applicantList = data;
      } else if (data && Array.isArray(data.applicants)) {
        applicantList = data.applicants;
      } else if (data && Array.isArray(data.data)) {
        applicantList = data.data;
      } else {
        throw new Error("Invalid applicant data format");
      }

      setApplicants(applicantList);
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
      setError("Could not load applicants. Please try again.");
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load applicants when page opens
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // ==========================================
  // RESUME UPLOAD
  // ==========================================

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Please enter candidate name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter candidate email.");
      return;
    }

    if (!resume) {
      setError("Please select a PDF or DOCX resume.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(resume.type)) {
      setError("Only PDF and DOCX files are allowed.");
      return;
    }

    if (resume.size > 5 * 1024 * 1024) {
      setError("Resume must be smaller than 5 MB.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("email", email.trim());
    formData.append("resume", resume);

    setUploading(true);

    try {
      const response = await fetch("/api/applicants/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage("Resume uploaded successfully!");
      setName("");
      setEmail("");
      setResume(null);

      const fileInput = document.getElementById("resume") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }

      await fetchApplicants();
    } catch (err) {
      console.error("Resume upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload resume.");
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="w-full space-y-6">
      {/* PAGE HEADER */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#e8f4fa] flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#003b5a]">
                group
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#003b5a]">Applicants</h1>
              <p className="mt-1 text-sm text-[#66717a]">
                Upload and manage candidate resumes for AI processing.
              </p>
            </div>
          </div>
          <button
            onClick={fetchApplicants}
            disabled={loading}
            className="shrink-0 px-5 py-3 rounded-xl bg-[#003b5a] text-white font-semibold hover:bg-[#002d45] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              {loading ? "hourglass_top" : "refresh"}
            </span>
            {loading ? "Refreshing..." : "Refresh List"}
          </button>
        </div>
      </div>

      {/* RESUME UPLOAD SECTION */}
      <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#003b5a] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#003b5a]">upload_file</span>
          Upload Candidate Resume
        </h2>

        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-[#41474e] mb-1.5">
                Candidate Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Jane Doe"
                className="w-full border border-[#d9dee3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003b5a]/20 focus:border-[#003b5a] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#41474e] mb-1.5">
                Candidate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., jane.doe@example.com"
                className="w-full border border-[#d9dee3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#003b5a]/20 focus:border-[#003b5a] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#41474e] mb-1.5">
              Upload Resume
            </label>
            <input
              id="resume"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                setResume(selectedFile);
                setError("");
                setMessage("");
              }}
              className="w-full border border-[#d9dee3] rounded-xl px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#e8f4fa] file:text-[#003b5a] hover:file:bg-[#d4ebf7] transition"
            />
            <p className="text-xs text-[#72787f] mt-2">
              Supported formats: PDF, DOCX. Maximum size: 5 MB.
            </p>
            {resume && (
              <p className="text-sm text-green-700 mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Selected: {resume.name}
              </p>
            )}
          </div>

          {message && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <p className="text-sm font-medium text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600">error</span>
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="w-full md:w-auto px-6 py-3 bg-[#003b5a] text-white rounded-xl font-semibold hover:bg-[#002d45] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">cloud_upload</span>
                Upload Resume
              </>
            )}
          </button>
        </form>
      </div>

      {/* UPLOADED APPLICANTS */}
      <div>
        <h2 className="text-lg font-bold text-[#003b5a] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#003b5a]">folder_open</span>
          Uploaded Applicants
        </h2>

        {loading ? (
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#a5adb4] animate-pulse">
              hourglass_top
            </span>
            <p className="mt-3 text-sm font-semibold text-[#41474e]">Loading applicants...</p>
            <p className="text-xs text-[#72787f] mt-1">Fetching data from the server</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-red-500">error</span>
            <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchApplicants}
              className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition"
            >
              Try Again
            </button>
          </div>
        ) : applicants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-10 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#a5adb4]">inbox</span>
            <h3 className="mt-3 text-lg font-semibold text-[#41474e]">No applicants found yet</h3>
            <p className="mt-2 text-sm text-[#72787f]">
              Upload a candidate resume above to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {applicants.map((applicant) => (
              <div
                key={applicant._id}
                className="bg-white rounded-2xl border border-[#d9dee3] shadow-sm p-5 transition hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#e8f4fa] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#003b5a]">person</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#003b5a]">{applicant.name}</h3>
                      <p className="text-sm text-[#66717a] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        {applicant.email}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#e8f4fa] text-[#003b5a] text-xs font-bold uppercase tracking-wide">
                    {applicant.applicationStatus || "New"}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e1e5e8] grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#72787f] font-semibold mb-1">
                      Skills
                    </p>
                    <p className="text-sm text-[#41474e]">
                      {applicant.skills?.length ? applicant.skills.join(", ") : "Not analyzed yet"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#72787f] font-semibold mb-1">
                      Experience
                    </p>
                    <p className="text-sm text-[#41474e]">
                      {applicant.experience || 0} year(s)
                    </p>
                  </div>
                </div>

                {applicant.resume && (
                  <div className="mt-4 p-4 rounded-xl bg-[#f7f9fb] border border-[#e1e5e8] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#003b5a]">description</span>
                      <div>
                        <p className="text-sm font-semibold text-[#003b5a]">
                          {applicant.resume.originalName}
                        </p>
                        <p className="text-xs text-[#72787f]">
                          {(applicant.resume.size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {applicant.resume.mimeType?.split("/")[1]?.toUpperCase() || "FILE"}
                        </p>
                      </div>
                    </div>
                    {applicant.resume.filePath && (
                      <a
                        href={applicant.resume.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#003b5a] text-white text-sm font-semibold hover:bg-[#002d45] transition"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View Resume
                      </a>
                    )}
                  </div>
                )}

                {applicant.uploadedAt && (
                  <p className="text-xs text-[#72787f] mt-4 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    Uploaded: {new Date(applicant.uploadedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}