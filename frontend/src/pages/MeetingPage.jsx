import { useEffect, useMemo, useState } from 'react';

const availableMeetings = [
  {
    id: 'm1',
    title: 'Client alignment',
    time: '10:30 AM',
    description: 'Review milestones and blockers',
    members: 'Alice, Bob, Carol',
    notes: '',
    frequency: 'daily',
  },
  {
    id: 'm2',
    title: 'Sprint retro',
    time: '3:00 PM',
    description: 'Discuss team productivity and improvements',
    members: 'Dev team, QA',
    notes: '',
    frequency: 'weekly',
  },
  {
    id: 'm3',
    title: 'Project checkpoint',
    time: '11:00 AM',
    description: 'Approve scope and budget changes',
    members: 'Project owner, PM',
    notes: '',
    frequency: 'monthly',
  },
  {
    id: 'm4',
    title: 'Design review',
    time: '2:00 PM',
    description: 'Evaluate UI flows and handoff notes',
    members: 'Design, Product',
    notes: '',
    frequency: 'weekly',
  },
  {
    id: 'm5',
    title: 'Delivery sync',
    time: '4:30 PM',
    description: 'Confirm deployment readiness',
    members: 'Ops, Release',
    notes: '',
    frequency: 'daily',
  },
];

const defaultAssemblyTask = { title: 'Morning assembly', project: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: true };
const defaultTask = { title: '', project: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: false };
const defaultSection = { planned: '', description: '' };

import { formatDateKey } from '../components/workflow/constants.js';

const formatDateKeyLocal = (date) => formatDateKey(date);

const MeetingPage = () => {
  const today = useMemo(() => new Date(), []);
  const [viewPeriod, setViewPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(today);
  const [meetingsForDate, setMeetingsForDate] = useState([]);
  const [message, setMessage] = useState('');

  const dateKey = formatDateKey(selectedDate);

  useEffect(() => {
    const stored = localStorage.getItem('plannerEntries');
    const entries = stored ? JSON.parse(stored) : {};
    const entry = entries[dateKey];
    if (entry?.meetings?.length) {
      setMeetingsForDate(entry.meetings);
    } else {
      setMeetingsForDate([]);
    }
    setMessage('');
  }, [dateKey]);

  const meetings = useMemo(() => {
    if (viewPeriod === 'daily') return availableMeetings.filter((meeting) => meeting.frequency === 'daily');
    if (viewPeriod === 'weekly') return availableMeetings.filter((meeting) => meeting.frequency === 'weekly');
    return availableMeetings.filter((meeting) => meeting.frequency === 'monthly');
  }, [viewPeriod]);

  const weekStart = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());
    return start;
  }, [selectedDate]);

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const saveMeetingsToWorklog = (updatedMeetings) => {
    const stored = localStorage.getItem('plannerEntries');
    const entries = stored ? JSON.parse(stored) : {};
    const existingEntry = entries[dateKey] || {
      tasks: [defaultAssemblyTask, defaultTask],
      meetings: [],
      documentation: defaultSection,
      others: defaultSection,
      savedAt: new Date().toISOString(),
    };
    const updatedEntry = {
      ...existingEntry,
      meetings: updatedMeetings,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('plannerEntries', JSON.stringify({
      ...entries,
      [dateKey]: updatedEntry,
    }));
    setMeetingsForDate(updatedMeetings);
    setMessage(`Saved ${updatedMeetings.length} meeting${updatedMeetings.length === 1 ? '' : 's'} into your worklog for ${selectedDate.toLocaleDateString()}.`);
  };

  const toggleMeeting = (meetingId) => {
    const foundIndex = meetingsForDate.findIndex((item) => item.id === meetingId);
    if (foundIndex >= 0) {
      const next = meetingsForDate.filter((item) => item.id !== meetingId);
      saveMeetingsToWorklog(next);
      return;
    }

    const templateMeeting = availableMeetings.find((item) => item.id === meetingId);
    if (!templateMeeting) return;
    const meetingToAdd = {
      id: templateMeeting.id,
      title: templateMeeting.title,
      time: templateMeeting.time,
      description: templateMeeting.description,
      members: templateMeeting.members,
      notes: templateMeeting.notes || '',
    };
    saveMeetingsToWorklog([...meetingsForDate, meetingToAdd]);
  };

  const updateMeetingField = (meetingId, field, value) => {
    const updated = meetingsForDate.map((item) => item.id === meetingId ? { ...item, [field]: value } : item);
    saveMeetingsToWorklog(updated);
  };

  const selectedMeetingIds = useMemo(() => meetingsForDate.map((meeting) => meeting.id), [meetingsForDate]);

  const addManualMeeting = () => {
    const newMeeting = {
      id: `manual-${Date.now()}`,
      title: '',
      time: '09:00 AM',
      description: '',
      members: '',
      notes: '',
    };
    saveMeetingsToWorklog([...meetingsForDate, newMeeting]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Meeting management</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Select daily, weekly, or monthly meetings</h1>
            <p className="mt-2 text-slate-500">Pick meetings and save them directly into the final worklog for the day.</p>
          </div>
          <div className="app-panel flex flex-wrap items-center gap-3 px-4 py-3 text-sm font-semibold">
            {['daily', 'weekly', 'monthly'].map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setViewPeriod(period)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewPeriod === period ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700">Selected date: {selectedDate.toLocaleDateString()}</p>
          <input
            type="date"
            value={dateKey}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
          />
        </div>

        {viewPeriod === 'weekly' && (
          <div className="mb-6 rounded-[28px] bg-slate-50 p-4 text-sm text-slate-700">
            Viewing meetings for the week: <strong>{weekLabel}</strong>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {meetings.map((meeting) => {
            const selected = selectedMeetingIds.includes(meeting.id);
            return (
              <button
                key={meeting.id}
                type="button"
                onClick={() => toggleMeeting(meeting.id)}
                className={`group rounded-[28px] border p-6 text-left transition ${selected ? 'border-blue-600 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{meeting.title}</h2>
                    <p className="mt-2 text-sm text-slate-500">{meeting.description}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{meeting.time}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">Members: {meeting.members}</p>
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className={`inline-flex h-3 w-3 rounded-full ${selected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  {selected ? 'Selected' : 'Tap to select'}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={addManualMeeting}
            className="app-action-btn bg-[var(--accent)]"
          >
            Add custom meeting
          </button>
          <p className="text-sm text-slate-500">Saved meetings are stored into the finalized worklog for the selected date.</p>
        </div>

        <div className="app-panel mt-8 p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Saved meetings</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Meetings saved for this day</h2>
            </div>
          </div>

          {meetingsForDate.length === 0 ? (
            <p className="rounded-3xl bg-white px-4 py-5 text-sm text-slate-600">No meetings saved for this date yet. Select a template meeting above or add one manually.</p>
          ) : (
            <div className="space-y-5">
              {meetingsForDate.map((meeting) => (
                <div key={meeting.id} className="rounded-[28px] bg-white p-5 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Title</span>
                      <input
                        value={meeting.title}
                        onChange={(e) => updateMeetingField(meeting.id, 'title', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                        placeholder="Meeting title"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Time</span>
                      <input
                        type="text"
                        value={meeting.time}
                        onChange={(e) => updateMeetingField(meeting.id, 'time', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                        placeholder="Meeting time"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2 mt-4">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Description</span>
                      <textarea
                        value={meeting.description}
                        onChange={(e) => updateMeetingField(meeting.id, 'description', e.target.value)}
                        className="h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                        placeholder="Meeting description"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>Members</span>
                      <input
                        value={meeting.members}
                        onChange={(e) => updateMeetingField(meeting.id, 'members', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                        placeholder="Attendees"
                      />
                    </label>
                  </div>

                  <label className="mt-4 space-y-2 text-sm text-slate-700">
                    <span>Notes</span>
                    <textarea
                      value={meeting.notes}
                      onChange={(e) => updateMeetingField(meeting.id, 'notes', e.target.value)}
                      className="h-32 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                      placeholder="Meeting notes and action items"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => saveMeetingsToWorklog(meetingsForDate.filter((item) => item.id !== meeting.id))}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      Remove meeting
                    </button>
                    <span className="text-sm text-slate-500">Saved for {selectedDate.toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {message && <p className="mt-4 rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
      </div>
    </div>
  );
};

export default MeetingPage;
