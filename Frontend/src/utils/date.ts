/**
 * Returns the current date as a YYYY-MM-DD string in the user's local timezone.
 * Using new Date().toISOString() would give the UTC date, which can be off by
 * one day for users in UTC+ timezones around midnight.
 */
export function localDateString(d = new Date()): string {
  return d.toLocaleDateString('en-CA')
}

/**
 * Returns the current datetime as an ISO-8601 string with the local timezone
 * offset (e.g. "2026-03-16T18:15:00+01:00").
 * Using new Date().toISOString() would give a UTC timestamp, which would show
 * the wrong time for the user when sent to the backend.
 */
export function localISOString(d = new Date()): string {
  const offset = -d.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const hh = pad(Math.floor(Math.abs(offset) / 60))
  const mm = pad(Math.abs(offset) % 60)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 19) + `${sign}${hh}:${mm}`
}
