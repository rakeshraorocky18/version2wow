import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Pencil,
  Save,
  Trash2,
  Upload,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  ClipboardList,
  FileText,
  MessageSquare,
  User,
  Check,
  MoreVertical,
  Plus,
  Clock
} from 'lucide-react';
import {
  useAgentCustomer,
  useAgentDocuments,
  useAgentNotes,
  useUpdateCustomer,
  useUploadDocument,
  agentKeys,
  useAgentCustomers,
  useAgentWorksheet,
  useCreateWorksheet,
  useUpdateWorksheet,
  useDeleteWorksheet,
} from '../../hooks/agent/useAgent';
import { getMaxDateOfBirth } from '../../lib/dateUtils';
import { agentService } from '../../services/agent/agentService';
import { useQueryClient } from '@tanstack/react-query';
import type { AgentDocumentType, AgentNote, WorksheetTask, WorksheetPriority } from '../../types/agent';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/agent/AgentUI';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

const PROFILE_TABS = [
  { id: 'about', label: 'About' },
  { id: 'personal', label: 'Personal Details' },
  { id: 'family', label: 'Family Details' },
  { id: 'education', label: 'Education' },
  { id: 'religion', label: 'Religion' },
  { id: 'partner', label: 'Partner Preferences' },
] as const;

type ProfileTabId = (typeof PROFILE_TABS)[number]['id'];

const DOC_TYPES: { value: AgentDocumentType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan', label: 'PAN' },
  { value: 'passport', label: 'Passport' },
  { value: 'horoscope', label: 'Horoscope' },
  { value: 'education_certificate', label: 'Education Certificate' },
  { value: 'income_proof', label: 'Income Proof' },
  { value: 'customer_photo', label: 'Gallery Photos' },
  { value: 'profile_photo', label: 'Profile Photo' },
  { value: 'other', label: 'Other' },
];

function Field({
  label,
  value,
  onChange,
  editing,
  type = 'text',
  max,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  editing: boolean;
  type?: string;
  max?: string;
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
            max={max}
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
  const { customerId = '', id = '' } = useParams();
  const resolvedId = customerId || id;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAgentAuthStore((s) => s.user);

  // Parse unified tabs
  const tab = searchParams.get('tab') || 'overview';
  const isProfileSubTab = PROFILE_TABS.map(t => t.id).includes(tab as ProfileTabId);
  const mainTab = isProfileSubTab ? 'overview' : tab;
  const profileSubTab = isProfileSubTab ? (tab as ProfileTabId) : 'about';

  const setMainTab = (next: string) => setSearchParams({ tab: next });
  const setProfileSubTab = (next: ProfileTabId) => setSearchParams({ tab: next });

  const qc = useQueryClient();
  const { data: customer, isLoading, isError } = useAgentCustomer(resolvedId);
  const updateCustomer = useUpdateCustomer(resolvedId);
  const { data: notes = [], refetch: refetchNotes } = useAgentNotes(resolvedId);
  const { data: documents = [] } = useAgentDocuments(resolvedId);
  const uploadDoc = useUploadDocument(resolvedId);

  // Left sidebar customers query
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  const { data: customersData, isLoading: customersLoading } = useAgentCustomers({
    search: customerSearch || undefined,
    page: customerPage,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
  });

  const totalCustomerPages = customersData?.totalPages ?? 1;
  const customersList = customersData?.data ?? [];

  // Worksheet tasks query and mutations
  const { data: worksheetData, refetch: refetchWorksheet } = useAgentWorksheet({ limit: 100 });
  const createWorksheet = useCreateWorksheet();
  const updateWorksheet = useUpdateWorksheet();
  const deleteWorksheet = useDeleteWorksheet();

  const customerTasks = useMemo(() => {
    return worksheetData?.data.filter((t) => t.customerId === resolvedId) || [];
  }, [worksheetData, resolvedId]);

  // Tasks creation form states
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<WorksheetPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [noteContent, setNoteContent] = useState('');
  const [editingNote, setEditingNote] = useState<AgentNote | null>(null);
  const [docType, setDocType] = useState<AgentDocumentType>('aadhaar');

  // Customer activity log local query and dates
  const [activities, setActivities] = useState<
    { id: string; description: string; action: string; createdAt: string }[]
  >([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  useEffect(() => {
    if (customer) {
      setDraft({ ...customer });
    }
  }, [customer]);

  useEffect(() => {
    if (resolvedId) {
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    }
  }, [resolvedId]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        if (!act.description.toLowerCase().includes(q) && !act.action.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (dateFrom) {
        if (new Date(act.createdAt) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(act.createdAt) > end) return false;
      }
      return true;
    });
  }, [activities, activitySearch, dateFrom, dateTo]);

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
        await agentService.addNote(resolvedId, noteContent);
        toast.success('Note added');
      }
      setNoteContent('');
      setEditingNote(null);
      refetchNotes();
      qc.invalidateQueries({ queryKey: agentKeys.activity() });
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Could not save note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await agentService.deleteNote(noteId);
      toast.success('Note deleted');
      refetchNotes();
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Could not delete note');
    }
  };

  const handleUpload = async (file?: File | null) => {
    if (!file) return;
    try {
      await uploadDoc.mutateAsync({ type: docType, file });
      toast.success('Document uploaded');
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Upload failed');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createWorksheet.mutateAsync({
        customerId: resolvedId,
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        dueDate: newTaskDueDate || undefined,
        status: 'pending',
      });
      toast.success('Task created');
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
      setNewTaskPriority('medium');
      setShowAddTask(false);
      refetchWorksheet();
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Failed to create task');
    }
  };

  const handleToggleTaskStatus = async (task: WorksheetTask) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await updateWorksheet.mutateAsync({
        id: task.id,
        payload: { status: nextStatus },
      });
      toast.success(nextStatus === 'completed' ? 'Task completed' : 'Task marked pending');
      refetchWorksheet();
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteWorksheet.mutateAsync(taskId);
      toast.success('Task deleted');
      refetchWorksheet();
      // Update activity log counts
      agentService.getActivity({ customerId: resolvedId, limit: 100 }).then((res) => {
        setActivities(res.data || []);
      });
    } catch {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) return <TableSkeleton rows={8} />;
  if (isError || !customer) return <ErrorState message="Customer not found." />;

  const json = (key: string) =>
    ((draft[key] as Record<string, unknown>) || {}) as Record<string, string>;

  // Customer activity event-related items
  const eventActivities = activities.filter(
    (a) => a.action.toLowerCase().includes('event') || a.description.toLowerCase().includes('event')
  );

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'activity', label: 'Activity Log' },
    { id: 'events', label: `Events (${eventActivities.length})` },
    { id: 'tasks', label: `Tasks (${customerTasks.length})` },
    { id: 'notes', label: `Notes (${notes.length})` },
    { id: 'documents', label: `Documents (${documents.length})` },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-100px)] bg-white p-4 md:p-6 rounded-3xl border border-gray-100">
      
      {/* 1. Left Sidebar: All Customers */}
      <div className="w-full lg:w-76 shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 pb-6 lg:pb-0 lg:pr-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-display">All Customers</h2>
          <span className="bg-pink-100 text-wow-primary px-2 py-0.5 rounded-full text-xs font-semibold">
            {customersData?.total || 0}
          </span>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-wow-primary"
            placeholder="Search customers..."
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCustomerPage(1);
            }}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {customersLoading ? (
          <div className="space-y-2 py-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] lg:max-h-[500px] pr-1">
            {customersList.map((c) => {
              const isSelected = c.id === resolvedId;
              const cName = `${c.firstName} ${c.lastName || ''}`.trim();
              const initials = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || 'C';
              
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/agent/customers/${c.id}/manage?tab=${mainTab}`)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-wow-primary bg-pink-50/40 text-wow-primary'
                      : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                      isSelected ? 'bg-wow-primary text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate max-w-[150px]">{cName}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{c.phone || 'No phone'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Last Activity: {new Date(c.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-wow-primary' : 'text-gray-300'}`} />
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <button
            disabled={customerPage <= 1}
            onClick={() => setCustomerPage(p => Math.max(1, p - 1))}
            className="p-1 px-2.5 text-[11px] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-[11px] text-gray-500">
            Page {customerPage} of {totalCustomerPages}
          </span>
          <button
            disabled={customerPage >= totalCustomerPages}
            onClick={() => setCustomerPage(p => p + 1)}
            className="p-1 px-2.5 text-[11px] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* 2. Right Detail Workspace */}
      <div className="flex-1 min-w-0 flex flex-col gap-6 lg:pl-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/agent/customers" className="hover:text-wow-primary">Customers</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">Activity Log</span>
        </div>

        {/* Customer Header Card */}
        <div className="bg-white rounded-2xl p-5 border border-gray-150 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 text-wow-primary font-bold text-xl flex items-center justify-center shrink-0">
              {`${customer.firstName?.[0] || ''}${customer.lastName?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl text-gray-900 font-bold leading-tight">
                  {fullName}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                  customer.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {customer.status}
                </span>
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{customer.customerCode}</p>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" /> {customer.gender || '—'}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Joined: {new Date(customer.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0">
            {/* Quick stats boxes */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-2.5 text-center min-w-[70px]">
                <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  Events
                </p>
                <p className="text-base font-bold text-indigo-700 mt-0.5">
                  {eventActivities.length}
                </p>
              </div>
              
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-2.5 text-center min-w-[70px]">
                <p className="text-[10px] text-teal-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  Tasks
                </p>
                <p className="text-base font-bold text-teal-700 mt-0.5">
                  {customerTasks.length}
                </p>
              </div>

              <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-2.5 text-center min-w-[70px]">
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  Notes
                </p>
                <p className="text-base font-bold text-orange-700 mt-0.5">
                  {notes.length}
                </p>
              </div>

              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2.5 text-center min-w-[70px]">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  Docs
                </p>
                <p className="text-base font-bold text-emerald-700 mt-0.5">
                  {documents.length}
                </p>
              </div>
            </div>

            <Link
              to={`/agent/customers/${resolvedId}/profile`}
              className="btn-primary !py-1.5 !px-3.5 text-xs font-semibold bg-wow-primary hover:bg-[#D81B60] text-white shadow-sm rounded-lg"
            >
              View Customer Profile
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = mainTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`px-4 py-2.5 text-sm font-semibold transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-wow-primary text-wow-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="flex-1 bg-white">
          
          {/* A. OVERVIEW TAB */}
          {mainTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                {PROFILE_TABS.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setProfileSubTab(pt.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                      profileSubTab === pt.id
                        ? 'bg-wow-primary text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                {profileSubTab === 'about' && (
                  <>
                    <Field label="First Name" value={draft.firstName as string} editing={editing} onChange={(v) => setDraft({ ...draft, firstName: v })} />
                    <Field label="Last Name" value={draft.lastName as string} editing={editing} onChange={(v) => setDraft({ ...draft, lastName: v })} />
                    <Field label="Phone" value={draft.phone as string} editing={editing} onChange={(v) => setDraft({ ...draft, phone: v })} />
                    <Field label="Email" value={draft.email as string} editing={editing} onChange={(v) => setDraft({ ...draft, email: v })} />
                    <Field label="Gender" value={draft.gender as string} editing={editing} onChange={(v) => setDraft({ ...draft, gender: v })} />
                    <Field
                      label="Date of Birth"
                      value={draft.dateOfBirth as string}
                      editing={editing}
                      type="date"
                      onChange={(v) => setDraft({ ...draft, dateOfBirth: v })}
                      max={getMaxDateOfBirth(18)}
                    />
                    <div className="sm:col-span-2">
                      <Field label="Address" value={draft.address as string} editing={editing} type="textarea" onChange={(v) => setDraft({ ...draft, address: v })} />
                    </div>
                    {editing && (
                      <div>
                        <label className="text-xs text-wow-muted block font-semibold mb-1">Status</label>
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
                  </>
                )}

                {profileSubTab === 'personal' && (
                  <>
                    <Field label="Marital Status" value={json('personalDetails').maritalStatus} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'maritalStatus', v)} />
                    <Field label="Height" value={json('personalDetails').height} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'height', v)} />
                    <Field label="Weight" value={json('personalDetails').weight} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'weight', v)} />
                    <Field label="Blood Group" value={json('personalDetails').bloodGroup} editing={editing} onChange={(v) => updateJsonField('personalDetails', 'bloodGroup', v)} />
                    <div className="sm:col-span-2">
                      <Field label="About" value={json('personalDetails').about} editing={editing} type="textarea" onChange={(v) => updateJsonField('personalDetails', 'about', v)} />
                    </div>
                  </>
                )}

                {profileSubTab === 'family' && (
                  <>
                    <Field label="Father's Name" value={json('familyDetails').fatherName} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'fatherName', v)} />
                    <Field label="Mother's Name" value={json('familyDetails').motherName} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'motherName', v)} />
                    <Field label="Family Type" value={json('familyDetails').familyType} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'familyType', v)} />
                    <Field label="Family Status" value={json('familyDetails').familyStatus} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'familyStatus', v)} />
                    <Field label="Siblings" value={json('familyDetails').siblings} editing={editing} onChange={(v) => updateJsonField('familyDetails', 'siblings', v)} />
                  </>
                )}

                {profileSubTab === 'education' && (
                  <>
                    <Field label="Education" value={draft.education as string} editing={editing} onChange={(v) => setDraft({ ...draft, education: v })} />
                    <Field label="Occupation" value={draft.occupation as string} editing={editing} onChange={(v) => setDraft({ ...draft, occupation: v })} />
                    <Field label="Institution" value={json('educationDetails').institution} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'institution', v)} />
                    <Field label="Income" value={json('educationDetails').income} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'income', v)} />
                    <Field label="Company" value={json('educationDetails').company} editing={editing} onChange={(v) => updateJsonField('educationDetails', 'company', v)} />
                  </>
                )}

                {profileSubTab === 'religion' && (
                  <>
                    <Field label="Religion" value={draft.religion as string} editing={editing} onChange={(v) => setDraft({ ...draft, religion: v })} />
                    <Field label="Caste" value={draft.caste as string} editing={editing} onChange={(v) => setDraft({ ...draft, caste: v })} />
                    <Field label="Mother Tongue" value={draft.motherTongue as string} editing={editing} onChange={(v) => setDraft({ ...draft, motherTongue: v })} />
                    <Field label="Gothra" value={json('religionDetails').gothra} editing={editing} onChange={(v) => updateJsonField('religionDetails', 'gothra', v)} />
                    <Field label="Star / Raasi" value={json('religionDetails').star} editing={editing} onChange={(v) => updateJsonField('religionDetails', 'star', v)} />
                  </>
                )}

                {profileSubTab === 'partner' && (
                  <>
                    <Field label="Age Range" value={json('partnerPreferences').ageRange} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'ageRange', v)} />
                    <Field label="Preferred Religion" value={json('partnerPreferences').religion} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'religion', v)} />
                    <Field label="Preferred Caste" value={json('partnerPreferences').caste} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'caste', v)} />
                    <Field label="Education Preference" value={json('partnerPreferences').education} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'education', v)} />
                    <Field label="Location Preference" value={json('partnerPreferences').location} editing={editing} onChange={(v) => updateJsonField('partnerPreferences', 'location', v)} />
                    <div className="sm:col-span-2">
                      <Field label="Additional Notes" value={json('partnerPreferences').notes} editing={editing} type="textarea" onChange={(v) => updateJsonField('partnerPreferences', 'notes', v)} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {editing ? (
                  <>
                    <button className="btn-secondary !py-2 !px-4 text-xs font-semibold rounded-lg" onClick={() => setEditing(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn-primary !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-2 rounded-lg bg-wow-primary text-white"
                      onClick={save}
                      disabled={updateCustomer.isPending}
                    >
                      <Save className="w-4 h-4" />
                      {updateCustomer.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    className="btn-primary !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-2 rounded-lg bg-wow-primary text-white"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="w-4 h-4" /> Edit Profile Details
                  </button>
                )}
              </div>
            </div>
          )}

          {/* B. ACTIVITY LOG TIMELINE TAB */}
          {mainTab === 'activity' && (
            <div className="space-y-6">
              
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-semibold text-base text-gray-900">Activity History</h3>
                  <p className="text-xs text-gray-500">Track and filter this customer's lifecycle and updates</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="date"
                      className="outline-none bg-transparent text-[11px]"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                    <span className="text-gray-300">-</span>
                    <input
                      type="date"
                      className="outline-none bg-transparent text-[11px]"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                  
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-1 focus:ring-wow-primary w-40"
                      placeholder="Search..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Timeline list */}
              {!filteredActivities.length ? (
                <EmptyState title="No activities found" description="Activity log updates will appear as customer changes are made." />
              ) : (
                <div className="relative pl-6 border-l border-gray-200 ml-4 space-y-8 py-2">
                  {filteredActivities.map((act) => {
                    const actLower = act.action.toLowerCase();
                    const descLower = act.description.toLowerCase();
                    let Icon = Clock;
                    let iconColor = 'bg-violet-100 text-violet-600 border-violet-200';
                    let category = 'Update';
                    let categoryColor = 'bg-violet-50 text-violet-700 border-violet-100';

                    if (actLower.includes('customer_created')) {
                      Icon = User;
                      iconColor = 'bg-pink-100 text-pink-600 border-pink-200';
                      category = 'Customer';
                      categoryColor = 'bg-pink-50 text-pink-700 border-pink-100';
                    } else if (actLower.includes('worksheet_completed')) {
                      Icon = Check;
                      iconColor = 'bg-emerald-100 text-emerald-600 border-emerald-200';
                      category = 'Task';
                      categoryColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    } else if (actLower.includes('worksheet') || actLower.includes('task')) {
                      Icon = ClipboardList;
                      iconColor = 'bg-teal-100 text-teal-600 border-teal-200';
                      category = 'Task';
                      categoryColor = 'bg-teal-50 text-teal-700 border-teal-100';
                    } else if (actLower.includes('note')) {
                      Icon = MessageSquare;
                      iconColor = 'bg-orange-100 text-orange-600 border-orange-200';
                      category = 'Note';
                      categoryColor = 'bg-orange-50 text-orange-700 border-orange-100';
                    } else if (actLower.includes('document')) {
                      Icon = FileText;
                      iconColor = 'bg-blue-100 text-blue-600 border-blue-200';
                      category = 'Document';
                      categoryColor = 'bg-blue-50 text-blue-700 border-blue-100';
                    } else if (actLower.includes('event') || descLower.includes('event')) {
                      Icon = Calendar;
                      iconColor = 'bg-purple-100 text-purple-600 border-purple-200';
                      category = 'Event';
                      categoryColor = 'bg-purple-50 text-purple-700 border-purple-100';
                    }

                    const displayTitle = act.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

                    return (
                      <div key={act.id} className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        
                        {/* Circle Node */}
                        <div className={`absolute -left-[38px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0 ${iconColor}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm text-gray-900">{displayTitle}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider ${categoryColor}`}>
                              {category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 max-w-xl">{act.description}</p>
                          
                          {/* Agent user tag */}
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full bg-pink-100 text-wow-primary flex items-center justify-center text-[9px] font-bold">
                              {user?.firstName?.[0] || 'A'}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {user?.name || 'Agent'}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right whitespace-nowrap text-xs text-gray-400 shrink-0">
                          <p>{new Date(act.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="mt-0.5">{new Date(act.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* C. EVENTS LOG TAB */}
          {mainTab === 'events' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-base text-gray-900">Events Log</h3>
              </div>
              
              {!eventActivities.length ? (
                <EmptyState title="No events recorded" description="Events related to bookings and status will appear here." />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {eventActivities.map((e) => (
                    <div key={e.id} className="p-4 rounded-xl border border-gray-150 bg-gray-50/30 flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {e.action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{e.description}</p>
                          <p className="text-[10px] text-gray-400 mt-2">Logged by: {user?.name || 'Agent'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">
                        {new Date(e.createdAt).toLocaleDateString()} {new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* D. TASKS TAB */}
          {mainTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-semibold text-base text-gray-900">Worksheet Tasks</h3>
                <button
                  onClick={() => setShowAddTask(v => !v)}
                  className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 bg-wow-primary text-white rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> New Task
                </button>
              </div>

              {showAddTask && (
                <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-wow-primary">Create New Customer Task</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Task Title*</label>
                      <input
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-wow-primary"
                        placeholder="e.g. Call client for PAN details"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-wow-primary"
                        value={newTaskDueDate}
                        onChange={e => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-wow-primary min-h-[60px]"
                        placeholder="Additional details..."
                        value={newTaskDesc}
                        onChange={e => setNewTaskDesc(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold block mb-1">Priority</label>
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-wow-primary bg-white"
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value as WorksheetPriority)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                    <button
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border hover:bg-gray-100"
                      onClick={() => setShowAddTask(false)}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!newTaskTitle.trim() || createWorksheet.isPending}
                      className="btn-primary !py-1.5 !px-3 text-xs bg-wow-primary text-white rounded-lg disabled:opacity-40"
                      onClick={handleAddTask}
                    >
                      {createWorksheet.isPending ? 'Creating...' : 'Create Task'}
                    </button>
                  </div>
                </div>
              )}

              {!customerTasks.length ? (
                <EmptyState title="No tasks assigned" description="Assign tasks to structure matching and verification worksheet pipelines." />
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {customerTasks.map((t) => {
                    const isCompleted = t.status === 'completed';
                    return (
                      <div key={t.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                        isCompleted ? 'border-gray-200 bg-gray-50/50' : 'border-gray-150 hover:border-teal-200 hover:shadow-sm'
                      }`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleTaskStatus(t)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                              isCompleted ? 'border-wow-primary bg-wow-primary text-white' : 'border-gray-300 hover:border-wow-primary'
                            }`}
                          >
                            {isCompleted && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <p className={`text-sm font-semibold text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                              {t.title}
                            </p>
                            {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                t.priority === 'high' ? 'bg-red-50 text-red-700' : t.priority === 'medium' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {t.priority}
                              </span>
                              {t.dueDate && (
                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" /> Due: {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* E. NOTES TAB */}
          {mainTab === 'notes' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <textarea
                  className="input-field min-h-[90px] text-sm"
                  placeholder="Add a note about this customer..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <div className="flex gap-2">
                  <button className="btn-primary !py-2 !px-4 text-xs font-semibold bg-wow-primary text-white rounded-lg" onClick={handleAddNote}>
                    {editingNote ? 'Update Note' : 'Add Note'}
                  </button>
                  {editingNote && (
                    <button
                      className="btn-secondary !py-2 !px-4 text-xs font-semibold border rounded-lg hover:bg-gray-50"
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
                <EmptyState title="No notes yet" description="Record important background information and discussion details here." />
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="p-4 rounded-xl border border-gray-150 bg-gray-50/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                          <p className="text-[10px] text-gray-400 mt-2 font-medium">
                            {note.agentName || 'Agent'} ·{' '}
                            {new Date(note.createdAt).toLocaleDateString()}{' '}
                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-wow-primary transition"
                            onClick={() => {
                              setEditingNote(note);
                              setNoteContent(note.content);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-red-500 transition"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* F. DOCUMENTS TAB */}
          {mainTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-xl bg-gray-50 border border-gray-150">
                <div className="flex-1 w-full">
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">Document Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white outline-none focus:border-wow-primary"
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
                <label className="btn-primary !py-2 !px-4 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer bg-wow-primary text-white rounded-lg shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadDoc.isPending ? 'Uploading...' : 'Upload File'}
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,image/*"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                </label>
              </div>

              {!documents.length ? (
                <EmptyState title="No documents yet" description="Upload KYC verification papers, horoscope PDFs, or gallery photographs." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-4 rounded-xl border border-gray-150 bg-white hover:border-wow-primary/40 hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-wow-primary mb-1">
                          {doc.type.replace(/_/g, ' ')}
                        </p>
                        <p className="font-semibold text-sm text-gray-800 truncate">{doc.fileName}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-4">
                        Uploaded on: {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

