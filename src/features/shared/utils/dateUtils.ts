import { format, parseISO, addMinutes, differenceInMinutes, isBefore, isAfter, startOfDay, endOfDay, isValid } from 'date-fns';

function safeDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null;
  const timestamp = date as Date & { toDate?: () => Date };
  let d: Date;
  if (typeof date === 'string') {
    d = parseISO(date);
  } else if (typeof timestamp.toDate === 'function') {
    d = timestamp.toDate();
  } else if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'object' && 'seconds' in date) {
    const seconds = Number((date as { seconds: number }).seconds);
    const nanoseconds = Number((date as { nanoseconds?: number }).nanoseconds || 0);
    d = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
  } else {
    d = new Date(date);
  }
  return isValid(d) ? d : null;
}

export function formatDate(date: Date | string | number | null | undefined, pattern = 'MMM d, yyyy'): string {
  const d = safeDate(date);
  if (!d) return '';
  try {
    return format(d, pattern);
  } catch {
    return '';
  }
}

export function formatTime(date: Date | string | number | null | undefined, pattern = 'h:mm a'): string {
  const d = safeDate(date);
  if (!d) return '';
  try {
    return format(d, pattern);
  } catch {
    return '';
  }
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  const d = safeDate(date);
  if (!d) return '';
  try {
    return `${formatDate(d)} at ${formatTime(d)}`;
  } catch {
    return '';
  }
}

export function getDayOfWeek(date: Date | string | number | null | undefined): number {
  const d = safeDate(date);
  if (!d) return -1;
  return d.getDay();
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || '';
}

export function getShortDayName(dayOfWeek: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || '';
}

export function isSameDay(date1: Date | string | number | null | undefined, date2: Date | string | number | null | undefined): boolean {
  if (!date1 || !date2) return false;
  try {
    const d1 = safeDate(date1);
    const d2 = safeDate(date2);
    if (!d1 || !d2) return false;
    return format(d1, 'yyyy-MM-dd') === format(d2, 'yyyy-MM-dd');
  } catch {
    return false;
  }
}

export function isToday(date: Date | string | number | null | undefined): boolean {
  if (!date) return false;
  try {
    return isSameDay(date, new Date());
  } catch {
    return false;
  }
}

export function isPast(date: Date | string | number | null | undefined): boolean {
  if (!date) return false;
  try {
    const d = safeDate(date);
    if (!d) return false;
    return isBefore(d, new Date());
  } catch {
    return false;
  }
}

export function isFuture(date: Date | string | number | null | undefined): boolean {
  if (!date) return false;
  try {
    const d = safeDate(date);
    if (!d) return false;
    return isAfter(d, new Date());
  } catch {
    return false;
  }
}

export function addMinutesToDate(date: Date | string | number | null | undefined, minutes: number): Date | null {
  const d = safeDate(date);
  if (!d) return null;
  try {
    return addMinutes(d, minutes);
  } catch {
    return null;
  }
}

export function getMinutesDifference(start: Date | string | number | null | undefined, end: Date | string | number | null | undefined): number {
  const s = safeDate(start);
  const e = safeDate(end);
  if (!s || !e) return 0;
  try {
    return differenceInMinutes(e, s);
  } catch {
    return 0;
  }
}

export function getTimeString(date: Date | string | number | null | undefined): string {
  return formatTime(date, 'HH:mm');
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

export function createDateWithTime(date: Date | string | number | null | undefined, timeStr: string): Date | null {
  const d = safeDate(date);
  if (!d) return null;
  try {
    const { hours, minutes } = parseTimeString(timeStr);
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch {
    return null;
  }
}

export function getStartOfDay(date: Date | string | number | null | undefined): Date | null {
  const d = safeDate(date);
  if (!d) return null;
  try {
    return startOfDay(d);
  } catch {
    return null;
  }
}

export function getEndOfDay(date: Date | string | number | null | undefined): Date | null {
  const d = safeDate(date);
  if (!d) return null;
  try {
    return endOfDay(d);
  } catch {
    return null;
  }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function getRelativeTimeString(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  try {
    const d = safeDate(date);
    if (!d) return '';
    const now = new Date();
    const diffMinutes = differenceInMinutes(d, now);
    
    if (diffMinutes < 0) {
      return `${Math.abs(diffMinutes)} min ago`;
    }
    if (diffMinutes < 60) {
      return `in ${diffMinutes} min`;
    }
    const hours = Math.floor(diffMinutes / 60);
    return `in ${hours}h`;
  } catch {
    return '';
  }
}
