import { ScanType } from '@/types';

interface N8nAnalysisRequest {
  imageUrl: string;
  userId: string;
  scanType: ScanType;
}

interface N8nAnalysisResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

const N8N_WEBHOOKS = [
  'https://n8n.basedjew.com/webhook/analyse_1',
  'https://n8n.basedjew.com/webhook/analyse_2',
  'https://n8n.basedjew.com/webhook/analyse_3',
  'https://n8n.basedjew.com/webhook/analyse_4',
  'https://n8n.basedjew.com/webhook/analyse_5',
  'https://n8n.basedjew.com/webhook/analyse_6',
  'https://n8n.basedjew.com/webhook/analyse_7',
];

let currentWebhookIndex = 0;

export class N8nWebhookService {
  private static getNextWebhookUrl(): string {
    const url = N8N_WEBHOOKS[currentWebhookIndex];
    const webhookNumber = currentWebhookIndex + 1;
    currentWebhookIndex = (currentWebhookIndex + 1) % N8N_WEBHOOKS.length;
    console.log(`[N8n] Using webhook ${webhookNumber}/${N8N_WEBHOOKS.length}`);
    return url;
  }

  static async analyzeScan(
    imageUrl: string,
    userId: string,
    scanType: ScanType
  ): Promise<N8nAnalysisResponse> {
    try {
      console.log('[N8n] Starting analysis via webhook');
      console.log('[N8n] Image URL:', imageUrl);
      console.log('[N8n] User ID:', userId);
      console.log('[N8n] Scan Type:', scanType);

      const webhookUrl = this.getNextWebhookUrl();

      const requestBody: N8nAnalysisRequest = {
        imageUrl,
        userId,
        scanType,
      };

      console.log('[N8n] Sending request to:', webhookUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[N8n] Webhook request failed:', response.status, response.statusText);
        throw new Error(`Webhook request failed: ${response.statusText}`);
      }

      const data: N8nAnalysisResponse = await response.json();
      console.log('[N8n] Analysis completed successfully');

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[N8n] Request timeout after 60 seconds');
        return {
          success: false,
          error: 'Request timeout - analysis took too long',
        };
      }
      console.error('[N8n] Error analyzing scan:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async testWebhookConnection(): Promise<boolean> {
    try {
      console.log('[N8n] Testing webhook connection');

      const response = await fetch(N8N_WEBHOOKS[0], {
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

export type { N8nAnalysisRequest, N8nAnalysisResponse };
