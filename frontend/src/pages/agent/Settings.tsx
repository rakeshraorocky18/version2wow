import { useAgentAuthStore } from '../../store/agent/agentAuthStore';

export default function AgentSettings() {
  const user = useAgentAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl text-wow-text">Settings</h1>
        <p className="text-wow-muted mt-1">Your agent profile</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wow-primary to-wow-primary-light text-white flex items-center justify-center text-2xl font-semibold">
            {(user?.firstName?.[0] || user?.email?.[0] || 'A').toUpperCase()}
          </div>
          <div>
            <p className="font-display text-2xl">{user?.name || 'Agent'}</p>
            <p className="text-wow-muted text-sm">{user?.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {[
            ['First Name', user?.firstName || '—'],
            ['Last Name', user?.lastName || '—'],
            ['Phone', user?.phone || '—'],
            ['Employee Code', user?.employeeCode || '—'],
            ['Role', user?.role || 'agent'],
          ].map(([label, value]) => (
            <div key={label} className="p-3 rounded-xl bg-wow-bg/70">
              <dt className="text-xs text-wow-muted">{label}</dt>
              <dd className="font-medium mt-1 capitalize">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-sm text-wow-muted pt-2">
          Agent accounts cannot access admin features. Contact your administrator
          for password resets or role changes.
        </p>
      </div>
    </div>
  );
}
