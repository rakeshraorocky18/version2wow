import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, FileText, StickyNote, Search, Plus } from 'lucide-react';
import { useAgentCustomers } from '../../hooks/agent/useAgent';
import type { AgentCustomerStatus } from '../../types/agent';
import {
  EmptyState,
  ErrorState,
  ProfileProgress,
  StatusBadge,
  TableSkeleton,
} from '../../components/agent/AgentUI';

export default function AgentCustomers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AgentCustomerStatus | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAgentCustomers({
    search: search || undefined,
    status,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  if (isError) return <ErrorState message="Unable to load customers." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-wow-text">Customers</h1>
          <p className="text-wow-muted mt-1">Customers assigned to you</p>
        </div>
        <Link to="/agent/customers/new" className="btn-primary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      <div className="card">
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-wow-muted" />
            <input
              className="input-field !pl-10"
              placeholder="Search by name, phone, email, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input-field lg:w-40"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AgentCustomerStatus | '');
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="input-field lg:w-44"
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split(':') as [
                'name' | 'date' | 'completion',
                'ASC' | 'DESC',
              ];
              setSortBy(by);
              setSortOrder(order);
            }}
          >
            <option value="date:DESC">Newest first</option>
            <option value="date:ASC">Oldest first</option>
            <option value="name:ASC">Name A–Z</option>
            <option value="name:DESC">Name Z–A</option>
            <option value="completion:DESC">Completion high</option>
            <option value="completion:ASC">Completion low</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !data?.data?.length ? (
          <EmptyState
            title="No customers found"
            description="Try adjusting filters or onboard a new customer."
            action={
              <Link to="/agent/customers/new" className="btn-primary text-sm !py-2 !px-4">
                Add Customer
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-left text-wow-muted border-b border-gray-100">
                    <th className="pb-3 font-medium">Customer ID</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Gender</th>
                    <th className="pb-3 font-medium">Completion</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Assigned</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-wow-bg/40">
                      <td className="py-3 font-mono text-xs">{c.customerCode}</td>
                      <td className="py-3 font-medium">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="py-3">{c.phone || '—'}</td>
                      <td className="py-3">{c.email || '—'}</td>
                      <td className="py-3 capitalize">{c.gender || '—'}</td>
                      <td className="py-3 w-32">
                        <ProfileProgress value={c.profileCompletion} />
                      </td>
                      <td className="py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3 text-xs text-wow-muted">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/agent/customers/${c.id}`}
                            className="p-2 rounded-lg hover:bg-white text-wow-muted hover:text-wow-primary"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/agent/customers/${c.id}?tab=personal`}
                            className="p-2 rounded-lg hover:bg-white text-wow-muted hover:text-wow-primary"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/agent/customers/${c.id}?tab=notes`}
                            className="p-2 rounded-lg hover:bg-white text-wow-muted hover:text-wow-primary"
                            title="Add Note"
                          >
                            <StickyNote className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/agent/customers/${c.id}?tab=documents`}
                            className="p-2 rounded-lg hover:bg-white text-wow-muted hover:text-wow-primary"
                            title="Documents"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-wow-muted">
                Page {data.page} of {data.totalPages} · {data.total} customers
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary !py-2 !px-3 text-sm disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="btn-secondary !py-2 !px-3 text-sm disabled:opacity-40"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
