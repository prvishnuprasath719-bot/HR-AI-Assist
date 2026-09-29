import React, { useState } from 'react';
import { JobPosting, VersionStatus } from '../types';

interface StructuredJobModalProps {
  job: JobPosting | null;
  initialVersionNumber?: string;
  onClose: () => void;
  onToggleStatus: (jobId: string, versionNumber: string, nextStatus: VersionStatus) => void;
  onViewRawJSON: (job: JobPosting) => void;
}

export const StructuredJobModal: React.FC<StructuredJobModalProps> = ({
  job,
  initialVersionNumber,
  onClose,
  onToggleStatus,
  onViewRawJSON,
}) => {
  if (!job) return null;

  const [selectedVerNumber, setSelectedVerNumber] = useState<string>(
    initialVersionNumber || job.versions[0]?.versionNumber || 'V1'
  );
  const [copiedMd, setCopiedMd] = useState(false);

  const activeVersion =
    job.versions.find((v) => v.versionNumber === selectedVerNumber) ||
    job.versions[0];

  const handleCopyMarkdown = () => {
    if (!activeVersion) return;
    const md = `# ${job.title} (${activeVersion.platform})
**Role ID:** ${job.reqId} | **Location:** ${job.location} | **Type:** ${job.employmentType}
**Salary Range:** ${job.salaryRange || 'Competitive'}

## Role Summary
${activeVersion.summary}

## Key Responsibilities
${activeVersion.structuredResponsibilities.map((r) => `- ${r}`).join('\n')}

## Qualifications & Skills
${activeVersion.structuredQualifications.map((q) => `- ${q}`).join('\n')}

## Required Skills
${job.skills.join(', ')}
`;
    navigator.clipboard.writeText(md);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2500);
  };

  return (
    <div
      id="structured-job-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="structured-job-modal-content"
        className="bg-white border border-[#c1c7cf] rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#003b5a] text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-[#cbe6ff] text-[#001e30] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                {job.reqId}
              </span>
              <span className="text-[#9bccf6] text-xs">
                {job.departmentLabel} • {job.location}
              </span>
            </div>
            <h2 className="text-[22px] md:text-[26px] font-bold leading-tight">
              {job.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        {/* Version Selector Bar */}
        <div className="bg-[#eceef0] border-b border-[#c1c7cf] px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#41474e]">
              Versions Available:
            </span>
            <div className="flex gap-1.5">
              {job.versions.map((ver) => (
                <button
                  key={ver.versionNumber}
                  onClick={() => setSelectedVerNumber(ver.versionNumber)}
                  className={`text-xs px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    ver.versionNumber === selectedVerNumber
                      ? 'bg-[#003b5a] text-white shadow-xs'
                      : 'bg-white text-[#41474e] hover:bg-[#e0e3e5] border border-[#c1c7cf]'
                  }`}
                >
                  {ver.versionNumber} ({ver.platform})
                </button>
              ))}
            </div>
          </div>

          {/* Status Badge Toggle */}
          {activeVersion && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#41474e]">Status:</span>
              <button
                onClick={() =>
                  onToggleStatus(
                    job.id,
                    activeVersion.versionNumber,
                    activeVersion.status === 'enabled' ? 'disabled' : 'enabled'
                  )
                }
                className={`text-xs px-3 py-1 rounded-full font-bold uppercase cursor-pointer transition-colors ${
                  activeVersion.status === 'enabled'
                    ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                    : activeVersion.status === 'disabled'
                    ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20'
                    : 'bg-[#e0e3e5] text-[#41474e]'
                }`}
              >
                {activeVersion.status}
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Executive Summary */}
          {activeVersion?.summary && (
            <div className="bg-[#f7f9fb] border-l-4 border-[#003b5a] p-4 rounded-r-xl border border-[#c1c7cf]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#003b5a] mb-1">
                Executive Purpose & Mission
              </h4>
              <p className="text-sm text-[#191c1e] leading-relaxed">
                {activeVersion.summary}
              </p>
            </div>
          )}

          {/* Key Responsibilities */}
          {activeVersion?.structuredResponsibilities && (
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#003b5a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#fed023] fill">
                  task_alt
                </span>
                Core Responsibilities
              </h4>
              <ul className="space-y-2">
                {activeVersion.structuredResponsibilities.map((resp, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#191c1e]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#003b5a] mt-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Qualifications */}
          {activeVersion?.structuredQualifications && (
            <div className="space-y-2.5">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#003b5a] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#fed023] fill">
                  verified
                </span>
                Required Qualifications & Experience
              </h4>
              <ul className="space-y-2">
                {activeVersion.structuredQualifications.map((qual, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-[#191c1e]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#735c00] mt-2 flex-shrink-0"></span>
                    <span className="leading-relaxed">{qual}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills Taxonomy */}
          {activeVersion?.skillsTaxonomy && activeVersion.skillsTaxonomy.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#003b5a]">
                Structured Skills Taxonomy
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeVersion.skillsTaxonomy.map((grp) => (
                  <div
                    key={grp.category}
                    className="p-3 bg-[#f2f4f6] rounded-xl border border-[#c1c7cf]"
                  >
                    <span className="text-xs font-bold text-[#003b5a] block mb-2">
                      {grp.category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {grp.skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-white text-[#191c1e] text-[11px] font-medium rounded-md border border-[#c1c7cf]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#003b5a]">
                Required Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((s) => (
                  <span
                    key={s}
                    className="px-3 py-1 bg-[#eceef0] text-[#191c1e] text-xs font-medium rounded-full border border-[#c1c7cf]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Platform Performance Insight */}
          {activeVersion?.performanceInsight && (
            <div className="bg-[#e6f4ea] border border-[#ceead6] p-3.5 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-[#137333] text-[22px]">
                trending_up
              </span>
              <p className="text-xs text-[#137333] font-medium">
                {activeVersion.performanceInsight}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#f2f4f6] border-t border-[#c1c7cf] p-4 px-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onViewRawJSON(job);
            }}
            className="text-xs text-[#003b5a] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              data_object
            </span>
            View Unstructured Source JSON
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyMarkdown}
              className="px-4 py-2 bg-white border border-[#c1c7cf] hover:bg-[#eceef0] text-[#191c1e] text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedMd ? 'check' : 'content_copy'}
              </span>
              {copiedMd ? 'Copied Markdown' : 'Copy Description'}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#003b5a] hover:bg-[#00273c] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
