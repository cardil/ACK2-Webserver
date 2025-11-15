/**
 * Formats a Unix timestamp into a human-readable duration string representing the time elapsed
 * since the timestamp. It uses the same formatting as formatDuration.
 * @param timestamp The Unix timestamp in seconds.
 * @returns A formatted duration string.
 */
export function formatTimestamp(timestamp: number, now: number): string {
  const seconds = Math.floor(now - timestamp)
  return formatDuration(seconds)
}
// frontend/src/lib/utils/time.ts

/**
 * Formats a duration in seconds into a human-readable string (e.g., "1h 2m 3s").
 * @param seconds The duration in seconds.
 * @returns A formatted string.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return "N/A"

  const y = Math.floor(seconds / (3600 * 24 * 365))
  const d = Math.floor((seconds % (3600 * 24 * 365)) / (3600 * 24))
  const h = Math.floor((seconds % (3600 * 24)) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  let timeString = ""
  if (y > 0) timeString += `${y}y `
  if (d > 0) timeString += `${d}d `
  if (h > 0) timeString += `${h}h `
  if (m > 0) timeString += `${m}m `
  if (s > 0 || timeString === "") timeString += `${s}s`

  return timeString.trim()
}
