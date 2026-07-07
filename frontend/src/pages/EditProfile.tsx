import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import {
  Loader2,
  RotateCcw,
  Save,
  X,
  User,
  Star,
  BookOpen,
  Heart,
  MapPin,
  Users,
  Quote,
  HeartHandshake,
  Leaf,
  Camera,
  ChevronRight,
  Check,
  GraduationCap,
  Briefcase,
  Lock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { getPhotoUrl } from '../lib/profileUtils';
import { Country, State, City } from 'country-state-city';
import {
  RELIGION_OPTIONS,
  getCastesForReligion,
  getSubCastesForCaste,
  MOTHER_TONGUE_OPTIONS,
  COMMUNITY_OPTIONS,
  PARTNER_MARITAL_OPTIONS,
} from '../lib/religionCasteOptions';
import {
  MARITAL_STATUS_OPTIONS,
  CHILDREN_MARITAL_STATUSES,
} from '../lib/maritalStatusOptions';
import {
  EDIT_SECTIONS as SECTIONS,
  SECTION_ERROR_FIELDS,
  getMaxUnlockedStep,
  getMissingBySection,
  isSectionValid,
  profileCompletion,
  sectionHasErrors,
  validateSectionFields,
  type ProfileForm,
} from '../lib/profileEditValidation';

const SECTION_META: Record<(typeof SECTIONS)[number], { icon: typeof User; desc: string }> = {
  'Personal Details': { icon: User, desc: 'Your name, photo, and basic information' },
  'Horoscope Details': { icon: Star, desc: 'Astrological details and birth information' },
  'Religion Details': { icon: BookOpen, desc: 'Religion, caste, and community' },
  'Marital Information': { icon: Heart, desc: 'Marital status and family planning' },
  Location: { icon: MapPin, desc: 'Where you live and grew up' },
  'Family Background': { icon: Users, desc: 'Parents, siblings, and family values' },
  'Express Yourself': { icon: Quote, desc: 'Tell your story in your own words' },
  'Partner Preferences': { icon: HeartHandshake, desc: 'What you look for in a partner' },
  Lifestyle: { icon: Leaf, desc: 'Diet, drinking, and smoking habits' },
};

const FIELD_LABEL =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#9A5776]';

const INPUT_BASE =
  'w-full rounded-xl border border-[#E5C8D5] bg-[#FFFBFC] px-4 py-2.5 text-sm text-[#5D2B44] placeholder:text-[#C4A0B0] focus:border-[#B66A8A] focus:bg-white focus:ring-2 focus:ring-[#F4D8E4] outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50';

const INPUT_ERROR = 'border-red-300 focus:border-red-400 focus:ring-red-100';

const SECTION_CARD =
  'rounded-2xl border border-[#F2DFE8] bg-gradient-to-br from-[#FFFBFC] to-[#FFF8FB] p-5 shadow-sm';

function FormField({
  label,
  htmlFor,
  error,
  required,
  colSpan,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  colSpan?: 2;
  children: ReactNode;
}) {
  return (
    <div className={colSpan === 2 ? 'md:col-span-2' : undefined}>
      <label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
        {required && <span className="text-[#B66A8A]"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon?: typeof User; children: ReactNode }) {
  return (
    <div className={`${SECTION_CARD} md:col-span-2`}>
      <div className="mb-4 flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0F5] text-[#B66A8A]">
            <Icon size={17} />
          </div>
        )}
        <div>
          <h3 className="font-display text-base font-semibold text-[#523045]">{title}</h3>
          {subtitle && <p className="text-xs text-[#9A5776]">{subtitle}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function inputClass(error?: string) {
  return `${INPUT_BASE}${error ? ` ${INPUT_ERROR}` : ''}`;
}

const HEIGHT_OPTIONS = Array.from({ length: 31 }).map((_, i) => {
  const total = 54 + i;
  const ft = Math.floor(total / 12);
  const inch = total % 12;
  return { label: `${ft}'${inch}"`, value: (total / 12).toFixed(2) };
});

const COMPLEXIONS = ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Brown', 'Dark'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const YEARS_MARRIED_OPTIONS = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '6-10 years',
  '11-15 years',
  '16-20 years',
  'More than 20 years',
];
const CHILD_COUNT_OPTIONS = ['0', '1', '2', '3', '4', '5', '6+'];
const CHILDREN_LIVING_WITH_OPTIONS = ['Mother', 'Father', 'Shared Custody', 'Relatives', 'Others'];
const FAMILY_TYPES = ['Nuclear Family', 'Joint Family', 'Extended Family'];
const FAMILY_STATUS = ['Middle Class', 'Upper Middle Class', 'Affluent', 'Rich'];
const EATING = ['Vegetarian', 'Eggetarian', 'Non-Vegetarian', 'Vegan'];
const HABIT = ['Never', 'Occasionally', 'Frequently'];
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

export default function EditProfile({ managedMode = false }: { managedMode?: boolean }) {
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
    complexion: '',
    bloodGroup: '',
    phone: '',
    email: '',
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
    childrenBoys: '',
    childrenGirls: '',
    childrenLivingWith: '',
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
      phone: existing.phone || existing.wizardProfile?.personalDetails?.phone || '',
      email: existing.email || existing.wizardProfile?.personalDetails?.email || '',
      horoscope: existing.horoscope || existing.zodiacSign || '',
      age: calculateAge(existing.dateOfBirth),
      prefCities: existing.prefCities || existing.prefLocations || [],
      siblingDetails: existing.siblingDetails || [],
    };
    const next: ProfileForm = { ...merged };
    Object.keys(form).forEach((key) => {
      next[key] = normalizeFormValue(merged[key], form[key]);
    });
    if (next.childrenBoys !== '' && next.childrenBoys !== null && next.childrenBoys !== undefined) {
      next.childrenBoys = String(next.childrenBoys);
    }
    if (next.childrenGirls !== '' && next.childrenGirls !== null && next.childrenGirls !== undefined) {
      next.childrenGirls = String(next.childrenGirls);
    }
    setForm(next);
    initialRef.current = next;
    setPhotoPreview(getPhotoUrl(existing.photos?.[0] || ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing]);

  useEffect(() => {
    if (!managedMode || existing?.gender) return;
    api.get('/representative-profiles/me').then(({ data }) => {
      if (!data?.managingProfileFor) return;
      setForm((prev) => {
        if (prev.gender) return prev;
        const gender = data.managingProfileFor === 'Bride' ? 'female' : data.managingProfileFor === 'Groom' ? 'male' : '';
        return gender ? { ...prev, gender } : prev;
      });
    }).catch(() => {});
  }, [managedMode, existing?.gender]);

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
      if (key === 'religion') {
        next.caste = '';
        next.subCaste = '';
      }
      if (key === 'caste') {
        next.subCaste = '';
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
      if (key === 'prefReligions') {
        next.prefCastes = [];
      }
      if (key === 'currentStatus' && value !== 'Other') {
        next.currentStatusOther = '';
      }
      if (key === 'fatherAlive' && value === false) {
        next.fatherOccupation = '';
      }
      if (key === 'motherAlive' && value === false) {
        next.motherOccupation = '';
      }
      if (key === 'maritalStatus') {
        if (value !== 'Divorced') {
          next.yearsMarried = '';
        }
        if (!CHILDREN_MARITAL_STATUSES.includes(value)) {
          next.haveChildren = false;
          next.childrenBoys = '';
          next.childrenGirls = '';
          next.childrenLivingWith = '';
        }
      }
      if (key === 'haveChildren' && value === false) {
        next.childrenBoys = '';
        next.childrenGirls = '';
        next.childrenLivingWith = '';
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

  const validateSection = (sectionIndex: number) => {
    const sectionErrors = validateSectionFields(sectionIndex, form);
    setErrors((prev) => {
      const cleared = { ...prev };
      (SECTION_ERROR_FIELDS[sectionIndex] || []).forEach((k) => {
        if (!(k in sectionErrors)) delete cleared[k];
      });
      return { ...cleared, ...sectionErrors };
    });
    return Object.keys(sectionErrors).length === 0;
  };

  const validate = () => {
    const next: Record<string, string> = {};
    for (let i = 0; i < SECTIONS.length; i++) {
      Object.assign(next, validateSectionFields(i, form));
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
    if (form.horoscopeAvailable) {
      ['rashi', 'nakshatra', 'manglik', 'placeOfBirth'].forEach((k) => {
        if (!String(form[k] ?? '').trim()) next[k] = 'Required';
      });
    }
    if (form.maritalStatus === 'Divorced' && !form.yearsMarried) {
      next.yearsMarried = 'Required';
    }
    if (CHILDREN_MARITAL_STATUSES.includes(form.maritalStatus) && form.haveChildren) {
      if (form.childrenBoys === '') next.childrenBoys = 'Required';
      if (form.childrenGirls === '') next.childrenGirls = 'Required';
      if (!form.childrenLivingWith) next.childrenLivingWith = 'Required';
    }
    if (form.bio?.length > 1000) next.bio = 'Max 1000 characters';
    if (form.prefAgeMin > form.prefAgeMax) next.prefAgeMax = 'Max age must be greater than min age';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const maxUnlockedStep = useMemo(() => getMaxUnlockedStep(form), [form]);

  const goToStep = (target: number) => {
    if (target < 0 || target >= SECTIONS.length) return;
    if (target <= step) {
      setStep(target);
      return;
    }
    if (target > maxUnlockedStep) {
      toast.error(`Please complete "${SECTIONS[maxUnlockedStep]}" before continuing`);
      setStep(maxUnlockedStep);
      validateSection(maxUnlockedStep);
      return;
    }
    if (!validateSection(step)) {
      toast.error('Please fill all required fields in this section');
      return;
    }
    setStep(target);
  };

  const handleNext = () => {
    if (!validateSection(step)) {
      toast.error('Please fill all required fields in this section');
      return;
    }
    setStep((s) => Math.min(SECTIONS.length - 1, s + 1));
  };

  const buildSavePayload = (changed: ProfileForm): ProfileForm => {
    const payload: ProfileForm = {};
    const copyKeys = [
      'firstName', 'middleName', 'lastName', 'displayName', 'gender', 'dateOfBirth',
      'phone', 'email',
      'education', 'occupation', 'income',
      'height', 'weight', 'complexion', 'bloodGroup',
      'horoscopeAvailable', 'rashi', 'nakshatra', 'gothram', 'manglik', 'horoscope',
      'timeOfBirth', 'placeOfBirth', 'horoscopeFileUrl',
      'religion', 'religionOther', 'caste', 'subCaste', 'motherTongue', 'community',
      'maritalStatus', 'yearsMarried', 'haveChildren', 'childrenBoys', 'childrenGirls', 'childrenLivingWith',
      'address', 'pincode', 'familyType', 'familyStatus', 'fatherName', 'fatherAlive', 'fatherOccupation',
      'motherName', 'motherAlive', 'motherOccupation', 'siblings', 'siblingDetails',
      'bio', 'prefAgeMin', 'prefAgeMax', 'prefHeightMin', 'prefHeightMax',
      'prefMaritalStatuses', 'prefReligions', 'prefCastes', 'prefFamilyType',
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
      changed.haveChildren !== undefined ||
      changed.childrenBoys !== undefined ||
      changed.childrenGirls !== undefined ||
      changed.childrenLivingWith !== undefined ||
      changed.maritalStatus !== undefined
    ) {
      if (!CHILDREN_MARITAL_STATUSES.includes(form.maritalStatus) || !form.haveChildren) {
        payload.haveChildren = false;
        payload.numberOfChildren = 0;
        payload.childrenBoys = 0;
        payload.childrenGirls = 0;
        payload.childrenLivingWith = '';
      } else {
        const boys = form.childrenBoys === '6+' ? 6 : Number(form.childrenBoys || 0);
        const girls = form.childrenGirls === '6+' ? 6 : Number(form.childrenGirls || 0);
        payload.haveChildren = true;
        payload.childrenBoys = boys;
        payload.childrenGirls = girls;
        payload.numberOfChildren = boys + girls;
      }
    }

    if (changed.fatherAlive !== undefined || changed.fatherOccupation !== undefined) {
      if (form.fatherAlive === false) payload.fatherOccupation = '';
    }
    if (changed.motherAlive !== undefined || changed.motherOccupation !== undefined) {
      if (form.motherAlive === false) payload.motherOccupation = '';
    }

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
      if (!validate()) {
        const firstInvalid = SECTIONS.findIndex((_, i) => !isSectionValid(i, form));
        if (firstInvalid >= 0) setStep(firstInvalid);
        throw new Error('Please fix validation errors.');
      }
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
        await api.post('/users/profile/photo', formData);
        pendingPhotoFile.current = null;
        delete changed.photos;
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
      queryClient.invalidateQueries({ queryKey: ['my-match-profile'] });
      queryClient.invalidateQueries({ queryKey: ['my-profile-for-match-filter'] });
      queryClient.invalidateQueries({ queryKey: ['matches-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['matches-search'] });
      queryClient.invalidateQueries({ queryKey: ['match-profile'] });
      toast.success('Profile updated successfully');
      navigate(managedMode ? '/app/profile/representative/me' : '/app/profile');
    },
    onError: (error: any) => {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;
      toast.error(Array.isArray(backendMessage) ? backendMessage.join(', ') : (backendMessage || 'Unable to save profile'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#B66A8A]" size={32} />
        <p className="text-sm text-[#9A5776]">Loading profile...</p>
      </div>
    );
  }

  const pct = profileCompletion(form);
  const missingBySection = useMemo(() => getMissingBySection(form), [form]);
  const SectionIcon = SECTION_META[sectionTitle].icon;
  const selectedPrefReligion = form.prefReligions?.[0] || '';
  const selectedPrefCaste = form.prefCastes?.[0] || '';
  const selectedPrefMarital = form.prefMaritalStatuses?.[0] || '';
  const prefCasteOptions = getCastesForReligion(selectedPrefReligion);
  const ownReligionCastes = getCastesForReligion(form.religion || '');
  const ownSubCasteOptions = getSubCastesForCaste(form.caste || '');

  return (
    <div className="soft-fade-in -mx-4 rounded-3xl bg-gradient-to-br from-[#FFF0F5] via-[#F8F3FF] to-[#FFF5EF] px-4 py-6 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
    <div className="mx-auto max-w-6xl pb-4">
      <Link
        to={managedMode ? '/app/profile/managed' : '/app/profile'}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F0DFE7] bg-white/90 px-4 py-2 text-sm font-medium text-[#B66A8A] shadow-sm transition hover:bg-white"
      >
        <ArrowLeft size={16} /> Back to profile
      </Link>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar stepper */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-[#F2DFE8] bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#F9DEE7] via-[#F6E8FF] to-[#FFF5EF] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9A5776]">
                {managedMode ? 'Managed Profile' : 'Profile Editor'}
              </p>
              <h1 className="font-display text-xl font-bold text-[#5D2B44]">
                {managedMode ? 'Bride / Groom Profile' : 'Edit Profile'}
              </h1>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-[#9A5776]">Completion</span>
                  <span className="font-bold text-[#B66A8A]">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/80">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#D4899F] to-[#B66A8A] transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {missingBySection.length > 0 && (
              <div className="border-t border-[#F2DFE8] px-4 py-4">
                <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  <AlertCircle size={12} /> Missing fields
                </p>
                <ul className="max-h-52 space-y-2 overflow-y-auto">
                  {missingBySection.map(({ sectionIndex, section, fields }) => (
                    <li key={section}>
                      <button
                        type="button"
                        onClick={() => goToStep(sectionIndex)}
                        className="w-full rounded-lg bg-amber-50/80 px-3 py-2 text-left ring-1 ring-amber-100 transition hover:bg-amber-50 hover:ring-amber-200"
                      >
                        <p className="text-xs font-semibold text-[#5D2B44]">{section}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-amber-800">{fields.join(' · ')}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <nav className="p-2">
              {SECTIONS.map((label, i) => {
                const Icon = SECTION_META[label].icon;
                const isActive = step === i;
                const isDone = isSectionValid(i, form);
                const isAccessible = i <= maxUnlockedStep;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goToStep(i)}
                    disabled={!isAccessible}
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isActive
                        ? 'bg-[#B66A8A] text-white shadow-sm'
                        : isDone
                          ? 'bg-[#F5FFF8] text-[#3D8B5F] hover:bg-[#E8F8EF]'
                          : isAccessible
                            ? 'text-[#815A6D] hover:bg-[#FFF5F8]'
                            : 'cursor-not-allowed text-[#C4A0B0] opacity-60'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/20' : isDone ? 'bg-[#E8F8EF]' : isAccessible ? 'bg-[#FAF0F4]' : 'bg-[#F5F0F2]'}`}>
                      {isDone ? <Check size={14} /> : !isAccessible ? <Lock size={12} /> : <Icon size={14} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                    {isActive && <ChevronRight size={14} className="shrink-0 opacity-80" />}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main form */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl border border-[#F2DFE8] bg-white px-5 py-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F9DEE7] to-[#F6E8FF] text-[#A4426A]">
                <SectionIcon size={18} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#9A5776]">
                  Step {step + 1} of {SECTIONS.length}
                </p>
                <h2 className="font-display text-xl font-bold text-[#5D2B44]">{sectionTitle}</h2>
                <p className="text-sm text-[#815A6D]">{SECTION_META[sectionTitle].desc}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#F2DFE8] bg-white p-5 shadow-sm sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {step === 0 && (
                <>
                  <div className="md:col-span-2 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#E5C8D5] bg-[#FFFBFC] p-6 sm:flex-row sm:items-start">
                    <div className="relative shrink-0">
                      <div className="h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-[#F7ECFF] shadow-md ring-2 ring-[#F4D8E4]">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl">👤</div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#B66A8A] text-white shadow">
                        <Camera size={13} />
                      </span>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="font-medium text-[#5D2B44]">Profile Photo</p>
                      <p className="mt-1 text-xs text-[#9A5776]">Upload a clear photo. JPG or PNG, max 10MB.</p>
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#B66A8A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#A75878]">
                        <Camera size={15} />
                        Choose Photo
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  </div>

                  <FormField label="First Name" htmlFor="firstName" required error={errors.firstName}>
                    <input id="firstName" className={inputClass(errors.firstName)} value={form.firstName || ''} onChange={(e) => update('firstName', e.target.value)} />
                  </FormField>
                  <FormField label="Middle Name" htmlFor="middleName">
                    <input id="middleName" className={inputClass()} value={form.middleName || ''} onChange={(e) => update('middleName', e.target.value)} />
                  </FormField>
                  <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName}>
                    <input id="lastName" className={inputClass(errors.lastName)} value={form.lastName || ''} onChange={(e) => update('lastName', e.target.value)} />
                  </FormField>
                  <FormField label="Display Name" htmlFor="displayName">
                    <input id="displayName" className={inputClass()} value={form.displayName || ''} onChange={(e) => update('displayName', e.target.value)} />
                  </FormField>

                  <FormField label="Gender" required error={errors.gender}>
                    <div className="flex gap-2">
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => update('gender', g)}
                          className={`flex-1 rounded-xl py-2.5 text-sm capitalize transition ${
                            form.gender === g
                              ? 'bg-[#B66A8A] font-medium text-white shadow-sm'
                              : 'border border-[#E5C8D5] bg-white text-[#7B4A62] hover:border-[#B66A8A] hover:bg-[#FFF5F8]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Date of Birth" htmlFor="dateOfBirth" required error={errors.dateOfBirth}>
                    <input id="dateOfBirth" type="date" className={inputClass(errors.dateOfBirth)} value={form.dateOfBirth || ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
                  </FormField>
                  <FormField label="Age" htmlFor="age">
                    <input id="age" className={inputClass()} value={form.age || ''} readOnly placeholder="Auto-calculated" />
                  </FormField>
                  <FormField label="Height" htmlFor="height" required error={errors.height}>
                    <select id="height" className={inputClass(errors.height)} value={form.height || ''} onChange={(e) => update('height', Number(e.target.value))}>
                      <option value="">Select height</option>
                      {HEIGHT_OPTIONS.map((h) => <option key={h.label} value={h.value}>{h.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Weight (kg)" htmlFor="weight">
                    <input id="weight" className={inputClass()} placeholder="e.g. 65" value={form.weight || ''} onChange={(e) => update('weight', e.target.value)} />
                  </FormField>
                  <FormField label="Complexion" htmlFor="complexion">
                    <select id="complexion" className={inputClass()} value={form.complexion || ''} onChange={(e) => update('complexion', e.target.value)}>
                      <option value="">Select complexion</option>
                      {COMPLEXIONS.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Blood Group" htmlFor="bloodGroup">
                    <select id="bloodGroup" className={inputClass()} value={form.bloodGroup || ''} onChange={(e) => update('bloodGroup', e.target.value)}>
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>

                  <FormField label="Mobile Number" htmlFor="phone" required error={errors.phone}>
                    <input
                      id="phone"
                      type="tel"
                      className={inputClass(errors.phone)}
                      placeholder="+91 98765 43210"
                      value={form.phone || ''}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </FormField>
                  <FormField label="Email Address" htmlFor="email" required error={errors.email}>
                    <input
                      id="email"
                      type="email"
                      className={inputClass(errors.email)}
                      placeholder="you@example.com"
                      value={form.email || ''}
                      onChange={(e) => update('email', e.target.value)}
                    />
                  </FormField>

                  <SectionCard title="Education Details" subtitle="Optional — add your academic background" icon={GraduationCap}>
                    <FormField label="Highest Qualification" htmlFor="highestQualification">
                      <select id="highestQualification" className={inputClass()} value={form.highestQualification || ''} onChange={(e) => update('highestQualification', e.target.value)}>
                        <option value="">Select qualification</option>
                        {EDUCATION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </FormField>
                    {form.highestQualification === 'Other' && (
                      <FormField label="Specify Qualification" htmlFor="qualificationOther">
                        <input id="qualificationOther" className={inputClass()} value={form.qualificationOther || ''} onChange={(e) => update('qualificationOther', e.target.value)} />
                      </FormField>
                    )}
                    <FormField label="Degree Name" htmlFor="degreeName">
                      <input id="degreeName" className={inputClass()} value={form.degreeName || ''} onChange={(e) => update('degreeName', e.target.value)} />
                    </FormField>
                    <FormField label="Specialization" htmlFor="specialization">
                      <input id="specialization" className={inputClass()} value={form.specialization || ''} onChange={(e) => update('specialization', e.target.value)} />
                    </FormField>
                    <FormField label="College / University" htmlFor="collegeUniversity">
                      <input id="collegeUniversity" className={inputClass()} value={form.collegeUniversity || ''} onChange={(e) => update('collegeUniversity', e.target.value)} />
                    </FormField>
                    <FormField label="Passing Year" htmlFor="passingYear">
                      <input id="passingYear" className={inputClass()} value={form.passingYear || ''} onChange={(e) => update('passingYear', e.target.value)} />
                    </FormField>
                    <FormField label="Grade / CGPA" htmlFor="gradeCgpa">
                      <input id="gradeCgpa" className={inputClass()} placeholder="Optional" value={form.gradeCgpa || ''} onChange={(e) => update('gradeCgpa', e.target.value)} />
                    </FormField>
                  </SectionCard>

                  <SectionCard title="Work History" subtitle="Tell us about your career" icon={Briefcase}>
                    <div className="md:col-span-2">
                      <p className={FIELD_LABEL}>Currently Working?</p>
                      <div className="flex gap-2">
                        {[
                          { label: 'Yes, working', value: true },
                          { label: 'Not working', value: false },
                        ].map(({ label, value }) => (
                          <button
                            key={String(value)}
                            type="button"
                            onClick={() => update('currentlyWorking', value)}
                            className={`flex-1 rounded-xl py-2.5 text-sm transition ${
                              form.currentlyWorking === value
                                ? 'bg-[#B66A8A] font-medium text-white'
                                : 'border border-[#E5C8D5] bg-white text-[#7B4A62] hover:bg-[#FFF5F8]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.currentlyWorking ? (
                      <>
                        <FormField label="Occupation" htmlFor="occupation" required error={errors.occupation}>
                          <input id="occupation" className={inputClass(errors.occupation)} value={form.occupation || ''} onChange={(e) => update('occupation', e.target.value)} />
                        </FormField>
                        <FormField label="Company Name" htmlFor="companyName">
                          <input id="companyName" className={inputClass()} value={form.companyName || ''} onChange={(e) => update('companyName', e.target.value)} />
                        </FormField>
                        <FormField label="Job Title" htmlFor="jobTitle">
                          <input id="jobTitle" className={inputClass()} value={form.jobTitle || ''} onChange={(e) => update('jobTitle', e.target.value)} />
                        </FormField>
                        <FormField label="Industry" htmlFor="industry">
                          <input id="industry" className={inputClass()} value={form.industry || ''} onChange={(e) => update('industry', e.target.value)} />
                        </FormField>
                        <FormField label="Annual Income" htmlFor="annualIncome">
                          <input id="annualIncome" className={inputClass()} value={form.annualIncome || ''} onChange={(e) => update('annualIncome', e.target.value)} />
                        </FormField>
                        <FormField label="Years of Experience" htmlFor="yearsOfExperience">
                          <input id="yearsOfExperience" className={inputClass()} value={form.yearsOfExperience || ''} onChange={(e) => update('yearsOfExperience', e.target.value)} />
                        </FormField>
                        <FormField label="Work Location" htmlFor="workLocation" colSpan={2}>
                          <input id="workLocation" className={inputClass()} value={form.workLocation || ''} onChange={(e) => update('workLocation', e.target.value)} />
                        </FormField>
                      </>
                    ) : (
                      <>
                        <FormField label="Current Status" htmlFor="currentStatus" required error={errors.currentStatus}>
                          <select id="currentStatus" className={inputClass(errors.currentStatus)} value={form.currentStatus || ''} onChange={(e) => update('currentStatus', e.target.value)}>
                            <option value="">Select status</option>
                            {WORK_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </FormField>
                        {form.currentStatus === 'Other' && (
                          <FormField label="Specify Status" htmlFor="currentStatusOther" error={errors.currentStatusOther}>
                            <input id="currentStatusOther" className={inputClass(errors.currentStatusOther)} value={form.currentStatusOther || ''} onChange={(e) => update('currentStatusOther', e.target.value)} />
                          </FormField>
                        )}
                      </>
                    )}
                  </SectionCard>
                </>
              )}

              {step === 1 && (
                <>
                  <FormField label="Horoscope Available" htmlFor="horoscopeAvailable" colSpan={2}>
                    <select id="horoscopeAvailable" className={inputClass()} value={String(form.horoscopeAvailable)} onChange={(e) => update('horoscopeAvailable', e.target.value === 'true')}>
                      <option value="false">Horoscope not available</option>
                      <option value="true">Horoscope available</option>
                    </select>
                  </FormField>
                  {form.horoscopeAvailable && (
                    <>
                      <FormField label="Rashi" htmlFor="rashi" required error={errors.rashi}>
                        <input id="rashi" className={inputClass(errors.rashi)} value={form.rashi || ''} onChange={(e) => update('rashi', e.target.value)} />
                      </FormField>
                      <FormField label="Nakshatra" htmlFor="nakshatra" required error={errors.nakshatra}>
                        <input id="nakshatra" className={inputClass(errors.nakshatra)} value={form.nakshatra || ''} onChange={(e) => update('nakshatra', e.target.value)} />
                      </FormField>
                      <FormField label="Gothram" htmlFor="gothram">
                        <input id="gothram" className={inputClass()} value={form.gothram || ''} onChange={(e) => update('gothram', e.target.value)} />
                      </FormField>
                      <FormField label="Manglik" htmlFor="manglik" required error={errors.manglik}>
                        <select id="manglik" className={inputClass(errors.manglik)} value={form.manglik || ''} onChange={(e) => update('manglik', e.target.value)}>
                          <option value="">Select</option><option>Yes</option><option>No</option><option>Don't Know</option>
                        </select>
                      </FormField>
                      <FormField label="Zodiac Sign" htmlFor="horoscope">
                        <input id="horoscope" className={inputClass()} value={form.horoscope || ''} onChange={(e) => update('horoscope', e.target.value)} />
                      </FormField>
                      <FormField label="Time of Birth" htmlFor="timeOfBirth">
                        <input id="timeOfBirth" type="time" className={inputClass()} value={form.timeOfBirth || ''} onChange={(e) => update('timeOfBirth', e.target.value)} />
                      </FormField>
                      <FormField label="Place of Birth" htmlFor="placeOfBirth" required error={errors.placeOfBirth}>
                        <input id="placeOfBirth" className={inputClass(errors.placeOfBirth)} value={form.placeOfBirth || ''} onChange={(e) => update('placeOfBirth', e.target.value)} />
                      </FormField>
                      <FormField label="Horoscope Document" htmlFor="horoscopeFile" colSpan={2}>
                        <input id="horoscopeFile" type="file" accept=".pdf,image/*" className={inputClass()} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) update('horoscopeFileUrl', file.name);
                        }} />
                      </FormField>
                    </>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  <FormField label="Religion" htmlFor="religion" required error={errors.religion}>
                    <select id="religion" className={inputClass(errors.religion)} value={form.religion || ''} onChange={(e) => update('religion', e.target.value)}>
                      <option value="">Select religion</option>
                      {RELIGION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </FormField>
                  {form.religion === 'Other' && (
                    <FormField label="Specify Religion" htmlFor="religionOther" error={errors.religionOther}>
                      <input id="religionOther" className={inputClass(errors.religionOther)} value={form.religionOther || ''} onChange={(e) => update('religionOther', e.target.value)} />
                    </FormField>
                  )}
                  <FormField label="Caste" htmlFor="caste">
                    <select
                      id="caste"
                      className={inputClass()}
                      value={form.caste || ''}
                      disabled={!form.religion || ownReligionCastes.length === 0}
                      onChange={(e) => update('caste', e.target.value)}
                    >
                      <option value="">
                        {!form.religion ? 'Select religion first' : 'Select caste'}
                      </option>
                      {ownReligionCastes.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Sub Caste" htmlFor="subCaste">
                    <select
                      id="subCaste"
                      className={inputClass()}
                      value={form.subCaste || ''}
                      disabled={!form.caste}
                      onChange={(e) => update('subCaste', e.target.value)}
                    >
                      <option value="">
                        {!form.caste ? 'Select caste first' : 'Select sub caste'}
                      </option>
                      {ownSubCasteOptions.map((sc) => (
                        <option key={sc} value={sc}>{sc}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Mother Tongue" htmlFor="motherTongue">
                    <select
                      id="motherTongue"
                      className={inputClass()}
                      value={form.motherTongue || ''}
                      onChange={(e) => update('motherTongue', e.target.value)}
                    >
                      <option value="">Select mother tongue</option>
                      {MOTHER_TONGUE_OPTIONS.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Community" htmlFor="community">
                    <select
                      id="community"
                      className={inputClass()}
                      value={form.community || ''}
                      onChange={(e) => update('community', e.target.value)}
                    >
                      <option value="">Select community</option>
                      {COMMUNITY_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                </>
              )}

              {step === 3 && (
                <>
                  <FormField label="Relationship Status" htmlFor="maritalStatus" required error={errors.maritalStatus}>
                    <select id="maritalStatus" className={inputClass(errors.maritalStatus)} value={form.maritalStatus || ''} onChange={(e) => update('maritalStatus', e.target.value)}>
                      <option value="">Select relationship status</option>
                      {MARITAL_STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </FormField>
                  {form.maritalStatus === 'Divorced' && (
                    <FormField label="Years Married" htmlFor="yearsMarried" required error={errors.yearsMarried}>
                      <select id="yearsMarried" className={inputClass(errors.yearsMarried)} value={form.yearsMarried || ''} onChange={(e) => update('yearsMarried', e.target.value)}>
                        <option value="">Select years</option>
                        {YEARS_MARRIED_OPTIONS.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </FormField>
                  )}
                  {CHILDREN_MARITAL_STATUSES.includes(form.maritalStatus) && (
                    <>
                      <FormField label="Do you have children?" htmlFor="haveChildren">
                        <select id="haveChildren" className={inputClass()} value={String(form.haveChildren)} onChange={(e) => update('haveChildren', e.target.value === 'true')}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </FormField>
                      {form.haveChildren && (
                        <>
                          <FormField label="Number of Boys" htmlFor="childrenBoys" required error={errors.childrenBoys}>
                            <select id="childrenBoys" className={inputClass(errors.childrenBoys)} value={form.childrenBoys ?? ''} onChange={(e) => update('childrenBoys', e.target.value)}>
                              <option value="">Select</option>
                              {CHILD_COUNT_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Number of Girls" htmlFor="childrenGirls" required error={errors.childrenGirls}>
                            <select id="childrenGirls" className={inputClass(errors.childrenGirls)} value={form.childrenGirls ?? ''} onChange={(e) => update('childrenGirls', e.target.value)}>
                              <option value="">Select</option>
                              {CHILD_COUNT_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </FormField>
                          <FormField label="Children Living With" htmlFor="childrenLivingWith" required error={errors.childrenLivingWith}>
                            <select id="childrenLivingWith" className={inputClass(errors.childrenLivingWith)} value={form.childrenLivingWith || ''} onChange={(e) => update('childrenLivingWith', e.target.value)}>
                              <option value="">Select</option>
                              {CHILDREN_LIVING_WITH_OPTIONS.map((v) => (
                                <option key={v} value={v}>{v}</option>
                              ))}
                            </select>
                          </FormField>
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {step === 4 && (
                <>
                  <FormField label="Country" htmlFor="country" required error={errors.country}>
                    <input id="country" list="countries-list" className={inputClass(errors.country)} value={form.country || ''} onChange={(e) => update('country', e.target.value)} />
                    <datalist id="countries-list">{countries.map((c) => <option key={c.isoCode} value={c.name} />)}</datalist>
                  </FormField>
                  <FormField label="State" htmlFor="state" required error={errors.state}>
                    <input id="state" list="states-list" className={inputClass(errors.state)} value={form.state || ''} onChange={(e) => update('state', e.target.value)} disabled={!form.country} />
                    <datalist id="states-list">{states.map((s) => <option key={s.isoCode} value={s.name} />)}</datalist>
                  </FormField>
                  <FormField label="City" htmlFor="city" required error={errors.city}>
                    <input id="city" list="cities-list" className={inputClass(errors.city)} value={form.city || ''} onChange={(e) => update('city', e.target.value)} disabled={!form.state} />
                    <datalist id="cities-list">{cities.map((c) => <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name} />)}</datalist>
                  </FormField>
                  <FormField label="Pincode" htmlFor="pincode">
                    <input id="pincode" className={inputClass()} value={form.pincode || ''} onChange={(e) => update('pincode', e.target.value)} />
                  </FormField>
                  <FormField label="Current Address" htmlFor="address" colSpan={2}>
                    <textarea id="address" className={`${inputClass()} min-h-[120px] resize-y`} value={form.address || ''} onChange={(e) => update('address', e.target.value)} />
                  </FormField>
                </>
              )}

              {step === 5 && (
                <>
                  <FormField label="Family Type" htmlFor="familyType">
                    <select id="familyType" className={inputClass()} value={form.familyType || ''} onChange={(e) => update('familyType', e.target.value)}>
                      <option value="">Select type</option>{FAMILY_TYPES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Family Status" htmlFor="familyStatus">
                    <select id="familyStatus" className={inputClass()} value={form.familyStatus || ''} onChange={(e) => update('familyStatus', e.target.value)}>
                      <option value="">Select status</option>{FAMILY_STATUS.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Father's Name" htmlFor="fatherName">
                    <input id="fatherName" className={inputClass()} value={form.fatherName || ''} onChange={(e) => update('fatherName', e.target.value)} />
                  </FormField>
                  <FormField label="Father Alive" htmlFor="fatherAlive">
                    <select id="fatherAlive" className={inputClass()} value={String(form.fatherAlive)} onChange={(e) => update('fatherAlive', e.target.value === 'true')}>
                      <option value="true">Yes</option><option value="false">No</option>
                    </select>
                  </FormField>
                  {form.fatherAlive && (
                    <FormField label="Father's Profession" htmlFor="fatherOccupation" colSpan={2}>
                      <textarea id="fatherOccupation" className={`${inputClass()} min-h-[90px] resize-y`} value={form.fatherOccupation || ''} onChange={(e) => update('fatherOccupation', e.target.value)} />
                    </FormField>
                  )}
                  <FormField label="Mother's Name" htmlFor="motherName">
                    <input id="motherName" className={inputClass()} value={form.motherName || ''} onChange={(e) => update('motherName', e.target.value)} />
                  </FormField>
                  <FormField label="Mother Alive" htmlFor="motherAlive">
                    <select id="motherAlive" className={inputClass()} value={String(form.motherAlive)} onChange={(e) => update('motherAlive', e.target.value === 'true')}>
                      <option value="true">Yes</option><option value="false">No</option>
                    </select>
                  </FormField>
                  {form.motherAlive && (
                    <FormField label="Mother's Profession" htmlFor="motherOccupation" colSpan={2}>
                      <textarea id="motherOccupation" className={`${inputClass()} min-h-[90px] resize-y`} value={form.motherOccupation || ''} onChange={(e) => update('motherOccupation', e.target.value)} />
                    </FormField>
                  )}
                  <FormField label="Number of Siblings" htmlFor="siblings">
                    <input id="siblings" type="number" min="0" className={inputClass()} value={form.siblings ?? 0} onChange={(e) => update('siblings', Number(e.target.value))} />
                  </FormField>
                  {(form.siblingDetails || []).map((s: any, idx: number) => (
                    <div key={idx} className={`${SECTION_CARD} md:col-span-2`}>
                      <p className={`${FIELD_LABEL} mb-3`}>Sibling {idx + 1}</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField label="Relation">
                          <select className={inputClass()} value={s.relation || 'Brother'} onChange={(e) => updateSibling(idx, 'relation', e.target.value)}>
                            <option>Brother</option><option>Sister</option>
                          </select>
                        </FormField>
                        <FormField label="Married">
                          <select className={inputClass()} value={String(!!s.married)} onChange={(e) => updateSibling(idx, 'married', e.target.value === 'true')}>
                            <option value="false">No</option><option value="true">Yes</option>
                          </select>
                        </FormField>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {step === 6 && (
                <FormField label="About Me" htmlFor="bio" colSpan={2} error={errors.bio}>
                  <textarea
                    id="bio"
                    className={`${inputClass()} min-h-[200px] resize-y leading-relaxed`}
                    placeholder="Tell us about yourself, your personality, career, hobbies, family values, lifestyle, and what kind of life partner you are looking for."
                    value={form.bio || ''}
                    onChange={(e) => update('bio', e.target.value.slice(0, 1000))}
                  />
                  <p className="mt-2 text-right text-xs text-[#9A5776]">{1000 - (form.bio?.length || 0)} characters remaining</p>
                </FormField>
              )}

              {step === 7 && (
                <>
                  <FormField label="Preferred Min Age" htmlFor="prefAgeMin">
                    <select id="prefAgeMin" className={inputClass()} value={form.prefAgeMin} onChange={(e) => update('prefAgeMin', Number(e.target.value))}>
                      {Array.from({ length: 53 }).map((_, i) => <option key={i} value={18 + i}>{18 + i} years</option>)}
                    </select>
                  </FormField>
                  <FormField label="Preferred Max Age" htmlFor="prefAgeMax" error={errors.prefAgeMax}>
                    <select id="prefAgeMax" className={inputClass(errors.prefAgeMax)} value={form.prefAgeMax} onChange={(e) => update('prefAgeMax', Number(e.target.value))}>
                      {Array.from({ length: 53 }).map((_, i) => <option key={i} value={18 + i}>{18 + i} years</option>)}
                    </select>
                  </FormField>
                  <FormField label="Preferred Height From" htmlFor="prefHeightMin">
                    <select id="prefHeightMin" className={inputClass()} value={form.prefHeightMin || ''} onChange={(e) => update('prefHeightMin', Number(e.target.value))}>
                      <option value="">Any</option>{HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Preferred Height To" htmlFor="prefHeightMax">
                    <select id="prefHeightMax" className={inputClass()} value={form.prefHeightMax || ''} onChange={(e) => update('prefHeightMax', Number(e.target.value))}>
                      <option value="">Any</option>{HEIGHT_OPTIONS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Preferred Marital Status" htmlFor="prefMaritalStatuses">
                    <select
                      id="prefMaritalStatuses"
                      className={inputClass()}
                      value={selectedPrefMarital || "Doesn't Matter"}
                      onChange={(e) => {
                        const v = e.target.value;
                        update('prefMaritalStatuses', v && v !== "Doesn't Matter" ? [v] : []);
                      }}
                    >
                      {PARTNER_MARITAL_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Preferred Religion" htmlFor="prefReligions">
                    <select
                      id="prefReligions"
                      className={inputClass()}
                      value={selectedPrefReligion}
                      onChange={(e) => update('prefReligions', e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">Any religion</option>
                      {RELIGION_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Preferred Caste" htmlFor="prefCastes">
                    <select
                      id="prefCastes"
                      className={inputClass()}
                      value={selectedPrefCaste}
                      disabled={!selectedPrefReligion || prefCasteOptions.length === 0}
                      onChange={(e) => update('prefCastes', e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">
                        {!selectedPrefReligion
                          ? 'Select religion first'
                          : prefCasteOptions.length === 0
                            ? 'Not applicable for this religion'
                            : 'Any caste'}
                      </option>
                      {prefCasteOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Preferred Family Type" htmlFor="prefFamilyType">
                    <select id="prefFamilyType" className={inputClass()} value={form.prefFamilyType || ''} onChange={(e) => update('prefFamilyType', e.target.value)}>
                      <option value="">Any</option><option>Nuclear Family</option><option>Joint Family</option><option>Doesn't Matter</option>
                    </select>
                  </FormField>
                </>
              )}

              {step === 8 && (
                <>
                  <FormField label="Eating Habit" htmlFor="diet">
                    <select id="diet" className={inputClass()} value={form.diet || ''} onChange={(e) => update('diet', e.target.value)}>
                      <option value="">Select</option>{EATING.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Drinking Habit" htmlFor="drinking">
                    <select id="drinking" className={inputClass()} value={form.drinking || ''} onChange={(e) => update('drinking', e.target.value)}>
                      <option value="">Select</option>{HABIT.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Smoking Habit" htmlFor="smoking">
                    <select id="smoking" className={inputClass()} value={form.smoking || ''} onChange={(e) => update('smoking', e.target.value)}>
                      <option value="">Select</option>{HABIT.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </FormField>
                </>
              )}
            </div>

            {sectionHasErrors(step, errors) && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                Please fill all required fields in this section before continuing.
              </div>
            )}
            {Object.values(errors).some(Boolean) &&
              step === SECTIONS.length - 1 &&
              !sectionHasErrors(step, errors) && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  Please fix the required fields in earlier sections before saving.
                </div>
              )}
          </div>

          <div className="flex flex-wrap gap-3 justify-between rounded-2xl border border-[#F2DFE8] bg-white p-4 shadow-sm">
            <div className="flex gap-3">
              <Link
                to={managedMode ? '/app/profile/edit/representative' : '/app/profile'}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D8B6C6] bg-white px-4 py-2.5 text-sm font-medium text-[#7B4A62] transition hover:bg-[#FFF5F8]"
              >
                <X size={16} /> Cancel
              </Link>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D8B6C6] bg-white px-4 py-2.5 text-sm font-medium text-[#7B4A62] transition hover:bg-[#FFF5F8]"
                onClick={() => setForm(initialRef.current)}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="rounded-xl border border-[#D8B6C6] bg-white px-5 py-2.5 text-sm font-medium text-[#7B4A62] transition hover:bg-[#FFF5F8] disabled:opacity-40"
                onClick={() => goToStep(step - 1)}
                disabled={step === 0}
              >
                Previous
              </button>
              {step < SECTIONS.length - 1 ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B66A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A75878]"
                  onClick={handleNext}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#B66A8A] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#A75878] disabled:opacity-60"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
