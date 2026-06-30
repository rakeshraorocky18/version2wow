import type { ReactNode } from 'react';

type ProfileRecord = Record<string, any>;

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function ItemsSection({ title, items }: { title: string; items: { label: string; value?: unknown }[] }) {
  const visible = items.filter((item) => hasValue(item.value));
  if (!visible.length) return null;

  return (
    <section className="py-6 border-b border-gray-100 last:border-b-0">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {visible.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-900 whitespace-pre-wrap">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <section className="py-6 border-b border-gray-100 last:border-b-0">
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </section>
  );
}

export default function ProfileDetailsView({ profile }: { profile: ProfileRecord }) {
  const wizard = profile.wizardProfile || {};
  const pd = { ...profile, ...(wizard.personalDetails || {}) };
  const horoscope = { ...profile, ...(wizard.horoscope || {}) };
  const religion = { ...profile, ...(wizard.religion || {}) };
  const marital = { ...profile, ...(wizard.marital || {}) };
  const family = { ...profile, ...(wizard.family || {}) };
  const prefs = { ...profile, ...(wizard.partnerPreferences || {}) };
  const lifestyle = { ...profile, ...(wizard.lifestyle || {}) };
  const education = wizard.education || profile.educationList || [];
  const experience = wizard.experience || profile.experience || {};
  const hobbies = wizard.hobbies || profile.interests || [];
  const express = wizard.expressYourself || profile.expressYourself || {};
  const siblingDetails = family.siblingDetails || profile.siblingDetails || [];

  return (
    <div>
      <ItemsSection
        title="Personal Details"
        items={[
            { label: 'First Name', value: pd.firstName },
            { label: 'Middle Name', value: pd.middleName },
            { label: 'Last Name', value: pd.lastName },
            { label: 'Display Name', value: pd.displayName },
            { label: 'Gender', value: pd.gender },
            { label: 'Date of Birth', value: pd.dateOfBirth },
            { label: 'Height', value: pd.height ? `${pd.height} ft` : '' },
            { label: 'Weight', value: pd.weight },
            { label: 'Body Type', value: pd.bodyType },
            { label: 'Complexion', value: pd.complexion },
            { label: 'Blood Group', value: pd.bloodGroup },
            { label: 'Physical Status', value: pd.physicalStatus },
            { label: 'Disability Details', value: pd.disabilityDetails },
            { label: 'Email', value: pd.email },
            { label: 'Phone', value: pd.phone },
            { label: 'Languages', value: pd.languagesKnown?.join?.(', ') },
        ]}
      />

      <ItemsSection
        title="Horoscope Details"
        items={[
            { label: 'Horoscope Available', value: horoscope.horoscopeAvailable },
            { label: 'Rashi', value: horoscope.rashi },
            { label: 'Nakshatra', value: horoscope.nakshatra },
            { label: 'Gothram', value: horoscope.gothram },
            { label: 'Manglik', value: horoscope.manglik },
            { label: 'Horoscope', value: horoscope.horoscope || horoscope.zodiacSign },
            { label: 'Time of Birth', value: horoscope.timeOfBirth },
            { label: 'Place of Birth', value: horoscope.placeOfBirth },
        ]}
      />

      <ItemsSection
        title="Religion Details"
        items={[
            { label: 'Religion', value: religion.religion },
            { label: 'Caste', value: religion.caste },
            { label: 'Sub Caste', value: religion.subCaste },
            { label: 'Mother Tongue', value: religion.motherTongue },
            { label: 'Community', value: religion.community },
        ]}
      />

      <ItemsSection
        title="Marital Information"
        items={[
            { label: 'Marital Status', value: marital.maritalStatus },
            { label: 'Years Married', value: marital.yearsMarried },
            { label: 'Have Children', value: marital.haveChildren },
            { label: 'Children Living With', value: marital.childrenLivingWith },
            { label: 'Ready for Remarriage', value: marital.readyForRemarriage },
        ]}
      />

      <ItemsSection
        title="Location"
        items={[
            { label: 'Country', value: pd.country || profile.country },
            { label: 'State', value: pd.state || profile.state },
            { label: 'City', value: pd.city || profile.city },
            { label: 'Address', value: pd.address || profile.address },
            { label: 'Pincode', value: pd.pincode || profile.pincode },
        ]}
      />

      <ItemsSection
        title="Family Background"
        items={[
            { label: 'Family Type', value: family.familyType },
            { label: 'Family Status', value: family.familyStatus },
            { label: 'Father Name', value: family.fatherName },
            { label: 'Father Alive', value: family.fatherAlive },
            { label: 'Father Occupation', value: family.fatherOccupation },
            { label: 'Mother Name', value: family.motherName },
            { label: 'Mother Alive', value: family.motherAlive },
            { label: 'Mother Occupation', value: family.motherOccupation },
            { label: 'Siblings', value: family.siblings ?? profile.siblings },
        ]}
      />
      {siblingDetails.length > 0 && (
        <Section title="Sibling Details">
          <div className="space-y-2">
            {siblingDetails.map((sibling: ProfileRecord, index: number) => (
              <div key={index} className="rounded-lg border border-gray-100 p-3 text-sm">
                <p>
                  <span className="text-gray-500">Sibling {index + 1}:</span>{' '}
                  {sibling.relation || sibling.type || 'Sibling'}
                  {hasValue(sibling.married) ? ` · Married: ${sibling.married ? 'Yes' : 'No'}` : ''}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(profile.bio || express.aboutMe) && (
        <Section title="Express Yourself">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {express.aboutMe || profile.bio}
          </p>
        </Section>
      )}

      <ItemsSection
        title="Partner Preferences"
        items={[
            { label: 'Preferred Age', value: prefs.prefAgeMin && prefs.prefAgeMax ? `${prefs.prefAgeMin} - ${prefs.prefAgeMax}` : '' },
            { label: 'Preferred Height', value: prefs.prefHeightMin && prefs.prefHeightMax ? `${prefs.prefHeightMin} - ${prefs.prefHeightMax} ft` : '' },
            { label: 'Preferred Marital Status', value: prefs.prefMaritalStatuses?.join?.(', ') },
            { label: 'Preferred Religions', value: prefs.prefReligions?.join?.(', ') },
            { label: 'Preferred Castes', value: prefs.prefCastes?.join?.(', ') },
            { label: 'Preferred Cities', value: prefs.prefCities?.join?.(', ') },
            { label: 'Preferred Family Type', value: prefs.prefFamilyType },
        ]}
      />

      <ItemsSection
        title="Lifestyle"
        items={[
            { label: 'Diet', value: lifestyle.diet },
            { label: 'Drinking', value: lifestyle.drinking },
            { label: 'Smoking', value: lifestyle.smoking },
        ]}
      />

      {education.length > 0 && (
        <Section title="Education">
          <div className="space-y-3">
            {education.map((edu: ProfileRecord, index: number) => (
              <div key={edu.id || index} className="rounded-lg border border-gray-100 p-3 text-sm">
                <p className="font-medium text-gray-900">{edu.degree || edu.qualification || 'Education'}</p>
                {edu.specialization && <p>Specialization: {edu.specialization}</p>}
                {edu.institutionName && <p>Institution: {edu.institutionName}</p>}
                {(edu.startYear || edu.endYear) && (
                  <p>Duration: {[edu.startYear, edu.endYear].filter(Boolean).join(' - ')}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {(experience?.currentlyWorking || profile.occupation) && (
        <ItemsSection
          title="Professional Experience"
          items={[
              { label: 'Currently Working', value: experience.currentlyWorking },
              { label: 'Job Title', value: experience.jobTitle || profile.occupation },
              { label: 'Company', value: experience.companyName },
              { label: 'Industry', value: experience.industry },
              { label: 'Employment Type', value: experience.employmentType },
              { label: 'Salary', value: experience.currentSalary || profile.income },
              { label: 'Skills', value: experience.skills },
          ]}
        />
      )}

      {hobbies.length > 0 && (
        <Section title="Hobbies & Interests">
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby: string) => (
              <span key={hobby} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                {hobby}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
