# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**hi-fifty** is an Office Attendance Tracker for ANZ Bank employees to monitor Return to Office (RTO) compliance with the mandatory 50% office attendance requirement.

## Business Context & Critical Rules

### Attendance Calculation Formula
```
Attendance % = (Days in Office / Total Working Days) × 100
Total Working Days = Calendar Days - Weekends - Public Holidays - Leave Days
```

### Critical Business Logic (NEVER violate these)
1. **Weekends are ALWAYS excluded** from working days (even if marked as office)
2. **Public holidays are excluded** and vary by location (Australia vs Bangalore)
3. **Leave days are excluded** from the denominator (annual leave, sick leave, etc.)
4. **50% is the compliance threshold** (configurable via user settings)
5. **Calculations are monthly** - reset each calendar month
6. **Use ISO date format** (YYYY-MM-DD) for ALL date handling
7. **Use local dates, NOT UTC** to avoid timezone issues
8. **Cannot mark attendance for future dates**

## Technical Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (preferred) or Create React App
- **Styling**: Tailwind CSS
- **State Management**: React Context API (simple state) or Zustand (complex)
- **Date Handling**: date-fns (NOT moment.js - bundle size)
- **Calendar**: Custom or @mui/x-date-pickers
- **Charts**: Recharts or Chart.js
- **Storage**: Local Storage initially (JSON format)

## Project Structure

```
src/
├── components/
│   ├── Calendar/          # Monthly calendar view with attendance marking
│   ├── Dashboard/         # Compliance indicator & stats
│   └── common/            # Reusable components (Button, Card, Modal)
├── hooks/
│   ├── useAttendance.ts   # Core attendance logic
│   ├── usePublicHolidays.ts
│   └── useLocalStorage.ts
├── utils/
│   ├── dateHelpers.ts     # Date validation, weekend checking
│   ├── calculations.ts    # Attendance percentage calculations
│   └── constants.ts       # Error messages, enums
├── types/
│   └── index.ts           # TypeScript interfaces
└── data/
    ├── australiaHolidays.json
    └── bangaloreHolidays.json
```

## Key TypeScript Interfaces

```typescript
interface AttendanceRecord {
  date: string; // ISO format: YYYY-MM-DD
  type: 'office' | 'wfh' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'annual' | 'sick' | 'other';
  notes?: string;
}

interface StorageData {
  version: number;
  userData: {
    location: 'australia' | 'bangalore';
    state?: string;
    targetPercentage: number;
  };
  attendanceRecords: AttendanceRecord[];
  lastUpdated: string;
}

const STORAGE_KEY = 'anz_rto_tracker_v1';
```

## Development Commands

This is a new project - no build commands configured yet. When implementing:

**For Vite + React + TypeScript setup:**
```bash
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install date-fns
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
```

**Testing (when implemented):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm test            # Run tests
npm test -- --ui    # Run tests with UI
```

## Code Style Guidelines

### Functional Components & Hooks
```typescript
// Use functional components with TypeScript
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Implementation
};

// Extract business logic to custom hooks
const useAttendanceCalculation = (records: AttendanceRecord[]) => {
  // Calculation logic
};
```

### Constants & Enums
```typescript
// Use const assertions for enums
const AttendanceType = {
  OFFICE: 'office',
  WFH: 'wfh',
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  WEEKEND: 'weekend'
} as const;
```

### Error Messages
```typescript
const ErrorMessages = {
  INVALID_DATE: "Please select a valid date",
  FUTURE_DATE: "Cannot mark attendance for future dates",
  WEEKEND_SELECTION: "Weekends are automatically marked as non-working days",
  SAVE_FAILED: "Failed to save. Your data is stored locally and will retry."
};
```

## Critical Implementation Details

### Date Validation
```typescript
function validateAttendanceEntry(date: string, type: string): ValidationResult {
  if (!isValidDate(date)) return { valid: false, error: ErrorMessages.INVALID_DATE };
  if (isFuture(date)) return { valid: false, error: ErrorMessages.FUTURE_DATE };
  if (isWeekend(date) && type === 'office')
    return { valid: false, error: ErrorMessages.WEEKEND_SELECTION };
  return { valid: true };
}
```

### Attendance Calculation
```typescript
function calculateAttendancePercentage(
  records: AttendanceRecord[],
  month: number,
  year: number
): number {
  const workingDays = getWorkingDaysInMonth(records, month, year);
  const officeDays = records.filter(r => r.type === 'office').length;

  if (workingDays === 0) return 0;
  return Math.round((officeDays / workingDays) * 100);
}
```

### Public Holidays Data Structure
```json
{
  "2024": {
    "australia": {
      "national": [
        { "date": "2024-01-01", "name": "New Year's Day" }
      ],
      "nsw": [
        { "date": "2024-06-10", "name": "Queen's Birthday" }
      ]
    },
    "bangalore": [
      { "date": "2024-01-26", "name": "Republic Day" }
    ]
  }
}
```

## UI/UX Requirements

### Color Palette
- Primary: ANZ Blue `#004165`
- Secondary: ANZ Light Blue `#0074C1`
- Success: Green `#10B981` (≥50% compliance)
- Warning: Amber `#F59E0B` (45-49% compliance)
- Error: Red `#EF4444` (<45% compliance)
- Neutrals: Gray 50 `#F9FAFB`, Gray 900 `#111827`

### Responsive Design
- Mobile-first approach
- Breakpoints: sm(640px), md(768px), lg(1024px), xl(1280px)
- Touch-friendly targets (minimum 44x44px)
- Swipeable calendar on mobile

### Accessibility Requirements
- ARIA labels on all interactive elements
- Keyboard navigation support
- Color contrast ratio minimum 4.5:1
- Visible focus indicators

## Common Pitfalls to Avoid

1. **NEVER count weekends as working days** (even if user marks them)
2. **NEVER use non-ISO date formats** - always YYYY-MM-DD
3. **NEVER use UTC dates** - use local timezone
4. **NEVER allow marking future attendance**
5. **NEVER fetch public holiday data repeatedly** - cache it
6. **NEVER miscalculate month boundaries** in date ranges
7. **NEVER skip input validation** on attendance entries

## Testing Priorities

Focus tests on critical business logic:

```typescript
describe('Attendance Calculation', () => {
  test('excludes weekends from working days', () => {});
  test('excludes public holidays from working days', () => {});
  test('excludes leave days from working days', () => {});
  test('calculates percentage correctly', () => {});
  test('handles edge cases (all leave, all office, no data)', () => {});
  test('rejects future dates', () => {});
  test('handles month boundaries correctly', () => {});
});
```

## Performance Optimizations

- Lazy load calendar months (don't render entire year)
- Memoize expensive calculations with `useMemo`
- Use `React.memo` for pure components (CalendarDay, etc.)
- Debounce user inputs (search, filters)
- Virtual scrolling for historical data lists

## Data Persistence

Local Storage schema with versioning for future migrations:
```typescript
localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
```

Include error handling for quota exceeded and corrupted data.

## Reference Documents

- `.cursorrules`: Contains detailed business requirements, technical preferences, and implementation guidelines
- `prompts/specification.md`: Product specification with user personas, features, and success metrics
- `README.md`: Project name and brief description
