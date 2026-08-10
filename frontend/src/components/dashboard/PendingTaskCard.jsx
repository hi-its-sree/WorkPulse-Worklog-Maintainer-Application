import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import StatusBadge from './StatusBadge.jsx';

const PendingTaskCard = ({ task }) => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();

  return (
    <div className="rounded-[24px] border p-5 transition hover:-translate-y-1" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, boxShadow: activeTheme.shadowSoft }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{task.title}</p>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{task.statusLabel || task.status}</p>
          <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{task.due}</p>
        </div>
        <StatusBadge status={task.status} label={task.statusLabel} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>{strings.dashboard.pendingTaskPriorityLabel}: {task.priority}</span>
        <span>{strings.dashboard.pendingTaskEstimateLabel}: {task.estimate}</span>
      </div>
    </div>
  );
};

export default PendingTaskCard;
