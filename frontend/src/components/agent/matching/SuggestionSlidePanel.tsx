import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, Lock, Pencil, RefreshCw, Sparkles, X } from 'lucide-react';
import type { AgentMatchProfile } from '../../../types/agentMatching';
import SuggestedProfileCard from './SuggestedProfileCard';

interface Props {
  open: boolean;
  profiles: AgentMatchProfile[];
  workspaceCustomerId?: string;
  isLoading?: boolean;
  isFetching?: boolean;
  locked?: boolean;
  completeProfileUrl?: string;
  onClose: () => void;
  onCollapse: () => void;
  onRefresh: () => void;
}

export default function SuggestionSlidePanel({
  open,
  profiles,
  workspaceCustomerId,
  isLoading,
  isFetching,
  locked = false,
  completeProfileUrl = '',
  onClose,
  onCollapse,
  onRefresh,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close AI suggestions"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
          />

          <motion.aside
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { x: '100%', opacity: 0, scale: 0.98 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { x: 0, opacity: 1, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { x: '100%', opacity: 0, scale: 0.98 }
            }
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-gray-100 bg-white/95 shadow-[-16px_0_48px_rgba(44,38,48,0.14)] backdrop-blur-xl"
            aria-label="AI suggested profiles"
          >
            <div className="border-b border-gray-100 bg-gradient-to-r from-[#FFF5F7] to-white px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-wow-text">
                    <Sparkles className="h-4 w-4 text-wow-primary" />
                    AI Suggested Profiles
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-wow-bg px-2 py-0.5 text-[10px] font-medium text-wow-muted">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-wow-muted">
                    Ranked by the WOW Compatibility Engine
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isFetching || locked}
                    className="rounded-lg p-1.5 text-wow-muted transition hover:bg-wow-bg hover:text-wow-primary disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onCollapse}
                    className="rounded-lg p-1.5 text-wow-muted transition hover:bg-wow-bg hover:text-wow-primary"
                    title="Collapse"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-wow-muted transition hover:bg-wow-bg hover:text-wow-primary"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div
                className={`h-full space-y-4 overflow-y-auto p-5 ${
                  locked ? 'pointer-events-none select-none blur-[3px]' : ''
                }`}
              >
                {isLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-72 animate-pulse rounded-2xl bg-gray-100" />
                    ))}
                  </div>
                )}
                {!isLoading && profiles.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-wow-muted">
                    No AI suggestions yet. Add more opposite-gender customer profiles across the
                    platform.
                  </div>
                )}
                {!isLoading &&
                  profiles.map((profile) => (
                    <SuggestedProfileCard
                      key={profile.id}
                      profile={profile}
                      workspaceCustomerId={workspaceCustomerId}
                    />
                  ))}
              </div>

              {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/55 p-6 backdrop-blur-[2px]">
                  <div className="w-full max-w-sm rounded-2xl border border-wow-primary/20 bg-white/95 p-6 text-center shadow-xl">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF5F7] text-wow-primary">
                      <Lock className="h-5 w-5" />
                    </div>
                    <p className="font-display text-lg text-wow-text">
                      Complete customer profile to unlock AI recommendations.
                    </p>
                    <p className="mt-2 text-sm text-wow-muted">
                      Finish the selected customer&apos;s profile to generate and interact with
                      suggestions.
                    </p>
                    <Link
                      to={completeProfileUrl}
                      className="btn-primary mt-5 inline-flex w-full items-center justify-center gap-2 !py-2.5 text-sm shadow-lg shadow-wow-primary/25"
                    >
                      <Pencil className="h-4 w-4" />
                      Complete Profile
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
