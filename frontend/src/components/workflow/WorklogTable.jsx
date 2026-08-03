import { motion } from 'framer-motion';

const WorklogTable = ({ rows, emptyMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border p-4"
      style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th className="px-3 py-3 font-semibold">Date</th>
              <th className="px-3 py-3 font-semibold">Task</th>
              <th className="px-3 py-3 font-semibold">Project</th>
              <th className="px-3 py-3 font-semibold">Description</th>
              <th className="px-3 py-3 font-semibold">Hours</th>
              <th className="px-3 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row) => (
              <tr key={`${row.dateKey}-${row.task}-${row.project}`} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.dateLabel}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-primary)' }}>{row.task}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{row.project}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{row.description || '—'}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-primary)' }}>{row.loggedHours.toFixed(1)}h</td>
                <td className="px-3 py-3">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--accent)' }}>
                    {row.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  {emptyMessage || 'No matching worklog entries found for the selected filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WorklogTable;
