import type { AttendanceType } from '../../types';

interface AttendanceTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  currentType?: AttendanceType;
  onSelect: (type: AttendanceType) => void;
}

export default function AttendanceTypeModal({
  isOpen,
  onClose,
  selectedDate,
  currentType,
  onSelect,
}: AttendanceTypeModalProps) {
  if (!isOpen) return null;

  const handleSelect = (type: AttendanceType) => {
    onSelect(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
          Select Attendance Type
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSelect('office')}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
              currentType === 'office'
                ? 'border-anz-blue bg-anz-blue/10 dark:bg-anz-blue/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-anz-blue hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-6 h-6 rounded bg-anz-blue flex-shrink-0"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">At office</span>
            {currentType === 'office' && (
              <span className="ml-auto text-anz-blue">✓</span>
            )}
          </button>

          <button
            onClick={() => handleSelect('wfh')}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
              currentType === 'wfh'
                ? 'border-gray-400 bg-gray-100 dark:bg-gray-700'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-6 h-6 rounded bg-gray-300 flex-shrink-0"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">At home</span>
            {currentType === 'wfh' && (
              <span className="ml-auto text-gray-600 dark:text-gray-400">✓</span>
            )}
          </button>

          <button
            onClick={() => handleSelect('leave')}
            className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
              currentType === 'leave'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-yellow-500 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="w-6 h-6 rounded bg-yellow-400 flex-shrink-0"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">On leave</span>
            {currentType === 'leave' && (
              <span className="ml-auto text-yellow-600 dark:text-yellow-400">✓</span>
            )}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

