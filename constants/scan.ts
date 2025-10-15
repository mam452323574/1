import { ScanType, ScanLimitConfig } from '@/types';

export const MAX_SCANS_PER_TYPE = 3;
export const RATE_LIMIT_HOURS = 24;
export const STORAGE_BUCKET_NAME = 'scan-images';

export const SCAN_TYPE_LABELS: Record<ScanType, string> = {
  body: 'Corps',
  health: 'Santé (Visage)',
  nutrition: 'Nutrition',
};

export const FREE_SCAN_LIMITS: Record<ScanType, ScanLimitConfig> = {
  health: {
    count: 1,
    periodMs: 7 * 24 * 60 * 60 * 1000,
    label: '1 scan par semaine',
  },
  body: {
    count: 1,
    periodMs: 30 * 24 * 60 * 60 * 1000,
    label: '1 scan par mois',
  },
  nutrition: {
    count: 1,
    periodMs: 3 * 24 * 60 * 60 * 1000,
    label: '1 scan tous les 3 jours',
  },
};

export const PREMIUM_SCAN_LIMITS: Record<ScanType, ScanLimitConfig> = {
  health: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: '3 scans par jour',
  },
  body: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: '3 scans par jour',
  },
  nutrition: {
    count: 3,
    periodMs: 24 * 60 * 60 * 1000,
    label: '3 scans par jour',
  },
};

export const SCAN_LIMIT_MESSAGES: Record<ScanType, { free: string; premium: string }> = {
  health: {
    free: 'Limite hebdomadaire atteinte',
    premium: 'Limite quotidienne atteinte (3 scans)',
  },
  body: {
    free: 'Limite mensuelle atteinte',
    premium: 'Limite quotidienne atteinte (3 scans)',
  },
  nutrition: {
    free: 'Limite atteinte (tous les 3 jours)',
    premium: 'Limite quotidienne atteinte (3 scans)',
  },
};

export const NOTIFICATION_MESSAGES: Record<ScanType, { title: string; body: string }> = {
  health: {
    title: 'Scan Santé Disponible',
    body: 'Votre scan santé hebdomadaire est maintenant disponible. Prenez soin de vous !',
  },
  body: {
    title: 'Scan Corps Disponible',
    body: 'Votre scan corps mensuel est maintenant disponible. Suivez votre progression !',
  },
  nutrition: {
    title: 'Scan Nutrition Disponible',
    body: 'Votre scan nutrition est maintenant disponible. Analysez vos repas !',
  },
};
