import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, MessageSquareQuote } from 'lucide-react';
import { WORKFLOW_STATUSES } from '../components/workflow/constants.js';

const ApprovalPage = () => {
  const [worklogs, setWorklogs] = useState([]);
  const [managerComments, setManagerComments] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('worklogEntries') || '{}');
    const values = Object.entries(stored)
      .filter(([, entry]) => entry?.status === WORKFLOW_STATUSES.SUBMITTED)
      .map(([dateKey, entry]) => ({ dateKey, ...entry }));
    setWorklogs(values);
  }, []);

  const handleDecision = (dateKey, decision) => {
    const stored = JSON.parse(localStorage.getItem('worklogEntries') || '{}');
    const entry = stored[dateKey];
    if (!entry) return;
    const nextEntry = {
      ...entry,
      status: decision,
      approvedBy: 'Manager',
      approvedDate: new Date().toISOString(),
      managerComments: managerComments[dateKey] || '',
    };
    stored[dateKey] = nextEntry;
    localStorage.setItem('worklogEntries', JSON.stringify(stored));

    const approvals = JSON.parse(localStorage.getItem('approvalHistory') || '[]');
    approvals.push({ dateKey, decision, ...nextEntry });
    localStorage.setItem('approvalHistory', JSON.stringify(approvals));

    setWorklogs((current) => current.filter((item) => item.dateKey !== dateKey));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.4em] text-[var(--accent)]">Approval queue</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Manager approvals</h1>
          <p className="mt-2 text-[var(--text-secondary)]">Review submitted worklogs and approve or reject them with comments.</p>
        </div>

        {worklogs.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-8 text-center text-[var(--text-secondary)]">No submitted worklogs await review.</div>
        ) : (
          <div className="space-y-4">
            {worklogs.map((entry) => (
              <div key={entry.dateKey} className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{entry.dateKey}</p>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{entry.submittedBy || 'Employee'}</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">Planned {entry.plannedMinutes || 0}m · Actual {entry.actualMinutes || 0}m</p>
                  </div>
                  <div className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">Submitted</div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-semibold text-[var(--text-primary)]">Performance summary</p>
                    <p className="mt-2">Difference: {(entry.actualMinutes || 0) - (entry.plannedMinutes || 0)} min</p>
                    <p className="mt-1">Status: {entry.completionStatus || 'ON_TRACK'}</p>
                    <p className="mt-1">Remarks: {entry.remarks || 'No remarks.'}</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span className="flex items-center gap-2"><MessageSquareQuote size={14} /> Manager comments</span>
                      <textarea value={managerComments[entry.dateKey] || ''} onChange={(event) => setManagerComments((current) => ({ ...current, [entry.dateKey]: event.target.value }))} className="app-input mt-2 h-24" placeholder="Add review comments" />
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={() => handleDecision(entry.dateKey, WORKFLOW_STATUSES.APPROVED)} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button type="button" onClick={() => handleDecision(entry.dateKey, WORKFLOW_STATUSES.REJECTED)} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalPage;
