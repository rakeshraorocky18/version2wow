import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  ClipboardList,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pencil,
  MoreVertical,
  Upload,
  Clock,
} from 'lucide-react';
import {
  useAgentCustomers,
  useAgentWorksheet,
  useCreateWorksheet,
  useDeleteWorksheet,
  useUpdateWorksheet,
} from '../../hooks/agent/useAgent';
import type { WorksheetPriority, WorksheetTaskStatus } from '../../types/agent';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/agent/AgentUI';

const emptyTask = {
  title: '',
  description: '',
  customerId: '',
  priority: 'medium' as WorksheetPriority,
  dueDate: new Date().toISOString().slice(0, 10),
  status: 'pending' as WorksheetTaskStatus,
  notes: '',
};

type TabKey = 'my' | 'all' | 'archived';

function progressForStatus(status: WorksheetTaskStatus) {
  if (status === 'completed') return 100;
  if (status === 'in_progress') return 55;
  if (status === 'cancelled') return 0;
  return 10;
}

function statusLabel(status: WorksheetTaskStatus) {
  if (status === 'pending') return 'Not Started';
  if (status === 'in_progress') return 'In Progress';
  if (status === 'completed') return 'Completed';
  return 'Cancelled';
}

function priorityStyles(priority: WorksheetPriority) {
  if (priority === 'high') return 'bg-pink-50 text-[#E91E63]';
  if (priority === 'medium') return 'bg-blue-50 text-blue-600';
  return 'bg-emerald-50 text-emerald-600';
}

function statusStyles(status: WorksheetTaskStatus) {
  if (status === 'in_progress') return 'bg-amber-50 text-amber-700';
  if (status === 'completed') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-red-50 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

function progressBarColor(status: WorksheetTaskStatus, priority: WorksheetPriority) {
  if (status === 'completed') return 'bg-emerald-500';
  if (priority === 'high') return 'bg-[#E91E63]';
  if (priority === 'medium') return 'bg-blue-500';
  return 'bg-emerald-400';
}

function formatDue(dueDate?: string) {
  if (!dueDate) return { date: '—', relative: '', tone: 'text-gray-400' };
  const due = new Date(dueDate);
  const date = due.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cmp = new Date(due);
  cmp.setHours(0, 0, 0, 0);
  const diff = Math.round((cmp.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return { date, relative: `${Math.abs(diff)} day${Math.abs(diff) === 1 ? '' : 's'} overdue`, tone: 'text-red-500' };
  if (diff === 0) return { date, relative: 'Due today', tone: 'text-amber-600' };
  return { date, relative: `${diff} day${diff === 1 ? '' : 's'} left`, tone: 'text-amber-600' };
}

function taskCode(_id: string, index: number) {
  return `WS-${String(index + 1).padStart(4, '0')}`;
}

export default function AgentWorksheet() {
  const [tab, setTab] = useState<TabKey>('my');
  const [status, setStatus] = useState<WorksheetTaskStatus | ''>('');
  const [priority, setPriority] = useState<WorksheetPriority | ''>('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTask);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data, isLoading, isError } = useAgentWorksheet({
    status: '',
    page: 1,
    limit: 100,
  });
  const { data: customersData } = useAgentCustomers({ limit: 100, page: 1 });
  const createTask = useCreateWorksheet();
  const updateTask = useUpdateWorksheet();
  const deleteTask = useDeleteWorksheet();

  const tasks = data?.data ?? [];

  const stats = useMemo(() => {
    const total = tasks.filter((t) => t.status !== 'cancelled').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const overdue = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed' || t.status === 'cancelled') return false;
      return new Date(t.dueDate) < new Date(new Date().toDateString());
    }).length;
    return { total, inProgress, completed, overdue };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      if (tab === 'archived' && task.status !== 'cancelled') return false;
      if (tab !== 'archived' && task.status === 'cancelled') return false;
      if (status && task.status !== status) return false;
      if (priority && task.priority !== priority) return false;
      if (customerFilter && task.customerId !== customerFilter) return false;
      if (dateFilter && task.dueDate !== dateFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${task.title} ${task.description ?? ''} ${task.customerName ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, tab, status, priority, customerFilter, dateFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        ...form,
        customerId: form.customerId || undefined,
      });
      toast.success('Worksheet created');
      setForm(emptyTask);
      setShowForm(false);
    } catch {
      toast.error('Could not create worksheet');
    }
  };

  const handleStatusChange = async (id: string, next: WorksheetTaskStatus) => {
    try {
      await updateTask.mutateAsync({ id, payload: { status: next } });
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (isError) return <ErrorState message="Unable to load worksheet." />;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'my', label: 'My Worksheet' },
    { key: 'all', label: 'All Worksheets' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="space-y-6">
      {/* Title row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-[#E91E63]">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Worksheet</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage customer interactions, tasks and follow-ups
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toast('Import coming soon', { icon: 'ℹ️' })}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E91E63] bg-white px-4 py-2.5 text-sm font-medium text-[#E91E63] hover:bg-pink-50 transition"
          >
            <Upload className="w-4 h-4" />
            Import Worksheet
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E91E63] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d81b60] shadow-sm transition"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Close' : 'New Worksheet'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
              setPage(1);
            }}
            className={`relative pb-3 text-sm font-medium transition ${
              tab === t.key ? 'text-[#E91E63]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[#E91E63]" />
            )}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Worksheets',
            value: stats.total,
            icon: ClipboardList,
            iconClass: 'bg-pink-50 text-[#E91E63]',
          },
          {
            label: 'In Progress',
            value: stats.inProgress,
            icon: Clock,
            iconClass: 'bg-amber-50 text-amber-600',
          },
          {
            label: 'Completed',
            value: stats.completed,
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Overdue',
            value: stats.overdue,
            icon: AlertTriangle,
            iconClass: 'bg-red-50 text-red-500',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-500">Title *</label>
            <input
              className="input-field mt-1"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Customer</label>
            <select
              className="input-field mt-1"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">None</option>
              {(customersData?.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.customerCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Priority</label>
            <select
              className="input-field mt-1"
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: e.target.value as WorksheetPriority })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-500">Due Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Status</label>
            <select
              className="input-field mt-1"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as WorksheetTaskStatus })
              }
            >
              <option value="pending">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-gray-500">Description</label>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-[#E91E63] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d81b60]"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? 'Saving...' : 'Save Worksheet'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/15"
              placeholder="Search worksheet by name, customer..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 bg-white"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as WorksheetTaskStatus | '');
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="pending">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 bg-white"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value as WorksheetPriority | '');
              setPage(1);
            }}
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 bg-white"
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Customers</option>
            {(customersData?.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="rounded-xl border border-gray-200 pl-10 pr-3 py-2.5 text-sm text-gray-600"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton />
          </div>
        ) : !filtered.length ? (
          <div className="p-6">
            <EmptyState
              title="No worksheets yet"
              description="Create a worksheet to track customer follow-ups."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[980px]">
                <thead>
                  <tr className="bg-gray-50/80 text-left text-gray-500">
                    <th className="px-5 py-3.5 font-medium">Worksheet Name</th>
                    <th className="px-4 py-3.5 font-medium">Customer</th>
                    <th className="px-4 py-3.5 font-medium">Priority</th>
                    <th className="px-4 py-3.5 font-medium">Tasks</th>
                    <th className="px-4 py-3.5 font-medium">Progress</th>
                    <th className="px-4 py-3.5 font-medium">Due Date</th>
                    <th className="px-4 py-3.5 font-medium">Status</th>
                    <th className="px-4 py-3.5 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((task, i) => {
                    const progress = progressForStatus(task.status);
                    const due = formatDue(task.dueDate);
                    const globalIndex = (pageSafe - 1) * pageSize + i;
                    return (
                      <tr
                        key={task.id}
                        className={globalIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                task.priority === 'high'
                                  ? 'bg-pink-50 text-[#E91E63]'
                                  : task.priority === 'medium'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              <ClipboardList className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-gray-900">{task.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {taskCode(task.id, globalIndex)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800">
                            {task.customerName || '—'}
                          </p>
                          {task.customerId && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              CUST-{task.customerId.slice(0, 4).toUpperCase()}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${priorityStyles(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700">
                          {task.status === 'completed' ? '1 / 1' : task.status === 'in_progress' ? '1 / 2' : '0 / 1'}
                        </td>
                        <td className="px-4 py-4 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressBarColor(task.status, task.priority)}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-8">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-800">{due.date}</p>
                          <p className={`text-xs mt-0.5 ${due.tone}`}>
                            {task.status === 'completed' ? 'Completed' : due.relative}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer outline-none ${statusStyles(task.status)}`}
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(
                                task.id,
                                e.target.value as WorksheetTaskStatus,
                              )
                            }
                          >
                            <option value="pending">{statusLabel('pending')}</option>
                            <option value="in_progress">{statusLabel('in_progress')}</option>
                            <option value="completed">{statusLabel('completed')}</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-gray-400">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-700"
                              title="View"
                              onClick={() => toast(task.description || task.title)}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-700"
                              title="Edit"
                              onClick={() => {
                                setForm({
                                  title: task.title,
                                  description: task.description || '',
                                  customerId: task.customerId || '',
                                  priority: task.priority,
                                  dueDate: task.dueDate || emptyTask.dueDate,
                                  status: task.status,
                                  notes: task.notes || '',
                                });
                                setShowForm(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500"
                              title="Delete"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-700"
                              title="More"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(pageSafe - 1) * pageSize + 1} to{' '}
                {Math.min(pageSafe * pageSize, filtered.length)} of {filtered.length}{' '}
                worksheets
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="h-8 w-8 rounded-lg bg-[#E91E63] text-white text-sm font-medium"
                >
                  {pageSafe}
                </button>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                  ›
                </button>
                <button
                  type="button"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage(totalPages)}
                  className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                  »
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
