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
 * Get the holiday name for a specific date
 */
export function getHolidayName(
  date: string,
  holidays: HolidayData,
  settings: UserSettings
): string | null {
  const dateObj = parseISO(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const monthHolidays = getHolidaysForMonth(holidays, month, year, settings);
  
  const holiday = monthHolidays.find(h => h.date === date);
  return holiday?.name || null;
}

/**
 * Get the attendance type for a date based on weekends and holidays
 * Returns null for regular working days that need to be selected by the user
 */
export function getDefaultAttendanceType(
  date: string,
  holidays: HolidayData,
  settings: UserSettings
): AttendanceRecord['type'] | null {
  const dateObj = parseISO(date);
  
  if (isWeekend(dateObj)) {
    return 'weekend';
  }
  
  if (isHoliday(date, holidays, settings)) {
    return 'holiday';
  }
  
  return null; // Regular working days need to be selected by the user
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
 * Calculate working days available so far (from start of month up to today, inclusive)
 * Excludes weekends, holidays, and leave days
 * This is used for calculating current attendance percentage
 */
export function getWorkingDaysAvailableSoFar(
  records: AttendanceRecord[],
  month: number,
  year: number,
  holidays: HolidayData,
  settings: UserSettings
): number {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const today = startOfDay(new Date());
  const end = isAfter(today, endOfMonth(new Date(year, month - 1, 1)))
    ? endOfMonth(new Date(year, month - 1, 1))
    : today;
  
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
  const workingDaysAvailableSoFar = getWorkingDaysAvailableSoFar(records, month, year, holidays, settings);
  
  const monthRecords = records.filter(record => {
    const recordDate = parseISO(record.date);
    return recordDate.getMonth() === month - 1 && 
           recordDate.getFullYear() === year &&
           (record.type === 'office' || record.type === 'wfh' || record.type === 'leave');
  });

  const daysInOffice = monthRecords.filter(r => r.type === 'office').length;
  const daysWFH = monthRecords.filter(r => r.type === 'wfh').length;
  const daysLeave = monthRecords.filter(r => r.type === 'leave').length;

  // Calculate current percentage based on working days available so far
  // This gives users a better sense of their current status
  const attendancePercentage = workingDaysAvailableSoFar > 0 
    ? Math.round((daysInOffice / workingDaysAvailableSoFar) * 100) 
    : 0;

  // Calculate days needed to reach target
  const targetDays = Math.ceil((totalWorkingDays * TARGET_PERCENTAGE) / 100);
  const daysNeededForTarget = Math.max(0, targetDays - daysInOffice);

  return {
    month,
    year,
    totalWorkingDays,
    workingDaysAvailableSoFar,
    daysInOffice,
    daysWFH,
    daysLeave,
    attendancePercentage,
    daysNeededForTarget,
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

/**
 * Get remaining working days in the current month
 */
export function getRemainingWorkingDays(
  records: AttendanceRecord[],
  month: number,
  year: number,
  holidays: HolidayData,
  settings: UserSettings
): number {
  const today = startOfDay(new Date());
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(new Date(year, month - 1, 1));
  const allDays = eachDayOfInterval({ start, end });
  
  const remainingDays = allDays.filter(day => {
    const dayStart = startOfDay(day);
    return isAfter(dayStart, today) || isSameDay(dayStart, today);
  });

  return remainingDays.filter(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    if (isWeekend(day)) return false;
    if (isHoliday(dateStr, holidays, settings)) return false;
    const record = records.find(r => r.date === dateStr);
    if (record?.type === 'leave') return false;
    return true;
  }).length;
}

/**
 * Get monthly reports for the last N months
 */
export function getHistoricalReports(
  records: AttendanceRecord[],
  months: number,
  holidays: HolidayData,
  settings: UserSettings
): MonthlyReport[] {
  const reports: MonthlyReport[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < months; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    const report = calculateMonthlyReport(records, month, year, holidays, settings);
    reports.push(report);
  }
  
  return reports.reverse(); // Return oldest to newest
}

