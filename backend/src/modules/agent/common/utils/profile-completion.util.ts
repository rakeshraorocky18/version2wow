import { AgentCustomerEntity } from '../entities/agent-customer.entity';

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

function objectFillRatio(obj: Record<string, unknown> | null | undefined): number {
  if (!obj || typeof obj !== 'object') return 0;
  const values = Object.values(obj);
  if (values.length === 0) return 0;
  const filled = values.filter((v) => hasValue(v)).length;
  return filled / values.length;
}

/**
 * Weighted profile completion (100 total).
 * Basic 15 · Photo 10 · Education 10 · Occupation 10 · Religion 5 · Caste 5 ·
 * Family 10 · Partner Prefs 20 · Address 5 · Verification 5 · Documents 10
 */
export function calculateProfileCompletion(
  customer: Partial<AgentCustomerEntity>,
  documentCount = 0,
  hasProfilePhoto = false,
): number {
  let score = 0;
  const personal = (customer.personalDetails || {}) as Record<string, unknown>;
  const addr = (personal.communicationAddress || {}) as Record<string, unknown>;

  // Basic Details — 15
  const basicFields = [
    customer.firstName,
    customer.lastName,
    customer.gender,
    customer.dateOfBirth,
    customer.phone,
    customer.motherTongue,
  ];
  score += (basicFields.filter(hasValue).length / basicFields.length) * 15;

  // Profile Photo — 10
  const photoPresent =
    hasProfilePhoto ||
    hasValue(personal.profilePhoto) ||
    hasValue(personal.photo);
  score += photoPresent ? 10 : 0;

  // Education — 10
  const educationRatio = Math.max(
    objectFillRatio(customer.educationDetails),
    hasValue(customer.education) ? 0.7 : 0,
  );
  score += educationRatio * 10;

  // Occupation — 10
  score += hasValue(customer.occupation) ? 10 : 0;

  // Religion — 5
  const religionRatio = Math.max(
    objectFillRatio(customer.religionDetails),
    hasValue(customer.religion) ? 0.7 : 0,
  );
  score += religionRatio * 5;

  // Caste — 5
  score += hasValue(customer.caste) ? 5 : 0;

  // Family Details — 10
  score += objectFillRatio(customer.familyDetails) * 10;

  // Partner Preferences — 20
  score += objectFillRatio(customer.partnerPreferences) * 20;

  // Address — 5
  const addressFilled =
    hasValue(customer.address) ||
    hasValue(addr.city) ||
    hasValue(addr.state) ||
    hasValue(personal.city);
  score += addressFilled ? 5 : 0;

  // Verification — 5
  const verified =
    Boolean((customer as { isVerified?: boolean }).isVerified) || documentCount >= 2;
  score += verified ? 5 : documentCount === 1 ? 2 : 0;

  // Documents — 10 (full credit at 2+ docs)
  score += Math.min(documentCount / 2, 1) * 10;

  return Math.round(Math.min(score, 100));
}

/** Minimum completion % required before full matchmaking unlocks. */
export function getMatchmakingCompletionThreshold(): number {
  const raw = Number(process.env.AGENT_MATCH_COMPLETION_THRESHOLD || 80);
  if (!Number.isFinite(raw)) return 80;
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function isMatchmakingUnlocked(profileCompletion: number): boolean {
  return (profileCompletion ?? 0) >= getMatchmakingCompletionThreshold();
}
