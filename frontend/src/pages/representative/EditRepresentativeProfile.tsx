import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Upload,
  UserRound,
  Users,
  HeartHandshake,
  Quote,
  Shield,
  Phone,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getPhotoUrl } from '../../lib/profileUtils';
import MultiSelect from '../../components/profile/MultiSelect';
import { LocationSelects } from '../../components/profile/LocationSelects';
import {
  LANGUAGE_OPTIONS,
  MANAGING_PROFILE_FOR_OPTIONS,
  RELATIONSHIP_OPTIONS,
  calcAge,
} from '../../lib/profileTypeOptions';
import { sanitizeProfilePayload } from '../../lib/sanitizePayload';
import type { RepresentativeProfile } from '../../types/extendedProfiles';

const STEPS = [
  { id: 'personal', label: 'Personal Information', icon: User },
  { id: 'relationship', label: 'Relationship', icon: Users },
  { id: 'managing', label: 'Managing Profile', icon: HeartHandshake },
  { id: 'about', label: 'About', icon: Quote },
  { id: 'contact', label: 'Contact Preferences', icon: Phone },
  { id: 'verification', label: 'Verification', icon: Shield },
] as const;

const emptyForm: Partial<RepresentativeProfile> = {
  fullName: '',
  gender: '',
  dateOfBirth: '',
  mobileNumber: '',
  email: '',
  city: '',
  state: '',
  country: 'India',
  occupation: '',
  companyOrganization: '',
  languagesKnown: [],
  relationship: '',
  relationshipOther: '',
  managingProfileFor: '',
  about: '',
  allowPhoneCalls: false,
  allowWhatsApp: false,
  allowEmail: false,
};

function validateStep(step: number, form: Partial<RepresentativeProfile>) {
  const errors: Record<string, string> = {};
  if (step === 0) {
    if (!form.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!form.gender) errors.gender = 'Gender is required';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!form.mobileNumber?.trim()) errors.mobileNumber = 'Mobile number is required';
    if (!form.country?.trim()) errors.country = 'Country is required';
    if (!form.state?.trim()) errors.state = 'State is required';
    if (!form.city?.trim()) errors.city = 'City is required';
  }
  if (step === 1) {
    if (!form.relationship) errors.relationship = 'Relationship is required';
    if (form.relationship === 'Other' && !form.relationshipOther?.trim()) {
      errors.relationshipOther = 'Relationship name is required';
    }
  }
  if (step === 2) {
    if (!form.managingProfileFor) errors.managingProfileFor = 'Please select Bride or Groom';
  }
  return errors;
}

export default function EditRepresentativeProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const govIdRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['representative-profile-me'],
    queryFn: async () => {
      const { data: res } = await api.get('/representative-profiles/me');
      return res as RepresentativeProfile | null;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({ ...emptyForm, ...data });
      setPhotoPreview(data.profilePhoto || '');
    }
  }, [data]);

  const set = (key: keyof RepresentativeProfile, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const uploadFile = async (field: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: res } = await api.post(`/representative-profiles/me/upload/${field}`, formData);
    return res as { url: string; profile: RepresentativeProfile };
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = sanitizeProfilePayload({
        ...form,
        fullName: form.fullName?.trim(),
      } as Record<string, unknown>);
      if (data?.id) {
        const { data: res } = await api.put('/representative-profiles/me', payload);
        return res;
      }
      const { data: res } = await api.post('/representative-profiles', payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['representative-profile-me'] });
      queryClient.invalidateQueries({ queryKey: ['representative-profile'] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save profile');
    },
  });

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const res = await uploadFile('profilePhoto', file);
      set('profilePhoto', res.url);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Photo upload failed');
    }
  };

  const handleDocUpload = async (field: 'governmentId' | 'relationshipProof', file: File) => {
    try {
      const res = await uploadFile(field, file);
      if (field === 'governmentId') set('governmentIdUrl', res.url);
      else set('relationshipProofUrl', res.url);
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  const goNext = async () => {
    const stepErrors = validateStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      toast.error('Please fill all required fields');
      return;
    }
    setErrors({});

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    try {
      await saveMutation.mutateAsync();
      toast.success('Representative profile saved');
      navigate('/app/profile/representative/me');
    } catch {
      /* handled in mutation */
    }
  };

  const completion = useMemo(() => {
    const keys = ['fullName', 'gender', 'dateOfBirth', 'mobileNumber', 'country', 'state', 'city', 'relationship', 'managingProfileFor'];
    const done = keys.filter((k) => String(form[k as keyof RepresentativeProfile] ?? '').trim()).length;
    return Math.round((done / keys.length) * 100);
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#B66A8A]" size={32} />
      </div>
    );
  }

  const age = calcAge(form.dateOfBirth);
  const stepMeta = STEPS[step];

  return (
    <div className="soft-fade-in -mx-4 rounded-3xl bg-gradient-to-br from-[#FFF0F5] via-[#F8F3FF] to-[#FFF5EF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-6xl pb-4">
        <Link to="/app/profile/representative/me" className="mb-4 inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
          <ArrowLeft size={16} /> Back to My Profiles
        </Link>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-white shadow-sm">
              <div className="bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF] px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A5776]">Family Member / Friend</p>
                <h1 className="font-display text-xl font-bold text-[#5D2B44]">Your Details</h1>
                <p className="mt-1 text-xs text-[#9A5776]">Step {step + 1} of {STEPS.length}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[#9A5776]">Completion</span>
                    <span className="font-bold text-[#B66A8A]">{completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/80">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#D4899F] to-[#B66A8A] transition-all" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </div>
              <nav className="p-2">
                {STEPS.map(({ label, icon: Icon }, i) => {
                  const isActive = step === i;
                  const isDone = i < step;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (i <= step) setStep(i);
                      }}
                      className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        isActive ? 'bg-[#B66A8A] text-white shadow-sm' : isDone ? 'bg-[#F5FFF8] text-[#3D8B5F]' : 'text-[#815A6D] hover:bg-[#FFF5F8]'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : isDone ? 'bg-[#E8F8EF]' : 'bg-[#FAF0F4]'}`}>
                        {isDone ? <Check size={14} /> : <Icon size={14} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-white shadow-sm">
              <div className="border-b border-[#F2DFE8] bg-[#FFFBFC] px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-[#5D2B44]">{stepMeta.label}</h2>
              </div>

              <div className="p-6">
                {step === 0 && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-[#F2DFE8] bg-[#FFF5F8]">
                        {photoPreview ? (
                          <img src={getPhotoUrl(photoPreview)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#C4A0B0]"><UserRound size={36} /></div>
                        )}
                      </div>
                      <button type="button" onClick={() => photoRef.current?.click()} className="btn-secondary text-sm py-2">
                        <Upload size={14} className="inline mr-1" /> Upload Photo
                      </button>
                      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Full Name *" value={form.fullName || ''} error={errors.fullName} onChange={(v) => set('fullName', v)} />
                      <div>
                        <label className="profile-field-label">Gender *</label>
                        <select className={`profile-input${errors.gender ? ' profile-input-error' : ''}`} value={form.gender || ''} onChange={(e) => set('gender', e.target.value)}>
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        {errors.gender && <p className="mt-1 text-xs text-red-500">{errors.gender}</p>}
                      </div>
                      <div>
                        <label className="profile-field-label">Date of Birth *</label>
                        <input type="date" className={`profile-input${errors.dateOfBirth ? ' profile-input-error' : ''}`} value={form.dateOfBirth || ''} onChange={(e) => set('dateOfBirth', e.target.value)} />
                        {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>}
                      </div>
                      <div>
                        <label className="profile-field-label">Age</label>
                        <input type="text" className="profile-input" value={age ?? ''} disabled placeholder="Auto calculated" />
                      </div>
                      <Field label="Mobile Number *" value={form.mobileNumber || ''} error={errors.mobileNumber} onChange={(v) => set('mobileNumber', v)} />
                      <Field label="Email Address" type="email" value={form.email || ''} onChange={(v) => set('email', v)} />
                      <LocationSelects
                        country={form.country || ''}
                        state={form.state || ''}
                        city={form.city || ''}
                        errors={{ country: errors.country, state: errors.state, city: errors.city }}
                        onCountryChange={(v) => {
                          set('country', v);
                          set('state', '');
                          set('city', '');
                        }}
                        onStateChange={(v) => {
                          set('state', v);
                          set('city', '');
                        }}
                        onCityChange={(v) => set('city', v)}
                      />
                      <Field label="Occupation (Optional)" value={form.occupation || ''} onChange={(v) => set('occupation', v)} />
                      <Field label="Company / Organization (Optional)" value={form.companyOrganization || ''} onChange={(v) => set('companyOrganization', v)} />
                    </div>
                    <MultiSelect label="Languages Known" options={LANGUAGE_OPTIONS} value={form.languagesKnown || []} onChange={(v) => set('languagesKnown', v)} />
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="profile-field-label">Relationship to Bride/Groom *</label>
                      <select className={`profile-input${errors.relationship ? ' profile-input-error' : ''}`} value={form.relationship || ''} onChange={(e) => set('relationship', e.target.value)}>
                        <option value="">Select relationship</option>
                        {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {errors.relationship && <p className="mt-1 text-xs text-red-500">{errors.relationship}</p>}
                    </div>
                    {form.relationship === 'Other' && (
                      <Field label="Relationship Name *" value={form.relationshipOther || ''} error={errors.relationshipOther} onChange={(v) => set('relationshipOther', v)} />
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <label className="profile-field-label">Managing Profile For *</label>
                    <select className={`profile-input${errors.managingProfileFor ? ' profile-input-error' : ''}`} value={form.managingProfileFor || ''} onChange={(e) => set('managingProfileFor', e.target.value)}>
                      <option value="">Select</option>
                      {MANAGING_PROFILE_FOR_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.managingProfileFor && <p className="mt-1 text-xs text-red-500">{errors.managingProfileFor}</p>}
                  </div>
                )}

                {step === 3 && (
                  <textarea
                    className="profile-input min-h-[140px] resize-y"
                    placeholder="I am the bride's father and I am managing her profile."
                    value={form.about || ''}
                    onChange={(e) => set('about', e.target.value)}
                  />
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    {(['allowPhoneCalls', 'allowWhatsApp', 'allowEmail'] as const).map((key) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-[#5D2B44]">
                        <input type="checkbox" checked={!!form[key]} onChange={(e) => set(key, e.target.checked)} className="rounded border-[#E5C8D5] text-[#B66A8A]" />
                        {key === 'allowPhoneCalls' ? 'Allow Phone Calls' : key === 'allowWhatsApp' ? 'Allow WhatsApp' : 'Allow Email'}
                      </label>
                    ))}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <UploadField label="Government ID" uploaded={form.governmentIdUrl} onClick={() => govIdRef.current?.click()} />
                    <input ref={govIdRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload('governmentId', e.target.files[0])} />
                    <UploadField label="Relationship Proof (Optional)" uploaded={form.relationshipProofUrl} onClick={() => proofRef.current?.click()} />
                    <input ref={proofRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleDocUpload('relationshipProof', e.target.files[0])} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 rounded-2xl border border-[#F2DFE8] bg-white p-4 shadow-sm">
              <button type="button" className="rounded-xl border border-[#D8B6C6] bg-white px-5 py-2.5 text-sm font-medium text-[#7B4A62] hover:bg-[#FFF5F8] disabled:opacity-40" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
                Previous
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-[#B66A8A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#A75878] disabled:opacity-60"
                disabled={saveMutation.isPending}
                onClick={goNext}
              >
                {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                {step < STEPS.length - 1 ? (
                  <>Next <ChevronRight size={16} /></>
                ) : (
                  <>Save Profile</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', error }: { label: string; value: string; onChange: (v: string) => void; type?: string; error?: string }) {
  return (
    <div>
      <label className="profile-field-label">{label}</label>
      <input type={type} className={`profile-input${error ? ' profile-input-error' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function UploadField({ label, uploaded, onClick }: { label: string; uploaded?: string; onClick: () => void }) {
  return (
    <div>
      <label className="profile-field-label">{label}</label>
      <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5C8D5] bg-[#FFFBFC] px-4 py-6 text-sm text-[#9A5776] hover:border-[#B66A8A]">
        <Upload size={16} />
        {uploaded ? 'Replace uploaded file' : 'Click to upload'}
      </button>
    </div>
  );
}
