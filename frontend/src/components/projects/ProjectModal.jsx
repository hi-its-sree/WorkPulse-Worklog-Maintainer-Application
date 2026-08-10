import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const ProjectModal = ({ isOpen, mode, formData, setFormData, onClose, onSubmit }) => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border p-6 shadow-2xl" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{mode === 'create' ? strings.modal.project.createTitle : strings.modal.project.editTitle}</h3>
            <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.modal.project.description}</p>
          </div>
          <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={onClose}>{strings.modal.project.close}</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.projectNumber}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.projectNumber} onChange={(event) => setFormData((current) => ({ ...current, projectNumber: event.target.value }))} placeholder={strings.modal.project.projectNumberPlaceholder} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.projectName}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.descriptionLabel}</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.startDate}</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.startDate} onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.endDate}</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.endDate} onChange={(event) => setFormData((current) => ({ ...current, endDate: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.manager}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.manager} onChange={(event) => setFormData((current) => ({ ...current, manager: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.project.teamMembers}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.teamMembers.join(', ')} onChange={(event) => setFormData((current) => ({ ...current, teamMembers: event.target.value.split(',').map((member) => member.trim()).filter(Boolean) }))} />
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="app-secondary-btn" onClick={onClose}>{strings.modal.project.cancel}</button>
          <button type="button" className="app-action-btn" onClick={onSubmit}>{strings.modal.project.save}</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
