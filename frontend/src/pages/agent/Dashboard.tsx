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
    },
    {
      title: 'Active Customers',
      value: data?.activeCustomers ?? 0,
      icon: UserCheck,
      tone: 'from-green-200/60 to-green-50',
    },
    {
      title: 'Pending Profiles',
      value: data?.pendingProfiles ?? 0,
      icon: Clock,
      tone: 'from-blue-200/50 to-blue-50',
    },
    {
      title: "Today's Tasks",
      value: data?.todaysTasks ?? 0,
      icon: ClipboardList,
      tone: 'from-purple-200/40 to-purple-50',
    },
    {
      title: 'Overdue Tasks',
      value: data?.overdueTasks ?? 0,
      icon: AlertTriangle,
      tone: 'from-red-200/50 to-red-50',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-wow-text">Dashboard</h1>
          <p className="text-wow-muted mt-1">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.title}
                  to={
                    stat.title === 'Total Customers'
                      ? '/agent/customers'
                      : stat.title === 'Active Customers'
                      ? '/agent/customers?status=active'
                      : stat.title === 'Pending Profiles'
                      ? '/agent/customers?status=pending'
                      : stat.title === "Today's Tasks"
                      ? '/agent/worksheet'
                      : '/agent/worksheet?filter=overdue'
                  }
                  className={`card bg-gradient-to-br ${stat.tone} border-0 block cursor-pointer hover:shadow-lg transition`}
                >
                  <div className="flex items-start justify-between">

                    <div>
                      <p className="text-sm text-wow-muted">{stat.title}</p>
                      <p className="text-3xl font-semibold text-wow-text mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70">
                      <Icon className="w-5 h-5 text-wow-primary" />
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
