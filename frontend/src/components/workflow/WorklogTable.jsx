import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { projectLabelOf } from '../../pages/timesheetGrouping.js';

const StatusPill = ({ children }) => (
  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--accent)' }}>
    {children}
  </span>
);

const GroupedRows = ({ groups, table }) => {
  const [expanded, setExpanded] = useState(() => new Set());

  const toggle = (key) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return groups.flatMap((group) => {
    const isOpen = expanded.has(group.key);
    const dateRange = group.dayCount > 1 ? `${group.firstDateLabel} – ${group.lastDateLabel}` : group.firstDateLabel;

    const rows = [(
      <tr key={group.key} style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <td className="px-3 py-3">
          <button type="button" onClick={() => toggle(group.key)} className="flex items-center gap-2 text-left font-medium" style={{ color: 'var(--text-primary)' }}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>
              {group.task}
              {group.aliases.length > 1 && (
                <span className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                  {table.mergedNames.replace('{count}', group.aliases.length)}
                </span>
              )}
            </span>
          </button>
        </td>
        <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{group.projectLabel || group.project}</td>
        <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{dateRange}</td>
        <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{table.days.replace('{count}', group.dayCount)}</td>
        <td className="px-3 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>{group.loggedHours.toFixed(1)}h</td>
        <td className="px-3 py-3"><StatusPill>{group.status}</StatusPill></td>
      </tr>
    )];

    if (isOpen) {
      group.entries.forEach((entry, index) => {
        rows.push(
          <tr key={`${group.key}-${entry.dateKey}-${index}`} style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--surface-secondary)' }}>
            <td className="px-3 py-2 pl-10 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.task}</td>
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.category}</td>
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{entry.dateLabel}</td>
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.description || '—'}</td>
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>{entry.loggedHours.toFixed(1)}h</td>
            <td className="px-3 py-2 text-xs" style={{ color: 'var(--text-secondary)' }}>{entry.status}</td>
          </tr>
        );
      });
    }

    return rows;
  });
};

const WorklogTable = ({ rows, emptyMessage, grouped = false }) => {
  const { strings } = useLanguage();
  const table = strings.timesheet.table;

  const headers = grouped
    ? [table.task, table.project, table.dates, table.daysWorked, table.totalHours, table.status]
    : [table.date, table.task, table.project, table.description, table.hours, table.status];

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
              {headers.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                  {emptyMessage || table.empty}
                </td>
              </tr>
            ) : grouped ? (
              <GroupedRows groups={rows} table={table} />
            ) : rows.map((row) => (
              <tr key={`${row.dateKey}-${row.task}-${row.project}`} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <td className="px-3 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>{row.dateLabel}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-primary)' }}>{row.task}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{projectLabelOf(row)}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-secondary)' }}>{row.description || '—'}</td>
                <td className="px-3 py-3" style={{ color: 'var(--text-primary)' }}>{row.loggedHours.toFixed(1)}h</td>
                <td className="px-3 py-3"><StatusPill>{row.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WorklogTable;
