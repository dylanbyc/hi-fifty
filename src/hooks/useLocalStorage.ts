import { useState, useEffect } from 'react';
import type { AttendanceRecord, UserSettings, RecurringPattern } from '../types';
import { STORAGE_KEY } from '../utils/constants';

interface StorageData {
  version: number;
  userData: UserSettings;
  attendanceRecords: AttendanceRecord[];
  recurringPatterns?: RecurringPattern[];
  lastUpdated: string;
}

const defaultSettings: UserSettings = {
  location: 'australia',
  state: 'nsw',
  targetPercentage: 50,
};

const defaultStorageData: StorageData = {
  version: 1,
  userData: defaultSettings,
  attendanceRecords: [],
  lastUpdated: new Date().toISOString(),
};

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

export function useAttendanceStorage() {
  const [storageData, setStorageData] = useLocalStorage<StorageData>(
    STORAGE_KEY,
    defaultStorageData
  );

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(
    storageData.attendanceRecords || []
  );

  const [settings, setSettings] = useState<UserSettings>(storageData.userData);
  
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>(
    storageData.recurringPatterns || []
  );

  // Sync with localStorage
  useEffect(() => {
    setStorageData({
      version: 1,
      attendanceRecords,
      userData: settings,
      recurringPatterns,
      lastUpdated: new Date().toISOString(),
    });
  }, [attendanceRecords, settings, recurringPatterns, setStorageData]);

  const addOrUpdateRecord = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => r.date !== record.date);
      return [...filtered, record].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const bulkMarkRecords = (dates: string[], type: AttendanceRecord['type']) => {
    const newRecords: AttendanceRecord[] = dates.map(date => {
      const record: AttendanceRecord = { date, type };
      return record;
    });

    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !dates.includes(r.date));
      return [...filtered, ...newRecords].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeRecord = (date: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.date !== date));
  };

  const getRecord = (date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(r => r.date === date);
  };

  const addRecurringPattern = (pattern: Omit<RecurringPattern, 'id'>) => {
    const newPattern: RecurringPattern = {
      ...pattern,
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setRecurringPatterns(prev => [...prev, newPattern]);
  };

  const updateRecurringPattern = (id: string, pattern: Omit<RecurringPattern, 'id'>) => {
    setRecurringPatterns(prev =>
      prev.map(p => (p.id === id ? { ...pattern, id } : p))
    );
  };

  const deleteRecurringPattern = (id: string) => {
    setRecurringPatterns(prev => prev.filter(p => p.id !== id));
  };

  const toggleRecurringPattern = (id: string, enabled: boolean) => {
    setRecurringPatterns(prev =>
      prev.map(p => (p.id === id ? { ...p, enabled } : p))
    );
  };

  const importData = (data: {
    attendanceRecords: AttendanceRecord[];
    settings: UserSettings;
    recurringPatterns?: RecurringPattern[];
  }) => {
    setAttendanceRecords(data.attendanceRecords || []);
    setSettings(data.settings);
    setRecurringPatterns(data.recurringPatterns || []);
  };

  return {
    attendanceRecords,
    settings,
    setSettings,
    recurringPatterns,
    addOrUpdateRecord,
    bulkMarkRecords,
    removeRecord,
    getRecord,
    addRecurringPattern,
    updateRecurringPattern,
    deleteRecurringPattern,
    toggleRecurringPattern,
    importData,
  };
}

