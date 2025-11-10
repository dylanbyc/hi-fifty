import { useEffect, useRef } from 'react';
import type { NotificationSettings, MonthlyReport } from '../types';

export function useNotifications(
  settings: NotificationSettings | undefined,
  report: MonthlyReport
) {
  const notificationIntervalRef = useRef<number | null>(null);
  const lastNotificationDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!settings?.enabled || !settings?.permissionGranted) {
      return;
    }

    const checkAndNotify = () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Don't notify multiple times on the same day
      if (lastNotificationDateRef.current === today) {
        return;
      }

      const daysNeeded = report.daysNeededForTarget;
      const shouldNotify = settings.reminderDays.includes(daysNeeded);

      if (shouldNotify && daysNeeded > 0) {
        const notification = new Notification('ANZ RTO Attendance Reminder', {
          body: `You need ${daysNeeded} more day${daysNeeded !== 1 ? 's' : ''} in the office to reach your 50% target. Current: ${report.attendancePercentage}%`,
          icon: '/favicon.ico', // You can add a custom icon
          badge: '/favicon.ico',
          tag: 'rto-reminder',
          requireInteraction: false,
        });

        lastNotificationDateRef.current = today;

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    };

    // Check immediately
    checkAndNotify();

    // Set up interval to check periodically (every hour)
    notificationIntervalRef.current = window.setInterval(checkAndNotify, 60 * 60 * 1000);

    return () => {
      if (notificationIntervalRef.current !== null) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, [settings, report]);

  return null;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.warn('Notification permission has been denied');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

