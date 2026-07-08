export enum UserRole {
  BRIDE = 'bride',
  GROOM = 'groom',
  FAMILY = 'family',
  REPRESENTATIVE = 'representative',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum RepresentativeRelationship {
  FATHER = 'Father',
  MOTHER = 'Mother',
  BROTHER = 'Brother',
  SISTER = 'Sister',
  GRANDFATHER = 'Grandfather',
  GRANDMOTHER = 'Grandmother',
  UNCLE = 'Uncle',
  AUNT = 'Aunt',
  GUARDIAN = 'Guardian',
  COUSIN = 'Cousin',
  BROTHER_IN_LAW = 'Brother-in-law',
  SISTER_IN_LAW = 'Sister-in-law',
  SON = 'Son',
  DAUGHTER = 'Daughter',
  BEST_FRIEND = 'Best Friend',
  SCHOOL_FRIEND = 'School Friend',
  COLLEGE_FRIEND = 'College Friend',
  OFFICE_COLLEAGUE = 'Office Colleague',
  NEIGHBOUR = 'Neighbour',
  FAMILY_FRIEND = 'Family Friend',
  RELATIVE = 'Relative',
  OTHER = 'Other',
}

export enum ManagingProfileFor {
  BRIDE = 'Bride',
  GROOM = 'Groom',
}

export enum VendorProfileCategory {
  WEDDING_PLANNER = 'Wedding Planner',
  PHOTOGRAPHY = 'Photography',
  VIDEOGRAPHY = 'Videography',
  DECORATION = 'Decoration',
  CATERING = 'Catering',
  WEDDING_VENUE = 'Wedding Venue',
  MAKEUP_ARTIST = 'Makeup Artist',
  MEHENDI_ARTIST = 'Mehendi Artist',
  DJ = 'DJ',
  LIVE_BAND = 'Live Band',
  INVITATION_CARDS = 'Invitation Cards',
  WEDDING_CARS = 'Wedding Cars',
  JEWELLERY = 'Jewellery',
  BRIDAL_WEAR = 'Bridal Wear',
  GROOM_WEAR = 'Groom Wear',
  FLOWER_DECORATION = 'Flower Decoration',
  TRAVEL_SERVICES = 'Travel Services',
  PANDIT_PRIEST = 'Pandit / Priest',
  CAKE_DESIGNER = 'Cake Designer',
  RETURN_GIFTS = 'Return Gifts',
  EVENT_MANAGEMENT = 'Event Management',
  OTHER = 'Other',
}

export enum PricingRange {
  BUDGET = 'Budget',
  MID_RANGE = 'Mid Range',
  PREMIUM = 'Premium',
  LUXURY = 'Luxury',
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

/** Chat is only allowed after mutual match acceptance (post_match). pre_match is reserved for future use. */
export enum ChatRestrictionMode {
  POST_MATCH = 'post_match',
  PRE_MATCH = 'pre_match',
}

export enum ChatMeetingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
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

export enum TaskPriorityLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum PlannerActivityAction {
  ADDED = 'added',
  COMPLETED = 'completed',
  UPDATED = 'updated',
}

export enum GalleryVisibility {
  PUBLIC = 'public',
  MATCHED_ONLY = 'matched_only',
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

export enum InvitationChannel {
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
  EMAIL = 'email',
  DIGITAL_LINK = 'digital_link',
}

export enum InvitationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  OPENED = 'opened',
  RESPONDED = 'responded',
  FAILED = 'failed',
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
