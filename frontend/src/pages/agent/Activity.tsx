import { useState } from 'react';
import { useAgentActivity } from '../../hooks/agent/useAgent';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/agent/AgentUI';

export default function AgentActivity() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAgentActivity({ page, limit: 20 });

  if (isError) return <ErrorState message="Unable to load activity log." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-wow-text">Activity Log</h1>
        <p className="text-wow-muted mt-1">Every action you take is recorded here</p>
      </div>

      <div className="card">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : !data?.data?.length ? (
          <EmptyState title="No activity yet" description="Actions like creating customers and notes will appear here." />
        ) : (
          <>
            <ul className="divide-y divide-gray-100">
              {data.data.map((item) => (
                <li
                  key={item.id}
                  className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="font-medium text-wow-text">{item.description}</p>
                    <p className="text-xs text-wow-muted mt-1 capitalize">
                      {item.action.replace(/_/g, ' ')}
                      {item.customerId ? ` · Customer ${item.customerId.slice(0, 8)}…` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-wow-muted whitespace-nowrap">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-wow-muted">
                Page {data.page} of {data.totalPages}
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
