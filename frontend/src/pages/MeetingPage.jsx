import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Search, Plus, List, LayoutGrid } from 'lucide-react';
import api from '../lib/api.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import MeetingSummaryCard from '../components/meetings/MeetingSummaryCard.jsx';
import MeetingModal from '../components/meetings/MeetingModal.jsx';
import MeetingDetailPanel from '../components/meetings/MeetingDetailPanel.jsx';
import { formatDateKey } from '../components/workflow/constants.js';

const MeetingPage = () => {
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatMeetingDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [viewMode, setViewMode] = useState('week');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('date');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailMeeting, setDetailMeeting] = useState(null);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(() => (typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'));
  const reminderTimersRef = useRef(new Map());
  const [formData, setFormData] = useState({
    title: '',
    project: '',
    date: selectedDate,
    startTime: '09:00',
    duration: 30,
    participants: '',
    description: '',
    agenda: '',
    notes: '',
    recurrence: 'weekly',
    status: 'Planned',
    worklogStatus: 'Pending',
    actionItems: [],
  });


  const meetingStatusLabels = {
    Planned: strings.common.statuses.planned,
    'In Progress': strings.common.statuses.inProgress,
    Submitted: strings.common.statuses.submitted,
    Approved: strings.common.statuses.approved,
    Rejected: strings.common.statuses.rejected,
    Completed: strings.common.statuses.completed,
    Cancelled: strings.common.statuses.cancelled,
  };

  const mapMeeting = (meeting) => {
    const rawStatus = meeting.status === 'SCHEDULED' ? 'Planned' : meeting.status || 'Planned';
    return {
      id: meeting.id,
      title: meeting.title || strings.meetings.untitledMeeting,
      project: meeting.project || strings.meetings.defaultProject,
      date: meeting.date,
      startTime: meeting.startTime ? meeting.startTime.slice(0, 5) : '09:00',
      duration: meeting.durationMinutes ?? meeting.actualDurationMinutes ?? 30,
      participants: meeting.participants || strings.meetings.defaultParticipants,
      description: meeting.agenda || meeting.notes || strings.meetings.noMeetingDetails,
      agenda: meeting.agenda || meeting.notes || '',
      notes: meeting.notes || '',
      recurrence: meeting.recurrence || strings.meetings.oneTime,
      status: rawStatus,
      statusKey: rawStatus,
      statusLabel: meetingStatusLabels[rawStatus] || rawStatus,
      worklogStatus: meeting.worklogStatus || strings.meetings.pending,
      actionItems: meeting.actionItems || [],
    };
  };

  const filteredMeetings = useMemo(() => {
    const result = meetings.filter((meeting) => {
      const matchesQuery = `${meeting.title} ${meeting.project} ${meeting.participants}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || meeting.statusKey === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortOrder === 'duration') return b.duration - a.duration;
      return a.date.localeCompare(b.date);
    });
  }, [meetings, query, statusFilter, sortOrder]);

  const summaryCards = [
    { label: strings.meetings.summary.totalMeetings, value: meetings.length, detail: strings.meetings.summary.totalMeetingsDetail, accent: activeTheme.accent },
    { label: strings.meetings.summary.upcomingMeetings, value: meetings.filter((meeting) => meeting.status !== 'Completed' && meeting.status !== 'Cancelled').length, detail: strings.meetings.summary.upcomingMeetingsDetail, accent: activeTheme.success },
    { label: strings.meetings.summary.completedMeetings, value: meetings.filter((meeting) => meeting.status === 'Completed').length, detail: strings.meetings.summary.completedMeetingsDetail, accent: activeTheme.warning },
    { label: strings.meetings.summary.totalMeetingHours, value: `${meetings.reduce((sum, meeting) => sum + (meeting.duration || 0), 0) / 60}h`, detail: strings.meetings.summary.totalMeetingHoursDetail, accent: activeTheme.accent },
  ];

  const supportsNotifications = typeof window !== 'undefined' && 'Notification' in window;
  const reminderLeadMinutes = 15;

  const requestNotificationPermission = async () => {
    if (!supportsNotifications) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const showMeetingReminder = (meeting) => {
    if (!supportsNotifications || notificationPermission !== 'granted') return;

    const notificationTitle = strings.meetings.reminderTitle.replace('{minutes}', reminderLeadMinutes).replace('{title}', meeting.title);
    const notificationBody = `${meeting.project} • ${meeting.startTime} — ${meeting.description || strings.meetings.noMeetingDetails}`;

    new Notification(notificationTitle, {
      body: notificationBody,
      badge: '',
      silent: false,
    });
  };

  const scheduleReminders = () => {
    reminderTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    reminderTimersRef.current.clear();

    if (!supportsNotifications || notificationPermission !== 'granted') return;

    const now = Date.now();

    meetings.forEach((meeting) => {
      const meetingDateTime = new Date(`${meeting.date}T${meeting.startTime}:00`);
      const reminderTime = meetingDateTime.getTime() - reminderLeadMinutes * 60 * 1000;
      const delay = reminderTime - now;

      if (delay <= 0 || meetingDateTime.getTime() <= now) return;

      const timer = window.setTimeout(() => showMeetingReminder(meeting), delay);
      reminderTimersRef.current.set(meeting.id, timer);
    });
  };

  useEffect(() => {
    if (!supportsNotifications) return;
    if (notificationPermission === 'default') {
      setNotificationPermission(Notification.permission);
    }
  }, [notificationPermission, supportsNotifications]);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const response = await api.get('/meetings');
        setMeetings((response.data || []).map(mapMeeting));
      } catch (err) {
        setError(strings.meetings.loadingError || 'Unable to load meetings.');
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, []);

  useEffect(() => {
    scheduleReminders();
    return () => {
      reminderTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      reminderTimersRef.current.clear();
    };
  }, [meetings, notificationPermission]);

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
    const nextDate = prompt(strings.meetings.reschedulePrompt, meeting.date);
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
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.meetings.pageTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.meetings.pageTitle}</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>{strings.meetings.pageDescription}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="rounded-3xl border px-4 py-2 text-sm font-medium" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
                {supportsNotifications ? (
                  notificationPermission === 'granted' ? strings.meetings.remindersEnabled : notificationPermission === 'denied' ? strings.meetings.remindersBlocked : strings.meetings.remindersNotEnabled
                ) : strings.meetings.notificationsUnavailable}
              </span>
              {supportsNotifications && notificationPermission !== 'granted' && (
                <button type="button" className="app-secondary-btn" onClick={requestNotificationPermission}>
                  {strings.meetings.enableReminders}
                </button>
              )}
            </div>
          </div>
          <button type="button" className="app-action-btn inline-flex items-center gap-2" onClick={openCreateModal}><Plus size={16} /> {strings.meetings.newMeeting}</button>
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
                {mode === 'week' ? strings.meetings.weekView : mode === 'day' ? strings.meetings.dayView : strings.meetings.agenda}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <Search size={16} style={{ color: activeTheme.textSecondary }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={strings.meetings.searchPlaceholder} className="w-36 border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="All">{strings.meetings.allStatuses}</option>
              <option value="Planned">{strings.common.statuses.planned}</option>
              <option value="In Progress">{strings.common.statuses.inProgress}</option>
              <option value="Completed">{strings.common.statuses.completed}</option>
              <option value="Cancelled">{strings.common.statuses.cancelled}</option>
            </select>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="date">{strings.meetings.date}</option>
              <option value="duration">{strings.meetings.duration}</option>
            </select>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.meetings.calendar}</p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.meetings.meetingSchedule}</h2>
              </div>
              <label className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                <CalendarDays size={16} style={{ color: activeTheme.textSecondary }} />
                <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
              </label>
            </div>

            <div className="space-y-3">
              {loading ? (
                <p className="rounded-2xl border p-4 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.meetings.loading}</p>
              ) : error ? (
                <p className="rounded-2xl border p-4 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{error}</p>
              ) : filteredMeetings.filter((meeting) => meeting.date === selectedDate).length === 0 ? (
                <p className="rounded-2xl border p-4 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.meetings.noMeetings}</p>
              ) : filteredMeetings.filter((meeting) => meeting.date === selectedDate).map((meeting) => (
                <motion.button key={meeting.id} layout type="button" onClick={() => setDetailMeeting(meeting)} className="w-full rounded-[24px] border p-4 text-left" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</p>
                      <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{meeting.project} • {meeting.startTime}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{meeting.statusLabel}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.meetings.reviewHistory}</p>
              <h3 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.meetings.historyTitle}</h3>
              <div className="mt-4 space-y-3">
                {pastMeetings.slice(0, 3).map((meeting) => <div key={meeting.id} className="rounded-2xl border px-3 py-3 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}><span className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</span> • {formatMeetingDate(meeting.date)}</div>)}
                {upcomingMeetings.slice(0, 3).map((meeting) => <div key={meeting.id} className="rounded-2xl border px-3 py-3 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}><span className="font-semibold" style={{ color: activeTheme.textPrimary }}>{meeting.title}</span> • {formatMeetingDate(meeting.date)}</div>)}
              </div>
            </div>
            <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
              <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.meetings.worklogLinkage}</p>
              <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.meetings.worklogLinkageDescription}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[28px] border" style={{ borderColor: activeTheme.border }}>
          <div className="grid gap-4 border-b p-4 md:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: activeTheme.surfaceAlt }}>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{strings.meetings.search}</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{strings.meetings.findMeetings}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{strings.meetings.filters}</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{strings.meetings.statusAndRecurrence}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{strings.meetings.sorting}</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{strings.meetings.dateOrDuration}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{strings.meetings.history}</p>
              <p className="mt-1 font-medium" style={{ color: activeTheme.textPrimary }}>{strings.meetings.auditReady}</p>
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
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{meeting.statusLabelLabel}</span>
                  <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{meeting.recurrence}</span>
                  <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={() => setDetailMeeting(meeting)}>{strings.meetings.open}</button>
                  <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={() => openEditModal(meeting)}>{strings.common.edit}</button>
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
