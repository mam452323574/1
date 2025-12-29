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
    currentWebhookIndex = (currentWebhookIndex + 1) % N8N_WEBHOOKS.length;
    return url;
  }

  static async analyzeScan(
    imageUrl: string,
    userId: string,
    scanType: ScanType
  ): Promise<N8nAnalysisResponse> {
    try {
      const webhookUrl = this.getNextWebhookUrl();

      const requestBody: N8nAnalysisRequest = {
        imageUrl,
        userId,
        scanType,
      };

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
      const response = await fetch(N8N_WEBHOOKS[0], {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[N8n] Connection test error:', error);
      return false;
    }
  }
}

export type { N8nAnalysisRequest, N8nAnalysisResponse };
