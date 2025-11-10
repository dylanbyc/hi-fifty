import { useState } from 'react';
import type { AttendanceType } from '../../types';

interface BulkMarkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onApply: (type: AttendanceType) => void;
}

export default function BulkMarkingModal({
  isOpen,
  onClose,
  selectedDates,
  onApply,
}: BulkMarkingModalProps) {
  const [selectedType, setSelectedType] = useState<AttendanceType>('office');

  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedDates.length === 0) return;
    onApply(selectedType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
          Bulk Mark {selectedDates.length} Day{selectedDates.length !== 1 ? 's' : ''}
        </h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Attendance Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="attendanceType"
                  value="office"
                  checked={selectedType === 'office'}
                  onChange={(e) => setSelectedType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">At office</span>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="attendanceType"
                  value="wfh"
                  checked={selectedType === 'wfh'}
                  onChange={(e) => setSelectedType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">At home</span>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="attendanceType"
                  value="leave"
                  checked={selectedType === 'leave'}
                  onChange={(e) => setSelectedType(e.target.value as AttendanceType)}
                  className="mr-3"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏖️</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">On leave</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors"
          >
            Apply to {selectedDates.length} Day{selectedDates.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

