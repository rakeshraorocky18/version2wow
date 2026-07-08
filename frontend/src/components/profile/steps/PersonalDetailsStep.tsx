import { Camera, User, X } from 'lucide-react';
import { useRef } from 'react';
import { PersonalDetails } from '../../../types/profile';
import { StepErrors } from '../../../types/profile';
import { getPhotoUrl } from '../../../lib/profileUtils';

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp';

interface PersonalDetailsStepProps {
  data: PersonalDetails;
  photoPreview: string;
  errors: StepErrors;
  onChange: (updates: Partial<PersonalDetails>) => void;
  onPhotoSelect: (file: File | null) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function PersonalDetailsStep({
  data,
  photoPreview,
  errors,
  onChange,
  onPhotoSelect,
}: PersonalDetailsStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const displayUrl = photoPreview ? getPhotoUrl(photoPreview) : '';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!valid.includes(file.type)) {
      alert('Please upload JPG, JPEG, PNG, or WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }
    onPhotoSelect(file);
    e.target.value = '';
  };

  const toggleLanguage = (lang: string) => {
    const langs = data.languagesKnown.includes(lang)
      ? data.languagesKnown.filter((l) => l !== lang)
      : [...data.languagesKnown, lang];
    onChange({ languagesKnown: langs });
  };

  const commonLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Gujarati', 'Punjabi'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-gray-900">Personal Details</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about yourself</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
        <div className="relative w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden shrink-0">
          {displayUrl ? (
            <img src={displayUrl} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-primary-400" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-primary-600 font-medium flex items-center gap-1 hover:text-primary-700"
            >
              <Camera size={14} /> {displayUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={() => onPhotoSelect(null)}
                className="text-sm text-red-500 font-medium flex items-center gap-1"
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">JPG, JPEG, PNG, WEBP. Max 5MB</p>
          <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} className="hidden" onChange={handleFile} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input type="text" value={data.firstName} onChange={(e) => onChange({ firstName: e.target.value })} className={`input-field ${errors.firstName ? 'border-red-400' : ''}`} />
          <FieldError message={errors.firstName} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input type="text" value={data.lastName} onChange={(e) => onChange({ lastName: e.target.value })} className={`input-field ${errors.lastName ? 'border-red-400' : ''}`} />
          <FieldError message={errors.lastName} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input type="text" value={data.displayName} onChange={(e) => onChange({ displayName: e.target.value })} className="input-field" placeholder="How others see your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
          <select value={data.gender} onChange={(e) => onChange({ gender: e.target.value })} className={`input-field ${errors.gender ? 'border-red-400' : ''}`}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <FieldError message={errors.gender} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
          <input type="date" value={data.dateOfBirth} onChange={(e) => onChange({ dateOfBirth: e.target.value })} className={`input-field ${errors.dateOfBirth ? 'border-red-400' : ''}`} />
          <FieldError message={errors.dateOfBirth} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
          <input type="tel" value={data.phone} onChange={(e) => onChange({ phone: e.target.value })} className={`input-field ${errors.phone ? 'border-red-400' : ''}`} placeholder="+91 98765 43210" />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })} className={`input-field ${errors.email ? 'border-red-400' : ''}`} />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
          <input type="text" value={data.country} onChange={(e) => onChange({ country: e.target.value })} className={`input-field ${errors.country ? 'border-red-400' : ''}`} />
          <FieldError message={errors.country} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" value={data.state} onChange={(e) => onChange({ state: e.target.value })} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <input type="text" value={data.city} onChange={(e) => onChange({ city: e.target.value })} className={`input-field ${errors.city ? 'border-red-400' : ''}`} />
          <FieldError message={errors.city} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={data.address} onChange={(e) => onChange({ address: e.target.value })} className="input-field min-h-[80px] resize-none" placeholder="Street address" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Languages Known</label>
        <div className="flex flex-wrap gap-2">
          {commonLanguages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => toggleLanguage(lang)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                data.languagesKnown.includes(lang)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
