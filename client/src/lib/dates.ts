import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isToday,
  isWeekend,
  parseISO,
  startOfMonth,
  endOfMonth,
  differenceInCalendarDays,
} from 'date-fns';

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getMonthRange(date: Date) {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getFourWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = addWeeks(start, 4);
  return { start, end };
}

export function navigateRange(
  currentStart: Date,
  direction: 'prev' | 'next',
  view: 'week' | 'month'
) {
  const fn = direction === 'next' ? (view === 'week' ? addWeeks : addMonths) : (view === 'week' ? subWeeks : subMonths);
  const newDate = fn(currentStart, view === 'week' ? 2 : 1);
  return view === 'week' ? getFourWeekRange(newDate) : getMonthRange(newDate);
}

export function getDaysInRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end });
}

export function formatDate(date: Date | string, fmt: string = 'yyyy-MM-dd') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function getBookingSpan(
  bookingStart: string,
  bookingEnd: string,
  rangeStart: Date,
  rangeEnd: Date
): { startCol: number; span: number } | null {
  const bStart = parseISO(bookingStart);
  const bEnd = parseISO(bookingEnd);

  // No overlap
  if (bEnd < rangeStart || bStart > rangeEnd) return null;

  const effectiveStart = bStart < rangeStart ? rangeStart : bStart;
  const effectiveEnd = bEnd > rangeEnd ? rangeEnd : bEnd;

  const startCol = differenceInCalendarDays(effectiveStart, rangeStart);
  const span = differenceInCalendarDays(effectiveEnd, effectiveStart) + 1;

  return { startCol, span };
}

export { isToday, isWeekend, parseISO, format, addWeeks, startOfWeek };
