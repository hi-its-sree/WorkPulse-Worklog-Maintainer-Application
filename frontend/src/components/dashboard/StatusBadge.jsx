import { useTheme } from '../../contexts/ThemeContext.jsx';

const statusStyles = {
  Completed: { bg: 'var(--success)', text: '#f8fafc' },
  Pending: { bg: 'var(--accent-soft)', text: 'var(--accent)' },
  'In Progress': { bg: 'rgba(245, 158, 11, 0.16)', text: 'var(--warning)' },
  Overdue: { bg: 'rgba(220, 38, 38, 0.16)', text: 'var(--destructive)' },
  Cancelled: { bg: 'rgba(107, 114, 128, 0.16)', text: '#64748b' },
  Blocked: { bg: 'rgba(124, 58, 237, 0.16)', text: '#7c3aed' },
};

const StatusBadge = ({ status }) => {
  const { activeTheme } = useTheme();
  const style = statusStyles[status] || statusStyles.Pending;

  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
      style={{
        backgroundColor: style.bg.replace('var(--accent-soft)', activeTheme.accentSoft).replace('var(--success)', activeTheme.success).replace('var(--warning)', activeTheme.warning).replace('var(--destructive)', activeTheme.destructive),
        color: style.text.replace('var(--accent)', activeTheme.accent).replace('var(--warning)', activeTheme.warning).replace('var(--destructive)', activeTheme.destructive),
      }}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
