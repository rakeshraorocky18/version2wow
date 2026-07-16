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
    'Kamma',
    'Velama',
    'Other OC',
    'BC-A',
    'BC-B',
    'BC-C',
    'BC-D',
    'BC-E',
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
  Kamma: ['Chowdary', 'Naidu', 'Other'],
  Velama: ['Adi Velama', 'Koppula Velama', 'Padmanayaka Velama', 'Polinati Velama', 'Yelama', 'Other'],
  'Other OC': ['Velama', 'Kamma', 'Naidu', 'Kshatriya', 'Other'],
  Naidu: ['Kamma', 'Velama', 'Other'],
  Kshatriya: ['Rajput', 'Maratha', 'Other'],
  Vaishya: ['Agrawal', 'Komati', 'Other'],
  'BC-A': ['Agnikula Kshatriya', 'Bestha', 'Boya', 'Gangaputra', 'Rajaka', 'Vaddera', 'Other'],
  'BC-B': ['Goud', 'Padmashali', 'Devanga', 'Kummari', 'Mudiraj', 'Yadava', 'Other'],
  'BC-C': ['Converted Christian', 'Other'],
  'BC-D': ['Kapu', 'Balija', 'Telaga', 'Turpu Kapu', 'Munnuru Kapu', 'Other'],
  'BC-E': ['Shaik', 'Syed', 'Pathan', 'Qureshi', 'Dudekula', 'Other'],
  'Scheduled Caste': ['Mala', 'Madiga', 'Adi Andhra', 'Adi Dravida', 'Relli', 'Other'],
  'Scheduled Tribe': ['Lambadi', 'Koya', 'Yanadi', 'Yerukula', 'Gond', 'Chenchu', 'Other'],
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
