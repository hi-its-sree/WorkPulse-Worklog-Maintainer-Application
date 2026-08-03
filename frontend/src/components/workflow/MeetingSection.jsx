import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';

const MeetingSection = ({ meetings, onAddMeeting, onUpdateMeeting, onDeleteMeeting, onDuplicateMeeting, errors = {} }) => {
  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-[var(--text-primary)]">Meetings</h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Capture your time blocks and collaborators.</p>
        </div>
        <button onClick={onAddMeeting} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
          <Plus size={16} />
          Add meeting
        </button>
      </div>

      <div className="space-y-4">
        {meetings.map((meeting, index) => (
          <div key={`meeting-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Meeting #{index + 1}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Scheduled discussion</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onDuplicateMeeting(index)} className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2 text-[var(--text-secondary)]">
                  <Copy size={16} />
                </button>
                <button type="button" onClick={() => onDeleteMeeting(index)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>Meeting title</span>
                <input value={meeting.title} onChange={(e) => onUpdateMeeting(index, 'title', e.target.value)} className="app-input mt-2" placeholder="Meeting name" />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>From</span>
                <input type="time" value={meeting.from} onChange={(e) => onUpdateMeeting(index, 'from', e.target.value)} className="app-input mt-2" />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>To</span>
                <input type="time" value={meeting.to} onChange={(e) => onUpdateMeeting(index, 'to', e.target.value)} className="app-input mt-2" />
              </label>
            </div>
            <label className="mt-4 block text-sm text-[var(--text-secondary)]">
              <span>Meeting description</span>
              <textarea value={meeting.description} onChange={(e) => onUpdateMeeting(index, 'description', e.target.value)} className="app-input mt-2 h-24" placeholder="Add a short summary for this meeting" />
            </label>
            <label className="mt-4 block text-sm text-[var(--text-secondary)]">
              <span>Type</span>
              <select value={meeting.type} onChange={(e) => onUpdateMeeting(index, 'type', e.target.value)} className="app-input mt-2">
                <option>Meeting</option>
                <option>Call</option>
                <option>Review</option>
              </select>
            </label>
            {errors?.[index] && (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <AlertCircle size={14} />
                <span>{errors[index]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingSection;
