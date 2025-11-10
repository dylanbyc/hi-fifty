export type AttendanceType = 'office' | 'wfh' | 'leave' | 'holiday' | 'weekend';

export type LeaveType = 'annual' | 'sick' | 'other';

export interface AttendanceRecord {
  date: string; // ISO format: YYYY-MM-DD
  type: AttendanceType;
  leaveType?: LeaveType;
}

export interface MonthlyReport {
  month: number;
  year: number;
  totalWorkingDays: number; // Total working days in the full month
  workingDaysAvailableSoFar: number; // Working days from start of month up to today (inclusive)
  daysInOffice: number;
  daysWFH: number;
  daysLeave: number;
  attendancePercentage: number; // Calculated as (daysInOffice / workingDaysAvailableSoFar) × 100
  daysNeededForTarget: number;
}

export interface UserSettings {
  location: 'australia' | 'bangalore';
  state?: string; // For Australian states (e.g., 'nsw', 'vic')
  targetPercentage: number;
  notifications?: NotificationSettings;
  theme?: ThemeSettings;
}

export interface Holiday {
  date: string; // ISO format: YYYY-MM-DD
  name: string;
}

export interface HolidayData {
  [year: string]: {
    australia?: {
      national?: Holiday[];
      [state: string]: Holiday[] | undefined;
    };
    bangalore?: Holiday[];
  };
}

export interface RecurringPattern {
  id: string;
  name: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  attendanceType: AttendanceType;
  startDate: string; // ISO format
  endDate?: string; // ISO format, optional for ongoing patterns
  leaveType?: LeaveType; // Required if attendanceType is 'leave'
  enabled: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // HH:mm format (e.g., "09:00")
  reminderDays: number[]; // Days before target to remind (e.g., [7, 3, 1])
  permissionGranted: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark';
}

