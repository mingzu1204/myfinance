import { JobPresetMeta, WishItemMeta } from './types'

export function parsePresetMeta(description?: string | null): JobPresetMeta {
  if (!description) {
    return { desc: '', icon: 'Briefcase', payday: 10, quick_shifts: [] }
  }
  try {
    const trimmed = description.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      return {
        desc: parsed.desc || '',
        icon: parsed.icon || 'Briefcase',
        payday: typeof parsed.payday === 'number' ? parsed.payday : 10,
        quick_shifts: Array.isArray(parsed.quick_shifts) ? parsed.quick_shifts : [],
      }
    }
  } catch {
    // legacy text
  }
  return {
    desc: description,
    icon: 'Briefcase',
    payday: 10,
    quick_shifts: [],
  }
}

export function serializePresetMeta(meta: JobPresetMeta): string {
  return JSON.stringify({
    desc: meta.desc || '',
    icon: meta.icon || 'Briefcase',
    payday: meta.payday ?? 10,
    quick_shifts: meta.quick_shifts || [],
  })
}

export function parseWishMeta(notes?: string | null): WishItemMeta {
  if (!notes) {
    return { note: '', is_purchased: false, allocated_amount: 0 }
  }
  try {
    const trimmed = notes.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed)
      return {
        note: parsed.note || '',
        is_purchased: Boolean(parsed.is_purchased),
        purchased_at: parsed.purchased_at || undefined,
        hours_worked_to_buy: typeof parsed.hours_worked_to_buy === 'number' ? parsed.hours_worked_to_buy : undefined,
        allocated_amount: typeof parsed.allocated_amount === 'number' ? parsed.allocated_amount : 0,
      }
    }
  } catch {
    // legacy text
  }
  return {
    note: notes,
    is_purchased: false,
    allocated_amount: 0,
  }
}

export function serializeWishMeta(meta: WishItemMeta): string {
  return JSON.stringify({
    note: meta.note || '',
    is_purchased: Boolean(meta.is_purchased),
    purchased_at: meta.purchased_at || null,
    hours_worked_to_buy: meta.hours_worked_to_buy ?? null,
    allocated_amount: meta.allocated_amount || 0,
  })
}

/**
 * Calculates remaining days until the next payday.
 * @param payday Day of the month (1-31)
 * @returns { daysRemaining: number, nextDate: Date, isToday: boolean }
 */
export function calculatePaydayRemaining(payday: number = 10): {
  daysRemaining: number
  nextDate: Date
  isToday: boolean
} {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed
  const currentDay = now.getDate()

  // Target date this month
  const maxDaysThisMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const targetDayThisMonth = Math.min(payday, maxDaysThisMonth)
  const targetDateThisMonth = new Date(currentYear, currentMonth, targetDayThisMonth)

  if (currentDay === targetDayThisMonth) {
    return {
      daysRemaining: 0,
      nextDate: targetDateThisMonth,
      isToday: true,
    }
  }

  if (currentDay < targetDayThisMonth) {
    // Later this month
    const diffMs = targetDateThisMonth.getTime() - new Date(currentYear, currentMonth, currentDay).getTime()
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return {
      daysRemaining: days,
      nextDate: targetDateThisMonth,
      isToday: false,
    }
  }

  // Next month
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const maxDaysNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate()
  const targetDayNextMonth = Math.min(payday, maxDaysNextMonth)
  const targetDateNextMonth = new Date(nextMonthYear, nextMonth, targetDayNextMonth)

  const diffMs = targetDateNextMonth.getTime() - new Date(currentYear, currentMonth, currentDay).getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))

  return {
    daysRemaining: days,
    nextDate: targetDateNextMonth,
    isToday: false,
  }
}
