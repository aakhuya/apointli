/**
 * Calendar time helpers.
 * All math is done in the browser's local timezone.
 */

export function startOfDay(d: Date): Date {
  const result = new Date(d)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(d: Date): Date {
  const result = new Date(d)
  result.setHours(23, 59, 59, 999)
  return result
}

export function startOfWeek(d: Date, weekStartsOn: 0 | 1 = 1): Date {
  const result = startOfDay(d)
  const day = result.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  result.setDate(result.getDate() - diff)
  return result
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(d: Date, months: number): Date {
  const result = new Date(d)
  result.setMonth(result.getMonth() + months)
  return result
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export function formatIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatTimeHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatTime12h(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`
}

/**
 * Given a start time and duration, returns position as percentage
 * within a day (0-100).
 */
export function timeToPercent(iso: string): number {
  const d = new Date(iso)
  const minutes = d.getHours() * 60 + d.getMinutes()
  return (minutes / (24 * 60)) * 100
}

/**
 * Duration in percent of day.
 */
export function durationToPercent(minutes: number): number {
  return (minutes / (24 * 60)) * 100
}

/**
 * Compute overlap groups so side-by-side appointments can be positioned.
 * Returns a map of appointment ID → { column, totalColumns }
 */
export function computeOverlapGroups<T extends { id: string; start_time: string; end_time: string }>(
  items: T[],
): Map<string, { column: number; totalColumns: number }> {
  const sorted = [...items].sort((a, b) => a.start_time.localeCompare(b.start_time))
  const groups: T[][] = []
  const result = new Map<string, { column: number; totalColumns: number }>()

  for (const item of sorted) {
    // Find a group whose last item ends before this one starts
    let placed = false
    for (const group of groups) {
      const last = group[group.length - 1]
      if (last.end_time <= item.start_time) {
        group.push(item)
        placed = true
        break
      }
    }
    if (!placed) {
      groups.push([item])
    }
  }

  // Within each group, assign columns greedily
  for (const group of groups) {
    const columns: T[][] = []
    for (const item of group) {
      let col = 0
      for (const column of columns) {
        const overlaps = column.some(
          (other) =>
            other.start_time < item.end_time && item.start_time < other.end_time,
        )
        if (!overlaps) break
        col++
      }
      if (!columns[col]) columns[col] = []
      columns[col].push(item)
      result.set(item.id, { column: col, totalColumns: 0 })
    }
    // Second pass: set totalColumns
    for (const item of group) {
      const entry = result.get(item.id)!
      entry.totalColumns = columns.length
    }
  }

  return result
}
