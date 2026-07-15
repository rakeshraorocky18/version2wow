import { Link } from 'react-router-dom';
import { Lock, Pencil } from 'lucide-react';
import { MATCH_COMPLETION_THRESHOLD } from '../../../constants/agentMatching';
import { ProfileProgress } from '../AgentUI';

interface Props {
  profileCompletion: number;
  editUrl: string;
  requiredThreshold?: number;
}

export default function MatchLockBanner({
  profileCompletion,
  editUrl,
  requiredThreshold = MATCH_COMPLETION_THRESHOLD,
}: Props) {
  return (
    <div
      className="rounded-2xl border border-wow-primary/25 bg-gradient-to-r from-[#FFF5F7] via-white to-[#FFF8FB] p-5"
      style={{ boxShadow: '0 8px 28px rgba(183, 110, 121, 0.1)' }}
      role="status"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-wow-text">
            <Lock className="h-4 w-4 text-wow-primary" />
            Matchmaking locked
          </div>
          <p className="mt-1.5 text-sm text-wow-muted">
            Complete this customer&apos;s profile to unlock full matchmaking and recommendations.
          </p>
          <div className="mt-4 max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs text-wow-muted">
              <span>
                Profile Completion{' '}
                <span className="font-semibold text-wow-primary">{profileCompletion}%</span>
              </span>
              <span>
                Required{' '}
                <span className="font-semibold text-wow-text">{requiredThreshold}%</span>
              </span>
            </div>
            <ProfileProgress value={profileCompletion} />
          </div>
        </div>
        <Link
          to={editUrl}
          className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 !px-5 !py-2.5 text-sm shadow-lg shadow-wow-primary/25"
        >
          <Pencil className="h-4 w-4" />
          Complete Profile
        </Link>
      </div>
    </div>
  );
}
