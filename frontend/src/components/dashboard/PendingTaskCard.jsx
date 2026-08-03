import { useTheme } from '../../contexts/ThemeContext.jsx';
import StatusBadge from './StatusBadge.jsx';

const PendingTaskCard = ({ task }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="rounded-[24px] border p-5 transition hover:-translate-y-1" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, boxShadow: activeTheme.shadowSoft }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{task.title}</p>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Due: {task.due}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>Priority: {task.priority}</span>
        <span>Estimated 2h</span>
      </div>
    </div>
  );
};

export default PendingTaskCard;
