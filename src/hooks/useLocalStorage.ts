import { useState, useEffect } from 'react';
import type { AttendanceRecord, UserSettings } from '../types';
import { STORAGE_KEY } from '../utils/constants';

interface StorageData {
  version: number;
  userData: UserSettings;
  attendanceRecords: AttendanceRecord[];
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
    storageData.attendanceRecords
  );

  const [settings, setSettings] = useState<UserSettings>(storageData.userData);

  // Sync with localStorage
  useEffect(() => {
    setStorageData({
      version: 1,
      attendanceRecords,
      userData: settings,
      lastUpdated: new Date().toISOString(),
    });
  }, [attendanceRecords, settings, setStorageData]);

  const addOrUpdateRecord = (record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => r.date !== record.date);
      return [...filtered, record].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeRecord = (date: string) => {
    setAttendanceRecords(prev => prev.filter(r => r.date !== date));
  };

  const getRecord = (date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(r => r.date === date);
  };

  return {
    attendanceRecords,
    settings,
    setSettings,
    addOrUpdateRecord,
    removeRecord,
    getRecord,
  };
}

