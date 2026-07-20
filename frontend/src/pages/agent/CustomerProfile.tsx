import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useAgentCustomer } from '../../hooks/agent/useAgent';
import { displayValue } from '../../lib/agent/addCustomerUtils';
import { getCustomerProfileImageUrl } from '../../lib/agent/customerAvatar';
import {
  ErrorState,
  ProfileProgress,
  StatusBadge,
  TableSkeleton,
} from '../../components/agent/AgentUI';
import CustomerAvatar from '../../components/agent/CustomerAvatar';
import { ReviewRow, WizardSection } from '../../components/agent/addCustomer/WizardUI';

function json(customer: Record<string, unknown>, key: string): Record<string, unknown> {
  return (customer[key] as Record<string, unknown>) || {};
}

function TabButtons() {
  const tabs = [
    { id: 'personal', label: 'Personal' },
    { id: 'contact', label: 'Contact' },
    { id: 'family', label: 'Family' },
    { id: 'education', label: 'Education' },
    { id: 'religion', label: 'Religion' },
    { id: 'partner', label: 'Partner' },
  ] as const;
  const [active, setActive] = useState<string>('personal');
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            const ev = new CustomEvent('customer-profile-tab', { detail: t.id });
            window.dispatchEvent(ev);
            setActive(t.id);
          }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium ${active === t.id ? 'bg-wow-primary text-white' : 'text-wow-muted hover:text-wow-primary'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function ProfileTabs({ activeDefault = 'personal', sections }: { activeDefault?: string; sections: Record<string, ReactNode> }) {
  const [active, setActive] = useState<string>(activeDefault);
  useEffect(() => {
    const handler = (e: any) => setActive(e.detail || activeDefault);
    window.addEventListener('customer-profile-tab', handler as EventListener);
    return () => window.removeEventListener('customer-profile-tab', handler as EventListener);
  }, [activeDefault]);

  return <div>{sections[active] || null}</div>;
}

function ProfileSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <WizardSection icon={icon} title={title}>
      <dl>{children}</dl>
    </WizardSection>
  );
}

export default function CustomerProfile() {
  const { customerId = '', id = '' } = useParams();
  const resolvedId = customerId || id;
  const { data: customer, isLoading, isError } = useAgentCustomer(resolvedId);

  if (isLoading) return <TableSkeleton rows={8} />;
  if (isError || !customer) return <ErrorState message="Customer not found." />;

  const fullName = `${customer.firstName} ${customer.lastName || ''}`.trim();
  const personal = json(customer as unknown as Record<string, unknown>, 'personalDetails');
  const family = json(customer as unknown as Record<string, unknown>, 'familyDetails');
  const education = json(customer as unknown as Record<string, unknown>, 'educationDetails');
  const religion = json(customer as unknown as Record<string, unknown>, 'religionDetails');
  const partner = json(customer as unknown as Record<string, unknown>, 'partnerPreferences');
  const manageUrl = `/agent/customers/${resolvedId}/manage`;
  const imageUrl = getCustomerProfileImageUrl(customer);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to={`/agent/customers`} className="inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary">
        <ArrowLeft className="w-4 h-4" /> Back to customers
      </Link>

      <div
        className="bg-white rounded-[20px] p-6 border border-gray-100"
        style={{ boxShadow: '0 4px 24px rgba(182, 106, 138, 0.08)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <CustomerAvatar name={fullName} imageUrl={imageUrl} size={64} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl text-wow-text">{fullName}</h1>
                <StatusBadge status={customer.status} />
              </div>
              <p className="text-wow-muted font-mono text-sm mt-1">{customer.customerCode}</p>
            </div>
          </div>
          {/* Manage profile removed per feature request */}
        </div>
        <div className="mt-6 max-w-md">
          <ProfileProgress value={customer.profileCompletion} />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2 bg-white rounded-lg p-2 border border-gray-100">
          <TabButtons />
        </div>

        <div className="mt-4">
          <ProfileTabs
            activeDefault="personal"
            sections={{
              personal: (
                <ProfileSection icon="👤" title="Personal Information">
                  <ReviewRow label="Mobile" value={customer.phone || ''} />
                  <ReviewRow label="Email" value={customer.email || ''} />
                  <ReviewRow label="Gender" value={customer.gender || ''} />
                  <ReviewRow label="Date of Birth" value={customer.dateOfBirth || ''} />
                  <ReviewRow label="Religion" value={customer.religion || ''} />
                  <ReviewRow label="Caste" value={customer.caste || ''} />
                  <ReviewRow label="Mother Tongue" value={customer.motherTongue || ''} />
                  <ReviewRow label="Marital Status" value={String(personal.maritalStatus || '')} />
                  <ReviewRow label="Height" value={String(personal.height || '')} />
                  <ReviewRow label="Weight" value={String(personal.weight || '')} />
                </ProfileSection>
              ),
              contact: (
                <ProfileSection icon="🏠" title="Contact & Address">
                  <ReviewRow label="Address" value={customer.address || ''} />
                  <ReviewRow label="Communication Address" value={displayValue(personal.communicationAddress)} />
                  <ReviewRow label="Reference Address" value={displayValue(personal.referenceAddress)} />
                </ProfileSection>
              ),
              family: (
                <ProfileSection icon="👨‍👩‍👧" title="Family Details">
                  <ReviewRow label="Father" value={String(family.fatherName || '')} />
                  <ReviewRow label="Mother" value={String(family.motherName || '')} />
                  <ReviewRow label="Brothers" value={displayValue(family.brothers)} />
                  <ReviewRow label="Sisters" value={displayValue(family.sisters)} />
                  <ReviewRow label="Family Assets" value={displayValue(family.familyAssets)} />
                </ProfileSection>
              ),
              education: (
                <ProfileSection icon="💼" title="Education & Career">
                  <ReviewRow label="Education" value={customer.education || ''} />
                  <ReviewRow label="Occupation" value={customer.occupation || ''} />
                  <ReviewRow label="Company" value={String(education.company || '')} />
                  <ReviewRow label="Annual Income" value={String(education.annualIncome || '')} />
                  <ReviewRow label="Work Location" value={String(education.workLocation || '')} />
                </ProfileSection>
              ),
              religion: (
                <ProfileSection icon="🕉️" title="Religion">
                  <ReviewRow label="Gothra" value={String(religion.gothra || personal.gothram || '')} />
                  <ReviewRow label="Star" value={String(religion.star || personal.star || '')} />
                  <ReviewRow label="Rasi" value={String(religion.rasi || personal.rasi || '')} />
                </ProfileSection>
              ),
              partner: (
                <ProfileSection icon="❤️" title="Partner Preferences">
                  <ReviewRow label="Age Range" value={String(partner.ageRange || '')} />
                  <ReviewRow label="Preferred Caste" value={String(partner.caste || '')} />
                  <ReviewRow label="Location" value={String(partner.locationPreference || '')} />
                  <ReviewRow label="Expectations" value={String(partner.otherExpectations || partner.notes || '')} />
                </ProfileSection>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
}
