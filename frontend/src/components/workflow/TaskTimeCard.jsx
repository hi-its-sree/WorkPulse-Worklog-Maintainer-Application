import { motion } from 'framer-motion';

const TaskTimeCard = ({ task, project, hours, category, date, status, completionPercent, accent }) => {
  const normalizedStatus = (status || 'In progress').toString();
  const safePercent = Math.min(100, Math.max(0, Number(completionPercent || 0)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border p-4"
      style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{task}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{project} • {category}</p>
        </div>
        <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: accent || 'var(--accent)' }}>
          {normalizedStatus}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{hours.toFixed(1)}h</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{date}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{safePercent.toFixed(0)}%</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>time spent</p>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full" style={{ backgroundColor: 'var(--surface-secondary)' }}>
        <div className="h-2 rounded-full" style={{ width: `${safePercent}%`, backgroundColor: accent || 'var(--accent)' }} />
      </div>
    </motion.div>
  );
};

export default TaskTimeCard;
