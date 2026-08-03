import { CalendarDays, Clock3 } from 'lucide-react';
import { formatDateKey, isSameDate } from './constants.js';

const WeeklyCalendar = ({ weekDates, selectedDate, onSelectDate, holidays = {}, today }) => {
  return (
    <div className="rounded-[32px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)]/80 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
          <CalendarDays size={16} />
          <span>Weekly calendar</span>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--text-secondary)]">
          <Clock3 size={14} />
          <span>Tap a day</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
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
              className={`min-w-[84px] rounded-[24px] border px-3 py-3 text-center text-[11px] transition ${isSelected ? 'border-[var(--accent)] bg-[var(--surface-primary)] shadow-sm' : isToday ? 'border-amber-300 bg-amber-100 text-amber-700' : holidayLabel || isWeekend ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-transparent bg-[var(--surface-primary)]/70 text-[var(--text-secondary)]'}`}
            >
              <p className="uppercase tracking-[0.34em] text-[var(--text-secondary)]">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className={`mt-2 text-sm font-semibold ${isSelected ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{date.getDate()}</p>
              {isToday && !isSelected ? (
                <span className="mt-2 inline-flex rounded-full bg-amber-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-700">Today</span>
              ) : holidayLabel ? (
                <span className="mt-2 inline-flex rounded-full bg-rose-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-700">{holidayLabel}</span>
              ) : isWeekend ? (
                <span className="mt-2 inline-flex rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600">{date.getDay() === 0 ? 'Sun' : 'Sat'}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;
