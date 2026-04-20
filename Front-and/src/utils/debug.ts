/**
 * Debug utility for 3D model loading
 * Add console debugging to track model loading issues
 */

export function debugLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[3D DEBUG ${timestamp}] ${message}`, data || '');
}

export function debugError(message: string, error?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.error(`[3D ERROR ${timestamp}] ${message}`, error || '');
}

export function debugWarn(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString();
  console.warn(`[3D WARN ${timestamp}] ${message}`, data || '');
}
