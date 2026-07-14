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

export function calculateProfileCompletion(
  customer: Partial<AgentCustomerEntity>,
  documentCount = 0,
): number {
  let score = 0;

  // Personal information (20)
  const personalFields = [
    customer.firstName,
    customer.lastName,
    customer.gender,
    customer.dateOfBirth,
  ];
  score += (personalFields.filter(hasValue).length / personalFields.length) * 20;

  // Contact (15)
  const contactFields = [customer.phone, customer.email, customer.address];
  score += (contactFields.filter(hasValue).length / contactFields.length) * 15;

  // Basic profile (15)
  const basicFields = [
    customer.religion,
    customer.caste,
    customer.motherTongue,
    customer.occupation,
    customer.education,
  ];
  score += (basicFields.filter(hasValue).length / basicFields.length) * 15;

  // Family details (15)
  score += objectFillRatio(customer.familyDetails) * 15;

  // Education details (10)
  score += objectFillRatio(customer.educationDetails) * 10;

  // Religion details (5)
  score += objectFillRatio(customer.religionDetails) * 5;

  // Partner preferences (10)
  score += objectFillRatio(customer.partnerPreferences) * 10;

  // Documents (10) — at least 2 documents for full credit
  score += Math.min(documentCount / 2, 1) * 10;

  return Math.round(Math.min(score, 100));
}
