/**
 * Error messages for user-facing errors
 */
export const ErrorMessages = {
  INVALID_DATE: "Please select a valid date",
  FUTURE_DATE: "Cannot mark attendance for future dates",
  WEEKEND_SELECTION: "Weekends are automatically marked as non-working days",
  SAVE_FAILED: "Failed to save. Your data is stored locally and will retry.",
  STORAGE_QUOTA_EXCEEDED: "Storage limit reached. Please clear some data or contact support.",
  CORRUPTED_DATA: "Data appears to be corrupted. Please refresh the page.",
} as const;

/**
 * Attendance type constants
 */
export const AttendanceType = {
  OFFICE: 'office',
  WFH: 'wfh',
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend',
} as const;

/**
 * Leave type constants
 */
export const LeaveType = {
  ANNUAL: 'annual',
  SICK: 'sick',
  OTHER: 'other',
} as const;

/**
 * Target attendance percentage
 */
export const TARGET_PERCENTAGE = 50;

/**
 * Storage key for local storage
 */
export const STORAGE_KEY = 'anz_rto_tracker_v1';

/**
 * Status thresholds for attendance percentage
 */
export const StatusThresholds = {
  ON_TRACK: 50,
  AT_RISK: 45,
  BELOW_TARGET: 0,
} as const;

