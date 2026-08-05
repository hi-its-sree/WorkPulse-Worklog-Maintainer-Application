import { useTheme } from '../../contexts/ThemeContext.jsx';

const ReportFilters = ({ filters, onChange, projects, users, loading }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>From</span>
        <input type="date" value={filters.dateFrom} onChange={(event) => onChange('dateFrom', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading} />
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>To</span>
        <input type="date" value={filters.dateTo} onChange={(event) => onChange('dateTo', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading} />
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>Project</span>
        <select value={filters.projectId} onChange={(event) => onChange('projectId', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
          <option value="all">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>Task status</span>
        <select value={filters.taskStatus} onChange={(event) => onChange('taskStatus', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
          <option value="all">All statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="PLANNED">Planned</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </label>
      {users.length > 0 ? (
        <label className="flex flex-col gap-2 text-sm lg:col-span-4" style={{ color: activeTheme.textSecondary }}>
          <span>User</span>
          <select value={filters.userId} onChange={(event) => onChange('userId', event.target.value)} className="rounded-2xl border px-3 py-3" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, color: activeTheme.textPrimary }} disabled={loading}>
            <option value="all">All users</option>
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
