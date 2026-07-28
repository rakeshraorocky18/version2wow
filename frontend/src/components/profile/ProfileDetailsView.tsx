import { useState, type ReactNode } from 'react';
import {
  User,
  Star,
  BookOpen,
  Heart,
  MapPin,
  Users,
  Quote,
  HeartHandshake,
  Leaf,
  GraduationCap,
  Briefcase,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

type ProfileRecord = Record<string, any>;
export type ProfileTab = 'about' | 'personal' | 'education' | 'experience' | 'family' | 'preferences';

const SECTION_STYLES = {
  personal: { icon: User, color: 'text-[#A4426A]', bg: 'bg-[#FFF5F8]' },
  horoscope: { icon: Star, color: 'text-[#B45309]', bg: 'bg-[#FFFBF0]' },
  religion: { icon: BookOpen, color: 'text-[#6E4A9C]', bg: 'bg-[#F8F5FF]' },
  marital: { icon: Heart, color: 'text-[#A35C3E]', bg: 'bg-[#FFF8F5]' },
  location: { icon: MapPin, color: 'text-[#2F6D97]', bg: 'bg-[#F5FAFF]' },
  family: { icon: Users, color: 'text-[#A4426A]', bg: 'bg-[#FFF5F8]' },
  express: { icon: Quote, color: 'text-[#A6672A]', bg: 'bg-[#FFFBF5]' },
  preferences: { icon: HeartHandshake, color: 'text-[#A4426A]', bg: 'bg-[#FFF5F8]' },
  lifestyle: { icon: Leaf, color: 'text-[#3D8B5F]', bg: 'bg-[#F5FFF8]' },
  education: { icon: GraduationCap, color: 'text-[#6E4A9C]', bg: 'bg-[#F8F5FF]' },
  experience: { icon: Briefcase, color: 'text-[#A35C3E]', bg: 'bg-[#FFF8F5]' },
  hobbies: { icon: Sparkles, color: 'text-[#B45309]', bg: 'bg-[#FFFBF0]' },
} as const;

type SectionKey = keyof typeof SECTION_STYLES;

const TAB_SECTIONS: Record<ProfileTab, SectionKey[]> = {
  about: ['express', 'education', 'experience', 'hobbies'],
  personal: ['personal', 'horoscope', 'religion', 'marital', 'location', 'lifestyle'],
  education: ['education'],
  experience: ['experience'],
  family: ['family'],
  preferences: ['preferences'],
};

const LIMITED_TAB_SECTIONS: Partial<Record<ProfileTab, SectionKey[]>> = {
  about: ['express'],
  personal: ['personal', 'religion', 'location'],
};

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim().length > 0;
}

function AccordionSection({
  title,
  sectionKey,
  defaultOpen = false,
  children,
}: {
  title: string;
  sectionKey: SectionKey;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { icon: Icon, color, bg } = SECTION_STYLES[sectionKey];

  return (
    <div className="group overflow-hidden rounded-2xl border border-[#EEDCE5] bg-white shadow-[0_16px_30px_-28px_rgba(94,43,68,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-24px_rgba(94,43,68,0.5)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition group-hover:bg-[#FFFBFC]"
      >
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/80 shadow-sm ${bg} ${color}`}>
          <Icon size={17} />
        </div>
        <span className="flex-1 font-display text-[1.05rem] font-semibold text-[#4E2A3D]">{title}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#9A5776] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-[#EFE2E8] bg-gradient-to-b from-[#FFFCFD] to-white px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: unknown }) {
  const display = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F6EAF0] py-3.5 last:border-0">
      <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-[#9A5776]">{label}</dt>
      <dd className="text-right text-sm font-semibold text-[#553044] whitespace-pre-wrap">{display}</dd>
    </div>
  );
}

function ItemsSection({
  title,
  sectionKey,
  items,
  defaultOpen,
}: {
  title: string;
  sectionKey: SectionKey;
  items: { label: string; value?: unknown }[];
  defaultOpen?: boolean;
}) {
  const visible = items.filter((item) => hasValue(item.value));
  if (!visible.length) return null;

  return (
    <AccordionSection title={title} sectionKey={sectionKey} defaultOpen={defaultOpen}>
      <dl>
        {visible.map(({ label, value }) => (
          <DetailRow key={label} label={label} value={value} />
        ))}
      </dl>
    </AccordionSection>
  );
}

function Section({
  title,
  sectionKey,
  defaultOpen,
  children,
}: {
  title: string;
  sectionKey: SectionKey;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  if (!children) return null;
  return (
    <AccordionSection title={title} sectionKey={sectionKey} defaultOpen={defaultOpen}>
      {children}
    </AccordionSection>
  );
}

export default function ProfileDetailsView({
  profile,
  tab,
  visibility,
}: {
  profile: ProfileRecord;
  tab?: ProfileTab;
  visibility?: string;
}) {
  const isLimited = visibility === 'limited';
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
  const hobbies = wizard.hobbies || profile.interests || [];
  const express = wizard.expressYourself || profile.expressYourself || {};
  const siblingDetails = family.siblingDetails || profile.siblingDetails || [];

  const sectionMap = isLimited
    ? { ...TAB_SECTIONS, ...LIMITED_TAB_SECTIONS }
    : TAB_SECTIONS;
  const allowed = tab ? sectionMap[tab] : null;
  const show = (key: SectionKey) => !allowed || allowed.includes(key);

  const sections = [
    show('personal') && (
      <ItemsSection
        key="personal"
        sectionKey="personal"
        title="Personal Details"
        defaultOpen
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
          ...(!isLimited
            ? [
                { label: 'Email', value: pd.email },
                { label: 'Phone', value: pd.phone },
              ]
            : []),
          { label: 'Languages', value: pd.languagesKnown?.join?.(', ') },
          ...(isLimited && (profile.occupation || pd.jobTitle)
            ? [{ label: 'Profession', value: profile.occupation || pd.jobTitle }]
            : []),
        ]}
      />
    ),
    show('horoscope') && (
      <ItemsSection
        key="horoscope"
        sectionKey="horoscope"
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
    ),
    show('religion') && (
      <ItemsSection
        key="religion"
        sectionKey="religion"
        title="Religion Details"
        items={[
          { label: 'Religion', value: religion.religion },
          { label: 'Caste', value: religion.caste },
          { label: 'Sub Caste', value: religion.subCaste },
          { label: 'Mother Tongue', value: religion.motherTongue },
          { label: 'Community', value: religion.community },
        ]}
      />
    ),
    show('marital') && (
      <ItemsSection
        key="marital"
        sectionKey="marital"
        title="Marital Information"
        items={[
          { label: 'Marital Status', value: marital.maritalStatus },
          { label: 'Years Married', value: marital.maritalStatus === 'Divorced' ? marital.yearsMarried : null },
          {
            label: 'Do you have children?',
            value: ['Divorced', 'Widowed'].includes(marital.maritalStatus)
              ? marital.haveChildren === true
                ? 'Yes'
                : marital.haveChildren === false
                  ? 'No'
                  : null
              : null,
          },
          {
            label: 'Number of Boys',
            value: ['Divorced', 'Widowed'].includes(marital.maritalStatus) && marital.haveChildren ? marital.childrenBoys : null,
          },
          {
            label: 'Number of Girls',
            value: ['Divorced', 'Widowed'].includes(marital.maritalStatus) && marital.haveChildren ? marital.childrenGirls : null,
          },
          {
            label: 'Children Living With',
            value: ['Divorced', 'Widowed'].includes(marital.maritalStatus) && marital.haveChildren ? marital.childrenLivingWith : null,
          },
        ]}
      />
    ),
    show('location') && (
      <ItemsSection
        key="location"
        sectionKey="location"
        title="Location"
        items={[
          { label: 'Country', value: pd.country || profile.country },
          { label: 'State', value: pd.state || profile.state },
          { label: 'City', value: pd.city || profile.city },
          { label: 'Address', value: pd.address || profile.address },
          { label: 'Pincode', value: pd.pincode || profile.pincode },
        ]}
      />
    ),
    show('family') && (
      <ItemsSection
        key="family"
        sectionKey="family"
        title="Family Background"
        defaultOpen
        items={[
          { label: 'Family Type', value: family.familyType },
          { label: 'Family Status', value: family.familyStatus },
          { label: 'Father Name', value: family.fatherName },
          { label: 'Father Alive', value: family.fatherAlive },
          { label: 'Father Occupation', value: family.fatherAlive ? family.fatherOccupation : null },
          { label: 'Mother Name', value: family.motherName },
          { label: 'Mother Alive', value: family.motherAlive },
          { label: 'Mother Occupation', value: family.motherAlive ? family.motherOccupation : null },
          { label: 'Siblings', value: family.siblings ?? profile.siblings },
        ]}
      />
    ),
    show('family') && siblingDetails.length > 0 && (
      <Section key="siblings" title="Sibling Details" sectionKey="family">
        <div className="space-y-2">
          {siblingDetails.map((sibling: ProfileRecord, index: number) => (
            <div key={index} className="rounded-xl border border-[#EFE2E8] bg-[#FFFBFC] px-4 py-3 text-sm">
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
    show('express') && (profile.bio || express.aboutMe) && (
      <Section key="express" title="About Me" sectionKey="express" defaultOpen>
        <p className="text-sm leading-relaxed text-[#6B4A5A] whitespace-pre-wrap">
          {express.aboutMe || profile.bio}
        </p>
      </Section>
    ),
    show('preferences') && (
      <ItemsSection
        key="preferences"
        sectionKey="preferences"
        title="Partner Preferences"
        defaultOpen
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
    show('lifestyle') && (
      <ItemsSection
        key="lifestyle"
        sectionKey="lifestyle"
        title="Lifestyle"
        items={[
          { label: 'Diet', value: lifestyle.diet },
          { label: 'Drinking', value: lifestyle.drinking },
          { label: 'Smoking', value: lifestyle.smoking },
        ]}
      />
    ),
    show('education') && education.length > 0 && (
      <Section key="education" title="Education" sectionKey="education" defaultOpen>
        <div className="space-y-3">
          {education.map((edu: ProfileRecord, index: number) => (
            <div key={edu.id || index} className="rounded-xl border border-[#EEDCE5] bg-gradient-to-r from-[#FFFBFC] to-[#F8F5FF] p-4 shadow-[0_12px_20px_-24px_rgba(94,43,68,0.8)]">
              <p className="font-display font-semibold text-[#523045]">
                {edu.degree || edu.qualification || 'Education'}
              </p>
              {edu.specialization && <p className="mt-0.5 text-xs text-[#9A5776]">{edu.specialization}</p>}
              {edu.institutionName && <p className="mt-1 text-sm text-[#6B4A5A]">{edu.institutionName}</p>}
              {(edu.startYear || edu.endYear) && (
                <p className="mt-1 text-xs font-medium text-[#B66A8A]">
                  {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>
    ),
    show('experience') && (experience?.currentlyWorking || profile.occupation) && (
      <ItemsSection
        key="experience"
        sectionKey="experience"
        title="Professional Experience"
        defaultOpen
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
    show('hobbies') && hobbies.length > 0 && (
      <Section key="hobbies" title="Hobbies & Interests" sectionKey="hobbies" defaultOpen>
        <div className="flex flex-wrap gap-2">
          {hobbies.map((hobby: string) => (
            <span
              key={hobby}
              className="rounded-full border border-[#E5C8D5] bg-[#FFF5F8] px-3.5 py-1.5 text-sm font-medium text-[#8D4C6A]"
            >
              {hobby}
            </span>
          ))}
        </div>
      </Section>
    ),
  ].filter(Boolean);

  if (!sections.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#E5C8D5] bg-gradient-to-r from-[#FFFBFC] to-[#FFF8FB] px-6 py-12 text-center">
        <Sparkles size={28} className="mx-auto text-[#D4899F]" />
        <p className="mt-3 font-medium text-[#5D2B44]">No details in this section yet</p>
        <p className="mt-1 text-sm text-[#9A5776]">Add more information to your profile to see it here.</p>
      </div>
    );
  }

  return <div className="space-y-3.5">{sections}</div>;
}
