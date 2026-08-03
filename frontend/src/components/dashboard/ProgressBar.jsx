import { useTheme } from '../../contexts/ThemeContext.jsx';

const ProgressBar = ({ value, className = '', color }) => {
  const { activeTheme } = useTheme();

  return (
    <div className={`h-2.5 overflow-hidden rounded-full ${className}`} style={{ backgroundColor: activeTheme.surfaceAlt }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.max(4, value)}%`, backgroundColor: color || activeTheme.accent }}
      />
    </div>
  );
};

export default ProgressBar;
