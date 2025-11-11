import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { N8nAnalysisResponse } from '@/types';

const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_N8N_WEBHOOK_BASE_URL ||
  process.env.EXPO_PUBLIC_N8N_WEBHOOK_BASE_URL ||
  'http://82.165.218.187:5678/webhook';

const WORKFLOW_URLS = [
  `${BASE_URL}/analyse_1`,
  `${BASE_URL}/analyse_2`,
  `${BASE_URL}/analyse_3`,
  `${BASE_URL}/analyse_4`,
  `${BASE_URL}/analyse_5`,
  `${BASE_URL}/analyse_6`,
  `${BASE_URL}/analyse_7`,
];

const ROUND_ROBIN_KEY = '@n8n_round_robin_counter';
const REQUEST_TIMEOUT_MS = 30000;

export class N8nWebhookService {
  static async getCurrentCounter(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(ROUND_ROBIN_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      console.error('Error reading round-robin counter:', error);
      return 0;
    }
  }

  static async incrementCounter(): Promise<void> {
    try {
      const current = await this.getCurrentCounter();
      const next = (current + 1) % WORKFLOW_URLS.length;
      await AsyncStorage.setItem(ROUND_ROBIN_KEY, next.toString());
    } catch (error) {
      console.error('Error incrementing round-robin counter:', error);
    }
  }

  static async resetCounter(): Promise<void> {
    try {
      await AsyncStorage.setItem(ROUND_ROBIN_KEY, '0');
    } catch (error) {
      console.error('Error resetting round-robin counter:', error);
    }
  }

  static async analyzeImage(imageUri: string): Promise<N8nAnalysisResponse> {
    console.log('[N8nWebhook] analyzeImage called with imageUri:', imageUri);

    const counter = await this.getCurrentCounter();
    const webhookUrl = WORKFLOW_URLS[counter];

    console.log(`[N8nWebhook] Using workflow ${counter + 1} of ${WORKFLOW_URLS.length}`);
    console.log(`[N8nWebhook] URL: ${webhookUrl}`);

    await this.incrementCounter();

    try {
      console.log('[N8nWebhook] Building FormData...');
      const formData = new FormData();

      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      console.log('[N8nWebhook] File info - filename:', filename, 'type:', type);

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      console.log('[N8nWebhook] FormData prepared successfully');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[N8nWebhook] Request timeout after', REQUEST_TIMEOUT_MS, 'ms');
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      console.log('[N8nWebhook] Sending POST request to webhook...');
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[N8nWebhook] Response received - status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[N8nWebhook] HTTP ${response.status}:`, errorText);
        console.error('[N8nWebhook] Response headers:', JSON.stringify(response.headers));
        throw new Error(`L'analyse a échoué (${response.status}). Veuillez réessayer.`);
      }

      console.log('[N8nWebhook] Parsing JSON response...');
      const data = await response.json();
      console.log('[N8nWebhook] JSON parsed successfully');

      if (!data.items || !data.totals) {
        console.error('[N8nWebhook] Invalid response structure:', JSON.stringify(data));
        throw new Error('Réponse invalide du serveur d\'analyse.');
      }

      console.log('[N8nWebhook] Analysis successful:', {
        itemsCount: data.items.length,
        totalKcal: data.totals.kcal,
      });

      return data as N8nAnalysisResponse;
    } catch (error: any) {
      console.error('[N8nWebhook] Error in analyzeImage:', error);
      console.error('[N8nWebhook] Error name:', error.name);
      console.error('[N8nWebhook] Error message:', error.message);

      if (error.name === 'AbortError') {
        console.error('[N8nWebhook] Request was aborted due to timeout');
        throw new Error('L\'analyse a pris trop de temps. Veuillez vérifier votre connexion internet et réessayer.');
      }

      if (error.message?.includes('Network request failed')) {
        console.error('[N8nWebhook] Network request failed');
        throw new Error('L\'analyse est actuellement indisponible. Veuillez vérifier votre connexion internet et réessayer plus tard.');
      }

      console.error('[N8nWebhook] Rethrowing original error');
      throw error;
    }
  }
}
