import { format, parseISO, eachDayOfInterval, getDay, isAfter, isBefore, startOfDay } from 'date-fns';
import type { RecurringPattern, AttendanceRecord } from '../types';

/**
 * Apply recurring patterns to generate attendance records
 */
export function applyRecurringPatterns(
  patterns: RecurringPattern[],
  startDate: Date,
  endDate: Date
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of allDays) {
    const dayOfWeek = getDay(day); // 0 = Sunday, 6 = Saturday
    const dateStr = format(day, 'yyyy-MM-dd');

    // Find matching enabled patterns
    const matchingPatterns = patterns.filter(pattern => {
      if (!pattern.enabled) return false;
      if (!pattern.daysOfWeek.includes(dayOfWeek)) return false;

      const patternStart = parseISO(pattern.startDate);
      const patternEnd = pattern.endDate ? parseISO(pattern.endDate) : null;

      // Check if day is within pattern date range
      if (isBefore(day, startOfDay(patternStart))) return false;
      if (patternEnd && isAfter(day, startOfDay(patternEnd))) return false;

      return true;
    });

    // If multiple patterns match, use the first one (could be enhanced to prioritize)
    if (matchingPatterns.length > 0) {
      const pattern = matchingPatterns[0];
      const record: AttendanceRecord = {
        date: dateStr,
        type: pattern.attendanceType,
      };

      if (pattern.attendanceType === 'leave' && pattern.leaveType) {
        record.leaveType = pattern.leaveType;
      }

      records.push(record);
    }
  }

  return records;
}

/**
 * Generate a unique ID for a recurring pattern
 */
export function generatePatternId(): string {
  return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

