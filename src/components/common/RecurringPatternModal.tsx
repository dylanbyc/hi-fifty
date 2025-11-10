import { useState } from 'react';
import type { RecurringPattern, AttendanceType, LeaveType } from '../../types';

interface RecurringPatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: Omit<RecurringPattern, 'id'>) => void;
  existingPattern?: RecurringPattern;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

export default function RecurringPatternModal({
  isOpen,
  onClose,
  onSave,
  existingPattern,
}: RecurringPatternModalProps) {
  const [name, setName] = useState(existingPattern?.name || '');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(existingPattern?.daysOfWeek || []);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>(
    existingPattern?.attendanceType || 'office'
  );
  const [leaveType, setLeaveType] = useState<LeaveType>(
    existingPattern?.leaveType || 'annual'
  );
  const [startDate, setStartDate] = useState(
    existingPattern?.startDate || new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    existingPattern?.endDate || ''
  );
  const [enabled, setEnabled] = useState(existingPattern?.enabled ?? true);

  if (!isOpen) return null;

  const handleDayToggle = (dayValue: number) => {
    setDaysOfWeek(prev =>
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  const handleSave = () => {
    if (!name.trim() || daysOfWeek.length === 0) {
      alert('Please provide a name and select at least one day of the week.');
      return;
    }

    const pattern: Omit<RecurringPattern, 'id'> = {
      name: name.trim(),
      daysOfWeek,
      attendanceType,
      startDate,
      endDate: endDate || undefined,
      leaveType: attendanceType === 'leave' ? leaveType : undefined,
      enabled,
    };

    onSave(pattern);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
          {existingPattern ? 'Edit Recurring Pattern' : 'Create Recurring Pattern'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pattern Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Every Tuesday and Thursday"
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Days of Week *
            </label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleDayToggle(day.value)}
                  className={`p-2 rounded-lg border transition-colors ${
                    daysOfWeek.includes(day.value)
                      ? 'bg-anz-blue text-white border-anz-blue'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xs font-medium">{day.short}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attendance Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="attendanceType"
                  value="office"
                  checked={attendanceType === 'office'}
                  onChange={(e) => setAttendanceType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-anz-blue"></div>
                  <span className="font-medium">Office</span>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="attendanceType"
                  value="wfh"
                  checked={attendanceType === 'wfh'}
                  onChange={(e) => setAttendanceType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-300"></div>
                  <span className="font-medium">Work From Home</span>
                </div>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="attendanceType"
                  value="leave"
                  checked={attendanceType === 'leave'}
                  onChange={(e) => setAttendanceType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-400"></div>
                  <span className="font-medium">Leave</span>
                </div>
              </label>
            </div>
          </div>

          {attendanceType === 'leave' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Leave Type *
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="other">Other Leave</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Leave empty for ongoing pattern
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enable this pattern
              </span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors"
          >
            {existingPattern ? 'Update' : 'Create'} Pattern
          </button>
        </div>
      </div>
    </div>
  );
}

