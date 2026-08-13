import { useTheme } from '../../contexts/ThemeContext.jsx';

const InsightCard = ({ label, value, description, icon: Icon }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="rounded-[28px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{label}</p>
        {Icon ? <Icon size={18} color={activeTheme.accent} /> : null}
      </div>
      <p className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{value}</p>
      <p className="mt-3 text-sm leading-6" style={{ color: activeTheme.textSecondary }}>{description}</p>
    </div>
  );
};

export default InsightCard;
