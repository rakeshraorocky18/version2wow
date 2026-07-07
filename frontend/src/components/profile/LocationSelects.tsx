import { useMemo } from 'react';
import { Country, State, City } from 'country-state-city';

export function useLocationOptions(countryName?: string, stateName?: string) {
  const countries = useMemo(() => Country.getAllCountries(), []);
  const selectedCountry = useMemo(
    () => countries.find((c) => c.name === countryName),
    [countries, countryName],
  );
  const states = useMemo(
    () => (selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []),
    [selectedCountry],
  );
  const selectedState = useMemo(
    () => states.find((s) => s.name === stateName),
    [states, stateName],
  );
  const cities = useMemo(
    () =>
      selectedCountry && selectedState
        ? City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
        : [],
    [selectedCountry, selectedState],
  );

  return { countries, states, cities };
}

export function LocationSelects({
  country,
  state,
  city,
  onCountryChange,
  onStateChange,
  onCityChange,
  errors = {},
  inputClass = 'profile-input',
  required = true,
}: {
  country: string;
  state: string;
  city: string;
  onCountryChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onCityChange: (v: string) => void;
  errors?: { country?: string; state?: string; city?: string };
  inputClass?: string;
  required?: boolean;
}) {
  const { countries, states, cities } = useLocationOptions(country, state);
  const star = required ? ' *' : '';

  return (
    <>
      <div>
        <label className="profile-field-label">Country{star}</label>
        <select
          className={`${inputClass}${errors.country ? ' profile-input-error' : ''}`}
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.name}>{c.name}</option>
          ))}
        </select>
        {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
      </div>
      <div>
        <label className="profile-field-label">State{star}</label>
        <select
          className={`${inputClass}${errors.state ? ' profile-input-error' : ''}`}
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={!country}
        >
          <option value="">Select state</option>
          {states.map((s) => (
            <option key={s.isoCode} value={s.name}>{s.name}</option>
          ))}
        </select>
        {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
      </div>
      <div>
        <label className="profile-field-label">City{star}</label>
        <select
          className={`${inputClass}${errors.city ? ' profile-input-error' : ''}`}
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          disabled={!state}
        >
          <option value="">Select city</option>
          {cities.map((c) => (
            <option key={`${c.name}-${c.stateCode}`} value={c.name}>{c.name}</option>
          ))}
        </select>
        {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
      </div>
    </>
  );
}
