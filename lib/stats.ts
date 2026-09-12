export interface FocusStats {
  /** date string (YYYY-MM-DD) -> number of focus blocks completed that day */
  history: Record<string, number>;
}

export const EMPTY_STATS: FocusStats = { history: {} };

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateKeyDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function recordCompletedFocus(stats: FocusStats): FocusStats {
  const key = todayKey();
  return {
    history: {
      ...stats.history,
      [key]: (stats.history[key] ?? 0) + 1,
    },
  };
}

export function todayCount(stats: FocusStats): number {
  return stats.history[todayKey()] ?? 0;
}

export function totalCount(stats: FocusStats): number {
  return Object.values(stats.history).reduce((sum, n) => sum + n, 0);
}

/** Consecutive days (ending today or yesterday) with at least one completed block. */
export function currentStreak(stats: FocusStats): number {
  let streak = 0;
  // if nothing done today yet, streak can still count through yesterday
  let offset = (stats.history[todayKey()] ?? 0) > 0 ? 0 : 1;
  while (true) {
    const key = dateKeyDaysAgo(offset);
    if ((stats.history[key] ?? 0) > 0) {
      streak += 1;
      offset += 1;
    } else {
      break;
    }
  }
  return streak;
}
