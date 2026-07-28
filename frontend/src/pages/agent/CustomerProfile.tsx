import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Image as ImageIcon, MapPin, Mail, Phone, Calendar, Shield } from 'lucide-react';
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

function formatLocation(loc: any): string {
  if (!loc || typeof loc !== 'object') return '—';
  const resolve = (val: string, other: string) => {
    return val === 'other' || val === 'OTHER' ? other || '' : val || '';
  };
  const parts = [
    resolve(loc.village, loc.villageOther),
    resolve(loc.city, loc.cityOther),
    resolve(loc.mandal, loc.mandalOther),
    resolve(loc.district, loc.districtOther),
    resolve(loc.state, loc.stateOther),
    resolve(loc.country, loc.countryOther),
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

function formatAddress(addr: any): string {
  if (!addr || typeof addr !== 'object') return '—';
  const resolve = (val: string, other: string) => {
    return val === 'other' || val === 'OTHER' ? other || '' : val || '';
  };
  const parts = [
    addr.houseNo,
    addr.street,
    resolve(addr.village, addr.villageOther),
    resolve(addr.mandal, addr.mandalOther),
    resolve(addr.city, addr.cityOther),
    resolve(addr.district, addr.districtOther),
    resolve(addr.state, addr.stateOther),
    resolve(addr.country, addr.countryOther),
    addr.pinCode,
  ].filter(Boolean);
  return parts.join(', ') || '—';
}

const TABS = [
  { id: 'personal', label: 'Personal Details' },
  { id: 'religion', label: 'Religion Details' },
  { id: 'horoscope', label: 'Horoscope' },
  { id: 'family', label: 'Family Details' },
  { id: 'career', label: 'Career & Education' },
  { id: 'partner', label: 'Preferences' },
  { id: 'photos', label: 'Photos' },
  { id: 'contact', label: 'Contact Information' },
] as const;

type ProfileTabId = (typeof TABS)[number]['id'];

function TabButtons({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            active === t.id
              ? 'bg-wow-primary text-white shadow-sm'
              : 'text-wow-muted hover:text-wow-primary hover:bg-[#FFF5F7]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
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
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 border-t border-gray-150 pt-2">{children}</dl>
    </WizardSection>
  );
}

export default function CustomerProfile() {
  const { customerId = '', id = '' } = useParams();
  const resolvedId = customerId || id;
  const { data: customer, isLoading, isError } = useAgentCustomer(resolvedId);
  const [activeTab, setActiveTab] = useState<string>('personal');

  if (isLoading) return <TableSkeleton rows={8} />;
  if (isError || !customer) return <ErrorState message="Customer not found." />;

  const fullName = `${customer.firstName} ${customer.lastName || ''}`.trim();
  const personal = json(customer as unknown as Record<string, unknown>, 'personalDetails');
  const family = json(customer as unknown as Record<string, unknown>, 'familyDetails');
  const educationDetails = json(customer as unknown as Record<string, unknown>, 'educationDetails');
  const religionDetails = json(customer as unknown as Record<string, unknown>, 'religionDetails');
  const partner = json(customer as unknown as Record<string, unknown>, 'partnerPreferences');

  const religionRecord = customer as unknown as Record<string, unknown>;
  const resolvedReligion = String(religionRecord.religion || '').trim();
  const resolvedCaste = String(religionRecord.caste || '').trim();
  const resolvedMotherTongue = String(religionRecord.motherTongue || '').trim();
  const resolvedOccupation = String(religionRecord.occupation || '').trim();
  const resolvedEducation = String(religionRecord.education || '').trim();

  const displayReligion = resolvedReligion.toLowerCase() === 'other' ? String((religionRecord.religionOther as string) || resolvedReligion) : resolvedReligion;
  const displayCaste = resolvedCaste.toLowerCase() === 'other' ? String((religionRecord.casteOther as string) || resolvedCaste) : resolvedCaste;
  const displayMotherTongue = resolvedMotherTongue.toLowerCase() === 'other' ? String((religionRecord.motherTongueOther as string) || resolvedMotherTongue) : resolvedMotherTongue;

  const maritalStatus = String(personal.maritalStatus || '').trim();
  const showMarriageHistory = ['divorced', 'separated', 'widowed'].includes(maritalStatus.toLowerCase());
  const isDivorced = maritalStatus.toLowerCase() === 'divorced';
  const isSeparated = maritalStatus.toLowerCase() === 'separated';
  const isWidowed = maritalStatus.toLowerCase() === 'widowed';

  const imageUrl = getCustomerProfileImageUrl(customer);
  const galleryPhotos = customer.documents?.filter((d: any) => d.type === 'customer_photo') || [];
  const horoscopeDoc = customer.documents?.find((d: any) => d.type === 'horoscope');

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
        </div>
        <div className="mt-6 max-w-md">
          <ProfileProgress value={customer.profileCompletion} />
        </div>
      </div>

      <div>
        <div className="flex flex-wrap gap-2 bg-white rounded-2xl p-2 border border-gray-100">
          <TabButtons active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="mt-4">
          {activeTab === 'personal' && (
            <ProfileSection icon="👤" title="Personal Details">
              <ReviewRow label="First Name" value={customer.firstName || '—'} />
              <ReviewRow label="Surname" value={String(personal.middleName || '—')} />
              <ReviewRow label="Last Name" value={customer.lastName || '—'} />
              <ReviewRow label="Gender" value={customer.gender || '—'} />
              <ReviewRow label="Date of Birth" value={customer.dateOfBirth || '—'} />
              <ReviewRow label="Age" value={personal.age ? `${personal.age} Years` : '—'} />
              <ReviewRow label="Height" value={String(personal.height || '—')} />
              <ReviewRow label="Weight" value={personal.weight ? `${personal.weight} kg` : '—'} />
              <ReviewRow label="Complexion" value={String(personal.complexion || '—')} />
              <ReviewRow label="Blood Group" value={String(personal.bloodGroup || '—')} />
              <div className="md:col-span-2">
                <ReviewRow label="About / Profile Summary" value={String(personal.about || '—')} />
              </div>
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                <h3 className="text-sm font-semibold text-wow-text mb-2">Relationship Status Details</h3>
              </div>
              <ReviewRow label="Relationship Status" value={maritalStatus || '—'} />
              {showMarriageHistory && (
                <>
                  <ReviewRow label="Marriage Date" value={String(personal.marriageDate || '—')} />
                  {isDivorced && <ReviewRow label="Divorce Date" value={String(personal.divorceDate || '—')} />}
                  {isDivorced && <ReviewRow label="Reason for Divorce" value={String(personal.divorceReason || '—')} />}
                  {isSeparated && <ReviewRow label="Separation Date" value={String(personal.separationDate || '—')} />}
                  <ReviewRow label="Years Married" value={String(personal.yearsMarried || '—')} />
                  <ReviewRow label="Children" value={String(personal.hasChildren || '—')} />
                  {String(personal.hasChildren).toLowerCase() === 'yes' && (
                    <>
                      <ReviewRow label="Number of Boys" value={String(personal.numberOfBoys || '0')} />
                      <ReviewRow label="Number of Girls" value={String(personal.numberOfGirls || '0')} />
                      <ReviewRow label="Living With" value={String(personal.livingWith || '—')} />
                    </>
                  )}
                </>
              )}
            </ProfileSection>
          )}

          {activeTab === 'religion' && (
            <ProfileSection icon="🛕" title="Religion Details">
              <ReviewRow label="Religion" value={displayReligion || '—'} />
              <ReviewRow label="Caste" value={displayCaste || '—'} />
              <ReviewRow label="Sub Caste" value={String(personal.subCaste || religionDetails.subCaste || '—')} />
              <ReviewRow label="Mother Tongue" value={displayMotherTongue || '—'} />
            </ProfileSection>
          )}

          {activeTab === 'horoscope' && (
            <ProfileSection icon="✨" title="Horoscope Details">
              <ReviewRow label="Do you have Horoscope?" value={String(personal.hasHoroscope || '—')} />
              <ReviewRow label="Gothram / Gothra" value={String(religionDetails.gothra || personal.gothram || '—')} />
              <ReviewRow label="Star / Nakshatra" value={String(religionDetails.star || personal.star || '—')} />
              <ReviewRow label="Padam" value={String(religionDetails.padam || personal.padam || '—')} />
              <ReviewRow label="Rasi" value={String(religionDetails.rasi || personal.rasi || '—')} />
              <ReviewRow label="Kuja Dosham" value={String(religionDetails.kujaDosham || personal.kujaDosham || '—')} />
              <ReviewRow label="Time of Birth" value={String(personal.timeOfBirth || '—')} />
              <ReviewRow label="Place of Birth" value={formatLocation(personal.birthPlace)} />
              <div className="md:col-span-2 border-t border-gray-100 mt-2 pt-3">
                <div className="py-2 border-b border-gray-100 last:border-0">
                  <dt className="text-xs text-wow-muted">Horoscope File Upload</dt>
                  <dd className="text-sm font-medium text-wow-text mt-0.5 normal-case">
                    {horoscopeDoc ? (
                      <a
                        href={horoscopeDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-wow-primary hover:underline bg-[#FFF0F4] px-3 py-1.5 rounded-xl border border-[#F2DFE8]"
                      >
                        <FileText className="w-4 h-4" />
                        View Horoscope ({horoscopeDoc.fileName})
                      </a>
                    ) : (
                      'No horoscope uploaded'
                    )}
                  </dd>
                </div>
              </div>
            </ProfileSection>
          )}

          {activeTab === 'family' && (
            <ProfileSection icon="👨‍👩‍👧" title="Family Details">
              <div className="md:col-span-2">
                <ReviewRow label="Native Place" value={formatLocation(personal.nativePlace)} />
              </div>
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                <h3 className="text-sm font-semibold text-wow-text">Father Details</h3>
              </div>
              <ReviewRow label="Father Name" value={String(family.fatherName || '—')} />
              <ReviewRow label="Life Status" value={String(family.fatherLifeStatus || '—')} />
              {String(family.fatherLifeStatus).toLowerCase() !== 'deceased' && (
                <>
                  <ReviewRow label="Father Age" value={String(family.fatherAge || '—')} />
                  <ReviewRow label="Father Qualification" value={String(family.fatherQualification || '—')} />
                  <ReviewRow label="Father Occupation" value={String(family.fatherProfession || '—')} />
                </>
              )}
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                <h3 className="text-sm font-semibold text-wow-text">Mother Details</h3>
              </div>
              <ReviewRow label="Mother Name" value={String(family.motherName || '—')} />
              <ReviewRow label="Life Status" value={String(family.motherLifeStatus || '—')} />
              {String(family.motherLifeStatus).toLowerCase() !== 'deceased' && (
                <>
                  <ReviewRow label="Mother Age" value={String(family.motherAge || '—')} />
                  <ReviewRow label="Mother Qualification" value={String(family.motherQualification || '—')} />
                  <ReviewRow label="Mother Occupation" value={String(family.motherProfession || '—')} />
                </>
              )}
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                <h3 className="text-sm font-semibold text-wow-text">Assets & Status</h3>
              </div>
              <ReviewRow label="Family Type" value={String(family.familyType || '—')} />
              <ReviewRow label="Family Status" value={String(family.familyStatus || '—')} />
              <div className="md:col-span-2">
                <ReviewRow label="Family Assets" value={displayValue(family.familyAssets)} />
              </div>
              {((family.brothers as any[]) || []).length > 0 && (
                <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                  <h3 className="text-sm font-semibold text-wow-text mb-2">Brothers Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((family.brothers as any[]) || []).map((b, idx) => (
                      <div key={b.id || idx} className="p-3 bg-[#FAF8FB] rounded-xl border border-gray-100">
                        <p className="font-semibold text-wow-text text-sm">Brother {idx + 1}: {b.name || '—'}</p>
                        <p className="text-xs text-wow-muted mt-1">Age: {b.age || '—'} · Status: {b.maritalStatus || '—'}</p>
                        <p className="text-xs text-wow-muted">Qual: {b.qualification || '—'} · Occ: {b.profession || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {((family.sisters as any[]) || []).length > 0 && (
                <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                  <h3 className="text-sm font-semibold text-wow-text mb-2">Sisters Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {((family.sisters as any[]) || []).map((s, idx) => (
                      <div key={s.id || idx} className="p-3 bg-[#FAF8FB] rounded-xl border border-gray-100">
                        <p className="font-semibold text-wow-text text-sm">Sister {idx + 1}: {s.name || '—'}</p>
                        <p className="text-xs text-wow-muted mt-1">Age: {s.age || '—'} · Status: {s.maritalStatus || '—'}</p>
                        <p className="text-xs text-wow-muted">Qual: {s.qualification || '—'} · Occ: {s.profession || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ProfileSection>
          )}

          {activeTab === 'career' && (
            <ProfileSection icon="💼" title="Career & Education Details">
              <ReviewRow label="Highest Qualification" value={resolvedEducation || '—'} />
              <ReviewRow label="Education Details" value={String(educationDetails.education || '—')} />
              <ReviewRow label="College / Institution" value={String(educationDetails.collegeName || educationDetails.institution || '—')} />
              <ReviewRow label="College Place" value={String(educationDetails.collegePlace || '—')} />
              <ReviewRow label="Occupation Type" value={resolvedOccupation || '—'} />
              {['employee', 'business', 'self employed'].includes(String(educationDetails.employmentType).toLowerCase()) && (
                <>
                  <ReviewRow
                    label={String(educationDetails.employmentType).toLowerCase() === 'employee' ? 'Company Name' : 'Business Name'}
                    value={String(educationDetails.company || educationDetails.businessName || '—')}
                  />
                  <ReviewRow label="Role / Designation" value={String(educationDetails.role || educationDetails.designation || '—')} />
                  <ReviewRow
                    label={String(educationDetails.employmentType).toLowerCase() === 'employee' ? 'Salary' : 'Business Income'}
                    value={String(educationDetails.salary || educationDetails.businessIncome || '—')}
                  />
                  <ReviewRow
                    label="Work Location"
                    value={
                      String(educationDetails.employmentType).toLowerCase() === 'employee'
                        ? formatLocation(educationDetails.workLocation)
                        : formatLocation(educationDetails.businessLocation)
                    }
                  />
                </>
              )}
            </ProfileSection>
          )}

          {activeTab === 'partner' && (
            <ProfileSection icon="❤️" title="Partner Preferences">
              <ReviewRow label="Age Range" value={String(partner.ageRange || '—')} />
              <ReviewRow label="Height Range" value={partner.minHeight && partner.maxHeight ? `${partner.minHeight} to ${partner.maxHeight}` : '—'} />
              <ReviewRow label="Preferred Religion" value={String(partner.religion || '—')} />
              <ReviewRow label="Preferred Caste" value={String(partner.caste || '—')} />
              <ReviewRow label="Preferred Sub Caste" value={String(partner.subCaste || '—')} />
              <ReviewRow label="Preferred Qualification" value={String(partner.education || '—')} />
              <ReviewRow label="Preferred Profession" value={String(partner.profession || '—')} />
              <ReviewRow label="Preferred Complexion" value={String(partner.complexion || '—')} />
              <div className="md:col-span-2">
                <ReviewRow label="Preferred Location" value={formatLocation(partner.preferredLocation)} />
              </div>
              <div className="md:col-span-2">
                <ReviewRow label="Expectations" value={String(partner.otherExpectations || partner.notes || '—')} />
              </div>
            </ProfileSection>
          )}

          {activeTab === 'photos' && (
            <WizardSection icon="📷" title="Photos">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-wow-text mb-3 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-wow-primary" /> Profile Photo (Primary)
                  </h3>
                  {imageUrl ? (
                    <div className="w-48 h-48 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={imageUrl} alt="Profile Photo" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <p className="text-sm text-wow-muted">No profile photo uploaded.</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-wow-text mb-3 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-wow-primary" /> Gallery Photos
                  </h3>
                  {galleryPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {galleryPhotos.map((photo: any) => (
                        <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition">
                          <img src={photo.fileUrl} alt="Gallery Photo" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1 truncate text-[10px] text-white">
                            {photo.fileName}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-wow-muted">No gallery photos uploaded.</p>
                  )}
                </div>
              </div>
            </WizardSection>
          )}

          {activeTab === 'contact' && (
            <ProfileSection icon="🏠" title="Contact & Address Information">
              <ReviewRow label="Primary Mobile Number" value={customer.phone || '—'} />
              <ReviewRow label="Alternate Mobile Number" value={String(personal.alternateMobile || '—')} />
              <ReviewRow label="Email Address" value={customer.email || '—'} />
              <ReviewRow label="Address" value={customer.address || '—'} />
              <div className="md:col-span-2 border-t border-gray-100 my-2 pt-2">
                <ReviewRow label="Communication Address" value={formatAddress(personal.communicationAddress)} />
              </div>
            </ProfileSection>
          )}
        </div>
      </div>
    </div>
  );
}
