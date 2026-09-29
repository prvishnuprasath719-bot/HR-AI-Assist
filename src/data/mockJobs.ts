import { JobPosting } from '../types';

export const INITIAL_JOBS: JobPosting[] = [
  {
    id: "job-1",
    reqId: "REQ-2023-041",
    title: "Senior Product Designer",
    department: "design",
    departmentLabel: "Design & UX",
    location: "Remote, San Francisco",
    employmentType: "Full-Time",
    salaryRange: "$140,000 - $175,000 USD",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "WCAG"],
    rawSource: {
      source_id: "JD-REQ-2023-041",
      ingestion_timestamp: "2023-10-27T08:30:00Z",
      raw_text_payload: "Need an experienced designer to lead UX for our core enterprise dashboard. Must have 5+ yrs in Figma, multi-tier design systems, user testing, and working with frontend eng in React/Tailwind. Hybrid or remote.",
      metadata: {
        department: "Design & UX",
        hiring_manager: "Marcus Vance",
        urgency: "High",
        format_detected: "plain_text_block"
      },
      pre_processing_flags: ["contains_salary_data", "requires_location_parsing"]
    },
    versions: [
      {
        versionNumber: "V3",
        label: "V3 (Optimized) - Current",
        isCurrent: true,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "enabled",
        updatedAt: "2023-10-27T10:15:00Z",
        summary: "Lead the end-to-end design lifecycle for enterprise-grade analytics interfaces. Spearhead cohesive multi-tier design token architecture and collaborate closely with front-end engineering teams.",
        structuredResponsibilities: [
          "Architect, document, and maintain comprehensive cross-platform component design systems in Figma.",
          "Lead user research synthesis, journey mapping, and interactive high-fidelity prototyping sprints.",
          "Partner with engineering leads to ensure pixel-perfect accessibility standards compliance (WCAG 2.1 AA)."
        ],
        structuredQualifications: [
          "5+ years of demonstrable product design experience in high-density SaaS/B2B products.",
          "Deep mastery of Figma variables, autolayout, responsive constraints, and design tokens.",
          "Proven track record of turning ambiguous complex workflows into intuitive user experiences."
        ],
        skillsTaxonomy: [
          { category: "Design Tools", skills: ["Figma", "Design Tokens", "Prototyping"] },
          { category: "UX Research", skills: ["User Interviews", "Usability Testing", "Journey Mapping"] },
          { category: "Standards", skills: ["WCAG 2.1 AA", "Design Systems", "Design QA"] }
        ],
        performanceInsight: "45% higher candidate engagement vs V2. Top-performing posting on LinkedIn."
      },
      {
        versionNumber: "V2",
        label: "V2 (Standard)",
        isCurrent: false,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "disabled",
        updatedAt: "2023-10-20T14:20:00Z",
        summary: "Product designer responsible for UI/UX wireframes and team syncs.",
        structuredResponsibilities: [
          "Create mockups for web app interfaces.",
          "Attend sprint planning with development team.",
          "Conduct periodic user feedback sessions."
        ],
        structuredQualifications: [
          "4+ years UI/UX design experience.",
          "Proficient in design tools."
        ]
      },
      {
        versionNumber: "V1",
        label: "V1 (Draft)",
        isCurrent: false,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "draft",
        updatedAt: "2023-10-15T09:00:00Z",
        summary: "Initial draft specification for Senior Designer opening.",
        structuredResponsibilities: ["Raw bullet points unrefined."],
        structuredQualifications: ["Degree in HCI or related field."]
      }
    ]
  },
  {
    id: "job-2",
    reqId: "REQ-2023-042",
    title: "Backend Engineer (Go)",
    department: "engineering",
    departmentLabel: "Engineering & Tech",
    location: "Remote, Austin, TX",
    employmentType: "Full-Time",
    salaryRange: "$150,000 - $185,000 USD",
    skills: ["Go (Golang)", "PostgreSQL", "gRPC", "Distributed Systems", "Docker", "Kubernetes"],
    rawSource: {
      source_id: "JD-REQ-2023-042",
      ingestion_timestamp: "2023-10-27T07:15:00Z",
      raw_text_payload: "Looking for backend Go engineer to build high throughput microservices. Low latency gRPC endpoints, PostgreSQL query tuning, Kafka streaming pipeline. 4+ yrs Go experience required.",
      metadata: {
        department: "Engineering",
        hiring_manager: "Elena Rostova",
        urgency: "Medium",
        format_detected: "bullet_notes"
      },
      pre_processing_flags: ["contains_technical_stack", "requires_latency_spec"]
    },
    versions: [
      {
        versionNumber: "V2",
        label: "V2 (Technical) - Current",
        isCurrent: true,
        platform: "GitHub Jobs",
        platformKey: "github",
        status: "disabled",
        updatedAt: "2023-10-27T08:00:00Z",
        summary: "Engineer fault-tolerant, distributed backend microservices in Go powering high-concurrency real-time transaction processing.",
        structuredResponsibilities: [
          "Develop low-latency gRPC and RESTful microservices capable of processing 50k+ req/sec.",
          "Design robust PostgreSQL relational schemas with automated partitioning and indexing strategies.",
          "Orchestrate containerized services on Kubernetes with automated CI/CD and OpenTelemetry instrumentation."
        ],
        structuredQualifications: [
          "4+ years of production experience writing high-performance Go code.",
          "Solid foundations in concurrency models (goroutines, channels, sync primitives).",
          "Experience with message brokers (Kafka, RabbitMQ) and distributed caching."
        ],
        skillsTaxonomy: [
          { category: "Languages & Runtimes", skills: ["Go (Golang)", "C++"] },
          { category: "Databases & Streaming", skills: ["PostgreSQL", "Kafka", "Redis"] },
          { category: "Infra & DevOps", skills: ["Kubernetes", "Docker", "gRPC", "CI/CD"] }
        ]
      },
      {
        versionNumber: "V1",
        label: "V1 (General)",
        isCurrent: false,
        platform: "GitHub Jobs",
        platformKey: "github",
        status: "disabled",
        updatedAt: "2023-10-18T11:45:00Z",
        summary: "Backend engineer for server side development.",
        structuredResponsibilities: ["Write backend code in Go.", "Maintain databases."],
        structuredQualifications: ["Computer Science degree and coding experience."]
      }
    ]
  },
  {
    id: "job-3",
    reqId: "REQ-2023-038",
    title: "VP of Marketing",
    department: "sales",
    departmentLabel: "Sales & Marketing",
    location: "New York, NY (Hybrid)",
    employmentType: "Full-Time",
    salaryRange: "$210,000 - $260,000 USD + Equity",
    skills: ["Growth Strategy", "Demand Generation", "Brand Positioning", "Team Leadership", "Budget Management"],
    rawSource: {
      source_id: "JD-REQ-2023-038",
      ingestion_timestamp: "2023-10-26T16:00:00Z",
      raw_text_payload: "Senior executive to lead our global marketing organization. Need someone who has scaled B2B SaaS from $10M to $50M ARR. Manage 15-person team across content, growth, product marketing and PR.",
      metadata: {
        department: "Sales & Marketing",
        hiring_manager: "David Sterling (CEO)",
        urgency: "Critical",
        format_detected: "executive_brief"
      },
      pre_processing_flags: ["contains_compensation_package", "executive_level"]
    },
    versions: [
      {
        versionNumber: "V4",
        label: "V4 (Exec Summary) - Current",
        isCurrent: true,
        platform: "Company Website",
        platformKey: "website",
        status: "enabled",
        updatedAt: "2023-10-27T09:30:00Z",
        summary: "Spearhead comprehensive go-to-market strategy, brand evolution, and multi-channel demand generation to accelerate high-velocity B2B SaaS growth.",
        structuredResponsibilities: [
          "Direct global marketing budget and lead a multi-disciplinary team spanning product marketing, content, and growth.",
          "Build scalable organic and paid acquisition funnels to surpass qualified pipeline conversion milestones.",
          "Refine enterprise messaging and brand positioning for tier-1 industry analysts and global press."
        ],
        structuredQualifications: [
          "8+ years in progressive marketing leadership roles with proven track record scaling B2B SaaS revenue.",
          "Analytical acumen in pipeline modeling, customer acquisition cost (CAC), and LTV optimization.",
          "Inspiring leadership presence with experience recruiting and mentoring top tier marketing talent."
        ],
        performanceInsight: "Direct company career site applications increased by 62% under V4 format."
      },
      {
        versionNumber: "V3",
        label: "V3 (Detailed)",
        isCurrent: false,
        platform: "Company Website",
        platformKey: "website",
        status: "disabled",
        updatedAt: "2023-10-22T13:00:00Z",
        summary: "Detailed leadership job post.",
        structuredResponsibilities: ["Manage marketing teams.", "Run ad campaigns."],
        structuredQualifications: ["Senior leadership experience."]
      }
    ]
  },
  {
    id: "job-4",
    reqId: "REQ-2023-045",
    title: "Customer Success Manager",
    department: "hr",
    departmentLabel: "Customer Experience",
    location: "London, UK / Remote",
    employmentType: "Full-Time",
    salaryRange: "£65,000 - £80,000 GBP",
    skills: ["Client Onboarding", "Churn Reduction", "Zendesk", "Account Expansion", "SaaS Training"],
    rawSource: {
      source_id: "JD-REQ-2023-045",
      ingestion_timestamp: "2023-10-27T06:45:00Z",
      raw_text_payload: "Customer success manager to manage portfolio of 40 mid-market enterprise accounts. Ensure quick onboarding, product adoption, proactive health checks, and drive renewal rates >95%.",
      metadata: {
        department: "Customer Success",
        hiring_manager: "Clara O'Connor",
        urgency: "Medium",
        format_detected: "raw_notes"
      },
      pre_processing_flags: ["contains_kpis", "requires_portfolio_definition"]
    },
    versions: [
      {
        versionNumber: "V1",
        label: "V1 (Draft) - Current",
        isCurrent: true,
        platform: "Indeed",
        platformKey: "indeed",
        status: "draft",
        updatedAt: "2023-10-27T07:30:00Z",
        summary: "Champion customer delight and product adoption for mid-market clients, safeguarding retention and identifying strategic expansion opportunities.",
        structuredResponsibilities: [
          "Guide new customers through seamless white-glove onboarding and workflow configuration.",
          "Monitor account health telemetry to preemptively mitigate churn risk.",
          "Lead quarterly business reviews (QBRs) and advocate for client feature requests with product teams."
        ],
        structuredQualifications: [
          "3+ years in customer success or technical account management within enterprise software.",
          "Exceptional empathy, consultative communication, and proactive problem-solving abilities.",
          "Experience using CRM platforms (Salesforce, HubSpot, Gainsight)."
        ]
      }
    ]
  },
  {
    id: "job-5",
    reqId: "REQ-2023-049",
    title: "Senior React Developer",
    department: "engineering",
    departmentLabel: "Engineering & Tech",
    location: "San Francisco, CA (Hybrid)",
    employmentType: "Full-Time",
    salaryRange: "$130,000 - $165,000 USD",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js", "State Management", "WCAG"],
    rawSource: {
      source_id: "JD-REQ-8942-2023",
      ingestion_timestamp: "2023-10-27T09:14:22Z",
      raw_text_payload: "We are looking for a Senior Frontend Developer to join our core product team. You will be responsible for building complex user interfaces using React and modern CSS frameworks. Candidates should have at least 5 years of experience in frontend development, a strong understanding of state management (Redux, Zustand), and experience with RESTful APIs. Must be proficient in TypeScript. Bonus points for experience with web accessibility standards (WCAG) and performance optimization techniques. Salary range is $130k-$165k depending on experience. This is a hybrid role based in our San Francisco office, requiring 2 days a week in-office.",
      metadata: {
        department: "Engineering",
        hiring_manager: "Sarah Jenkins",
        urgency: "High",
        format_detected: "plain_text_block"
      },
      pre_processing_flags: ["contains_salary_data", "requires_location_parsing"]
    },
    versions: [
      {
        versionNumber: "V3",
        label: "V3 (Optimized) - Current",
        isCurrent: true,
        platform: "LinkedIn",
        platformKey: "linkedin",
        status: "enabled",
        updatedAt: "2023-10-27T09:45:00Z",
        summary: "Build and scale mission-critical web applications with cutting-edge React architecture, TypeScript rigor, and responsive design execution.",
        structuredResponsibilities: [
          "Architect performant, accessible component hierarchies using React 19, TypeScript, and Tailwind CSS.",
          "Collaborate with UX designers and backend engineers to integrate RESTful and GraphQL APIs seamlessly.",
          "Enforce code quality, comprehensive unit/integration test coverage, and web performance budgets."
        ],
        structuredQualifications: [
          "5+ years of modern JavaScript/TypeScript and React ecosystem experience.",
          "Demonstrated mastery of complex state management paradigms and client-side caching.",
          "Deep familiarity with Web Content Accessibility Guidelines (WCAG) and Core Web Vitals optimization."
        ],
        skillsTaxonomy: [
          { category: "Frontend Core", skills: ["React 19", "TypeScript", "JavaScript (ESNext)", "Tailwind CSS"] },
          { category: "State & Data", skills: ["Zustand", "TanStack Query", "RESTful APIs", "GraphQL"] },
          { category: "Testing & Quality", skills: ["Jest", "Vitest", "Playwright", "WCAG 2.1"] }
        ],
        performanceInsight: "45% higher candidate response rate. Optimized keywords for recruiter search indexing."
      }
    ]
  }
];

export const TEMPLATE_PRESETS = [
  {
    title: "Senior Full Stack Engineer",
    department: "engineering",
    location: "Remote (US/Europe)",
    employmentType: "Full-Time",
    responsibilities: `- Design and develop resilient microservices and interactive web frontends
- Partner with product managers to deliver features from conceptualization to deployment
- Mentor junior engineers and conduct rigorous code reviews
- Optimize database queries and API response times`,
    qualifications: `- 5+ years of production fullstack development with Node/TypeScript & React
- Strong grasp of relational databases (PostgreSQL) and caching strategies (Redis)
- Experience with Docker, CI/CD pipelines, and cloud environments (GCP/AWS)
- Excellent verbal and written technical communication skills`,
    skills: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "GraphQL"]
  },
  {
    title: "Lead Product Manager (AI Platforms)",
    department: "product",
    location: "San Francisco, CA / Hybrid",
    employmentType: "Full-Time",
    responsibilities: `- Define product vision and roadmap for generative AI workflow tooling
- Conduct quantitative analysis and qualitative user interviews with enterprise HR leads
- Coordinate sprint planning and manage backlog priorities with engineering and design
- Track key product telemetry including adoption, retention, and CSAT`,
    qualifications: `- 4+ years of product management experience shipping B2B SaaS products
- Familiarity with LLM capabilities, prompting strategies, and enterprise AI compliance
- Proven analytical skills with SQL and product metrics frameworks
- High empathy and user-centric problem solving`,
    skills: ["Product Roadmap", "LLMs", "User Research", "Agile / Scrum", "SQL", "Product Analytics"]
  },
  {
    title: "Senior UI/UX Designer",
    department: "design",
    location: "Remote, London / UK",
    employmentType: "Full-Time",
    responsibilities: `- Create end-to-end design systems and interface specifications in Figma
- Facilitate user testing sprints and synthesize actionable design improvements
- Partner closely with frontend developers to ensure design system fidelity
- Establish accessible design tokens and responsive typography hierarchies`,
    qualifications: `- 5+ years designing enterprise SaaS applications
- Mastery of Figma variables, component libraries, and interactive prototyping
- Strong portfolio showcasing complex workflow simplification
- Deep understanding of WCAG accessibility standards`,
    skills: ["Figma", "Design Systems", "Prototyping", "User Testing", "WCAG", "Design Tokens"]
  }
];
