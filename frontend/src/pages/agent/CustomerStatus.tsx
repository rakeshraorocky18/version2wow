import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Search, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAgentCustomer, useAgentCustomerHistory, useDeleteCustomerProfile } from '../../hooks/agent/useAgent';
import { useFixMatch } from '../../hooks/agent/useAgent';
import type { AgentCustomerHistoryCard } from '../../services/agent/agentService';
import { TableSkeleton } from '../../components/agent/AgentUI';

const DELETE_REASONS = [
  'Marriage Completed',
  'Profile Created by Mistake',
  'Duplicate Profile',
  'Customer Requested Deletion',
  'Inactive Customer',
  'Invalid Information',
  'Other',
] as const;

type DeleteReason = (typeof DELETE_REASONS)[number];

function calcAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = new Date().getTime() - dob.getTime();
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return years > 0 ? `${years} yrs` : null;
}

function formatPartnerLabel(item: AgentCustomerHistoryCard) {
  const { profile } = item;
  const age = calcAge(profile.dateOfBirth ?? null);
  return [profile.name, age, profile.customerCode].filter(Boolean).join(' · ');
}

function PartnerOption({
  item,
  selected,
  onSelect,
}: {
  item: AgentCustomerHistoryCard;
  selected: boolean;
  onSelect: () => void;
}) {
  const { profile } = item;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
        selected ? 'border-wow-primary bg-[#FFF5F7]' : 'border-gray-200 bg-white hover:border-wow-primary/30 hover:bg-[#FEF6F8]'
      }`}
    >
      <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#FFF0F4] text-wow-primary shadow-sm">
        {profile.profileImageUrl ? (
          <img src={profile.profileImageUrl} alt={profile.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold uppercase text-wow-primary">
            {profile.name?.slice(0, 2) || 'NA'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-wow-text">{profile.name}</p>
        <p className="mt-1 text-xs text-wow-muted">{formatPartnerLabel(item)}</p>
      </div>
      {selected && <CheckCircle2 className="h-5 w-5 text-wow-primary" />}
    </button>
  );
}

export default function CustomerStatus() {
  const { customerId = '' } = useParams();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<'match-fixed' | 'delete-profile' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [reason, setReason] = useState<DeleteReason>('Marriage Completed');
  const [otherReason, setOtherReason] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const customerQuery = useAgentCustomer(customerId);
  const historyQuery = useAgentCustomerHistory(customerId, !!customerId);
  const partnerQuery = useAgentCustomer(customerQuery.data?.matchedWith || '', !!customerQuery.data?.matchedWith);
  const fixMatch = useFixMatch(customerId);
  const deleteProfile = useDeleteCustomerProfile(customerId);

  const acceptedPartners = useMemo(() => {
    return historyQuery.data?.interested || [];
  }, [historyQuery.data]);

  const filteredPartners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return acceptedPartners.filter((item) => {
      const label = `${item.profile.name} ${item.profile.customerCode || ''}`.toLowerCase();
      return !query || label.includes(query);
    });
  }, [acceptedPartners, searchTerm]);

  const selectedPartner = useMemo(
    () => acceptedPartners.find((item) => item.profile.id === selectedPartnerId) ?? null,
    [acceptedPartners, selectedPartnerId],
  );

  const isAlreadyMatched = !!customerQuery.data?.matchedWith;

  const canDelete = reason && (reason !== 'Other' || otherReason.trim().length > 0);
  const deleteReasonText = reason === 'Other' ? otherReason.trim() : reason;

  const handleFixMatch = async () => {
    if (!selectedPartnerId) {
      toast.error('Please select a partner to fix match.');
      return;
    }
    fixMatch.mutate(selectedPartnerId, {
      onSuccess: () => {
        toast.success('Match fixed successfully');
        // Refresh customer and history data to show read-only status
        customerQuery.refetch();
        historyQuery.refetch();
        setActivePanel(null);
      },
      onError: (error: unknown) => {
        toast.error(
          (error as any)?.response?.data?.message || 'Unable to fix match',
        );
      },
    });
  };

  const handleDeleteProfile = async () => {
    if (!canDelete) {
      toast.error('Please provide a delete reason.');
      return;
    }
    deleteProfile.mutate(
      {
        reason,
        otherReason: deleteReasonText,
      },
      {
        onSuccess: () => {
          toast.success('Customer profile deleted successfully');
          navigate('/agent/customers');
        },
        onError: (error: unknown) => {
          toast.error((error as any)?.response?.data?.message || 'Unable to delete profile');
        },
      },
    );
  };

  const customerName = `${customerQuery.data?.firstName ?? ''} ${customerQuery.data?.lastName ?? ''}`.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to={`/agent/customers/${customerId}`} className="inline-flex items-center gap-2 text-sm text-wow-primary hover:text-wow-primary-dark">
            <ArrowLeft className="h-4 w-4" /> Back to customer workspace
          </Link>
          <h1 className="mt-3 font-display text-3xl text-wow-text">Status Management</h1>
          <p className="text-wow-muted mt-1">Manage match fixed and deletion actions for {customerName || 'customer'}.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-6 w-6 text-wow-primary" />
            <div>
              <h2 className="text-xl font-semibold text-wow-text">Match Fixed</h2>
              <p className="text-sm text-wow-muted mt-1">Convert an accepted profile relationship into a fixed match pair.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {isAlreadyMatched ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
                  <p className="text-sm font-semibold text-green-700">MATCH STATUS</p>
                  <div className="mt-3">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-green-700">✓ Match Fixed</div>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-semibold">Partner</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="h-20 w-20 rounded-2xl overflow-hidden bg-[#FFF0F4]">
                      {partnerQuery.data?.profileImageUrl ? (
                        <img src={partnerQuery.data.profileImageUrl} alt={partnerQuery.data?.firstName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-lg font-semibold text-wow-primary">
                          {partnerQuery.data ? (partnerQuery.data.firstName?.slice(0, 2) || 'NA') : 'NA'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-wow-text">{partnerQuery.data ? `${partnerQuery.data.firstName} ${partnerQuery.data.lastName || ''}` : '—'}</p>
                      <p className="text-xs text-wow-muted">{partnerQuery.data?.customerCode || '—'}</p>
                      <p className="text-xs text-wow-muted">{partnerQuery.data?.dateOfBirth ? calcAge(partnerQuery.data.dateOfBirth) : '—'}</p>
                      <p className="text-xs text-wow-muted">Match fixed on: {customerQuery.data?.matchedAt ? new Date(customerQuery.data.matchedAt).toLocaleString() : '—'}</p>
                      <p className="text-xs text-wow-muted">Match fixed by: {customerQuery.data?.matchedBy || '—'}</p>
                      <div className="mt-3">
                        <a
                          href={`/agent/customers/${customerQuery.data?.matchedWith}/profile`}
                          className="btn-secondary text-sm"
                        >
                          View Partner Profile
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActivePanel('match-fixed')}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                    activePanel === 'match-fixed'
                      ? 'border-wow-primary bg-[#FFF5F7] text-wow-text'
                      : 'border-gray-200 bg-white text-wow-muted hover:border-wow-primary/40 hover:bg-[#FEF6F8]'
                  }`}
                >
                  Select Match Fixed action
                </button>

                {activePanel === 'match-fixed' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="partnerSearch" className="text-sm font-medium text-wow-text">Search accepted profiles</label>
                      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2">
                        <Search className="h-4 w-4 text-wow-muted" />
                        <input
                          id="partnerSearch"
                          type="text"
                          className="w-full border-0 bg-transparent text-sm text-wow-text focus:ring-0"
                          placeholder="Search by name or customer ID"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {historyQuery.isLoading ? (
                        <TableSkeleton rows={3} />
                      ) : filteredPartners.length ? (
                        filteredPartners.map((item) => (
                          <PartnerOption
                            key={item.profile.id}
                            item={item}
                            selected={item.profile.id === selectedPartnerId}
                            onSelect={() => setSelectedPartnerId(item.profile.id)}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FCF6F8] p-4 text-sm text-wow-muted">
                          No accepted profiles available for match fixing.
                        </div>
                      )}
                    </div>

                    {selectedPartner && (
                      <div className="rounded-2xl border border-wow-primary/30 bg-[#FFF5F7] p-5">
                        <p className="text-sm font-semibold text-wow-primary">Selected Partner</p>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl bg-[#FFF0F4]">
                            {selectedPartner.profile.profileImageUrl ? (
                              <img src={selectedPartner.profile.profileImageUrl} alt={selectedPartner.profile.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-lg font-semibold text-wow-primary">
                                {selectedPartner.profile.name?.slice(0, 2) || 'NA'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-wow-text">{selectedPartner.profile.name}</p>
                            <p className="mt-1 text-xs text-wow-muted">{selectedPartner.profile.customerCode || 'No ID'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={!selectedPartnerId || fixMatch.isPending}
                      onClick={handleFixMatch}
                      className="btn-primary w-full !py-3 text-sm"
                    >
                      {fixMatch.isPending ? 'Fixing...' : 'Confirm Match Fixed'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Trash2 className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-wow-text">Delete Profile</h2>
              <p className="text-sm text-wow-muted mt-1">Soft delete the customer profile while preserving historical data.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => {
                setActivePanel('delete-profile');
                setShowDeleteConfirmation(false);
              }}
              className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                activePanel === 'delete-profile'
                  ? 'border-red-300 bg-[#FFF5F7] text-wow-text'
                  : 'border-gray-200 bg-white text-wow-muted hover:border-red-300/40 hover:bg-[#FFF5F7]'
              }`}
            >
              Select Delete Profile action
            </button>

            {activePanel === 'delete-profile' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="deleteReason" className="text-sm font-medium text-wow-text">Reason</label>
                  <select
                    id="deleteReason"
                    className="input-field mt-2 w-full"
                    value={reason}
                    onChange={(event) => setReason(event.target.value as DeleteReason)}
                  >
                    {DELETE_REASONS.map((reasonOption) => (
                      <option key={reasonOption} value={reasonOption}>
                        {reasonOption}
                      </option>
                    ))}
                  </select>
                </div>

                {reason === 'Other' && (
                  <div>
                    <label htmlFor="otherReason" className="text-sm font-medium text-wow-text">Please specify</label>
                    <textarea
                      id="otherReason"
                      rows={4}
                      className="input-field mt-2 w-full resize-none"
                      value={otherReason}
                      onChange={(event) => setOtherReason(event.target.value)}
                      placeholder="Provide a reason for deletion"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="btn-secondary w-full !py-3 text-sm"
                >
                  Continue to confirmation
                </button>

                {showDeleteConfirmation && (
                  <div className="rounded-2xl border border-red-100 bg-[#FFF5F7] p-5">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700">!</span>
                      <p className="text-sm font-semibold">Are you sure you want to delete this customer profile?</p>
                    </div>
                    <p className="mt-3 text-sm text-wow-muted">
                      This action will remove the customer from all searches and matches.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(false)}
                        className="btn-secondary w-full !py-3 text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!canDelete || deleteProfile.isPending}
                        onClick={handleDeleteProfile}
                        className="btn-danger w-full !py-3 text-sm"
                      >
                        {deleteProfile.isPending ? 'Deleting...' : 'Delete Profile'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {!activePanel && (
        <div className="rounded-2xl border border-gray-200 bg-[#FCF7F8] p-6 text-sm text-wow-muted">
          Select an action above to manage customer status.
        </div>
      )}
    </div>
  );
}
