import { Plus, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AgentDocumentType } from '../../../types/agent';
import type {
  AddCustomerFormState,
  AddressFields,
  FamilyAssetsState,
  LocationFields,
  SiblingEntry,
} from '../../../types/addCustomer';
import {
  createEmptySibling,
  emptyAddress,
  emptyLocation,
} from '../../../types/addCustomer';
import { calculateAge } from '../../../lib/agent/addCustomerUtils';
import {
  BLOOD_GROUP_OPTIONS,
  CASTE_OPTIONS,
  COMPLEXION_OPTIONS,
  FAMILY_STATUS_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  GENDER_OPTIONS,
  HEIGHT_OPTIONS,
  KUJA_DOSHAM_OPTIONS,
  LIVING_WITH_DIVORCED_OPTIONS,
  LIVING_WITH_WIDOWED_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  NAKSHATRA_OPTIONS,
  OCCUPATION_OPTIONS,
  PADAM_OPTIONS,
  QUALIFICATION_OPTIONS,
  RASI_OPTIONS,
  RELIGION_OPTIONS,
  SUB_CASTE_OPTIONS,
  YES_NO_OPTIONS,
} from '../../../lib/agent/formOptions';
import FamilyAssets from './FamilyAssets';
import LocationPicker from './LocationPicker';
import SearchableSelect from './SearchableSelect';
import {
  FormField,
  FormGrid,
  FormInput,
  FormSelect,
  FormTextarea,
  WizardSection,
} from './WizardUI';

export type StepProps = {
  form: AddCustomerFormState;
  errors: Record<string, string>;
  update: (patch: Partial<AddCustomerFormState>) => void;
  updatePersonal: (field: string, value: unknown) => void;
  updateFamily: (field: string, value: unknown) => void;
  updateEducation: (field: string, value: unknown) => void;
  updateReligion: (field: string, value: unknown) => void;
  updatePartner: (field: string, value: unknown) => void;
  agentName?: string;
};

function OptionWithOther({
  value,
  otherValue,
  onChange,
  onOtherChange,
  options,
  placeholder,
}: {
  value: string;
  otherValue: string;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      otherValue={otherValue}
      onOtherChange={onOtherChange}
      otherPlaceholder={`Enter ${placeholder?.toLowerCase() || 'value'}`}
    />
  );
}

function digitsOnly(value: string, maxLen = 10): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function SiblingList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: SiblingEntry[];
  onChange: (items: SiblingEntry[]) => void;
}) {
  const updateItem = (id: string, patch: Partial<SiblingEntry>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const singular = label === 'Brothers' ? 'Brother' : 'Sister';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-wow-text">{label}</h3>
        <button
          type="button"
          className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
          onClick={() => onChange([...items, createEmptySibling()])}
        >
          <Plus className="w-3 h-3" /> Add {singular}
        </button>
      </div>
      {!items.length ? (
        <p className="text-sm text-wow-muted">No {label.toLowerCase()} added yet.</p>
      ) : (
        items.map((item, index) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-wow-bg/50 border border-gray-100 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-wow-text">
                {singular} {index + 1}
              </p>
              <button
                type="button"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                onClick={() => onChange(items.filter((s) => s.id !== item.id))}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <FormGrid>
              <FormField label="Name">
                <FormInput value={item.name} onChange={(v) => updateItem(item.id, { name: v })} />
              </FormField>
              <FormField label="Age">
                <FormInput value={item.age} onChange={(v) => updateItem(item.id, { age: v })} />
              </FormField>
              <FormField label="Married Status">
                <FormSelect
                  value={item.maritalStatus}
                  onChange={(v) => updateItem(item.id, { maritalStatus: v })}
                  options={[
                    { value: 'married', label: 'Married' },
                    { value: 'unmarried', label: 'Unmarried' },
                  ]}
                />
              </FormField>
              <FormField label="Qualification">
                <SearchableSelect
                  value={item.qualification}
                  onChange={(v) => updateItem(item.id, { qualification: v })}
                  options={QUALIFICATION_OPTIONS}
                />
              </FormField>
              <FormField label="Occupation" className="md:col-span-2">
                <FormInput
                  value={item.profession}
                  onChange={(v) => updateItem(item.id, { profession: v })}
                />
              </FormField>
            </FormGrid>
          </div>
        ))
      )}
    </div>
  );
}

function ProfilePhotoField({
  form,
  errors,
  update,
  required,
}: {
  form: AddCustomerFormState;
  errors?: Record<string, string>;
  update: (patch: Partial<AddCustomerFormState>) => void;
  required?: boolean;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!form.profilePhoto) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(form.profilePhoto);
    setPhotoPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [form.profilePhoto]);

  return (
    <FormField
      label="Profile Photo"
      required={required}
      error={errors?.profilePhoto}
      className="md:col-span-2"
    >
      <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-wow-primary/50 transition bg-wow-bg/30">
        {photoPreview ? (
          <img
            src={photoPreview}
            alt="Profile preview"
            className="w-28 h-28 rounded-full object-cover border-2 border-white shadow-md"
          />
        ) : (
          <Upload className="w-8 h-8 text-wow-muted" />
        )}
        <span className="text-sm text-wow-muted text-center px-2">
          {form.profilePhoto ? form.profilePhoto.name : 'Click to upload profile photo'}
        </span>
        <input
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            update({ profilePhoto: file });
          }}
        />
      </label>
    </FormField>
  );
}

/* ─── 1. Personal Details ─── */
export function PersonalStep({ form, errors, update, updatePersonal }: StepProps) {
  const age = calculateAge(form.dateOfBirth);

  return (
    <WizardSection icon="👤" title="Personal Details">
      <FormGrid>
        <FormField label="First Name" required error={errors.firstName}>
          <FormInput value={form.firstName} onChange={(v) => update({ firstName: v })} />
        </FormField>
        <FormField label="Middle Name">
          <FormInput
            value={(form.personalDetails.middleName as string) || ''}
            onChange={(v) => updatePersonal('middleName', v)}
          />
        </FormField>
        <FormField label="Last Name" required error={errors.lastName}>
          <FormInput value={form.lastName} onChange={(v) => update({ lastName: v })} />
        </FormField>
        <FormField label="Gender" required error={errors.gender}>
          <FormSelect
            value={form.gender}
            onChange={(v) => update({ gender: v })}
            options={GENDER_OPTIONS}
          />
        </FormField>
        <FormField label="Date of Birth" required error={errors.dateOfBirth}>
          <FormInput
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => update({ dateOfBirth: v })}
          />
        </FormField>
        <FormField label="Age">
          <FormInput value={age} disabled onChange={() => {}} />
        </FormField>
        <FormField label="Height">
          <SearchableSelect
            value={(form.personalDetails.height as string) || ''}
            onChange={(v) => updatePersonal('height', v)}
            options={HEIGHT_OPTIONS}
            placeholder="Select height (cm)"
          />
        </FormField>
        <FormField label="Weight (kg)">
          <FormInput
            type="number"
            value={(form.personalDetails.weight as string) || ''}
            onChange={(v) => updatePersonal('weight', v)}
            placeholder="e.g. 65"
          />
        </FormField>
        <FormField label="Complexion">
          <FormSelect
            value={(form.personalDetails.complexion as string) || ''}
            onChange={(v) => updatePersonal('complexion', v)}
            options={COMPLEXION_OPTIONS}
          />
        </FormField>
        <FormField label="Blood Group">
          <FormSelect
            value={(form.personalDetails.bloodGroup as string) || ''}
            onChange={(v) => updatePersonal('bloodGroup', v)}
            options={BLOOD_GROUP_OPTIONS}
          />
        </FormField>
        <FormField label="Mobile Number" required error={errors.phone}>
          <FormInput
            value={form.phone}
            onChange={(v) => update({ phone: digitsOnly(v) })}
            placeholder="10-digit mobile number"
          />
        </FormField>
        <FormField label="Alternate Mobile Number" error={errors.alternateMobile}>
          <FormInput
            value={(form.personalDetails.alternateMobile as string) || ''}
            onChange={(v) => updatePersonal('alternateMobile', digitsOnly(v))}
            placeholder="Optional 10-digit number"
          />
        </FormField>
        <FormField label="Email" error={errors.email}>
          <FormInput
            type="email"
            value={form.email}
            onChange={(v) => update({ email: v })}
            placeholder="name@example.com"
          />
        </FormField>
        <FormField label="Religion">
          <OptionWithOther
            value={form.religion}
            otherValue={form.religionOther}
            onChange={(v) => update({ religion: v })}
            onOtherChange={(v) => update({ religionOther: v })}
            options={RELIGION_OPTIONS}
            placeholder="Religion"
          />
        </FormField>
        <FormField label="Caste">
          <OptionWithOther
            value={form.caste}
            otherValue={form.casteOther}
            onChange={(v) => update({ caste: v })}
            onOtherChange={(v) => update({ casteOther: v })}
            options={CASTE_OPTIONS}
            placeholder="Caste"
          />
        </FormField>
        <FormField label="Sub Caste">
          <OptionWithOther
            value={(form.personalDetails.subCaste as string) || ''}
            otherValue={(form.personalDetails.subCasteOther as string) || ''}
            onChange={(v) => updatePersonal('subCaste', v)}
            onOtherChange={(v) => updatePersonal('subCasteOther', v)}
            options={SUB_CASTE_OPTIONS}
            placeholder="Sub Caste"
          />
        </FormField>
        <FormField label="Mother Tongue">
          <OptionWithOther
            value={form.motherTongue}
            otherValue={form.motherTongueOther}
            onChange={(v) => update({ motherTongue: v })}
            onOtherChange={(v) => update({ motherTongueOther: v })}
            options={MOTHER_TONGUE_OPTIONS}
            placeholder="Mother Tongue"
          />
        </FormField>
        <ProfilePhotoField form={form} errors={errors} update={update} required />
        <FormField label="About" className="md:col-span-2">
          <FormTextarea
            value={(form.personalDetails.about as string) || ''}
            onChange={(v) => updatePersonal('about', v)}
          />
        </FormField>
      </FormGrid>
    </WizardSection>
  );
}

/* ─── 2. Horoscope Details ─── */
export function HoroscopeStep({ form, update, updatePersonal }: StepProps) {
  const hasHoroscope = ((form.personalDetails.hasHoroscope as string) || '').toLowerCase();
  const showFull = hasHoroscope === 'yes';
  const showBasic = hasHoroscope === 'yes' || hasHoroscope === 'no';
  const birthPlace = (form.personalDetails.birthPlace as LocationFields) || emptyLocation();

  const addHoroscopeFile = (file: File) => {
    update({
      pendingDocuments: [
        ...form.pendingDocuments.filter((d) => d.type !== 'horoscope'),
        {
          id: crypto.randomUUID(),
          type: 'horoscope',
          file,
          label: 'Horoscope',
        },
      ],
    });
  };

  const horoscopeDoc = form.pendingDocuments.find((d) => d.type === 'horoscope');

  return (
    <WizardSection icon="✨" title="Horoscope Details">
      <FormGrid>
        <FormField label="Do you have Horoscope?">
          <FormSelect
            value={(form.personalDetails.hasHoroscope as string) || ''}
            onChange={(v) => updatePersonal('hasHoroscope', v)}
            options={YES_NO_OPTIONS}
          />
        </FormField>
      </FormGrid>

      {showBasic && (
        <div className="mt-6 space-y-6">
          <FormGrid>
            {showFull && (
              <>
                <FormField label="Star (Nakshatra)">
                  <SearchableSelect
                    value={(form.personalDetails.star as string) || ''}
                    onChange={(v) => updatePersonal('star', v)}
                    options={NAKSHATRA_OPTIONS}
                    placeholder="Select nakshatra"
                  />
                </FormField>
                <FormField label="Padam">
                  <FormSelect
                    value={(form.personalDetails.padam as string) || ''}
                    onChange={(v) => updatePersonal('padam', v)}
                    options={PADAM_OPTIONS}
                  />
                </FormField>
                <FormField label="Rasi">
                  <SearchableSelect
                    value={(form.personalDetails.rasi as string) || ''}
                    onChange={(v) => updatePersonal('rasi', v)}
                    options={RASI_OPTIONS}
                    placeholder="Select rasi"
                  />
                </FormField>
                <FormField label="Gothram">
                  <FormInput
                    value={(form.personalDetails.gothram as string) || ''}
                    onChange={(v) => updatePersonal('gothram', v)}
                  />
                </FormField>
                <FormField label="Kuja Dosham">
                  <FormSelect
                    value={(form.personalDetails.kujaDosham as string) || ''}
                    onChange={(v) => updatePersonal('kujaDosham', v)}
                    options={KUJA_DOSHAM_OPTIONS}
                  />
                </FormField>
              </>
            )}
            <FormField label="Time of Birth">
              <FormInput
                type="time"
                value={(form.personalDetails.timeOfBirth as string) || ''}
                onChange={(v) => updatePersonal('timeOfBirth', v)}
              />
            </FormField>
          </FormGrid>

          <LocationPicker
            title="Place of Birth"
            value={birthPlace}
            onChange={(v) => updatePersonal('birthPlace', v)}
            mode="city"
          />

          {showFull && (
            <FormField label="Horoscope Upload">
              <label className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-wow-primary/50">
                <Upload className="w-5 h-5 text-wow-muted flex-shrink-0" />
                <span className="text-sm text-wow-muted">
                  {horoscopeDoc ? horoscopeDoc.file.name : 'Upload horoscope file'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) addHoroscopeFile(file);
                    e.target.value = '';
                  }}
                />
              </label>
              {horoscopeDoc && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-500 hover:underline"
                  onClick={() =>
                    update({
                      pendingDocuments: form.pendingDocuments.filter((d) => d.type !== 'horoscope'),
                    })
                  }
                >
                  Remove horoscope file
                </button>
              )}
            </FormField>
          )}
        </div>
      )}
    </WizardSection>
  );
}

/* ─── 3. Relationship Status ─── */
export function RelationshipStep({ form, updatePersonal }: StepProps) {
  const status = ((form.personalDetails.maritalStatus as string) || '').toLowerCase();
  const isDivorced = status === 'divorced';
  const isWidowed = status === 'widowed';
  const isSeparated = status === 'separated';
  const showMarriageHistory = isDivorced || isSeparated;
  const showChildrenBlock = isDivorced || isWidowed || isSeparated;
  const hasChildren = ((form.personalDetails.hasChildren as string) || '').toLowerCase() === 'yes';

  const marriageDate = (form.personalDetails.marriageDate as string) || '';

  return (
    <WizardSection icon="💍" title="Relationship Status">
      <FormGrid>
        <FormField label="Relationship Status">
          <FormSelect
            value={(form.personalDetails.maritalStatus as string) || ''}
            onChange={(v) => {
              updatePersonal('maritalStatus', v);
              if (v === 'never married') {
                updatePersonal('marriageDate', '');
                updatePersonal('divorceDate', '');
                updatePersonal('separationDate', '');
                updatePersonal('yearsMarried', '');
                updatePersonal('hasChildren', '');
                updatePersonal('numberOfBoys', '');
                updatePersonal('numberOfGirls', '');
                updatePersonal('livingWith', '');
              }
            }}
            options={MARITAL_STATUS_OPTIONS}
          />
        </FormField>
      </FormGrid>

      {showMarriageHistory && (
        <FormGrid className="mt-6">
          <FormField label="Marriage Date">
            <FormInput
              type="date"
              value={marriageDate}
              onChange={(v) => updatePersonal('marriageDate', v)}
            />
          </FormField>
          {isDivorced && (
            <FormField label="Divorce Date">
              <FormInput
                type="date"
                value={(form.personalDetails.divorceDate as string) || ''}
                onChange={(v) => updatePersonal('divorceDate', v)}
              />
            </FormField>
          )}
          {isSeparated && (
            <FormField label="Separation Date">
              <FormInput
                type="date"
                value={(form.personalDetails.separationDate as string) || ''}
                onChange={(v) => updatePersonal('separationDate', v)}
              />
            </FormField>
          )}
        </FormGrid>
      )}

      {showChildrenBlock && (
        <div className="mt-6 space-y-6">
          <FormGrid>
            <FormField label="Children">
              <FormSelect
                value={(form.personalDetails.hasChildren as string) || ''}
                onChange={(v) => {
                  updatePersonal('hasChildren', v);
                  if (v === 'no') {
                    updatePersonal('numberOfBoys', '');
                    updatePersonal('numberOfGirls', '');
                    updatePersonal('livingWith', '');
                  }
                }}
                options={YES_NO_OPTIONS}
              />
            </FormField>
          </FormGrid>

          {hasChildren && (
            <FormGrid>
              <FormField label="Number of Boys">
                <FormInput
                  type="number"
                  value={(form.personalDetails.numberOfBoys as string) || ''}
                  onChange={(v) => updatePersonal('numberOfBoys', v)}
                />
              </FormField>
              <FormField label="Number of Girls">
                <FormInput
                  type="number"
                  value={(form.personalDetails.numberOfGirls as string) || ''}
                  onChange={(v) => updatePersonal('numberOfGirls', v)}
                />
              </FormField>
              <FormField label={isWidowed ? 'Living With' : 'Currently Living With'}>
                <FormSelect
                  value={(form.personalDetails.livingWith as string) || ''}
                  onChange={(v) => updatePersonal('livingWith', v)}
                  options={
                    isWidowed ? LIVING_WITH_WIDOWED_OPTIONS : LIVING_WITH_DIVORCED_OPTIONS
                  }
                />
              </FormField>
            </FormGrid>
          )}
        </div>
      )}
    </WizardSection>
  );
}

/* ─── 4. Location Details ─── */
export function LocationStep({ form, errors, updatePersonal }: StepProps) {
  const addr = (form.personalDetails.communicationAddress as AddressFields) || emptyAddress();

  const updateAddr = (patch: Partial<AddressFields>) => {
    updatePersonal('communicationAddress', { ...addr, ...patch });
  };

  const locValue: LocationFields = {
    country: addr.country,
    countryOther: addr.countryOther,
    state: addr.state,
    stateOther: addr.stateOther,
    district: addr.district,
    districtOther: addr.districtOther,
    mandal: addr.mandal,
    mandalOther: addr.mandalOther,
    village: addr.village,
    villageOther: addr.villageOther,
    city: addr.city,
    cityOther: addr.cityOther,
  };

  return (
    <WizardSection
      icon="📍"
      title="Location Details"
      subtitle="Current residential address of the customer."
    >
      <FormField label="Address" required error={errors.address}>
        <div className="space-y-4">
          <FormGrid>
            <FormField label="House No">
              <FormInput value={addr.houseNo} onChange={(v) => updateAddr({ houseNo: v })} />
            </FormField>
            <FormField label="Street">
              <FormInput value={addr.street} onChange={(v) => updateAddr({ street: v })} />
            </FormField>
          </FormGrid>
          <LocationPicker
            value={locValue}
            onChange={(loc) => updateAddr({ ...addr, ...loc })}
            mode="full"
          />
          <FormGrid>
            <FormField label="Pin Code" error={errors.pinCode}>
              <FormInput
                value={addr.pinCode}
                onChange={(v) => updateAddr({ pinCode: digitsOnly(v, 6) })}
                placeholder="6-digit pin code"
              />
            </FormField>
          </FormGrid>
        </div>
      </FormField>
    </WizardSection>
  );
}

/* ─── 5. Family Details ─── */
export function FamilyStep({ form, errors, updatePersonal, updateFamily }: StepProps) {
  const brothers = (form.familyDetails.brothers as SiblingEntry[]) || [];
  const sisters = (form.familyDetails.sisters as SiblingEntry[]) || [];
  const familyAssets = (form.familyDetails.familyAssets as FamilyAssetsState) || {
    selectedTypes: [],
    entries: {},
  };
  const nativePlace = (form.personalDetails.nativePlace as LocationFields) || emptyLocation();
  const settledPlace = (form.personalDetails.settledPlace as LocationFields) || emptyLocation();

  return (
    <WizardSection icon="👨‍👩‍👧" title="Family Details">
      <div className="space-y-8">
        <LocationPicker
          title="Native Place Details"
          value={nativePlace}
          onChange={(v) => updatePersonal('nativePlace', v)}
          mode="native"
          labelPrefix="Native"
        />
        <LocationPicker
          title="Settled Place"
          value={settledPlace}
          onChange={(v) => updatePersonal('settledPlace', v)}
          mode="city"
        />

        <div>
          <h3 className="text-sm font-medium text-wow-text mb-3">Father</h3>
          <FormGrid>
            <FormField label="Name" required error={errors.fatherName}>
              <FormInput
                value={(form.familyDetails.fatherName as string) || ''}
                onChange={(v) => updateFamily('fatherName', v)}
              />
            </FormField>
            <FormField label="Age">
              <FormInput
                value={(form.familyDetails.fatherAge as string) || ''}
                onChange={(v) => updateFamily('fatherAge', v)}
              />
            </FormField>
            <FormField label="Qualification">
              <SearchableSelect
                value={(form.familyDetails.fatherQualification as string) || ''}
                onChange={(v) => updateFamily('fatherQualification', v)}
                options={QUALIFICATION_OPTIONS}
              />
            </FormField>
            <FormField label="Occupation">
              <FormInput
                value={(form.familyDetails.fatherProfession as string) || ''}
                onChange={(v) => updateFamily('fatherProfession', v)}
              />
            </FormField>
          </FormGrid>
        </div>

        <div>
          <h3 className="text-sm font-medium text-wow-text mb-3">Mother</h3>
          <FormGrid>
            <FormField label="Name">
              <FormInput
                value={(form.familyDetails.motherName as string) || ''}
                onChange={(v) => updateFamily('motherName', v)}
              />
            </FormField>
            <FormField label="Age">
              <FormInput
                value={(form.familyDetails.motherAge as string) || ''}
                onChange={(v) => updateFamily('motherAge', v)}
              />
            </FormField>
            <FormField label="Qualification">
              <SearchableSelect
                value={(form.familyDetails.motherQualification as string) || ''}
                onChange={(v) => updateFamily('motherQualification', v)}
                options={QUALIFICATION_OPTIONS}
              />
            </FormField>
            <FormField label="Occupation">
              <FormInput
                value={(form.familyDetails.motherProfession as string) || ''}
                onChange={(v) => updateFamily('motherProfession', v)}
              />
            </FormField>
          </FormGrid>
        </div>

        <FormGrid>
          <FormField label="Family Type">
            <FormSelect
              value={(form.familyDetails.familyType as string) || ''}
              onChange={(v) => updateFamily('familyType', v)}
              options={FAMILY_TYPE_OPTIONS}
            />
          </FormField>
          <FormField label="Family Status">
            <FormSelect
              value={(form.familyDetails.familyStatus as string) || ''}
              onChange={(v) => updateFamily('familyStatus', v)}
              options={FAMILY_STATUS_OPTIONS}
            />
          </FormField>
        </FormGrid>

        <SiblingList
          label="Brothers"
          items={brothers}
          onChange={(items) => updateFamily('brothers', items)}
        />
        <SiblingList
          label="Sisters"
          items={sisters}
          onChange={(items) => updateFamily('sisters', items)}
        />

        <div className="border-t border-gray-100 pt-8">
          <FamilyAssets
            value={familyAssets}
            onChange={(v) => updateFamily('familyAssets', v)}
            errors={errors}
          />
        </div>
      </div>
    </WizardSection>
  );
}

/* ─── 6. Education & Career ─── */
export function EducationStep({ form, update, updateEducation }: StepProps) {
  return (
    <WizardSection icon="💼" title="Education & Career">
      <FormGrid>
        <FormField label="Highest Qualification">
          <OptionWithOther
            value={form.education}
            otherValue={form.educationOther}
            onChange={(v) => update({ education: v })}
            onOtherChange={(v) => update({ educationOther: v })}
            options={QUALIFICATION_OPTIONS}
            placeholder="Highest Qualification"
          />
        </FormField>
        <FormField label="Education">
          <FormInput
            value={
              (form.educationDetails.education as string) ||
              (form.educationDetails.institution as string) ||
              ''
            }
            onChange={(v) => {
              updateEducation('education', v);
              updateEducation('institution', v);
            }}
            placeholder="e.g. B.Tech Computer Science"
          />
        </FormField>
        <FormField label="Occupation">
          <OptionWithOther
            value={form.occupation}
            otherValue={form.occupationOther}
            onChange={(v) => update({ occupation: v })}
            onOtherChange={(v) => update({ occupationOther: v })}
            options={OCCUPATION_OPTIONS}
            placeholder="Occupation"
          />
        </FormField>
        <FormField label="Designation">
          <FormInput
            value={(form.educationDetails.designation as string) || ''}
            onChange={(v) => updateEducation('designation', v)}
          />
        </FormField>
        <FormField label="Office / Business Name">
          <FormInput
            value={(form.educationDetails.officeName as string) || ''}
            onChange={(v) => updateEducation('officeName', v)}
          />
        </FormField>
        <FormField label="Company Name">
          <FormInput
            value={(form.educationDetails.company as string) || ''}
            onChange={(v) => updateEducation('company', v)}
          />
        </FormField>
        <FormField label="Business Name">
          <FormInput
            value={(form.educationDetails.businessName as string) || ''}
            onChange={(v) => updateEducation('businessName', v)}
          />
        </FormField>
        <FormField label="Work Location">
          <FormInput
            value={(form.educationDetails.workLocation as string) || ''}
            onChange={(v) => updateEducation('workLocation', v)}
          />
        </FormField>
      </FormGrid>
    </WizardSection>
  );
}

/* ─── 7. Partner Preferences ─── */
export function PartnerStep({ form, updatePartner }: StepProps) {
  const preferredLocation =
    (form.partnerPreferences.preferredLocation as LocationFields) || emptyLocation();

  return (
    <WizardSection icon="❤️" title="Partner Preferences">
      <FormGrid>
        <FormField label="Preferred Age Range">
          <FormInput
            value={(form.partnerPreferences.ageRange as string) || ''}
            onChange={(v) => updatePartner('ageRange', v)}
            placeholder="e.g. 25-30"
          />
        </FormField>
        <FormField label="Preferred Religion">
          <SearchableSelect
            value={(form.partnerPreferences.religion as string) || ''}
            onChange={(v) => updatePartner('religion', v)}
            options={RELIGION_OPTIONS}
            placeholder="Preferred religion"
          />
        </FormField>
        <FormField label="Preferred Caste">
          <SearchableSelect
            value={(form.partnerPreferences.caste as string) || ''}
            onChange={(v) => updatePartner('caste', v)}
            options={CASTE_OPTIONS}
          />
        </FormField>
        <FormField label="Preferred Sub Caste">
          <SearchableSelect
            value={(form.partnerPreferences.subCaste as string) || ''}
            onChange={(v) => updatePartner('subCaste', v)}
            options={SUB_CASTE_OPTIONS}
          />
        </FormField>
        <FormField label="Preferred Qualification">
          <SearchableSelect
            value={(form.partnerPreferences.education as string) || ''}
            onChange={(v) => updatePartner('education', v)}
            options={QUALIFICATION_OPTIONS}
          />
        </FormField>
        <FormField label="Preferred Profession">
          <SearchableSelect
            value={(form.partnerPreferences.profession as string) || ''}
            onChange={(v) => updatePartner('profession', v)}
            options={OCCUPATION_OPTIONS}
          />
        </FormField>
        <FormField label="Preferred Complexion">
          <FormSelect
            value={(form.partnerPreferences.complexion as string) || ''}
            onChange={(v) => updatePartner('complexion', v)}
            options={COMPLEXION_OPTIONS}
          />
        </FormField>
      </FormGrid>

      <div className="mt-8">
        <LocationPicker
          title="Preferred Location"
          value={preferredLocation}
          onChange={(v) => updatePartner('preferredLocation', v)}
          mode="partner"
          labelPrefix="Preferred"
        />
      </div>

      <FormGrid className="mt-6">
        <FormField label="Other Expectations" className="md:col-span-2">
          <FormTextarea
            value={(form.partnerPreferences.otherExpectations as string) || ''}
            onChange={(v) => updatePartner('otherExpectations', v)}
            rows={6}
          />
        </FormField>
      </FormGrid>
    </WizardSection>
  );
}

/* ─── 8. Documents ─── */
const DOC_SLOTS: { key: string; label: string; type: AgentDocumentType; multiple?: boolean }[] = [
  { key: 'gallery', label: 'Gallery Photos', type: 'customer_photo', multiple: true },
  { key: 'aadhaar', label: 'Aadhaar', type: 'aadhaar' },
  { key: 'pan', label: 'PAN', type: 'pan' },
  { key: 'horoscope', label: 'Horoscope Upload', type: 'horoscope' },
];

export function DocumentsStep({ form, errors, update }: StepProps) {
  const addDocument = (type: AgentDocumentType, label: string, file: File) => {
    if (type === 'horoscope') {
      update({
        pendingDocuments: [
          ...form.pendingDocuments.filter((d) => d.type !== 'horoscope'),
          { id: crypto.randomUUID(), type, file, label },
        ],
      });
      return;
    }
    update({
      pendingDocuments: [
        ...form.pendingDocuments,
        { id: crypto.randomUUID(), type, file, label },
      ],
    });
  };

  return (
    <WizardSection
      icon="📄"
      title="Documents"
      subtitle="Upload supporting documents. Profile photo can also be set or updated here."
    >
      <FormGrid className="mb-8">
        <ProfilePhotoField form={form} errors={errors} update={update} />
      </FormGrid>

      <div>
        <h3 className="text-sm font-medium text-wow-text mb-4">Upload Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOC_SLOTS.map((slot) => (
            <FormField key={slot.key} label={slot.label}>
              <label className="flex items-center gap-3 p-4 border border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-wow-primary/50">
                <Upload className="w-5 h-5 text-wow-muted flex-shrink-0" />
                <span className="text-sm text-wow-muted">
                  Choose file{slot.multiple ? '(s)' : ''}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/*"
                  multiple={slot.multiple}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((file) => addDocument(slot.type, slot.label, file));
                    e.target.value = '';
                  }}
                />
              </label>
            </FormField>
          ))}
        </div>

        {form.pendingDocuments.length > 0 && (
          <ul className="mt-4 space-y-2">
            {form.pendingDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-lg bg-wow-bg/60 text-sm"
              >
                <span>
                  {doc.label}: {doc.file.name}
                </span>
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() =>
                    update({
                      pendingDocuments: form.pendingDocuments.filter((d) => d.id !== doc.id),
                    })
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WizardSection>
  );
}
