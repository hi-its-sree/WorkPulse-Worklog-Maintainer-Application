import { useTheme } from '../../contexts/ThemeContext.jsx';

const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
const recurrenceOptions = ['daily', 'weekly', 'monthly', 'none'];

const MeetingModal = ({ isOpen, mode, formData, setFormData, onClose, onSubmit }) => {
  const { activeTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border p-6 shadow-2xl" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{mode === 'create' ? 'Create meeting' : 'Edit meeting'}</h3>
            <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Plan, schedule, and connect meetings to project worklogs.</p>
          </div>
          <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={onClose}>Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Title</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Project</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.project} onChange={(event) => setFormData((current) => ({ ...current, project: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Date</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Start time</span>
            <input type="time" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.startTime} onChange={(event) => setFormData((current) => ({ ...current, startTime: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Duration (min)</span>
            <input type="number" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: Number(event.target.value) }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Status</span>
            <select className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Participants</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.participants} onChange={(event) => setFormData((current) => ({ ...current, participants: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Recurrence</span>
            <select className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.recurrence} onChange={(event) => setFormData((current) => ({ ...current, recurrence: event.target.value }))}>
              {recurrenceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>Description</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>Agenda</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.agenda} onChange={(event) => setFormData((current) => ({ ...current, agenda: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>Notes</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} />
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="app-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="app-action-btn" onClick={onSubmit}>Save meeting</button>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
