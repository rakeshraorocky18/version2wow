import { Transform } from 'class-transformer';

/** Treat empty strings as undefined so @IsOptional() skips validation. */
export function EmptyToUndefined() {
  return Transform(({ value }) => (value === '' || value === null ? undefined : value));
}

export function sanitizePayload<T extends Record<string, unknown>>(payload: T): Partial<T> {
  const out: Record<string, unknown> = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    out[key] = value;
  });
  return out as Partial<T>;
}

export function isIndianMobileNumber(value?: string | null): boolean {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized) return false;
  const digits = normalized.replace(/\D/g, '');
  return digits.length === 10 && /^[6789]/.test(digits);
}

export function getConditionalProfileFieldErrors(values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (values.caste === 'Other' && !String(values.casteOther ?? '').trim()) {
    errors.casteOther = 'Please specify your caste';
  }

  if (values.maritalStatus === 'Divorced' && !String(values.divorceReason ?? '').trim()) {
    errors.divorceReason = 'Please specify the reason for divorce';
  }

  return errors;
}
