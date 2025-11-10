import { useState } from 'react';
import type { RecurringPattern } from '../../types';
import RecurringPatternModal from './RecurringPatternModal';

interface RecurringPatternsListProps {
  patterns: RecurringPattern[];
  onAdd: (pattern: Omit<RecurringPattern, 'id'>) => void;
  onUpdate: (id: string, pattern: Omit<RecurringPattern, 'id'>) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringPatternsList({
  patterns,
  onAdd,
  onUpdate,
  onDelete,
  onToggle,
}: RecurringPatternsListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<RecurringPattern | undefined>();

  const handleEdit = (pattern: RecurringPattern) => {
    setEditingPattern(pattern);
    setShowModal(true);
  };

  const handleSave = (pattern: Omit<RecurringPattern, 'id'>) => {
    if (editingPattern) {
      onUpdate(editingPattern.id, pattern);
    } else {
      onAdd(pattern);
    }
    setEditingPattern(undefined);
    setShowModal(false);
  };

  const handleClose = () => {
    setEditingPattern(undefined);
    setShowModal(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-anz-blue dark:text-anz-light-blue">
          Recurring Patterns
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors text-sm"
        >
          + Add Pattern
        </button>
      </div>

      {patterns.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No recurring patterns yet.</p>
          <p className="text-sm mt-2">Create a pattern to automatically mark attendance on specific days.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patterns.map(pattern => (
            <div
              key={pattern.id}
              className={`p-4 border rounded-lg ${
                pattern.enabled
                  ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {pattern.name}
                    </h4>
                    {!pattern.enabled && (
                      <span className="text-xs px-2 py-1 bg-gray-300 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Days:</span>
                      <div className="flex gap-1">
                        {pattern.daysOfWeek.map(day => (
                          <span
                            key={day}
                            className="px-2 py-0.5 bg-anz-blue/10 dark:bg-anz-light-blue/20 text-anz-blue dark:text-anz-light-blue rounded text-xs font-medium"
                          >
                            {DAYS_OF_WEEK[day]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Type:</span>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-3 h-3 rounded ${
                            pattern.attendanceType === 'office'
                              ? 'bg-anz-blue'
                              : pattern.attendanceType === 'wfh'
                              ? 'bg-gray-300'
                              : 'bg-yellow-400'
                          }`}
                        ></div>
                        <span className="capitalize">
                          {pattern.attendanceType === 'wfh' ? 'WFH' : pattern.attendanceType}
                          {pattern.leaveType && ` (${pattern.leaveType})`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {pattern.endDate
                      ? `From ${new Date(pattern.startDate).toLocaleDateString()} to ${new Date(pattern.endDate).toLocaleDateString()}`
                      : `From ${new Date(pattern.startDate).toLocaleDateString()} (ongoing)`}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onToggle(pattern.id, !pattern.enabled)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      pattern.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pattern.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleEdit(pattern)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this pattern?')) {
                        onDelete(pattern.id);
                      }
                    }}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RecurringPatternModal
        isOpen={showModal}
        onClose={handleClose}
        onSave={handleSave}
        existingPattern={editingPattern}
      />
    </div>
  );
}

