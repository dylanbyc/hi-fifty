import { useMemo } from 'react';
import Calendar from './components/Calendar/Calendar';
import Dashboard from './components/Dashboard/Dashboard';
import { useAttendanceStorage } from './hooks/useLocalStorage';
import { calculateMonthlyReport } from './utils/calculations';
import holidaysData from './data/holidays.json';
import type { AttendanceRecord, AttendanceType, HolidayData } from './types';

function App() {
  const { attendanceRecords, settings, addOrUpdateRecord } = useAttendanceStorage();
  const holidays = holidaysData as HolidayData;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthlyReport = useMemo(
    () => calculateMonthlyReport(attendanceRecords, currentMonth, currentYear, holidays, settings),
    [attendanceRecords, currentMonth, currentYear, holidays, settings]
  );

  const handleDateClick = (date: string, type: AttendanceType) => {
    const record: AttendanceRecord = {
      date,
      type,
    };

    // Add leave type if it's a leave day
    if (type === 'leave') {
      record.leaveType = 'annual'; // Default to annual leave
    }

    addOrUpdateRecord(record);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-anz-blue text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold">ANZ RTO Attendance Tracker</h1>
          <p className="text-anz-light-blue mt-2">
            Track your Return to Office compliance - Target: 50%
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Dashboard */}
          <section>
            <Dashboard report={monthlyReport} />
          </section>

          {/* Calendar */}
          <section>
            <Calendar
              records={attendanceRecords}
              onDateClick={handleDateClick}
              holidays={holidays}
              settings={settings}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-600 text-center">
            Data is stored locally in your browser. Your privacy is protected.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

