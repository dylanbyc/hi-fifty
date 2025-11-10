# ANZ RTO Attendance Tracker

A React TypeScript application for tracking Return to Office (RTO) attendance for ANZ Bank employees. Helps employees ensure they meet the 50% office attendance requirement.

## Features

- 📅 Interactive calendar to mark daily attendance (Office/WFH/Leave)
- 📊 Real-time dashboard showing attendance percentage and compliance status
- 🎯 Automatic calculation of days needed to reach 50% target
- 📱 Mobile-responsive design
- 💾 Local storage for data persistence
- 🏖️ Automatic holiday detection (Australia & Bangalore)
- 📈 End-of-month projections

## Tech Stack

- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- date-fns for date handling
- Local Storage for data persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Mark Attendance**: Click on any date in the calendar to cycle through attendance types:
   - 🏢 Office (Blue)
   - 🏠 WFH (Gray)
   - 🏖️ Leave (Yellow)

2. **View Status**: The dashboard shows:
   - Current attendance percentage with color-coded status
   - Days in office vs total working days
   - Days needed to reach 50% target
   - End-of-month projection

3. **Data Storage**: All data is stored locally in your browser. No data is sent to any server.

## Project Structure

```
src/
├── components/
│   ├── Calendar/
│   │   └── Calendar.tsx
│   └── Dashboard/
│       └── Dashboard.tsx
├── hooks/
│   └── useLocalStorage.ts
├── utils/
│   └── calculations.ts
├── types/
│   └── index.ts
└── data/
    └── holidays.json
```

## Business Logic

- **Working Days**: Excludes weekends, public holidays, and leave days
- **Target**: 50% office attendance
- **Calculation**: `Attendance % = (Days in Office / Total Working Days) × 100`
- **Holidays**: Automatically detected based on location (Australia/Bangalore)

## License

Internal tool for ANZ Bank employees.
