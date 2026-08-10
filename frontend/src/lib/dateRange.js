const pad = (value) => String(value).padStart(2, '0');

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// Inclusive {dateFrom, dateTo} for the period containing `today`.
export const buildDateRange = (selectedFilter, today = new Date()) => {
  if (selectedFilter === 'Daily') {
    return { dateFrom: toDateKey(today), dateTo: toDateKey(today) };
  }

  if (selectedFilter === 'Weekly') {
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { dateFrom: toDateKey(monday), dateTo: toDateKey(sunday) };
  }

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { dateFrom: toDateKey(firstOfMonth), dateTo: toDateKey(lastOfMonth) };
};

// The equivalent period immediately before the one `buildDateRange` would return,
// used to compare the current period against the previous one.
export const buildPreviousDateRange = (selectedFilter, today = new Date()) => {
  const anchor = new Date(today);

  if (selectedFilter === 'Daily') {
    anchor.setDate(anchor.getDate() - 1);
  } else if (selectedFilter === 'Weekly') {
    anchor.setDate(anchor.getDate() - 7);
  } else {
    anchor.setMonth(anchor.getMonth() - 1, 1);
  }

  return buildDateRange(selectedFilter, anchor);
};
