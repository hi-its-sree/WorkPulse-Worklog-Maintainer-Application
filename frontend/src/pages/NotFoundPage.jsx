import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const NotFoundPage = () => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="app-card p-12 text-center">
        <h1 className="text-4xl font-semibold" style={{ color: activeTheme.textPrimary }}>404</h1>
        <p className="mt-4" style={{ color: activeTheme.textSecondary }}>{strings.notFound.message}</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
