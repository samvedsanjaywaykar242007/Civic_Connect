import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Generate a unique civic complaint ticket number (e.g., CC-2026-MH-4821)
 */
export function generateTicketNumber(stateCode = 'MH'): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CC-${year}-${stateCode}-${randomDigits}`;
}

/**
 * Format ISO date string into readable date format
 */
export function formatFullDate(isoString: string): string {
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : new Date(isoString);
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch {
    return isoString;
  }
}

export const formatDate = formatFullDate;
export const formatDateTime = formatFullDate;

export function formatCategoryLabel(category: string): string {
  if (!category) return 'Civic Issue';
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Resolved':
      return '#10B981';
    case 'In Progress':
      return '#0284C7';
    case 'Assigned':
      return '#6366F1';
    case 'Verified':
      return '#F59E0B';
    case 'Submitted':
    default:
      return '#64748B';
  }
}

/**
 * Format ISO date string into relative time (e.g. "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = typeof isoString === 'string' ? parseISO(isoString) : new Date(isoString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return isoString;
  }
}

/**
 * Format GPS coordinates into clean string (e.g., "18.5204° N, 73.8567° E")
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

/**
 * Format distance in km / meters
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
