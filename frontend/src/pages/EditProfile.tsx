import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import { Country, State, City } from 'country-state-city';

type ProfileForm = Record<string, any>;

const SECTIONS = [
  'Personal Details',
  'Horoscope Details',
  'Religion Details',
  'Marital Information',
  'Location',
  'Family Background',
  'Express Yourself',
  'Partner Preferences',
  'Lifestyle',
];

const HEIGHT_OPTIONS = Array.from({ length: 31 }).map((_, i) => {
  const total = 54 + i;
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return { label: `${ft}'${inch}"`, value: (total / 12).toFixed(2) };
});

const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Heavy'];
const COMPLEXIONS = ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce', 'Annulled'];
const FAMILY_TYPES = ['Nuclear Family', 'Joint Family', 'Extended Family'];
const FAMILY_STATUS = ['Middle Class', 'Upper Middle Class', 'Affluent', 'Rich'];
const EATING = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'];
const HABIT = ['Never', 'Occasionally', 'Frequently'];
const RELIGION_OPTIONS = [
  'Hindu',
  'Christian',
  'Jain',
  'Sikh',
  'Muslim',
  'Buddhist',
  'Jewish',
  'Parsi',
  'Spiritual - not religious',
  'No Religion',
  'Other',
];
const EDUCATION_OPTIONS = [
  'No Formal Education',
  'Primary School',
  'High School',
  'Intermediate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'MBA',
  'M.Tech',
  'MCA',
  'MBBS',
  'PhD',
  'Other',
];
const WORK_STATUS_OPTIONS = ['Student', 'Homemaker', 'Looking for Job', 'Business', 'Freelancer', 'Retired', 'Not Working', 'Other'];

function normalizeCompareValue(value: unknown) {
  if (value === '' || value === null || value === undefined) return null;
  return value;
}

function normalizeFormValue(value: unknown, fallback: unknown) {
  if (value === null || value === undefined) {
    if (Array.isArray(fallback)) return [];
    if (typeof fallback === 'boolean') return false;
    if (typeof fallback === 'number') return fallback;
    return '';
  }
  return value;
}

function calculateAge(dob?: string) {
  if (!dob) return '';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '';
  const t = new Date();
  let age = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
  return String(age);
}

function completion(form: ProfileForm) {
  const keys = ['firstName', 'lastName', 'gender', 'dateOfBirth', 'height', 'religion', 'maritalStatus', 'country', 'state', 'city', 'familyType', 'bio'];
  const done = keys.filter((k) => String(form[k] ?? '').trim().length > 0).length;
  return Math.round((done / keys.length) * 100);
}

export default function EditProfile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pendingPhotoFile = useRef<File | null>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoPreview, setPhotoPreview] = useState('');
  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    middleName: '',
    lastName: '',
    displayName: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    height: '',
    weight: '',
    bodyType: '',
    complexion: '',
    bloodGroup: '',
    physicalStatus: 'Normal',
    disabilityDetails: '',
    horoscopeAvailable: false,
    rashi: '',
    nakshatra: '',
    gothram: '',
    manglik: '',
    horoscope: '',
    timeOfBirth: '',
    placeOfBirth: '',
    horoscopeFileUrl: '',
    religion: '',
    religionOther: '',
    caste: '',
    subCaste: '',
    motherTongue: '',
    community: '',
    maritalStatus: '',
    yearsMarried: '',
    haveChildren: false,
    childrenLivingWith: '',
    readyForRemarriage: false,
    country: '',
    state: '',
    city: '',
    address: '',
    pincode: '',
    familyType: '',
    familyStatus: '',
    fatherName: '',
    fatherAlive: true,
    fatherOccupation: '',
    motherName: '',
    motherAlive: true,
    motherOccupation: '',
    siblings: 0,
    siblingDetails: [],
    bio: '',
    prefAgeMin: 21,
    prefAgeMax: 30,
    prefHeightMin: '',
    prefHeightMax: '',
    prefMaritalStatuses: [],
    prefReligions: [],
    prefCastes: [],
    prefCities: [],
    prefFamilyType: '',
    diet: '',
    drinking: '',
    smoking: '',
    highestQualification: '',
    qualificationOther: '',
    degreeName: '',
    specialization: '',
    collegeUniversity: '',
    passingYear: '',
    gradeCgpa: '',
    currentlyWorking: false,
    companyName: '',
    jobTitle: '',
    industry: '',
    annualIncome: '',
    yearsOfExperience: '',
    workLocation: '',
    currentStatus: '',
    currentStatusOther: '',
    photos: [],
  });
  const initialRef = useRef<ProfileForm>({});

  const { data: existing, isLoading } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/users/profile');
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (!existing) return;
    const merged = {
      ...form,
      ...existing,
      horoscope: existing.horoscope || existing.zodiacSign || '',
      age: calculateAge(existing.dateOfBirth),
      prefCities: existing.prefCities || existing.prefLocations || [],
      siblingDetails: existing.siblingDetails || [],
    };
    const next: ProfileForm = { ...merged };
    Object.keys(form).forEach((key) => {
      next[key] = normalizeFormValue(merged[key], form[key]);
    });
    setForm(next);
    initialRef.current = next;
    setPhotoPreview(getPhotoUrl(existing.photos?.[0] || ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  const sectionTitle = useMemo(() => SECTIONS[step], [step]);
  const countries = useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === form.country),
    [countries, form.country],
  );
  const states = useMemo(
    () => (selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []),
    [selectedCountry],
  );
  const selectedState = useMemo(
    () => states.find((s) => s.name === form.state),
    [states, form.state],
  );
  const cities = useMemo(
    () =>
      selectedCountry && selectedState
        ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
        : [],
    [selectedCountry, selectedState],
  );

  const update = (key: string, value: any) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'dateOfBirth') next.age = calculateAge(value);
      if (key === 'siblings') {
        const count = Number(value) || 0;
        const current = Array.isArray(prev.siblingDetails) ? [...prev.siblingDetails] : [];
        if (current.length > count) {
          next.siblingDetails = current.slice(0, count);
        } else {
          while (current.length < count) current.push({ relation: 'Brother', married: false });
          next.siblingDetails = current;
        }
      }
      if (key === 'country') {
        next.state = '';
        next.city = '';
      }
      if (key === 'state') {
        next.city = '';
      }
      if (key === 'religion' && value !== 'Other') {
        next.religionOther = '';
      }
      if (key === 'highestQualification' && value !== 'Other') {
        next.qualificationOther = '';
      }
      if (key === 'currentlyWorking') {
        if (value) {
          next.currentStatus = '';
          next.currentStatusOther = '';
        } else {
          next.occupation = '';
          next.companyName = '';
          next.jobTitle = '';
          next.industry = '';
          next.annualIncome = '';
          next.yearsOfExperience = '';
          next.workLocation = '';
        }
      }
      if (key === 'currentStatus' && value !== 'Other') {
        next.currentStatusOther = '';
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const updateSibling = (index: number, key: 'relation' | 'married', value: any) => {
    setForm((prev) => {
      const list = [...(prev.siblingDetails || [])];
      list[index] = { ...list[index], [key]: value };
      return { ...prev, siblingDetails: list };
    });
  };

  const handlePhotoUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    pendingPhotoFile.current = file;
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    ['firstName', 'lastName', 'dateOfBirth', 'height', 'religion', 'maritalStatus', 'country', 'state', 'city'].forEach((k) => {
      if (!String(form[k] ?? '').trim()) next[k] = 'Required';
    });
    if (form.religion === 'Other' && !String(form.religionOther || '').trim()) {
      next.religionOther = 'Please specify religion';
    }
    if (form.currentlyWorking && !String(form.occupation || '').trim()) {
      next.occupation = 'Occupation is required when currently working';
    }
    if (!form.currentlyWorking && !String(form.currentStatus || '').trim()) {
      next.currentStatus = 'Current status is required';
    }
    if (!form.currentlyWorking && form.currentStatus === 'Other' && !String(form.currentStatusOther || '').trim()) {
      next.currentStatusOther = 'Please specify current status';
    }
    if (form.physicalStatus === 'Differently Abled' && !String(form.disabilityDetails || '').trim()) {
      next.disabilityDetails = 'Please describe the disability';
    }
    if (form.horoscopeAvailable) {
      ['rashi', 'nakshatra', 'manglik', 'placeOfBirth'].forEach((k) => {
        if (!String(form[k] ?? '').trim()) next[k] = 'Required';
      });
    }
    if (form.maritalStatus === 'Divorced' && !form.yearsMarried) next.yearsMarried = 'Required';
    if (form.bio?.length > 1000) next.bio = 'Max 1000 characters';
    if (form.prefAgeMin > form.prefAgeMax) next.prefAgeMax = 'Max age must be greater than min age';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildSavePayload = (changed: ProfileForm): ProfileForm => {
    const payload: ProfileForm = {};
    const copyKeys = [
      'firstName', 'middleName', 'lastName', 'displayName', 'gender', 'dateOfBirth',
      'education', 'occupation', 'income',
      'height', 'weight', 'bodyType', 'complexion', 'bloodGroup', 'physicalStatus', 'disabilityDetails',
      'horoscopeAvailable', 'rashi', 'nakshatra', 'gothram', 'manglik', 'horoscope',
      'timeOfBirth', 'placeOfBirth', 'horoscopeFileUrl',
      'religion', 'religionOther', 'caste', 'subCaste', 'motherTongue', 'community',
      'maritalStatus', 'yearsMarried', 'haveChildren', 'childrenLivingWith', 'readyForRemarriage',
      'address', 'pincode', 'familyType', 'familyStatus', 'fatherName', 'fatherAlive', 'fatherOccupation',
      'motherName', 'motherAlive', 'motherOccupation', 'siblings', 'siblingDetails',
      'bio', 'prefAgeMin', 'prefAgeMax', 'prefHeightMin', 'prefHeightMax',
      'prefMaritalStatuses', 'prefReligions', 'prefCastes', 'prefCities', 'prefFamilyType',
      'highestQualification', 'qualificationOther', 'degreeName', 'specialization', 'collegeUniversity', 'passingYear', 'gradeCgpa',
      'currentlyWorking', 'companyName', 'jobTitle', 'industry', 'annualIncome', 'yearsOfExperience', 'workLocation', 'currentStatus', 'currentStatusOther',
      'diet', 'drinking', 'smoking', 'photos',
    ];

    copyKeys.forEach((key) => {
      if (changed[key] !== undefined) payload[key] = changed[key];
    });

    if (changed.horoscope !== undefined) {
      payload.zodiacSign = changed.horoscope;
    }

    const numberFields = ['height', 'prefAgeMin', 'prefAgeMax', 'prefHeightMin', 'prefHeightMax', 'siblings'];
    numberFields.forEach((key) => {
      if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
        delete payload[key];
        return;
      }
      const num = Number(payload[key]);
      if (Number.isNaN(num)) delete payload[key];
      else payload[key] = num;
    });

    if (
      changed.city !== undefined ||
      changed.state !== undefined ||
      changed.country !== undefined ||
      changed.pincode !== undefined ||
      changed.address !== undefined
    ) {
      payload.location = {
        city: form.city || '',
        state: form.state || '',
        country: form.country || '',
        pincode: form.pincode || '',
      };
    }

    Object.keys(payload).forEach((key) => {
      const val = payload[key];
      if (val === '' || val === null || val === undefined) delete payload[key];
    });

    if (Array.isArray(payload.photos)) {
      payload.photos = payload.photos.filter((p: string) => p && !String(p).startsWith('data:'));
      if (!payload.photos.length) delete payload.photos;
    }

    if (payload.location && typeof payload.location === 'object') {
      const loc = payload.location as Record<string, string>;
      const hasValue = Object.values(loc).some((v) => String(v || '').trim());
      if (!hasValue) delete payload.location;
    }

    return payload;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error('Please fix validation errors.');
      const changed: ProfileForm = {};
      const ignoreKeys = new Set([
        'age', 'wizardProfile', 'id', 'userId', 'createdAt', 'updatedAt',
        'isComplete', 'isVisible', 'isVerified',
        'educationList', 'experience', 'expressYourself', 'languagesKnown', 'resumeUrl',
        'preferences', 'location', 'prefLocations', 'prefEducation', 'prefDiet',
        'brothers', 'marriedBrothers', 'sisters', 'marriedSisters', 'familyValues', 'zodiacSign',
      ]);
      Object.keys(form).forEach((k) => {
        if (ignoreKeys.has(k)) return;
        const before = JSON.stringify(normalizeCompareValue(initialRef.current[k]));
        const now = JSON.stringify(normalizeCompareValue(form[k]));
        if (before !== now) changed[k] = form[k];
      });
      if (Object.keys(changed).length === 0 && !pendingPhotoFile.current) return existing;

      if (pendingPhotoFile.current) {
        const formData = new FormData();
        formData.append('profilePhoto', pendingPhotoFile.current);
        const { data: photoData } = await api.post('/users/profile/photo', formData);
        changed.photos = [photoData.url];
        pendingPhotoFile.current = null;
      }

      if (changed.photos?.[0]?.startsWith?.('data:')) {
        delete changed.photos;
      }

      const payload = buildSavePayload(changed);
      if (Object.keys(payload).length === 0) {
        if (changed.photos?.length) {
          const { data } = await api.get('/users/profile');
          return data;
        }
        return existing;
      }

      const { data } = await api.put('/users/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      initialRef.current = { ...form, ...(data || {}) };
      queryClient.setQueryData(['myProfile'], data);
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-for-match-filter'] });
      queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
      toast.success('Profile updated successfully');
      navigate('/app/profile');
    },
    onError: (error: any) => {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      toast.error(Array.isArray(backendMessage) ? backendMessage.join(', ') : (backendMessage || 'Unable to save profile'));
    },
  });

  if (isLoading) return <div className="text-center py-10 text-gray-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Edit Profile</h1>
            <p className="text-sm text-gray-500">
              Step {step + 1} of {SECTIONS.length}: {sectionTitle}
            </p>
          </div>
          <div className="min-w-[180px]">
            <div className="flex justify-between text-xs mb-1">
              <span>Profile Completion</span>
              <span className="font-semibold text-primary-600">{completion(form)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-2 bg-primary-600 rounded-full transition-all" style={{ width: `${completion(form)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 overflow-hidden flex items-center justify-center">
                {photoPreview ? <img src={photoPreview} alt="Profile preview" className="w-full h-full object-cover" /> : '👤'}
              </div>
              <input type="file" accept="image/*" className="input-field" aria-label="Upload profile photo" title="Upload profile photo" onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)} />
            </div>
            {['firstName', 'middleName', 'lastName', 'displayName'].map((k) => (
              <input key={k} className="input-field" placeholder={k.replace(/([A-Z])/g, ' $1')} value={form[k] || ''} onChange={(e) => update(k, e.target.value)} />
            ))}
            <select className="input-field" value={form.gender || ''} onChange={(e) => update('gender', e.target.value)} aria-label="Gender">
              <option value="">Select Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
            </select>
            <input type="date" className="input-field" aria-label="Date of Birth" title="Date of Birth" value={form.dateOfBirth || ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
            <input className="input-field" value={form.age || ''} readOnly placeholder="Age" />
            <select className="input-field" value={form.height || ''} onChange={(e) => update('height', Number(e.target.value))} aria-label="Height">
              <option value="">Select Height</option>{HEIGHT_OPTIONS.map((h) => <option key={h.label} value={h.value}>{h.label}</option>)}
            </select>
            <input className="input-field" placeholder="Weight" value={form.weight || ''} onChange={(e) => update('weight', e.target.value)} />
            <select className="input-field" value={form.bodyType || ''} onChange={(e) => update('bodyType', e.target.value)} aria-label="Body Type">
              <option value="">Body Type</option>{BODY_TYPES.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.complexion || ''} onChange={(e) => update('complexion', e.target.value)} aria-label="Complexion">
              <option value="">Complexion</option>{COMPLEXIONS.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.bloodGroup || ''} onChange={(e) => update('bloodGroup', e.target.value)} aria-label="Blood Group">
              <option value="">Blood Group</option>{BLOOD_GROUPS.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.physicalStatus || 'Normal'} onChange={(e) => update('physicalStatus', e.target.value)} aria-label="Physical Status">
              <option value="Normal">Normal</option>
              <option value="Differently Abled">Differently Abled</option>
            </select>
            {form.physicalStatus === 'Differently Abled' && (
              <textarea className="input-field md:col-span-2 min-h-[90px]" placeholder="Describe disability" value={form.disabilityDetails || ''} onChange={(e) => update('disabilityDetails', e.target.value)} />
            )}
            <div className="md:col-span-2 mt-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Education Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select className="input-field" value={form.highestQualification || ''} onChange={(e) => update('highestQualification', e.target.value)} aria-label="Highest Qualification">
                  <option value="">Highest Qualification</option>
                  {EDUCATION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                {form.highestQualification === 'Other' && (
                  <input className="input-field" placeholder="Specify qualification" value={form.qualificationOther || ''} onChange={(e) => update('qualificationOther', e.target.value)} />
                )}
                <input className="input-field" placeholder="Degree Name" value={form.degreeName || ''} onChange={(e) => update('degreeName', e.target.value)} />
                <input className="input-field" placeholder="Specialization" value={form.specialization || ''} onChange={(e) => update('specialization', e.target.value)} />
                <input className="input-field" placeholder="College / University" value={form.collegeUniversity || ''} onChange={(e) => update('collegeUniversity', e.target.value)} />
                <input className="input-field" placeholder="Passing Year" value={form.passingYear || ''} onChange={(e) => update('passingYear', e.target.value)} />
                <input className="input-field" placeholder="Grade / CGPA (Optional)" value={form.gradeCgpa || ''} onChange={(e) => update('gradeCgpa', e.target.value)} />
              </div>
            </div>
            <div className="md:col-span-2 mt-2 border border-gray-100 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Work History</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="currentlyWorking" checked={form.currentlyWorking === true} onChange={() => update('currentlyWorking', true)} />
                  Yes, currently working
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="currentlyWorking" checked={form.currentlyWorking === false} onChange={() => update('currentlyWorking', false)} />
                  No
                </label>
              </div>
              {form.currentlyWorking ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input-field" placeholder="Occupation *" value={form.occupation || ''} onChange={(e) => update('occupation', e.target.value)} />
                  <input className="input-field" placeholder="Company Name" value={form.companyName || ''} onChange={(e) => update('companyName', e.target.value)} />
                  <input className="input-field" placeholder="Job Title" value={form.jobTitle || ''} onChange={(e) => update('jobTitle', e.target.value)} />
                  <input className="input-field" placeholder="Industry" value={form.industry || ''} onChange={(e) => update('industry', e.target.value)} />
                  <input className="input-field" placeholder="Annual Income" value={form.annualIncome || ''} onChange={(e) => update('annualIncome', e.target.value)} />
                  <input className="input-field" placeholder="Years of Experience" value={form.yearsOfExperience || ''} onChange={(e) => update('yearsOfExperience', e.target.value)} />
                  <input className="input-field md:col-span-2" placeholder="Work Location" value={form.workLocation || ''} onChange={(e) => update('workLocation', e.target.value)} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select className="input-field" value={form.currentStatus || ''} onChange={(e) => update('currentStatus', e.target.value)} aria-label="Current Status">
                    <option value="">Current Status *</option>
                    {WORK_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {form.currentStatus === 'Other' && (
                    <input className="input-field" placeholder="Specify current status" value={form.currentStatusOther || ''} onChange={(e) => update('currentStatusOther', e.target.value)} />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input-field" value={String(form.horoscopeAvailable)} onChange={(e) => update('horoscopeAvailable', e.target.value === 'true')} aria-label="Horoscope Available">
              <option value="false">Horoscope Not Available</option>
              <option value="true">Horoscope Available</option>
            </select>
            {form.horoscopeAvailable && (
              <>
                <input className="input-field" placeholder="Rashi" value={form.rashi || ''} onChange={(e) => update('rashi', e.target.value)} />
                <input className="input-field" placeholder="Nakshatra" value={form.nakshatra || ''} onChange={(e) => update('nakshatra', e.target.value)} />
                <input className="input-field" placeholder="Gothram" value={form.gothram || ''} onChange={(e) => update('gothram', e.target.value)} />
                <select className="input-field" value={form.manglik || ''} onChange={(e) => update('manglik', e.target.value)} aria-label="Manglik">
                  <option value="">Manglik</option><option>Yes</option><option>No</option><option>Don't Know</option>
                </select>
                <input className="input-field" placeholder="Zodiac Sign" value={form.horoscope || ''} onChange={(e) => update('horoscope', e.target.value)} />
                <input type="time" className="input-field" aria-label="Time of Birth" title="Time of Birth" value={form.timeOfBirth || ''} onChange={(e) => update('timeOfBirth', e.target.value)} />
                <input className="input-field" placeholder="Place of Birth" value={form.placeOfBirth || ''} onChange={(e) => update('placeOfBirth', e.target.value)} />
                <input type="file" accept=".pdf,image/*" className="input-field" aria-label="Upload horoscope document" title="Upload horoscope document" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) update('horoscopeFileUrl', file.name);
                }} />
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input-field" value={form.religion || ''} onChange={(e) => update('religion', e.target.value)} aria-label="Religion">
              <option value="">Select Religion</option>
              {RELIGION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
            {form.religion === 'Other' && (
              <input className="input-field" placeholder="Please specify your religion" value={form.religionOther || ''} onChange={(e) => update('religionOther', e.target.value)} />
            )}
            <input className="input-field" placeholder="Caste" value={form.caste || ''} onChange={(e) => update('caste', e.target.value)} />
            <input className="input-field" placeholder="Sub Caste" value={form.subCaste || ''} onChange={(e) => update('subCaste', e.target.value)} />
            <input className="input-field" placeholder="Mother Tongue" value={form.motherTongue || ''} onChange={(e) => update('motherTongue', e.target.value)} />
            <input className="input-field md:col-span-2" placeholder="Community" value={form.community || ''} onChange={(e) => update('community', e.target.value)} />
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input-field" value={form.maritalStatus || ''} onChange={(e) => update('maritalStatus', e.target.value)} aria-label="Marital Status">
              <option value="">Marital Status</option>{MARITAL_OPTIONS.map((v) => <option key={v}>{v}</option>)}
            </select>
            {form.maritalStatus === 'Divorced' && (
              <>
                <input className="input-field" placeholder="Number of Years Married" value={form.yearsMarried || ''} onChange={(e) => update('yearsMarried', e.target.value)} />
                <select className="input-field" value={String(form.haveChildren)} onChange={(e) => update('haveChildren', e.target.value === 'true')} aria-label="Have Children">
                  <option value="false">Have Children: No</option><option value="true">Have Children: Yes</option>
                </select>
                <input className="input-field" placeholder="Children Living With" value={form.childrenLivingWith || ''} onChange={(e) => update('childrenLivingWith', e.target.value)} />
                <select className="input-field" value={String(form.readyForRemarriage)} onChange={(e) => update('readyForRemarriage', e.target.value === 'true')} aria-label="Ready for Remarriage">
                  <option value="true">Ready for Remarriage: Yes</option><option value="false">Ready for Remarriage: No</option>
                </select>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input list="countries-list" className="input-field" placeholder="Country" value={form.country || ''} onChange={(e) => update('country', e.target.value)} />
            <datalist id="countries-list">
              {countries.map((c) => <option key={c.isoCode} value={c.name} />)}
            </datalist>
            <input list="states-list" className="input-field" placeholder="State" value={form.state || ''} onChange={(e) => update('state', e.target.value)} disabled={!form.country} />
            <datalist id="states-list">
              {states.map((s) => <option key={s.isoCode} value={s.name} />)}
            </datalist>
            <input list="cities-list" className="input-field" placeholder="City" value={form.city || ''} onChange={(e) => update('city', e.target.value)} disabled={!form.state} />
            <datalist id="cities-list">
              {cities.map((c) => <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name} />)}
            </datalist>
            <input className="input-field" placeholder="Pincode" value={form.pincode || ''} onChange={(e) => update('pincode', e.target.value)} />
            <textarea className="input-field min-h-[120px] md:col-span-2" placeholder="Current Address" value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
          </div>
        )}

        {step === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input-field" value={form.familyType || ''} onChange={(e) => update('familyType', e.target.value)} aria-label="Family Type">
              <option value="">Family Type</option>{FAMILY_TYPES.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.familyStatus || ''} onChange={(e) => update('familyStatus', e.target.value)} aria-label="Family Status">
              <option value="">Family Status</option>{FAMILY_STATUS.map((v) => <option key={v}>{v}</option>)}
            </select>
            <input className="input-field" placeholder="Father's Name" value={form.fatherName || ''} onChange={(e) => update('fatherName', e.target.value)} />
            <select className="input-field" value={String(form.fatherAlive)} onChange={(e) => update('fatherAlive', e.target.value === 'true')} aria-label="Father Alive">
              <option value="true">Father Alive: Yes</option><option value="false">Father Alive: No</option>
            </select>
            <textarea className="input-field min-h-[90px]" placeholder="Father's Profession" value={form.fatherOccupation || ''} onChange={(e) => update('fatherOccupation', e.target.value)} />
            <input className="input-field" placeholder="Mother's Name" value={form.motherName || ''} onChange={(e) => update('motherName', e.target.value)} />
            <select className="input-field" value={String(form.motherAlive)} onChange={(e) => update('motherAlive', e.target.value === 'true')} aria-label="Mother Alive">
              <option value="true">Mother Alive: Yes</option><option value="false">Mother Alive: No</option>
            </select>
            <textarea className="input-field min-h-[90px]" placeholder="Mother's Profession" value={form.motherOccupation || ''} onChange={(e) => update('motherOccupation', e.target.value)} />
            <input type="number" min="0" className="input-field" placeholder="No. of Siblings" value={form.siblings ?? 0} onChange={(e) => update('siblings', Number(e.target.value))} />
            {(form.siblingDetails || []).map((s: any, idx: number) => (
              <div key={idx} className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-100 rounded-lg p-3">
                <select className="input-field" value={s.relation || 'Brother'} onChange={(e) => updateSibling(idx, 'relation', e.target.value)} aria-label={`Sibling ${idx + 1} Relation`}>
                  <option>Brother</option><option>Sister</option>
                </select>
                <select className="input-field" value={String(!!s.married)} onChange={(e) => updateSibling(idx, 'married', e.target.value === 'true')} aria-label={`Sibling ${idx + 1} Married`}>
                  <option value="false">Married: No</option><option value="true">Married: Yes</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {step === 6 && (
          <div>
            <textarea className="input-field min-h-[180px]" placeholder="Tell us about yourself, your personality, career, hobbies, family values, lifestyle, and what kind of life partner you are looking for." value={form.bio || ''} onChange={(e) => update('bio', e.target.value.slice(0, 1000))} />
            <p className="text-xs text-gray-500 mt-1">{1000 - (form.bio?.length || 0)} characters remaining</p>
          </div>
        )}

        {step === 7 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select className="input-field" value={form.prefAgeMin} onChange={(e) => update('prefAgeMin', Number(e.target.value))} aria-label="Preferred Min Age">
              {Array.from({ length: 53 }).map((_, i) => <option key={i} value={18 + i}>Min Age: {18 + i}</option>)}
            </select>
            <select className="input-field" value={form.prefAgeMax} onChange={(e) => update('prefAgeMax', Number(e.target.value))} aria-label="Preferred Max Age">
              {Array.from({ length: 53 }).map((_, i) => <option key={i} value={18 + i}>Max Age: {18 + i}</option>)}
            </select>
            <select className="input-field" value={form.prefHeightMin || ''} onChange={(e) => update('prefHeightMin', Number(e.target.value))} aria-label="Preferred Height From">
              <option value="">Preferred Height From</option>{HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
            <select className="input-field" value={form.prefHeightMax || ''} onChange={(e) => update('prefHeightMax', Number(e.target.value))} aria-label="Preferred Height To">
              <option value="">Preferred Height To</option>{HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
            <input className="input-field" placeholder="Preferred Marital Status (comma separated)" value={(form.prefMaritalStatuses || []).join(', ')} onChange={(e) => update('prefMaritalStatuses', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
            <input className="input-field" placeholder="Preferred Religion (comma separated)" value={(form.prefReligions || []).join(', ')} onChange={(e) => update('prefReligions', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
            <input className="input-field" placeholder="Preferred Caste (comma separated)" value={(form.prefCastes || []).join(', ')} onChange={(e) => update('prefCastes', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
            <input className="input-field" placeholder="Preferred Cities (comma separated)" value={(form.prefCities || []).join(', ')} onChange={(e) => update('prefCities', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} />
            <select className="input-field" value={form.prefFamilyType || ''} onChange={(e) => update('prefFamilyType', e.target.value)} aria-label="Preferred Family Type">
              <option value="">Preferred Family Type</option><option>Nuclear Family</option><option>Joint Family</option><option>Doesn't Matter</option>
            </select>
          </div>
        )}

        {step === 8 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select className="input-field" value={form.diet || ''} onChange={(e) => update('diet', e.target.value)} aria-label="Eating Habit">
              <option value="">Eating Habit</option>{EATING.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.drinking || ''} onChange={(e) => update('drinking', e.target.value)} aria-label="Drinking Habit">
              <option value="">Drinking Habit</option>{HABIT.map((v) => <option key={v}>{v}</option>)}
            </select>
            <select className="input-field" value={form.smoking || ''} onChange={(e) => update('smoking', e.target.value)} aria-label="Smoking Habit">
              <option value="">Smoking Habit</option>{HABIT.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
        )}

        {Object.values(errors).some(Boolean) && (
          <div className="text-xs text-red-500">Please fix the required fields before saving.</div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3">
          <Link to="/app/profile" className="btn-secondary flex items-center gap-2"><X size={16} /> Cancel</Link>
          <button className="btn-secondary flex items-center gap-2" onClick={() => setForm(initialRef.current)}><RotateCcw size={16} /> Reset</button>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>Previous</button>
          {step < SECTIONS.length - 1 ? (
            <button className="btn-primary" onClick={() => setStep((s) => Math.min(SECTIONS.length - 1, s + 1))}>Next</button>
          ) : (
            <button className="btn-primary flex items-center gap-2" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
