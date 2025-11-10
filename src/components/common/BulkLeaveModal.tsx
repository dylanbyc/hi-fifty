interface BulkLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onApply: () => void;
}

export default function BulkLeaveModal({
  isOpen,
  onClose,
  selectedDates,
  onApply,
}: BulkLeaveModalProps) {
  if (!isOpen) return null;

  const handleApply = () => {
    if (selectedDates.length === 0) return;
    onApply();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
          Mark {selectedDates.length} Day{selectedDates.length !== 1 ? 's' : ''} as Leave
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to mark {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} as leave?
        </p>

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

