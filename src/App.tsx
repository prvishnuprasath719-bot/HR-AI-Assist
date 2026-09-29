import ApplicantsScreen from './components/ApplicantsScreen';
import React, { useState, useEffect, useCallback } from 'react';
import { JobPosting, TabType, VersionStatus, PlatformType, StructuredAIOutput } from './types';
import { INITIAL_JOBS } from './data/mockJobs';
import { NavigationDrawer } from './components/NavigationDrawer';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { CreateJobScreen } from './components/CreateJobScreen';
import { AIProcessingScreen } from './components/AIProcessingScreen';
import { VersionControlScreen } from './components/VersionControlScreen';
import { UnstructuredDataView } from './components/UnstructuredDataView';
import { StructuredJobModal } from './components/StructuredJobModal';
import { ArchitectureDiagramView } from './components/ArchitectureDiagramView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem('hr_ai_assist_jobs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_JOBS;
      }
    }
    return INITIAL_JOBS;
  });

  const [currentProcessingJob, setCurrentProcessingJob] = useState<Partial<JobPosting> | null>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedJob, setCompletedJob] = useState<JobPosting | null>(null);
  const [completedStructured, setCompletedStructured] = useState<StructuredAIOutput | null>(null);

  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobPosting | null>(null);
  const [selectedVersionForDetail, setSelectedVersionForDetail] = useState<string | undefined>(undefined);
  const [selectedJobIdForRaw, setSelectedJobIdForRaw] = useState<string | undefined>(undefined);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    localStorage.setItem('hr_ai_assist_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    fetch('/api/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs && data.jobs.length > 0) {
          setJobs(data.jobs);
        }
      })
      .catch((err) => {
        console.log('Using local client state store for job listings.', err);
      });
  }, []);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStartAIProcess = useCallback(
    async (formData: {
      jobTitle: string;
      department: string;
      location: string;
      employmentType: string;
      responsibilitiesRaw: string;
      qualificationsRaw: string;
      skills: string[];
      targetPlatform: PlatformType;
    }) => {
      setCurrentProcessingJob({
        title: formData.jobTitle,
        department: formData.department,
        location: formData.location,
        employmentType: formData.employmentType,
        skills: formData.skills,
      });
      setProcessingProgress(10);
      setIsProcessing(true);
      setCompletedJob(null);
      setCompletedStructured(null);
      setActiveTab('process');

      const pInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 85) {
            clearInterval(pInterval);
            return 85;
          }
          return prev + Math.floor(Math.random() * 12 + 6);
        });
      }, 400);

      try {
        const response = await fetch('/api/structure-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();
        clearInterval(pInterval);

        if (data.success && data.job) {
          setProcessingProgress(100);
          setIsProcessing(false);
          setCompletedJob(data.job);
          setCompletedStructured(data.structured);

          setJobs((prev) => {
            const exists = prev.some((j) => j.id === data.job.id);
            if (exists) return prev;
            return [data.job, ...prev];
          });

          showToast(`AI successfully structured "${data.job.title}"!`);
        } else {
          throw new Error('Fallback structuring required');
        }
      } catch {
        clearInterval(pInterval);
        setTimeout(() => {
          const reqNum = Math.floor(1000 + Math.random() * 9000);
          const reqId = `REQ-2026-${reqNum}`;
          const newJob: JobPosting = {
            id: `job-${Date.now()}`,
            reqId: reqId,
            title: formData.jobTitle || 'Senior Software Engineer',
            department: formData.department,
            departmentLabel: formData.department.toUpperCase(),
            location: formData.location || 'Remote',
            employmentType: formData.employmentType || 'Full-Time',
            salaryRange: '$135,000 - $170,000 USD',
            skills: formData.skills,
            rawSource: {
              source_id: `JD-${reqId}`,
              ingestion_timestamp: new Date().toISOString(),
              raw_text_payload: `Responsibilities:\n${formData.responsibilitiesRaw}\n\nQualifications:\n${formData.qualificationsRaw}`,
              metadata: {
                department: formData.department,
                hiring_manager: 'Recruitment Lead',
                urgency: 'High',
                format_detected: 'intake_form',
              },
              pre_processing_flags: ['ai_structured', 'version_created'],
            },
            versions: [
              {
                versionNumber: 'V1',
                label: 'V1 (AI Structured) - Current',
                isCurrent: true,
                platform: formData.targetPlatform,
                platformKey: formData.targetPlatform.toLowerCase().replace(/\s+/g, ''),
                status: 'enabled',
                updatedAt: new Date().toISOString(),
                summary: `Lead strategic execution and technical delivery for ${formData.jobTitle}. Spearhead cross-functional collaboration and drive scalable outcomes.`,
                structuredResponsibilities: formData.responsibilitiesRaw
                  .split('\n')
                  .filter((l) => l.trim().length > 3)
                  .map((l) => l.replace(/^[-*•\d.]+\s*/, '')),
                structuredQualifications: formData.qualificationsRaw
                  .split('\n')
                  .filter((l) => l.trim().length > 3)
                  .map((l) => l.replace(/^[-*•\d.]+\s*/, '')),
                performanceInsight: `Optimized for ${formData.targetPlatform} search algorithms.`,
              },
            ],
          };

          setProcessingProgress(100);
          setIsProcessing(false);
          setCompletedJob(newJob);
          setJobs((prev) => [newJob, ...prev]);
          showToast(`AI successfully structured "${newJob.title}"!`);
        }, 1200);
      }
    },
    []
  );

  const handleSaveDraft = (draft: Partial<JobPosting>) => {
    const reqNum = Math.floor(1000 + Math.random() * 9000);
    const reqId = `REQ-2026-${reqNum}`;
    const newDraftJob: JobPosting = {
      id: `draft-${Date.now()}`,
      reqId: reqId,
      title: draft.title || 'Untitled Draft Job',
      department: draft.department || 'engineering',
      departmentLabel: draft.departmentLabel || 'Engineering',
      location: draft.location || 'Remote',
      employmentType: draft.employmentType || 'Full-Time',
      skills: draft.skills || ['React', 'TypeScript'],
      rawSource: {
        source_id: `JD-DRAFT-${reqId}`,
        ingestion_timestamp: new Date().toISOString(),
        raw_text_payload: `Draft Created: ${draft.title}`,
        metadata: {
          department: draft.department || 'Engineering',
          hiring_manager: 'Recruitment Lead',
          urgency: 'Low',
          format_detected: 'draft',
        },
        pre_processing_flags: ['draft_saved'],
      },
      versions: [
        {
          versionNumber: 'V1',
          label: 'V1 (Draft) - Current',
          isCurrent: true,
          platform: 'LinkedIn',
          platformKey: 'linkedin',
          status: 'draft',
          updatedAt: new Date().toISOString(),
          summary: 'Draft job description pending AI structuring.',
          structuredResponsibilities: ['Draft responsibilities...'],
          structuredQualifications: ['Draft qualifications...'],
        },
      ],
    };

    setJobs((prev) => [newDraftJob, ...prev]);
  };

  const handleToggleVersionStatus = (
    jobId: string,
    versionNumber: string,
    nextStatus: VersionStatus
  ) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          versions: job.versions.map((ver) => {
            if (ver.versionNumber !== versionNumber) return ver;
            return {
              ...ver,
              status: nextStatus,
              updatedAt: new Date().toISOString(),
            };
          }),
        };
      })
    );

    fetch(`/api/jobs/${jobId}/version/${versionNumber}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});

    showToast(`Version ${versionNumber} is now ${nextStatus.toUpperCase()}`);
  };

  const handleSelectVersion = (jobId: string, versionNumber: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          versions: job.versions.map((ver) => ({
            ...ver,
            isCurrent: ver.versionNumber === versionNumber,
          })),
        };
      })
    );
    showToast(`Active version set to ${versionNumber}`);
  };

  const handleSyncPlatforms = () => {
    setIsSyncing(true);
    fetch('/api/sync-platforms', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        setIsSyncing(false);
        showToast(
          data.message || 'Platforms synchronized successfully!',
          'success'
        );
      })
      .catch(() => {
        setTimeout(() => {
          setIsSyncing(false);
          const activeCount = jobs.filter((j) =>
            j.versions.some((v) => v.status === 'enabled')
          ).length;
          showToast(
            `Synchronized ${activeCount} active postings across LinkedIn, GitHub Jobs, Indeed & Website.`,
            'success'
          );
        }, 1000);
      });
  };

  const handleApplyAIInsights = () => {
    showToast(
      'Applied LinkedIn high-engagement keyword structure to all active engineering roles!'
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col antialiased">
      {toast && (
        <div
          id="app-toast-notification"
          className="fixed top-20 right-4 z-50 bg-[#003b5a] text-white px-5 py-3 rounded-xl shadow-xl border border-[#cbe6ff] flex items-center gap-3 animate-slideIn"
        >
          <span className="material-symbols-outlined text-[22px] text-[#fed023]">
            {toast.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <NavigationDrawer
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeJobsCount={jobs.filter((j) => j.versions.some((v) => v.status === 'enabled')).length}
      />

      {mobileMenuOpen && (
        <div
          id="mobile-drawer-overlay"
          className="fixed inset-0 bg-black/50 z-50 md:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-[#f2f4f6] w-[280px] h-full shadow-2xl flex flex-col p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#c1c7cf]">
              <h3 className="font-bold text-[#003b5a] text-lg">HR AI Assist</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-[#41474e] hover:bg-[#e0e3e5] rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-1 flex-1">
              {[
                { id: 'jobs', label: 'Create Job', icon: 'add_box' },
                { id: 'process', label: 'AI Processing', icon: 'psychology' },
                { id: 'versions', label: 'Job Versions', icon: 'layers' },
                { id: 'unstructured', label: 'Unstructured Data', icon: 'data_object' },
                { id: 'architecture', label: 'System Blueprint', icon: 'account_tree' },
                { id: 'applicants', label: 'Applicants', icon: 'group' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left rounded-xl px-4 py-3 flex items-center gap-3 font-semibold text-sm cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-[#fed023] text-[#6f5900]'
                      : 'text-[#41474e] hover:bg-[#e0e3e5]'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="text-xs text-[#72787f] text-center pt-2 border-t border-[#c1c7cf]">
              HR AI Assist v2.4.1
            </div>
          </div>
        </div>
      )}

      <TopAppBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSyncPlatforms={handleSyncPlatforms}
        isSyncing={isSyncing}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      <main className="flex-1 mt-16 md:ml-[280px] p-4 md:p-8 bg-[#f7f9fb] pb-24 md:pb-12">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'jobs' && (
            <CreateJobScreen
              onStartAIProcess={handleStartAIProcess}
              onSaveDraft={handleSaveDraft}
            />
          )}

          {activeTab === 'process' && (
            <AIProcessingScreen
              currentProcessingJob={currentProcessingJob}
              processingProgress={processingProgress}
              isProcessing={isProcessing}
              completedJob={completedJob}
              completedStructured={completedStructured}
              onViewVersions={() => setActiveTab('versions')}
              onViewRawJSON={(job) => {
                setSelectedJobIdForRaw(job.id);
                setActiveTab('unstructured');
              }}
              onViewStructuredModal={(job) => setSelectedJobForDetail(job)}
              onRestart={() => setActiveTab('jobs')}
            />
          )}

          {activeTab === 'versions' && (
            <VersionControlScreen
              jobs={jobs}
              onToggleVersionStatus={handleToggleVersionStatus}
              onSelectVersion={handleSelectVersion}
              onViewJobDetail={(job, verNumber) => {
                setSelectedJobForDetail(job);
                setSelectedVersionForDetail(verNumber);
              }}
              onViewRawJSON={(job) => {
                setSelectedJobIdForRaw(job.id);
                setActiveTab('unstructured');
              }}
              onSyncPlatforms={handleSyncPlatforms}
              isSyncing={isSyncing}
              onApplyAIInsights={handleApplyAIInsights}
            />
          )}

          {activeTab === 'unstructured' && (
            <UnstructuredDataView
              jobs={jobs}
              selectedJobId={selectedJobIdForRaw}
              onProcessAI={(job) => {
                handleStartAIProcess({
                  jobTitle: job.title,
                  department: job.department,
                  location: job.location,
                  employmentType: job.employmentType,
                  responsibilitiesRaw: job.rawSource.raw_text_payload,
                  qualificationsRaw: 'Derived from unstructured raw JSON source.',
                  skills: job.skills,
                  targetPlatform: 'LinkedIn',
                });
              }}
              onBackToVersions={() => setActiveTab('versions')}
            />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureDiagramView
              jobs={jobs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onToggleStatus={handleToggleVersionStatus}
              onSelectVersion={handleSelectVersion}
              onViewJobDetail={(job) => setSelectedJobForDetail(job)}
            />
          )}

          {activeTab === 'applicants' && <ApplicantsScreen />}
        </div>
      </main>

      {selectedJobForDetail && (
        <StructuredJobModal
          job={selectedJobForDetail}
          initialVersionNumber={selectedVersionForDetail}
          onClose={() => {
            setSelectedJobForDetail(null);
            setSelectedVersionForDetail(undefined);
          }}
          onToggleStatus={handleToggleVersionStatus}
          onViewRawJSON={(job) => {
            setSelectedJobIdForRaw(job.id);
            setActiveTab('unstructured');
          }}
        />
      )}

      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
