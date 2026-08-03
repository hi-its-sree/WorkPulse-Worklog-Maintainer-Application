import { useTheme } from '../../contexts/ThemeContext.jsx';

const StatCard = ({ title, value, accent }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="rounded-[32px] p-6 shadow-soft transition hover:-translate-y-1" style={{ backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadow }}>
      <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{title}</p>
      <p className={`mt-4 text-3xl font-semibold ${accent || ''}`} style={{ color: accent ? accent : activeTheme.textPrimary }}>{value}</p>
    </div>
  );
};

export default StatCard;
