/**
 * Profile field privacy for discovery and pre-match views.
 * Sensitive fields must not appear in API responses until a match is accepted.
 */

const SENSITIVE_TOP_LEVEL_KEYS = [
  'email',
  'phone',
  'address',
  'pincode',
  'income',
  'annualIncome',
  'companyName',
  'industry',
  'experience',
  'yearsOfExperience',
  'workLocation',
  'currentlyWorking',
  'currentStatus',
  'currentStatusOther',
  'highestQualification',
  'qualificationOther',
  'degreeName',
  'specialization',
  'collegeUniversity',
  'passingYear',
  'gradeCgpa',
  'interests',
  'hobbies',
  'diet',
  'drinking',
  'smoking',
  'familyType',
  'familyStatus',
  'fatherName',
  'fatherAlive',
  'fatherOccupation',
  'motherName',
  'motherAlive',
  'motherOccupation',
  'siblings',
  'siblingDetails',
  'horoscopeAvailable',
  'rashi',
  'nakshatra',
  'gothram',
  'manglik',
  'horoscope',
  'zodiacSign',
  'timeOfBirth',
  'placeOfBirth',
  'horoscopeFileUrl',
  'prefAgeMin',
  'prefAgeMax',
  'prefHeightMin',
  'prefHeightMax',
  'prefMaritalStatuses',
  'prefReligions',
  'prefCastes',
  'prefCities',
  'prefLocations',
  'prefFamilyType',
  'resumeUrl',
  'socialLinks',
  'linkedinUrl',
  'facebookUrl',
  'instagramUrl',
  'documents',
] as const;

const PERSONAL_DETAILS_ALLOWED = new Set([
  'firstName',
  'middleName',
  'lastName',
  'displayName',
  'gender',
  'dateOfBirth',
  'country',
  'state',
  'city',
  'height',
  'weight',
  'bodyType',
  'complexion',
  'bloodGroup',
  'physicalStatus',
  'languagesKnown',
  'jobTitle',
]);

function pickAllowedPersonalDetails(
  pd: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!pd) return {};
  const out: Record<string, unknown> = {};
  for (const key of PERSONAL_DETAILS_ALLOWED) {
    if (pd[key] !== undefined && pd[key] !== null && pd[key] !== '') {
      out[key] = pd[key];
    }
  }
  return out;
}

export function stripGalleryFromProfile(
  profile: Record<string, unknown>,
): Record<string, unknown> {
  const wizard = (profile.wizardProfile || {}) as Record<string, unknown>;
  const mainPhoto = profile.profilePhoto || wizard.profilePhoto;
  return {
    ...profile,
    photos: [],
    galleryHidden: true,
    wizardProfile: {
      ...wizard,
      profilePhoto: mainPhoto,
    },
  };
}

/**
 * Limited profile: basic info only (photo, name, age, gender, profession,
 * about me, religion, caste, personal details, location).
 */
export function toLimitedProfileView(
  profile: Record<string, unknown>,
): Record<string, unknown> {
  const wizard = (profile.wizardProfile || {}) as Record<string, unknown>;
  const pd = pickAllowedPersonalDetails(
    (wizard.personalDetails || {}) as Record<string, unknown>,
  );
  const religion = { ...((wizard.religion || {}) as Record<string, unknown>) };
  const expressYourself = (wizard.expressYourself || {}) as Record<string, unknown>;
  const aboutMe =
    (expressYourself.aboutMe as string) ||
    (profile.bio as string) ||
    undefined;
  const mainPhoto = profile.profilePhoto || wizard.profilePhoto;
  const profession =
    (profile.occupation as string) ||
    (profile.jobTitle as string) ||
    (pd.jobTitle as string) ||
    undefined;

  const limited: Record<string, unknown> = {
    id: profile.id,
    userId: profile.userId,
    firstName: profile.firstName,
    lastName: profile.lastName,
    displayName: profile.displayName,
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth,
    age: profile.age,
    height: profile.height,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    religion: profile.religion,
    caste: profile.caste,
    subCaste: profile.subCaste,
    motherTongue: profile.motherTongue,
    maritalStatus: profile.maritalStatus,
    occupation: profession,
    jobTitle: profession,
    bio: aboutMe,
    profilePhoto: mainPhoto,
    photos: [],
    galleryHidden: true,
    isComplete: profile.isComplete,
    profileCompleted: profile.profileCompleted ?? profile.isComplete,
    isVerified: profile.isVerified,
    isPremium: profile.isPremium,
    isBoosted: profile.isBoosted,
    subscriptionType: profile.subscriptionType,
    onlineStatus: profile.onlineStatus,
    compatibilityScore: profile.compatibilityScore,
    compatibility: profile.compatibility,
    interestStatus: profile.interestStatus,
    matchId: profile.matchId,
    matchPartnerUserId: profile.matchPartnerUserId,
    galleryVisibility: profile.galleryVisibility,
    wizardProfile: {
      profilePhoto: mainPhoto,
      personalDetails: pd,
      religion,
      expressYourself: aboutMe ? { aboutMe } : {},
    },
  };

  for (const key of SENSITIVE_TOP_LEVEL_KEYS) {
    delete limited[key];
  }

  return limited;
}

export function maskProfilesForDiscovery(
  profiles: Record<string, unknown>[],
): Record<string, unknown>[] {
  return profiles.map((profile) => toLimitedProfileView(profile));
}
