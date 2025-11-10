# ANZ RTO Attendance Tracker - Product Specification

## Executive Summary
A web-based application to help ANZ Bank employees track their Return to Office (RTO) attendance, ensuring compliance with the 50% office attendance requirement while accounting for leave days and public holidays.

## Problem Statement
ANZ Bank employees are required to maintain 50% office attendance, but:
- Monthly attendance reports are only visible to managers
- Employees cannot track their real-time compliance status
- Leave days and public holidays complicate calculations
- No visibility into whether they're on track to meet requirements

## Solution Overview
A simple, professional attendance tracking application that:
- Logs office attendance days
- Calculates accurate attendance percentages
- Excludes non-working days from calculations
- Provides real-time compliance status
- Projects future attendance requirements

## User Personas
**Primary User:** ANZ Bank Employee
- Needs to track office attendance
- Works in Australia or Bangalore
- Wants visibility into compliance status
- Needs projections for remaining month

## Core Features

### 1. Attendance Logging
- **Daily attendance marking**: Simple toggle/button to mark office days
- **Calendar view**: Visual monthly calendar showing:
  - Office days (marked distinctly)
  - Work from home days
  - Annual leave
  - Sick leave
  - Public holidays
- **Quick entry**: Bulk mark multiple days at once
- **Edit history**: Modify past entries within current month

### 2. Leave Management
- **Leave types**: 
  - Annual leave
  - Sick leave
  - Other approved leave
- **Leave entry**: Simple form to add leave periods
- **Leave visualization**: Clear indication on calendar

### 3. Public Holiday Integration
- **Dual location support**:
  - Australian public holidays (state-specific)
  - Bangalore, India public holidays
- **Automatic marking**: Public holidays auto-populated
- **Holiday visibility**: Clearly distinguished on calendar

### 4. Attendance Calculation Engine
- **Formula**: 
  ```
  Attendance % = (Days in Office / Total Working Days) × 100
  Where: Total Working Days = Month Days - (Weekends + Public Holidays + Leave Days)
  ```
- **Real-time calculation**: Updates immediately upon data entry
- **Month-to-date view**: Current percentage based on elapsed days
- **Full month projection**: Expected percentage if current pattern continues

### 5. Compliance Dashboard
- **Current status indicator**:
  - Green: On track (≥50%)
  - Amber: Close to target (45-49%)
  - Red: Below target (<45%)
- **Days required**: Clear display of additional office days needed
- **Remaining working days**: Count of available days to meet target
- **Projection**: "If you attend X more days, you'll reach Y%"

### 6. Reports & Analytics
- **Monthly summary**: 
  - Total office days
  - Total WFH days
  - Total leave days
  - Final percentage
- **Trend visualization**: Line graph showing attendance over months
- **Export capability**: Download monthly report as PDF/CSV

## Technical Requirements

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Tailwind CSS for styling
- **State Management**: React Context API or Zustand
- **Calendar Component**: react-calendar or custom implementation
- **Charts**: Chart.js or Recharts for visualizations
- **Responsive Design**: Mobile-first approach

### Backend/Storage
- **Initial Phase**: Local Storage (browser-based)
- **Future Phase**: Optional backend API with database
- **Data Structure**: JSON format for easy manipulation

### Key Data Models

```typescript
interface AttendanceDay {
  date: string; // ISO date format
  type: 'office' | 'wfh' | 'leave' | 'holiday' | 'weekend';
  leaveType?: 'annual' | 'sick' | 'other';
  notes?: string;
}

interface MonthlyReport {
  month: string;
  year: number;
  officeDays: number;
  wfhDays: number;
  leaveDays: number;
  holidays: number;
  totalWorkingDays: number;
  attendancePercentage: number;
  isCompliant: boolean;
}

interface UserSettings {
  location: 'australia' | 'bangalore';
  state?: string; // For Australian users
  targetPercentage: number; // Default 50
  reminderEnabled: boolean;
}
```

## User Interface Design Principles

### Visual Design
- **Color Scheme**: Professional, corporate-friendly
  - Primary: ANZ Blue (#004165)
  - Success: Green (#10B981)
  - Warning: Amber (#F59E0B)
  - Error: Red (#EF4444)
- **Typography**: Clean, readable fonts (Inter, Roboto)
- **Layout**: Uncluttered, focused on key information

### User Experience
- **Simplicity**: Maximum 2 clicks to any feature
- **Clarity**: Clear visual indicators for all states
- **Feedback**: Immediate response to user actions
- **Accessibility**: WCAG 2.1 AA compliance

## User Flows

### Initial Setup
1. User opens app for first time
2. Select location (Australia/Bangalore)
3. If Australia, select state
4. Set target percentage (default 50%)
5. View quick tutorial

### Daily Usage
1. Open app
2. View dashboard with current status
3. Click today's date
4. Mark as Office/WFH/Leave
5. View updated percentage
6. Check days needed (if below target)

### Monthly Review
1. Navigate to Reports
2. Select month
3. View detailed breakdown
4. Export if needed

## Success Metrics
- User can determine compliance status in <5 seconds
- 100% accuracy in percentage calculations
- Zero confusion about days needed to meet target
- Reduced end-of-month surprises by 90%

## Future Enhancements
- Team view for managers
- Integration with ANZ systems
- Automated reminders
- Mobile app version
- Historical data analysis
- Predictive analytics

## Launch Strategy
1. **Phase 1**: MVP with core features (local storage)
2. **Phase 2**: Add public holiday API integration
3. **Phase 3**: User accounts and data persistence
4. **Phase 4**: Team features and analytics

## Constraints & Assumptions
- No access to official ANZ attendance systems
- Users self-report attendance
- 50% target is fixed (configurable for future)
- Working days are Monday-Friday
- Public holidays are non-negotiable non-working days