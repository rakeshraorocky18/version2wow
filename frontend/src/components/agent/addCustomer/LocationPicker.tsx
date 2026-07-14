import type { LocationFields } from '../../../types/addCustomer';
import { emptyLocation } from '../../../types/addCustomer';
import {
  COUNTRIES,
  getCities,
  getDistricts,
  getMandals,
  getStates,
  getVillages,
  OTHER_VALUE,
} from '../../../lib/agent/locationData';
import SearchableSelect from './SearchableSelect';
import { FormField, FormGrid } from './WizardUI';

export type LocationPickerMode = 'full' | 'native' | 'city' | 'partner';

interface LocationPickerProps {
  value: LocationFields;
  onChange: (value: LocationFields) => void;
  mode?: LocationPickerMode;
  title?: string;
  disabled?: boolean;
}

function resolveDisplay(
  value: string,
  otherKey: keyof LocationFields,
  loc: LocationFields,
): string {
  return value === OTHER_VALUE ? (loc[otherKey] as string) || '' : value;
}

export default function LocationPicker({
  value,
  onChange,
  mode = 'full',
  title,
  disabled,
}: LocationPickerProps) {
  const loc = value || emptyLocation();

  const update = (patch: Partial<LocationFields>) => {
    const next = { ...loc, ...patch };
    if (patch.country !== undefined && patch.country !== loc.country) {
      Object.assign(next, {
        state: '',
        stateOther: '',
        district: '',
        districtOther: '',
        mandal: '',
        mandalOther: '',
        village: '',
        villageOther: '',
        city: '',
        cityOther: '',
      });
    }
    if (patch.state !== undefined && patch.state !== loc.state) {
      Object.assign(next, {
        district: '',
        districtOther: '',
        mandal: '',
        mandalOther: '',
        village: '',
        villageOther: '',
        city: '',
        cityOther: '',
      });
    }
    if (patch.district !== undefined && patch.district !== loc.district) {
      Object.assign(next, {
        mandal: '',
        mandalOther: '',
        village: '',
        villageOther: '',
        city: '',
        cityOther: '',
      });
    }
    if (patch.mandal !== undefined && patch.mandal !== loc.mandal) {
      Object.assign(next, { village: '', villageOther: '' });
    }
    onChange(next);
  };

  const states = getStates(loc.country);
  const districts = getDistricts(loc.state);
  const mandals = getMandals(loc.district);
  const villages = getVillages(loc.mandal);
  const cities = getCities(loc.district);

  return (
    <div>
      {title && <h3 className="text-sm font-medium text-wow-text mb-3">{title}</h3>}
      <FormGrid>
        <FormField label="Country">
          <SearchableSelect
            value={loc.country}
            onChange={(v) => update({ country: v })}
            options={COUNTRIES}
            disabled={disabled}
            otherValue={loc.countryOther}
            onOtherChange={(v) => update({ countryOther: v })}
            otherPlaceholder="Enter country"
          />
        </FormField>
        <FormField label="State">
          <SearchableSelect
            value={loc.state}
            onChange={(v) => update({ state: v })}
            options={states}
            disabled={disabled || !loc.country}
            otherValue={loc.stateOther}
            onOtherChange={(v) => update({ stateOther: v })}
            otherPlaceholder="Enter state"
          />
        </FormField>
        <FormField label="District">
          <SearchableSelect
            value={loc.district}
            onChange={(v) => update({ district: v })}
            options={districts}
            disabled={disabled || !loc.state}
            otherValue={loc.districtOther}
            onOtherChange={(v) => update({ districtOther: v })}
            otherPlaceholder="Enter district"
          />
        </FormField>

        {(mode === 'full' || mode === 'native') && (
          <FormField label="Mandal / Taluk">
            <SearchableSelect
              value={loc.mandal}
              onChange={(v) => update({ mandal: v })}
              options={mandals}
              disabled={disabled || !loc.district}
              otherValue={loc.mandalOther}
              onOtherChange={(v) => update({ mandalOther: v })}
              otherPlaceholder="Enter mandal / taluk"
            />
          </FormField>
        )}

        {mode === 'native' && (
          <FormField label="Village">
            <SearchableSelect
              value={loc.village}
              onChange={(v) => update({ village: v })}
              options={villages}
              disabled={disabled || !loc.mandal}
              otherValue={loc.villageOther}
              onOtherChange={(v) => update({ villageOther: v })}
              otherPlaceholder="Enter village"
            />
          </FormField>
        )}

        {(mode === 'full' || mode === 'city' || mode === 'partner') && (
          <FormField label={mode === 'full' ? 'City / Town' : 'City'}>
            <SearchableSelect
              value={loc.city}
              onChange={(v) => update({ city: v })}
              options={cities}
              disabled={disabled || !loc.district}
              otherValue={loc.cityOther}
              onOtherChange={(v) => update({ cityOther: v })}
              otherPlaceholder="Enter city"
            />
          </FormField>
        )}

        {mode === 'full' && (
          <FormField label="Village">
            <SearchableSelect
              value={loc.village}
              onChange={(v) => update({ village: v })}
              options={villages}
              disabled={disabled || !loc.mandal}
              otherValue={loc.villageOther}
              onOtherChange={(v) => update({ villageOther: v })}
              otherPlaceholder="Enter village"
            />
          </FormField>
        )}
      </FormGrid>
    </div>
  );
}

export function formatLocationDisplay(loc: LocationFields): string {
  const parts = [
    resolveDisplay(loc.village, 'villageOther', loc),
    resolveDisplay(loc.city, 'cityOther', loc),
    resolveDisplay(loc.mandal, 'mandalOther', loc),
    resolveDisplay(loc.district, 'districtOther', loc),
    resolveDisplay(loc.state, 'stateOther', loc),
    resolveDisplay(loc.country, 'countryOther', loc),
  ].filter(Boolean);
  return parts.join(', ') || '—';
}
