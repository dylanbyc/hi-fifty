import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { ThemeSettings } from '../types';

interface ThemeContextType {
  theme: ThemeSettings;
  setTheme: (theme: ThemeSettings) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, initialTheme }: { children: ReactNode; initialTheme?: ThemeSettings }) {
  const [theme, setThemeState] = useState<ThemeSettings>(
    initialTheme || { mode: 'light' }
  );
  const [isDark, setIsDark] = useState(theme.mode === 'dark');

  useEffect(() => {
    const dark = theme.mode === 'dark';
    setIsDark(dark);

    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme.mode]);

  const setTheme = (newTheme: ThemeSettings) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

