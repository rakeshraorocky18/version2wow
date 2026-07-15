import type { AgentCustomerStatus, AgentDocumentType, CreateCustomerPayload } from './agent';

export interface LocationFields {
  country: string;
  countryOther: string;
  state: string;
  stateOther: string;
  district: string;
  districtOther: string;
  mandal: string;
  mandalOther: string;
  village: string;
  villageOther: string;
  city: string;
  cityOther: string;
}

export interface AddressFields {
  houseNo: string;
  street: string;
  country: string;
  countryOther: string;
  state: string;
  stateOther: string;
  district: string;
  districtOther: string;
  mandal: string;
  mandalOther: string;
  city: string;
  cityOther: string;
  village: string;
  villageOther: string;
  pinCode: string;
  mobile: string;
  email: string;
}

export interface SiblingEntry {
  id: string;
  name: string;
  age: string;
  maritalStatus: string;
  qualification: string;
  profession: string;
}

export interface PendingDocument {
  id: string;
  type: AgentDocumentType;
  file: File;
  label: string;
}

export type PropertyTypeId =
  | 'independent_house'
  | 'apartment'
  | 'agricultural_land'
  | 'commercial_building'
  | 'residential_plot'
  | 'commercial_plot'
  | 'farm_house'
  | 'villa'
  | 'vehicle'
  | 'gold'
  | 'investments'
  | 'other';

export interface PropertyFieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  placeholder?: string;
  fullWidth?: boolean;
}

export interface PropertyTypeConfig {
  id: PropertyTypeId;
  label: string;
  fields: PropertyFieldConfig[];
}

export interface PropertyEntry {
  id: string;
  [key: string]: string;
}

export interface FamilyAssetsState {
  selectedTypes: PropertyTypeId[];
  entries: Partial<Record<PropertyTypeId, PropertyEntry[]>>;
}

export const PROPERTY_TYPE_CONFIG: PropertyTypeConfig[] = [
  {
    id: 'independent_house',
    label: 'Independent House',
    fields: [
      { key: 'location', label: 'House Location' },
      { key: 'area', label: 'Area (Sq Ft)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'apartment',
    label: 'Apartment',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Sq Ft)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'villa',
    label: 'Villa',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Sq Ft)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'agricultural_land',
    label: 'Agricultural Land',
    fields: [
      { key: 'village', label: 'Village' },
      { key: 'acres', label: 'Acres', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'residential_plot',
    label: 'Residential Plot',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Sq Yards)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'commercial_plot',
    label: 'Commercial Plot',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Sq Yards)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'commercial_building',
    label: 'Commercial Building',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Sq Ft)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'farm_house',
    label: 'Farm House',
    fields: [
      { key: 'location', label: 'Location' },
      { key: 'area', label: 'Area (Acres)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    fields: [
      { key: 'vehicleType', label: 'Vehicle Type', placeholder: 'Car, Bike, etc.' },
      { key: 'makeModel', label: 'Make / Model' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'gold',
    label: 'Gold / Jewellery',
    fields: [
      { key: 'description', label: 'Description' },
      { key: 'weight', label: 'Weight (grams)', type: 'number' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'investments',
    label: 'Investments',
    fields: [
      { key: 'investmentType', label: 'Investment Type', placeholder: 'Stocks, FD, etc.' },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
  {
    id: 'other',
    label: 'Other',
    fields: [
      { key: 'description', label: 'Description', fullWidth: true },
      { key: 'estimatedValue', label: 'Estimated Value' },
      { key: 'ownership', label: 'Ownership', type: 'select' },
      { key: 'remarks', label: 'Remarks', fullWidth: true },
    ],
  },
];

export interface AddCustomerFormState {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  religion: string;
  religionOther: string;
  caste: string;
  casteOther: string;
  motherTongue: string;
  motherTongueOther: string;
  occupation: string;
  occupationOther: string;
  education: string;
  educationOther: string;
  status: AgentCustomerStatus;
  personalDetails: Record<string, unknown>;
  familyDetails: Record<string, unknown>;
  educationDetails: Record<string, unknown>;
  religionDetails: Record<string, unknown>;
  partnerPreferences: Record<string, unknown>;
  sameAsCommunication: boolean;
  profilePhoto: File | null;
  pendingDocuments: PendingDocument[];
}

export const WIZARD_STEPS = [
  { id: 0, label: 'Personal', icon: '👤', title: 'Personal Details' },
  { id: 1, label: 'Horoscope', icon: '✨', title: 'Horoscope Details' },
  { id: 2, label: 'Relationship', icon: '💍', title: 'Relationship Status' },
  { id: 3, label: 'Location', icon: '📍', title: 'Location Details' },
  { id: 4, label: 'Family', icon: '👨‍👩‍👧', title: 'Family Details' },
  { id: 5, label: 'Career', icon: '💼', title: 'Education & Career' },
  { id: 6, label: 'Partner', icon: '❤️', title: 'Partner Preferences' },
  { id: 7, label: 'Documents', icon: '📄', title: 'Documents' },
  { id: 8, label: 'Review', icon: '✓', title: 'Review & Submit' },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]['id'];

export function emptyLocation(): LocationFields {
  return {
    country: '',
    countryOther: '',
    state: '',
    stateOther: '',
    district: '',
    districtOther: '',
    mandal: '',
    mandalOther: '',
    village: '',
    villageOther: '',
    city: '',
    cityOther: '',
  };
}

export function emptyAddress(): AddressFields {
  return {
    houseNo: '',
    street: '',
    country: '',
    countryOther: '',
    state: '',
    stateOther: '',
    district: '',
    districtOther: '',
    mandal: '',
    mandalOther: '',
    city: '',
    cityOther: '',
    village: '',
    villageOther: '',
    pinCode: '',
    mobile: '',
    email: '',
  };
}

export function emptyFamilyAssets(): FamilyAssetsState {
  return { selectedTypes: [], entries: {} };
}

export function createEmptySibling(): SiblingEntry {
  return {
    id: crypto.randomUUID(),
    name: '',
    age: '',
    maritalStatus: '',
    qualification: '',
    profession: '',
  };
}

export function createEmptyPropertyEntry(): PropertyEntry {
  return { id: crypto.randomUUID() };
}

export function createEmptyForm(): AddCustomerFormState {
  return {
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    address: '',
    religion: '',
    religionOther: '',
    caste: '',
    casteOther: '',
    motherTongue: '',
    motherTongueOther: '',
    occupation: '',
    occupationOther: '',
    education: '',
    educationOther: '',
    status: 'pending',
    personalDetails: {
      middleName: '',
      timeOfBirth: '',
      hasHoroscope: '',
      alternateMobile: '',
      subCaste: '',
      subCasteOther: '',
      star: '',
      padam: '',
      rasi: '',
      gothram: '',
      kujaDosham: '',
      complexion: '',
      height: '',
      weight: '',
      maritalStatus: '',
      marriageDate: '',
      divorceDate: '',
      separationDate: '',
      yearsMarried: '',
      hasChildren: '',
      numberOfBoys: '',
      numberOfGirls: '',
      livingWith: '',
      bloodGroup: '',
      about: '',
      birthPlace: emptyLocation(),
      nativePlace: emptyLocation(),
      settledPlace: emptyLocation(),
      communicationAddress: emptyAddress(),
      registration: {
        registrationDate: new Date().toISOString().split('T')[0],
        registrationFee: '',
        amountPaid: '',
        balance: '',
        paymentStatus: '',
        remarks: '',
      },
    },
    familyDetails: {
      fatherName: '',
      fatherAge: '',
      fatherQualification: '',
      fatherProfession: '',
      motherName: '',
      motherAge: '',
      motherQualification: '',
      motherProfession: '',
      familyType: '',
      familyStatus: '',
      brothers: [] as SiblingEntry[],
      sisters: [] as SiblingEntry[],
      familyAssets: emptyFamilyAssets(),
    },
    educationDetails: {
      institution: '',
      education: '',
      company: '',
      designation: '',
      officeName: '',
      businessName: '',
      workLocation: '',
    },
    religionDetails: {
      gothra: '',
      star: '',
      padam: '',
      rasi: '',
      kujaDosham: '',
    },
    partnerPreferences: {
      preferredLocation: emptyLocation(),
      ageRange: '',
      religion: '',
      caste: '',
      subCaste: '',
      education: '',
      profession: '',
      complexion: '',
      otherExpectations: '',
    },
    sameAsCommunication: false,
    profilePhoto: null,
    pendingDocuments: [],
  };
}

export type AddCustomerPayload = CreateCustomerPayload;
