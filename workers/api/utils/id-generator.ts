/**
 * Generate a unique ID for viruses and vaccines
 * Format: timestamp-randomstring
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
