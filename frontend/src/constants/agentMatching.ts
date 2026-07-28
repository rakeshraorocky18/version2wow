/** Minimum selected-customer profile completion to unlock full matchmaking. */
export const MATCH_COMPLETION_THRESHOLD = Number(
  import.meta.env.VITE_AGENT_MATCH_COMPLETION_THRESHOLD || 80,
);

export function isMatchmakingUnlocked(profileCompletion?: number | null): boolean {
  return (profileCompletion ?? 0) >= MATCH_COMPLETION_THRESHOLD;
}
