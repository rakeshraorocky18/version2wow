import type { ReactNode } from 'react';
import {
  User,
  Star,
  BookOpen,
  Heart,
  MapPin,
  Users,
  HeartHandshake,
  Leaf,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react';

type ProfileRecord = Record<string, any>;
export type ProfileTab = 'personal' | 'education' | 'experience' | 'family' | 'preferences';
export type ProfileVisibility = 'limited' | 'full';

const SECTION_META = {
  personal: { icon: User, title: 'Personal Details', accent: 'border-l-[#B66A8A]' },
  horoscope: { icon: Star, title: 'Horoscope', accent: 'border-l-amber-400' },
  religion: { icon: BookOpen, title: 'Religion', accent: 'border-l-violet-400' },
  marital: { icon: Heart, title: 'Marital', accent: 'border-l-orange-400' },
  location: { icon: MapPin, title: 'Location', accent: 'border-l-sky-400' },
  family: { icon: Users, title: 'Family', accent: 'border-l-[#B66A8A]' },
  preferences: { icon: HeartHandshake, title: 'Preferences', accent: 'border-l-[#B66A8A]' },
  lifestyle: { icon: Leaf, title: 'Lifestyle', accent: 'border-l-emerald-400' },
  education: { icon: GraduationCap, title: 'Education', accent: 'border-l-violet-400' },
  experience: { icon: Briefcase, title: 'Work Experience', accent: 'border-l-orange-400' },
} as const;

type SectionKey = keyof typeof SECTION_META;

const TAB_SECTIONS: Record<ProfileTab, SectionKey[]> = {
  personal: ['personal', 'horoscope', 'religion', 'marital', 'location', 'lifestyle'],
  education: ['education'],
  experience: ['experience'],
  family: ['family'],
  preferences: ['preferences'],
};

const LIMITED_TAB_SECTIONS: Record<ProfileTab, SectionKey[]> = {
  personal: ['personal', 'religion'],
  education: ['education'],
  experience: [],
  family: [],
  preferences: [],
};

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function InfoCard({
  sectionKey,
  children,
}: {
  sectionKey: SectionKey;
  children: ReactNode;
}) {
  const { icon: Icon, title, accent } = SECTION_META[sectionKey];

  return (
    <section className={`overflow-hidden rounded-2xl border border-[#F0DFE7] bg-white shadow-sm ${accent} border-l-4`}>
      <div className="flex items-center gap-2.5 border-b border-[#FAF0F4] px-4 py-3 sm:px-5">
        <Icon size={16} className="text-[#9A5776]" />
        <h3 className="font-display text-sm font-semibold text-[#5D2B44]">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DetailGrid({ items }: { items: { label: string; value?: unknown }[] }) {
  const visible = items.filter((item) => hasValue(item.value));
  if (!visible.length) return null;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {visible.map(({ label, value }) => {
        const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
        return (
          <div key={label} className="rounded-xl bg-[#FFFBFC] px-3.5 py-3 ring-1 ring-[#FAF0F4]">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#9A5776]">{label}</dt>
            <dd className="mt-1 text-sm font-medium capitalize text-[#5D2B44] whitespace-pre-wrap">{display}</dd>
          </div>
        );
      })}
    </dl>
  );
}

function ItemsSection({
  sectionKey,
  items,
}: {
  sectionKey: SectionKey;
  items: { label: string; value?: unknown }[];
}) {
  const visible = items.filter((item) => hasValue(item.value));
  if (!visible.length) return null;

  return (
    <InfoCard sectionKey={sectionKey}>
      <DetailGrid items={visible} />
    </InfoCard>
  );
}

function Section({ sectionKey, children }: { sectionKey: SectionKey; children: ReactNode }) {
  if (!children) return null;
  return <InfoCard sectionKey={sectionKey}>{children}</InfoCard>;
}

export default function ProfileDetailsView({
  profile,
  tab,
  visibility = 'full',
}: {
  profile: ProfileRecord;
  tab?: ProfileTab;
  omitExpress?: boolean;
  visibility?: ProfileVisibility;
}) {
  const wizard = profile.wizardProfile || {};
  const pd = { ...profile, ...(wizard.personalDetails || {}) };
  const horoscope = { ...profile, ...(wizard.horoscope || {}) };
  const religion = { ...profile, ...(wizard.religion || {}) };
  const marital = { ...profile, ...(wizard.marital || {}) };
  const family = { ...profile, ...(wizard.family || {}) };
  const prefs = { ...profile, ...(wizard.partnerPreferences || {}) };
  const lifestyle = { ...profile, ...(wizard.lifestyle || {}) };
  const educationRaw = wizard.education || profile.educationList || [];
  const education =
    educationRaw.length > 0
      ? educationRaw
      : profile.degreeName || profile.highestQualification || profile.collegeUniversity
        ? [
            {
              degree: profile.degreeName || profile.highestQualification,
              qualification: profile.highestQualification,
              specialization: profile.specialization,
              institutionName: profile.collegeUniversity,
              endYear: profile.passingYear,
            },
          ]
        : [];
  const experienceRaw = wizard.experience || profile.experience || {};
  const experience =
    experienceRaw.jobTitle || experienceRaw.companyName || profile.occupation
      ? {
          ...experienceRaw,
          currentlyWorking: experienceRaw.currentlyWorking ?? profile.currentlyWorking,
          jobTitle: experienceRaw.jobTitle || profile.jobTitle || profile.occupation,
          companyName: experienceRaw.companyName || profile.companyName,
          industry: experienceRaw.industry || profile.industry,
          currentSalary: experienceRaw.currentSalary || profile.annualIncome || profile.income,
        }
      : experienceRaw;
  const siblingDetails = family.siblingDetails || profile.siblingDetails || [];

  const sectionMap = visibility === 'limited' ? LIMITED_TAB_SECTIONS : TAB_SECTIONS;
  const allowed = tab ? sectionMap[tab] : null;
  const show = (key: SectionKey) => !allowed || allowed.includes(key);
  const isLimited = visibility === 'limited';

  const sections = [
    show('personal') && (
      <ItemsSection
        key="personal"
        sectionKey="personal"
        items={[
          { label: 'First Name', value: pd.firstName },
          { label: 'Middle Name', value: pd.middleName },
          { label: 'Last Name', value: pd.lastName },
          { label: 'Display Name', value: pd.displayName },
          { label: 'Gender', value: pd.gender },
          { label: 'Date of Birth', value: pd.dateOfBirth },
          { label: 'Height', value: pd.height ? `${pd.height} ft` : '' },
          { label: 'Weight', value: pd.weight },
          { label: 'Complexion', value: pd.complexion },
          { label: 'Blood Group', value: pd.bloodGroup },
          { label: 'Email', value: isLimited ? null : pd.email || profile.email },
          { label: 'Phone', value: isLimited ? null : pd.phone || profile.phone },
          { label: 'Languages', value: pd.languagesKnown?.join?.(', ') },
        ]}
      />
    ),
    show('horoscope') && (
      <ItemsSection
        key="horoscope"
        sectionKey="horoscope"
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
    ),
    show('religion') && (
      <ItemsSection
        key="religion"
        sectionKey="religion"
        items={[
          { label: 'Religion', value: religion.religion || profile.religion },
          { label: 'Caste', value: religion.caste || profile.caste },
          { label: 'Sub Caste', value: religion.subCaste || profile.subCaste },
          { label: 'Mother Tongue', value: religion.motherTongue || profile.motherTongue },
          { label: 'Community', value: religion.community },
        ]}
      />
    ),
    show('marital') && (
      <ItemsSection
        key="marital"
        sectionKey="marital"
        items={[
          { label: 'Marital Status', value: marital.maritalStatus || profile.maritalStatus },
          { label: 'Years Married', value: marital.yearsMarried },
          { label: 'Have Children', value: marital.haveChildren },
          { label: 'Children Living With', value: marital.childrenLivingWith },
          { label: 'Ready for Remarriage', value: marital.readyForRemarriage },
        ]}
      />
    ),
    show('location') && (
      <ItemsSection
        key="location"
        sectionKey="location"
        items={[
          { label: 'Country', value: pd.country || profile.country },
          { label: 'State', value: pd.state || profile.state },
          { label: 'City', value: pd.city || profile.city },
          { label: 'Address', value: pd.address || profile.address },
          { label: 'Pincode', value: pd.pincode || profile.pincode },
        ]}
      />
    ),
    show('lifestyle') && (
      <ItemsSection
        key="lifestyle"
        sectionKey="lifestyle"
        items={[
          { label: 'Diet', value: lifestyle.diet },
          { label: 'Drinking', value: lifestyle.drinking },
          { label: 'Smoking', value: lifestyle.smoking },
        ]}
      />
    ),
    show('education') && education.length > 0 && (
      <Section key="education" sectionKey="education">
        <div className="space-y-3">
          {education.map((edu: ProfileRecord, index: number) => (
            <div key={edu.id || index} className="rounded-xl bg-[#FFFBFC] p-4 ring-1 ring-[#FAF0F4]">
              <p className="font-display font-semibold text-[#5D2B44]">
                {edu.degree || edu.qualification || 'Education'}
              </p>
              {edu.specialization && <p className="mt-0.5 text-sm text-[#9A5776]">{edu.specialization}</p>}
              {edu.institutionName && <p className="mt-1 text-sm text-[#6B4A5A]">{edu.institutionName}</p>}
              {(edu.startYear || edu.endYear) && (
                <p className="mt-2 text-xs font-medium text-[#B66A8A]">
                  {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    ),
    show('experience') && (experience?.currentlyWorking || experience?.jobTitle || profile.occupation) && (
      <ItemsSection
        key="experience"
        sectionKey="experience"
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
    ),
    show('family') && (
      <ItemsSection
        key="family"
        sectionKey="family"
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
    ),
    show('family') && siblingDetails.length > 0 && (
      <Section key="siblings" sectionKey="family">
        <div className="space-y-2">
          {siblingDetails.map((sibling: ProfileRecord, index: number) => (
            <div key={index} className="rounded-xl bg-[#FFFBFC] px-4 py-3 text-sm ring-1 ring-[#FAF0F4]">
              <span className="font-medium text-[#5D2B44]">
                {sibling.relation || sibling.type || `Sibling ${index + 1}`}
              </span>
              {hasValue(sibling.married) && (
                <span className="text-[#9A5776]"> · Married: {sibling.married ? 'Yes' : 'No'}</span>
              )}
            </div>
          ))}
        </div>
      </Section>
    ),
    show('preferences') && (
      <ItemsSection
        key="preferences"
        sectionKey="preferences"
        items={[
          {
            label: 'Preferred Age',
            value: prefs.prefAgeMin && prefs.prefAgeMax ? `${prefs.prefAgeMin} - ${prefs.prefAgeMax}` : '',
          },
          {
            label: 'Preferred Height',
            value:
              prefs.prefHeightMin && prefs.prefHeightMax
                ? `${prefs.prefHeightMin} - ${prefs.prefHeightMax} ft`
                : '',
          },
          { label: 'Preferred Marital Status', value: prefs.prefMaritalStatuses?.join?.(', ') || "Doesn't Matter" },
          { label: 'Preferred Religion', value: prefs.prefReligions?.join?.(', ') || 'Any' },
          { label: 'Preferred Caste', value: prefs.prefCastes?.join?.(', ') || 'Any' },
          { label: 'Preferred Family Type', value: prefs.prefFamilyType },
        ]}
      />
    ),
  ].filter(Boolean);

  if (!sections.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5C8D5] bg-[#FFFBFC] px-6 py-12 text-center">
        <Sparkles size={24} className="mx-auto text-[#D4899F]" />
        <p className="mt-3 font-medium text-[#5D2B44]">
          {isLimited ? 'Full profile available after match is accepted' : 'No details in this section yet'}
        </p>
        <p className="mt-1 text-sm text-[#9A5776]">
          {isLimited ? 'Accept the interest to view more.' : 'Edit your profile to add information.'}
        </p>
      </div>
    );
  }

  return <div className="grid gap-4">{sections}</div>;
}
