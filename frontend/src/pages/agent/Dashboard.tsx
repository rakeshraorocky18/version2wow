import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Clock,
  ClipboardList,
  AlertTriangle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAgentDashboard } from '../../hooks/agent/useAgent';
import { getCustomerProfileImageUrl } from '../../lib/agent/customerAvatar';
import {
  EmptyState,
  ErrorState,
  StatCardSkeleton,
  StatusBadge,
} from '../../components/agent/AgentUI';
import CustomerAvatar from '../../components/agent/CustomerAvatar';

export default function AgentDashboard() {
  const { data, isLoading, isError } = useAgentDashboard();

  if (isError) return <ErrorState message="Unable to load dashboard." />;

  const stats = [
    {
      title: 'Total Customers',
      value: data?.totalCustomers ?? 0,
      icon: Users,
      tone: 'from-wow-primary/20 to-wow-primary/5',
      iconTone: 'bg-rose-100 text-wow-primary',
      path: '/agent/customers',
    },
    {
      title: 'Active Customers',
      value: data?.activeCustomers ?? 0,
      icon: UserCheck,
      tone: 'from-green-200/60 to-green-50',
      iconTone: 'bg-emerald-100 text-emerald-700',
      path: '/agent/customers?status=active',
    },
    {
      title: 'Pending Profiles',
      value: data?.pendingProfiles ?? 0,
      icon: Clock,
      tone: 'from-blue-200/50 to-blue-50',
      iconTone: 'bg-sky-100 text-sky-700',
      path: '/agent/customers?status=pending',
    },
    {
      title: "Today's Tasks",
      value: data?.todaysTasks ?? 0,
      icon: ClipboardList,
      tone: 'from-purple-200/40 to-purple-50',
      iconTone: 'bg-violet-100 text-violet-700',
      path: '/agent/worksheet?filter=today',
    },
    {
      title: 'Overdue Tasks',
      value: data?.overdueTasks ?? 0,
      icon: AlertTriangle,
      tone: 'from-red-200/50 to-red-50',
      iconTone: 'bg-red-100 text-red-700',
      path: '/agent/worksheet?filter=overdue',
    },
  ];

  return (
    <div className="space-y-8 soft-fade-in">
      <div className="rounded-[28px] border border-rose-100 bg-gradient-to-r from-white via-[#FFF9FB] to-[#FFF0F4] p-5 shadow-[0_14px_40px_rgba(44,38,48,0.06)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-wow-primary">
              Agent portal
            </p>
            <h1 className="font-display text-3xl text-wow-text sm:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-wow-muted sm:text-base">
              Your customer pipeline and today&apos;s priorities
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/agent/customers/new" className="btn-primary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
              <Plus className="w-4 h-4" /> Add Customer
            </Link>
            <Link to="/agent/customers" className="btn-secondary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
              View Customers
            </Link>
            <Link to="/agent/worksheet" className="btn-secondary inline-flex items-center gap-2 !py-2.5 !px-4 text-sm">
              Create Task
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.title}
                  to={stat.path}
                  className={`card group bg-gradient-to-br ${stat.tone} border-0 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-wow-primary/40 focus:ring-offset-2 transition-all duration-200`}
                  aria-label={`${stat.title}: ${stat.value}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-wow-muted">{stat.title}</p>
                      <p className="text-3xl font-semibold text-wow-text mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`rounded-xl p-2.5 transition-transform group-hover:scale-105 ${stat.iconTone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Recently Added</h2>
            <Link to="/agent/customers" className="text-sm text-wow-primary flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!isLoading && !data?.recentlyAddedCustomers?.length ? (
            <EmptyState
              title="No customers yet"
              description="Onboard your first customer to get started."
              action={
                <Link to="/agent/customers/new" className="btn-primary text-sm !py-2 !px-4">
                  Add Customer
                </Link>
              }
            />
          ) : (
            <ul className="space-y-1">
              {(data?.recentlyAddedCustomers ?? []).map((c) => {
                const name = `${c.firstName} ${c.lastName || ''}`.trim();
                return (
                  <li key={c.id}>
                    <Link
                      to={`/agent/customers/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-wow-bg transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <CustomerAvatar
                          name={name}
                          imageUrl={getCustomerProfileImageUrl(c)}
                          size={40}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-wow-text truncate">{name}</p>
                          <p className="text-xs text-wow-muted">{c.customerCode}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} />
                        <ArrowRight className="w-4 h-4 text-wow-muted flex-shrink-0" />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl">Today&apos;s Pending Tasks</h2>
            <Link to="/agent/worksheet" className="text-sm text-wow-primary flex items-center gap-1">
              Worksheet <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!isLoading && !data?.todayPendingTasks?.length ? (
            <p className="text-wow-muted text-sm py-6 text-center">
              No pending tasks for today.
            </p>
          ) : (
            <ul className="space-y-3">
              {(data?.todayPendingTasks ?? []).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-wow-bg/60"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-wow-muted">{t.dueDate}</p>
                  </div>
                  <StatusBadge status={t.priority} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Recent Activities</h2>
          <Link to="/agent/activity" className="text-sm text-wow-primary flex items-center gap-1">
            Full log <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {!isLoading && !data?.recentActivities?.length ? (
          <p className="text-wow-muted text-sm text-center py-6">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(data?.recentActivities ?? []).map((a) => (
              <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="text-sm font-medium text-wow-text">{a.description}</p>
                  <p className="text-xs text-wow-muted capitalize">
                    {a.action.replace(/_/g, ' ')}
                  </p>
                </div>
                <p className="text-xs text-wow-muted whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
