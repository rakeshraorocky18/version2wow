export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: 'never married', label: 'Never Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
];

export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export const RELIGION_OPTIONS = [
  { value: 'hindu', label: 'Hindu' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'christian', label: 'Christian' },
  { value: 'sikh', label: 'Sikh' },
  { value: 'jain', label: 'Jain' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'other', label: 'Other' },
];

export const CASTE_OPTIONS = [
  { value: 'brahmin', label: 'Brahmin' },
  { value: 'kshatriya', label: 'Kshatriya' },
  { value: 'vaishya', label: 'Vaishya' },
  { value: 'reddy', label: 'Reddy' },
  { value: 'kamma', label: 'Kamma' },
  { value: 'kapu', label: 'Kapu' },
  { value: 'velama', label: 'Velama' },
  { value: 'padmashali', label: 'Padmashali' },
  { value: 'sc', label: 'SC' },
  { value: 'st', label: 'ST' },
  { value: 'bc', label: 'BC' },
  { value: 'other', label: 'Other' },
];

export const SUB_CASTE_OPTIONS = [
  { value: 'iyengar', label: 'Iyengar' },
  { value: 'iyer', label: 'Iyer' },
  { value: 'niyogi', label: 'Niyogi' },
  { value: 'vadama', label: 'Vadama' },
  { value: 'other', label: 'Other' },
];

export const MOTHER_TONGUE_OPTIONS = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'gujarati', label: 'Gujarati' },
  { value: 'bengali', label: 'Bengali' },
  { value: 'english', label: 'English' },
  { value: 'other', label: 'Other' },
];

export const QUALIFICATION_OPTIONS = [
  { value: '10th', label: '10th / SSC' },
  { value: '12th', label: '12th / Intermediate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'phd', label: 'PhD / Doctorate' },
  { value: 'professional', label: 'Professional (CA, MBBS, etc.)' },
  { value: 'other', label: 'Other' },
];

export const OCCUPATION_OPTIONS = [
  { value: 'software', label: 'Software / IT' },
  { value: 'business', label: 'Business' },
  { value: 'government', label: 'Government Employee' },
  { value: 'private', label: 'Private Employee' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'self employed', label: 'Self Employed' },
  { value: 'not working', label: 'Not Working' },
  { value: 'other', label: 'Other' },
];

export const INCOME_RANGE_OPTIONS = [
  { value: 'below 3 lakhs', label: 'Below ₹3 Lakhs' },
  { value: '3-5 lakhs', label: '₹3 - 5 Lakhs' },
  { value: '5-10 lakhs', label: '₹5 - 10 Lakhs' },
  { value: '10-20 lakhs', label: '₹10 - 20 Lakhs' },
  { value: '20-50 lakhs', label: '₹20 - 50 Lakhs' },
  { value: 'above 50 lakhs', label: 'Above ₹50 Lakhs' },
];

export const OWNERSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'family', label: 'Family' },
  { value: 'joint', label: 'Joint' },
  { value: 'leased', label: 'Leased' },
];

export const HEIGHT_OPTIONS = Array.from({ length: 61 }, (_, i) => {
  const cm = 140 + i;
  return { value: String(cm), label: `${cm} cm` };
});

export const KUJA_DOSHAM_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unknown', label: 'Unknown' },
];

export const PADAM_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
];

export const OTHER_VALUE = 'other';
