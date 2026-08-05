import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const statusColors = {
  Planned: 'bg-slate-100 text-slate-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  Completed: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const MeetingDetailPanel = ({ meeting, onClose, onEdit, onDelete, onDuplicate, onReschedule }) => {
  const { activeTheme } = useTheme();

  if (!meeting) return null;

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed right-0 top-0 z-40 h-full w-full max-w-xl border-l p-6 shadow-2xl" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.28em]" style={{ color: activeTheme.accent }}>{meeting.project}</p>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</h3>
        </div>
        <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={onClose}>Close</button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[meeting.status] || 'bg-slate-100 text-slate-700'}`}>{meeting.status}</span>
        <span className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{meeting.recurrence}</span>
      </div>

      <div className="mt-6 space-y-4 text-sm" style={{ color: activeTheme.textSecondary }}>
        <div className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border }}>
          <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>Details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-[0.2em]">Date</p><p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{meeting.date}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em]">Time</p><p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{meeting.startTime}</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em]">Duration</p><p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{meeting.duration} min</p></div>
            <div><p className="text-xs uppercase tracking-[0.2em]">Participants</p><p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{meeting.participants}</p></div>
          </div>
        </div>

        <div className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border }}>
          <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>Agenda</p>
          <p className="mt-2 leading-6">{meeting.agenda}</p>
        </div>

        <div className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border }}>
          <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>Notes</p>
          <p className="mt-2 leading-6">{meeting.notes}</p>
        </div>

        <div className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border }}>
          <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>Action items</p>
          <div className="mt-3 space-y-2">
            {meeting.actionItems?.map((item) => (
              <div key={item.id} className="rounded-2xl border px-3 py-2" style={{ borderColor: activeTheme.border }}>
                <div className="flex items-center justify-between gap-2">
                  <span style={{ color: activeTheme.textPrimary }}>{item.title}</span>
                  <span className="text-xs uppercase tracking-[0.2em]" style={{ color: activeTheme.textSecondary }}>{item.done ? 'done' : 'pending'}</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: activeTheme.textSecondary }}>{item.owner} • due {item.dueDate}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="app-secondary-btn" onClick={() => onEdit(meeting)}>Edit</button>
        <button type="button" className="app-secondary-btn" onClick={() => onDuplicate(meeting)}>Duplicate</button>
        <button type="button" className="app-secondary-btn" onClick={() => onReschedule(meeting)}>Reschedule</button>
        <button type="button" className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600" onClick={() => onDelete(meeting)}>Delete</button>
      </div>
    </motion.div>
  );
};

export default MeetingDetailPanel;
