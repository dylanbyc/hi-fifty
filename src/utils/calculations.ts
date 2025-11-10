import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, parseISO, isAfter, isSameDay, startOfDay } from 'date-fns';
import type { AttendanceRecord, MonthlyReport, UserSettings, HolidayData, Holiday } from '../types';
import { TARGET_PERCENTAGE } from './constants';

/**
 * Get all holidays for a given month, year, and location
 */
export function getHolidaysForMonth(
  holidays: HolidayData,
  month: number,
  year: number,
  settings: UserSettings
): Holiday[] {
  const yearKey = year.toString();
  const yearData = holidays[yearKey];
  if (!yearData) return [];

  const holidaysList: Holiday[] = [];

  if (settings.location === 'australia') {
    // Add national holidays
    if (yearData.australia?.national) {
      holidaysList.push(...yearData.australia.national);
    }
    // Add state-specific holidays
    if (settings.state) {
      const stateHolidays = yearData.australia?.[settings.state];
      if (stateHolidays) {
        holidaysList.push(...stateHolidays);
      }
    }
  } else if (settings.location === 'bangalore') {
    if (yearData.bangalore) {
      holidaysList.push(...yearData.bangalore);
    }
  }

  // Filter to only holidays in the specified month
  return holidaysList.filter(holiday => {
    const holidayDate = parseISO(holiday.date);
    return holidayDate.getMonth() + 1 === month && holidayDate.getFullYear() === year;
  });
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(
  date: string,
  holidays: HolidayData,
  settings: UserSettings
): boolean {
  const dateObj = parseISO(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const monthHolidays = getHolidaysForMonth(holidays, month, year, settings);
  
  return monthHolidays.some(holiday => holiday.date === date);
}

/**
 * Get the attendance type for a date based on weekends and holidays
 */
export function getDefaultAttendanceType(
  date: string,
  holidays: HolidayData,
  settings: UserSettings
): AttendanceRecord['type'] {
  const dateObj = parseISO(date);
  
  if (isWeekend(dateObj)) {
    return 'weekend';
  }
  
  if (isHoliday(date, holidays, settings)) {
    return 'holiday';
  }
  
  return 'wfh'; // Default to WFH if not weekend or holiday
}

/**
 * Calculate total working days in a month
 * Excludes weekends, holidays, and leave days
 */
export function getWorkingDaysInMonth(
  records: AttendanceRecord[],
  month: number,
  year: number,
  holidays: HolidayData,
  settings: UserSettings
): number {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));
  const allDays = eachDayOfInterval({ start, end });

  let workingDays = 0;

  for (const day of allDays) {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Skip weekends
    if (isWeekend(day)) {
      continue;
    }

    // Skip holidays
    if (isHoliday(dateStr, holidays, settings)) {
      continue;
    }

    // Skip leave days
    const record = records.find(r => r.date === dateStr);
    if (record?.type === 'leave') {
      continue;
    }

    workingDays++;
  }

  return workingDays;
}

/**
 * Calculate attendance statistics for a month
 */
export function calculateMonthlyReport(
  records: AttendanceRecord[],
  month: number,
  year: number,
  holidays: HolidayData,
  settings: UserSettings
): MonthlyReport {
  const totalWorkingDays = getWorkingDaysInMonth(records, month, year, holidays, settings);
  
  const monthRecords = records.filter(record => {
    const recordDate = parseISO(record.date);
    return recordDate.getMonth() === month - 1 && 
           recordDate.getFullYear() === year &&
           (record.type === 'office' || record.type === 'wfh' || record.type === 'leave');
  });

  const daysInOffice = monthRecords.filter(r => r.type === 'office').length;
  const daysWFH = monthRecords.filter(r => r.type === 'wfh').length;
  const daysLeave = monthRecords.filter(r => r.type === 'leave').length;

  // Calculate current percentage
  const attendancePercentage = totalWorkingDays > 0 
    ? Math.round((daysInOffice / totalWorkingDays) * 100) 
    : 0;

  // Calculate days needed to reach target
  const targetDays = Math.ceil((totalWorkingDays * TARGET_PERCENTAGE) / 100);
  const daysNeededForTarget = Math.max(0, targetDays - daysInOffice);

  // Project end of month percentage
  const today = startOfDay(new Date());
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));
  const allDays = eachDayOfInterval({ start, end });
  
  const remainingDays = allDays.filter(day => {
    const dayStart = startOfDay(day);
    return isAfter(dayStart, today) || isSameDay(dayStart, today);
  });

  const remainingWorkingDays = remainingDays.filter(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (isWeekend(day)) return false;
    if (isHoliday(dateStr, holidays, settings)) return false;
    const record = records.find(r => r.date === dateStr);
    if (record?.type === 'leave') return false;
    return true;
  }).length;

  // Projection: Calculate based on current pattern or what's needed to reach target
  // Option 1: If user has a pattern, project based on that
  const totalDaysWithPattern = daysInOffice + daysWFH;
  let projectedOfficeDays = daysInOffice;
  
  if (totalDaysWithPattern > 0 && remainingWorkingDays > 0) {
    // Calculate current office ratio
    const currentOfficeRatio = daysInOffice / totalDaysWithPattern;
    // Project remaining days based on current pattern
    const projectedRemainingOffice = Math.round(remainingWorkingDays * currentOfficeRatio);
    projectedOfficeDays = daysInOffice + projectedRemainingOffice;
  } else if (remainingWorkingDays > 0) {
    // No pattern yet, calculate what's needed to reach target
    const targetDays = Math.ceil((totalWorkingDays * TARGET_PERCENTAGE) / 100);
    const shortfall = Math.max(0, targetDays - daysInOffice);
    // Assume user will work enough days to reach target (optimistic)
    projectedOfficeDays = Math.min(totalWorkingDays, daysInOffice + Math.min(shortfall, remainingWorkingDays));
  }

  const projectedEndOfMonth = totalWorkingDays > 0
    ? Math.round((projectedOfficeDays / totalWorkingDays) * 100)
    : 0;

  return {
    month,
    year,
    totalWorkingDays,
    daysInOffice,
    daysWFH,
    daysLeave,
    attendancePercentage,
    daysNeededForTarget,
    projectedEndOfMonth,
  };
}

/**
 * Get days needed to reach target percentage
 */
export function getDaysNeededForCompliance(
  currentOfficeDays: number,
  remainingWorkingDays: number,
  totalWorkingDays: number,
  targetPercentage: number = TARGET_PERCENTAGE
): number {
  const targetDays = Math.ceil((totalWorkingDays * targetPercentage) / 100);
  const shortfall = Math.max(0, targetDays - currentOfficeDays);
  
  // If we can't reach target even with all remaining days, return the shortfall
  if (shortfall > remainingWorkingDays) {
    return shortfall;
  }
  
  return shortfall;
}

