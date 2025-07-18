// src/lib/nutrition/timezone-utils.ts
import { format, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz'

/**
 * Creates a date with the specified hour in the user's timezone,
 * then converts it to UTC for database storage while preserving the local intent
 */
export function createTimezoneAwareLoggedAt(
  selectedDate: Date,
  hour: number,
  userTimezone: string
): string {
  // Create a date string in the user's timezone with the intended hour
  const dateString = format(selectedDate, 'yyyy-MM-dd')
  const timeString = `${hour.toString().padStart(2, '0')}:00:00`
  const localDateTimeString = `${dateString} ${timeString}`
  
  // Parse this as if it's in the user's timezone
  const zonedDate = new Date(`${localDateTimeString}`)
  
  // Convert from user's timezone to UTC while preserving the local time intent
  const utcDate = fromZonedTime(zonedDate, userTimezone)
  
  return utcDate.toISOString()
}

/**
 * Converts a UTC timestamp back to the user's timezone for display
 */
export function parseLoggedAtForDisplay(
  utcTimestamp: string,
  userTimezone: string
): Date {
  const utcDate = parseISO(utcTimestamp)
  return toZonedTime(utcDate, userTimezone)
}

/**
 * Gets the hour from a UTC timestamp in the user's timezone
 */
export function getHourInTimezone(
  utcTimestamp: string,
  userTimezone: string
): number {
  const localDate = parseLoggedAtForDisplay(utcTimestamp, userTimezone)
  return localDate.getHours()
}

/**
 * Formats a timestamp for display in the user's timezone
 */
export function formatInUserTimezone(
  utcTimestamp: string,
  userTimezone: string,
  formatString: string = 'HH:mm'
): string {
  return formatInTimeZone(parseISO(utcTimestamp), userTimezone, formatString)
}

/**
 * Detects the user's browser timezone
 */
export function detectBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Common timezone options for settings dropdown
 */
export const COMMON_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Mountain Standard Time (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
] as const