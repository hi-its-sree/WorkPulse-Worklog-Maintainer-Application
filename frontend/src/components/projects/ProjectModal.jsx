import { useTheme } from '../../contexts/ThemeContext.jsx';

const statusOptions = ['Planning', 'Active', 'At Risk', 'On Hold', 'Completed', 'Cancelled'];

const ProjectModal = ({ isOpen, mode, formData, setFormData, onClose, onSubmit }) => {
  const { activeTheme } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border p-6 shadow-2xl" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{mode === 'create' ? 'Create project' : 'Edit project'}</h3>
            <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Capture scope, delivery expectations, and team ownership.</p>
          </div>
          <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={onClose}>Close</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Project name</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Client</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.client} onChange={(event) => setFormData((current) => ({ ...current, client: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>Description</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Start date</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.startDate} onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>End date</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.endDate} onChange={(event) => setFormData((current) => ({ ...current, endDate: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Budget hours</span>
            <input type="number" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.budgetHours} onChange={(event) => setFormData((current) => ({ ...current, budgetHours: Number(event.target.value) }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Manager</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.manager} onChange={(event) => setFormData((current) => ({ ...current, manager: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Team members</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.teamMembers.join(', ')} onChange={(event) => setFormData((current) => ({ ...current, teamMembers: event.target.value.split(',').map((member) => member.trim()).filter(Boolean) }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>Status</span>
            <select className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="app-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="app-action-btn" onClick={onSubmit}>Save project</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
