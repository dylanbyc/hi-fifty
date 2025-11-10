import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, isAfter, startOfDay, parseISO } from 'date-fns';
import type { AttendanceRecord, AttendanceType, HolidayData, UserSettings } from '../../types';
import { getDefaultAttendanceType, getHolidayName } from '../../utils/calculations';
import BulkMarkingModal from '../common/BulkMarkingModal';
import AttendanceTypeModal from '../common/AttendanceTypeModal';

interface CalendarProps {
  records: AttendanceRecord[];
  onDateClick: (date: string, type: AttendanceType) => void;
  onBulkMark: (dates: string[], type: AttendanceType) => void;
  holidays: HolidayData;
  settings: UserSettings;
}

export default function Calendar({ records, onDateClick, onBulkMark, holidays, settings }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month start
  const startDayOfWeek = monthStart.getDay();
  const daysBeforeMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday = 0

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateMouseDown = (date: Date, e: React.MouseEvent) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());
    
    // Prevent marking future dates
    if (isAfter(date, today)) {
      return;
    }

    const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
    
    // Can't select weekends/holidays
    if (defaultType === 'weekend' || defaultType === 'holiday') {
      return;
    }

    // Start drag selection
    setIsDragging(true);
    setDragStartDate(dateStr);
    
    // Toggle selection on initial click
      setSelectedDates(prev => {
        const newSet = new Set(prev);
        if (newSet.has(dateStr)) {
          newSet.delete(dateStr);
        } else {
          newSet.add(dateStr);
        }
        return newSet;
      });
  };

  const handleDateMouseEnter = (date: Date) => {
    if (!isDragging || !dragStartDate) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());
    
    // Prevent marking future dates
    if (isAfter(date, today)) {
      return;
    }

    const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
    
    // Can't select weekends/holidays
    if (defaultType === 'weekend' || defaultType === 'holiday') {
      return;
    }

    // Select all dates between drag start and current
    const startDate = parseISO(dragStartDate);
    const endDate = date;
    const start = startDate < endDate ? startDate : endDate;
    const end = startDate < endDate ? endDate : startDate;
    
    const datesToSelect = eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'));
    
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      datesToSelect.forEach(dateStr => {
        const dayDate = parseISO(dateStr);
        const dayStart = startOfDay(dayDate);
        if (!isAfter(dayStart, today)) {
          const dayType = getDefaultAttendanceType(dateStr, holidays, settings);
          if (dayType !== 'weekend' && dayType !== 'holiday') {
            newSet.add(dateStr);
          }
        }
      });
      return newSet;
    });
  };

  const handleDateMouseUp = () => {
    if (isDragging) {
      setJustFinishedDragging(true);
      setIsDragging(false);
      setDragStartDate(null);
      // Reset flag after a short delay to prevent click from firing
      setTimeout(() => setJustFinishedDragging(false), 100);
    }
  };

  const handleDateClick = (date: Date) => {
    // If we just finished dragging, don't show modal
    if (justFinishedDragging) {
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());
    
    // Prevent marking future dates
    if (isAfter(date, today)) {
      return;
    }

    const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
    
    // Can't change weekends/holidays
    if (defaultType === 'weekend' || defaultType === 'holiday') {
      return;
    }

    // If we have selected dates and clicked on one of them, show modal for that specific date
    if (selectedDates.size > 0 && selectedDates.has(dateStr)) {
      setSelectedDateForModal(dateStr);
      setShowAttendanceModal(true);
      return;
    }

    // If we have selected dates but clicked on a different date, clear selection and show modal for new date
    if (selectedDates.size > 0 && !selectedDates.has(dateStr)) {
      setSelectedDates(new Set());
      setSelectedDateForModal(dateStr);
      setShowAttendanceModal(true);
      return;
    }

    // If no dates selected, show modal for single date
    if (selectedDates.size === 0) {
    setSelectedDateForModal(dateStr);
    setShowAttendanceModal(true);
    }
  };

  const handleAttendanceSelect = (type: AttendanceType) => {
    if (selectedDateForModal) {
      onDateClick(selectedDateForModal, type);
      setSelectedDates(new Set());
    }
  };

  const handleBulkApply = (type: AttendanceType) => {
    const datesArray = Array.from(selectedDates);
    onBulkMark(datesArray, type);
    setSelectedDates(new Set());
    setShowBulkModal(false);
  };

  const handleClearSelection = () => {
    setSelectedDates(new Set());
    setShowBulkModal(false);
  };

  // Cycle through attendance types: wfh -> office -> leave -> wfh
  const cycleAttendanceType = (currentType: AttendanceType | null | undefined): AttendanceType => {
    if (!currentType || currentType === 'weekend' || currentType === 'holiday') {
      return 'wfh'; // Start with WFH if unselected or invalid
    }
    
    switch (currentType) {
      case 'wfh':
        return 'office';
      case 'office':
        return 'leave';
      case 'leave':
        return 'wfh';
      default:
        return 'wfh';
    }
  };

  const handleDayKeyDown = (date: Date, e: React.KeyboardEvent) => {
    // Handle Shift+Tab to cycle through attendance types
    // If days are selected, let the global handler take over
    if (e.shiftKey && e.key === 'Tab') {
      if (selectedDates.size > 0) {
        // Let the global handler process selected days
        return;
      }
      
      e.preventDefault(); // Prevent default tab behavior
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const today = startOfDay(new Date());
      const dayStart = startOfDay(date);
      
      // Prevent marking future dates
      if (isAfter(dayStart, today)) {
        return;
      }

      const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
      
      // Can't change weekends/holidays
      if (defaultType === 'weekend' || defaultType === 'holiday') {
        return;
      }

      // Get current type: use record type if exists, otherwise null (unselected working day)
      const record = records.find(r => r.date === dateStr);
      const currentType = record?.type || null;
      const nextType = cycleAttendanceType(currentType);
      
      onDateClick(dateStr, nextType);
    }
  };

  const getDayColor = (date: Date): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = records.find(r => r.date === dateStr);
    const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
    const type = record?.type || defaultType;
    const today = startOfDay(new Date());
    const dateStart = startOfDay(date);
    const isToday = isSameDay(dateStart, today);
    const isFuture = isAfter(dateStart, today);
    const isUnselected = !record && defaultType === null; // No record and not weekend/holiday

    let bgColor = '';
    let textColor = 'text-gray-900 dark:text-gray-100';
    let borderColor = 'border border-gray-200 dark:border-gray-700';

    if (isUnselected) {
      // Unselected working days - prompt user to select
      bgColor = 'bg-amber-50 dark:bg-amber-900/20';
      textColor = 'text-amber-800 dark:text-amber-300';
      borderColor = 'border-2 border-amber-300 dark:border-amber-600 border-dashed';
    } else {
      switch (type) {
        case 'office':
          bgColor = 'bg-anz-blue dark:bg-anz-light-blue';
          textColor = 'text-white';
          borderColor = 'border-2 border-anz-blue dark:border-anz-light-blue';
          break;
        case 'wfh':
          bgColor = 'bg-purple-100 dark:bg-purple-900/40';
          textColor = 'text-purple-800 dark:text-purple-300';
          borderColor = 'border-2 border-purple-300 dark:border-purple-600';
          break;
        case 'leave':
          bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
          textColor = 'text-yellow-800 dark:text-yellow-300';
          borderColor = 'border-2 border-yellow-300 dark:border-yellow-600';
          break;
        case 'holiday':
          bgColor = 'bg-red-50 dark:bg-red-900/20';
          textColor = 'text-red-700 dark:text-red-400';
          borderColor = 'border-2 border-red-200 dark:border-red-700';
          break;
        case 'weekend':
          bgColor = 'bg-gray-200 dark:bg-gray-800';
          textColor = 'text-gray-500 dark:text-gray-500';
          borderColor = 'border-2 border-gray-300 dark:border-gray-700 border-dashed';
          break;
      }
    }

    if (isToday) {
      borderColor = 'border-2 border-anz-light-blue dark:border-anz-light-blue ring-2 ring-anz-light-blue/30';
    }

    if (isFuture) {
      // If it's a future weekend, make it even more greyed out
      if (type === 'weekend') {
        bgColor = 'bg-gray-200 dark:bg-gray-800';
        textColor = 'text-gray-300 dark:text-gray-600';
        borderColor = 'border-2 border-gray-300 dark:border-gray-700 border-dashed';
      } else {
        bgColor = 'bg-gray-50 dark:bg-gray-800/30';
        textColor = 'text-gray-400 dark:text-gray-600';
        borderColor = 'border border-gray-200 dark:border-gray-700';
      }
    }

    return `${bgColor} ${textColor} ${borderColor}`;
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Handle mouse up globally to end drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setJustFinishedDragging(true);
        setIsDragging(false);
        setDragStartDate(null);
        // Reset flag after a short delay to prevent click from firing
        setTimeout(() => setJustFinishedDragging(false), 100);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDragging]);

  // Handle Shift+Tab globally to cycle attendance types for selected days
  // Handle Escape key to deselect all selected days
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check if we're not in an input field or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return; // Don't interfere with normal text input
      }

      // Handle Escape key to deselect all selected days
      if (e.key === 'Escape' && selectedDates.size > 0) {
        e.preventDefault();
        setSelectedDates(new Set());
        // Blur any focused element to prevent outline
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Handle Shift+Tab to cycle attendance types for selected days
      if (e.shiftKey && e.key === 'Tab' && selectedDates.size > 0) {
        e.preventDefault(); // Prevent default tab behavior

        const today = startOfDay(new Date());
        const datesToUpdate: { date: string; type: AttendanceType }[] = [];

        // Process each selected date
        selectedDates.forEach(dateStr => {
          const dayDate = parseISO(dateStr);
          const dayStart = startOfDay(dayDate);
          
          // Skip future dates
          if (isAfter(dayStart, today)) {
            return;
          }

          const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
          
          // Skip weekends and holidays
          if (defaultType === 'weekend' || defaultType === 'holiday') {
            return;
          }

          // Get current type and cycle to next
          const record = records.find(r => r.date === dateStr);
          const currentType = record?.type || null;
          const nextType = cycleAttendanceType(currentType);
          
          datesToUpdate.push({ date: dateStr, type: nextType });
        });

        // Update all selected days at once
        if (datesToUpdate.length > 0) {
          datesToUpdate.forEach(({ date, type }) => {
            onDateClick(date, type);
          });
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }
  }, [selectedDates, records, holidays, settings, onDateClick]);

  return (
    <div 
      ref={calendarRef}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 outline-none focus:outline-none"
      tabIndex={-1}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-anz-blue dark:text-anz-light-blue">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
      </div>

      {/* Selection Indicator - Compact version at top */}
      {selectedDates.size > 0 && (
        <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
            {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 md:gap-3">
        {/* Empty cells before month starts */}
        {Array.from({ length: daysBeforeMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const record = records.find(r => r.date === dateStr);
          const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
          const type = record?.type || defaultType;
          const today = startOfDay(new Date());
          const dayStart = startOfDay(day);
          const isFuture = isAfter(dayStart, today);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const holidayName = type === 'holiday' ? getHolidayName(dateStr, holidays, settings) : null;
          const isUnselected = !record && defaultType === null;

          const isSelected = selectedDates.has(dateStr);
          const canSelect = !isFuture && type !== 'weekend' && type !== 'holiday';

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              onMouseDown={(e) => canSelect && handleDateMouseDown(day, e)}
              onMouseEnter={() => canSelect && handleDateMouseEnter(day)}
              onMouseUp={handleDateMouseUp}
              onKeyDown={(e) => canSelect && handleDayKeyDown(day, e)}
              disabled={isFuture || type === 'weekend' || type === 'holiday'}
              title={holidayName || (isUnselected ? `${format(day, 'EEEE, MMMM d, yyyy')} - Click to select or use Shift+Tab to cycle` : (type ? `${format(day, 'EEEE, MMMM d, yyyy')} - ${type} (Shift+Tab to cycle)` : `${format(day, 'EEEE, MMMM d, yyyy')} - Click to select or use Shift+Tab to cycle`))}
              className={`
                aspect-square rounded-lg transition-all relative group
                ${getDayColor(day)}
                ${isSelected ? 'ring-4 ring-blue-500 dark:ring-blue-400 ring-offset-1 dark:ring-offset-gray-800 shadow-lg scale-105 z-10' : 'shadow-sm hover:shadow-md'}
                ${canSelect
                  ? 'cursor-pointer hover:scale-105 active:scale-95'
                  : 'cursor-not-allowed'}
                ${!isCurrentMonth ? 'opacity-40' : ''}
                ${type === 'weekend' ? 'grayscale brightness-90' : ''}
                ${isDragging && canSelect ? 'select-none' : ''}
                flex flex-col items-center justify-center
                min-h-[48px] md:min-h-[64px]
                font-semibold
                ${type === 'weekend' ? 'relative' : ''}
              `}
              aria-label={holidayName ? `${format(day, 'EEEE, MMMM d, yyyy')} - ${holidayName}${isSelected ? ' - Selected' : ''}` : (isUnselected ? `${format(day, 'EEEE, MMMM d, yyyy')} - Click to select or press Shift+Tab to cycle${isSelected ? ' - Selected' : ''}` : `${format(day, 'EEEE, MMMM d, yyyy')} - ${type}. Press Shift+Tab to cycle${isSelected ? ' - Selected' : ''}`)}
            >
              {type === 'weekend' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-full h-0.5 bg-gray-400 dark:bg-gray-500 transform rotate-45 opacity-50"></div>
                </div>
              )}
              <span className={`text-sm md:text-base font-semibold ${type === 'weekend' ? 'relative z-10 text-gray-600 dark:text-gray-400' : ''}`}>{format(day, 'd')}</span>
              {isUnselected && (
                <span className="text-xs md:text-sm mt-0.5 leading-none text-amber-600 dark:text-amber-400 font-medium">
                  ?
                </span>
              )}
              {record && type !== 'weekend' && type !== 'holiday' && (
                <span className="text-base md:text-lg mt-0.5 leading-none">
                  {type === 'office' ? '🏢' : type === 'wfh' ? '🏠' : '🏖️'}
                </span>
              )}
              {holidayName && (
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-lg">
                  {holidayName}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Floating Action Bar - Appears when days are selected */}
      {selectedDates.size > 0 && (
        <div className="mt-4 mb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-400 dark:border-blue-500 rounded-lg shadow-lg p-4 z-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleClearSelection}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline font-medium"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <button
                onClick={() => {
                  if (selectedDates.size > 0) {
                    onBulkMark(Array.from(selectedDates), 'wfh');
                    setSelectedDates(new Set());
                  }
                }}
                className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-600"
                title="Mark as Work From Home"
              >
                <span className="text-lg">🏠</span>
                <span>WFH</span>
              </button>
              <button
                onClick={() => {
                  if (selectedDates.size > 0) {
                    onBulkMark(Array.from(selectedDates), 'office');
                    setSelectedDates(new Set());
                  }
                }}
                className="px-4 py-2.5 bg-anz-blue text-white rounded-lg hover:bg-anz-light-blue transition-all text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                title="Mark as At Office"
              >
                <span className="text-lg">🏢</span>
                <span>Office</span>
              </button>
              <button
                onClick={() => {
                  if (selectedDates.size > 0) {
                    onBulkMark(Array.from(selectedDates), 'leave');
                    setSelectedDates(new Set());
                  }
                }}
                className="px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-sm font-semibold shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-600 flex items-center gap-2"
                title="Mark as Leave"
              >
                <span className="text-lg">🏖️</span>
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-6 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-anz-blue"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">At office</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-purple-300 dark:bg-purple-600"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">At home</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-300 dark:bg-amber-600 border-2 border-amber-400 dark:border-amber-500 border-dashed"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Not selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-yellow-400"></div>
            <span className="font-medium text-gray-700 dark:text-gray-300">On leave</span>
          </div>
        </div>
        {/* Keyboard Shortcut Hint */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Tip:</span>
          <span>Select day(s) and press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">Shift+Tab</kbd> to cycle through WFH → Office → Leave</span>
        </div>
      </div>

      {/* Bulk Marking Modal */}
      <BulkMarkingModal
        isOpen={showBulkModal}
        onClose={handleClearSelection}
        selectedDates={Array.from(selectedDates)}
        onApply={handleBulkApply}
      />

      {/* Attendance Type Selection Modal */}
      {selectedDateForModal && (
        <AttendanceTypeModal
          isOpen={showAttendanceModal}
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedDateForModal(null);
          }}
          selectedDate={selectedDateForModal}
          currentType={records.find(r => r.date === selectedDateForModal)?.type}
          onSelect={handleAttendanceSelect}
        />
      )}
    </div>
  );
}

