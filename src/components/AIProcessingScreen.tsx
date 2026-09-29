import React, { useState, useEffect } from 'react';
import { JobPosting, StructuredAIOutput } from '../types';

interface AIProcessingScreenProps {
  currentProcessingJob: Partial<JobPosting> | null;
  processingProgress: number;
  isProcessing: boolean;
  completedJob: JobPosting | null;
  completedStructured: StructuredAIOutput | null;
  onViewVersions: () => void;
  onViewRawJSON: (job: JobPosting) => void;
  onViewStructuredModal: (job: JobPosting) => void;
  onRestart: () => void;
}

export const AIProcessingScreen: React.FC<AIProcessingScreenProps> = ({
  currentProcessingJob,
  processingProgress,
  isProcessing,
  completedJob,
  completedStructured,
  onViewVersions,
  onViewRawJSON,
  onViewStructuredModal,
  onRestart,
}) => {
  const [stageText, setStageText] = useState('Structuring Raw Data...');

  useEffect(() => {
    if (processingProgress < 35) {
      setStageText('Ingesting Raw Input Data...');
    } else if (processingProgress < 75) {
      setStageText('Analyzing Job Requirements & Role Taxonomy...');
    } else if (processingProgress < 95) {
      setStageText('Generating Structured JSON & Benchmark Specs...');
    } else {
      setStageText('Finalizing Platform Versions & Storing in DB...');
    }
  }, [processingProgress]);

  const step1Completed = processingProgress >= 30;
  const step2Active = processingProgress >= 30 && processingProgress < 85;
  const step2Completed = processingProgress >= 85;
  const step3Active = processingProgress >= 85 && processingProgress < 100;
  const step3Completed = processingProgress >= 100;

  return (
    <div
      id="ai-processing-screen"
      className="max-w-3xl mx-auto flex flex-col items-center justify-center py-6 md:py-10"
    >
      {/* Bento-style Loading Container */}
      <div className="w-full bg-[#f3e8ff]/40 border border-[#c1c7cf] rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        {/* Top Purple Accent Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#9333ea] via-[#c084fc] to-[#3b82f6]"></div>

        <div className="p-6 md:p-10 flex flex-col items-center text-center">
          {/* Animated Centerpiece */}
          <div className="relative w-28 h-28 md:w-32 md:h-32 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
            {isProcessing && (
              <div className="absolute inset-0 rounded-full pulse-ring bg-purple-200/50"></div>
            )}
            <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-sm flex items-center justify-center border-2 border-purple-300">
              <span
                className={`material-symbols-outlined text-4xl md:text-5xl text-[#7e22ce] ${
                  isProcessing ? 'animate-pulse' : ''
                }`}
              >
                {step3Completed ? 'task_alt' : 'psychology'}
              </span>
            </div>
          </div>

          {/* Dynamic Status Text */}
          <h2
            id="status-heading"
            className="text-[24px] md:text-[28px] font-bold text-[#191c1e] mb-1"
          >
            {step3Completed ? 'Structuring Complete!' : 'AI Processing'}
          </h2>

          <p
            id="status-detail"
            className="text-[15px] text-[#41474e] mb-8 font-mono min-h-[24px] typing-effect"
          >
            {step3Completed
              ? `Structured "${completedJob?.title || currentProcessingJob?.title || 'Job Role'}"`
              : stageText}
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md bg-[#e0e3e5] rounded-full h-2.5 mb-8 overflow-hidden">
            <div
              id="main-progress-bar"
              className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-[#9333ea] to-[#c084fc]"
              style={{ width: `${Math.min(100, processingProgress)}%` }}
            ></div>
          </div>

          {/* Step Indicators */}
          <div className="w-full max-w-lg flex flex-col gap-3 text-left">
            {/* Step 1 */}
            <div
              id="step-1-card"
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                step1Completed
                  ? 'bg-white border border-[#c1c7cf] shadow-xs'
                  : 'bg-white/60 border border-[#e0e3e5] opacity-60'
              }`}
            >
              <span
                className="material-symbols-outlined text-[#137333] mt-0.5"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-[#191c1e]">
                  Ingest Raw Data
                </h3>
                <p className="text-[13px] text-[#41474e]">
                  Parsing unstructured text notes, requirements, and taxonomy
                  tags.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              id="step-2-card"
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                step2Completed
                  ? 'bg-white border border-[#c1c7cf] shadow-xs'
                  : step2Active
                  ? 'bg-white border-l-4 border-l-[#a855f7] border-y border-r border-[#c1c7cf] shadow-sm'
                  : 'bg-white/60 border border-[#e0e3e5] opacity-50'
              }`}
            >
              {step2Completed ? (
                <span
                  className="material-symbols-outlined text-[#137333] mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              ) : step2Active ? (
                <span className="material-symbols-outlined text-[#7e22ce] mt-0.5 animate-spin">
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined text-[#c1c7cf] mt-0.5">
                  pending
                </span>
              )}
              <div>
                <h3
                  className={`text-[15px] font-semibold ${
                    step2Active || step2Completed
                      ? 'text-[#191c1e]'
                      : 'text-[#72787f]'
                  }`}
                >
                  Structure & Analyze
                </h3>
                <p
                  className={`text-[13px] ${
                    step2Active || step2Completed
                      ? 'text-[#41474e]'
                      : 'text-[#72787f]'
                  }`}
                >
                  Transforming raw notes into standardized responsibilities and
                  qualifications.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              id="step-3-card"
              className={`flex items-start gap-4 p-4 rounded-xl transition-all ${
                step3Completed
                  ? 'bg-white border border-[#c1c7cf] shadow-xs'
                  : step3Active
                  ? 'bg-white border-l-4 border-l-[#a855f7] border-y border-r border-[#c1c7cf] shadow-sm'
                  : 'bg-white/60 border border-[#e0e3e5] opacity-50'
              }`}
            >
              {step3Completed ? (
                <span
                  className="material-symbols-outlined text-[#137333] mt-0.5"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              ) : step3Active ? (
                <span className="material-symbols-outlined text-[#7e22ce] mt-0.5 animate-spin">
                  sync
                </span>
              ) : (
                <span className="material-symbols-outlined text-[#c1c7cf] mt-0.5">
                  pending
                </span>
              )}
              <div>
                <h3
                  className={`text-[15px] font-semibold ${
                    step3Completed || step3Active
                      ? 'text-[#191c1e]'
                      : 'text-[#72787f]'
                  }`}
                >
                  Generate Output
                </h3>
                <p
                  className={`text-[13px] ${
                    step3Completed || step3Active
                      ? 'text-[#41474e]'
                      : 'text-[#72787f]'
                  }`}
                >
                  Creating structured JSON payload and platform-specific
                  deployable versions.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons on Completion */}
          {step3Completed && completedJob && (
            <div className="mt-8 pt-6 border-t border-purple-200 w-full flex flex-col sm:flex-row items-center justify-center gap-3 animate-fadeIn">
              <button
                id="view-versions-btn"
                type="button"
                onClick={onViewVersions}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#fed023] hover:bg-[#eec209] text-[#6f5900] font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  layers
                </span>
                View in Version Control
              </button>

              <button
                id="inspect-structured-btn"
                type="button"
                onClick={() => onViewStructuredModal(completedJob)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-[#003b5a] text-[#003b5a] hover:bg-[#eceef0] font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>
                Inspect Output
              </button>

              <button
                id="view-raw-json-btn"
                type="button"
                onClick={() => onViewRawJSON(completedJob)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white border border-[#c1c7cf] text-[#41474e] hover:bg-[#eceef0] font-medium text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">
                  data_object
                </span>
                Raw JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contextual Info Box */}
      <div className="mt-6 w-full max-w-lg text-center bg-[#f2f4f6] p-4 rounded-xl border border-[#c1c7cf]">
        <p className="text-[13px] text-[#41474e] flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#72787f]">
            info
          </span>
          {step3Completed
            ? 'Structured data successfully stored with versioning in the repository.'
            : 'This process usually takes a few seconds. Do not close this window.'}
        </p>
      </div>
    </div>
  );
};
