import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { CalendarDays, Search, Plus, List, LayoutGrid } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import MeetingSummaryCard from '../components/meetings/MeetingSummaryCard.jsx';
import MeetingModal from '../components/meetings/MeetingModal.jsx';
import MeetingDetailPanel from '../components/meetings/MeetingDetailPanel.jsx';
import { formatDateKey } from '../components/workflow/constants.js';

const initialMeetings = [
  {
    id: 1,
    title: 'Client alignment',
    project: 'ERP Modernization',
    date: '2026-08-04',
    startTime: '10:30',
    duration: 45,
    participants: 'Alice, Bob, Carol',
    description: 'Review milestones and blockers.',
    agenda: 'Risks, timeline, approvals.',
    notes: 'Confirm board review next week.',
    recurrence: 'weekly',
    status: 'In Progress',
    worklogStatus: 'Pending',
    actionItems: [
      { id: 1, title: 'Share milestone update', owner: 'Alice', dueDate: '2026-08-05', done: false },
    ],
  },
  {
    id: 2,
    title: 'Sprint retro',
    project: 'Client Portal',
    date: '2026-08-06',
    startTime: '15:00',
    duration: 60,
    participants: 'Dev team, QA',
    description: 'Discuss team productivity and improvements.',
    agenda: 'Velocity, blockers, process.',
    notes: 'Capture follow-ups for next sprint.',
    recurrence: 'weekly',
    status: 'Planned',
    worklogStatus: 'Linked',
    actionItems: [
      { id: 2, title: 'Create follow-up checklist', owner: 'Jordan', dueDate: '2026-08-07', done: false },
    ],
  },
  {
    id: 3,
    title: 'Project checkpoint',
    project: 'Mobile Field App',
    date: '2026-08-02',
    startTime: '11:00',
    duration: 90,
    participants: 'Project owner, PM',
    description: 'Approve scope and budget changes.',
    agenda: 'Budget, scope, dependencies.',
    notes: 'Approved with minor risk note.',
    recurrence: 'monthly',
    status: 'Completed',
    worklogStatus: 'Finalized',
    actionItems: [],
  },
];

const MeetingPage = () => {
  const { activeTheme } = useTheme();
  const [meetings, setMeetings] = useState(initialMeetings);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [viewMode, setViewMode] = useState('week');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    date: selectedDate,
    startTime: '09:00',
    duration: 60,
    participants: '',
    description: '',
    agenda: '',
    notes: '',
    recurrence: 'weekly',
    status: 'Planned',
    worklogStatus: 'Pending',
    actionItems: [],
  });

  const filteredMeetings = useMemo(() => {
    const result = meetings.filter((meeting) => {
      const matchesQuery = `${meeting.title} ${meeting.project} ${meeting.participants}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || meeting.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortOrder === 'duration') return b.duration - a.duration;
      return a.date.localeCompare(b.date);
    });
  }, [meetings, query, statusFilter, sortOrder]);

  const summaryCards = [
    { label: 'Total meetings', value: meetings.length, detail: 'Across all projects', accent: activeTheme.accent },
    { label: 'Upcoming meetings', value: meetings.filter((meeting) => meeting.status !== 'Completed' && meeting.status !== 'Cancelled').length, detail: 'Scheduled and active', accent: activeTheme.success },
    { label: 'Completed meetings', value: meetings.filter((meeting) => meeting.status === 'Completed').length, detail: 'Closed out', accent: activeTheme.warning },
    { label: 'Total meeting hours', value: `${meetings.reduce((sum, meeting) => sum + meeting.duration, 0) / 60}h`, detail: 'Across the calendar', accent: activeTheme.accent },
  ];

  const openCreateModal = () => {
    setEditingMeeting(null);
    setFormData({ title: '', project: '', date: selectedDate, startTime: '09:00', duration: 60, participants: '', description: '', agenda: '', notes: '', recurrence: 'weekly', status: 'Planned', worklogStatus: 'Pending', actionItems: [] });
    setModalOpen(true);
  };

  const openEditModal = (meeting) => {
    setEditingMeeting(meeting);
    setFormData(meeting);
    setModalOpen(true);
  };

  const handleSaveMeeting = () => {
    if (!formData.title || !formData.project) return;

    if (editingMeeting) {
      setMeetings((current) => current.map((meeting) => meeting.id === editingMeeting.id ? { ...meeting, ...formData } : meeting));
    } else {
      setMeetings((current) => [{ id: Date.now(), ...formData }, ...current]);
    }

    setModalOpen(false);
  };

  const handleDelete = (meeting) => {
    setMeetings((current) => current.filter((item) => item.id !== meeting.id));
    setDetailMeeting(null);
  };

  const handleDuplicate = (meeting) => {
    const duplicate = { ...meeting, id: Date.now(), title: `${meeting.title} (Copy)`, date: meeting.date };
    setMeetings((current) => [duplicate, ...current]);
    setDetailMeeting(duplicate);
  };

  const handleReschedule = (meeting) => {
    const nextDate = prompt('Enter new date (YYYY-MM-DD)', meeting.date);
    if (!nextDate) return;
    setMeetings((current) => current.map((item) => item.id === meeting.id ? { ...item, date: nextDate } : item));
  };

  const selectedMeetings = filteredMeetings.filter((meeting) => meeting.date === selectedDate);
  const pastMeetings = filteredMeetings.filter((meeting) => meeting.date < selectedDate && meeting.status !== 'Cancelled');
  const upcomingMeetings = filteredMeetings.filter((meeting) => meeting.date >= selectedDate && meeting.status !== 'Cancelled');

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Meeting workspace</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Calendar-based meeting management</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>Coordinate meetings, track action items, and connect them to worklog delivery.</p>
          </div>
          <button type="button" className="app-action-btn inline-flex items-center gap-2" onClick={openCreateModal}><Plus size={16} /> New meeting</button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => <MeetingSummaryCard key={card.label} label={card.label} value={card.value} detail={card.detail} accent={card.accent} />)}
        </div>
      </div>

      <div className="rounded-[32px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {['week', 'day', 'agenda'].map((mode) => (
              <button key={mode} type="button" className={`rounded-full px-4 py-2 text-sm font-medium ${viewMode === mode ? 'text-white' : ''}`} style={{ backgroundColor: viewMode === mode ? activeTheme.accent : activeTheme.surfaceAlt, color: viewMode === mode ? activeTheme.accentContrast : activeTheme.textSecondary }} onClick={() => setViewMode(mode)}>
                {mode === 'week' ? 'Week view' : mode === 'day' ? 'Day view' : 'Agenda'}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <Search size={16} style={{ color: activeTheme.textSecondary }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meetings" className="w-36 border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="All">All statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="date">Date</option>
              <option value="duration">Duration</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Calendar</p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Meeting schedule</h2>
              </div>
              <label className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                <CalendarDays size={16} style={{ color: activeTheme.textSecondary }} />
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
              </label>
            </div>

            <div className="space-y-3">
              {filteredMeetings.filter((meeting) => meeting.date === selectedDate).length === 0 ? (
                <p className="rounded-2xl border p-4 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>No meetings for the selected date yet.</p>
              ) : filteredMeetings.filter((meeting) => meeting.date === selectedDate).map((meeting) => (
                <motion.button key={meeting.id} layout type="button" onClick={() => setDetailMeeting(meeting)} className="w-full rounded-[24px] border p-4 text-left" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</p>
                      <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{meeting.project} • {meeting.startTime}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{meeting.status}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Review history</p>
              <h3 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Past, current, upcoming</h3>
              <div className="mt-4 space-y-3">
                {pastMeetings.slice(0, 3).map((meeting) => <div key={meeting.id} className="rounded-2xl border px-3 py-3 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}><span className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</span> • {meeting.date}</div>)}
                {upcomingMeetings.slice(0, 3).map((meeting) => <div key={meeting.id} className="rounded-2xl border px-3 py-3 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}><span className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</span> • {meeting.date}</div>)}
              </div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Worklog linkage</p>
              <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Every meeting can be linked to a worklog entry and automatically contribute to the day’s tracked meeting hours.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border" style={{ borderColor: activeTheme.border }}>
          <div className="grid gap-4 border-b p-4 md:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: activeTheme.surfaceAlt }}>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Search</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>Find meetings</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Filters</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>Status and recurrence</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Sorting</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>By date or duration</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>History</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>Audit-ready view</p>
            </div>
          </div>
          <div className="divide-y" style={{ backgroundColor: activeTheme.surface }}>
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</p>
                  <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{meeting.project} • {meeting.date} • {meeting.startTime}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{meeting.status}</span>
                  <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{meeting.recurrence}</span>
                  <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={() => setDetailMeeting(meeting)}>Open</button>
                  <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={() => openEditModal(meeting)}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MeetingModal isOpen={modalOpen} mode={editingMeeting ? 'edit' : 'create'} formData={formData} setFormData={setFormData} onClose={() => setModalOpen(false)} onSubmit={handleSaveMeeting} />
      <MeetingDetailPanel meeting={detailMeeting} onClose={() => setDetailMeeting(null)} onEdit={openEditModal} onDelete={handleDelete} onDuplicate={handleDuplicate} onReschedule={handleReschedule} />
    </div>
  );
};

export default MeetingPage;
