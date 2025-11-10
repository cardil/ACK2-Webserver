// frontend/src/lib/utils/time.ts

/**
  * Formats a duration in seconds into a human-readable string (e.g., "1h 2m 3s").
  * @param seconds The duration in seconds.
  * @returns A formatted string.
  */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  let timeString = '';
  if (h > 0) timeString += `${h}h `;
  if (m > 0) timeString += `${m}m `;
  if (s > 0 || timeString === '') timeString += `${s}s`;

  return timeString.trim();
}
