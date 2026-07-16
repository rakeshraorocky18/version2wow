import type { AddCustomerFormState, AddressFields, LocationFields } from '../../../types/addCustomer';
import {
  calculateAge,
  displayValue,
  formatAddress,
} from '../../../lib/agent/addCustomerUtils';
import { formatLocationDisplay } from './LocationPicker';
import { ReviewBlock, ReviewRow, WizardSection } from './WizardUI';

type ReviewStepProps = {
  form: AddCustomerFormState;
  agentName?: string;
  onEdit: (step: number) => void;
};

export function ReviewStep({ form, onEdit }: ReviewStepProps) {
  const addr = (form.personalDetails.communicationAddress as AddressFields) || {};
  const birthPlace = (form.personalDetails.birthPlace as LocationFields) || {};
  const nativePlace = (form.personalDetails.nativePlace as LocationFields) || {};
  const settledPlace = (form.personalDetails.settledPlace as LocationFields) || {};
  const preferredLocation =
    (form.partnerPreferences.preferredLocation as LocationFields) || {};

  const middleName = (form.personalDetails.middleName as string) || '';
  const fullName = [form.firstName, middleName, form.lastName].filter(Boolean).join(' ');
  const maritalStatus = ((form.personalDetails.maritalStatus as string) || '').toLowerCase();
  const hasHoroscope = (form.personalDetails.hasHoroscope as string) || '';

  return (
    <WizardSection
      icon="✓"
      title="Review & Submit"
      subtitle="Review all details before creating the customer profile."
    >
      <div className="space-y-4">
        <ReviewBlock title="Personal Details" onEdit={() => onEdit(0)}>
          <dl>
            <ReviewRow label="Name" value={fullName} />
            <ReviewRow label="Gender" value={form.gender} />
            <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
            <ReviewRow label="Age" value={calculateAge(form.dateOfBirth)} />
            <ReviewRow label="Height" value={(form.personalDetails.height as string) || ''} />
            <ReviewRow label="Weight" value={(form.personalDetails.weight as string) || ''} />
            <ReviewRow
              label="Complexion"
              value={(form.personalDetails.complexion as string) || ''}
            />
            <ReviewRow
              label="Blood Group"
              value={(form.personalDetails.bloodGroup as string) || ''}
            />
            <ReviewRow label="Mobile" value={form.phone} />
            <ReviewRow
              label="Alternate Mobile"
              value={(form.personalDetails.alternateMobile as string) || ''}
            />
            <ReviewRow label="Email" value={form.email} />
            <ReviewRow label="Religion" value={form.religion} />
            <ReviewRow label="Caste" value={form.caste} />
            <ReviewRow
              label="Sub Caste"
              value={(form.personalDetails.subCaste as string) || ''}
            />
            <ReviewRow label="Mother Tongue" value={form.motherTongue} />
            <ReviewRow label="Profile Photo" value={form.profilePhoto?.name || '—'} />
            <ReviewRow label="About" value={(form.personalDetails.about as string) || ''} />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Horoscope" onEdit={() => onEdit(1)}>
          <dl>
            <ReviewRow label="Do you have Horoscope?" value={hasHoroscope} />
            <ReviewRow
              label="Time of Birth"
              value={(form.personalDetails.timeOfBirth as string) || ''}
            />
            <ReviewRow label="Place of Birth" value={formatLocationDisplay(birthPlace)} />
            {hasHoroscope.toLowerCase() === 'yes' && (
              <>
                <ReviewRow label="Star" value={(form.personalDetails.star as string) || ''} />
                <ReviewRow label="Padam" value={(form.personalDetails.padam as string) || ''} />
                <ReviewRow label="Rasi" value={(form.personalDetails.rasi as string) || ''} />
                <ReviewRow
                  label="Gothram"
                  value={(form.personalDetails.gothram as string) || ''}
                />
                <ReviewRow
                  label="Kuja Dosham"
                  value={(form.personalDetails.kujaDosham as string) || ''}
                />
                <ReviewRow
                  label="Horoscope File"
                  value={
                    form.pendingDocuments.find((d) => d.type === 'horoscope')?.file.name || '—'
                  }
                />
              </>
            )}
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Relationship Status" onEdit={() => onEdit(2)}>
          <dl>
            <ReviewRow
              label="Relationship Status"
              value={(form.personalDetails.maritalStatus as string) || ''}
            />
            {(maritalStatus === 'divorced' || maritalStatus === 'separated') && (
              <>
                <ReviewRow
                  label="Marriage Date"
                  value={(form.personalDetails.marriageDate as string) || ''}
                />
                {maritalStatus === 'divorced' && (
                  <ReviewRow
                    label="Divorce Date"
                    value={(form.personalDetails.divorceDate as string) || ''}
                  />
                )}
                {maritalStatus === 'separated' && (
                  <ReviewRow
                    label="Separation Date"
                    value={(form.personalDetails.separationDate as string) || ''}
                  />
                )}
              </>
            )}
            {(maritalStatus === 'divorced' ||
              maritalStatus === 'widowed' ||
              maritalStatus === 'separated') && (
              <>
                <ReviewRow
                  label="Children"
                  value={(form.personalDetails.hasChildren as string) || ''}
                />
                {((form.personalDetails.hasChildren as string) || '').toLowerCase() === 'yes' && (
                  <>
                    <ReviewRow
                      label="Number of Boys"
                      value={(form.personalDetails.numberOfBoys as string) || ''}
                    />
                    <ReviewRow
                      label="Number of Girls"
                      value={(form.personalDetails.numberOfGirls as string) || ''}
                    />
                    <ReviewRow
                      label="Living With"
                      value={(form.personalDetails.livingWith as string) || ''}
                    />
                  </>
                )}
              </>
            )}
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Location" onEdit={() => onEdit(3)}>
          <dl>
            <ReviewRow label="Address" value={formatAddress(addr)} />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Family" onEdit={() => onEdit(4)}>
          <dl>
            <ReviewRow label="Native Place" value={formatLocationDisplay(nativePlace)} />
            <ReviewRow label="Settled Place" value={formatLocationDisplay(settledPlace)} />
            <ReviewRow
              label="Father"
              value={`${form.familyDetails.fatherName || ''} · ${form.familyDetails.fatherProfession || ''}`.trim()}
            />
            <ReviewRow
              label="Mother"
              value={`${form.familyDetails.motherName || ''} · ${form.familyDetails.motherProfession || ''}`.trim()}
            />
            <ReviewRow label="Family Type" value={String(form.familyDetails.familyType || '')} />
            <ReviewRow
              label="Family Status"
              value={String(form.familyDetails.familyStatus || '')}
            />
            <ReviewRow label="Brothers" value={displayValue(form.familyDetails.brothers)} />
            <ReviewRow label="Sisters" value={displayValue(form.familyDetails.sisters)} />
            <ReviewRow
              label="Family Properties"
              value={displayValue(form.familyDetails.familyAssets)}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Education" onEdit={() => onEdit(5)}>
          <dl>
            <ReviewRow label="Highest Qualification" value={form.education} />
            <ReviewRow
              label="Education"
              value={
                (form.educationDetails.education as string) ||
                (form.educationDetails.institution as string) ||
                ''
              }
            />
            <ReviewRow label="Occupation" value={form.occupation} />
            <ReviewRow
              label="Designation"
              value={(form.educationDetails.designation as string) || ''}
            />
            <ReviewRow
              label="Office / Business Name"
              value={(form.educationDetails.officeName as string) || ''}
            />
            <ReviewRow
              label="Company Name"
              value={(form.educationDetails.company as string) || ''}
            />
            <ReviewRow
              label="Business Name"
              value={(form.educationDetails.businessName as string) || ''}
            />
            <ReviewRow
              label="Work Location"
              value={(form.educationDetails.workLocation as string) || ''}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Partner Preference" onEdit={() => onEdit(6)}>
          <dl>
            <ReviewRow
              label="Preferred Age Range"
              value={(form.partnerPreferences.ageRange as string) || ''}
            />
            <ReviewRow
              label="Preferred Religion"
              value={(form.partnerPreferences.religion as string) || ''}
            />
            <ReviewRow
              label="Preferred Caste"
              value={(form.partnerPreferences.caste as string) || ''}
            />
            <ReviewRow
              label="Preferred Sub Caste"
              value={(form.partnerPreferences.subCaste as string) || ''}
            />
            <ReviewRow
              label="Preferred Qualification"
              value={(form.partnerPreferences.education as string) || ''}
            />
            <ReviewRow
              label="Preferred Profession"
              value={(form.partnerPreferences.profession as string) || ''}
            />
            <ReviewRow
              label="Preferred Complexion"
              value={(form.partnerPreferences.complexion as string) || ''}
            />
            <ReviewRow
              label="Preferred Location"
              value={formatLocationDisplay(preferredLocation)}
            />
            <ReviewRow
              label="Other Expectations"
              value={(form.partnerPreferences.otherExpectations as string) || ''}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="Documents" onEdit={() => onEdit(7)}>
          <dl>
            <ReviewRow label="Profile Photo" value={form.profilePhoto?.name || '—'} />
            <ReviewRow
              label="Pending Documents"
              value={
                form.pendingDocuments.length
                  ? form.pendingDocuments.map((d) => `${d.label}: ${d.file.name}`).join(', ')
                  : '—'
              }
            />
          </dl>
        </ReviewBlock>
      </div>
    </WizardSection>
  );
}
