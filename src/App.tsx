import { useMemo, useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar/Calendar';
import Dashboard from './components/Dashboard/Dashboard';
import LocationSelector from './components/common/LocationSelector';
import { useAttendanceStorage } from './hooks/useLocalStorage';
import { calculateMonthlyReport, getHolidaysForMonth } from './utils/calculations';
import { applyRecurringPatterns } from './utils/recurringPatterns';
import { useNotifications } from './hooks/useNotifications';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeToggle from './components/common/ThemeToggle';
import RecurringPatternsList from './components/common/RecurringPatternsList';
import NotificationSettings from './components/common/NotificationSettings';
import DataBackup from './components/common/DataBackup';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, startOfDay, isWeekend } from 'date-fns';
import holidaysData from './data/holidays.json';
import type { AttendanceRecord, AttendanceType, HolidayData } from './types';

function AppContent() {
  const {
    attendanceRecords,
    settings,
    recurringPatterns,
    setSettings,
    addOrUpdateRecord,
    bulkMarkRecords,
    addRecurringPattern,
    updateRecurringPattern,
    deleteRecurringPattern,
    toggleRecurringPattern,
    importData,
  } = useAttendanceStorage();
  useTheme(); // Initialize theme context
  const holidays = holidaysData as HolidayData;
  const [showSettings, setShowSettings] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const monthlyReport = useMemo(
    () => calculateMonthlyReport(attendanceRecords, currentMonth, currentYear, holidays, settings),
    [attendanceRecords, currentMonth, currentYear, holidays, settings]
  );

  // Use notifications hook
  useNotifications(settings.notifications, monthlyReport);

  // Apply recurring patterns to generate records
  useEffect(() => {
    if (recurringPatterns.length === 0) return;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const patternRecords = applyRecurringPatterns(
      recurringPatterns,
      monthStart,
      monthEnd
    );

    // Merge pattern records with existing records (patterns don't override manual entries)
    patternRecords.forEach(patternRecord => {
      const existing = attendanceRecords.find(r => r.date === patternRecord.date);
      if (!existing) {
        addOrUpdateRecord(patternRecord);
      }
    });
  }, [recurringPatterns, currentMonth, currentYear]);

  // Track last processed settings to avoid re-processing
  const lastProcessedSettings = useRef<string>('');

  // Auto-mark holidays when location/state changes
  useEffect(() => {
    const settingsKey = `${settings.location}-${settings.state || ''}`;
    
    // Only process if settings have changed
    if (lastProcessedSettings.current === settingsKey) {
      return;
    }
    
    lastProcessedSettings.current = settingsKey;
    
    const today = startOfDay(new Date());
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const allDays = eachDayOfInterval({ start, end });

    // Get all holidays for current month
    const monthHolidays = getHolidaysForMonth(holidays, currentMonth, currentYear, settings);
    const holidayDates = new Set(monthHolidays.map(h => h.date));

    // Mark holidays that aren't already marked
    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);
      
      // Only mark past and today's holidays
      if (!isAfter(dayStart, today) && holidayDates.has(dateStr)) {
        const existingRecord = attendanceRecords.find(r => r.date === dateStr);
        
        // Only auto-mark if there's no existing record or if it's not already marked as holiday
        if (!existingRecord || existingRecord.type !== 'holiday') {
          const record: AttendanceRecord = {
            date: dateStr,
            type: 'holiday',
          };
          addOrUpdateRecord(record);
        }
      }
    });
  }, [settings.location, settings.state, holidays, currentMonth, currentYear, attendanceRecords, addOrUpdateRecord]);

  // Auto-initialize working days as WFH (default to at home)
  useEffect(() => {
    const today = startOfDay(new Date());
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const allDays = eachDayOfInterval({ start, end });

    // Get all holidays for current month
    const monthHolidays = getHolidaysForMonth(holidays, currentMonth, currentYear, settings);
    const holidayDates = new Set(monthHolidays.map(h => h.date));

    // Initialize working days as WFH that don't already have records
    allDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day);
      
      // Only initialize days that are today or in the past (not future)
      if (!isAfter(dayStart, today)) {
        // Skip weekends and holidays
        if (isWeekend(day) || holidayDates.has(dateStr)) {
          return;
        }

        // Only create WFH record if there's no existing record
        const existingRecord = attendanceRecords.find(r => r.date === dateStr);
        if (!existingRecord) {
          const record: AttendanceRecord = {
            date: dateStr,
            type: 'wfh',
          };
          addOrUpdateRecord(record);
        }
      }
    });
  }, [currentMonth, currentYear, holidays, settings, attendanceRecords, addOrUpdateRecord]);

  const handleDateClick = (date: string, type: AttendanceType) => {
    const record: AttendanceRecord = {
      date,
      type,
    };

    addOrUpdateRecord(record);
  };

  const handleBulkMark = (dates: string[], type: AttendanceType) => {
    bulkMarkRecords(dates, type);
  };


  const handleNotificationSettingsUpdate = (notificationSettings: typeof settings.notifications) => {
    setSettings({
      ...settings,
      notifications: notificationSettings,
    });
  };

  const handleSettingsChange = (newSettings: typeof settings) => {
    setSettings(newSettings);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-anz-blue text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">ANZ RTO Attendance Tracker</h1>
              <p className="text-anz-light-blue mt-2">
                Track your Return to Office compliance - Target: 50%
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm"
              >
                {showSettings ? 'Hide' : 'Show'} Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6 md:space-y-8">
          {/* Settings Panel */}
          {showSettings && (
            <section className="space-y-6">
              <RecurringPatternsList
                patterns={recurringPatterns}
                onAdd={addRecurringPattern}
                onUpdate={updateRecurringPattern}
                onDelete={deleteRecurringPattern}
                onToggle={toggleRecurringPattern}
              />
              <NotificationSettings
                settings={settings.notifications}
                onUpdate={handleNotificationSettingsUpdate}
              />
              <DataBackup
                attendanceRecords={attendanceRecords}
                settings={settings}
                recurringPatterns={recurringPatterns}
                onImport={importData}
              />
            </section>
          )}

          {/* Location Selector */}
          <section>
            <LocationSelector settings={settings} onSettingsChange={handleSettingsChange} />
          </section>

          {/* Dashboard */}
          <section>
            <Dashboard 
              report={monthlyReport}
            />
          </section>

          {/* Calendar */}
          <section>
            <Calendar
              records={attendanceRecords}
              onDateClick={handleDateClick}
              onBulkMark={handleBulkMark}
              holidays={holidays}
              settings={settings}
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Data is stored locally in your browser. Your privacy is protected.
          </p>
        </div>
      </footer>

    </div>
  );
}

function App() {
  const { settings } = useAttendanceStorage();
  const initialTheme = settings.theme || { mode: 'light' };

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;

