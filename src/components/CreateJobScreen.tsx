import React, { useState } from 'react';
import { TEMPLATE_PRESETS } from '../data/mockJobs';
import { JobPosting, PlatformType } from '../types';

interface CreateJobScreenProps {
  onStartAIProcess: (formData: {
    jobTitle: string;
    department: string;
    location: string;
    employmentType: string;
    responsibilitiesRaw: string;
    qualificationsRaw: string;
    skills: string[];
    targetPlatform: PlatformType;
  }) => void;
  onSaveDraft: (draft: Partial<JobPosting>) => void;
}

export const CreateJobScreen: React.FC<CreateJobScreenProps> = ({
  onStartAIProcess,
  onSaveDraft,
}) => {
  const [jobTitle, setJobTitle] = useState('Senior React Developer');
  const [department, setDepartment] = useState('engineering');
  const [location, setLocation] = useState('San Francisco, CA (Hybrid)');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [targetPlatform, setTargetPlatform] = useState<PlatformType>('LinkedIn');
  const [responsibilitiesRaw, setResponsibilitiesRaw] = useState(
    `- Lead frontend feature development across multiple high-traffic React micro-frontends\n- Collaborate with backend engineers to integrate REST and GraphQL endpoints\n- Enforce code standards, accessibility (WCAG), and responsive design principles\n- Mentor team members and participate in architecture design reviews`
  );
  const [qualificationsRaw, setQualificationsRaw] = useState(
    `5+ years of experience with React, TypeScript, and modern state management. Proven track record building high-performance web applications and design systems.`
  );
  const [skills, setSkills] = useState<string[]>([
    'React',
    'TypeScript',
    'System Design',
    'Tailwind CSS',
    'State Management',
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkillInput.trim()) {
      e.preventDefault();
      const trimmed = newSkillInput.trim();
      if (!skills.includes(trimmed)) {
        setSkills([...skills, trimmed]);
      }
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleLoadTemplate = (index: number) => {
    const tpl = TEMPLATE_PRESETS[index];
    if (!tpl) return;
    setJobTitle(tpl.title);
    setDepartment(tpl.department);
    setLocation(tpl.location);
    setEmploymentType(tpl.employmentType);
    setResponsibilitiesRaw(tpl.responsibilities);
    setQualificationsRaw(tpl.qualifications);
    setSkills(tpl.skills);

    setToastMessage(`Loaded "${tpl.title}" template!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmitProcess = (e: React.FormEvent) => {
    e.preventDefault();
    onStartAIProcess({
      jobTitle,
      department,
      location,
      employmentType,
      responsibilitiesRaw,
      qualificationsRaw,
      skills,
      targetPlatform,
    });
  };

  const handleSaveDraftClick = () => {
    onSaveDraft({
      title: jobTitle || 'Untitled Draft Role',
      department,
      departmentLabel: department.toUpperCase(),
      location,
      employmentType,
      skills,
    });
    setToastMessage('Draft saved locally in Version Control.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div id="create-job-container" className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#003b5a] text-white px-4 py-2.5 rounded-lg shadow-lg border border-[#cbe6ff] flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#fed023]">
            check_circle
          </span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2 border-l-4 border-[#fed023] pl-4 py-1">
        <h2 className="text-[28px] md:text-[34px] font-bold text-[#191c1e] tracking-tight">
          Create New Job Posting
        </h2>
        <p className="text-[15px] md:text-[16px] text-[#41474e] leading-relaxed">
          Input the raw details below to generate an optimized, structured job
          description using AI.
        </p>
      </div>

      {/* Quick Template Picker */}
      <div className="bg-[#eceef0] border border-[#c1c7cf] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[#003b5a] font-semibold text-sm">
          <span className="material-symbols-outlined text-[20px] text-[#735c00]">
            lightbulb
          </span>
          <span>Quick Sample Templates:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TEMPLATE_PRESETS.map((t, idx) => (
            <button
              key={t.title}
              type="button"
              onClick={() => handleLoadTemplate(idx)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white hover:bg-[#fed023] hover:text-[#6f5900] text-[#191c1e] border border-[#c1c7cf] transition-colors cursor-pointer"
            >
              {t.title.split(' ')[0]} {t.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Container */}
      <form
        id="job-posting-form"
        onSubmit={handleSubmitProcess}
        className="bg-white border border-[#c1c7cf] rounded-xl p-6 md:p-8 shadow-xs space-y-8"
      >
        {/* Basic Info Section */}
        <div className="space-y-6">
          <h3 className="text-[20px] font-semibold text-[#003b5a] flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
            <span className="material-symbols-outlined text-[#fed023] fill">info</span>
            Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Job Title */}
            <div className="space-y-2">
              <label
                className="block text-[13px] font-semibold text-[#191c1e]"
                htmlFor="job-title"
              >
                Job Title *
              </label>
              <input
                id="job-title"
                name="job-title"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                type="text"
                className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] focus:ring-1 focus:ring-[#003b5a] outline-none transition-colors"
              />
            </div>

            {/* Department / Category */}
            <div className="space-y-2">
              <label
                className="block text-[13px] font-semibold text-[#191c1e]"
                htmlFor="department"
              >
                Department / Role Category
              </label>
              <select
                id="department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] focus:ring-1 focus:ring-[#003b5a] outline-none transition-colors cursor-pointer"
              >
                <option value="engineering">Engineering & Tech</option>
                <option value="product">Product Management</option>
                <option value="design">Design & UX</option>
                <option value="sales">Sales & Marketing</option>
                <option value="hr">Human Resources & Operations</option>
              </select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label
                className="block text-[13px] font-semibold text-[#191c1e]"
                htmlFor="location"
              >
                Location
              </label>
              <input
                id="location"
                name="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, New York, London"
                type="text"
                className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] focus:ring-1 focus:ring-[#003b5a] outline-none transition-colors"
              />
            </div>

            {/* Employment Type & Target Platform */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  className="block text-[13px] font-semibold text-[#191c1e]"
                  htmlFor="emp-type"
                >
                  Employment Type
                </label>
                <select
                  id="emp-type"
                  name="emp-type"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-3 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] outline-none transition-colors cursor-pointer"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  className="block text-[13px] font-semibold text-[#191c1e]"
                  htmlFor="target-platform"
                >
                  Target Platform
                </label>
                <select
                  id="target-platform"
                  name="target-platform"
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value as PlatformType)}
                  className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-3 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] outline-none transition-colors cursor-pointer"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="GitHub Jobs">GitHub Jobs</option>
                  <option value="Company Website">Company Website</option>
                  <option value="Indeed">Indeed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Requirements Section */}
        <div className="space-y-6 pt-2">
          <h3 className="text-[20px] font-semibold text-[#003b5a] flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
            <span className="material-symbols-outlined text-[#fed023] fill">list_alt</span>
            Role Details
          </h3>

          {/* Responsibilities */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label
                className="block text-[13px] font-semibold text-[#191c1e]"
                htmlFor="responsibilities"
              >
                Responsibilities (Raw Notes)
              </label>
              <span className="text-[12px] text-[#72787f] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#9333ea]">
                  auto_awesome
                </span>
                AI will structure these
              </span>
            </div>
            <textarea
              id="responsibilities"
              name="responsibilities"
              rows={5}
              value={responsibilitiesRaw}
              onChange={(e) => setResponsibilitiesRaw(e.target.value)}
              placeholder="- Lead a team of developers...&#10;- Architect scalable systems...&#10;- Collaborate with product managers..."
              className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] focus:ring-1 focus:ring-[#003b5a] outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Qualifications */}
          <div className="space-y-2">
            <label
              className="block text-[13px] font-semibold text-[#191c1e]"
              htmlFor="qualifications"
            >
              Qualifications & Experience (Raw)
            </label>
            <textarea
              id="qualifications"
              name="qualifications"
              rows={4}
              value={qualificationsRaw}
              onChange={(e) => setQualificationsRaw(e.target.value)}
              placeholder="e.g. 5+ years experience in React, BS in Computer Science, agile team workflows..."
              className="w-full rounded-lg border border-[#c1c7cf] bg-[#f7f9fb] px-4 py-3 text-[14px] text-[#191c1e] focus:border-[#003b5a] focus:ring-1 focus:ring-[#003b5a] outline-none transition-colors resize-y leading-relaxed"
            />
          </div>

          {/* Skills Tags */}
          <div className="space-y-3">
            <label className="block text-[13px] font-semibold text-[#191c1e]">
              Required Skills (Tags)
            </label>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-[#f7f9fb] border border-[#c1c7cf] rounded-xl min-h-[56px]">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e6e8ea] text-[#191c1e] text-[13px] font-medium border border-[#c1c7cf]"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-[#72787f] hover:text-[#ba1a1a] transition-colors cursor-pointer flex items-center"
                    title={`Remove ${skill}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </span>
              ))}

              <div className="relative flex-1 min-w-[200px]">
                <input
                  id="skill-tag-input"
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Add skill and press Enter..."
                  className="w-full rounded-full border border-dashed border-[#c1c7cf] bg-white px-4 py-1.5 text-[13px] text-[#191c1e] focus:border-[#003b5a] focus:border-solid outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="pt-6 border-t border-[#e0e3e5] flex flex-col sm:flex-row justify-end gap-4 items-center">
          <button
            id="save-draft-button"
            type="button"
            onClick={handleSaveDraftClick}
            className="w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-[13px] text-[#003b5a] bg-transparent border border-[#003b5a] hover:bg-[#e0e3e5] transition-colors cursor-pointer"
          >
            Save Draft
          </button>

          <button
            id="process-ai-button"
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-full font-bold text-[13px] text-[#6f5900] bg-[#fed023] hover:bg-[#eec209] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <span className="material-symbols-outlined fill text-[20px]">
              auto_awesome
            </span>
            Process with AI
          </button>
        </div>
      </form>
    </div>
  );
};
