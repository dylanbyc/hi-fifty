import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, parseISO, isAfter, startOfDay } from 'date-fns';
import type { AttendanceRecord, AttendanceType, HolidayData, UserSettings } from '../../types';
import { getDefaultAttendanceType } from '../../utils/calculations';

interface CalendarProps {
  records: AttendanceRecord[];
  onDateClick: (date: string, type: AttendanceType) => void;
  holidays: HolidayData;
  settings: UserSettings;
}

export default function Calendar({ records, onDateClick, holidays, settings }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = startOfDay(new Date());
    
    // Prevent marking future dates
    if (isAfter(date, today)) {
      return;
    }

    const existingRecord = records.find(r => r.date === dateStr);
    const defaultType = getDefaultAttendanceType(dateStr, holidays, settings);
    
    // Cycle through: office -> wfh -> leave -> (if not weekend/holiday) back to office
    let nextType: AttendanceType;
    
    if (existingRecord) {
      if (existingRecord.type === 'office') {
        nextType = 'wfh';
      } else if (existingRecord.type === 'wfh') {
        nextType = 'leave';
      } else if (existingRecord.type === 'leave') {
        nextType = 'office';
      } else {
        // weekend or holiday - can't change
        return;
      }
    } else {
      // No record exists, start with office if it's a working day
      if (defaultType === 'weekend' || defaultType === 'holiday') {
        return;
      }
      nextType = 'office';
    }

    onDateClick(dateStr, nextType);
  };

  const getDayColor = (date: Date): string => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = records.find(r => r.date === dateStr);
    const type = record?.type || getDefaultAttendanceType(dateStr, holidays, settings);
    const today = startOfDay(new Date());
    const dateStart = startOfDay(date);
    const isToday = isSameDay(dateStart, today);
    const isFuture = isAfter(dateStart, today);

    let bgColor = '';
    let textColor = 'text-gray-900';
    let borderColor = '';

    switch (type) {
      case 'office':
        bgColor = 'bg-anz-blue';
        textColor = 'text-white';
        break;
      case 'wfh':
        bgColor = 'bg-gray-300';
        textColor = 'text-gray-900';
        break;
      case 'leave':
        bgColor = 'bg-yellow-400';
        textColor = 'text-gray-900';
        break;
      case 'holiday':
        bgColor = 'bg-red-200';
        textColor = 'text-red-900';
        break;
      case 'weekend':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-500';
        break;
    }

    if (isToday) {
      borderColor = 'ring-2 ring-anz-light-blue ring-offset-2';
    }

    if (isFuture) {
      bgColor = 'bg-gray-50';
      textColor = 'text-gray-400';
    }

    return `${bgColor} ${textColor} ${borderColor}`;
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-anz-blue">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells before month starts */}
        {Array.from({ length: daysBeforeMonth }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {daysInMonth.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const record = records.find(r => r.date === dateStr);
          const type = record?.type || getDefaultAttendanceType(dateStr, holidays, settings);
          const today = startOfDay(new Date());
          const dayStart = startOfDay(day);
          const isToday = isSameDay(dayStart, today);
          const isFuture = isAfter(dayStart, today);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <button
              key={dateStr}
              onClick={() => handleDateClick(day)}
              disabled={isFuture || type === 'weekend' || type === 'holiday'}
              className={`
                aspect-square rounded-lg transition-all
                ${getDayColor(day)}
                ${isFuture || type === 'weekend' || type === 'holiday' 
                  ? 'cursor-not-allowed opacity-60' 
                  : 'cursor-pointer hover:opacity-80 active:scale-95'}
                ${!isCurrentMonth ? 'opacity-50' : ''}
                flex flex-col items-center justify-center text-sm font-medium
                min-h-[44px] md:min-h-[60px]
              `}
              aria-label={`${format(day, 'EEEE, MMMM d, yyyy')} - ${type}`}
            >
              <span>{format(day, 'd')}</span>
              {record && type !== 'weekend' && type !== 'holiday' && (
                <span className="text-xs mt-0.5">
                  {type === 'office' ? '🏢' : type === 'wfh' ? '🏠' : '🏖️'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-anz-blue"></div>
          <span>Office</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-300"></div>
          <span>WFH</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-400"></div>
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-200"></div>
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100"></div>
          <span>Weekend</span>
        </div>
      </div>
    </div>
  );
}

