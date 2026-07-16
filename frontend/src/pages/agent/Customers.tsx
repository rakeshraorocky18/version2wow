import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { useAgentCustomers } from '../../hooks/agent/useAgent';
import type { AgentCustomerStatus } from '../../types/agent';
import CustomerCard  from '../../components/agent/CustomerCard';
import { EmptyState, TableSkeleton } from '../../components/agent/AgentUI';

export default function AgentCustomers() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AgentCustomerStatus | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'completion'>('date');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching, refetch } = useAgentCustomers({
    search: search || undefined,
    // Omit empty status — never send status="" to the API
    status: status || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  if (isError) {
    return (
      <div className="space-y-6">
        <CustomersHeader />
        <div className="card border-red-100 bg-red-50 text-center py-10">
          <p className="text-red-700 font-medium mb-4">Unable to load customers.</p>
          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomersHeader />

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
            title="No customers found."
            description="Create your first customer to start managing your relationships."
            action={
              <Link
                to="/agent/add-customer"
                className="btn-primary text-sm !py-2 !px-4 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Customer
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.data.map((c) => (
                  <CustomerCard key={c.id} customer={c} />
                ))}
              </div>
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

function CustomersHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl text-wow-text">Customers</h1>
        <p className="text-wow-muted mt-1">Customers assigned to you</p>
      </div>
      <Link
        to="/agent/add-customer"
        className="btn-primary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm"
      >
        <Plus className="w-4 h-4" /> Add Customer
      </Link>
    </div>
  );
}
