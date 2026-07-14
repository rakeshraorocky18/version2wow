import { DISTRICTS_BY_STATE } from './indiaDistricts';

export const OTHER_VALUE = 'other';

export interface LocationNode {
  value: string;
  label: string;
}

export const COUNTRIES: LocationNode[] = [
  { value: 'india', label: 'India' },
  { value: 'usa', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'uae', label: 'UAE' },
  { value: OTHER_VALUE, label: 'Other' },
];

export const STATES_BY_COUNTRY: Record<string, LocationNode[]> = {
  india: [
    { value: 'andhra pradesh', label: 'Andhra Pradesh' },
    { value: 'arunachal pradesh', label: 'Arunachal Pradesh' },
    { value: 'assam', label: 'Assam' },
    { value: 'bihar', label: 'Bihar' },
    { value: 'chhattisgarh', label: 'Chhattisgarh' },
    { value: 'goa', label: 'Goa' },
    { value: 'gujarat', label: 'Gujarat' },
    { value: 'haryana', label: 'Haryana' },
    { value: 'himachal pradesh', label: 'Himachal Pradesh' },
    { value: 'jharkhand', label: 'Jharkhand' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'kerala', label: 'Kerala' },
    { value: 'madhya pradesh', label: 'Madhya Pradesh' },
    { value: 'maharashtra', label: 'Maharashtra' },
    { value: 'manipur', label: 'Manipur' },
    { value: 'meghalaya', label: 'Meghalaya' },
    { value: 'mizoram', label: 'Mizoram' },
    { value: 'nagaland', label: 'Nagaland' },
    { value: 'odisha', label: 'Odisha' },
    { value: 'punjab', label: 'Punjab' },
    { value: 'rajasthan', label: 'Rajasthan' },
    { value: 'sikkim', label: 'Sikkim' },
    { value: 'tamil nadu', label: 'Tamil Nadu' },
    { value: 'telangana', label: 'Telangana' },
    { value: 'tripura', label: 'Tripura' },
    { value: 'uttar pradesh', label: 'Uttar Pradesh' },
    { value: 'uttarakhand', label: 'Uttarakhand' },
    { value: 'west bengal', label: 'West Bengal' },
    { value: 'andaman and nicobar islands', label: 'Andaman and Nicobar Islands' },
    { value: 'chandigarh', label: 'Chandigarh' },
    { value: 'dadra and nagar haveli and daman and diu', label: 'Dadra and Nagar Haveli and Daman and Diu' },
    { value: 'delhi', label: 'Delhi' },
    { value: 'jammu and kashmir', label: 'Jammu and Kashmir' },
    { value: 'ladakh', label: 'Ladakh' },
    { value: 'lakshadweep', label: 'Lakshadweep' },
    { value: 'puducherry', label: 'Puducherry' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  usa: [
    { value: 'california', label: 'California' },
    { value: 'texas', label: 'Texas' },
    { value: 'new york', label: 'New York' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  uk: [
    { value: 'england', label: 'England' },
    { value: 'scotland', label: 'Scotland' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  uae: [
    { value: 'dubai', label: 'Dubai' },
    { value: 'abu dhabi', label: 'Abu Dhabi' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
};

export { DISTRICTS_BY_STATE };

export const MANDALS_BY_DISTRICT: Record<string, LocationNode[]> = {
  hyderabad: [
    { value: 'ameerpet', label: 'Ameerpet' },
    { value: 'secunderabad', label: 'Secunderabad' },
    { value: 'charminar', label: 'Charminar' },
    { value: 'kukatpally', label: 'Kukatpally' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  rangareddy: [
    { value: 'shamshabad', label: 'Shamshabad' },
    { value: 'rajendranagar', label: 'Rajendranagar' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  medchal: [
    { value: 'alwal', label: 'Alwal' },
    { value: 'quthbullapur', label: 'Quthbullapur' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  warangal: [
    { value: 'hanamkonda', label: 'Hanamkonda' },
    { value: 'kazipet', label: 'Kazipet' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  karimnagar: [
    { value: 'karimnagar', label: 'Karimnagar' },
    { value: 'jagtial', label: 'Jagtial' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  nizamabad: [
    { value: 'nizamabad', label: 'Nizamabad' },
    { value: 'kamareddy', label: 'Kamareddy' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  visakhapatnam: [
    { value: 'visakhapatnam', label: 'Visakhapatnam' },
    { value: 'anakapalle', label: 'Anakapalle' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  vijayawada: [
    { value: 'vijayawada', label: 'Vijayawada' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  guntur: [
    { value: 'guntur', label: 'Guntur' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  tirupati: [
    { value: 'tirupati', label: 'Tirupati' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  'bengaluru urban': [
    { value: 'bangalore north', label: 'Bangalore North' },
    { value: 'bangalore south', label: 'Bangalore South' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  chennai: [
    { value: 'chennai central', label: 'Chennai Central' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  mumbai: [
    { value: 'andheri', label: 'Andheri' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  pune: [
    { value: 'pune city', label: 'Pune City' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
};

export const VILLAGES_BY_MANDAL: Record<string, LocationNode[]> = {
  ameerpet: [
    { value: 'ameerpet', label: 'Ameerpet' },
    { value: 'somajiguda', label: 'Somajiguda' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  secunderabad: [
    { value: 'secunderabad', label: 'Secunderabad' },
    { value: 'tarnaka', label: 'Tarnaka' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  charminar: [
    { value: 'old city', label: 'Old City' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  kukatpally: [
    { value: 'kphb', label: 'KPHB' },
    { value: 'moosapet', label: 'Moosapet' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  shamshabad: [
    { value: 'shamshabad', label: 'Shamshabad' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  hanamkonda: [
    { value: 'hanamkonda', label: 'Hanamkonda' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
};

export const CITIES_BY_DISTRICT: Record<string, LocationNode[]> = {
  hyderabad: [
    { value: 'hyderabad', label: 'Hyderabad' },
    { value: 'secunderabad', label: 'Secunderabad' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  rangareddy: [
    { value: 'lb nagar', label: 'LB Nagar' },
    { value: 'uppal', label: 'Uppal' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  medchal: [
    { value: 'dilshuknagar', label: 'Dilsukhnagar' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  warangal: [
    { value: 'warangal', label: 'Warangal' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  karimnagar: [
    { value: 'karimnagar', label: 'Karimnagar' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  visakhapatnam: [
    { value: 'visakhapatnam', label: 'Visakhapatnam' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  vijayawada: [
    { value: 'vijayawada', label: 'Vijayawada' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  'bengaluru urban': [
    { value: 'bengaluru', label: 'Bengaluru' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  chennai: [
    { value: 'chennai', label: 'Chennai' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  mumbai: [
    { value: 'mumbai', label: 'Mumbai' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  pune: [
    { value: 'pune', label: 'Pune' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
  'new delhi': [
    { value: 'new delhi', label: 'New Delhi' },
    { value: OTHER_VALUE, label: 'Other' },
  ],
};

export function getStates(country: string): LocationNode[] {
  if (!country || country === OTHER_VALUE) return [{ value: OTHER_VALUE, label: 'Other' }];
  return STATES_BY_COUNTRY[country] ?? [{ value: OTHER_VALUE, label: 'Other' }];
}

export function getDistricts(state: string): LocationNode[] {
  if (!state || state === OTHER_VALUE) return [{ value: OTHER_VALUE, label: 'Other' }];
  return DISTRICTS_BY_STATE[state] ?? [{ value: OTHER_VALUE, label: 'Other' }];
}

function defaultChildOptions(parentValue: string, parentLabel?: string): LocationNode[] {
  const label = parentLabel || parentValue;
  return [
    { value: parentValue, label },
    { value: OTHER_VALUE, label: 'Other' },
  ];
}

export function getMandals(district: string): LocationNode[] {
  if (!district || district === OTHER_VALUE) return [{ value: OTHER_VALUE, label: 'Other' }];
  return MANDALS_BY_DISTRICT[district] ?? defaultChildOptions(district);
}

export function getVillages(mandal: string): LocationNode[] {
  if (!mandal || mandal === OTHER_VALUE) return [{ value: OTHER_VALUE, label: 'Other' }];
  return VILLAGES_BY_MANDAL[mandal] ?? defaultChildOptions(mandal);
}

export function getCities(district: string): LocationNode[] {
  if (!district || district === OTHER_VALUE) return [{ value: OTHER_VALUE, label: 'Other' }];
  return CITIES_BY_DISTRICT[district] ?? defaultChildOptions(district);
}

export function getLabel(options: LocationNode[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
