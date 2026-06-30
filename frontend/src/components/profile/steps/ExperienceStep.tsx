import { FileText, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Experience, StepErrors } from '../../../types/profile';

interface ExperienceStepProps {
  data: Experience;
  errors: StepErrors;
  resumeFile: File | null;
  onChange: (updates: Partial<Experience>) => void;
  onResumeSelect: (file: File | null) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function ExperienceStep({
  data,
  errors,
  resumeFile,
  onChange,
  onResumeSelect,
}: ExperienceStepProps) {
  const resumeRef = useRef<HTMLInputElement>(null);

  const handleResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Resume must be under 10MB');
      return;
    }
    onResumeSelect(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Professional Experience</h2>
        <p className="text-sm text-gray-500 mt-1">Share your career details</p>
      </div>

      <div className="card border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-3">Currently Working?</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="currentlyWorking"
              checked={data.currentlyWorking === true}
              onChange={() => onChange({ currentlyWorking: true })}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="currentlyWorking"
              checked={data.currentlyWorking === false}
              onChange={() => onChange({ currentlyWorking: false })}
              className="text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm">No</span>
          </label>
        </div>
      </div>

      {data.currentlyWorking && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[soft-fade-in_0.3s_ease-out]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
            <input type="text" value={data.companyName} onChange={(e) => onChange({ companyName: e.target.value })} className={`input-field ${errors.companyName ? 'border-red-400' : ''}`} />
            <FieldError message={errors.companyName} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
            <input type="text" value={data.jobTitle} onChange={(e) => onChange({ jobTitle: e.target.value })} className={`input-field ${errors.jobTitle ? 'border-red-400' : ''}`} />
            <FieldError message={errors.jobTitle} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry *</label>
            <input type="text" value={data.industry} onChange={(e) => onChange({ industry: e.target.value })} className={`input-field ${errors.industry ? 'border-red-400' : ''}`} placeholder="e.g. IT, Finance" />
            <FieldError message={errors.industry} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
            <select value={data.employmentType} onChange={(e) => onChange({ employmentType: e.target.value })} className={`input-field ${errors.employmentType ? 'border-red-400' : ''}`}>
              <option value="">Select type</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
              <option value="internship">Internship</option>
            </select>
            <FieldError message={errors.employmentType} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            <input type="text" value={data.yearsOfExperience} onChange={(e) => onChange({ yearsOfExperience: e.target.value })} className="input-field" placeholder="e.g. 5 years" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Salary</label>
            <input type="text" value={data.currentSalary} onChange={(e) => onChange({ currentSalary: e.target.value })} className="input-field" placeholder="e.g. 12 LPA" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
            <textarea value={data.skills} onChange={(e) => onChange({ skills: e.target.value })} className="input-field min-h-[80px] resize-none" placeholder="List your key skills" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
            <input type="url" value={data.linkedIn} onChange={(e) => onChange({ linkedIn: e.target.value })} className="input-field" placeholder="https://linkedin.com/in/..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Portfolio Website</label>
            <input type="url" value={data.portfolioWebsite} onChange={(e) => onChange({ portfolioWebsite: e.target.value })} className="input-field" placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resume Upload</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => resumeRef.current?.click()} className="btn-secondary flex items-center gap-2 text-sm py-2">
                <Upload size={16} /> {resumeFile ? 'Change Resume' : 'Upload Resume'}
              </button>
              {(resumeFile || data.resumeUrl) && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FileText size={14} /> {resumeFile?.name || 'Resume on file'}
                </span>
              )}
            </div>
            <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={handleResume} />
            <p className="text-xs text-gray-400 mt-1">PDF or Word. Max 10MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
