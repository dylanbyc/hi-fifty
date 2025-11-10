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
  totalWorkingDays: number;
  daysInOffice: number;
  daysWFH: number;
  daysLeave: number;
  attendancePercentage: number;
  daysNeededForTarget: number;
  projectedEndOfMonth: number;
}

export interface UserSettings {
  location: 'australia' | 'bangalore';
  state?: string; // For Australian states (e.g., 'nsw', 'vic')
  targetPercentage: number;
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

