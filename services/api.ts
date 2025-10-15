import { supabase } from './supabase';
import Constants from 'expo-constants';
import { DashboardData, AnalyticsData, Product, ScanType, ScanLimitStatus, ScanEligibilityResponse } from '@/types';
import { MAX_SCANS_PER_TYPE, RATE_LIMIT_HOURS, STORAGE_BUCKET_NAME } from '@/constants/scan';

const SUPABASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;

export class ApiService {
  static async getDashboard(): Promise<DashboardData> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: healthScore, error: healthError } = await supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (healthError) throw healthError;

    const { data: products, error: productsError } = await supabase
      .from('recommended_products')
      .select('*')
      .eq('active', true)
      .limit(5);

    if (productsError) throw productsError;

    const recommendedProducts: Product[] = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      imageUrl: p.image_url,
      benefits: p.benefits || [],
      shopUrl: p.shop_url,
    }));

    return {
      healthScore: healthScore?.score || 0,
      calories: {
        current: healthScore?.calories_current || 0,
        goal: healthScore?.calories_goal || 2000,
      },
      bodyfat: healthScore?.bodyfat || 0,
      recommendedProducts,
    };
  }

  static async getAnalytics(period: '7days' | '30days' | '90days'): Promise<AnalyticsData> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: healthScores, error } = await supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    const healthScoreHistory = (healthScores || []).map((h: any) => ({
      date: h.date,
      value: h.score,
    }));

    const calorieHistory = (healthScores || []).map((h: any) => ({
      date: h.date,
      consumed: h.calories_current,
      goal: h.calories_goal,
    }));

    const bodyCompositionHistory = (healthScores || []).map((h: any) => ({
      date: h.date,
      bodyfat: h.bodyfat,
      muscle: h.muscle,
    }));

    return {
      period,
      healthScoreHistory,
      calorieHistory,
      bodyCompositionHistory,
    };
  }

  static async getRecipes() {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * @deprecated Use checkScanEligibility instead - this uses server-side validation
   */
  static async checkScanLimit(scanType: ScanType): Promise<ScanLimitStatus> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - RATE_LIMIT_HOURS);

    const { count, error } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('scan_type', scanType)
      .gte('created_at', hoursAgo.toISOString());

    if (error) throw error;

    const currentCount = count || 0;

    return {
      scanType,
      currentCount,
      isLimitReached: currentCount >= MAX_SCANS_PER_TYPE,
    };
  }

  /**
   * @deprecated Use checkScanEligibility for each scan type instead
   */
  static async getScanLimits(): Promise<Record<ScanType, ScanLimitStatus>> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - RATE_LIMIT_HOURS);

    const scanTypes: ScanType[] = ['body', 'health', 'nutrition'];
    const results: Record<ScanType, ScanLimitStatus> = {} as any;

    for (const scanType of scanTypes) {
      const { count, error } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('scan_type', scanType)
        .gte('created_at', hoursAgo.toISOString());

      if (error) throw error;

      const currentCount = count || 0;
      results[scanType] = {
        scanType,
        currentCount,
        isLimitReached: currentCount >= MAX_SCANS_PER_TYPE,
      };
    }

    return results;
  }

  static async checkScanEligibility(scanType: ScanType): Promise<ScanEligibilityResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/check-and-record-scan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanType }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check scan eligibility');
    }

    const data: ScanEligibilityResponse = await response.json();
    return data;
  }

  static async getNextAvailableScanDate(scanType: ScanType): Promise<number | null> {
    try {
      const result = await this.checkScanEligibility(scanType);
      return result.next_available_date || null;
    } catch (error) {
      console.error('Error getting next scan date:', error);
      return null;
    }
  }

  static async createScan(imageUri: string, scanType: ScanType) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const eligibility = await this.checkScanEligibility(scanType);
    if (!eligibility.allowed) {
      throw new Error(eligibility.message || 'Scan non autorisé');
    }

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const timestamp = Date.now();
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${timestamp}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: scanType,
        image_url: publicUrlData.publicUrl,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
