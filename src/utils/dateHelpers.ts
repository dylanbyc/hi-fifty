import { parseISO, isValid, isFuture, isToday, startOfDay, format } from 'date-fns';

/**
 * Validate if a string is a valid ISO date (YYYY-MM-DD)
 */
export function isValidDate(date: string): boolean {
  try {
    const parsed = parseISO(date);
    return isValid(parsed) && date.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  } catch {
    return false;
  }
}

/**
 * Check if a date string represents a future date
 */
export function isFutureDate(date: string): boolean {
  try {
    const parsed = parseISO(date);
    const today = startOfDay(new Date());
    return isFuture(parsed) && !isToday(parsed);
  } catch {
    return false;
  }
}

/**
 * Format a Date object to ISO string (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return formatDate(startOfDay(new Date()));
}

