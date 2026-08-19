/**
 * FOLIO Study Streak
 * ---------------------------------------------------------------------------
 * Turns the study streak badge from a hard-coded number into a real, rolling
 * measurement. Every day the student opens the workspace (or performs a study
 * action) is recorded locally; the streak is the run of consecutive days
 * ending today or yesterday.
 *
 * The first time a profile is seen we seed the history from the streak already
 * stored on the account, so an existing "12 day streak" keeps its value and
 * then continues to grow — or resets honestly if a day is missed.
 */

const STREAK_KEY = 'folio.streak.v1';

export interface StreakDay {
  date: string;      // YYYY-MM-DD
  activities: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastActiveDate: string;
  activeToday: boolean;
  todayActivities: number;
  history: StreakDay[];
  /** Oldest -> newest flags for the trailing 7 days, today last. */
  lastSevenDays: { date: string; active: boolean; label: string }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fromDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const daysBetween = (a: string, b: string): number =>
  Math.round((fromDateKey(b).getTime() - fromDateKey(a).getTime()) / DAY_MS);

interface StoredStreak {
  history: StreakDay[];
  longest: number;
  seeded: boolean;
}

const readStored = (): StoredStreak => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredStreak;
      if (Array.isArray(parsed.history)) {
        return { history: parsed.history, longest: parsed.longest || 0, seeded: Boolean(parsed.seeded) };
      }
    }
  } catch { /* fall through to a fresh store */ }
  return { history: [], longest: 0, seeded: false };
};

const writeStored = (value: StoredStreak) => {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(value));
  } catch (e) {
    console.warn('Streak persistence unavailable:', e);
  }
};

/** Count consecutive active days ending today (or yesterday, if today is idle). */
const computeCurrentStreak = (history: StreakDay[]): number => {
  if (!history.length) return 0;

  const keys = [...new Set(history.map(h => h.date))].sort();
  const todayKey = toDateKey(new Date());
  const newest = keys[keys.length - 1];

  // A streak stays alive only while the most recent day is today or yesterday.
  const gapToNow = daysBetween(newest, todayKey);
  if (gapToNow > 1) return 0;

  let streak = 1;
  for (let i = keys.length - 1; i > 0; i--) {
    if (daysBetween(keys[i - 1], keys[i]) === 1) streak++;
    else break;
  }
  return streak;
};

const buildState = (stored: StoredStreak): StreakState => {
  const todayKey = toDateKey(new Date());
  const current = computeCurrentStreak(stored.history);
  const activeDates = new Set(stored.history.map(h => h.date));
  const today = stored.history.find(h => h.date === todayKey);

  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = toDateKey(d);
    return { date: key, active: activeDates.has(key), label: DAY_LABELS[d.getDay()] };
  });

  return {
    current,
    longest: Math.max(stored.longest, current),
    lastActiveDate: stored.history.length ? stored.history[stored.history.length - 1].date : '',
    activeToday: Boolean(today),
    todayActivities: today?.activities || 0,
    history: stored.history,
    lastSevenDays
  };
};

/**
 * Mark the student active today and return the recomputed streak.
 * `seedStreak` backfills history the first time a profile is initialised so a
 * pre-existing account streak is preserved rather than reset to 1.
 */
export const recordStudyActivity = (seedStreak = 0): StreakState => {
  const stored = readStored();
  const todayKey = toDateKey(new Date());

  if (!stored.seeded) {
    stored.seeded = true;
    // Backfill the days leading up to today so the account streak carries over.
    for (let i = Math.max(0, seedStreak - 1); i > 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      stored.history.push({ date: toDateKey(d), activities: 1 });
    }
  }

  const existing = stored.history.find(h => h.date === todayKey);
  if (existing) {
    existing.activities += 1;
  } else {
    stored.history.push({ date: todayKey, activities: 1 });
  }

  // Keep the trailing year only, sorted oldest -> newest, de-duplicated.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);
  const cutoffKey = toDateKey(cutoff);

  const merged = new Map<string, number>();
  stored.history
    .filter(h => h.date >= cutoffKey)
    .forEach(h => merged.set(h.date, (merged.get(h.date) || 0) + h.activities));

  stored.history = [...merged.entries()]
    .map(([date, activities]) => ({ date, activities }))
    .sort((a, b) => a.date.localeCompare(b.date));

  stored.longest = Math.max(stored.longest, computeCurrentStreak(stored.history));
  writeStored(stored);

  return buildState(stored);
};

export const getStreakState = (): StreakState => buildState(readStored());

export const resetStreak = () => {
  writeStored({ history: [], longest: 0, seeded: false });
};
