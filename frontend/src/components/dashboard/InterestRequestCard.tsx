import React from 'react';

interface InterestRequestCardProps {
  match: { id: string; firstName?: string; lastName?: string; city?: string; state?: string };
  variant?: 'received' | 'sent';
  compact?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function InterestRequestCard({
  match,
  variant = 'received',
  compact = false,
  onAccept,
  onReject,
}: InterestRequestCardProps) {
  const name = [match.firstName, match.lastName].filter(Boolean).join(' ').trim() || 'Profile';
  const location = [match.city, match.state].filter(Boolean).join(', ');

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          {location ? <p className="text-sm text-gray-500">{location}</p> : null}
          <p className="mt-1 text-xs uppercase tracking-wide text-pink-500">{variant === 'received' ? 'New interest' : 'Sent interest'}</p>
        </div>
        {!compact ? (
          <div className="flex gap-2">
            <button type="button" onClick={onAccept} className="rounded-full bg-rose-500 px-3 py-1 text-sm text-white">Accept</button>
            <button type="button" onClick={onReject} className="rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700">Decline</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
