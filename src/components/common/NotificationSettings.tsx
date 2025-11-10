import { useState } from 'react';
import type { NotificationSettings } from '../../types';
import { requestNotificationPermission } from '../../hooks/useNotifications';

interface NotificationSettingsProps {
  settings: NotificationSettings | undefined;
  onUpdate: (settings: NotificationSettings) => void;
}

export default function NotificationSettingsComponent({
  settings,
  onUpdate,
}: NotificationSettingsProps) {
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [reminderTime, setReminderTime] = useState(settings?.reminderTime || '09:00');
  const [reminderDays, setReminderDays] = useState<number[]>(
    settings?.reminderDays || [7, 3, 1]
  );
  const [permissionGranted, setPermissionGranted] = useState(
    settings?.permissionGranted ?? false
  );
  const [requestingPermission, setRequestingPermission] = useState(false);

  const handleRequestPermission = async () => {
    setRequestingPermission(true);
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
    setRequestingPermission(false);

    if (granted) {
      // Auto-enable notifications when permission is granted
      setEnabled(true);
      const newSettings: NotificationSettings = {
        enabled: true,
        reminderTime,
        reminderDays,
        permissionGranted: true,
      };
      onUpdate(newSettings);
    }
  };

  const handleToggleDay = (day: number) => {
    setReminderDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day).sort((a, b) => b - a)
        : [...prev, day].sort((a, b) => b - a)
    );
  };

  const handleSave = () => {
    const newSettings: NotificationSettings = {
      enabled: permissionGranted && enabled,
      reminderTime,
      reminderDays,
      permissionGranted,
    };
    onUpdate(newSettings);
  };

  const commonReminderDays = [14, 7, 5, 3, 1];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6">
      <h3 className="text-xl font-bold text-anz-blue dark:text-anz-light-blue mb-4">
        Notification Settings
      </h3>

      <div className="space-y-4">
        {/* Permission Status */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Browser Permission</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {permissionGranted
                  ? 'Notifications are enabled'
                  : 'Enable browser notifications to receive reminders'}
              </p>
            </div>
            {!permissionGranted && (
              <button
                onClick={handleRequestPermission}
                disabled={requestingPermission}
                className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors text-sm disabled:opacity-50"
              >
                {requestingPermission ? 'Requesting...' : 'Enable Notifications'}
              </button>
            )}
          </div>
          {permissionGranted && (
            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable reminder notifications
                </span>
              </label>
            </div>
          )}
        </div>

        {permissionGranted && (
          <>
            {/* Reminder Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reminder Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              />
            </div>

            {/* Reminder Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remind me when I need (days remaining):
              </label>
              <div className="flex flex-wrap gap-2">
                {commonReminderDays.map(day => (
                  <button
                    key={day}
                    onClick={() => handleToggleDay(day)}
                    className={`px-3 py-1 rounded-lg border transition-colors text-sm ${
                      reminderDays.includes(day)
                        ? 'bg-anz-blue text-white border-anz-blue'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {day} day{day !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                You'll be notified when you need this many days to reach your target
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!permissionGranted}
            className="px-4 py-2 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

