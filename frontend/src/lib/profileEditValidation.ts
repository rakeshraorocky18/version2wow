export type ProfileForm = Record<string, any>;

export const EDIT_SECTIONS = [
  'Personal Details',
  'Horoscope Details',
  'Religion Details',
  'Marital Information',
  'Location',
  'Family Background',
  'Express Yourself',
  'Lifestyle',
  'Partner Preferences',
] as const;

export type EditSection = (typeof EDIT_SECTIONS)[number];

export const SECTION_ERROR_FIELDS: Record<number, string[]> = {
  0: ['firstName', 'lastName', 'gender', 'dateOfBirth', 'height', 'phone', 'email', 'occupation', 'currentStatus', 'currentStatusOther'],
  1: ['rashi', 'nakshatra', 'manglik', 'placeOfBirth'],
  2: ['religion', 'religionOther'],
  3: ['maritalStatus', 'yearsMarried'],
  4: ['country', 'state', 'city'],
  5: ['familyType'],
  6: ['bio'],
  7: ['diet'],
  8: ['prefAgeMax', 'prefReligions', 'prefMaritalStatuses', 'prefFamilyType'],
};

export const FIELD_LABELS: Record<string, string> = {
  firstName: 'First Name',
  lastName: 'Last Name',
  gender: 'Gender',
  dateOfBirth: 'Date of Birth',
  height: 'Height',
  phone: 'Mobile Number',
  email: 'Email Address',
  occupation: 'Occupation',
  currentStatus: 'Current Status',
  currentStatusOther: 'Specify Status',
  rashi: 'Rashi',
  nakshatra: 'Nakshatra',
  manglik: 'Manglik',
  placeOfBirth: 'Place of Birth',
  religion: 'Religion',
  religionOther: 'Specify Religion',
  maritalStatus: 'Marital Status',
  yearsMarried: 'Years Married',
  country: 'Country',
  state: 'State',
  city: 'City',
  familyType: 'Family Type',
  bio: 'About Me',
  diet: 'Eating Habit',
  prefAgeMax: 'Preferred Max Age',
};

function hasText(value: unknown): boolean {
  return String(value ?? '').trim().length > 0;
}

function hasList(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function validateSectionFields(sectionIndex: number, form: ProfileForm): Record<string, string> {
  const next: Record<string, string> = {};

  switch (sectionIndex) {
    case 0: {
      ['firstName', 'lastName', 'gender', 'dateOfBirth', 'height', 'phone', 'email'].forEach((k) => {
        if (!hasText(form[k])) next[k] = 'Required';
      });
      const phoneDigits = String(form.phone ?? '').replace(/\D/g, '');
      if (form.phone && phoneDigits.length < 10) {
        next.phone = 'Enter a valid mobile number (at least 10 digits)';
      }
      const email = String(form.email ?? '').trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        next.email = 'Enter a valid email address';
      }
      if (form.currentlyWorking && !hasText(form.occupation)) {
        next.occupation = 'Occupation is required when currently working';
      }
      if (!form.currentlyWorking && !hasText(form.currentStatus)) {
        next.currentStatus = 'Current status is required';
      }
      if (
        !form.currentlyWorking &&
        form.currentStatus === 'Other' &&
        !hasText(form.currentStatusOther)
      ) {
        next.currentStatusOther = 'Please specify current status';
      }
      break;
    }
    case 1: {
      if (form.horoscopeAvailable) {
        ['rashi', 'nakshatra', 'manglik', 'placeOfBirth'].forEach((k) => {
          if (!hasText(form[k])) next[k] = 'Required';
        });
      }
      break;
    }
    case 2: {
      if (!hasText(form.religion)) next.religion = 'Required';
      if (form.religion === 'Other' && !hasText(form.religionOther)) {
        next.religionOther = 'Please specify religion';
      }
      break;
    }
    case 3: {
      if (!hasText(form.maritalStatus)) next.maritalStatus = 'Required';
      if (form.maritalStatus === 'Divorced' && !form.yearsMarried) {
        next.yearsMarried = 'Required';
      }
      break;
    }
    case 4: {
      ['country', 'state', 'city'].forEach((k) => {
        if (!hasText(form[k])) next[k] = 'Required';
      });
      break;
    }
    case 5: {
      if (!hasText(form.familyType)) next.familyType = 'Required';
      break;
    }
    case 6: {
      if (!hasText(form.bio)) next.bio = 'Required';
      if (typeof form.bio === 'string' && form.bio.length > 1000) next.bio = 'Max 1000 characters';
      break;
    }
    case 7: {
      if (!hasText(form.diet)) next.diet = 'Required';
      break;
    }
    case 8: {
      if (Number(form.prefAgeMin) > Number(form.prefAgeMax)) {
        next.prefAgeMax = 'Max age must be greater than min age';
      }
      const hasPreference =
        hasList(form.prefReligions) ||
        hasList(form.prefMaritalStatuses) ||
        hasList(form.prefCastes) ||
        hasList(form.prefCities) ||
        hasText(form.prefFamilyType) ||
        Boolean(form.prefHeightMin) ||
        Boolean(form.prefHeightMax);
      if (!hasPreference) {
        next.prefAgeMax = next.prefAgeMax || 'Select at least one partner preference';
      }
      break;
    }
    default:
      break;
  }

  return next;
}

export function isSectionValid(sectionIndex: number, form: ProfileForm): boolean {
  return Object.keys(validateSectionFields(sectionIndex, form)).length === 0;
}

/** True when the section has real user-filled details (not just empty/default-valid). */
export function isSectionFilled(sectionIndex: number, form: ProfileForm): boolean {
  if (!isSectionValid(sectionIndex, form)) return false;

  switch (sectionIndex) {
    case 0:
      return (
        hasText(form.firstName) &&
        hasText(form.lastName) &&
        hasText(form.gender) &&
        Boolean(form.dateOfBirth) &&
        Boolean(form.height) &&
        hasText(form.phone) &&
        hasText(form.email)
      );
    case 1:
      if (form.horoscopeAvailable === true) {
        return hasText(form.rashi) && hasText(form.nakshatra) && hasText(form.manglik) && hasText(form.placeOfBirth);
      }
      // Explicitly chose "no horoscope"
      return form.horoscopeAvailable === false;
    case 2:
      return hasText(form.religion);
    case 3:
      return hasText(form.maritalStatus);
    case 4:
      return hasText(form.country) && hasText(form.state) && hasText(form.city);
    case 5:
      return hasText(form.familyType);
    case 6:
      return hasText(form.bio);
    case 7:
      return hasText(form.diet);
    case 8:
      return (
        Number(form.prefAgeMin) <= Number(form.prefAgeMax) &&
        (hasList(form.prefReligions) ||
          hasList(form.prefMaritalStatuses) ||
          hasList(form.prefCastes) ||
          hasList(form.prefCities) ||
          hasText(form.prefFamilyType) ||
          Boolean(form.prefHeightMin) ||
          Boolean(form.prefHeightMax))
      );
    default:
      return false;
  }
}

export function getMaxUnlockedStep(form: ProfileForm): number {
  for (let i = 0; i < EDIT_SECTIONS.length; i++) {
    if (!isSectionFilled(i, form)) return i;
  }
  return EDIT_SECTIONS.length - 1;
}

/** Tick mark only after the section's details are actually filled. */
export function isSectionCompleted(sectionIndex: number, form: ProfileForm): boolean {
  return isSectionFilled(sectionIndex, form);
}

export function profileCompletion(form: ProfileForm): number {
  const done = EDIT_SECTIONS.filter((_, i) => isSectionCompleted(i, form)).length;
  return Math.round((done / EDIT_SECTIONS.length) * 100);
}

export function sectionHasErrors(sectionIndex: number, errors: Record<string, string>): boolean {
  const keys = SECTION_ERROR_FIELDS[sectionIndex] || [];
  return keys.some((k) => Boolean(errors[k]));
}

export function getMissingBySection(form: ProfileForm): { sectionIndex: number; section: EditSection; fields: string[] }[] {
  return EDIT_SECTIONS.map((section, sectionIndex) => {
    const errors = validateSectionFields(sectionIndex, form);
    const fields = Object.keys(errors).map((k) => FIELD_LABELS[k] || k);
    return { sectionIndex, section, fields };
  }).filter((item) => item.fields.length > 0);
}


export function apiProfileToForm(data: Record<string, unknown>): ProfileForm {
  const wizard = (data.wizardProfile as Record<string, unknown>) || {};
  const pd = (wizard.personalDetails as Record<string, unknown>) || {};
  return {
    ...data,
    firstName: pd.firstName || data.firstName || '',
    lastName: pd.lastName || data.lastName || '',
    gender: pd.gender || data.gender || '',
    dateOfBirth: pd.dateOfBirth || data.dateOfBirth || '',
    phone: pd.phone || data.phone || '',
    email: pd.email || data.email || '',
    country: pd.country || data.country || '',
    state: pd.state || data.state || '',
    city: pd.city || data.city || '',
    religion: (wizard.religion as Record<string, unknown>)?.religion || data.religion || '',
    religionOther: data.religionOther || '',
    maritalStatus: data.maritalStatus || '',
    yearsMarried: data.yearsMarried || '',
    horoscopeAvailable: data.horoscopeAvailable ?? false,
    rashi: data.rashi || '',
    nakshatra: data.nakshatra || '',
    manglik: data.manglik || '',
    placeOfBirth: data.placeOfBirth || '',
    currentlyWorking: data.currentlyWorking ?? false,
    occupation: data.occupation || data.jobTitle || '',
    currentStatus: data.currentStatus || '',
    currentStatusOther: data.currentStatusOther || '',
    bio: (wizard.expressYourself as Record<string, unknown>)?.aboutMe || data.bio || '',
    prefAgeMin: data.prefAgeMin ?? 21,
    prefAgeMax: data.prefAgeMax ?? 30,
  };
}
