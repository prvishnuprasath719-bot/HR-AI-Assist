import React, { useState } from 'react';
import { JobPosting, TabType, VersionStatus } from '../types';

interface ArchitectureDiagramViewProps {
  jobs: JobPosting[];
  onNavigateTab: (tab: TabType) => void;
  onToggleStatus: (jobId: string, versionNumber: string, nextStatus: VersionStatus) => void;
  onSelectVersion: (jobId: string, versionNumber: string) => void;
  onViewJobDetail: (job: JobPosting) => void;
}

export const ArchitectureDiagramView: React.FC<ArchitectureDiagramViewProps> = ({
  jobs,
  onNavigateTab,
  onToggleStatus,
  onSelectVersion,
  onViewJobDetail,
}) => {
  const [activeStepHighlight, setActiveStepHighlight] = useState<number | null>(null);

  return (
    <div id="architecture-diagram-container" className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c1c7cf] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#003b5a] text-white font-bold text-[11px] rounded uppercase tracking-wider">
              System Architecture & Workflow
            </span>
            <span className="text-xs text-[#72787f]">Interactive Architecture Blueprint</span>
          </div>
          <h2 className="text-[26px] md:text-[32px] font-bold text-[#191c1e] tracking-tight">
            HR AI Assist Engine Blueprint
          </h2>
        </div>

        <button
          onClick={() => onNavigateTab('jobs')}
          className="px-4 py-2 bg-[#fed023] hover:bg-[#eec209] text-[#6f5900] text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          Launch Job Intake Flow
        </button>
      </div>

      {/* Main Architecture Diagram Container */}
      <div className="bg-white border-2 border-[#c1c7cf] rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Vertical Pipeline (Employer -> Job Posting -> AI Process -> Storing) */}
          <div className="lg:col-span-4 flex flex-col items-center space-y-4">
            {/* 1. Employer / Recruiter */}
            <div
              className={`w-full text-center py-2 px-4 rounded-xl border-2 transition-all cursor-pointer ${
                activeStepHighlight === 1
                  ? 'border-[#735c00] bg-[#fff9db] shadow-md scale-102'
                  : 'border-[#735c00]/40 bg-[#fdfbf7] hover:border-[#735c00]'
              }`}
              onClick={() => setActiveStepHighlight(1)}
            >
              <span className="text-[18px] font-bold text-[#735c00]">
                Employer / Recruiter
              </span>
            </div>

            {/* Downward Arrow */}
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-6 bg-[#003b5a]"></div>
              <span className="material-symbols-outlined text-[#003b5a] -mt-2 text-[28px]">
                arrow_drop_down
              </span>
            </div>

            {/* 2. Job Posting (Listing the Resource Requirements) */}
            <div
              className={`w-full bg-[#fef08a] border-2 border-[#eab308] rounded-xl p-4 transition-all cursor-pointer ${
                activeStepHighlight === 2
                  ? 'ring-4 ring-[#eab308]/40 shadow-lg scale-102'
                  : 'hover:shadow-md'
              }`}
              onClick={() => {
                setActiveStepHighlight(2);
                onNavigateTab('jobs');
              }}
            >
              <h3 className="text-center font-bold text-[16px] text-[#713f12] mb-1">
                Job Posting
              </h3>
              <p className="text-center text-xs text-[#854d0e] mb-3">
                (Listing the Resource Requirements)
              </p>

              {/* Inner Job Description Box */}
              <div className="bg-[#38bdf8] border border-[#0284c7] rounded-lg p-3 text-white shadow-xs">
                <h4 className="text-center font-bold text-[14px] text-[#082f49] mb-2">
                  Job Description
                </h4>
                <ul className="text-xs text-[#082f49] space-y-1 font-medium pl-2">
                  <li className="flex items-center gap-1.5">
                    <span>➤</span> Roles
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>➤</span> Responsibilities
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>➤</span> Skill
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>➤</span> Qualification
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span>➤</span> Experience & Etc.,
                  </li>
                </ul>
              </div>
            </div>

            {/* Downward Arrow */}
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-6 bg-[#003b5a]"></div>
              <span className="material-symbols-outlined text-[#003b5a] -mt-2 text-[28px]">
                arrow_drop_down
              </span>
            </div>

            {/* 3. AI Process (Structuring the Raw Data) */}
            <div
              className={`w-full bg-[#701a75] text-white rounded-xl p-4 text-center transition-all cursor-pointer shadow-sm ${
                activeStepHighlight === 3
                  ? 'ring-4 ring-purple-400 shadow-xl scale-102'
                  : 'hover:brightness-110'
              }`}
              onClick={() => {
                setActiveStepHighlight(3);
                onNavigateTab('process');
              }}
            >
              <h3 className="font-bold text-[16px] text-white">AI Process</h3>
              <p className="text-xs text-purple-200 mt-0.5">
                (Structuring the Raw Data)
              </p>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] bg-purple-900/60 px-2 py-0.5 rounded-full text-purple-100">
                <span className="material-symbols-outlined text-[13px] text-[#fed023]">
                  auto_awesome
                </span>
                Gemini 3.7 Flash Model
              </div>
            </div>

            {/* Downward Arrow */}
            <div className="flex flex-col items-center">
              <div className="w-1.5 h-6 bg-[#003b5a]"></div>
              <span className="material-symbols-outlined text-[#003b5a] -mt-2 text-[28px]">
                arrow_drop_down
              </span>
            </div>

            {/* 4. Storing With Versioning */}
            <div
              className={`w-full bg-[#0e7490] text-white rounded-xl p-4 text-center transition-all cursor-pointer shadow-sm ${
                activeStepHighlight === 4
                  ? 'ring-4 ring-cyan-300 shadow-xl scale-102'
                  : 'hover:brightness-110'
              }`}
              onClick={() => {
                setActiveStepHighlight(4);
                onNavigateTab('versions');
              }}
            >
              <h3 className="font-bold text-[14px] leading-snug">
                Storing With Versioning of the Structured Data
              </h3>
            </div>
          </div>

          {/* Right Column: Cyan System Container & Live Table */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Pink Banner */}
            <div className="bg-[#e879f9] text-[#4a044e] font-bold text-sm md:text-base py-2.5 px-5 rounded-t-xl shadow-xs">
              Storing with Versioning of the Structured Data
            </div>

            {/* Cyan Container Body */}
            <div className="bg-[#0284c7] p-5 md:p-6 rounded-b-xl space-y-6 shadow-md">
              {/* Top Row: Purpose Card + Unstructured Database Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Purpose Card */}
                <div className="md:col-span-8 bg-[#cbd5e1] rounded-xl overflow-hidden shadow-xs border border-white/20">
                  <div className="bg-[#0369a1] text-white font-bold text-sm py-2 px-4">
                    Purpose
                  </div>
                  <div className="p-4 space-y-2.5 text-xs md:text-sm text-[#0f172a] font-medium leading-relaxed">
                    <p className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Role / Platform based Versioning</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>
                        Options for Enabling and Disabling the versions that acts
                        as control
                      </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>
                        Version control includes modifications and auto upgradation
                        of the liveliness
                      </span>
                    </p>
                  </div>
                </div>

                {/* Unstructured Database (JSON) Box */}
                <div
                  onClick={() => onNavigateTab('unstructured')}
                  className="md:col-span-4 bg-[#0f172a] text-white p-5 rounded-xl border border-white/20 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1e293b] transition-colors shadow-xs group"
                >
                  <span className="material-symbols-outlined text-cyan-400 text-[32px] mb-2 group-hover:scale-110 transition-transform">
                    data_object
                  </span>
                  <h4 className="font-bold text-sm md:text-base text-cyan-200">
                    Unstructured Database
                  </h4>
                  <span className="text-xs text-gray-400 font-mono mt-1">
                    (JSON Payload)
                  </span>
                  <span className="mt-3 text-[11px] text-cyan-300 underline font-semibold">
                    Inspect Raw Data →
                  </span>
                </div>
              </div>

              {/* Interactive Storing With Versioning Table */}
              <div className="bg-[#cbd5e1] rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#0369a1] text-white">
                        <th className="py-2.5 px-3 font-bold">Role</th>
                        <th className="py-2.5 px-3 font-bold">Platform</th>
                        <th className="py-2.5 px-3 font-bold">Version Selection</th>
                        <th className="py-2.5 px-3 font-bold text-center">
                          View Data of Different Versions
                        </th>
                        <th className="py-2.5 px-3 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40 bg-white/70">
                      {jobs.slice(0, 4).map((job) => {
                        const currentVer =
                          job.versions.find((v) => v.isCurrent) ||
                          job.versions[0];
                        const isEnabled = currentVer?.status === 'enabled';

                        return (
                          <tr key={job.id} className="hover:bg-white transition-colors">
                            {/* Role */}
                            <td className="py-2.5 px-3 font-semibold text-[#0f172a]">
                              {job.title}
                            </td>

                            {/* Platform */}
                            <td className="py-2.5 px-3 font-medium text-[#1e293b]">
                              {currentVer?.platform || 'LinkedIn'}
                            </td>

                            {/* Version Selection */}
                            <td className="py-2.5 px-3">
                              <select
                                value={currentVer?.versionNumber || 'V1'}
                                onChange={(e) =>
                                  onSelectVersion(job.id, e.target.value)
                                }
                                className="bg-white border border-[#94a3b8] rounded px-2 py-1 text-xs text-[#0f172a] shadow-2xs outline-none cursor-pointer"
                              >
                                {job.versions.map((v) => (
                                  <option key={v.versionNumber} value={v.versionNumber}>
                                    {v.label}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* View Data */}
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => onViewJobDetail(job)}
                                className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-bold rounded shadow-2xs transition-colors cursor-pointer"
                              >
                                View Data
                              </button>
                            </td>

                            {/* Status (Enable / Disable Button Pair matching Image 1) */}
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex flex-col gap-1 items-center justify-center">
                                <button
                                  onClick={() =>
                                    onToggleStatus(
                                      job.id,
                                      currentVer?.versionNumber || 'V1',
                                      'enabled'
                                    )
                                  }
                                  className={`w-16 py-0.5 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                                    isEnabled
                                      ? 'bg-[#22c55e] text-white shadow-xs scale-105'
                                      : 'bg-[#86efac] text-[#14532d] hover:bg-[#4ade80]'
                                  }`}
                                >
                                  Enable
                                </button>
                                <button
                                  onClick={() =>
                                    onToggleStatus(
                                      job.id,
                                      currentVer?.versionNumber || 'V1',
                                      'disabled'
                                    )
                                  }
                                  className={`w-16 py-0.5 text-[10px] font-bold uppercase rounded transition-all cursor-pointer ${
                                    !isEnabled
                                      ? 'bg-[#ef4444] text-white shadow-xs scale-105'
                                      : 'bg-[#fca5a5] text-[#7f1d1d] hover:bg-[#f87171]'
                                  }`}
                                >
                                  Disable
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
