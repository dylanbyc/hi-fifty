import { useState, useEffect } from 'react';
import { format, parseISO, isAfter, eachDayOfInterval } from 'date-fns';
import type { AttendanceRecord, LeaveType } from '../../types';
import { LeaveType as LeaveTypeConstants } from '../../utils/constants';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string, leaveType: LeaveType) => void;
  existingRecords: AttendanceRecord[];
  holidays: any;
  settings: any;
}

export default function LeaveModal({
  isOpen,
  onClose,
  onSave,
  existingRecords,
  holidays: _holidays,
  settings: _settings,
}: LeaveModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const today = format(new Date(), 'yyyy-MM-dd');
      setStartDate(today);
      setEndDate(today);
      setLeaveType('annual');
      setErrors([]);
      setWarnings([]);
    }
  }, [isOpen]);

  const validateDates = (): { errors: string[]; warnings: string[] } => {
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    if (!startDate || !endDate) {
      validationErrors.push('Please select both start and end dates');
      return { errors: validationErrors, warnings: validationWarnings };
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (isAfter(start, end)) {
      validationErrors.push('Start date must be before or equal to end date');
    }

    // Check for overlapping leave periods (warning only, will overwrite)
    const daysInRange = eachDayOfInterval({ start, end });
    const overlappingDates: string[] = [];

    for (const day of daysInRange) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const existingRecord = existingRecords.find(r => r.date === dateStr);
      
      if (existingRecord?.type === 'leave') {
        overlappingDates.push(dateStr);
      }
    }

    if (overlappingDates.length > 0) {
      validationWarnings.push(
        `This will overwrite existing leave on ${overlappingDates.length} day(s). Existing leave will be replaced.`
      );
    }

    return { errors: validationErrors, warnings: validationWarnings };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { errors: validationErrors, warnings: validationWarnings } = validateDates();
    setErrors(validationErrors);
    setWarnings(validationWarnings);
    
    // Only block submission if there are actual errors (not warnings)
    if (validationErrors.length > 0) {
      return;
    }

    onSave(startDate, endDate, leaveType);
    onClose();
  };

  const handleClose = () => {
    setErrors([]);
    setWarnings([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-anz-blue text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Add Leave Period</h2>
          <p className="text-anz-light-blue text-sm mt-1">
            Select a date range and leave type
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <ul className="list-disc list-inside text-sm text-red-800">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warning Messages */}
          {warnings.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ul className="list-disc list-inside text-sm text-yellow-800">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Start Date */}
          <div className="mb-4">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setErrors([]);
                setWarnings([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-anz-blue focus:border-transparent"
              required
            />
          </div>

          {/* End Date */}
          <div className="mb-4">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setErrors([]);
                setWarnings([]);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-anz-blue focus:border-transparent"
              required
            />
          </div>

          {/* Leave Type */}
          <div className="mb-6">
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              id="leaveType"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-anz-blue focus:border-transparent"
            >
              <option value={LeaveTypeConstants.ANNUAL}>Annual Leave</option>
              <option value={LeaveTypeConstants.SICK}>Sick Leave</option>
              <option value={LeaveTypeConstants.OTHER}>Other Leave</option>
            </select>
          </div>

          {/* Date Range Preview */}
          {startDate && endDate && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>Selected Period:</strong>
              </p>
              <p className="text-sm text-gray-800">
                {format(parseISO(startDate), 'MMM d, yyyy')} - {format(parseISO(endDate), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors"
            >
              Add Leave
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

