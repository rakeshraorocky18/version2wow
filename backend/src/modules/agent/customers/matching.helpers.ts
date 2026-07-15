import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentCustomerStatus } from '../common/enums/agent.enums';

export type JsonBag = Record<string, unknown>;

export function asRecord(value: unknown): JsonBag {
  return value && typeof value === 'object' ? (value as JsonBag) : {};
}

export function str(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

export function parseAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age;
}

export function parseHeightCm(height: unknown): number | null {
  if (height === null || height === undefined || height === '') return null;
  const match = String(height).match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function oppositeGender(gender?: string | null): string | null {
  const g = (gender || '').toLowerCase().trim();
  if (g === 'male' || g === 'm' || g === 'man' || g === 'boy') return 'female';
  if (g === 'female' || g === 'f' || g === 'woman' || g === 'girl') return 'male';
  return null;
}

export function includesLoose(haystack: unknown, needle?: string): boolean {
  if (!needle?.trim()) return true;
  const h = str(haystack).toLowerCase();
  const n = needle.trim().toLowerCase();
  if (!h) return false;
  return h.includes(n) || n.includes(h);
}

export function locationField(details: JsonBag, key: string): string {
  const addr = asRecord(details.communicationAddress);
  const settled = asRecord(details.settledPlace);
  const native = asRecord(details.nativePlace);
  return (
    str(addr[key]) ||
    str(addr[`${key}Other`]) ||
    str(settled[key]) ||
    str(settled[`${key}Other`]) ||
    str(native[key]) ||
    str(native[`${key}Other`]) ||
    str(details[key])
  );
}

export function parseAgeRange(ageRange: unknown): { min?: number; max?: number } {
  const raw = str(ageRange);
  if (!raw) return {};
  const range = raw.match(/(\d+)\s*[-–to]+\s*(\d+)/i);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  return {};
}

export interface CompatibilityResult {
  score: number;
  reasons: string[];
}

export function toMatchProfile(
  candidate: AgentCustomerEntity,
  photoUrl: string | null,
  documentCount: number,
  compatibility: CompatibilityResult,
) {
  const personal = asRecord(candidate.personalDetails);
  const family = asRecord(candidate.familyDetails);
  const education = asRecord(candidate.educationDetails);
  const religion = asRecord(candidate.religionDetails);
  const age = parseAge(candidate.dateOfBirth);
  const updatedAt = candidate.updatedAt ? new Date(candidate.updatedAt) : null;
  const recentlyActive =
    !!updatedAt && Date.now() - updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
  const isVerified = documentCount > 0 || (candidate.profileCompletion ?? 0) >= 80;
  const isPremium =
    candidate.status === AgentCustomerStatus.ACTIVE &&
    (candidate.profileCompletion ?? 0) >= 85;
  const onlineStatus =
    !!updatedAt && Date.now() - updatedAt.getTime() < 24 * 60 * 60 * 1000;

  const aboutMe =
    str(personal.aboutMe) ||
    str(personal.bio) ||
    str(personal.about) ||
    str(personal.description) ||
    '';
  const community =
    str(religion.community) ||
    str(personal.community) ||
    str(candidate.caste) ||
    '';

  return {
    id: candidate.id,
    customerCode: candidate.customerCode,
    firstName: candidate.firstName,
    lastName: candidate.lastName ?? '',
    name: [candidate.firstName, candidate.lastName].filter(Boolean).join(' ').trim(),
    gender: candidate.gender ?? '',
    dateOfBirth: candidate.dateOfBirth ?? null,
    age,
    height: str(personal.height) || null,
    religion: candidate.religion ?? '',
    caste: candidate.caste ?? '',
    community,
    aboutMe,
    subCaste: str(personal.subCaste) || str(religion.subCaste) || '',
    motherTongue: candidate.motherTongue ?? '',
    maritalStatus: str(personal.maritalStatus) || '',
    education: candidate.education ?? '',
    occupation: candidate.occupation ?? '',
    annualIncome: str(education.annualIncome) || '',
    country: locationField(personal, 'country'),
    state: locationField(personal, 'state'),
    city: locationField(personal, 'city'),
    familyType: str(family.familyType) || '',
    familyStatus: str(family.familyStatus) || '',
    foodPreference: str(personal.foodPreference || personal.diet) || '',
    smoking: str(personal.smoking) || '',
    drinking: str(personal.drinking) || '',
    horoscope: str(religion.rasi || personal.rasi || personal.star) || '',
    manglik: str(religion.kujaDosham || personal.manglik || personal.kujaDosham) || '',
    profileCompletion: candidate.profileCompletion ?? 0,
    status: candidate.status,
    assignedAgentId: candidate.assignedAgentId,
    phone: candidate.phone ?? '',
    email: candidate.email ?? '',
    profilePhoto: photoUrl,
    isVerified,
    isPremium,
    onlineStatus,
    recentlyActive,
    compatibilityScore: compatibility.score,
    reasons: compatibility.reasons,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}
