import { supabase } from './supabase';
import Constants from 'expo-constants';
import { DashboardData, AnalyticsData, Product, ScanType, ScanLimitStatus, ScanEligibilityResponse, N8nAnalysisResponse, ScanHistoryItem, NutritionHistoryDataPoint, Scan } from '@/types';
import { STORAGE_BUCKET_NAME } from '@/constants/scan';
import { N8nWebhookService } from './n8nWebhook';

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
    console.log('[ApiService] getAnalytics called with period:', period);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[ApiService] User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('[ApiService] User ID:', user.id);

    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('[ApiService] Fetching health_scores from:', startDate.toISOString().split('T')[0]);

    const { data: healthScores, error } = await supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('[ApiService] Error fetching health_scores:', error);
      throw error;
    }

    console.log('[ApiService] health_scores fetched:', healthScores?.length || 0, 'records');

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

  static async getScanLimits(): Promise<Record<ScanType, ScanLimitStatus>> {
    const scanTypes: ScanType[] = ['body', 'health', 'nutrition'];
    const results: Record<ScanType, ScanLimitStatus> = {} as any;

    for (const scanType of scanTypes) {
      try {
        const eligibility = await this.checkScanEligibility(scanType);
        results[scanType] = {
          scanType,
          currentCount: eligibility.current_count || 0,
          isLimitReached: !eligibility.allowed,
        };
      } catch (error) {
        console.error(`Error checking ${scanType} eligibility:`, error);
        results[scanType] = {
          scanType,
          currentCount: 0,
          isLimitReached: false,
        };
      }
    }

    return results;
  }

  static async checkScanEligibility(scanType: ScanType): Promise<ScanEligibilityResponse> {
    console.log('[ApiService.checkScanEligibility] ========================================');
    console.log('[ApiService.checkScanEligibility] STARTED');
    console.log('[ApiService.checkScanEligibility] scanType:', scanType);

    try {
      console.log('[ApiService.checkScanEligibility] Getting session...');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('[ApiService.checkScanEligibility] ERROR: No session found');
        throw new Error('User not authenticated');
      }

      console.log('[ApiService.checkScanEligibility] ✓ Session found');
      console.log('[ApiService.checkScanEligibility] User ID from session:', session.user?.id);

      const url = `${SUPABASE_URL}/functions/v1/check-and-record-scan`;
      console.log('[ApiService.checkScanEligibility] Calling Edge Function:', url);
      console.log('[ApiService.checkScanEligibility] Request body:', JSON.stringify({ scanType }));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ scanType }),
      });

      console.log('[ApiService.checkScanEligibility] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('[ApiService.checkScanEligibility] ERROR: Response not OK');
        let errorData;
        try {
          errorData = await response.json();
          console.error('[ApiService.checkScanEligibility] Error data:', JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          console.error('[ApiService.checkScanEligibility] Could not parse error response');
          const textError = await response.text();
          console.error('[ApiService.checkScanEligibility] Error text:', textError);
          throw new Error(`Failed to check scan eligibility: ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Failed to check scan eligibility');
      }

      const data: ScanEligibilityResponse = await response.json();
      console.log('[ApiService.checkScanEligibility] ✓ Response received');
      console.log('[ApiService.checkScanEligibility] Response data:', JSON.stringify(data, null, 2));
      console.log('[ApiService.checkScanEligibility] Allowed:', data.allowed);
      console.log('[ApiService.checkScanEligibility] Current count:', data.current_count);
      console.log('[ApiService.checkScanEligibility] Limit:', data.limit);
      console.log('[ApiService.checkScanEligibility] ========================================');
      return data;
    } catch (error) {
      console.error('[ApiService.checkScanEligibility] ========================================');
      console.error('[ApiService.checkScanEligibility] FAILED');
      console.error('[ApiService.checkScanEligibility] Error:', error);
      if (error instanceof Error) {
        console.error('[ApiService.checkScanEligibility] Error message:', error.message);
        console.error('[ApiService.checkScanEligibility] Error stack:', error.stack);
      }
      console.error('[ApiService.checkScanEligibility] ========================================');
      throw error;
    }
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
    console.log('[ApiService] ========================================');
    console.log('[ApiService] createScan STARTED');
    console.log('[ApiService] imageUri:', imageUri);
    console.log('[ApiService] scanType:', scanType);
    console.log('[ApiService] ========================================');

    try {
      // Step 1: Authenticate user
      console.log('[ApiService] STEP 1: Authenticating user...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[ApiService] ERROR: User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('[ApiService] ✓ User authenticated. User ID:', user.id);

      // Step 2: Check scan eligibility
      console.log('[ApiService] STEP 2: Checking scan eligibility...');
      const eligibility = await this.checkScanEligibility(scanType);
      console.log('[ApiService] Eligibility response:', JSON.stringify(eligibility, null, 2));

      if (!eligibility.allowed) {
        console.error('[ApiService] ERROR: Scan not allowed');
        console.error('[ApiService] Reason:', eligibility.message);
        console.error('[ApiService] Current count:', eligibility.current_count);
        console.error('[ApiService] Limit:', eligibility.limit);

        let errorMessage = eligibility.message || 'Scan non autorisé';

        if (eligibility.next_available_date) {
          const nextDate = new Date(eligibility.next_available_date);
          const formattedDate = nextDate.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          const baseMessage = errorMessage.split('.')[0];
          errorMessage = `${baseMessage}. Prochain scan disponible le ${formattedDate}.`;
        }

        throw new Error(errorMessage);
      }

      console.log('[ApiService] ✓ Scan eligibility confirmed');
      console.log('[ApiService] Current count after check:', eligibility.current_count);
      console.log('[ApiService] Limit:', eligibility.limit);

      // Step 3: Analyze image if nutrition scan
      let analysisResult: N8nAnalysisResponse | null = null;

      if (scanType === 'nutrition') {
        console.log('[ApiService] STEP 3: Analyzing nutrition (calling N8n webhook)...');
        try {
          analysisResult = await N8nWebhookService.analyzeImage(imageUri);
          console.log('[ApiService] ✓ N8n analysis completed');
          console.log('[ApiService] Analysis result:', JSON.stringify(analysisResult, null, 2));
        } catch (analysisError) {
          console.error('[ApiService] WARNING: N8n analysis failed:', analysisError);
          console.log('[ApiService] Continuing with null analysis result...');
        }
      } else {
        console.log('[ApiService] STEP 3: Skipping analysis (not a nutrition scan)');
      }

      // Step 4: Upload image to storage
      console.log('[ApiService] STEP 4: Uploading image to storage...');
      console.log('[ApiService] Fetching image from URI:', imageUri);
      const response = await fetch(imageUri);
      console.log('[ApiService] Image fetch status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('[ApiService] ✓ Image converted to blob');
      console.log('[ApiService] Blob size:', blob.size, 'bytes');
      console.log('[ApiService] Blob type:', blob.type);

      const timestamp = Date.now();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${timestamp}.${fileExt}`;
      console.log('[ApiService] Target filename:', fileName);
      console.log('[ApiService] Storage bucket:', STORAGE_BUCKET_NAME);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(fileName, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('[ApiService] ERROR: Storage upload failed');
        console.error('[ApiService] Upload error:', JSON.stringify(uploadError, null, 2));
        throw uploadError;
      }

      console.log('[ApiService] ✓ Image uploaded to storage');
      console.log('[ApiService] Upload data:', JSON.stringify(uploadData, null, 2));

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('[ApiService] ✓ Public URL generated:', publicUrlData.publicUrl);

      // Step 5: Insert scan record
      console.log('[ApiService] STEP 5: Inserting scan record into database...');
      const scanRecord = {
        user_id: user.id,
        scan_type: scanType,
        image_url: publicUrlData.publicUrl,
        analysis_result: analysisResult,
      };
      console.log('[ApiService] Scan record to insert:', JSON.stringify(scanRecord, null, 2));

      const { data, error } = await supabase
        .from('scans')
        .insert(scanRecord)
        .select()
        .single();

      if (error) {
        console.error('[ApiService] ERROR: Database insert failed');
        console.error('[ApiService] Insert error:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('[ApiService] ✓ Scan record inserted successfully');
      console.log('[ApiService] Inserted scan data:', JSON.stringify(data, null, 2));
      console.log('[ApiService] ========================================');
      console.log('[ApiService] createScan COMPLETED SUCCESSFULLY');
      console.log('[ApiService] ========================================');
      return data;
    } catch (error) {
      console.error('[ApiService] ========================================');
      console.error('[ApiService] createScan FAILED');
      console.error('[ApiService] Error:', error);
      console.error('[ApiService] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      if (error instanceof Error) {
        console.error('[ApiService] Error message:', error.message);
        console.error('[ApiService] Error stack:', error.stack);
      }
      console.error('[ApiService] ========================================');
      throw error;
    }
  }

  static async getScanHistory(scanType?: ScanType, limit: number = 50): Promise<ScanHistoryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    let query = supabase
      .from('scans')
      .select('id, scan_type, image_url, analysis_result, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scanType) {
      query = query.eq('scan_type', scanType);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as ScanHistoryItem[];
  }

  static async getScanById(scanId: string): Promise<Scan | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return data as Scan | null;
  }

  static async getNutritionHistory(period: '7days' | '30days' | '90days'): Promise<NutritionHistoryDataPoint[]> {
    console.log('[ApiService] getNutritionHistory called with period:', period);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('[ApiService] User not authenticated');
      throw new Error('User not authenticated');
    }

    console.log('[ApiService] User ID:', user.id);

    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log('[ApiService] Fetching scans from:', startDate.toISOString());

    const { data: scans, error } = await supabase
      .from('scans')
      .select('created_at, analysis_result')
      .eq('user_id', user.id)
      .eq('scan_type', 'nutrition')
      .not('analysis_result', 'is', null)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ApiService] Error fetching nutrition scans:', error);
      console.warn('[ApiService] Returning empty nutrition history due to error');
      return [];
    }

    console.log('[ApiService] Nutrition scans fetched:', scans?.length || 0, 'records');

    const dataPoints: NutritionHistoryDataPoint[] = [];

    if (scans && scans.length > 0) {
      for (const scan of scans) {
        try {
          const analysisResult = scan.analysis_result as any;

          if (analysisResult && analysisResult.totals) {
            const date = new Date(scan.created_at).toISOString().split('T')[0];

            dataPoints.push({
              date,
              kcal: analysisResult.totals.kcal || 0,
              protein_g: analysisResult.totals.protein_g || 0,
              carb_g: analysisResult.totals.carb_g || 0,
              fat_g: analysisResult.totals.fat_g || 0,
            });
          }
        } catch (err) {
          console.warn('[ApiService] Error parsing scan analysis_result:', err);
        }
      }
    }

    console.log('[ApiService] Extracted data points:', dataPoints.length);

    const aggregatedData = dataPoints.reduce((acc, point) => {
      const existing = acc.find(d => d.date === point.date);
      if (existing) {
        existing.kcal += point.kcal;
        existing.protein_g += point.protein_g;
        existing.carb_g += point.carb_g;
        existing.fat_g += point.fat_g;
      } else {
        acc.push({ ...point });
      }
      return acc;
    }, [] as NutritionHistoryDataPoint[]);

    console.log('[ApiService] Aggregated data points:', aggregatedData.length);

    return aggregatedData;
  }

  static async deleteScan(scanId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', scanId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
}
