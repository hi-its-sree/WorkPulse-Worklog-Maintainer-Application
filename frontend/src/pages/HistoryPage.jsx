import { useEffect, useMemo, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { WORKFLOW_STATUSES, getStatusTone } from '../components/workflow/constants.js';

const HistoryPage = () => {
  const [entries, setEntries] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const worklogs = JSON.parse(localStorage.getItem('worklogEntries') || '{}');
    const history = Object.entries(worklogs).map(([dateKey, entry]) => ({ dateKey, ...entry }));
    setEntries(history);
  }, []);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesQuery = !query || `${entry.dateKey} ${entry.submittedBy || ''} ${entry.remarks || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [entries, query, statusFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--accent)]">History</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Worklog history</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Search, filter, and review previous worklogs and approvals.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Search size={16} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search date/user" className="bg-transparent outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              <Filter size={16} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent outline-none">
                <option value="ALL">All statuses</option>
                <option value={WORKFLOW_STATUSES.PLANNED}>Planned</option>
                <option value={WORKFLOW_STATUSES.SUBMITTED}>Submitted</option>
                <option value={WORKFLOW_STATUSES.APPROVED}>Approved</option>
                <option value={WORKFLOW_STATUSES.REJECTED}>Rejected</option>
              </select>
            </label>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-8 text-center text-[var(--text-secondary)]">No matching history entries found.</div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <div key={entry.dateKey} className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{entry.dateKey}</p>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{entry.submittedBy || 'Employee'}</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusTone(entry.status)}`}>{entry.status}</span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">Planned</p>
                    <p className="mt-1">{entry.plannedMinutes || 0} min</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">Actual</p>
                    <p className="mt-1">{entry.actualMinutes || 0} min</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">Manager comments</p>
                    <p className="mt-1">{entry.managerComments || '—'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
