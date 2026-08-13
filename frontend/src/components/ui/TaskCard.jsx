import { useTheme } from '../../contexts/ThemeContext.jsx';

const TaskCard = ({ title, project, planned, status }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="rounded-3xl border p-5 shadow-sm" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadowSoft }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{title}</p>
          <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{project}</p>
        </div>
        <span className="rounded-full px-3 py-1 text-sm" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{status}</span>
      </div>
      <p className="mt-4 text-sm" style={{ color: activeTheme.textSecondary }}>Planned: {planned} minutes</p>
    </div>
  );
};

export default TaskCard;
