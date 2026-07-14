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
  const comm = (form.personalDetails.communicationAddress as AddressFields) || {};
  const ref = (form.personalDetails.referenceAddress as AddressFields) || {};
  const birthPlace = (form.personalDetails.birthPlace as LocationFields) || {};
  const nativePlace = (form.personalDetails.nativePlace as LocationFields) || {};
  const settledPlace = (form.personalDetails.settledPlace as LocationFields) || {};
  const preferredLocation =
    (form.partnerPreferences.preferredLocation as LocationFields) || {};

  return (
    <WizardSection
      icon="✓"
      title="Review & Submit"
      subtitle="Review all details before creating the customer profile."
    >
      <div className="space-y-4">
        <ReviewBlock title="👤 Personal Information" onEdit={() => onEdit(0)}>
          <dl>
            <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
            <ReviewRow label="Gender" value={form.gender} />
            <ReviewRow label="Date of Birth" value={form.dateOfBirth} />
            <ReviewRow label="Age" value={calculateAge(form.dateOfBirth)} />
            <ReviewRow label="Mobile" value={form.phone} />
            <ReviewRow label="Email" value={form.email} />
            <ReviewRow label="Religion" value={form.religion} />
            <ReviewRow label="Caste" value={form.caste} />
            <ReviewRow label="Height" value={(form.personalDetails.height as string) || ''} />
            <ReviewRow label="Weight" value={(form.personalDetails.weight as string) || ''} />
            <ReviewRow
              label="Marital Status"
              value={(form.personalDetails.maritalStatus as string) || ''}
            />
            <ReviewRow label="Birth Place" value={formatLocationDisplay(birthPlace)} />
            <ReviewRow label="Native Place" value={formatLocationDisplay(nativePlace)} />
            <ReviewRow label="Settled Place" value={formatLocationDisplay(settledPlace)} />
            <ReviewRow label="Profile Photo" value={form.profilePhoto?.name || '—'} />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="🏠 Contact & Address" onEdit={() => onEdit(1)}>
          <dl>
            <ReviewRow label="Communication Address" value={formatAddress(comm)} />
            <ReviewRow label="Reference Address" value={formatAddress(ref)} />
            <ReviewRow label="Summary Address" value={form.address} />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="👨‍👩‍👧 Family Details" onEdit={() => onEdit(2)}>
          <dl>
            <ReviewRow
              label="Father"
              value={`${form.familyDetails.fatherName || ''} · ${form.familyDetails.fatherProfession || ''}`.trim()}
            />
            <ReviewRow
              label="Mother"
              value={`${form.familyDetails.motherName || ''} · ${form.familyDetails.motherProfession || ''}`.trim()}
            />
            <ReviewRow label="Brothers" value={displayValue(form.familyDetails.brothers)} />
            <ReviewRow label="Sisters" value={displayValue(form.familyDetails.sisters)} />
            <ReviewRow
              label="Family Assets"
              value={displayValue(form.familyDetails.familyAssets)}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="💼 Education & Career" onEdit={() => onEdit(3)}>
          <dl>
            <ReviewRow label="Education" value={form.education} />
            <ReviewRow label="Occupation" value={form.occupation} />
            <ReviewRow label="Company" value={(form.educationDetails.company as string) || ''} />
            <ReviewRow
              label="Annual Income"
              value={(form.educationDetails.annualIncome as string) || ''}
            />
            <ReviewRow
              label="Work Location"
              value={(form.educationDetails.workLocation as string) || ''}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="❤️ Partner Preferences" onEdit={() => onEdit(4)}>
          <dl>
            <ReviewRow
              label="Location Type"
              value={(form.partnerPreferences.locationPreference as string) || ''}
            />
            <ReviewRow
              label="Preferred Location"
              value={formatLocationDisplay(preferredLocation)}
            />
            <ReviewRow label="Age Range" value={(form.partnerPreferences.ageRange as string) || ''} />
            <ReviewRow label="Caste" value={(form.partnerPreferences.caste as string) || ''} />
            <ReviewRow
              label="Expectations"
              value={(form.partnerPreferences.otherExpectations as string) || ''}
            />
          </dl>
        </ReviewBlock>

        <ReviewBlock title="📄 Documents" onEdit={() => onEdit(5)}>
          <dl>
            <ReviewRow
              label="Pending Documents"
              value={
                form.pendingDocuments.length
                  ? form.pendingDocuments.map((d) => d.file.name).join(', ')
                  : '—'
              }
            />
          </dl>
        </ReviewBlock>
      </div>
    </WizardSection>
  );
}
