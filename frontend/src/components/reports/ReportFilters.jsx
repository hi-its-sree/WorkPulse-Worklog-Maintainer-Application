import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatProjectLabel } from '../../lib/useProjects.js';

const ReportFilters = ({ filters, onChange, projects, users, loading }) => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>{strings.reports.filters.from}</span>
        <input type="date" value={filters.dateFrom} onChange={(event) => onChange('dateFrom', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading} />
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>{strings.reports.filters.to}</span>
        <input type="date" value={filters.dateTo} onChange={(event) => onChange('dateTo', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading} />
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>{strings.reports.filters.project}</span>
        <select value={filters.projectId} onChange={(event) => onChange('projectId', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
          <option value="all">{strings.reports.filters.allProjects}</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{formatProjectLabel(project)}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>{strings.reports.filters.taskStatus}</span>
        <select value={filters.taskStatus} onChange={(event) => onChange('taskStatus', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
          <option value="all">{strings.reports.filters.allStatuses}</option>
          <option value="COMPLETED">{strings.reports.filters.completed}</option>
          <option value="IN_PROGRESS">{strings.reports.filters.inProgress}</option>
          <option value="PLANNED">{strings.reports.filters.planned}</option>
          <option value="BLOCKED">{strings.reports.filters.blocked}</option>
        </select>
      </label>
      {users.length > 0 ? (
        <label className="flex flex-col gap-2 text-sm lg:col-span-4" style={{ color: activeTheme.textSecondary }}>
          <span>{strings.reports.filters.user}</span>
          <select value={filters.userId} onChange={(event) => onChange('userId', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
            <option value="all">{strings.reports.filters.allUsers}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
};

export default ReportFilters;
