import { useTheme } from '../../contexts/ThemeContext.jsx';

const ReportCard = ({ label, value, detail, accent = 'var(--accent)' }) => {
  const { activeTheme } = useTheme();

  return (
    <div
      className="rounded-[28px] border p-6 shadow-sm"
      style={{
        backgroundColor: activeTheme.surface,
        borderColor: activeTheme.border,
        boxShadow: activeTheme.shadowSoft,
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: activeTheme.textSecondary }}>
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>
        {value}
      </p>
      <p className="mt-2 text-sm" style={{ color: accent }}>
        {detail}
      </p>
    </div>
  );
};

export default ReportCard;
