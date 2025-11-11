export type ScanType = 'body' | 'health' | 'nutrition';
export type AccountTier = 'free' | 'premium';

export interface ScanLimitConfig {
  count: number;
  periodMs: number;
}

export const SCAN_LIMITS: Record<AccountTier, Record<ScanType, ScanLimitConfig>> = {
  free: {
    health: { count: 1, periodMs: 7 * 24 * 60 * 60 * 1000 },
    body: { count: 1, periodMs: 30 * 24 * 60 * 60 * 1000 },
    nutrition: { count: 1, periodMs: 3 * 24 * 60 * 60 * 1000 },
  },
  premium: {
    health: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    body: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
    nutrition: { count: 3, periodMs: 24 * 60 * 60 * 1000 },
  },
};

export const SCAN_MESSAGES: Record<AccountTier, Record<ScanType, string>> = {
  free: {
    health: 'Limite hebdomadaire atteinte',
    body: 'Limite mensuelle atteinte',
    nutrition: 'Limite atteinte',
  },
  premium: {
    health: 'Limite quotidienne atteinte (3 scans)',
    body: 'Limite quotidienne atteinte (3 scans)',
    nutrition: 'Limite quotidienne atteinte (3 scans)',
  },
};

export function formatTimeRemaining(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `${seconds} seconde${seconds > 1 ? 's' : ''}`;
  }
}

export function formatAbsoluteDate(timestamp: number): string {
  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleString('fr-FR', options);
}
