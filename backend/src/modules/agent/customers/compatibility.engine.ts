import { AgentCustomerEntity } from '../common/entities/agent-customer.entity';
import { AgentCustomerStatus } from '../common/enums/agent.enums';
import {
  asRecord,
  includesLoose,
  locationField,
  parseAge,
  parseAgeRange,
  parseHeightCm,
  str,
  type CompatibilityResult,
  type JsonBag,
} from './matching.helpers';

/**
 * Weighted WOW Compatibility Engine.
 * Factors are additive and easy to extend (interests, horoscope, ML score, etc.).
 */
export interface CompatibilityFactor {
  key: string;
  weight: number;
  reason: string;
  /** Returns points earned (0..weight) and whether the reason should show. */
  evaluate: (ctx: CompatibilityContext) => {
    points: number;
    matched: boolean;
    reason?: string;
  };
}

export interface CompatibilityContext {
  candidate: AgentCustomerEntity;
  viewer: AgentCustomerEntity;
  prefs: JsonBag;
  preferredLocation: JsonBag;
  personal: JsonBag;
  family: JsonBag;
  education: JsonBag;
  religion: JsonBag;
  age: number | null;
  heightCm: number | null;
  ageRange: { min?: number; max?: number };
  documentCount: number;
  isVerified: boolean;
  isPremium: boolean;
  recentlyActive: boolean;
}

function buildContext(
  candidate: AgentCustomerEntity,
  viewer: AgentCustomerEntity,
  documentCount = 0,
): CompatibilityContext {
  const prefs = asRecord(viewer.partnerPreferences);
  const personal = asRecord(candidate.personalDetails);
  const updatedAt = candidate.updatedAt ? new Date(candidate.updatedAt).getTime() : 0;
  const recentlyActive =
    !!updatedAt && Date.now() - updatedAt < 7 * 24 * 60 * 60 * 1000;
  const isVerified = documentCount > 0 || (candidate.profileCompletion ?? 0) >= 80;
  const isPremium =
    candidate.status === AgentCustomerStatus.ACTIVE &&
    (candidate.profileCompletion ?? 0) >= 85;

  return {
    candidate,
    viewer,
    prefs,
    preferredLocation: asRecord(prefs.preferredLocation),
    personal,
    family: asRecord(candidate.familyDetails),
    education: asRecord(candidate.educationDetails),
    religion: asRecord(candidate.religionDetails),
    age: parseAge(candidate.dateOfBirth),
    heightCm: parseHeightCm(personal.height),
    ageRange: parseAgeRange(prefs.ageRange),
    documentCount,
    isVerified,
    isPremium,
    recentlyActive,
  };
}

/** Core weighted factors — append new factors here for future signals. */
export const COMPATIBILITY_FACTORS: CompatibilityFactor[] = [
  {
    key: 'religion',
    weight: 20,
    reason: 'Same Religion',
    evaluate: ({ prefs, candidate, viewer }) => {
      const preferredReligion = str(prefs.religion);
      if (preferredReligion && includesLoose(candidate.religion, preferredReligion)) {
        return { points: 20, matched: true };
      }
      // Soft signal: shared religion with the selected customer when no preference set
      if (
        !preferredReligion &&
        str(viewer.religion) &&
        includesLoose(candidate.religion, viewer.religion)
      ) {
        return { points: 12, matched: true };
      }
      return { points: 0, matched: false };
    },
  },
  {
    key: 'age',
    weight: 15,
    reason: 'Preferred Age Range',
    evaluate: ({ ageRange, age }) => {
      if (ageRange.min != null || ageRange.max != null) {
        const okMin = ageRange.min == null || (age != null && age >= ageRange.min);
        const okMax = ageRange.max == null || (age != null && age <= ageRange.max);
        if (okMin && okMax && age != null) return { points: 15, matched: true };
        return { points: 0, matched: false };
      }
      if (age != null) return { points: 6, matched: false };
      return { points: 0, matched: false };
    },
  },
  {
    key: 'education',
    weight: 15,
    reason: 'Same Education Level',
    evaluate: ({ prefs, candidate }) => {
      const target = str(prefs.education);
      if (target && includesLoose(candidate.education, target)) {
        return { points: 15, matched: true };
      }
      if (str(candidate.education)) return { points: 4, matched: false };
      return { points: 0, matched: false };
    },
  },
  {
    key: 'occupation',
    weight: 10,
    reason: 'Same Profession',
    evaluate: ({ prefs, candidate }) => {
      const target = str(prefs.profession || prefs.occupation);
      if (target && includesLoose(candidate.occupation, target)) {
        return { points: 10, matched: true };
      }
      if (str(candidate.occupation)) return { points: 3, matched: false };
      return { points: 0, matched: false };
    },
  },
  {
    key: 'location',
    weight: 10,
    reason: 'Same City',
    evaluate: ({ prefs, preferredLocation, personal }) => {
      const prefCity =
        str(preferredLocation.city) ||
        str(preferredLocation.cityOther) ||
        str(prefs.city) ||
        str(prefs.location) ||
        str(prefs.specificArea);
      const prefState =
        str(preferredLocation.state) ||
        str(preferredLocation.stateOther) ||
        str(prefs.state);
      const prefCountry =
        str(preferredLocation.country) ||
        str(preferredLocation.countryOther) ||
        str(prefs.country);
      const candCity = locationField(personal, 'city');
      const candState = locationField(personal, 'state');
      const candCountry = locationField(personal, 'country');

      if (prefCity && includesLoose(candCity, prefCity)) {
        return { points: 10, matched: true, reason: 'Same City' };
      }
      if (prefState && includesLoose(candState, prefState)) {
        return { points: 7, matched: true, reason: 'Same State' };
      }
      if (prefCountry && includesLoose(candCountry, prefCountry)) {
        return { points: 4, matched: true, reason: 'Same Country' };
      }
      return { points: 0, matched: false };
    },
  },
  {
    key: 'lifestyle',
    weight: 10,
    reason: 'Lifestyle Match',
    evaluate: ({ prefs, personal, family }) => {
      const diet = str(prefs.foodPreference || prefs.diet);
      let points = 0;
      let matched = false;
      if (diet && includesLoose(personal.foodPreference || personal.diet, diet)) {
        points += 4;
        matched = true;
      }
      if (prefs.smoking && includesLoose(personal.smoking, str(prefs.smoking))) {
        points += 3;
        matched = true;
      }
      if (prefs.drinking && includesLoose(personal.drinking, str(prefs.drinking))) {
        points += 3;
        matched = true;
      }
      if (
        (prefs.familyType && includesLoose(family.familyType, str(prefs.familyType))) ||
        (prefs.familyStatus && includesLoose(family.familyStatus, str(prefs.familyStatus)))
      ) {
        points = Math.min(10, points + 3);
        matched = true;
      }
      return { points: Math.min(10, points), matched };
    },
  },
  {
    key: 'completion',
    weight: 5,
    reason: 'High Profile Completion',
    evaluate: ({ candidate }) => {
      const completion = candidate.profileCompletion ?? 0;
      if (completion >= 85) return { points: 5, matched: true };
      if (completion >= 70) return { points: 3, matched: true };
      if (completion >= 50) return { points: 1, matched: false };
      return { points: 0, matched: false };
    },
  },
  {
    key: 'verification',
    weight: 5,
    reason: 'Verified Profile',
    evaluate: ({ isVerified }) =>
      isVerified ? { points: 5, matched: true } : { points: 0, matched: false },
  },
  {
    key: 'premium',
    weight: 5,
    reason: 'Premium Profile',
    evaluate: ({ isPremium }) =>
      isPremium ? { points: 5, matched: true } : { points: 0, matched: false },
  },
  {
    key: 'activity',
    weight: 3,
    reason: 'Recently Active',
    evaluate: ({ recentlyActive }) =>
      recentlyActive ? { points: 3, matched: true } : { points: 0, matched: false },
  },
  {
    key: 'quality',
    weight: 2,
    reason: 'Strong Profile Quality',
    evaluate: ({ candidate, personal, isVerified }) => {
      const hasPhotoHint = Boolean(str(personal.profilePhoto));
      const hasBasics =
        Boolean(str(candidate.education)) &&
        Boolean(str(candidate.occupation)) &&
        Boolean(locationField(personal, 'city'));
      const quality = (hasBasics ? 1 : 0) + (isVerified ? 1 : 0) + (hasPhotoHint ? 0 : 0);
      if (quality >= 2 || ((candidate.profileCompletion ?? 0) >= 90 && hasBasics)) {
        return { points: 2, matched: true };
      }
      if (hasBasics) return { points: 1, matched: false };
      return { points: 0, matched: false };
    },
  },
  // Future-ready placeholders (weight 0 until wired):
  // { key: 'interests', weight: 0, reason: 'Shared Interests', evaluate: () => ({ points: 0, matched: false }) },
  // { key: 'horoscope', weight: 0, reason: 'Horoscope Compatibility', evaluate: () => ({ points: 0, matched: false }) },
  // { key: 'mlScore', weight: 0, reason: 'AI Match Score', evaluate: () => ({ points: 0, matched: false }) },
];

/** Run the WOW Compatibility Engine for a candidate vs selected customer. */
export function computeCompatibility(
  candidate: AgentCustomerEntity,
  viewer: AgentCustomerEntity,
  documentCount = 0,
  factors: CompatibilityFactor[] = COMPATIBILITY_FACTORS,
): CompatibilityResult {
  const ctx = buildContext(candidate, viewer, documentCount);
  let score = 0;
  const reasons: string[] = [];

  for (const factor of factors) {
    if (factor.weight <= 0) continue;
    const { points, matched, reason } = factor.evaluate(ctx);
    score += Math.min(factor.weight, Math.max(0, points));
    if (matched) reasons.push(reason || factor.reason);
  }

  return {
    score: Math.min(100, Math.max(score, 0)),
    reasons: reasons.slice(0, 7),
  };
}
