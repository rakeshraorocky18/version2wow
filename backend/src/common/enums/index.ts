export enum UserRole {
  BRIDE = 'bride',
  GROOM = 'groom',
  FAMILY = 'family',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BookingStatus {
  REQUESTED = 'requested',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  BLOCKED = 'blocked',
}

export enum VendorCategory {
  VENUE = 'venue',
  CATERING = 'catering',
  PHOTOGRAPHY = 'photography',
  VIDEOGRAPHY = 'videography',
  DECOR = 'decor',
  MAKEUP = 'makeup',
  ENTERTAINMENT = 'entertainment',
  INVITATION = 'invitation',
  TRANSPORT = 'transport',
  PANDIT = 'pandit',
  OTHER = 'other',
}

export enum EventType {
  ENGAGEMENT = 'engagement',
  HALDI = 'haldi',
  MEHENDI = 'mehendi',
  SANGEET = 'sangeet',
  WEDDING = 'wedding',
  RECEPTION = 'reception',
  OTHER = 'other',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  HELD_IN_ESCROW = 'held_in_escrow',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  EMI = 'emi',
}

export enum RsvpStatus {
  INVITED = 'invited',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
}

export enum HoneymoonPackageType {
  DOMESTIC = 'domestic',
  INTERNATIONAL = 'international',
}

export enum LoanStatus {
  DRAFT = 'draft',
  APPLIED = 'applied',
  APPROVED = 'approved',
  DISBURSED = 'disbursed',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum GiftStatus {
  OPEN = 'open',
  RESERVED = 'reserved',
  PURCHASED = 'purchased',
}
