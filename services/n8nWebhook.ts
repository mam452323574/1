import AsyncStorage from '@react-native-async-storage/async-storage';
import { N8nAnalysisResponse } from '@/types';

const WORKFLOW_URLS = [
  'http://82.165.218.187:5678/webhook/analyse_1',
  'http://82.165.218.187:5678/webhook/analyse_2',
  'http://82.165.218.187:5678/webhook/analyse_3',
  'http://82.165.218.187:5678/webhook/analyse_4',
  'http://82.165.218.187:5678/webhook/analyse_5',
  'http://82.165.218.187:5678/webhook/analyse_6',
  'http://82.165.218.187:5678/webhook/analyse_7',
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
    const counter = await this.getCurrentCounter();
    const webhookUrl = WORKFLOW_URLS[counter];

    console.log(`[N8nWebhook] Using workflow ${counter + 1} of ${WORKFLOW_URLS.length}`);
    console.log(`[N8nWebhook] URL: ${webhookUrl}`);

    await this.incrementCounter();

    try {
      const formData = new FormData();

      const filename = imageUri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[N8nWebhook] HTTP ${response.status}:`, errorText);
        throw new Error(`L'analyse a échoué (${response.status}). Veuillez réessayer.`);
      }

      const data = await response.json();

      if (!data.items || !data.totals) {
        console.error('[N8nWebhook] Invalid response structure:', data);
        throw new Error('Réponse invalide du serveur d\'analyse.');
      }

      console.log('[N8nWebhook] Analysis successful:', {
        itemsCount: data.items.length,
        totalKcal: data.totals.kcal,
      });

      return data as N8nAnalysisResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('L\'analyse a pris trop de temps. Veuillez vérifier votre connexion internet et réessayer.');
      }

      if (error.message?.includes('Network request failed')) {
        throw new Error('L\'analyse est actuellement indisponible. Veuillez vérifier votre connexion internet et réessayer plus tard.');
      }

      throw error;
    }
  }
}
