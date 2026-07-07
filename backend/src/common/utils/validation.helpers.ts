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
