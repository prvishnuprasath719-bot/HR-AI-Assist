import React, { useState } from 'react';
import { JobPosting } from '../types';

interface UnstructuredDataViewProps {
  jobs: JobPosting[];
  selectedJobId?: string;
  onProcessAI: (job: JobPosting) => void;
  onBackToVersions: () => void;
}

export const UnstructuredDataView: React.FC<UnstructuredDataViewProps> = ({
  jobs,
  selectedJobId,
  onProcessAI,
  onBackToVersions,
}) => {
  const [activeJobId, setActiveJobId] = useState<string>(
    selectedJobId || jobs[0]?.id || 'job-1'
  );
  const [viewMode, setViewMode] = useState<'raw' | 'structured'>('raw');
  const [copied, setCopied] = useState(false);

  const currentJob = jobs.find((j) => j.id === activeJobId) || jobs[0];

  const rawJsonData = currentJob?.rawSource || {
    source_id: 'JD-REQ-8942-2023',
    ingestion_timestamp: '2023-10-27T09:14:22Z',
    raw_text_payload:
      'We are looking for a Senior Frontend Developer to join our core product team...',
    metadata: {
      department: 'Engineering',
      hiring_manager: 'Sarah Jenkins',
      urgency: 'High',
      format_detected: 'plain_text_block',
    },
    pre_processing_flags: [
      'contains_salary_data',
      'requires_location_parsing',
    ],
  };

  const jsonStringToDisplay =
    viewMode === 'raw'
      ? JSON.stringify(rawJsonData, null, 2)
      : JSON.stringify(currentJob, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStringToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const lines = jsonStringToDisplay.split('\n');
  const calculatedSize = (new Blob([jsonStringToDisplay]).size / 1024).toFixed(1);

  // Syntax highlighter for JSON lines
  const renderFormattedLine = (line: string) => {
    // Match key-value in JSON
    const keyMatch = line.match(/^(\s*)(".*?")(\s*:\s*)(.*)$/);
    if (keyMatch) {
      const [, indent, key, colon, value] = keyMatch;
      let formattedVal = <span className="text-[#a5d6ff]">{value}</span>;

      if (value.startsWith('"')) {
        formattedVal = <span className="text-[#a5d6ff]">{value}</span>;
      } else if (value === 'true' || value === 'false') {
        formattedVal = <span className="text-[#ff7b72] font-semibold">{value}</span>;
      } else if (!isNaN(Number(value.replace(/,$/, '')))) {
        formattedVal = <span className="text-[#79c0ff]">{value}</span>;
      } else if (value.startsWith('[') || value.startsWith('{')) {
        formattedVal = <span className="text-[#c9d1d9]">{value}</span>;
      }

      return (
        <>
          <span>{indent}</span>
          <span className="text-[#79c0ff]">{key}</span>
          <span className="text-[#c9d1d9]">{colon}</span>
          {formattedVal}
        </>
      );
    }

    // Brackets and commas
    return <span className="text-[#c9d1d9]">{line}</span>;
  };

  return (
    <div id="unstructured-data-container" className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Context Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#c1c7cf] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 bg-[#e0e3e5] text-[#191c1e] font-bold text-[11px] rounded uppercase tracking-wider">
              {viewMode === 'raw' ? 'Raw Source' : 'Structured Database JSON'}
            </span>
            <span className="text-[#72787f] text-sm">•</span>
            <span className="text-[#41474e] text-xs font-medium">
              Ingested:{' '}
              {new Date(rawJsonData.ingestion_timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          <h2 className="text-[28px] md:text-[34px] font-bold text-[#191c1e] tracking-tight">
            Unstructured Data View
          </h2>
          <p className="text-[15px] text-[#41474e] mt-1 max-w-2xl leading-relaxed">
            Viewing the raw JSON payload before AI processing and structuring. Use
            this to verify source data integrity and schema mappings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Job Selector Dropdown */}
          <select
            id="json-job-selector"
            value={activeJobId}
            onChange={(e) => setActiveJobId(e.target.value)}
            className="px-3 py-2 bg-white border border-[#c1c7cf] rounded-lg text-xs font-semibold text-[#191c1e] shadow-2xs outline-none cursor-pointer"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.reqId})
              </option>
            ))}
          </select>

          {/* Copy Button */}
          <button
            id="copy-json-button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#c1c7cf] rounded-lg text-[#191c1e] bg-white hover:bg-[#eceef0] transition-colors text-xs font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          {/* Process AI Action */}
          {currentJob && (
            <button
              id="process-ai-structure-button"
              onClick={() => onProcessAI(currentJob)}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#fed023] hover:bg-[#eec209] text-[#6f5900] rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[16px] fill">
                psychology
              </span>
              <span>Process AI Structure</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex bg-[#eceef0] p-1 rounded-lg border border-[#c1c7cf]">
          <button
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'raw'
                ? 'bg-white text-[#003b5a] shadow-xs'
                : 'text-[#41474e] hover:text-[#191c1e]'
            }`}
          >
            Raw Ingested JSON
          </button>
          <button
            onClick={() => setViewMode('structured')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'structured'
                ? 'bg-white text-[#003b5a] shadow-xs'
                : 'text-[#41474e] hover:text-[#191c1e]'
            }`}
          >
            Structured Record Schema
          </button>
        </div>

        <button
          onClick={onBackToVersions}
          className="text-xs text-[#003b5a] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">
            arrow_back
          </span>
          Back to Versions Table
        </button>
      </div>

      {/* Code Viewer Container */}
      <div className="rounded-xl border border-[#c1c7cf] overflow-hidden flex flex-col shadow-xs bg-[#0d1117]">
        {/* Code Header */}
        <div className="bg-[#283847] flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#9bccf6] text-[18px]">
              data_object
            </span>
            <span className="font-mono text-xs md:text-sm text-white font-medium">
              {viewMode === 'raw'
                ? 'job_description_raw_upload.json'
                : `job_version_record_${currentJob?.reqId}.json`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#9bccf6] font-mono text-[11px]">
            <span>Line: 1-{lines.length}</span>
            <span>•</span>
            <span>Size: {calculatedSize} KB</span>
            <span>•</span>
            <span>UTF-8</span>
          </div>
        </div>

        {/* Code Content with Line Numbers */}
        <div className="overflow-x-auto max-h-[620px] p-4 font-mono text-xs md:text-[13px] leading-relaxed text-[#c9d1d9] bg-[#0d1117] flex">
          {/* Line Numbers Gutter */}
          <div className="select-none text-[#484f58] pr-4 border-r border-[#30363d] text-right font-mono text-xs space-y-0.5 min-w-[36px]">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Formatted Code Lines */}
          <pre className="pl-4 flex-1 overflow-x-auto">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="whitespace-pre">
                  {renderFormattedLine(line)}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};
