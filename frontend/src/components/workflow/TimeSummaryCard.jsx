import { motion } from 'framer-motion';

const TimeSummaryCard = ({ title, value, subtitle, icon: Icon, accent }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border p-5"
      style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{title}</p>
          <p className="mt-3 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {subtitle ? <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p> : null}
        </div>
        <div className="rounded-2xl p-3" style={{ backgroundColor: accent ? `${accent}18` : 'var(--accent-soft)', color: accent || 'var(--accent)' }}>
          {Icon ? <Icon size={18} /> : null}
        </div>
      </div>
    </motion.div>
  );
};

export default TimeSummaryCard;
