import { motion } from 'framer-motion';

const OvertimeCard = ({ regularHours, overtimeHours, totalHours, targetHours, remainingHours }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border p-5"
      style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Overtime overview</p>
          <p className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Target {targetHours}h / week</p>
        </div>
        <div className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: overtimeHours > 0 ? 'var(--warning)' : 'var(--success)' }}>
          {overtimeHours > 0 ? `${overtimeHours.toFixed(1)}h over` : 'On target'}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border p-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Regular</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{regularHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-[20px] border p-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Overtime</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{overtimeHours.toFixed(1)}h</p>
        </div>
        <div className="rounded-[20px] border p-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Remaining</p>
          <p className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{remainingHours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border p-4" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Total logged</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalHours.toFixed(1)}h</span>
        </div>
      </div>
    </motion.div>
  );
};

export default OvertimeCard;
