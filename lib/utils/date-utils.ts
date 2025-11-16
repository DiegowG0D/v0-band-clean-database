/**
 * Date utilities for Malta timezone (Europe/Malta - CET/CEST)
 * Malta uses Central European Time (UTC+1) and Central European Summer Time (UTC+2)
 */

/**
 * Get current date/time in Malta timezone
 * @returns ISO string in Malta timezone
 */
export function getMaltaDateTime(): string {
  return new Date().toLocaleString('en-US', {
    timeZone: 'Europe/Malta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).replace(/(\d+)\/(\d+)\/(\d+),\s(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6');
}

/**
 * Get current date in Malta timezone (YYYY-MM-DD format)
 * @returns Date string in Malta timezone
 */
export function getMaltaDate(): string {
  const date = new Date();
  return date.toLocaleDateString('en-CA', {
    timeZone: 'Europe/Malta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Get current time in Malta timezone (HH:MM format)
 * @returns Time string in Malta timezone
 */
export function getMaltaTime(): string {
  const date = new Date();
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Malta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format a date to Malta timezone
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatMaltaDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-GB', {
    timeZone: 'Europe/Malta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
