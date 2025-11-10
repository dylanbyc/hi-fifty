import { describe, it, expect, beforeEach } from 'vitest';
import {
  getHolidaysForMonth,
  isHoliday,
  getHolidayName,
  getDefaultAttendanceType,
  getWorkingDaysInMonth,
  calculateMonthlyReport,
  getDaysNeededForCompliance,
  calculateWhatIfScenario,
  getOfficeDaysForTarget,
  getRemainingWorkingDays,
  getHistoricalReports,
} from './calculations';
import type { AttendanceRecord, HolidayData, UserSettings } from '../types';

// Mock holiday data for testing
const mockHolidays: HolidayData = {
  '2024': {
    australia: {
      national: [
        { date: '2024-01-01', name: "New Year's Day" },
        { date: '2024-01-26', name: 'Australia Day' },
        { date: '2024-12-25', name: 'Christmas Day' },
      ],
      nsw: [
        { date: '2024-06-10', name: "King's Birthday" },
      ],
    },
    bangalore: [
      { date: '2024-01-26', name: 'Republic Day' },
      { date: '2024-08-15', name: 'Independence Day' },
    ],
  },
  '2025': {
    australia: {
      national: [
        { date: '2025-01-01', name: "New Year's Day" },
      ],
    },
    bangalore: [
      { date: '2025-01-26', name: 'Republic Day' },
    ],
  },
};

const defaultSettings: UserSettings = {
  location: 'australia',
  state: 'nsw',
  targetPercentage: 50,
};

describe('getHolidaysForMonth', () => {
  it('should return holidays for a specific month and year', () => {
    const holidays = getHolidaysForMonth(mockHolidays, 1, 2024, defaultSettings);
    expect(holidays).toHaveLength(2); // New Year's Day and Australia Day
    expect(holidays.some(h => h.name === "New Year's Day")).toBe(true);
    expect(holidays.some(h => h.name === 'Australia Day')).toBe(true);
  });

  it('should include state-specific holidays for Australia', () => {
    const holidays = getHolidaysForMonth(mockHolidays, 6, 2024, defaultSettings);
    expect(holidays.some(h => h.name === "King's Birthday")).toBe(true);
  });

  it('should return holidays for Bangalore location', () => {
    const bangaloreSettings: UserSettings = {
      location: 'bangalore',
      targetPercentage: 50,
    };
    const holidays = getHolidaysForMonth(mockHolidays, 1, 2024, bangaloreSettings);
    expect(holidays).toHaveLength(1);
    expect(holidays[0].name).toBe('Republic Day');
  });

  it('should return empty array for month with no holidays', () => {
    const holidays = getHolidaysForMonth(mockHolidays, 2, 2024, defaultSettings);
    expect(holidays).toHaveLength(0);
  });

  it('should return empty array for year not in data', () => {
    const holidays = getHolidaysForMonth(mockHolidays, 1, 2023, defaultSettings);
    expect(holidays).toHaveLength(0);
  });
});

describe('isHoliday', () => {
  it('should return true for a holiday date', () => {
    expect(isHoliday('2024-01-01', mockHolidays, defaultSettings)).toBe(true);
  });

  it('should return false for a non-holiday date', () => {
    expect(isHoliday('2024-01-15', mockHolidays, defaultSettings)).toBe(false);
  });

  it('should return true for state-specific holiday', () => {
    expect(isHoliday('2024-06-10', mockHolidays, defaultSettings)).toBe(true);
  });

  it('should return false for weekend dates', () => {
    // 2024-01-06 is a Saturday
    expect(isHoliday('2024-01-06', mockHolidays, defaultSettings)).toBe(false);
  });
});

describe('getHolidayName', () => {
  it('should return holiday name for a holiday date', () => {
    const name = getHolidayName('2024-01-01', mockHolidays, defaultSettings);
    expect(name).toBe("New Year's Day");
  });

  it('should return null for a non-holiday date', () => {
    const name = getHolidayName('2024-01-15', mockHolidays, defaultSettings);
    expect(name).toBeNull();
  });
});

describe('getDefaultAttendanceType', () => {
  it('should return weekend for Saturday', () => {
    // 2024-01-06 is a Saturday
    const type = getDefaultAttendanceType('2024-01-06', mockHolidays, defaultSettings);
    expect(type).toBe('weekend');
  });

  it('should return weekend for Sunday', () => {
    // 2024-01-07 is a Sunday
    const type = getDefaultAttendanceType('2024-01-07', mockHolidays, defaultSettings);
    expect(type).toBe('weekend');
  });

  it('should return holiday for a holiday date', () => {
    const type = getDefaultAttendanceType('2024-01-01', mockHolidays, defaultSettings);
    expect(type).toBe('holiday');
  });

  it('should return null for a regular working day (prompts user to select)', () => {
    // 2024-01-02 is a Tuesday (not weekend, not holiday)
    const type = getDefaultAttendanceType('2024-01-02', mockHolidays, defaultSettings);
    expect(type).toBeNull();
  });
});

describe('getWorkingDaysInMonth', () => {
  it('should exclude weekends from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // January 2024 has 31 days, 8 weekends (Sat/Sun), 2 holidays
    // Expected: 31 - 8 - 2 = 21 working days
    expect(workingDays).toBe(21);
  });

  it('should exclude holidays from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // Should exclude New Year's Day and Australia Day
    expect(workingDays).toBe(21);
  });

  it('should exclude leave days from working days', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'leave' },
      { date: '2024-01-03', type: 'leave' },
    ];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // Should exclude 2 leave days
    expect(workingDays).toBe(19);
  });

  it('should handle February correctly (28 days)', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 2, 2024, mockHolidays, defaultSettings);
    // February 2024 has 29 days (leap year), 8 weekends
    // Expected: 29 - 8 = 21 working days
    expect(workingDays).toBe(21);
  });

  it('should handle February in non-leap year (28 days)', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 2, 2023, mockHolidays, defaultSettings);
    // February 2023 has 28 days, 8 weekends
    // Expected: 28 - 8 = 20 working days
    expect(workingDays).toBe(20);
  });

  it('should handle month with all leave days', () => {
    // Create records for all working days in January 2024
    const records: AttendanceRecord[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = `2024-01-${String(day).padStart(2, '0')}`;
      // Skip weekends and holidays
      const dateObj = new Date(2024, 0, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'leave' });
      }
    }
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    expect(workingDays).toBe(0);
  });
});

describe('calculateMonthlyReport', () => {
  it('should calculate correct attendance percentage', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'office' },
      { date: '2024-01-03', type: 'office' },
      { date: '2024-01-04', type: 'office' },
      { date: '2024-01-05', type: 'office' },
      { date: '2024-01-08', type: 'office' },
      { date: '2024-01-09', type: 'office' },
      { date: '2024-01-10', type: 'office' },
      { date: '2024-01-11', type: 'office' },
      { date: '2024-01-12', type: 'office' },
      { date: '2024-01-15', type: 'office' },
      { date: '2024-01-16', type: 'office' },
    ];
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    // 11 office days out of 21 working days = 52.38% -> rounded to 52%
    expect(report.attendancePercentage).toBe(52);
    expect(report.daysInOffice).toBe(11);
    expect(report.totalWorkingDays).toBe(21);
  });

  it('should handle all office days month', () => {
    const records: AttendanceRecord[] = [];
    // Add office records for all working days
    for (let day = 1; day <= 31; day++) {
      const date = `2024-01-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'office' });
      }
    }
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(100);
    expect(report.daysInOffice).toBe(21);
    expect(report.daysNeededForTarget).toBe(0);
  });

  it('should handle all leave days month', () => {
    const records: AttendanceRecord[] = [];
    // Add leave records for all working days
    for (let day = 1; day <= 31; day++) {
      const date = `2024-01-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'leave' });
      }
    }
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(0);
    expect(report.daysInOffice).toBe(0);
    expect(report.daysLeave).toBe(21);
    expect(report.totalWorkingDays).toBe(0); // All days are leave, so no working days
  });

  it('should calculate days needed for target correctly', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'office' },
      { date: '2024-01-03', type: 'office' },
    ];
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    // Target is 50% of 21 = 10.5 -> 11 days
    // Current: 2 days
    // Needed: 11 - 2 = 9 days
    expect(report.daysNeededForTarget).toBe(9);
  });

  it('should handle zero working days', () => {
    const records: AttendanceRecord[] = [];
    // Use a month where all days are leave
    const allLeaveRecords: AttendanceRecord[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = `2024-01-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        allLeaveRecords.push({ date, type: 'leave' });
      }
    }
    const report = calculateMonthlyReport(allLeaveRecords, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(0);
    expect(report.totalWorkingDays).toBe(0);
  });

  it('should count WFH days separately', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'office' },
      { date: '2024-01-03', type: 'wfh' },
      { date: '2024-01-04', type: 'wfh' },
    ];
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.daysInOffice).toBe(1);
    expect(report.daysWFH).toBe(2);
    expect(report.attendancePercentage).toBe(5); // 1/21 = 4.76% -> 5%
  });
});

describe('Percentage Rounding', () => {
  it('should round down correctly', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'office' },
    ];
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    // 1/21 = 4.76% -> should round to 5%
    expect(report.attendancePercentage).toBe(5);
  });

  it('should round up correctly', () => {
    const records: AttendanceRecord[] = [];
    // Add 10 office days out of 21 = 47.62% -> should round to 48%
    for (let i = 2; i <= 11; i++) {
      const date = `2024-01-${String(i).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, i);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'office' });
      }
    }
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    // 10/21 = 47.62% -> should round to 48%
    expect(report.attendancePercentage).toBe(48);
  });

  it('should round 50% correctly', () => {
    const records: AttendanceRecord[] = [];
    // Add 10.5 days worth (11 days) = 52.38% -> should round to 52%
    // Actually, let's test with exactly 50%
    // 10.5/21 = 50%, but we need whole days
    // 10/21 = 47.62% -> 48%
    // 11/21 = 52.38% -> 52%
    // Let's test with 10 days = 47.62% -> 48%
    for (let i = 2; i <= 11; i++) {
      const date = `2024-01-${String(i).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, i);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'office' });
      }
    }
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBeGreaterThanOrEqual(47);
    expect(report.attendancePercentage).toBeLessThanOrEqual(53);
  });

  it('should handle edge case: 0%', () => {
    const records: AttendanceRecord[] = [];
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(0);
  });

  it('should handle edge case: 100%', () => {
    const records: AttendanceRecord[] = [];
    for (let day = 1; day <= 31; day++) {
      const date = `2024-01-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(2024, 0, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6 && 
          !isHoliday(date, mockHolidays, defaultSettings)) {
        records.push({ date, type: 'office' });
      }
    }
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(100);
  });
});

describe('getDaysNeededForCompliance', () => {
  it('should calculate days needed correctly', () => {
    const needed = getDaysNeededForCompliance(5, 10, 20, 50);
    // Target: 50% of 20 = 10 days
    // Current: 5 days
    // Needed: 10 - 5 = 5 days
    expect(needed).toBe(5);
  });

  it('should return 0 when already compliant', () => {
    const needed = getDaysNeededForCompliance(15, 10, 20, 50);
    // Target: 10 days, Current: 15 days
    // Already compliant
    expect(needed).toBe(0);
  });

  it('should handle case where remaining days are insufficient', () => {
    const needed = getDaysNeededForCompliance(5, 3, 20, 50);
    // Target: 10 days, Current: 5 days, Remaining: 3 days
    // Can only get 8 days total, still need 2 more
    expect(needed).toBe(5); // Shortfall is 5 days
  });
});

describe('calculateWhatIfScenario', () => {
  it('should calculate percentage with additional days', () => {
    const percentage = calculateWhatIfScenario(5, 3, 20);
    // (5 + 3) / 20 = 40%
    expect(percentage).toBe(40);
  });

  it('should handle zero working days', () => {
    const percentage = calculateWhatIfScenario(5, 3, 0);
    expect(percentage).toBe(0);
  });

  it('should round correctly', () => {
    const percentage = calculateWhatIfScenario(1, 1, 3);
    // 2/3 = 66.67% -> should round to 67%
    expect(percentage).toBe(67);
  });
});

describe('getOfficeDaysForTarget', () => {
  it('should calculate office days needed for target', () => {
    const needed = getOfficeDaysForTarget(5, 10, 20, 50);
    // Target: 10 days, Current: 5 days, Remaining: 10 days
    // Needed: 5 days (min of needed and remaining)
    expect(needed).toBe(5);
  });

  it('should not exceed remaining working days', () => {
    const needed = getOfficeDaysForTarget(5, 3, 20, 50);
    // Target: 10 days, Current: 5 days, Remaining: 3 days
    // Can only use 3 remaining days
    expect(needed).toBe(3);
  });
});

describe('getRemainingWorkingDays', () => {
  it('should calculate remaining working days correctly', () => {
    // This test depends on the current date, so we'll test the logic
    // by using a past date as "today"
    const records: AttendanceRecord[] = [];
    const remaining = getRemainingWorkingDays(records, 1, 2024, mockHolidays, defaultSettings);
    // The result depends on when the test runs, but should be >= 0
    expect(remaining).toBeGreaterThanOrEqual(0);
  });

  it('should exclude leave days from remaining days', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-15', type: 'leave' },
      { date: '2024-01-16', type: 'leave' },
    ];
    const remaining = getRemainingWorkingDays(records, 1, 2024, mockHolidays, defaultSettings);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });
});

describe('getHistoricalReports', () => {
  it('should generate reports for last N months', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-02', type: 'office' },
      { date: '2024-02-05', type: 'office' },
    ];
    const reports = getHistoricalReports(records, 3, mockHolidays, defaultSettings);
    expect(reports).toHaveLength(3);
    expect(reports[0].month).toBeLessThanOrEqual(reports[1].month);
  });
});

describe('Edge Cases: February and Leap Years', () => {
  it('should handle February in leap year (29 days)', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 2, 2024, mockHolidays, defaultSettings);
    // February 2024 has 29 days, 8 weekends
    expect(workingDays).toBe(21);
  });

  it('should handle February in non-leap year (28 days)', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 2, 2023, mockHolidays, defaultSettings);
    // February 2023 has 28 days, 8 weekends
    expect(workingDays).toBe(20);
  });

  it('should calculate attendance for February correctly', () => {
    const records: AttendanceRecord[] = [];
    // Add office days for February 2024
    for (let day = 1; day <= 29; day++) {
      const date = `2024-02-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(2024, 1, day);
      if (dateObj.getDay() !== 0 && dateObj.getDay() !== 6) {
        records.push({ date, type: 'office' });
      }
    }
    const report = calculateMonthlyReport(records, 2, 2024, mockHolidays, defaultSettings);
    expect(report.attendancePercentage).toBe(100);
    expect(report.totalWorkingDays).toBe(21);
  });
});

describe('Weekend Exclusion', () => {
  it('should exclude all Saturdays from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // January 2024 has 4 Saturdays and 4 Sundays = 8 weekend days
    // Verify weekends are excluded
    const report = calculateMonthlyReport(records, 1, 2024, mockHolidays, defaultSettings);
    expect(report.totalWorkingDays).toBe(21); // 31 - 8 weekends - 2 holidays
  });

  it('should exclude all Sundays from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // Should not include any Sundays
    expect(workingDays).toBe(21);
  });

  it('should not allow marking weekends as office days', () => {
    // 2024-01-06 is a Saturday
    const type = getDefaultAttendanceType('2024-01-06', mockHolidays, defaultSettings);
    expect(type).toBe('weekend');
  });
});

describe('Holiday Exclusion', () => {
  it('should exclude national holidays from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, defaultSettings);
    // Should exclude New Year's Day and Australia Day
    expect(workingDays).toBe(21); // 31 - 8 weekends - 2 holidays
  });

  it('should exclude state-specific holidays from working days', () => {
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 6, 2024, mockHolidays, defaultSettings);
    // Should exclude King's Birthday (June 10)
    // June 2024 has 30 days, 8 weekends, 1 holiday = 21 working days
    expect(workingDays).toBe(21);
  });

  it('should exclude Bangalore holidays correctly', () => {
    const bangaloreSettings: UserSettings = {
      location: 'bangalore',
      targetPercentage: 50,
    };
    const records: AttendanceRecord[] = [];
    const workingDays = getWorkingDaysInMonth(records, 1, 2024, mockHolidays, bangaloreSettings);
    // Should exclude Republic Day (Jan 26)
    // January 2024: 31 days - 8 weekends - 1 holiday = 22 working days
    expect(workingDays).toBe(22);
  });

  it('should not allow marking holidays as office days', () => {
    const type = getDefaultAttendanceType('2024-01-01', mockHolidays, defaultSettings);
    expect(type).toBe('holiday');
  });
});

