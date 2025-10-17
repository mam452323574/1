export interface Product {
  id: number;
  name: string;
  imageUrl: string;
  benefits: string[];
  shopUrl: string;
}

export interface DashboardData {
  healthScore: number;
  calories: {
    current: number;
    goal: number;
  };
  bodyfat: number;
  recommendedProducts: Product[];
}

export interface HealthScoreHistoryItem {
  date: string;
  value: number;
}

export interface CalorieHistoryItem {
  date: string;
  consumed: number;
  goal: number;
}

export interface BodyCompositionHistoryItem {
  date: string;
  bodyfat: number;
  muscle: number;
}

export interface AnalyticsData {
  period: string;
  healthScoreHistory: HealthScoreHistoryItem[];
  calorieHistory: CalorieHistoryItem[];
  bodyCompositionHistory: BodyCompositionHistoryItem[];
}

export type ScanType = 'body' | 'health' | 'nutrition';

export interface ScanResult {
  type: 'muscle' | 'fat';
  percentage: number;
  imageUrl: string;
}

export interface ScanLimitStatus {
  scanType: ScanType;
  currentCount: number;
  isLimitReached: boolean;
}

export interface Recipe {
  id: number;
  name: string;
  imageUrl: string;
  preparationTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Exercise {
  id: number;
  name: string;
  imageUrl: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ApiState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type AccountTier = 'free' | 'premium';

export type OAuthProvider = 'google' | 'apple' | 'email';

export interface ScanUsageRecord {
  last_scan_date: string | null;
  scan_timestamps: string[];
}

export interface ScanUsage {
  health: ScanUsageRecord;
  body: ScanUsageRecord;
  nutrition: ScanUsageRecord;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
  account_tier: AccountTier;
  bio: string | null;
  push_token: string | null;
  notification_settings: {
    reminders: boolean;
    achievements: boolean;
    newContent: boolean;
  };
  scan_usage: ScanUsage;
  last_scan_date: string | null;
  account_created_at: string;
  created_at: string;
  updated_at: string;
}

export interface OAuthConnection {
  id: string;
  user_id: string;
  provider: OAuthProvider;
  provider_user_id: string;
  provider_email: string | null;
  linked_at: string;
  metadata: Record<string, any>;
}

export interface PremiumFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_description: string | null;
  free_tier_description: string | null;
  premium_tier_description: string | null;
  requires_premium: boolean;
  category: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisposableEmailDomain {
  id: string;
  domain: string;
  added_at: string;
  added_by: string | null;
  active: boolean;
  notes: string | null;
}

export interface ScanEligibilityResponse {
  success: boolean;
  allowed: boolean;
  message: string;
  next_available_date?: number;
  current_count?: number;
  limit?: number;
  error?: string;
}

export interface ScanLimitConfig {
  count: number;
  periodMs: number;
  label: string;
}

export interface VerificationCode {
  id: string;
  user_id: string;
  email: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_identifier: string;
  device_name: string | null;
  platform: string;
  trusted_until: string;
  last_used_at: string;
  created_at: string;
}

export interface DeviceInfo {
  device_identifier: string;
  device_name: string;
  platform: 'ios' | 'android' | 'web';
}

export interface VerificationResult {
  success: boolean;
  message?: string;
  error?: string;
  expires_at?: string;
  code?: string;
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
  expires_at?: string;
  error?: string;
}
