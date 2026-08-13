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

      {/* Seven equal columns. Every cell is the same height and width whether or not
          it carries a holiday name, and a long name is clipped rather than
          stretching its column. */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[560px] grid-cols-7 gap-2">
          {weekDates.map((date) => {
            const key = formatDateKey(date);
            const isToday = isSameDate(date, today);
            const isSelected = isSameDate(date, selectedDate);
            const holidayLabel = holidays[key];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            const badge = isToday && !isSelected
              ? { text: strings.calendar.today, tone: 'bg-amber-200 text-amber-700' }
              : holidayLabel
                ? { text: holidayLabel, tone: 'bg-rose-200 text-rose-700' }
                : isWeekend
                  ? { text: date.getDay() === 0 ? strings.calendar.sunday : strings.calendar.saturday, tone: 'bg-slate-200 text-slate-600' }
                  : null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectDate(date)}
                title={holidayLabel || undefined}
                className={`flex h-[116px] w-full flex-col items-center justify-start overflow-hidden rounded-[24px] border px-2 py-3 text-center text-[11px] transition ${isSelected ? 'border-[var(--accent)] bg-[var(--surface-primary)] shadow-sm' : isToday ? 'border-amber-300 bg-amber-100 text-amber-700' : holidayLabel || isWeekend ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-transparent bg-[var(--surface-primary)]/70 text-[var(--text-secondary)]'}`}
              >
                <p className="w-full truncate uppercase tracking-[0.2em] text-[var(--text-secondary)]">{date.toLocaleDateString(locale, { weekday: 'short' })}</p>
                <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{date.getDate()}</p>
                <p className="w-full truncate text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">{date.toLocaleDateString(locale, { month: 'short' })}</p>
                {/* Reserved slot: cells without a badge keep the same height. */}
                <span className="mt-auto flex h-[22px] w-full items-center justify-center">
                  {badge && (
                    <span className={`block max-w-full truncate rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${badge.tone}`}>
                      {badge.text}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;
