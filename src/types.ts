export type UserRole = "recruiter" | "seeker";

export type TabType =
  | "jobs"
  | "process"
  | "versions"
  | "unstructured"
  | "architecture"
  | "applicants"
  | "drive-sync";

export type PlatformType =
  | "LinkedIn"
  | "GitHub Jobs"
  | "Company Website"
  | "Indeed"
  | "Glassdoor";

export type VersionStatus = "enabled" | "disabled" | "draft";

export interface RawSourceData {
  source_id: string;
  ingestion_timestamp: string;
  raw_text_payload: string;

  metadata: {
    department: string;
    hiring_manager: string;
    urgency: string;
    format_detected: string;
  };

  pre_processing_flags: string[];
}

export interface SkillsTaxonomyGroup {
  category: string;
  skills: string[];
}

export interface JobVersion {
  versionNumber: string;
  label: string;
  isCurrent: boolean;
  platform: PlatformType | string;
  platformKey: string;
  status: VersionStatus;
  updatedAt: string;
  summary: string;
  structuredResponsibilities: string[];
  structuredQualifications: string[];
  skillsTaxonomy?: SkillsTaxonomyGroup[];
  performanceInsight?: string;
}

export interface JobPosting {
  id: string;
  reqId: string;
  title: string;
  department: string;
  departmentLabel: string;
  location: string;
  employmentType: string;
  salaryRange?: string;
  skills: string[];
  rawSource: RawSourceData;
  versions: JobVersion[];
}

export interface StructuredAIOutput {
  executiveSummary: string;
  structuredResponsibilities: string[];
  structuredQualifications: string[];
  skillsTaxonomy: SkillsTaxonomyGroup[];
  suggestedSalary: string;
  platformOptimizationNote: string;
}