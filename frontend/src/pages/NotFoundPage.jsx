import { useTheme } from '../contexts/ThemeContext.jsx';

const NotFoundPage = () => {
  const { activeTheme } = useTheme();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="app-card p-12 text-center">
        <h1 className="text-4xl font-semibold" style={{ color: activeTheme.textPrimary }}>404</h1>
        <p className="mt-4" style={{ color: activeTheme.textSecondary }}>Page not found. Please use the navigation menu.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;
