export const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Uncle',
  'Aunt',
  'Guardian',
  'Cousin',
  'Brother-in-law',
  'Sister-in-law',
  'Son',
  'Daughter',
  'Best Friend',
  'School Friend',
  'College Friend',
  'Office Colleague',
  'Neighbour',
  'Family Friend',
  'Relative',
  'Other',
] as const;

export const MANAGING_PROFILE_FOR_OPTIONS = ['Bride', 'Groom'] as const;

export const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Odia',
  'Urdu',
  'Assamese',
  'Konkani',
  'Sanskrit',
] as const;

export const VENDOR_CATEGORY_OPTIONS = [
  'Wedding Planner',
  'Photography',
  'Videography',
  'Decoration',
  'Catering',
  'Wedding Venue',
  'Makeup Artist',
  'Mehendi Artist',
  'DJ',
  'Live Band',
  'Invitation Cards',
  'Wedding Cars',
  'Jewellery',
  'Bridal Wear',
  'Groom Wear',
  'Flower Decoration',
  'Travel Services',
  'Pandit / Priest',
  'Cake Designer',
  'Return Gifts',
  'Event Management',
  'Other',
] as const;

export const PRICING_RANGE_OPTIONS = ['Budget', 'Mid Range', 'Premium', 'Luxury'] as const;

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
] as const;

export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Chandigarh',
  'Kochi',
  'Visakhapatnam',
  'Indore',
  'Bhopal',
  'Nagpur',
  'Surat',
  'Vadodara',
  'Coimbatore',
  'Madurai',
  'Mysore',
  'Guwahati',
  'Patna',
  'Ranchi',
  'Thiruvananthapuram',
] as const;

export function calcAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function isRepresentativeRole(role?: string | null) {
  return role === 'representative' || role === 'family';
}

export function isVendorRole(role?: string | null) {
  return role === 'vendor';
}
