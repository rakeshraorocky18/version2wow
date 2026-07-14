import { Plus, Trash2, Upload } from 'lucide-react';
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
  GENDER_OPTIONS,
  HEIGHT_OPTIONS,
  INCOME_RANGE_OPTIONS,
  KUJA_DOSHAM_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  MOTHER_TONGUE_OPTIONS,
  OCCUPATION_OPTIONS,
  PADAM_OPTIONS,
  QUALIFICATION_OPTIONS,
  RELIGION_OPTIONS,
  SUB_CASTE_OPTIONS,
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

type StepProps = {
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

function updateAddressField(
  form: AddCustomerFormState,
  updatePersonal: StepProps['updatePersonal'],
  key: 'communicationAddress' | 'referenceAddress',
  field: keyof AddressFields,
  value: string,
) {
  const current = (form.personalDetails[key] as AddressFields) || emptyAddress();
  const updated = { ...current, [field]: value };
  updatePersonal(key, updated);
  if (key === 'communicationAddress' && form.sameAsCommunication) {
    updatePersonal('referenceAddress', updated);
  }
}

function AddressLocationBlock({
  title,
  addressKey,
  form,
  updatePersonal,
  errors,
  disabled,
}: {
  title: string;
  addressKey: 'communicationAddress' | 'referenceAddress';
  form: AddCustomerFormState;
  updatePersonal: StepProps['updatePersonal'];
  errors: Record<string, string>;
  disabled?: boolean;
}) {
  const addr = (form.personalDetails[addressKey] as AddressFields) || emptyAddress();

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

  const updateLoc = (loc: LocationFields) => {
    const updated = { ...addr, ...loc };
    updatePersonal(addressKey, updated);
    if (addressKey === 'communicationAddress' && form.sameAsCommunication) {
      updatePersonal('referenceAddress', updated);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-wow-text mb-3">{title}</h3>
      {addressKey === 'communicationAddress' && errors.communicationAddress && (
        <p className="text-xs text-red-600 mb-3">{errors.communicationAddress}</p>
      )}
      <FormGrid>
        <FormField label="House No">
          <FormInput
            value={addr.houseNo}
            disabled={disabled}
            onChange={(v) => updateAddressField(form, updatePersonal, addressKey, 'houseNo', v)}
          />
        </FormField>
        <FormField label="Street">
          <FormInput
            value={addr.street}
            disabled={disabled}
            onChange={(v) => updateAddressField(form, updatePersonal, addressKey, 'street', v)}
          />
        </FormField>
      </FormGrid>
      <div className="mt-4">
        <LocationPicker value={locValue} onChange={updateLoc} mode="full" disabled={disabled} />
      </div>
      <FormGrid className="mt-4">
        <FormField label="Pin Code">
          <FormInput
            value={addr.pinCode}
            disabled={disabled}
            onChange={(v) => updateAddressField(form, updatePersonal, addressKey, 'pinCode', v)}
          />
        </FormField>
        <FormField label="Mobile">
          <FormInput
            value={addr.mobile}
            disabled={disabled}
            onChange={(v) => updateAddressField(form, updatePersonal, addressKey, 'mobile', v)}
          />
        </FormField>
        <FormField label="Email" className="md:col-span-2">
          <FormInput
            type="email"
            value={addr.email}
            disabled={disabled}
            onChange={(v) => updateAddressField(form, updatePersonal, addressKey, 'email', v)}
          />
        </FormField>
      </FormGrid>
    </div>
  );
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-wow-text">{label}</h3>
        <button
          type="button"
          className="btn-secondary !py-1.5 !px-3 text-xs inline-flex items-center gap-1"
          onClick={() => onChange([...items, createEmptySibling()])}
        >
          <Plus className="w-3 h-3" /> Add {label.replace(/s$/, '')}
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
                {label.replace(/s$/, '')} {index + 1}
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
              <FormField label="Married / Unmarried">
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
              <FormField label="Profession" className="md:col-span-2">
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

export function PersonalStep({ form, errors, update, updatePersonal }: StepProps) {
  const age = calculateAge(form.dateOfBirth);
  const birthPlace = (form.personalDetails.birthPlace as LocationFields) || emptyLocation();
  const nativePlace = (form.personalDetails.nativePlace as LocationFields) || emptyLocation();
  const settledPlace = (form.personalDetails.settledPlace as LocationFields) || emptyLocation();

  return (
    <WizardSection icon="👤" title="Personal Information">
      <FormGrid>
        <FormField label="First Name" required error={errors.firstName}>
          <FormInput value={form.firstName} onChange={(v) => update({ firstName: v })} />
        </FormField>
        <FormField label="Last Name">
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
          <FormInput type="date" value={form.dateOfBirth} onChange={(v) => update({ dateOfBirth: v })} />
        </FormField>
        <FormField label="Time of Birth">
          <FormInput
            type="time"
            value={(form.personalDetails.timeOfBirth as string) || ''}
            onChange={(v) => updatePersonal('timeOfBirth', v)}
          />
        </FormField>
        <FormField label="Age">
          <FormInput value={age} disabled onChange={() => {}} />
        </FormField>
        <FormField label="Mobile Number" required error={errors.phone}>
          <FormInput value={form.phone} onChange={(v) => update({ phone: v })} />
        </FormField>
        <FormField label="Alternate Mobile">
          <FormInput
            value={(form.personalDetails.alternateMobile as string) || ''}
            onChange={(v) => updatePersonal('alternateMobile', v)}
          />
        </FormField>
        <FormField label="Email">
          <FormInput type="email" value={form.email} onChange={(v) => update({ email: v })} />
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
        <FormField label="Star (Nakshatra)">
          <FormInput
            value={(form.personalDetails.star as string) || ''}
            onChange={(v) => updatePersonal('star', v)}
          />
        </FormField>
        <FormField label="Padam (1/2/3/4)">
          <FormSelect
            value={(form.personalDetails.padam as string) || ''}
            onChange={(v) => updatePersonal('padam', v)}
            options={PADAM_OPTIONS}
          />
        </FormField>
        <FormField label="Rasi">
          <FormInput
            value={(form.personalDetails.rasi as string) || ''}
            onChange={(v) => updatePersonal('rasi', v)}
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
        <FormField label="Complexion">
          <FormInput
            value={(form.personalDetails.complexion as string) || ''}
            onChange={(v) => updatePersonal('complexion', v)}
          />
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
        <FormField label="Marital Status">
          <FormSelect
            value={(form.personalDetails.maritalStatus as string) || ''}
            onChange={(v) => updatePersonal('maritalStatus', v)}
            options={MARITAL_STATUS_OPTIONS}
          />
        </FormField>
        <FormField label="Blood Group">
          <FormSelect
            value={(form.personalDetails.bloodGroup as string) || ''}
            onChange={(v) => updatePersonal('bloodGroup', v)}
            options={BLOOD_GROUP_OPTIONS}
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
      </FormGrid>

      <div className="mt-8 space-y-8">
        <LocationPicker
          title="Birth Place"
          value={birthPlace}
          onChange={(v) => updatePersonal('birthPlace', v)}
          mode="city"
        />
        <LocationPicker
          title="Native Place (Ancestor's Location)"
          value={nativePlace}
          onChange={(v) => updatePersonal('nativePlace', v)}
          mode="native"
        />
        <LocationPicker
          title="Settled Place"
          value={settledPlace}
          onChange={(v) => updatePersonal('settledPlace', v)}
          mode="city"
        />
      </div>

      <FormGrid className="mt-8">
        <FormField label="Profile Photo" required error={errors.profilePhoto} className="md:col-span-2">
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-wow-primary/50 transition">
            {form.profilePhoto ? (
              <img
                src={URL.createObjectURL(form.profilePhoto)}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <Upload className="w-8 h-8 text-wow-muted" />
            )}
            <span className="text-sm text-wow-muted">
              {form.profilePhoto ? form.profilePhoto.name : 'Click to upload profile photo'}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => update({ profilePhoto: e.target.files?.[0] || null })}
            />
          </label>
        </FormField>
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

export function ContactStep({ form, errors, update, updatePersonal }: StepProps) {
  const handleSameAsComm = (checked: boolean) => {
    update({ sameAsCommunication: checked });
    if (checked) {
      const comm = (form.personalDetails.communicationAddress as AddressFields) || emptyAddress();
      updatePersonal('referenceAddress', { ...comm });
    }
  };

  return (
    <WizardSection icon="🏠" title="Contact & Address">
      <div className="space-y-8">
        <AddressLocationBlock
          title="Communication Address"
          addressKey="communicationAddress"
          form={form}
          updatePersonal={updatePersonal}
          errors={errors}
        />

        <div className="flex items-center gap-2">
          <input
            id="sameAsComm"
            type="checkbox"
            checked={form.sameAsCommunication}
            onChange={(e) => handleSameAsComm(e.target.checked)}
            className="rounded border-gray-300 text-wow-primary focus:ring-wow-primary"
          />
          <label htmlFor="sameAsComm" className="text-sm text-wow-text">
            Same as Communication Address
          </label>
        </div>

        <AddressLocationBlock
          title="Reference Address"
          addressKey="referenceAddress"
          form={form}
          updatePersonal={updatePersonal}
          errors={errors}
          disabled={form.sameAsCommunication}
        />

        <FormField label="Legacy Address (summary)">
          <FormTextarea
            value={form.address}
            onChange={(v) => update({ address: v })}
            placeholder="Optional summary address for backward compatibility"
          />
        </FormField>
      </div>
    </WizardSection>
  );
}

export function FamilyStep({ form, errors, updateFamily }: StepProps) {
  const brothers = (form.familyDetails.brothers as SiblingEntry[]) || [];
  const sisters = (form.familyDetails.sisters as SiblingEntry[]) || [];
  const familyAssets = (form.familyDetails.familyAssets as FamilyAssetsState) || {
    selectedTypes: [],
    entries: {},
  };

  return (
    <WizardSection icon="👨‍👩‍👧" title="Family Details">
      <div className="space-y-8">
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
            <FormField label="Profession">
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
            <FormField label="Profession">
              <FormInput
                value={(form.familyDetails.motherProfession as string) || ''}
                onChange={(v) => updateFamily('motherProfession', v)}
              />
            </FormField>
          </FormGrid>
        </div>

        <FormGrid>
          <FormField label="Family Type">
            <FormInput
              value={(form.familyDetails.familyType as string) || ''}
              onChange={(v) => updateFamily('familyType', v)}
            />
          </FormField>
          <FormField label="Family Status">
            <FormInput
              value={(form.familyDetails.familyStatus as string) || ''}
              onChange={(v) => updateFamily('familyStatus', v)}
            />
          </FormField>
          <FormField label="Siblings (summary)" className="md:col-span-2">
            <FormInput
              value={(form.familyDetails.siblings as string) || ''}
              onChange={(v) => updateFamily('siblings', v)}
            />
          </FormField>
        </FormGrid>

        <SiblingList label="Brothers" items={brothers} onChange={(items) => updateFamily('brothers', items)} />
        <SiblingList label="Sisters" items={sisters} onChange={(items) => updateFamily('sisters', items)} />

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
            placeholder="Qualification"
          />
        </FormField>
        <FormField label="Institution">
          <FormInput
            value={(form.educationDetails.institution as string) || ''}
            onChange={(v) => updateEducation('institution', v)}
          />
        </FormField>
        <FormField label="Designation">
          <FormInput
            value={(form.educationDetails.designation as string) || ''}
            onChange={(v) => updateEducation('designation', v)}
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
        <FormField label="Company / Office Name">
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
        <FormField label="Income / Salary">
          <SearchableSelect
            value={(form.educationDetails.income as string) || ''}
            onChange={(v) => updateEducation('income', v)}
            options={INCOME_RANGE_OPTIONS}
            placeholder="Select income range"
          />
        </FormField>
        <FormField label="Annual Income">
          <SearchableSelect
            value={(form.educationDetails.annualIncome as string) || ''}
            onChange={(v) => updateEducation('annualIncome', v)}
            options={INCOME_RANGE_OPTIONS}
            placeholder="Select annual income"
          />
        </FormField>
        <FormField label="Work Location" className="md:col-span-2">
          <FormInput
            value={(form.educationDetails.workLocation as string) || ''}
            onChange={(v) => updateEducation('workLocation', v)}
          />
        </FormField>
      </FormGrid>
    </WizardSection>
  );
}

export function PartnerStep({ form, updatePartner }: StepProps) {
  const preferredLocation =
    (form.partnerPreferences.preferredLocation as LocationFields) || emptyLocation();

  return (
    <WizardSection icon="❤️" title="Partner Preferences">
      <FormGrid>
        <FormField label="Preferred Location Type">
          <FormSelect
            value={(form.partnerPreferences.locationPreference as string) || ''}
            onChange={(v) => updatePartner('locationPreference', v)}
            options={[
              { value: 'india', label: 'India' },
              { value: 'abroad', label: 'Abroad' },
              { value: 'any', label: 'Any' },
            ]}
          />
        </FormField>
        <FormField label="Specific Area">
          <FormInput
            value={(form.partnerPreferences.specificArea as string) || ''}
            onChange={(v) => updatePartner('specificArea', v)}
          />
        </FormField>
        <FormField label="Preferred Age">
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
          <FormInput
            value={(form.partnerPreferences.complexion as string) || ''}
            onChange={(v) => updatePartner('complexion', v)}
          />
        </FormField>
        <FormField label="Location Preference (text)">
          <FormInput
            value={(form.partnerPreferences.location as string) || ''}
            onChange={(v) => updatePartner('location', v)}
          />
        </FormField>
        <FormField label="Other Expectations" className="md:col-span-2">
          <FormTextarea
            value={(form.partnerPreferences.otherExpectations as string) || ''}
            onChange={(v) => updatePartner('otherExpectations', v)}
            rows={6}
          />
        </FormField>
        <FormField label="Additional Notes" className="md:col-span-2">
          <FormTextarea
            value={(form.partnerPreferences.notes as string) || ''}
            onChange={(v) => updatePartner('notes', v)}
          />
        </FormField>
      </FormGrid>

      <div className="mt-8">
        <LocationPicker
          title="Partner Preferred Location"
          value={preferredLocation}
          onChange={(v) => updatePartner('preferredLocation', v)}
          mode="partner"
        />
      </div>
    </WizardSection>
  );
}

const DOC_SLOTS: { key: string; label: string; type: AgentDocumentType; multiple?: boolean }[] = [
  { key: 'gallery', label: 'Gallery Photos', type: 'customer_photo', multiple: true },
  { key: 'aadhaar', label: 'Aadhaar', type: 'aadhaar' },
  { key: 'pan', label: 'PAN', type: 'pan' },
  { key: 'horoscope', label: 'Horoscope', type: 'horoscope' },
  { key: 'idProof', label: 'ID Proof', type: 'other' },
];

export function DocumentsStep({ form, update }: StepProps) {
  const addDocument = (type: AgentDocumentType, label: string, file: File) => {
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
      subtitle="Documents will be uploaded after the customer profile is created."
    >
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

        {form.profilePhoto && (
          <p className="text-xs text-wow-muted mt-2">
            Profile photo from Step 1 will also be uploaded as a customer photo.
          </p>
        )}
      </div>
    </WizardSection>
  );
}
