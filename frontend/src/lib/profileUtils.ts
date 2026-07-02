import {
  WizardProfile,
  StepErrors,
  WIZARD_STEPS,
  createEmptyEducation,
  createEmptyProfile,
} from '../types/profile';

const DRAFT_KEY = 'wow_profile_wizard_draft';

type DraftData = Omit<WizardProfile, 'profilePhoto' | 'resumeFile'>;

export function saveDraft(profile: WizardProfile, currentStep: number) {
  const draft: DraftData & { currentStep: number } = {
    personalDetails: profile.personalDetails,
    education: profile.education,
    experience: profile.experience,
    hobbies: profile.hobbies,
    expressYourself: profile.expressYourself,
    profilePhotoPreview: profile.profilePhotoPreview,
    existingPhotoUrl: profile.existingPhotoUrl,
    existingResumeUrl: profile.existingResumeUrl,
    currentStep,
  };
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // localStorage full or unavailable
  }
}

export function loadDraft(): (DraftData & { currentStep: number }) | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

export function profileFromApi(data: Record<string, unknown>): WizardProfile {
  const wizard = (data.wizardProfile as Record<string, unknown>) || {};
  const pd = (wizard.personalDetails as WizardProfile['personalDetails']) || {};
  const base = createEmptyProfile();

  return {
    ...base,
    personalDetails: {
      ...base.personalDetails,
      firstName: (pd.firstName as string) || (data.firstName as string) || '',
      lastName: (pd.lastName as string) || (data.lastName as string) || '',
      displayName: (pd.displayName as string) || (data.displayName as string) || '',
      gender: (pd.gender as string) || (data.gender as string) || '',
      dateOfBirth: (pd.dateOfBirth as string) || (data.dateOfBirth as string) || '',
      phone: (pd.phone as string) || (data.phone as string) || '',
      email: (pd.email as string) || (data.email as string) || '',
      country: (pd.country as string) || (data.country as string) || 'India',
      state: (pd.state as string) || (data.state as string) || '',
      city: (pd.city as string) || (data.city as string) || '',
      address: (pd.address as string) || (data.address as string) || '',
      languagesKnown: (pd.languagesKnown as string[]) || (data.languagesKnown as string[]) || [],
    },
    education: ((wizard.education as WizardProfile['education'])?.length
      ? (wizard.education as WizardProfile['education']).map((e) => ({
          ...createEmptyEducation(),
          ...e,
          id: e.id || crypto.randomUUID(),
        }))
      : [createEmptyEducation()]) as WizardProfile['education'],
    experience: {
      ...base.experience,
      ...((wizard.experience as WizardProfile['experience']) || {}),
      resumeUrl: ((wizard.experience as WizardProfile['experience'])?.resumeUrl) || (data.resumeUrl as string) || '',
    },
    hobbies: (wizard.hobbies as string[]) || (data.interests as string[]) || [],
    expressYourself: {
      ...base.expressYourself,
      ...((wizard.expressYourself as WizardProfile['expressYourself']) || {}),
      aboutMe: ((wizard.expressYourself as WizardProfile['expressYourself'])?.aboutMe) || (data.bio as string) || '',
    },
    existingPhotoUrl: (wizard.profilePhoto as string) || (data.photos as string[])?.[0] || '',
    profilePhotoPreview: (wizard.profilePhoto as string) || (data.photos as string[])?.[0] || '',
    existingResumeUrl: ((wizard.experience as WizardProfile['experience'])?.resumeUrl) || (data.resumeUrl as string) || '',
  };
}

export function calculateCompletion(profile: WizardProfile): number {
  let filled = 0;
  let total = 0;

  const check = (value: unknown) => {
    total += 1;
    if (Array.isArray(value) ? value.length > 0 : Boolean(String(value || '').trim())) {
      filled += 1;
    }
  };

  const pd = profile.personalDetails;
  check(pd.firstName);
  check(pd.lastName);
  check(pd.gender);
  check(pd.dateOfBirth);
  check(pd.phone);
  check(pd.email);
  check(pd.city);
  check(profile.profilePhotoPreview || profile.existingPhotoUrl);

  profile.education.forEach((e) => {
    check(e.degree);
    check(e.institutionName);
  });

  if (profile.experience.currentlyWorking) {
    check(profile.experience.companyName);
    check(profile.experience.jobTitle);
  } else {
    total += 1;
    filled += 1;
  }

  check(profile.hobbies.length ? profile.hobbies : '');
  check(profile.expressYourself.aboutMe);

  return Math.min(100, Math.round((filled / total) * 100));
}

export function validateStep(step: number, profile: WizardProfile): StepErrors {
  const errors: StepErrors = {};
  const pd = profile.personalDetails;

  if (step === 1) {
    if (!pd.firstName.trim()) errors.firstName = 'First name is required';
    if (!pd.lastName.trim()) errors.lastName = 'Last name is required';
    if (!pd.gender) errors.gender = 'Gender is required';
    if (!pd.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!pd.phone.trim()) errors.phone = 'Phone number is required';
    if (!pd.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(pd.email)) errors.email = 'Enter a valid email';
    if (!pd.country.trim()) errors.country = 'Country is required';
    if (!pd.city.trim()) errors.city = 'City is required';
  }

  if (step === 2) {
    profile.education.forEach((entry, i) => {
      if (!entry.degree.trim()) errors[`education.${i}.degree`] = 'Degree is required';
      if (!entry.institutionName.trim()) errors[`education.${i}.institutionName`] = 'Institution is required';
    });
  }

  if (step === 3 && profile.experience.currentlyWorking) {
    const ex = profile.experience;
    if (!ex.companyName.trim()) errors.companyName = 'Company name is required';
    if (!ex.jobTitle.trim()) errors.jobTitle = 'Job title is required';
    if (!ex.industry.trim()) errors.industry = 'Industry is required';
    if (!ex.employmentType) errors.employmentType = 'Employment type is required';
  }

  if (step === 4) {
    if (profile.hobbies.length === 0) errors.hobbies = 'Select at least one hobby';
  }

  if (step === 5) {
    if (!profile.expressYourself.aboutMe.trim()) errors.aboutMe = 'About Me is required';
  }

  return errors;
}

export function validateAll(profile: WizardProfile): StepErrors {
  let allErrors: StepErrors = {};
  for (let i = 1; i <= 5; i++) {
    allErrors = { ...allErrors, ...validateStep(i, profile) };
  }
  return allErrors;
}

export function getPhotoUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http')) return path;
  if (path.startsWith('/uploads/') || path.startsWith('uploads/')) {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Ignore corrupted base64 fragments saved before photo storage fix
  if (!path.startsWith('/') && (path.includes('base64') || /^[A-Za-z0-9+/=]{40,}$/.test(path))) {
    return '';
  }
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getMainProfilePhoto(profile: {
  profilePhoto?: string | null;
  photos?: string[] | null;
  wizardProfile?: { profilePhoto?: string | null } | null;
}): string {
  if (profile.profilePhoto) return profile.profilePhoto;
  if (profile.wizardProfile?.profilePhoto) return profile.wizardProfile.profilePhoto;
  const list = Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [];
  return list[0] || '';
}

export function getGalleryPhotos(profile: {
  photos?: string[] | null;
}): string[] {
  return Array.isArray(profile.photos) ? profile.photos.filter(Boolean) : [];
}

/** @deprecated use getMainProfilePhoto / getGalleryPhotos */
export function getProfilePhotos(profile: {
  profilePhoto?: string | null;
  photos?: string[] | null;
  wizardProfile?: { profilePhoto?: string | null } | null;
}): string[] {
  const main = getMainProfilePhoto(profile);
  const gallery = getGalleryPhotos(profile);
  return main ? [main, ...gallery.filter((p) => p !== main)] : gallery;
}

export function buildSavePayload(profile: WizardProfile) {
  return {
    personalDetails: profile.personalDetails,
    education: profile.education.map(({ id, ...rest }) => rest),
    experience: {
      ...profile.experience,
      resumeUrl: profile.existingResumeUrl || profile.experience.resumeUrl || undefined,
    },
    hobbies: profile.hobbies,
    expressYourself: profile.expressYourself,
    existingPhotoUrl: profile.existingPhotoUrl || undefined,
    profilePhotoUrl: profile.existingPhotoUrl || undefined,
  };
}

export { WIZARD_STEPS };
