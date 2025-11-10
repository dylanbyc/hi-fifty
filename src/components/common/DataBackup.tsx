import { useState } from 'react';
import type { AttendanceRecord, UserSettings, RecurringPattern } from '../../types';

interface DataBackupProps {
  attendanceRecords: AttendanceRecord[];
  settings: UserSettings;
  recurringPatterns: RecurringPattern[];
  onImport: (data: {
    attendanceRecords: AttendanceRecord[];
    settings: UserSettings;
    recurringPatterns: RecurringPattern[];
  }) => void;
}

interface BackupData {
  version: number;
  exportDate: string;
  attendanceRecords: AttendanceRecord[];
  settings: UserSettings;
  recurringPatterns: RecurringPattern[];
}

export default function DataBackup({
  attendanceRecords,
  settings,
  recurringPatterns,
  onImport,
}: DataBackupProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    const backupData: BackupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      attendanceRecords,
      settings,
      recurringPatterns,
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anz-rto-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: BackupData = JSON.parse(text);

        // Validate data structure
        if (!data.version || !data.attendanceRecords || !data.settings) {
          throw new Error('Invalid backup file format');
        }

        // Confirm import
        const confirmMessage = `This will replace your current data with the backup from ${new Date(data.exportDate).toLocaleDateString()}. Continue?`;
        if (!confirm(confirmMessage)) {
          return;
        }

        onImport({
          attendanceRecords: data.attendanceRecords || [],
          settings: data.settings,
          recurringPatterns: data.recurringPatterns || [],
        });

        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (error) {
        console.error('Import error:', error);
        setImportError(
          error instanceof Error
            ? error.message
            : 'Failed to import backup file. Please check the file format.'
        );
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
        Data Backup & Restore
      </h3>

      <div className="space-y-4">
        {/* Export Section */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Export Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a backup of your attendance records, settings, and recurring patterns.
          </p>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors"
          >
            📥 Export Backup
          </button>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Records: {attendanceRecords.length} | Patterns: {recurringPatterns.length}
          </div>
        </div>

        {/* Import Section */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Import Data</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Restore your data from a previously exported backup file.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <span className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer">
              📤 Choose Backup File
            </span>
          </label>

          {importError && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">⚠️ {importError}</p>
            </div>
          )}

          {importSuccess && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Data imported successfully!
              </p>
            </div>
          )}

          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            ⚠️ Importing will replace all current data
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            💡 Backup Tips
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Export regularly to keep your data safe</li>
            <li>Backup files are stored locally on your device</li>
            <li>You can import backups on any device</li>
            <li>Backups include all attendance records, settings, and patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

