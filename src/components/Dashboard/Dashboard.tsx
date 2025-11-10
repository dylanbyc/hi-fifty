import { useMemo } from 'react';
import { format } from 'date-fns';
import type { MonthlyReport } from '../../types';

interface DashboardProps {
  report: MonthlyReport;
}

export default function Dashboard({ report }: DashboardProps) {
  const statusColor = useMemo(() => {
    if (report.attendancePercentage >= 50) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (report.attendancePercentage >= 45) {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
    }
  }, [report.attendancePercentage]);

  const statusIndicator = useMemo(() => {
    if (report.attendancePercentage >= 50) {
      return { text: 'On Track', icon: '✓' };
    } else if (report.attendancePercentage >= 45) {
      return { text: 'At Risk', icon: '⚠' };
    } else {
      return { text: 'Below Target', icon: '✗' };
    }
  }, [report.attendancePercentage]);

  const progressPercentage = Math.min(100, (report.attendancePercentage / 50) * 100);

  // Format month and year for display
  const monthYear = format(new Date(report.year, report.month - 1, 1), 'MMMM yyyy');

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Status Card */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 ${statusColor}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Current Status</h2>
          <span className="text-4xl">{statusIndicator.icon}</span>
        </div>
        <div className="mb-4">
          <div className="text-5xl font-bold mb-2 dark:text-white">{report.attendancePercentage}%</div>
          <div className="text-lg font-semibold dark:text-gray-300">{statusIndicator.text}</div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all ${
              report.attendancePercentage >= 50
                ? 'bg-green-600'
                : report.attendancePercentage >= 45
                ? 'bg-amber-500'
                : 'bg-red-600'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Target: 50% | Current: {report.attendancePercentage}%
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days in Office</div>
          <div className="text-3xl font-bold text-anz-blue dark:text-anz-light-blue">{report.daysInOffice}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Working Days ({monthYear})</div>
          <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{report.totalWorkingDays}</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {report.workingDaysAvailableSoFar} available so far
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days WFH</div>
          <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">{report.daysWFH}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days on Leave</div>
          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{report.daysLeave}</div>
        </div>
      </div>
    </div>
  );
}

