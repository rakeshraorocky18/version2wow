export interface PersonalDetails {
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  country: string;
  state: string;
  city: string;
  address: string;
  languagesKnown: string[];
}

export interface EducationEntry {
  id: string;
  qualification: string;
  degree: string;
  specialization: string;
  institutionName: string;
  universityBoard: string;
  startYear: string;
  endYear: string;
  percentageCgpa: string;
  certifications: string;
}

export interface Experience {
  currentlyWorking: boolean;
  companyName: string;
  jobTitle: string;
  industry: string;
  employmentType: string;
  yearsOfExperience: string;
  currentSalary: string;
  skills: string;
  linkedIn: string;
  portfolioWebsite: string;
  resumeUrl: string;
}

export interface ExpressYourself {
  aboutMe: string;
  lookingFor: string;
  lifeGoals: string;
  myStrengths: string;
  favoriteQuote: string;
  futureDreams: string;
  whatMakesMeHappy: string;
  anythingElse: string;
}

export interface WizardProfile {
  personalDetails: PersonalDetails;
  education: EducationEntry[];
  experience: Experience;
  hobbies: string[];
  expressYourself: ExpressYourself;
  profilePhoto: File | null;
  profilePhotoPreview: string;
  existingPhotoUrl: string;
  resumeFile: File | null;
  existingResumeUrl: string;
}

export type StepErrors = Record<string, string>;

export const WIZARD_STEPS = [
  { id: 1, key: 'personal', label: 'Personal Details' },
  { id: 2, key: 'education', label: 'Education Details' },
  { id: 3, key: 'experience', label: 'Professional Experience' },
  { id: 4, key: 'hobbies', label: 'Hobbies & Interests' },
  { id: 5, key: 'express', label: 'Express Yourself' },
  { id: 6, key: 'review', label: 'Review & Summary' },
] as const;

export const PRESET_HOBBIES = [
  'Reading', 'Music', 'Movies', 'Traveling', 'Cooking', 'Photography',
  'Cricket', 'Football', 'Chess', 'Fitness', 'Yoga', 'Gaming',
  'Swimming', 'Gardening',
];

export const EXPRESS_FIELDS: { key: keyof ExpressYourself; label: string; maxLength: number }[] = [
  { key: 'aboutMe', label: 'About Me', maxLength: 2000 },
  { key: 'lookingFor', label: 'Looking For', maxLength: 1500 },
  { key: 'lifeGoals', label: 'Life Goals', maxLength: 1500 },
  { key: 'myStrengths', label: 'My Strengths', maxLength: 1000 },
  { key: 'favoriteQuote', label: 'Favorite Quote', maxLength: 500 },
  { key: 'futureDreams', label: 'Future Dreams', maxLength: 1500 },
  { key: 'whatMakesMeHappy', label: 'What Makes Me Happy', maxLength: 1000 },
  { key: 'anythingElse', label: 'Anything Else', maxLength: 1500 },
];

export function createEmptyEducation(): EducationEntry {
  return {
    id: crypto.randomUUID(),
    qualification: '',
    degree: '',
    specialization: '',
    institutionName: '',
    universityBoard: '',
    startYear: '',
    endYear: '',
    percentageCgpa: '',
    certifications: '',
  };
}

export function createEmptyProfile(): WizardProfile {
  return {
    personalDetails: {
      firstName: '',
      lastName: '',
      displayName: '',
      gender: '',
      dateOfBirth: '',
      phone: '',
      email: '',
      country: 'India',
      state: '',
      city: '',
      address: '',
      languagesKnown: [],
    },
    education: [createEmptyEducation()],
    experience: {
      currentlyWorking: false,
      companyName: '',
      jobTitle: '',
      industry: '',
      employmentType: '',
      yearsOfExperience: '',
      currentSalary: '',
      skills: '',
      linkedIn: '',
      portfolioWebsite: '',
      resumeUrl: '',
    },
    hobbies: [],
    expressYourself: {
      aboutMe: '',
      lookingFor: '',
      lifeGoals: '',
      myStrengths: '',
      favoriteQuote: '',
      futureDreams: '',
      whatMakesMeHappy: '',
      anythingElse: '',
    },
    profilePhoto: null,
    profilePhotoPreview: '',
    existingPhotoUrl: '',
    resumeFile: null,
    existingResumeUrl: '',
  };
}
