import { useTheme } from '../../contexts/ThemeContext.jsx';

const StatCard = ({ title, value, description, icon: Icon, accent = false }) => {
  const { activeTheme } = useTheme();

  return (
    <div
      className="rounded-[28px] border p-6 shadow-sm transition"
      style={{
        backgroundColor: activeTheme.surface,
        borderColor: activeTheme.border,
        boxShadow: activeTheme.shadowSoft,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{title}</p>
          <p className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{value}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ backgroundColor: accent ? activeTheme.accentSoft : activeTheme.surfaceAlt }}>
          {Icon ? <Icon size={18} color={accent ? activeTheme.accent : activeTheme.textSecondary} /> : null}
        </div>
      </div>
      {description ? <p className="mt-4 text-sm leading-6" style={{ color: activeTheme.textSecondary }}>{description}</p> : null}
    </div>
  );
};

export default StatCard;
