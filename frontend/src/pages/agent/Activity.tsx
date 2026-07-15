import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Search,
  Download,
  Filter,
  FileText,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  UserPlus,
  Settings,
  ClipboardList,
  LogIn,
} from 'lucide-react';
import { useAgentActivity } from '../../hooks/agent/useAgent';
import { useAgentAuthStore } from '../../store/agent/agentAuthStore';
import {
  EmptyState,
  ErrorState,
  TableSkeleton,
} from '../../components/agent/AgentUI';

type ActivityTone = 'success' | 'update' | 'failed' | 'info';

function inferMeta(action: string, description: string) {
  const a = `${action} ${description}`.toLowerCase();
  let module = 'System';
  let Icon = FileText;
  let iconClass = 'bg-violet-50 text-violet-600';
  let moduleClass = 'bg-violet-50 text-violet-700';
  let tone: ActivityTone = 'success';

  if (a.includes('login') || a.includes('auth') || a.includes('sign')) {
    module = 'Auth';
    Icon = LogIn;
    iconClass = 'bg-blue-50 text-blue-600';
    moduleClass = 'bg-blue-50 text-blue-700';
    tone = 'success';
  } else if (a.includes('customer') || a.includes('client') || a.includes('lead')) {
    module = a.includes('lead') ? 'Leads' : 'Customers';
    Icon = UserPlus;
    iconClass = 'bg-emerald-50 text-emerald-600';
    moduleClass = 'bg-emerald-50 text-emerald-700';
    tone = a.includes('update') || a.includes('edit') ? 'update' : 'success';
  } else if (a.includes('event')) {
    module = 'Events';
    Icon = Calendar;
    iconClass = 'bg-violet-50 text-violet-600';
    moduleClass = 'bg-violet-50 text-violet-700';
  } else if (a.includes('worksheet') || a.includes('task')) {
    module = 'Worksheet';
    Icon = ClipboardList;
    iconClass = 'bg-pink-50 text-[#E91E63]';
    moduleClass = 'bg-pink-50 text-[#E91E63]';
    tone = 'update';
  } else if (a.includes('setting') || a.includes('profile') || a.includes('password')) {
    module = 'Profile';
    Icon = Settings;
    iconClass = 'bg-orange-50 text-orange-600';
    moduleClass = 'bg-orange-50 text-orange-700';
    tone = 'update';
  } else if (a.includes('fail') || a.includes('error') || a.includes('delete')) {
    tone = a.includes('delete') ? 'update' : 'failed';
    if (a.includes('fail') || a.includes('error')) {
      iconClass = 'bg-red-50 text-red-500';
      moduleClass = 'bg-red-50 text-red-600';
    }
  }

  if (a.includes('update') || a.includes('edit') || a.includes('chang')) {
    tone = 'update';
  }

  const activityTitle = action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return { module, Icon, iconClass, moduleClass, tone, activityTitle };
}

function statusLabel(tone: ActivityTone) {
  if (tone === 'update') return 'Update';
  if (tone === 'failed') return 'Failed';
  return 'Success';
}

function statusClass(tone: ActivityTone) {
  if (tone === 'update') return 'bg-orange-50 text-orange-600';
  if (tone === 'failed') return 'bg-red-50 text-red-600';
  return 'bg-emerald-50 text-emerald-700';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AgentActivity() {
  const user = useAgentAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 10;
  const { data, isLoading, isError } = useAgentActivity({ page, limit });

  const items = data?.data ?? [];

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${item.description} ${item.action}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (dateFrom) {
        if (new Date(item.createdAt) < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(item.createdAt) > end) return false;
      }
      return true;
    });
  }, [items, search, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = data?.total ?? filtered.length;
    let successful = 0;
    let updates = 0;
    let logins = 0;
    for (const item of items) {
      const meta = inferMeta(item.action, item.description);
      if (meta.tone === 'success') successful += 1;
      if (meta.tone === 'update') updates += 1;
      if (meta.module === 'Auth') logins += 1;
    }
    const base = items.length || 1;
    return {
      total,
      successful,
      successfulPct: Math.round((successful / base) * 100),
      updates,
      updatesPct: Math.round((updates / base) * 100),
      logins,
      loginsPct: Math.round((logins / base) * 100),
    };
  }, [data?.total, filtered.length, items]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.error('Nothing to export');
      return;
    }
    const rows = [
      ['Time', 'Activity', 'Details', 'Module', 'Performed By', 'Status'],
      ...filtered.map((item) => {
        const meta = inferMeta(item.action, item.description);
        return [
          formatTime(item.createdAt),
          meta.activityTitle,
          item.description,
          meta.module,
          user?.name || 'Agent',
          statusLabel(meta.tone),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Activity exported');
  };

  if (isError) return <ErrorState message="Unable to load activity log." />;

  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all the important activities in your account
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="outline-none bg-transparent"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="text-gray-300">-</span>
            <input
              type="date"
              className="outline-none bg-transparent"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E91E63] bg-white px-4 py-2.5 text-sm font-medium text-[#E91E63] hover:bg-pink-50 transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Activities',
            value: stats.total,
            sub: 'This Month',
            subClass: 'text-gray-400',
            icon: FileText,
            iconClass: 'bg-violet-50 text-violet-600',
          },
          {
            label: 'Successful',
            value: stats.successful,
            sub: `${stats.successfulPct}%`,
            subClass: 'text-emerald-600',
            icon: CheckCircle2,
            iconClass: 'bg-emerald-50 text-emerald-600',
          },
          {
            label: 'Updates',
            value: stats.updates,
            sub: `${stats.updatesPct}%`,
            subClass: 'text-orange-500',
            icon: AlertTriangle,
            iconClass: 'bg-orange-50 text-orange-500',
          },
          {
            label: 'Logins',
            value: stats.logins,
            sub: `${stats.loginsPct}%`,
            subClass: 'text-blue-600',
            icon: User,
            iconClass: 'bg-blue-50 text-blue-600',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className={`mt-1 text-xs font-medium ${card.subClass}`}>{card.sub}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Activities</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="w-full sm:w-64 rounded-xl border border-gray-200 pl-10 pr-3 py-2 text-sm outline-none focus:border-[#E91E63] focus:ring-2 focus:ring-[#E91E63]/15"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              onClick={() => toast('Use search and date range to filter', { icon: 'ℹ️' })}
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : !filtered.length ? (
          <div className="p-6">
            <EmptyState
              title="No activity yet"
              description="Actions like creating customers and notes will appear here."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-5 py-3.5 font-medium">Time</th>
                    <th className="px-4 py-3.5 font-medium">Activity</th>
                    <th className="px-4 py-3.5 font-medium">Details</th>
                    <th className="px-4 py-3.5 font-medium">Module</th>
                    <th className="px-4 py-3.5 font-medium">Performed By</th>
                    <th className="px-4 py-3.5 font-medium">IP Address</th>
                    <th className="px-4 py-3.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => {
                    const meta = inferMeta(item.action, item.description);
                    const Icon = meta.Icon;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60">
                        <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                          {formatTime(item.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.iconClass}`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-medium text-gray-900">
                              {meta.activityTitle}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 max-w-xs">
                          <p className="line-clamp-2">{item.description}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${meta.moduleClass}`}
                          >
                            {meta.module}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700 whitespace-nowrap">
                          {user?.name || 'Agent'}
                        </td>
                        <td className="px-4 py-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                          —
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(meta.tone)}`}
                          >
                            {statusLabel(meta.tone)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {showingFrom} to {showingTo} of {total} activities
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                  ‹
                </button>
                {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium ${
                        page === n
                          ? 'border border-[#E91E63] text-[#E91E63] bg-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}
                {totalPages > 3 && (
                  <>
                    <span className="px-1 text-gray-400">...</span>
                    <button
                      type="button"
                      onClick={() => setPage(totalPages)}
                      className={`h-8 w-8 rounded-lg text-sm font-medium border ${
                        page === totalPages
                          ? 'border-[#E91E63] text-[#E91E63]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 hover:bg-gray-50"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
