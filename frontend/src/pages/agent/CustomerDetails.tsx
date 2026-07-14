import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Pencil, Save, Trash2, Upload } from 'lucide-react';
import {
  useAgentCustomer,
  useAgentDocuments,
  useAgentNotes,
  useUpdateCustomer,
  useUploadDocument,
  agentKeys,
} from '../../hooks/agent/useAgent';
import { agentService } from '../../services/agent/agentService';
import { useQueryClient } from '@tanstack/react-query';
import type { AgentDocumentType, AgentNote } from '../../types/agent';
import {
  EmptyState,
  ErrorState,
  ProfileProgress,
  StatusBadge,
  TableSkeleton,
} from '../../components/agent/AgentUI';

const TABS = [
  { id: 'about', label: 'About' },
  { id: 'personal', label: 'Personal Details' },
  { id: 'family', label: 'Family Details' },
  { id: 'education', label: 'Education' },
  { id: 'religion', label: 'Religion' },
  { id: 'partner', label: 'Partner Preferences' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity History' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const DOC_TYPES: { value: AgentDocumentType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'passport', label: 'Passport' },
  { value: 'horoscope', label: 'Horoscope' },
  { value: 'education_certificate', label: 'Education Certificate' },
  { value: 'income_proof', label: 'Income Proof' },
  { value: 'customer_photo', label: 'Customer Photos' },
  { value: 'other', label: 'Other' },
];

function Field({
  label,
  value,
  onChange,
  editing,
  type = 'text',
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  editing: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-wow-muted">{label}</label>
      {editing ? (
        type === 'textarea' ? (
          <textarea
            className="input-field mt-1 min-h-[90px]"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
          />
        ) : (
          <input
            type={type}
            className="input-field mt-1"
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )
      ) : (
        <p className="mt-1 font-medium text-wow-text capitalize">{value || '—'}</p>
      )}
    </div>
  );
}

export default function CustomerDetails() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as TabId) || 'about';
  const setTab = (next: TabId) => setSearchParams({ tab: next });

  const qc = useQueryClient();
  const { data: customer, isLoading, isError } = useAgentCustomer(id);
  const updateCustomer = useUpdateCustomer(id);
  const { data: notes = [], refetch: refetchNotes } = useAgentNotes(id);
  const { data: documents = [] } = useAgentDocuments(id);
  const uploadDoc = useUploadDocument(id);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<AgentNote | null>(null);
  const [docType, setDocType] = useState<AgentDocumentType>('aadhaar');
  const [activities, setActivities] = useState<
    { id: string; description: string; action: string; createdAt: string }[]
  >([]);

  useEffect(() => {
    if (customer) {
      setDraft({ ...customer });
    }
  }, [customer]);

  useEffect(() => {
    if (tab === 'activity' && id) {
      agentService.getActivity({ customerId: id, limit: 50 }).then((res) => {
        setActivities(res.data);
      });
    }
  }, [tab, id]);

  const fullName = useMemo(
    () => `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim(),
    [customer],
  );

  const save = async () => {
    try {
      await updateCustomer.mutateAsync({
        firstName: draft.firstName as string,
        lastName: draft.lastName as string,
        gender: draft.gender as string,
        dateOfBirth: draft.dateOfBirth as string,
        phone: draft.phone as string,
        email: draft.email as string,
        address: draft.address as string,
        religion: draft.religion as string,
        caste: draft.caste as string,
        motherTongue: draft.motherTongue as string,
        occupation: draft.occupation as string,
        education: draft.education as string,
        status: draft.status as never,
        personalDetails: draft.personalDetails as Record<string, unknown>,
        familyDetails: draft.familyDetails as Record<string, unknown>,
        educationDetails: draft.educationDetails as Record<string, unknown>,
        religionDetails: draft.religionDetails as Record<string, unknown>,
        partnerPreferences: draft.partnerPreferences as Record<string, unknown>,
      });
      toast.success('Customer updated');
      setEditing(false);
    } catch {
      toast.error('Update failed');
    }
  };

  const updateJsonField = (
    key:
      | 'personalDetails'
      | 'familyDetails'
      | 'educationDetails'
      | 'religionDetails'
      | 'partnerPreferences',
    field: string,
    value: string,
  ) => {
    const current = (draft[key] as Record<string, unknown>) || {};
    setDraft({ ...draft, [key]: { ...current, [field]: value } });
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    try {
      if (editingNote) {
        await agentService.updateNote(editingNote.id, noteContent);
        toast.success('Note updated');
      } else {
        await agentService.addNote(id, noteContent);
        toast.success('Note added');
      }
      setNoteContent('');
      setEditingNote(null);
      refetchNotes();
      qc.invalidateQueries({ queryKey: agentKeys.activity() });
    } catch {
      toast.error('Could not save note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await agentService.deleteNote(noteId);
      toast.success('Note deleted');
      refetchNotes();
    } catch {
      toast.error('Could not delete note');
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      await uploadDoc.mutateAsync({ type: docType, file });
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (isLoading) return <TableSkeleton rows={8} />;
  if (isError || !customer) return <ErrorState message="Customer not found." />;

  const json = (key: string) =>
    ((draft[key] as Record<string, unknown>) || {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link
            to="/agent/customers"
            className="inline-flex items-center gap-1 text-sm text-wow-muted hover:text-wow-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-wow-text">{fullName}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-wow-muted mt-1 font-mono text-sm">{customer.customerCode}</p>
          <div className="mt-4 max-w-sm">
            <ProfileProgress value={customer.profileCompletion} />
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button className="btn-secondary !py-2 !px-4 text-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button
                className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2"
                onClick={save}
                disabled={updateCustomer.isPending}
              >
                <Save className="w-4 h-4" />
                {updateCustomer.isPending ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              className="btn-primary !py-2 !px-4 text-sm inline-flex items-center gap-2"
              onClick={() => setEditing(true)}
            >
              <Pencil className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
              tab === t.id
                ? 'bg-wow-primary text-white'
                : 'bg-white text-wow-muted hover:bg-wow-bg border border-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {tab === 'about' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" value={draft.firstName as string} editing={editing} onChange={(v) => setDraft({ ...draft, firstName: v })} />
            <Field label="Last Name" value={draft.lastName as string} editing={editing} onChange={(v) => setDraft({ ...draft, lastName: v })} />
            <Field label="Phone" value={draft.phone as string} editing={editing} onChange={(v) => setDraft({ ...draft, phone: v })} />
            <Field label="Email" value={draft.email as string} editing={editing} onChange={(v) => setDraft({ ...draft, email: v })} />
            <Field label="Gender" value={draft.gender as string} editing={editing} onChange={(v) => setDraft({ ...draft, gender: v })} />
            <Field label="Date of Birth" value={draft.dateOfBirth as string} editing={editing} type="date" onChange={(v) => setDraft({ ...draft, dateOfBirth: v })} />
            <div className="sm:col-span-2">
              <Field label="Address" value={draft.address as string} editing={editing} type="textarea" onChange={(v) => setDraft({ ...draft, address: v })} />
            </div>
            {editing && (
              <div>
                <label className="text-xs text-wow-muted">Status</label>
                <select
                  className="input-field mt-1"
                  value={(draft.status as string) || 'pending'}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
        )}

        {tab === 'personal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Marital Status" value={json('personalDetails').maritalStatus} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'maritalStatus', v)} />
            <Field label="Height" value={json('personalDetails').height} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'height', v)} />
            <Field label="Weight" value={json('personalDetails').weight} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'weight', v)} />
            <Field label="Blood Group" value={json('personalDetails').bloodGroup} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'bloodGroup', v)} />
            <Field label="About" value={json('personalDetails').about} editing={editing} type="textarea" onChange={(v) => updateJsonField('personalDetails', 'about', v)} />
          </div>
        )}

        {tab === 'family' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Father's Name" value={json('familyDetails').fatherName} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'fatherName', v)} />
            <Field label="Mother's Name" value={json('familyDetails').motherName} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'motherName', v)} />
            <Field label="Family Type" value={json('familyDetails').familyType} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'familyType', v)} />
            <Field label="Family Status" value={json('familyDetails').familyStatus} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'familyStatus', v)} />
            <Field label="Siblings" value={json('familyDetails').siblings} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'siblings', v)} />
          </div>
        )}

        {tab === 'education' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Education" value={draft.education as string} editing={editing} onChange={(v) => setDraft({ ...draft, education: v })} />
            <Field label="Occupation" value={draft.occupation as string} editing={editing} onChange={(v) => setDraft({ ...draft, occupation: v })} />
            <Field label="Institution" value={json('educationDetails').institution} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'institution', v)} />
            <Field label="Income" value={json('educationDetails').income} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'income', v)} />
            <Field label="Company" value={json('educationDetails').company} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'company', v)} />
          </div>
        )}

        {tab === 'religion' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Religion" value={draft.religion as string} editing={editing} onChange={(v) => setDraft({ ...draft, religion: v })} />
            <Field label="Caste" value={draft.caste as string} editing={editing} onChange={(v) => setDraft({ ...draft, caste: v })} />
            <Field label="Mother Tongue" value={draft.motherTongue as string} editing={editing} onChange={(v) => setDraft({ ...draft, motherTongue: v })} />
            <Field label="Gothra" value={json('religionDetails').gothra} editing={editing} onChange={(v) => updateJsonField('religionDetails', 'gothra', v)} />
            <Field label="Star / Raasi" value={json('religionDetails').star} editing={editing} onChange={(v) => updateJsonField('religionDetails', 'star', v)} />
          </div>
        )}

        {tab === 'partner' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Age Range" value={json('partnerPreferences').ageRange} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'ageRange', v)} />
            <Field label="Preferred Religion" value={json('partnerPreferences').religion} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'religion', v)} />
            <Field label="Preferred Caste" value={json('partnerPreferences').caste} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'caste', v)} />
            <Field label="Education Preference" value={json('partnerPreferences').education} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'education', v)} />
            <Field label="Location Preference" value={json('partnerPreferences').location} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'location', v)} />
            <div className="sm:col-span-2">
              <Field label="Additional Notes" value={json('partnerPreferences').notes} editing={editing} type="textarea" onChange={(v) => updateJsonField('partnerPreferences', 'notes', v)} />
            </div>
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-xl bg-wow-bg/70">
              <div className="flex-1 w-full">
                <label className="text-xs text-wow-muted">Document Type</label>
                <select
                  className="input-field mt-1"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as AgentDocumentType)}
                >
                  {DOC_TYPES.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="btn-primary !py-2.5 !px-4 text-sm inline-flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {uploadDoc.isPending ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={(e) => handleUpload(e.target.files?.[0])}
                />
              </label>
            </div>

            {!documents.length ? (
              <EmptyState title="No documents yet" description="Upload KYC and profile documents for this customer." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-xl border border-gray-100 hover:border-wow-primary/40 hover:shadow-sm transition"
                  >
                    <p className="text-xs uppercase tracking-wide text-wow-muted mb-1">
                      {doc.type.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium text-sm truncate">{doc.fileName}</p>
                    <p className="text-xs text-wow-muted mt-2">
                      {new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <textarea
                className="input-field min-h-[100px]"
                placeholder="Add a note about this customer..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn-primary !py-2 !px-4 text-sm" onClick={handleAddNote}>
                  {editingNote ? 'Update Note' : 'Add Note'}
                </button>
                {editingNote && (
                  <button
                    className="btn-secondary !py-2 !px-4 text-sm"
                    onClick={() => {
                      setEditingNote(null);
                      setNoteContent('');
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {!notes.length ? (
              <EmptyState title="No notes yet" />
            ) : (
              <ul className="space-y-3">
                {notes.map((note) => (
                  <li key={note.id} className="p-4 rounded-xl bg-wow-bg/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-wow-text whitespace-pre-wrap">{note.content}</p>
                        <p className="text-xs text-wow-muted mt-2">
                          {note.agentName || 'Agent'} ·{' '}
                          {new Date(note.createdAt).toLocaleDateString()}{' '}
                          {new Date(note.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="p-2 rounded-lg hover:bg-white text-wow-muted"
                          onClick={() => {
                            setEditingNote(note);
                            setNoteContent(note.content);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-white text-red-500"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <ul className="divide-y divide-gray-100">
            {!activities.length ? (
              <EmptyState title="No activity for this customer" />
            ) : (
              activities.map((a) => (
                <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <div>
                    <p className="text-sm font-medium">{a.description}</p>
                    <p className="text-xs text-wow-muted capitalize">
                      {a.action.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <p className="text-xs text-wow-muted">
                    {new Date(a.createdAt).toLocaleString()}
                  </p>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
