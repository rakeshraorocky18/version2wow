import { Plus, Trash2 } from 'lucide-react';
import { EducationEntry, StepErrors } from '../../../types/profile';
import { createEmptyEducation } from '../../../types/profile';

interface EducationStepProps {
  education: EducationEntry[];
  errors: StepErrors;
  onChange: (education: EducationEntry[]) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function EducationStep({ education, errors, onChange }: EducationStepProps) {
  const updateEntry = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = education.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry,
    );
    onChange(updated);
  };

  const addEntry = () => onChange([...education, createEmptyEducation()]);

  const removeEntry = (index: number) => {
    if (education.length <= 1) return;
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Education Details</h2>
        <p className="text-sm text-gray-500 mt-1">Add your academic qualifications</p>
      </div>

      {education.map((entry, index) => (
        <div key={entry.id} className="card border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Education {index + 1}</h3>
            {education.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input type="text" value={entry.qualification} onChange={(e) => updateEntry(index, 'qualification', e.target.value)} className="input-field" placeholder="e.g. Undergraduate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
              <input type="text" value={entry.degree} onChange={(e) => updateEntry(index, 'degree', e.target.value)} className={`input-field ${errors[`education.${index}.degree`] ? 'border-red-400' : ''}`} placeholder="e.g. B.Tech" />
              <FieldError message={errors[`education.${index}.degree`]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input type="text" value={entry.specialization} onChange={(e) => updateEntry(index, 'specialization', e.target.value)} className="input-field" placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institution Name *</label>
              <input type="text" value={entry.institutionName} onChange={(e) => updateEntry(index, 'institutionName', e.target.value)} className={`input-field ${errors[`education.${index}.institutionName`] ? 'border-red-400' : ''}`} />
              <FieldError message={errors[`education.${index}.institutionName`]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University/Board</label>
              <input type="text" value={entry.universityBoard} onChange={(e) => updateEntry(index, 'universityBoard', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
              <input type="text" value={entry.startYear} onChange={(e) => updateEntry(index, 'startYear', e.target.value)} className="input-field" placeholder="e.g. 2018" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
              <input type="text" value={entry.endYear} onChange={(e) => updateEntry(index, 'endYear', e.target.value)} className="input-field" placeholder="e.g. 2022" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage/CGPA</label>
              <input type="text" value={entry.percentageCgpa} onChange={(e) => updateEntry(index, 'percentageCgpa', e.target.value)} className="input-field" placeholder="e.g. 8.5 CGPA" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
              <textarea value={entry.certifications} onChange={(e) => updateEntry(index, 'certifications', e.target.value)} className="input-field min-h-[60px] resize-none" placeholder="List any certifications" />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={addEntry} className="btn-secondary flex items-center gap-2 w-full sm:w-auto">
        <Plus size={18} /> Add Another Education
      </button>
    </div>
  );
}
