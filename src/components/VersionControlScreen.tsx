import React, { useState } from 'react';
import { JobPosting, PlatformType, VersionStatus } from '../types';

interface VersionControlScreenProps {
  jobs: JobPosting[];
  onToggleVersionStatus: (jobId: string, versionNumber: string, nextStatus: VersionStatus) => void;
  onSelectVersion: (jobId: string, versionNumber: string) => void;
  onViewJobDetail: (job: JobPosting, versionNumber?: string) => void;
  onViewRawJSON: (job: JobPosting) => void;
  onSyncPlatforms: () => void;
  isSyncing: boolean;
  onApplyAIInsights: () => void;
}

export const VersionControlScreen: React.FC<VersionControlScreenProps> = ({
  jobs,
  onToggleVersionStatus,
  onSelectVersion,
  onViewJobDetail,
  onViewRawJSON,
  onSyncPlatforms,
  isSyncing,
  onApplyAIInsights,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const currentVersion = job.versions.find((v) => v.isCurrent) || job.versions[0];
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.reqId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (currentVersion && currentVersion.platform.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPlatform =
      selectedPlatformFilter === 'all' ||
      (currentVersion && currentVersion.platformKey === selectedPlatformFilter);

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (currentVersion && currentVersion.status === selectedStatusFilter);

    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / itemsPerPage));
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalActiveJobsCount = jobs.reduce((acc, job) => {
    return acc + job.versions.filter((v) => v.status === 'enabled').length;
  }, 0);

  const totalVersionsCount = jobs.reduce((acc, job) => acc + job.versions.length, 0);

  const getPlatformBadge = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#0077B5] rounded flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              in
            </div>
            <span className="text-[14px] text-[#41474e] font-medium">LinkedIn</span>
          </div>
        );
      case 'github jobs':
      case 'github':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#181717] rounded flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              GH
            </div>
            <span className="text-[14px] text-[#41474e] font-medium">GitHub Jobs</span>
          </div>
        );
      case 'company website':
      case 'website':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#e0e3e5] rounded flex items-center justify-center text-[#191c1e] text-xs font-bold border border-[#c1c7cf]">
              CW
            </div>
            <span className="text-[14px] text-[#41474e] font-medium">Company Website</span>
          </div>
        );
      case 'indeed':
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#00A4EF] rounded flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              In
            </div>
            <span className="text-[14px] text-[#41474e] font-medium">Indeed</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#283847] rounded flex items-center justify-center text-white text-xs font-bold">
              {platform.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[14px] text-[#41474e] font-medium">{platform}</span>
          </div>
        );
    }
  };

  const getStatusBadge = (status: VersionStatus, jobId: string, versionNumber: string) => {
    if (status === 'enabled') {
      return (
        <button
          onClick={() => onToggleVersionStatus(jobId, versionNumber, 'disabled')}
          className="inline-flex items-center gap-2 bg-[#e6f4ea] hover:bg-[#d4edd9] text-[#137333] px-3 py-1 rounded-full border border-[#ceead6] transition-colors cursor-pointer"
          title="Click to toggle status (Disable)"
        >
          <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Enabled
          </span>
        </button>
      );
    }
    if (status === 'disabled') {
      return (
        <button
          onClick={() => onToggleVersionStatus(jobId, versionNumber, 'enabled')}
          className="inline-flex items-center gap-2 bg-[#ffdad6] hover:bg-[#ffc8c2] text-[#93000a] px-3 py-1 rounded-full border border-[#ba1a1a]/20 transition-colors cursor-pointer"
          title="Click to toggle status (Enable)"
        >
          <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Disabled
          </span>
        </button>
      );
    }
    return (
      <button
        onClick={() => onToggleVersionStatus(jobId, versionNumber, 'enabled')}
        className="inline-flex items-center gap-2 bg-[#e0e3e5] hover:bg-[#d8dadc] text-[#41474e] px-3 py-1 rounded-full border border-[#c1c7cf] transition-colors cursor-pointer"
        title="Click to publish version"
      >
        <span className="w-2 h-2 rounded-full bg-[#72787f]"></span>
        <span className="text-[11px] font-bold uppercase tracking-wider">
          Draft
        </span>
      </button>
    );
  };

  return (
    <div id="version-control-container" className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[28px] md:text-[34px] font-bold text-[#003b5a] tracking-tight">
            Version Control
          </h2>
          <p className="text-[15px] text-[#41474e] max-w-2xl leading-relaxed mt-1">
            Manage and deploy structured job postings across different platforms.
            Ensure the correct version is active for your target audience.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Filter Dropdown */}
          <div className="relative">
            <select
              id="platform-filter-select"
              value={selectedPlatformFilter}
              onChange={(e) => {
                setSelectedPlatformFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="flex items-center gap-2 bg-[#f2f4f6] border border-[#c1c7cf] text-[#41474e] px-3 py-2 rounded-lg text-[13px] font-semibold hover:bg-[#e0e3e5] transition-colors cursor-pointer outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="linkedin">LinkedIn</option>
              <option value="github">GitHub Jobs</option>
              <option value="website">Company Website</option>
              <option value="indeed">Indeed</option>
            </select>
          </div>

          <button
            id="sync-platforms-button"
            onClick={onSyncPlatforms}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-[#fed023] text-[#6f5900] px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#eec209] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isSyncing ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            {isSyncing ? 'Syncing...' : 'Sync Platforms'}
          </button>
        </div>
      </div>

      {/* Bento Grid Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Stat Card 1 */}
        <div className="bg-white border border-[#c1c7cf] rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#cbe6ff] rounded-lg text-[#001e30]">
              <span className="material-symbols-outlined text-[24px]">work</span>
            </div>
            <span className="text-[11px] font-bold text-[#003b5a] bg-[#9bccf6] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Active
            </span>
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-[#72787f]">
              Total Active Jobs
            </h3>
            <p className="text-[32px] font-bold text-[#003b5a] mt-1 leading-tight">
              {totalActiveJobsCount}
            </p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white border border-[#c1c7cf] rounded-xl p-6 shadow-xs flex flex-col justify-between border-l-4 border-l-[#fed023]">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-[#ffe084] rounded-lg text-[#231b00]">
              <span className="material-symbols-outlined text-[24px]">
                published_with_changes
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#6f5900] bg-[#e0e3e5] px-2.5 py-1 rounded-full uppercase tracking-wider">
              Last 24h
            </span>
          </div>
          <div>
            <h3 className="text-[13px] font-medium text-[#72787f]">
              Recent Versions
            </h3>
            <p className="text-[32px] font-bold text-[#003b5a] mt-1 leading-tight">
              {totalVersionsCount}
            </p>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-[#003b5a] border border-[#c1c7cf] rounded-xl p-6 shadow-xs flex flex-col text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[130px]">
              auto_awesome
            </span>
          </div>
          <h3 className="text-[18px] font-bold mb-2 flex items-center gap-2 relative z-10 text-white">
            <span className="material-symbols-outlined text-[20px] text-[#fed023]">
              psychology
            </span>
            AI Optimization
          </h3>
          <p className="text-[13px] text-[#cbe6ff] mb-4 relative z-10 flex-1 leading-relaxed">
            The 'Senior React Developer' V3 posting on LinkedIn is outperforming
            V2 by 45% in candidate engagement. Consider applying this structure
            to similar roles.
          </p>
          <button
            id="apply-insights-button"
            onClick={onApplyAIInsights}
            className="bg-[#fed023] hover:bg-[#eec209] text-[#6f5900] px-4 py-2 rounded-lg text-[12px] font-bold transition-all self-start relative z-10 cursor-pointer shadow-xs active:scale-98"
          >
            Apply Insights
          </button>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-white border border-[#c1c7cf] rounded-xl shadow-xs overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-[#c1c7cf] bg-[#f2f4f6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-[18px] font-bold text-[#003b5a]">
              Storing With Versioning
            </h3>
            <span className="text-xs bg-[#e0e3e5] text-[#41474e] font-semibold px-2 py-0.5 rounded-full">
              {filteredJobs.length} roles
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787f] text-[18px]">
                search
              </span>
              <input
                id="search-roles-input"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search roles or platforms..."
                className="pl-9 pr-4 py-1.5 border border-[#c1c7cf] rounded-lg text-[13px] bg-white focus:ring-1 focus:ring-[#003b5a] focus:border-[#003b5a] w-full outline-none"
              />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table id="version-control-table" className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#283847] text-white">
                <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider w-1/4">
                  Role
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider w-1/5">
                  Platform
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider w-1/4">
                  Version Selection
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-center w-1/6">
                  Status
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold uppercase tracking-wider text-right w-1/6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e3e5] bg-white">
              {paginatedJobs.map((job) => {
                const currentVersion =
                  job.versions.find((v) => v.isCurrent) || job.versions[0];
                const isAiOptimized =
                  currentVersion?.versionNumber === 'V3' ||
                  currentVersion?.versionNumber === 'V4';

                return (
                  <tr
                    key={job.id}
                    className={`hover:bg-[#f2f4f6] transition-colors group ${
                      isAiOptimized ? 'border-l-4 border-l-[#003b5a]' : ''
                    }`}
                  >
                    {/* Role & REQ ID */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-semibold text-[#191c1e] group-hover:text-[#003b5a] transition-colors">
                            {job.title}
                          </span>
                          {isAiOptimized && (
                            <span
                              className="material-symbols-outlined text-[16px] text-[#003b5a] fill"
                              title="AI Optimized Posting"
                            >
                              auto_awesome
                            </span>
                          )}
                        </div>
                        <span className="text-[12px] text-[#72787f] font-mono">
                          {job.reqId}
                        </span>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="py-3 px-4">
                      {getPlatformBadge(currentVersion?.platform || 'LinkedIn')}
                    </td>

                    {/* Version Selection */}
                    <td className="py-3 px-4">
                      <select
                        id={`version-select-${job.id}`}
                        value={currentVersion?.versionNumber || 'V1'}
                        onChange={(e) => onSelectVersion(job.id, e.target.value)}
                        className="block w-full rounded-md border border-[#c1c7cf] bg-white py-1.5 px-2.5 text-[#191c1e] text-[13px] shadow-2xs focus:border-[#003b5a] outline-none cursor-pointer"
                      >
                        {job.versions.map((ver) => (
                          <option key={ver.versionNumber} value={ver.versionNumber}>
                            {ver.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(
                        currentVersion?.status || 'draft',
                        job.id,
                        currentVersion?.versionNumber || 'V1'
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewJobDetail(job, currentVersion?.versionNumber)}
                          className="text-[#003b5a] hover:bg-[#cbe6ff] hover:text-[#001e30] px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors border border-transparent cursor-pointer"
                          title="Inspect structured description and platform guidelines"
                        >
                          View Data
                        </button>
                        <button
                          onClick={() => onViewRawJSON(job)}
                          className="text-[#72787f] hover:text-[#191c1e] hover:bg-[#eceef0] p-1.5 rounded-md transition-colors cursor-pointer"
                          title="View raw unstructured JSON source"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            data_object
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedJobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#72787f]">
                    <span className="material-symbols-outlined text-[36px] text-[#c1c7cf] mb-2 block">
                      search_off
                    </span>
                    No job postings found matching your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#c1c7cf] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[13px] text-[#72787f]">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of{' '}
            {filteredJobs.length} jobs
          </span>

          <div className="flex items-center gap-2">
            <button
              id="prev-page-button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-[#c1c7cf] text-[#41474e] hover:bg-[#e0e3e5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_left
              </span>
            </button>
            <span className="text-xs font-semibold text-[#191c1e] px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              id="next-page-button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-[#c1c7cf] text-[#003b5a] hover:bg-[#e0e3e5] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
