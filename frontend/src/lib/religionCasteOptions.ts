export const RELIGION_OPTIONS = [
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
] as const;

export const CASTE_BY_RELIGION: Record<string, string[]> = {
  Hindu: [
    'Reddy',
    'Brahmin',
    'Kshatriya',
    'Vaishya',
    'Kapu',
    'Naidu',
    'Vellalar',
    'Nair',
    'Maratha',
    'Rajput',
    'Kayastha',
    'Yadav',
    'Kurmi',
    'Goud',
    'Balija',
    'Scheduled Caste',
    'Scheduled Tribe',
    'Other',
  ],
  Muslim: ['Sunni', 'Shia', 'Syed', 'Sheikh', 'Pathan', 'Ansari', 'Other'],
  Christian: ['Catholic', 'Protestant', 'Orthodox', 'Syrian Christian', 'Pentecostal', 'Other'],
  Sikh: ['Jat Sikh', 'Khatri', 'Ramgarhia', 'Arora', 'Other'],
  Jain: ['Digambar', 'Shwetambar', 'Other'],
  Buddhist: ['Mahayana', 'Theravada', 'Navayana', 'Other'],
  Jewish: ['Other'],
  Parsi: ['Other'],
  Other: ['Other'],
};

export function getCastesForReligion(religion: string): string[] {
  if (!religion || religion === 'Spiritual - not religious' || religion === 'No Religion') {
    return [];
  }
  return CASTE_BY_RELIGION[religion] || ['Other'];
}

export const SUB_CASTE_BY_CASTE: Record<string, string[]> = {
  Reddy: ['Kapu Reddy', 'Motati Reddy', 'Panta Reddy', 'Gudati Reddy', 'Other'],
  Brahmin: ['Iyengar', 'Iyer', 'Niyogi', 'Vaidiki', 'Smartha', 'Other'],
  Kapu: ['Telaga', 'Balija', 'Ontari', 'Other'],
  Naidu: ['Kamma', 'Velama', 'Other'],
  Kshatriya: ['Rajput', 'Maratha', 'Other'],
  Vaishya: ['Agrawal', 'Komati', 'Other'],
  Nair: ['Nambiar', 'Menon', 'Pillai', 'Other'],
  Maratha: ['96 Kuli Maratha', 'Kunbi', 'Other'],
  Rajput: ['Chauhan', 'Solanki', 'Other'],
  Muslim: ['Sunni', 'Shia', 'Other'],
  Other: ['Other'],
};

export function getSubCastesForCaste(caste: string): string[] {
  if (!caste) return [];
  return SUB_CASTE_BY_CASTE[caste] || ['Other'];
}

export const MOTHER_TONGUE_OPTIONS = [
  'Telugu',
  'Hindi',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Urdu',
  'Odia',
  'Assamese',
  'Konkani',
  'English',
  'Other',
];

export const COMMUNITY_OPTIONS = [
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Bengali',
  'Gujarati',
  'Punjabi',
  'Hindi',
  'North Indian',
  'South Indian',
  'Other',
];

export const PARTNER_MARITAL_OPTIONS = [
  "Doesn't Matter",
  'Never Married',
  'Divorced',
  'Widowed',
  'Awaiting Divorce',
  'Annulled',
];
