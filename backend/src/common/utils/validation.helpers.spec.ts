import { getConditionalProfileFieldErrors, isIndianMobileNumber } from './validation.helpers';

describe('profile validation helpers', () => {
  it('accepts valid Indian mobile numbers', () => {
    expect(isIndianMobileNumber('9876543210')).toBe(true);
    expect(isIndianMobileNumber('+919876543210')).toBe(false);
  });

  it('rejects mobile numbers that do not start with 6-9', () => {
    expect(isIndianMobileNumber('1234567890')).toBe(false);
    expect(isIndianMobileNumber('5987654321')).toBe(false);
  });

  it('requires a custom caste when caste is Other', () => {
    const errors = getConditionalProfileFieldErrors({ caste: 'Other' });
    expect(errors).toEqual(expect.objectContaining({ casteOther: 'Please specify your caste' }));
  });

  it('requires a divorce reason when marital status is Divorced', () => {
    const errors = getConditionalProfileFieldErrors({ maritalStatus: 'Divorced' });
    expect(errors).toEqual(expect.objectContaining({ divorceReason: 'Please specify the reason for divorce' }));
  });
});
