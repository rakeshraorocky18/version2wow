import { Pencil, User } from 'lucide-react';
import { WizardProfile, EXPRESS_FIELDS } from '../../../types/profile';
import { getPhotoUrl } from '../../../lib/profileUtils';

interface ReviewStepProps {
  profile: WizardProfile;
  onEdit: (step: number) => void;
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card border border-gray-200">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700"
        >
          <Pencil size={14} /> Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 py-2 border-b border-gray-50 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 sm:col-span-2">{value}</dd>
    </div>
  );
}

export default function ReviewStep({ profile, onEdit }: ReviewStepProps) {
  const pd = profile.personalDetails;
  const ex = profile.experience;
  const photoUrl = getPhotoUrl(profile.profilePhotoPreview || profile.existingPhotoUrl);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Review & Summary</h2>
        <p className="text-sm text-gray-500 mt-1">Review your information before saving</p>
      </div>

      <Section title="Profile Photo" step={1} onEdit={onEdit}>
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={36} className="text-primary-400" />
            )}
          </div>
        </div>
      </Section>

      <Section title="Personal Details" step={1} onEdit={onEdit}>
        <dl>
          <Row label="Name" value={`${pd.firstName} ${pd.lastName}`} />
          <Row label="Display Name" value={pd.displayName} />
          <Row label="Gender" value={pd.gender} />
          <Row label="Date of Birth" value={pd.dateOfBirth} />
          <Row label="Phone" value={pd.phone} />
          <Row label="Email" value={pd.email} />
          <Row label="Location" value={[pd.city, pd.state, pd.country].filter(Boolean).join(', ')} />
          <Row label="Address" value={pd.address} />
          <Row label="Languages" value={pd.languagesKnown.join(', ')} />
        </dl>
      </Section>

      <Section title="Education" step={2} onEdit={onEdit}>
        {profile.education.map((edu, i) => (
          <div key={edu.id} className={i > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}>
            <dl>
              <Row label="Degree" value={edu.degree} />
              <Row label="Qualification" value={edu.qualification} />
              <Row label="Specialization" value={edu.specialization} />
              <Row label="Institution" value={edu.institutionName} />
              <Row label="University/Board" value={edu.universityBoard} />
              <Row label="Duration" value={[edu.startYear, edu.endYear].filter(Boolean).join(' – ')} />
              <Row label="Percentage/CGPA" value={edu.percentageCgpa} />
              <Row label="Certifications" value={edu.certifications} />
            </dl>
          </div>
        ))}
      </Section>

      <Section title="Professional Experience" step={3} onEdit={onEdit}>
        <dl>
          <Row label="Currently Working" value={ex.currentlyWorking ? 'Yes' : 'No'} />
          {ex.currentlyWorking && (
            <>
              <Row label="Company" value={ex.companyName} />
              <Row label="Job Title" value={ex.jobTitle} />
              <Row label="Industry" value={ex.industry} />
              <Row label="Employment Type" value={ex.employmentType?.replace('_', ' ')} />
              <Row label="Experience" value={ex.yearsOfExperience} />
              <Row label="Salary" value={ex.currentSalary} />
              <Row label="Skills" value={ex.skills} />
              <Row label="LinkedIn" value={ex.linkedIn} />
              <Row label="Portfolio" value={ex.portfolioWebsite} />
              <Row label="Resume" value={profile.resumeFile?.name || (ex.resumeUrl ? 'Uploaded' : '')} />
            </>
          )}
        </dl>
      </Section>

      <Section title="Hobbies & Interests" step={4} onEdit={onEdit}>
        {profile.hobbies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.hobbies.map((h) => (
              <span key={h} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                {h}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No hobbies selected</p>
        )}
      </Section>

      <Section title="Express Yourself" step={5} onEdit={onEdit}>
        <dl>
          {EXPRESS_FIELDS.map(({ key, label }) => (
            <Row key={key} label={label} value={profile.expressYourself[key]} />
          ))}
        </dl>
      </Section>
    </div>
  );
}
