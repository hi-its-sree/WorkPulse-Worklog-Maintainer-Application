import { useEffect, useRef } from 'react';
import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

const MeetingSection = ({ meetings, onAddMeeting, onUpdateMeeting, onDeleteMeeting, onCopyMeeting, errors = {}, focusIndex = null, onFocusHandled }) => {
  const { strings } = useLanguage();
  const rowRefs = useRef({});

  // Bring a just-added row into view and put the cursor in it. Copying a meeting
  // does not add a row, so it never triggers this.
  useEffect(() => {
    if (focusIndex == null) return;
    const row = rowRefs.current[focusIndex];
    if (!row) return;

    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const titleInput = row.querySelector('[data-meeting-title]');
    if (titleInput) titleInput.focus({ preventScroll: true });
    onFocusHandled?.();
  }, [focusIndex, meetings.length]);

  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-[var(--text-primary)]">{strings.planner.meetingSectionTitle}</h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{strings.planner.meetingSectionDescription}</p>
        </div>
        <button onClick={onAddMeeting} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
          <Plus size={16} />
          {strings.planner.addMeeting}
        </button>
      </div>

      <div className="space-y-4">
        {(Array.isArray(meetings) ? meetings : []).map((meeting, index) => (
          <div
            key={`meeting-${index}`}
            ref={(element) => { rowRefs.current[index] = element; }}
            className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{strings.planner.meetingLabel} #{index + 1}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{strings.planner.meetingScheduledDescription}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onCopyMeeting(index)} title={strings.planner.copyMeetingLabel} aria-label={strings.planner.copyMeetingLabel} className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2 text-[var(--text-secondary)]">
                  <Copy size={16} />
                </button>
                <button type="button" onClick={() => onDeleteMeeting(index)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>{strings.planner.meetingTitleLabel}</span>
                <input data-meeting-title value={meeting?.title ?? ''} onChange={(e) => onUpdateMeeting(index, 'title', e.target.value)} className="app-input mt-2" placeholder={strings.planner.placeholders.meetingName} />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>{strings.planner.meetingFromLabel}</span>
                <input type="time" value={meeting?.from ?? ''} onChange={(e) => onUpdateMeeting(index, 'from', e.target.value)} className="app-input mt-2" />
              </label>
              <label className="block text-sm text-[var(--text-secondary)]">
                <span>{strings.planner.meetingToLabel}</span>
                <input type="time" value={meeting?.to ?? ''} onChange={(e) => onUpdateMeeting(index, 'to', e.target.value)} className="app-input mt-2" />
              </label>
            </div>
            <label className="mt-4 block text-sm text-[var(--text-secondary)]">
              <span>{strings.planner.meetingDescriptionLabel}</span>
              <textarea value={meeting?.description ?? ''} onChange={(e) => onUpdateMeeting(index, 'description', e.target.value)} className="app-input mt-2 h-24" placeholder={strings.planner.placeholders.meetingDescription} />
            </label>
            <label className="mt-4 block text-sm text-[var(--text-secondary)]">
              <span>{strings.planner.meetingTypeLabel}</span>
              <select value={meeting?.type ?? 'Meeting'} onChange={(e) => onUpdateMeeting(index, 'type', e.target.value)} className="app-input mt-2">
                <option value="Meeting">{strings.planner.meetingTypes.meeting}</option>
                <option value="Call">{strings.planner.meetingTypes.call}</option>
                <option value="Review">{strings.planner.meetingTypes.review}</option>
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
