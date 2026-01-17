/**
 * Debug utilities
 */

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get localStorage usage info
 */
export function getStorageInfo(): {
  total: number;
  available: number;
  percent: number;
} {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  // Typical browser limit is 5-10MB
  const limit = 5 * 1024 * 1024;
  return {
    total,
    available: limit - total,
    percent: (total / limit) * 100,
  };
}
