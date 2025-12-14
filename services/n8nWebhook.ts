interface N8nNutritionAnalysisRequest {
  imageUrl: string;
  userId: string;
  scanType: 'food' | 'supplement';
}

interface N8nNutritionAnalysisResponse {
  success: boolean;
  data?: {
    productName: string;
    brand?: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    ingredients?: string[];
    allergens?: string[];
    nutritionScore?: number;
    healthScore?: number;
    recommendations?: string[];
  };
  error?: string;
}

const N8N_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_WEBHOOK_URL || '';

export class N8nWebhookService {
  static async analyzeNutrition(
    imageUrl: string,
    userId: string,
    scanType: 'food' | 'supplement'
  ): Promise<N8nNutritionAnalysisResponse> {
    try {
      console.log('[N8n] Starting nutrition analysis via webhook');
      console.log('[N8n] Image URL:', imageUrl);
      console.log('[N8n] User ID:', userId);
      console.log('[N8n] Scan Type:', scanType);

      if (!N8N_WEBHOOK_URL) {
        console.error('[N8n] Webhook URL not configured');
        throw new Error('N8n webhook URL is not configured');
      }

      const requestBody: N8nNutritionAnalysisRequest = {
        imageUrl,
        userId,
        scanType,
      };

      console.log('[N8n] Sending request to webhook:', N8N_WEBHOOK_URL);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('[N8n] Webhook request failed:', response.status, response.statusText);
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }

      const data: N8nNutritionAnalysisResponse = await response.json();
      console.log('[N8n] Analysis completed successfully');

      return data;
    } catch (error) {
      console.error('[N8n] Error analyzing nutrition:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async testWebhookConnection(): Promise<boolean> {
    try {
      console.log('[N8n] Testing webhook connection');

      if (!N8N_WEBHOOK_URL) {
        console.error('[N8n] Webhook URL not configured');
        return false;
      }

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'GET',
      });

      const isConnected = response.ok;
      console.log('[N8n] Connection test result:', isConnected ? 'Success' : 'Failed');

      return isConnected;
    } catch (error) {
      console.error('[N8n] Connection test error:', error);
      return false;
    }
  }
}

export type { N8nNutritionAnalysisRequest, N8nNutritionAnalysisResponse };
