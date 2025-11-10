import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Calendar from './Calendar';
import type { AttendanceRecord, HolidayData, UserSettings } from '../../types';

const mockHolidays: HolidayData = {
  '2024': {
    australia: {
      national: [
        { date: '2024-01-01', name: "New Year's Day" },
        { date: '2024-01-26', name: 'Australia Day' },
      ],
      nsw: [
        { date: '2024-06-10', name: "King's Birthday" },
      ],
    },
    bangalore: [
      { date: '2024-01-26', name: 'Republic Day' },
    ],
  },
};

const defaultSettings: UserSettings = {
  location: 'australia',
  state: 'nsw',
  targetPercentage: 50,
};

describe('Calendar Integration Tests', () => {
  let mockOnDateClick: ReturnType<typeof vi.fn>;
  let defaultRecords: AttendanceRecord[];

  beforeEach(() => {
    mockOnDateClick = vi.fn();
    defaultRecords = [];
  });

  it('should render calendar with current month', () => {
    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(new RegExp(monthYear))).toBeInTheDocument();
  });

  it('should display weekday headers', () => {
    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
    expect(screen.getByText('Sun')).toBeInTheDocument();
  });

  it('should navigate to previous month', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    await user.click(prevButton);

    // Wait for month to update
    await waitFor(() => {
      const currentDate = new Date();
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const monthYear = prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(new RegExp(monthYear))).toBeInTheDocument();
    });
  });

  it('should navigate to next month', async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const nextButton = screen.getByLabelText('Next month');
    await user.click(nextButton);

    // Wait for month to update
    await waitFor(() => {
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const monthYear = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(screen.getByText(new RegExp(monthYear))).toBeInTheDocument();
    });
  });

  it('should call onDateClick when a working day is clicked', async () => {
    const user = userEvent.setup();
    // Mock today's date to a known date for testing
    const testDate = new Date('2024-01-15'); // A Monday
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Find and click a working day (not weekend, not holiday)
    const dayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    await user.click(dayButton);

    expect(mockOnDateClick).toHaveBeenCalledWith('2024-01-15', 'office');

    vi.useRealTimers();
  });

  it('should not call onDateClick for weekend days', async () => {
    const user = userEvent.setup();
    const testDate = new Date('2024-01-13'); // A Saturday
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Try to click a Saturday
    const saturdayButton = screen.getByLabelText(/Saturday, January 13, 2024/);
    await user.click(saturdayButton);

    // Should not call onDateClick for weekends
    expect(mockOnDateClick).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should not call onDateClick for holiday days', async () => {
    const user = userEvent.setup();
    const testDate = new Date('2024-01-01'); // New Year's Day (holiday)
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Try to click a holiday
    const holidayButton = screen.getByLabelText(/Monday, January 1, 2024/);
    await user.click(holidayButton);

    // Should not call onDateClick for holidays
    expect(mockOnDateClick).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should not call onDateClick for future dates', async () => {
    const user = userEvent.setup();
    const testDate = new Date('2024-01-15');
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Navigate to next month
    const nextButton = screen.getByLabelText('Next month');
    await user.click(nextButton);

    await waitFor(() => {
      // Try to click a future date (in February)
      const futureDate = screen.getByLabelText(/February/);
      expect(futureDate).toBeInTheDocument();
    });

    // Find a future date button (February 1, 2024)
    const futureButton = screen.getByLabelText(/Thursday, February 1, 2024/);
    if (futureButton) {
      await user.click(futureButton);
      // Should not call onDateClick for future dates
      expect(mockOnDateClick).not.toHaveBeenCalled();
    }

    vi.useRealTimers();
  });

  it('should cycle through attendance types: office -> wfh -> leave -> office', async () => {
    const user = userEvent.setup();
    const testDate = new Date('2024-01-15'); // A Monday
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    const records: AttendanceRecord[] = [];
    let currentRecords = [...records];

    const handleDateClick = vi.fn((date: string, type: AttendanceRecord['type']) => {
      currentRecords = [...currentRecords, { date, type }];
    });

    const { rerender } = render(
      <Calendar
        records={currentRecords}
        onDateClick={handleDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    
    // First click: office
    await user.click(dayButton);
    expect(handleDateClick).toHaveBeenCalledWith('2024-01-15', 'office');

    // Update records and rerender
    currentRecords = [{ date: '2024-01-15', type: 'office' }];
    rerender(
      <Calendar
        records={currentRecords}
        onDateClick={handleDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Second click: wfh
    await user.click(dayButton);
    expect(handleDateClick).toHaveBeenCalledWith('2024-01-15', 'wfh');

    // Update records and rerender
    currentRecords = [{ date: '2024-01-15', type: 'wfh' }];
    rerender(
      <Calendar
        records={currentRecords}
        onDateClick={handleDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Third click: leave
    await user.click(dayButton);
    expect(handleDateClick).toHaveBeenCalledWith('2024-01-15', 'leave');

    // Update records and rerender
    currentRecords = [{ date: '2024-01-15', type: 'leave' }];
    rerender(
      <Calendar
        records={currentRecords}
        onDateClick={handleDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    // Fourth click: back to office
    await user.click(dayButton);
    expect(handleDateClick).toHaveBeenCalledWith('2024-01-15', 'office');

    vi.useRealTimers();
  });

  it('should display office days with correct styling', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-15', type: 'office' },
    ];
    const testDate = new Date('2024-01-15');
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={records}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    expect(dayButton).toHaveClass('bg-anz-blue');
    expect(dayButton).toHaveClass('text-white');

    vi.useRealTimers();
  });

  it('should display WFH days with correct styling', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-15', type: 'wfh' },
    ];
    const testDate = new Date('2024-01-15');
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={records}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    expect(dayButton).toHaveClass('bg-gray-300');

    vi.useRealTimers();
  });

  it('should display leave days with correct styling', () => {
    const records: AttendanceRecord[] = [
      { date: '2024-01-15', type: 'leave', leaveType: 'annual' },
    ];
    const testDate = new Date('2024-01-15');
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={records}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    expect(dayButton).toHaveClass('bg-yellow-400');

    vi.useRealTimers();
  });

  it('should display holiday days with correct styling', () => {
    const testDate = new Date('2024-01-01'); // New Year's Day
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Monday, January 1, 2024/);
    expect(dayButton).toHaveClass('bg-red-200');

    vi.useRealTimers();
  });

  it('should display weekend days with correct styling', () => {
    const testDate = new Date('2024-01-06'); // A Saturday
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const dayButton = screen.getByLabelText(/Saturday, January 6, 2024/);
    expect(dayButton).toHaveClass('bg-gray-100');

    vi.useRealTimers();
  });

  it('should display legend correctly', () => {
    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    expect(screen.getByText('Office')).toBeInTheDocument();
    expect(screen.getByText('WFH')).toBeInTheDocument();
    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    expect(screen.getByText('Other Leave')).toBeInTheDocument();
    expect(screen.getByText('Holiday')).toBeInTheDocument();
    expect(screen.getByText('Weekend')).toBeInTheDocument();
  });

  it('should handle different locations correctly', () => {
    const bangaloreSettings: UserSettings = {
      location: 'bangalore',
      targetPercentage: 50,
    };

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={bangaloreSettings}
      />
    );

    // Calendar should render without errors
    expect(screen.getByText(/January|February|March|April|May|June|July|August|September|October|November|December/)).toBeInTheDocument();
  });

  it('should disable weekend and holiday buttons', () => {
    const testDate = new Date('2024-01-06'); // A Saturday
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const saturdayButton = screen.getByLabelText(/Saturday, January 6, 2024/);
    expect(saturdayButton).toBeDisabled();
    expect(saturdayButton).toHaveClass('cursor-not-allowed');

    vi.useRealTimers();
  });

  it('should highlight today correctly', () => {
    const testDate = new Date('2024-01-15');
    vi.useFakeTimers();
    vi.setSystemTime(testDate);

    render(
      <Calendar
        records={defaultRecords}
        onDateClick={mockOnDateClick}
        holidays={mockHolidays}
        settings={defaultSettings}
      />
    );

    const todayButton = screen.getByLabelText(/Monday, January 15, 2024/);
    expect(todayButton).toHaveClass('ring-2');
    expect(todayButton).toHaveClass('ring-anz-light-blue');

    vi.useRealTimers();
  });
});

