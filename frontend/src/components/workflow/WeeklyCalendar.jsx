import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateKey, isSameDate } from './constants.js';

const WeeklyCalendar = ({ weekDates, selectedDate, onSelectDate, holidays = {}, today, onShiftWeek }) => {
  const { strings, locale } = useLanguage();
  const firstDay = weekDates[0];
  const lastDay = weekDates[weekDates.length - 1];
  const rangeLabel = firstDay && lastDay
    ? `${firstDay.toLocaleDateString(locale, { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}`
    : '';

  return (
    <div className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/80 p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
          <CalendarDays size={16} />
          <span>{strings.calendar.weeklyCalendar}</span>
        </div>
        {onShiftWeek && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onShiftWeek(-1)}
              aria-label={strings.calendar.previousWeek}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[130px] text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">{rangeLabel}</span>
            <button
              type="button"
              onClick={() => onShiftWeek(1)}
              aria-label={strings.calendar.nextWeek}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(today ? new Date(today) : new Date())}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {strings.calendar.today}
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          <Clock3 size={14} />
          <span>{strings.calendar.tapADay}</span>
        </div>
      </div>

      <div className="flex snap-x gap-2 overflow-x-auto scroll-smooth pb-2">
        {weekDates.map((date) => {
          const key = formatDateKey(date);
          const isToday = isSameDate(date, today);
          const isSelected = isSameDate(date, selectedDate);
          const holidayLabel = holidays[key];
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`min-w-[84px] snap-start rounded-[24px] border px-3 py-3 text-center text-[11px] transition ${isSelected ? 'border-[var(--accent)] bg-[var(--surface-primary)] shadow-sm' : isToday ? 'border-amber-300 bg-amber-100 text-amber-700' : holidayLabel || isWeekend ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-transparent bg-[var(--surface-primary)]/70 text-[var(--text-secondary)]'}`}
            >
              <p className="uppercase tracking-[0.34em] text-[var(--text-secondary)]">{date.toLocaleDateString(locale, { weekday: 'short' })}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{date.getDate()}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">{date.toLocaleDateString(locale, { month: 'short' })}</p>
              {isToday && !isSelected ? (
                <span className="mt-2 inline-flex rounded-full bg-amber-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700">{strings.calendar.today}</span>
              ) : holidayLabel ? (
                <span className="mt-2 inline-flex rounded-full bg-rose-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-700">{holidayLabel}</span>
              ) : isWeekend ? (
                <span className="mt-2 inline-flex rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">{date.getDay() === 0 ? strings.calendar.sunday : strings.calendar.saturday}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
