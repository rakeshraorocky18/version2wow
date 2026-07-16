export enum AgentCustomerStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum WorksheetTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorksheetPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AgentDocumentType {
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  PASSPORT = 'passport',
  HOROSCOPE = 'horoscope',
  EDUCATION_CERTIFICATE = 'education_certificate',
  INCOME_PROOF = 'income_proof',
  CUSTOMER_PHOTO = 'customer_photo',
  PROFILE_PHOTO = 'profile_photo',
  OTHER = 'other',
}

export enum AgentActivityAction {
  CUSTOMER_CREATED = 'customer_created',
  CUSTOMER_UPDATED = 'customer_updated',
  PROFILE_EDITED = 'profile_edited',
  DOCUMENT_UPLOADED = 'document_uploaded',
  NOTE_ADDED = 'note_added',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  WORKSHEET_CREATED = 'worksheet_created',
  WORKSHEET_UPDATED = 'worksheet_updated',
  WORKSHEET_COMPLETED = 'worksheet_completed',
  WORKSHEET_DELETED = 'worksheet_deleted',
}
