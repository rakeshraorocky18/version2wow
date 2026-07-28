import { filterProfilesByMinimumCompatibility, isOppositeGenderProfile } from './matching.helpers';

describe('isOppositeGenderProfile', () => {
  it('returns true for opposite-gender profiles', () => {
    expect(isOppositeGenderProfile('female', 'male')).toBe(true);
    expect(isOppositeGenderProfile('male', 'female')).toBe(true);
  });

  it('returns false for same-gender or missing profiles', () => {
    expect(isOppositeGenderProfile('female', 'female')).toBe(false);
    expect(isOppositeGenderProfile('male', 'male')).toBe(false);
    expect(isOppositeGenderProfile('female', null)).toBe(false);
    expect(isOppositeGenderProfile('male', '')).toBe(false);
  });
});

describe('filterProfilesByMinimumCompatibility', () => {
  it('keeps only profiles at or above the minimum compatibility threshold', () => {
    const profiles = [
      { id: '1', compatibilityScore: 49 },
      { id: '2', compatibilityScore: 50 },
      { id: '3', compatibilityScore: 75 },
    ];

    expect(filterProfilesByMinimumCompatibility(profiles as never[], 50)).toEqual([
      { id: '2', compatibilityScore: 50 },
      { id: '3', compatibilityScore: 75 },
    ]);
  });
});
