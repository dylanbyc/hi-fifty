import { useMemo } from 'react';
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

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main Status Card */}
      <div className={`bg-white rounded-lg shadow-md p-6 border-2 ${statusColor}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Current Status</h2>
          <span className="text-4xl">{statusIndicator.icon}</span>
        </div>
        <div className="mb-4">
          <div className="text-5xl font-bold mb-2">{report.attendancePercentage}%</div>
          <div className="text-lg font-semibold">{statusIndicator.text}</div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
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

        <div className="text-sm text-gray-600">
          Target: 50% | Current: {report.attendancePercentage}%
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Days in Office</div>
          <div className="text-3xl font-bold text-anz-blue">{report.daysInOffice}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Total Working Days</div>
          <div className="text-3xl font-bold text-gray-700">{report.totalWorkingDays}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Days WFH</div>
          <div className="text-3xl font-bold text-gray-600">{report.daysWFH}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600 mb-1">Days on Leave</div>
          <div className="text-3xl font-bold text-yellow-600">{report.daysLeave}</div>
        </div>
      </div>

      {/* Action Card */}
      {report.attendancePercentage < 50 && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-anz-light-blue">
          <h3 className="text-xl font-bold text-anz-blue mb-3">Action Required</h3>
          <div className="space-y-2">
            <p className="text-gray-700">
              You need <span className="font-bold text-anz-blue">{report.daysNeededForTarget}</span> more 
              {' '}day{report.daysNeededForTarget !== 1 ? 's' : ''} in the office to reach your 50% target.
            </p>
            <p className="text-sm text-gray-600">
              Current: {report.daysInOffice} / {report.totalWorkingDays} working days
            </p>
            {report.daysNeededForTarget > 0 && (
              <p className="text-sm text-amber-600 font-semibold mt-3">
                💡 Tip: Plan your office days for the remaining working days this month.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Projection Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-anz-blue mb-3">End of Month Projection</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-800">{report.projectedEndOfMonth}%</span>
          <span className="text-gray-600">
            {report.projectedEndOfMonth >= 50 ? (
              <span className="text-green-600">✓ Projected to meet target</span>
            ) : (
              <span className="text-red-600">⚠ May not meet target</span>
            )}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Based on current attendance pattern
        </p>
      </div>
    </div>
  );
}

