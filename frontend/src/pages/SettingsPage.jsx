import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const colorFieldKeys = ['accent', 'background', 'surface', 'textPrimary', 'textSecondary'];

const SettingsPage = () => {
  const { mode, setThemeMode, lightTheme, darkTheme, activeTheme, updateThemeColor, resetTheme } = useTheme();
  const { language, setLanguage, languageOptions, strings } = useLanguage();
  const { settings: settingsStrings } = strings;
  const themeValues = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [darkTheme, lightTheme, mode]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border p-8 shadow-soft backdrop-blur-xl" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadow }}>
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{settingsStrings.settingsLabel}</p>
          <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.pageTitle}</h1>
          <p className="mt-2" style={{ color: activeTheme.textSecondary }}>{settingsStrings.pageDescription}</p>
        </div>

        <div className="space-y-8">
          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.languageTitle}</h2>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{settingsStrings.languageDescription}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {languageOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setLanguage(option.key)}
                  className="rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition min-w-0"
                  style={{
                    borderColor: language === option.key ? activeTheme.accent : activeTheme.border,
                    backgroundColor: language === option.key ? activeTheme.accentSoft : activeTheme.surface,
                    color: language === option.key ? activeTheme.accent : activeTheme.textPrimary,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.themeTitle}</h2>
                <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{settingsStrings.themeDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
                className="rounded-full border px-5 py-3 text-sm font-semibold transition"
                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
              >
                {mode === 'dark' ? settingsStrings.lightMode : settingsStrings.darkMode}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.themeColorsTitle}</h2>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{settingsStrings.themeColorsDescription}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {colorFieldKeys.map((key) => (
                <label key={key} className="rounded-3xl border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.colors[key].label}</p>
                      <p className="mt-1 text-xs" style={{ color: activeTheme.textSecondary }}>{settingsStrings.colors[key].description}</p>
                    </div>
                    <input
                      type="color"
                      value={themeValues[key]}
                      onChange={(event) => updateThemeColor(mode === 'dark' ? 'dark' : 'light', key, event.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-full border-0 bg-transparent p-0"
                    />
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{settingsStrings.resetTheme}</p>
                <p className="mt-1 text-xs" style={{ color: activeTheme.textSecondary }}>{settingsStrings.resetThemeDescription}</p>
              </div>
              <button
                type="button"
                onClick={resetTheme}
                className="rounded-full border px-5 py-3 text-sm font-semibold transition"
                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
              >
                {settingsStrings.resetTheme}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
