import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { getPhotoUrl } from '../../lib/profileUtils';
import MultiSelect from '../../components/profile/MultiSelect';
import {
  INDIAN_CITIES,
  INDIAN_STATES,
  PRICING_RANGE_OPTIONS,
  VENDOR_CATEGORY_OPTIONS,
} from '../../lib/profileTypeOptions';
import { sanitizeProfilePayload } from '../../lib/sanitizePayload';
import type { VendorProfile } from '../../types/extendedProfiles';

const emptyForm: Partial<VendorProfile> = {
  businessName: '',
  ownerName: '',
  category: '',
  categoryOther: '',
  businessDescription: '',
  yearsOfExperience: undefined,
  teamSize: undefined,
  pricingRange: '',
  serviceCities: [],
  serviceStates: [],
  businessAddress: '',
  googleMapsLocation: '',
  mobileNumber: '',
  email: '',
  website: '',
  instagram: '',
  facebook: '',
  whatsapp: '',
  gstNumber: '',
  portfolioPhotos: [],
  portfolioVideos: [],
  awards: [],
  certificates: [],
};

export default function EditVendorProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const govIdRef = useRef<HTMLInputElement>(null);
  const regRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendor-profile-me'],
    queryFn: async () => {
      const { data: res } = await api.get('/vendor-profiles/me');
      return res as VendorProfile | null;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({ ...emptyForm, ...data });
      setLogoPreview(data.businessLogo || '');
      setBannerPreview(data.businessBanner || '');
    }
  }, [data]);

  const set = (key: keyof VendorProfile, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const uploadFile = async (field: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: res } = await api.post(`/vendor-profiles/me/upload/${field}`, formData);
    return res as { url: string; profile: VendorProfile };
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = sanitizeProfilePayload({
        ...form,
        businessName: form.businessName?.trim(),
        category: form.category,
      } as Record<string, unknown>);
      if (data?.id) {
        const { data: res } = await api.put('/vendor-profiles/me', payload);
        return res;
      }
      const { data: res } = await api.post('/vendor-profiles', payload);
      return res;
    },
    onSuccess: (res) => {
      queryClient.setQueryData(['vendor-profile-me'], res);
      queryClient.invalidateQueries({ queryKey: ['vendor-profile'] });
      toast.success('Business profile saved');
      navigate(`/app/profile/vendor/${res.id}`);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg || 'Failed to save profile');
    },
  });

  const handleUpload = async (field: string, file: File, preview?: (url: string) => void) => {
    try {
      const res = await uploadFile(field, file);
      if (preview) preview(res.url);
      if (field === 'businessLogo') set('businessLogo', res.url);
      if (field === 'businessBanner') set('businessBanner', res.url);
      if (field === 'governmentId') set('governmentIdUrl', res.url);
      if (field === 'businessRegistration') set('businessRegistrationUrl', res.url);
      if (field === 'portfolioPhoto') set('portfolioPhotos', res.profile.portfolioPhotos);
      if (field === 'portfolioVideo') set('portfolioVideos', res.profile.portfolioVideos);
      if (field === 'certificate') set('certificates', res.profile.certificates);
      toast.success('Uploaded successfully');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#B66A8A]" size={32} />
      </div>
    );
  }

  return (
    <div className="soft-fade-in mx-auto max-w-3xl space-y-6 pb-10">
      <Link to="/app/profile/vendor/me" className="inline-flex items-center gap-2 text-[#B66A8A] hover:underline">
        <ArrowLeft size={16} /> Back to Profile
      </Link>

      <div className="overflow-hidden rounded-3xl border border-[#F2DFE8] bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF] px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A5776]">Vendor</p>
          <h1 className="font-display text-2xl font-bold text-[#5D2B44]">Edit Business Profile</h1>
        </div>

        <form
          className="space-y-8 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.businessName?.trim()) {
              toast.error('Business name is required');
              return;
            }
            if (!form.category) {
              toast.error('Vendor category is required');
              return;
            }
            saveMutation.mutate();
          }}
        >
          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Business Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUpload label="Business Logo" preview={logoPreview} onClick={() => logoRef.current?.click()} />
              <ImageUpload label="Business Banner" preview={bannerPreview} wide onClick={() => bannerRef.current?.click()} />
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('businessLogo', e.target.files[0], setLogoPreview)} />
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('businessBanner', e.target.files[0], setBannerPreview)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name *" value={form.businessName || ''} onChange={(v) => set('businessName', v)} />
              <Field label="Owner Name" value={form.ownerName || ''} onChange={(v) => set('ownerName', v)} />
            </div>
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Vendor Category</h2>
            <div>
              <label className="profile-field-label">Category *</label>
              <select className="profile-input" value={form.category || ''} onChange={(e) => set('category', e.target.value)}>
                <option value="">Select category</option>
                {VENDOR_CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {form.category === 'Other' && (
              <Field label="Business Category" value={form.categoryOther || ''} onChange={(v) => set('categoryOther', v)} />
            )}
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Business Details</h2>
            <div>
              <label className="profile-field-label">Business Description</label>
              <textarea className="profile-input min-h-[100px]" value={form.businessDescription || ''} onChange={(e) => set('businessDescription', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Years of Experience" type="number" value={String(form.yearsOfExperience ?? '')} onChange={(v) => set('yearsOfExperience', v ? Number(v) : undefined)} />
              <Field label="Team Size" type="number" value={String(form.teamSize ?? '')} onChange={(v) => set('teamSize', v ? Number(v) : undefined)} />
              <div>
                <label className="profile-field-label">Pricing Range</label>
                <select className="profile-input" value={form.pricingRange || ''} onChange={(e) => set('pricingRange', e.target.value)}>
                  <option value="">Select</option>
                  {PRICING_RANGE_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Service Locations</h2>
            <MultiSelect label="Cities" options={INDIAN_CITIES} value={form.serviceCities || []} onChange={(v) => set('serviceCities', v)} />
            <MultiSelect label="States" options={INDIAN_STATES} value={form.serviceStates || []} onChange={(v) => set('serviceStates', v)} />
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Contact Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Address" value={form.businessAddress || ''} onChange={(v) => set('businessAddress', v)} />
              <Field label="Google Maps Location" value={form.googleMapsLocation || ''} onChange={(v) => set('googleMapsLocation', v)} />
              <Field label="Mobile Number" value={form.mobileNumber || ''} onChange={(v) => set('mobileNumber', v)} />
              <Field label="Email" type="email" value={form.email || ''} onChange={(v) => set('email', v)} />
              <Field label="Website" value={form.website || ''} onChange={(v) => set('website', v)} />
              <Field label="Instagram" value={form.instagram || ''} onChange={(v) => set('instagram', v)} />
              <Field label="Facebook" value={form.facebook || ''} onChange={(v) => set('facebook', v)} />
              <Field label="WhatsApp" value={form.whatsapp || ''} onChange={(v) => set('whatsapp', v)} />
            </div>
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Portfolio</h2>
            <UploadBtn label="Add Business Photo" onClick={() => photoRef.current?.click()} />
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('portfolioPhoto', e.target.files[0])} />
            <UploadBtn label="Add Video" onClick={() => videoRef.current?.click()} />
            <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('portfolioVideo', e.target.files[0])} />
            {form.portfolioPhotos?.length ? (
              <div className="grid grid-cols-3 gap-2">
                {form.portfolioPhotos.map((url) => (
                  <img key={url} src={getPhotoUrl(url)} alt="" className="h-20 w-full rounded-lg object-cover" />
                ))}
              </div>
            ) : null}
          </section>

          <section className="profile-section-card space-y-4">
            <h2 className="font-display text-lg font-semibold text-[#5D2B44]">Business Verification</h2>
            <Field label="GST Number (Optional)" value={form.gstNumber || ''} onChange={(v) => set('gstNumber', v)} />
            <UploadBtn label="Government ID" onClick={() => govIdRef.current?.click()} uploaded={!!form.governmentIdUrl} />
            <input ref={govIdRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('governmentId', e.target.files[0])} />
            <UploadBtn label="Business Registration (Optional)" onClick={() => regRef.current?.click()} uploaded={!!form.businessRegistrationUrl} />
            <input ref={regRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('businessRegistration', e.target.files[0])} />
            <UploadBtn label="Certificate (Optional)" onClick={() => certRef.current?.click()} />
            <input ref={certRef} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload('certificate', e.target.files[0])} />
          </section>

          <button type="submit" disabled={saveMutation.isPending} className="btn-primary w-full disabled:opacity-50">
            {saveMutation.isPending ? 'Saving...' : 'Save Business Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="profile-field-label">{label}</label>
      <input type={type} className="profile-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageUpload({ label, preview, onClick, wide }: { label: string; preview: string; onClick: () => void; wide?: boolean }) {
  return (
    <div>
      <label className="profile-field-label">{label}</label>
      <button type="button" onClick={onClick} className={`flex w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#E5C8D5] bg-[#FFFBFC] ${wide ? 'h-24' : 'h-20'}`}>
        {preview ? <img src={getPhotoUrl(preview)} alt="" className="h-full w-full object-cover" /> : <Upload size={20} className="text-[#9A5776]" />}
      </button>
    </div>
  );
}

function UploadBtn({ label, onClick, uploaded }: { label: string; onClick: () => void; uploaded?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5C8D5] bg-white px-4 py-3 text-sm text-[#5D2B44] hover:bg-[#FFF5F8]">
      <Upload size={14} />
      {uploaded ? `${label} — uploaded` : label}
    </button>
  );
}
