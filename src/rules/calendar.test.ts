import { expect, it } from 'vitest';
import { CALENDARS, dateFromIndex, daysUntilHoliday, formatDate, indexFromDate } from './calendar';

it('places Shieldmeet after Midsummer every fourth year without shifting month IDs', () => {
  const c = CALENDARS.harptos;
  const start = 1491;
  const midsummer = indexFromDate(c, start, 1492, 9, 1);
  const shieldmeet = c.months.length;
  expect(formatDate(c, start, midsummer + 1)).toBe('Shieldmeet, 1492 DR');
  expect(indexFromDate(c, start, 1492, shieldmeet, 1)).toBe(midsummer + 1);
  expect(dateFromIndex(c, start, midsummer + 2)).toMatchObject({ year: 1492, monthIndex: 10, day: 1 });
  expect(indexFromDate(c, start, 1493, 0, 1)).toBe(731);
  expect(formatDate(c, start, indexFromDate(c, start, 1493, 9, 1) + 1)).toBe('1 Eleasis, 1493 DR');
  expect(daysUntilHoliday(c, start, midsummer + 2, { name: 'Shieldmeet', monthIndex: shieldmeet, day: 1 })).toBe(1460);
});

it('counts Shieldmeet in recurring dates and supports holidays spanning a year boundary', () => {
  const c = CALENDARS.harptos;
  const yearStart = indexFromDate(c, 1492, 1493, 0, 1);
  expect(daysUntilHoliday(c, 1492, yearStart - 1, { name: 'New Year', monthIndex: 0, day: 1 })).toBe(1);
  expect(daysUntilHoliday(c, 1492, yearStart, { name: 'Feast', monthIndex: 16, day: 30, days: 2 })).toBe(0);
});
