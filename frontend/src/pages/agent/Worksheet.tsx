import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
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
  StatusBadge,
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

export default function AgentWorksheet() {
  const [status, setStatus] = useState<WorksheetTaskStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTask);

  const { data, isLoading, isError } = useAgentWorksheet({
    status,
    page: 1,
    limit: 50,
  });
  const { data: customersData } = useAgentCustomers({ limit: 100, page: 1 });
  const createTask = useCreateWorksheet();
  const updateTask = useUpdateWorksheet();
  const deleteTask = useDeleteWorksheet();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        ...form,
        customerId: form.customerId || undefined,
      });
      toast.success('Task created');
      setForm(emptyTask);
      setShowForm(false);
    } catch {
      toast.error('Could not create task');
    }
  };

  const handleStatusChange = async (id: string, next: WorksheetTaskStatus) => {
    try {
      await updateTask.mutateAsync({ id, payload: { status: next } });
      toast.success('Task updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  if (isError) return <ErrorState message="Unable to load worksheet." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-wow-text">Worksheet</h1>
          <p className="text-wow-muted mt-1">Manage your daily tasks</p>
        </div>
        <button
          className="btn-primary !py-2.5 !px-4 text-sm inline-flex items-center gap-2"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Close' : 'Create Task'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-wow-muted">Title *</label>
            <input
              className="input-field mt-1"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-wow-muted">Customer</label>
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
            <label className="text-sm text-wow-muted">Priority</label>
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
            <label className="text-sm text-wow-muted">Due Date</label>
            <input
              type="date"
              className="input-field mt-1"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm text-wow-muted">Status</label>
            <select
              className="input-field mt-1"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as WorksheetTaskStatus })
              }
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-wow-muted">Description</label>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-wow-muted">Notes</label>
            <textarea
              className="input-field mt-1 min-h-[60px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary !py-2.5 !px-4 text-sm" disabled={createTask.isPending}>
              {createTask.isPending ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="mb-4">
          <select
            className="input-field max-w-xs"
            value={status}
            onChange={(e) => setStatus(e.target.value as WorksheetTaskStatus | '')}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data?.data?.length ? (
          <EmptyState
            title="No tasks yet"
            description="Create a worksheet task to track your daily work."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-left text-wow-muted border-b">
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Due</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((task) => (
                  <tr key={task.id} className="border-b border-gray-50">
                    <td className="py-3">
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-wow-muted line-clamp-1">{task.description}</p>
                      )}
                    </td>
                    <td className="py-3">{task.customerName || '—'}</td>
                    <td className="py-3">
                      <StatusBadge status={task.priority} />
                    </td>
                    <td className="py-3">{task.dueDate || '—'}</td>
                    <td className="py-3">
                      <select
                        className="input-field !py-1.5 !px-2 text-xs"
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(
                            task.id,
                            e.target.value as WorksheetTaskStatus,
                          )
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3">
                      <button
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                        onClick={() => handleDelete(task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
