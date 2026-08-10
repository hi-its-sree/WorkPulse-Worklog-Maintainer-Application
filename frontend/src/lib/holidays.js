import { formatDateKey } from '../components/workflow/constants.js';

const nthWeekday = (year, month, weekday, n) => {
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === weekday) {
      count += 1;
      if (count === n) return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return null;
};

// Returns { 'YYYY-MM-DD': label } for the given year, labelled in the active language.
export const getJapaneseHolidays = (year, strings) => {
  const names = strings.holidays;
  const holidays = {};
  const add = (date, label) => {
    if (date) holidays[formatDateKey(date)] = label;
  };

  add(new Date(year, 0, 1), names.newYear);
  add(nthWeekday(year, 0, 1, 2), names.comingOfAge);
  add(new Date(year, 1, 11), names.nationalFoundation);
  add(new Date(year, 1, 23), names.emperorsBirthday);
  add(new Date(year, 2, 20), names.vernalEquinox);
  add(new Date(year, 3, 29), names.showa);
  add(new Date(year, 4, 3), names.constitutionMemorial);
  add(new Date(year, 4, 4), names.greenery);
  add(new Date(year, 4, 5), names.children);
  add(nthWeekday(year, 6, 1, 3), names.marine);
  add(new Date(year, 7, 11), names.mountain);
  add(nthWeekday(year, 8, 1, 3), names.respectForTheAged);
  add(new Date(year, 8, 23), names.autumnalEquinox);
  add(nthWeekday(year, 9, 1, 2), names.sports);
  add(new Date(year, 10, 3), names.culture);
  add(new Date(year, 10, 23), names.laborThanksgiving);

  return holidays;
};
