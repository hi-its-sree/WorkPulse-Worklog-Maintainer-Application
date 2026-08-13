import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const defaultThemes = {
  light: {
    accent: '#2563eb',
    accentContrast: '#ffffff',
    background: '#f4f7ff',
    backgroundSecondary: '#ebf2ff',
    surface: '#ffffff',
    surfaceAlt: '#f8fbff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    border: '#dbe3f0',
    success: '#16a34a',
    warning: '#d97706',
    destructive: '#dc2626',
    shadow: '18px 18px 48px rgba(14, 77, 255, 0.08), -14px -14px 42px rgba(255, 255, 255, 0.9)',
    shadowSoft: '0 10px 22px rgba(15, 23, 42, 0.08)',
    shadowGlow: '0 18px 50px rgba(37, 99, 235, 0.18)',
  },
  dark: {
    accent: '#60a5fa',
    accentContrast: '#020617',
    background: '#020617',
    backgroundSecondary: '#081123',
    surface: '#0f172a',
    surfaceAlt: '#111827',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    border: '#334155',
    success: '#34d399',
    warning: '#fbbf24',
    destructive: '#f87171',
    shadow: '18px 18px 50px rgba(0, 0, 0, 0.22), -14px -14px 42px rgba(255, 255, 255, 0.05)',
    shadowSoft: '0 10px 22px rgba(0, 0, 0, 0.18)',
    shadowGlow: '0 18px 50px rgba(96, 165, 250, 0.18)',
  },
};

const readStoredTheme = () => {
  if (typeof window === 'undefined') {
    return { mode: 'light', light: defaultThemes.light, dark: defaultThemes.dark };
  }

  try {
    const storedMode = window.localStorage.getItem('workpulse-theme-mode');
    const storedPrefs = window.localStorage.getItem('workpulse-theme-prefs');
    const parsedPrefs = storedPrefs ? JSON.parse(storedPrefs) : null;

    return {
      mode: storedMode === 'dark' ? 'dark' : 'light',
      light: parsedPrefs?.light || defaultThemes.light,
      dark: parsedPrefs?.dark || defaultThemes.dark,
    };
  } catch {
    return { mode: 'light', light: defaultThemes.light, dark: defaultThemes.dark };
  }
};

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const value = Number.parseInt(full, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => readStoredTheme().mode);
  const [lightTheme, setLightTheme] = useState(() => readStoredTheme().light);
  const [darkTheme, setDarkTheme] = useState(() => readStoredTheme().dark);

  const activeTheme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [darkTheme, lightTheme, mode]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.style.setProperty('--app-bg', activeTheme.background);
    root.style.setProperty('--app-bg-secondary', activeTheme.backgroundSecondary);
    root.style.setProperty('--surface-primary', activeTheme.surface);
    root.style.setProperty('--surface-secondary', activeTheme.surfaceAlt);
    root.style.setProperty('--surface-tertiary', activeTheme.surfaceAlt);
    root.style.setProperty('--text-primary', activeTheme.textPrimary);
    root.style.setProperty('--text-secondary', activeTheme.textSecondary);
    root.style.setProperty('--border-subtle', activeTheme.border);
    root.style.setProperty('--accent', activeTheme.accent);
    root.style.setProperty('--accent-contrast', activeTheme.accentContrast);
    root.style.setProperty('--accent-soft', hexToRgba(activeTheme.accent, 0.12));
    root.style.setProperty('--accent-strong', activeTheme.accent);
    root.style.setProperty('--background', activeTheme.background);
    root.style.setProperty('--background-secondary', activeTheme.backgroundSecondary);
    root.style.setProperty('--card', activeTheme.surface);
    root.style.setProperty('--muted', activeTheme.surfaceAlt);
    root.style.setProperty('--primary', activeTheme.accent);
    root.style.setProperty('--secondary', activeTheme.surfaceAlt);
    root.style.setProperty('--foreground', activeTheme.textPrimary);
    root.style.setProperty('--foreground-muted', activeTheme.textSecondary);
    root.style.setProperty('--border', activeTheme.border);
    root.style.setProperty('--success', activeTheme.success);
    root.style.setProperty('--warning', activeTheme.warning);
    root.style.setProperty('--destructive', activeTheme.destructive);
    root.style.setProperty('--shadow-soft', activeTheme.shadow);
    root.style.setProperty('--shadow-sm', activeTheme.shadowSoft);
    root.style.setProperty('--shadow-glow', activeTheme.shadowGlow);
    root.style.setProperty('--input-bg', activeTheme.surface);
    root.style.setProperty('--input-border', activeTheme.border);
    root.style.setProperty('--banner-overlay', hexToRgba(activeTheme.accent, 0.14));
    root.style.setProperty('color-scheme', mode === 'dark' ? 'dark' : 'light');

    window.localStorage.setItem('workpulse-theme-mode', mode);
    window.localStorage.setItem('workpulse-theme-prefs', JSON.stringify({ light: lightTheme, dark: darkTheme }));
  }, [activeTheme, darkTheme, lightTheme, mode]);

  const setThemeMode = (nextMode) => {
    setMode(nextMode);
  };

  const updateThemeColor = (themeName, key, value) => {
    if (themeName === 'light') {
      setLightTheme((current) => ({ ...current, [key]: value }));
      return;
    }

    setDarkTheme((current) => ({ ...current, [key]: value }));
  };

  const resetTheme = () => {
    setMode('light');
    setLightTheme(defaultThemes.light);
    setDarkTheme(defaultThemes.dark);
  };

  const value = {
    mode,
    setThemeMode,
    lightTheme,
    darkTheme,
    activeTheme,
    updateThemeColor,
    resetTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
