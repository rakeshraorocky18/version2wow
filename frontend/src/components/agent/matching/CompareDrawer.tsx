import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import type { AgentMatchProfile } from '../../../types/agentMatching';
import CompatibilityBadge from './CompatibilityBadge';

interface Props {
  open: boolean;
  profiles: AgentMatchProfile[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CompareDrawer({
  open,
  profiles,
  onClose,
  onRemove,
  onClear,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close compare drawer"
            className="fixed inset-0 z-40 bg-black/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] overflow-hidden rounded-t-3xl border border-gray-100 bg-white shadow-[0_-12px_40px_rgba(44,38,48,0.12)]"
            aria-label="Compare profiles"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <h3 className="font-display text-lg text-wow-text">Compare Profiles</h3>
                <p className="text-xs text-wow-muted">
                  {profiles.length}/3 selected for side-by-side review
                </p>
              </div>
              <div className="flex items-center gap-2">
                {profiles.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-wow-muted hover:bg-gray-50"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-wow-muted hover:bg-gray-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              {profiles.length === 0 ? (
                <p className="py-8 text-center text-sm text-wow-muted">
                  Select profiles with Compare to review them here.
                </p>
              ) : (
                <div className="grid min-w-[640px] grid-cols-3 gap-3">
                  {profiles.map((profile) => {
                    const name =
                      profile.name ||
                      `${profile.firstName} ${profile.lastName || ''}`.trim();
                    return (
                      <div
                        key={profile.id}
                        className="rounded-2xl border border-gray-100 bg-[#FFFCFD] p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-wow-text">{name}</p>
                            <p className="text-xs text-wow-muted">
                              {[profile.age ? `${profile.age} yrs` : null, profile.city]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(profile.id)}
                            className="rounded p-1 text-wow-muted hover:bg-white"
                            aria-label={`Remove ${name}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <CompatibilityBadge score={profile.compatibilityScore} size="md" />
                        <dl className="mt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between gap-2">
                            <dt className="text-wow-muted">Religion</dt>
                            <dd className="font-medium">{profile.religion || '—'}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-wow-muted">Education</dt>
                            <dd className="max-w-[60%] truncate text-right font-medium">
                              {profile.education || '—'}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-wow-muted">Occupation</dt>
                            <dd className="max-w-[60%] truncate text-right font-medium">
                              {profile.occupation || '—'}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-wow-muted">Height</dt>
                            <dd className="font-medium">{profile.height || '—'}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-wow-muted">Completion</dt>
                            <dd className="font-medium">{profile.profileCompletion}%</dd>
                          </div>
                        </dl>
                        <Link
                          to={`/agent/customers/${profile.id}/profile`}
                          className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-wow-primary px-2 py-2 text-xs font-medium text-white"
                        >
                          View Profile
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
