import type { ReactNode } from 'react';
import { Filter, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import type { AgentMatchFilters } from '../../../types/agentMatching';

interface Props {
  filters: AgentMatchFilters;
  onChange: (next: AgentMatchFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onSaveSearch: () => void;
  isApplying?: boolean;
  className?: string;
  compactDropdowns?: boolean;
  hideActions?: boolean;
}

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-wow-text outline-none transition duration-200 focus:border-wow-primary focus:ring-2 focus:ring-wow-primary/20';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-wow-muted">{label}</span>
      {children}
    </label>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-wow-primary">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

const dropdownOptions: Partial<Record<keyof AgentMatchFilters, string[]>> = {
  religion: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'],
  caste: ['Reddy', 'Kamma', 'Kapu', 'Brahmin', 'Vysya', 'Naidu', 'Yadav', 'Other'],
  subCaste: ['Any', 'Other'],
  minAge: Array.from({ length: 43 }, (_, i) => String(18 + i)),
  maxAge: Array.from({ length: 43 }, (_, i) => String(18 + i)),
  minHeight: ['140', '145', '150', '155', '160', '165', '170', '175', '180'],
  maxHeight: ['150', '155', '160', '165', '170', '175', '180', '185', '190'],
  maritalStatus: ['Never Married', 'Divorced', 'Widowed'],
  country: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'],
  state: ['Andhra Pradesh', 'Telangana', 'Karnataka', 'Tamil Nadu', 'Maharashtra', 'Other'],
  city: ['Hyderabad', 'Vijayawada', 'Bengaluru', 'Chennai', 'Mumbai', 'Pune', 'Other'],
  occupation: ['Software Engineer', 'Doctor', 'Business', 'Government Job', 'Teacher', 'Other'],
  annualIncome: ['0-5 LPA', '5-10 LPA', '10-20 LPA', '20-50 LPA', '50 LPA+'],
  familyStatus: ['Middle Class', 'Upper Middle Class', 'Rich'],
  familyType: ['Joint', 'Nuclear'],
  horoscope: ['Required', 'Not Required', 'Matching', 'Rasi Match', 'Star Match'],
};

const compactFilterFields: Array<{ key: keyof AgentMatchFilters; label: string; half?: boolean }> = [
  { key: 'religion', label: 'Religion' },
  { key: 'caste', label: 'Caste' },
  { key: 'subCaste', label: 'Sub Caste' },
  { key: 'minAge', label: 'Min Age', half: true },
  { key: 'maxAge', label: 'Max Age', half: true },
  { key: 'minHeight', label: 'Min Height', half: true },
  { key: 'maxHeight', label: 'Max Height', half: true },
  { key: 'maritalStatus', label: 'Marital Status' },
  { key: 'country', label: 'Country' },
  { key: 'state', label: 'State' },
  { key: 'city', label: 'City' },
  { key: 'occupation', label: 'Profession' },
  { key: 'annualIncome', label: 'Income' },
  { key: 'familyStatus', label: 'Family Status' },
  { key: 'familyType', label: 'Family Type' },
  { key: 'horoscope', label: 'Horoscope' },
];

export default function PartnerPreferenceSidebar({
  filters,
  onChange,
  onApply,
  onReset,
  onSaveSearch,
  isApplying,
  className = '',
  compactDropdowns = false,
  hideActions = false,
}: Props) {
  const set = <K extends keyof AgentMatchFilters>(key: K, value: AgentMatchFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  if (compactDropdowns) {
    return (
      <aside
        className={`flex w-full flex-col overflow-hidden rounded-[22px] border border-gray-100 bg-white lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-[300px] lg:shrink-0 ${className}`}
        style={{ boxShadow: '0 14px 36px rgba(44, 38, 48, 0.08)' }}
        aria-label="Partner preference filters"
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF5F7] to-white px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wow-primary/10 text-wow-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-wow-text">Filters</h2>
                <p className="mt-0.5 text-[11px] text-wow-muted">
                  Auto fetches when selected
                </p>
              </div>
            </div>
            {isApplying && <span className="text-[11px] text-wow-primary">Fetching...</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4">
          {compactFilterFields.map(({ key, label, half }) => (
            <div key={key} className={half ? '' : 'col-span-2'}>
              <Field label={label}>
                <select
                  className={inputClass}
                  value={String(filters[key] || '')}
                  onChange={(e) => set(key, e.target.value as AgentMatchFilters[typeof key])}
                >
                  <option value="">Any</option>
                  {(dropdownOptions[key] || []).map((option) => (
                    <option key={option} value={option === 'Any' ? '' : option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 p-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filters
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex w-full flex-col overflow-hidden rounded-[20px] border border-gray-100 bg-white lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-[340px] lg:shrink-0 ${className}`}
      style={{ boxShadow: '0 8px 28px rgba(182, 106, 138, 0.08)' }}
      aria-label="Partner preference filters"
    >
      <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF5F7] to-white px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wow-primary/10 text-wow-primary">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-wow-text">Partner Preference Filters</h2>
            <p className="mt-0.5 text-[11px] leading-snug text-wow-muted">
              Prefills from partner preferences. Apply to filter results.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 overflow-y-auto p-5">
        <Group title="Basic">
          <Field label="Religion">
            <input className={inputClass} value={filters.religion} onChange={(e) => set('religion', e.target.value)} placeholder="Any" />
          </Field>
          <Field label="Caste">
            <input className={inputClass} value={filters.caste} onChange={(e) => set('caste', e.target.value)} placeholder="Any" />
          </Field>
          <Field label="Sub Caste">
            <input className={inputClass} value={filters.subCaste} onChange={(e) => set('subCaste', e.target.value)} placeholder="Any" />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Min Age">
              <input type="number" min={18} className={inputClass} value={filters.minAge} onChange={(e) => set('minAge', e.target.value)} />
            </Field>
            <Field label="Max Age">
              <input type="number" min={18} className={inputClass} value={filters.maxAge} onChange={(e) => set('maxAge', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Min Height">
              <input className={inputClass} value={filters.minHeight} onChange={(e) => set('minHeight', e.target.value)} placeholder="cm" />
            </Field>
            <Field label="Max Height">
              <input className={inputClass} value={filters.maxHeight} onChange={(e) => set('maxHeight', e.target.value)} placeholder="cm" />
            </Field>
          </div>
          <Field label="Marital Status">
            <select className={inputClass} value={filters.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
              <option value="">Any</option>
              <option value="Never Married">Never Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </Field>
          <Field label="Mother Tongue">
            <input className={inputClass} value={filters.motherTongue} onChange={(e) => set('motherTongue', e.target.value)} />
          </Field>
        </Group>

        <Group title="Location">
          <Field label="Country">
            <input className={inputClass} value={filters.country} onChange={(e) => set('country', e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputClass} value={filters.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputClass} value={filters.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
        </Group>

        <Group title="Professional">
          <Field label="Education">
            <input className={inputClass} value={filters.education} onChange={(e) => set('education', e.target.value)} />
          </Field>
          <Field label="Occupation">
            <input className={inputClass} value={filters.occupation} onChange={(e) => set('occupation', e.target.value)} />
          </Field>
          <Field label="Annual Income">
            <input className={inputClass} value={filters.annualIncome} onChange={(e) => set('annualIncome', e.target.value)} />
          </Field>
        </Group>

        <Group title="Lifestyle">
          <Field label="Family Status">
            <select className={inputClass} value={filters.familyStatus} onChange={(e) => set('familyStatus', e.target.value)}>
              <option value="">Any</option>
              <option value="Middle Class">Middle Class</option>
              <option value="Upper Middle Class">Upper Middle Class</option>
              <option value="Rich">Rich</option>
            </select>
          </Field>
          <Field label="Family Type">
            <select className={inputClass} value={filters.familyType} onChange={(e) => set('familyType', e.target.value)}>
              <option value="">Any</option>
              <option value="Joint">Joint</option>
              <option value="Nuclear">Nuclear</option>
            </select>
          </Field>
          <Field label="Diet">
            <select className={inputClass} value={filters.foodPreference} onChange={(e) => set('foodPreference', e.target.value)}>
              <option value="">Any</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Eggetarian">Eggetarian</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Smoking">
              <select className={inputClass} value={filters.smoking} onChange={(e) => set('smoking', e.target.value)}>
                <option value="">Any</option>
                <option value="No">No</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="Drinking">
              <select className={inputClass} value={filters.drinking} onChange={(e) => set('drinking', e.target.value)}>
                <option value="">Any</option>
                <option value="No">No</option>
                <option value="Occasionally">Occasionally</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
          </div>
          <Field label="Horoscope Match">
            <input className={inputClass} value={filters.horoscope} onChange={(e) => set('horoscope', e.target.value)} placeholder="Rasi / star" />
          </Field>
          <Field label="Manglik">
            <select className={inputClass} value={filters.manglik} onChange={(e) => set('manglik', e.target.value)}>
              <option value="">Any</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Partial">Partial</option>
            </select>
          </Field>
        </Group>

        <div className="space-y-2.5 rounded-2xl border border-gray-100 bg-[#FAF8FB] p-3.5">
          {(
            [
              ['verifiedOnly', 'Verified Profiles Only'],
              ['premiumOnly', 'Premium Profiles Only'],
              ['recentlyActive', 'Recently Active'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm text-wow-text">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-wow-primary focus:ring-wow-primary"
                checked={filters[key]}
                onChange={(e) => set(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {!hideActions && <div className="space-y-2.5 border-t border-gray-100 p-5">
        <button
          type="button"
          onClick={onApply}
          disabled={isApplying}
          className="btn-primary flex w-full items-center justify-center gap-2 !rounded-2xl !py-3 text-sm shadow-md shadow-wow-primary/20 disabled:opacity-60"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onSaveSearch}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-wow-primary/30 bg-[#FFF5F7] px-3 py-2.5 text-sm font-medium text-wow-primary transition hover:bg-wow-primary/10"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>
        </div>
      </div>}
    </aside>
  );
}
