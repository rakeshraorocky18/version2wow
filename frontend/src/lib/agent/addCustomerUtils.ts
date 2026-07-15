import type { CreateCustomerPayload } from '../../types/agent';
import type {
  AddCustomerFormState,
  AddressFields,
  FamilyAssetsState,
  LocationFields,
  PropertyTypeId,
  WizardStepId,
} from '../../types/addCustomer';
import { PROPERTY_TYPE_CONFIG } from '../../types/addCustomer';
import { OTHER_VALUE } from '../../lib/agent/formOptions';

export function calculateAge(dateOfBirth: string): string {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : '';
}

export function calculateYearsMarried(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '';
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '';
  let years = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    years -= 1;
  }
  return years >= 0 ? String(years) : '';
}

function resolveField(value: string, other: string): string {
  if (!value) return '';
  return value === OTHER_VALUE ? other.trim() : value;
}

export function formatLocationValue(loc: LocationFields): string {
  return [
    resolveField(loc.village, loc.villageOther),
    resolveField(loc.city, loc.cityOther),
    resolveField(loc.mandal, loc.mandalOther),
    resolveField(loc.district, loc.districtOther),
    resolveField(loc.state, loc.stateOther),
    resolveField(loc.country, loc.countryOther),
  ]
    .filter(Boolean)
    .join(', ');
}

export function formatAddress(addr: AddressFields): string {
  return [
    addr.houseNo,
    addr.street,
    resolveField(addr.village, addr.villageOther),
    resolveField(addr.mandal, addr.mandalOther),
    resolveField(addr.city, addr.cityOther),
    resolveField(addr.district, addr.districtOther),
    resolveField(addr.state, addr.stateOther),
    resolveField(addr.country, addr.countryOther),
    addr.pinCode,
  ]
    .filter(Boolean)
    .join(', ');
}

export function hasAddressContent(addr: AddressFields): boolean {
  return Object.entries(addr).some(([key, v]) => {
    if (key.endsWith('Other')) return false;
    if (key === 'mobile' || key === 'email') return false;
    return typeof v === 'string' && v.trim() !== '';
  });
}

export function isValidMobile(value: string): boolean {
  return /^\d{10}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPinCode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

function cleanRecord(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const cleaned = Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === '' || value === undefined || value === null) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        value !== null &&
        Object.keys(value as object).length === 0
      ) {
        return false;
      }
      return true;
    }),
  );
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function resolveFormValue(value: string, other: string): string | undefined {
  const resolved = resolveField(value, other);
  return resolved || undefined;
}

export function validateFamilyAssets(assets: FamilyAssetsState): string | undefined {
  for (const typeId of assets.selectedTypes) {
    const entries = assets.entries[typeId] || [];
    if (entries.length === 0) {
      const label = PROPERTY_TYPE_CONFIG.find((t) => t.id === typeId)?.label ?? typeId;
      return `Add at least one ${label} entry`;
    }
  }
  return undefined;
}

export function buildCreatePayload(form: AddCustomerFormState): CreateCustomerPayload {
  const communicationAddress = form.personalDetails.communicationAddress as AddressFields;
  const composedAddress = formatAddress(communicationAddress) || form.address;

  const personalDetails = {
    ...form.personalDetails,
    age: calculateAge(form.dateOfBirth),
    birthPlace: form.personalDetails.birthPlace,
    nativePlace: form.personalDetails.nativePlace,
    settledPlace: form.personalDetails.settledPlace,
  };

  const payload: CreateCustomerPayload = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim() || undefined,
    gender: form.gender || undefined,
    dateOfBirth: form.dateOfBirth || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    address: composedAddress || undefined,
    religion: resolveFormValue(form.religion, form.religionOther),
    caste: resolveFormValue(form.caste, form.casteOther),
    motherTongue: resolveFormValue(form.motherTongue, form.motherTongueOther),
    occupation: resolveFormValue(form.occupation, form.occupationOther),
    education: resolveFormValue(form.education, form.educationOther),
    status: form.status,
    personalDetails: cleanRecord(personalDetails),
    familyDetails: cleanRecord({
      ...form.familyDetails,
      familyAssets: form.familyDetails.familyAssets,
    }),
    educationDetails: cleanRecord(form.educationDetails),
    religionDetails: cleanRecord({
      ...form.religionDetails,
      gothra:
        (form.religionDetails.gothra as string) ||
        (form.personalDetails.gothram as string) ||
        undefined,
      star:
        (form.religionDetails.star as string) ||
        (form.personalDetails.star as string) ||
        undefined,
      padam:
        (form.religionDetails.padam as string) ||
        (form.personalDetails.padam as string) ||
        undefined,
      rasi:
        (form.religionDetails.rasi as string) ||
        (form.personalDetails.rasi as string) ||
        undefined,
      kujaDosham:
        (form.religionDetails.kujaDosham as string) ||
        (form.personalDetails.kujaDosham as string) ||
        undefined,
    }),
    partnerPreferences: cleanRecord({
      ...form.partnerPreferences,
      notes: (form.partnerPreferences.otherExpectations as string) || undefined,
    }),
  };

  return payload;
}

export function validateStep(
  step: WizardStepId,
  form: AddCustomerFormState,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (step === 0) {
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    if (!form.gender) errors.gender = 'Gender is required';
    if (!form.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';

    if (!form.phone.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!isValidMobile(form.phone)) {
      errors.phone = 'Please enter a valid 10-digit mobile number.';
    }

    const alternate = ((form.personalDetails.alternateMobile as string) || '').trim();
    if (alternate) {
      if (!isValidMobile(alternate)) {
        errors.alternateMobile = 'Please enter a valid 10-digit mobile number.';
      } else if (alternate === form.phone.trim()) {
        errors.alternateMobile = 'Alternate mobile cannot be the same as the primary mobile number.';
      }
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!form.profilePhoto) errors.profilePhoto = 'Profile photo is required';
  }

  if (step === 3) {
    const addr = (form.personalDetails.communicationAddress as AddressFields) || ({} as AddressFields);
    if (!hasAddressContent(addr)) {
      errors.address = 'Address is required';
    }
    if (addr.pinCode?.trim() && !isValidPinCode(addr.pinCode)) {
      errors.pinCode = 'Please enter a valid 6-digit pin code.';
    }
  }

  if (step === 4) {
    const fatherName = (form.familyDetails.fatherName as string) || '';
    if (!fatherName.trim()) errors.fatherName = "Father's name is required";

    const familyAssets = form.familyDetails.familyAssets as FamilyAssetsState;
    const assetError = validateFamilyAssets(familyAssets || { selectedTypes: [], entries: {} });
    if (assetError) errors.familyAssets = assetError;
  }

  return errors;
}

export function validateAll(form: AddCustomerFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  for (let step = 0; step < 8; step += 1) {
    Object.assign(errors, validateStep(step as WizardStepId, form));
  }
  return errors;
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    return value
      .map((item) => {
        if (typeof item === 'object' && item !== null) {
          return Object.values(item as Record<string, unknown>)
            .filter((v) => v)
            .join(', ');
        }
        return String(item);
      })
      .join('; ');
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.selectedTypes && obj.entries) {
      const assets = obj as unknown as FamilyAssetsState;
      const parts = assets.selectedTypes.map((typeId: PropertyTypeId) => {
        const count = assets.entries[typeId]?.length ?? 0;
        const label = PROPERTY_TYPE_CONFIG.find((t) => t.id === typeId)?.label ?? typeId;
        return `${label} (${count})`;
      });
      return parts.length ? parts.join(', ') : '—';
    }
    const parts = Object.entries(obj)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `${k}: ${v}`);
    return parts.length ? parts.join(', ') : '—';
  }
  return String(value);
}
