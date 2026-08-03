import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const languageOptions = ['English', 'Japanese', 'Spanish', 'French'];
const colorFields = [
  { key: 'accent', label: 'Accent', description: 'Primary actions and highlights' },
  { key: 'background', label: 'Background', description: 'Page surface color' },
  { key: 'surface', label: 'Surface', description: 'Cards and panels' },
  { key: 'textPrimary', label: 'Text', description: 'Primary typography' },
  { key: 'textSecondary', label: 'Secondary text', description: 'Muted labels and helpers' },
];

const SettingsPage = () => {
  const [language, setLanguage] = useState(() => localStorage.getItem('workpulse-language') || 'English');
  const { mode, setThemeMode, lightTheme, darkTheme, activeTheme, updateThemeColor } = useTheme();
  const themeValues = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [darkTheme, lightTheme, mode]);

  useEffect(() => {
    localStorage.setItem('workpulse-language', language);
  }, [language]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border p-8 shadow-soft backdrop-blur-xl" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadow }}>
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Settings</p>
          <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Application preferences</h1>
          <p className="mt-2" style={{ color: activeTheme.textSecondary }}>Manage your language, theme mode, and the live color palette.</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Language</h2>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Choose the display language for the application UI.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {languageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className="rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition"
                  style={{
                    borderColor: language === option ? activeTheme.accent : activeTheme.border,
                    backgroundColor: language === option ? activeTheme.accentSoft : activeTheme.surface,
                    color: language === option ? activeTheme.accent : activeTheme.textPrimary,
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Theme mode</h2>
                <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Switch between light and dark modes.</p>
              </div>
              <button
                type="button"
                onClick={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
                className="rounded-full border px-5 py-3 text-sm font-semibold transition"
                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
              >
                {mode === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Theme colors</h2>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Adjust the live color palette for the current mode.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {colorFields.map((field) => (
                <label key={field.key} className="rounded-3xl border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{field.label}</p>
                      <p className="mt-1 text-xs" style={{ color: activeTheme.textSecondary }}>{field.description}</p>
                    </div>
                    <input
                      type="color"
                      value={themeValues[field.key]}
                      onChange={(event) => updateThemeColor(mode === 'dark' ? 'dark' : 'light', field.key, event.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
