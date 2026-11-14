import type { JobPreset } from './types';

// ─── Night window helpers ──────────────────────────────────────────────────────
// Night hours: 22:00 – 06:00 next day
// Strategy: for every millisecond in [checkIn, checkOut) determine if it falls
// in a night window, then accumulate in O(1) by splitting the span into
// calendar-day chunks and computing the overlap analytically.

/** Returns the start-of-day (midnight) timestamp for a given Date */
function midnightOf(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Compute overlap (in ms) between interval [start, end) and
 * night window [22:00, 06:00 next day) anchored to the calendar day
 * whose midnight is `dayMidnight`.
 */
function nightOverlapForDay(dayMidnight: number, start: number, end: number): number {
  const nightStart = dayMidnight + 22 * 3600_000;          // 22:00
  const nightEnd   = dayMidnight + 30 * 3600_000;          // 06:00+1day

  const overlapStart = Math.max(start, nightStart);
  const overlapEnd   = Math.min(end,   nightEnd);
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Calculate day hours and night hours between two timestamps.
 * Night = 22:00 – 06:00 (next day).
 */
export function calculateHours(
  checkIn: Date,
  checkOut: Date,
): { totalHours: number; dayHours: number; nightHours: number } {
  const start = checkIn.getTime();
  const end   = checkOut.getTime();

  if (end <= start) {
    return { totalHours: 0, dayHours: 0, nightHours: 0 };
  }

  const totalMs = end - start;

  // Iterate over each calendar day that the interval might touch,
  // starting from the previous day to capture early morning hours (00:00 - 06:00)
  let nightMs = 0;
  let cursor  = midnightOf(checkIn) - 24 * 3600_000;
  const endMidnight = midnightOf(checkOut) + 24 * 3600_000;

  while (cursor < endMidnight) {
    nightMs += nightOverlapForDay(cursor, start, end);
    cursor  += 24 * 3600_000;
  }

  const nightHours = nightMs / 3_600_000;
  const totalHours = totalMs  / 3_600_000;
  const dayHours   = totalHours - nightHours;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    dayHours:   Math.round(dayHours   * 100) / 100,
    nightHours: Math.round(nightHours * 100) / 100,
  };
}

// ─── Amount ───────────────────────────────────────────────────────────────────

/**
 * amount = dayHours * hourlyRate + nightHours * hourlyRate * (1 + nightPct/100)
 */
export function calculateAmount(
  dayHours: number,
  nightHours: number,
  preset: JobPreset,
): number {
  const { hourly_rate, night_allowance_pct } = preset;
  const dayPay   = dayHours   * hourly_rate;
  const nightPay = nightHours * hourly_rate * (1 + night_allowance_pct / 100);
  return Math.round(dayPay + nightPay);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

/** Format an integer VND amount → "1.234.567 ₫" */
export function formatVND(amount: number): string {
  return (
    Math.round(amount)
      .toLocaleString('vi-VN') + ' ₫'
  );
}

/** Format decimal hours → "8h 30m" */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Calculate how far toward a wish-item price the user currently is.
 * @param cashBalance   Cash already in wallet (VND)
 * @param pendingAmount Approved/pending salary not yet received (VND)
 * @param itemPrice     Target item price (VND)
 * @returns percent capped at 100, and naive daysToGoal (0 if already there)
 */
export function calculateProgress(
  cashBalance: number,
  pendingAmount: number,
  itemPrice: number,
): { percent: number; daysToGoal: number } {
  if (itemPrice <= 0) return { percent: 100, daysToGoal: 0 };

  const total   = cashBalance + pendingAmount;
  const percent = Math.min(100, Math.round((total / itemPrice) * 100));
  const daysToGoal = percent >= 100 ? 0 : -1; // -1 = unknown without avg earning
  return { percent, daysToGoal };
}

/**
 * Estimate how many more days until the user can afford the target.
 * Returns 0 if already affordable, or -1 if avgDailyEarning is 0.
 */
export function estimateDaysToGoal(
  currentBalance: number,
  pendingAmount: number,
  targetPrice: number,
  avgDailyEarning: number,
): number {
  const have      = currentBalance + pendingAmount;
  const remaining = targetPrice - have;
  if (remaining <= 0) return 0;
  if (avgDailyEarning <= 0) return -1;
  return Math.ceil(remaining / avgDailyEarning);
}
