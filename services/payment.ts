import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Product,
  Purchase,
  PurchaseError,
  SubscriptionPurchase,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const PRODUCT_IDS = {
  android: ['health_scan_premium_monthly'],
  ios: ['health_scan_premium_monthly'],
};

export interface PurchaseResult {
  success: boolean;
  message: string;
  purchase?: Purchase | SubscriptionPurchase;
  error?: string;
}

class PaymentService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[PaymentService] Already initialized');
      return;
    }

    try {
      console.log('[PaymentService] Initializing connection...');
      await initConnection();
      this.isInitialized = true;
      console.log('[PaymentService] Connection initialized successfully');

      this.setupPurchaseListeners();
    } catch (error) {
      console.error('[PaymentService] Initialization error:', error);
      throw new Error('Failed to initialize payment service');
    }
  }

  private setupPurchaseListeners(): void {
    console.log('[PaymentService] Setting up purchase listeners');

    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase | SubscriptionPurchase) => {
        console.log('[PaymentService] Purchase updated:', {
          productId: purchase.productId,
          transactionId: purchase.transactionId,
        });

        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            await this.verifyAndFinalizePurchase(purchase);
          } catch (error) {
            console.error('[PaymentService] Error in purchase listener:', error);
          }
        }
      }
    );

    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.log('[PaymentService] Purchase error:', {
          code: error.code,
          message: error.message,
        });
      }
    );
  }

  async getProductDetails(): Promise<Product | null> {
    try {
      console.log('[PaymentService] Fetching product details...');

      const productIds = Platform.OS === 'android'
        ? PRODUCT_IDS.android
        : PRODUCT_IDS.ios;

      const products = await getProducts({ skus: productIds });
      console.log('[PaymentService] Products fetched:', products.length);

      if (products.length > 0) {
        return products[0];
      }

      return null;
    } catch (error) {
      console.error('[PaymentService] Error fetching products:', error);
      return null;
    }
  }

  async purchaseProduct(): Promise<PurchaseResult> {
    try {
      console.log('[PaymentService] Initiating purchase...');

      if (!this.isInitialized) {
        await this.initialize();
      }

      const productId = Platform.OS === 'android'
        ? PRODUCT_IDS.android[0]
        : PRODUCT_IDS.ios[0];

      console.log('[PaymentService] Requesting purchase for:', productId);

      await requestPurchase({ sku: productId });

      return {
        success: true,
        message: 'Purchase initiated successfully',
      };
    } catch (error: any) {
      console.error('[PaymentService] Purchase error:', error);

      if (error.code === 'E_USER_CANCELLED') {
        return {
          success: false,
          message: 'Purchase cancelled by user',
          error: 'cancelled',
        };
      }

      return {
        success: false,
        message: error.message || 'Purchase failed',
        error: error.code || 'unknown',
      };
    }
  }

  private async verifyAndFinalizePurchase(
    purchase: Purchase | SubscriptionPurchase
  ): Promise<void> {
    try {
      console.log('[PaymentService] Verifying purchase with backend...');

      const purchaseToken = Platform.OS === 'android'
        ? purchase.purchaseToken
        : purchase.transactionReceipt;

      if (!purchaseToken) {
        throw new Error('No purchase token found');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upgrade-to-premium`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const body = JSON.stringify({
        purchaseToken,
        productId: purchase.productId,
        platform: Platform.OS,
      });

      console.log('[PaymentService] Calling upgrade-to-premium function...');

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
      });

      const result = await response.json();

      if (result.success) {
        console.log('[PaymentService] Purchase verified successfully');

        await finishTransaction({ purchase, isConsumable: false });
        console.log('[PaymentService] Transaction finished');
      } else {
        console.error('[PaymentService] Verification failed:', result.error);
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error) {
      console.error('[PaymentService] Verification error:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      console.log('[PaymentService] Restoring purchases...');

      if (!this.isInitialized) {
        await this.initialize();
      }

      const availablePurchases = await getAvailablePurchases();
      console.log('[PaymentService] Available purchases:', availablePurchases.length);

      if (availablePurchases.length === 0) {
        return {
          success: false,
          message: 'No purchases to restore',
          error: 'no_purchases',
        };
      }

      const premiumPurchase = availablePurchases.find(
        (p) => PRODUCT_IDS.android.includes(p.productId) || PRODUCT_IDS.ios.includes(p.productId)
      );

      if (!premiumPurchase) {
        return {
          success: false,
          message: 'No premium purchase found',
          error: 'no_premium_purchase',
        };
      }

      await this.verifyAndFinalizePurchase(premiumPurchase);

      return {
        success: true,
        message: 'Purchases restored successfully',
        purchase: premiumPurchase,
      };
    } catch (error: any) {
      console.error('[PaymentService] Restore error:', error);
      return {
        success: false,
        message: error.message || 'Failed to restore purchases',
        error: error.code || 'unknown',
      };
    }
  }

  async cleanup(): Promise<void> {
    console.log('[PaymentService] Cleaning up...');

    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    if (this.isInitialized) {
      await endConnection();
      this.isInitialized = false;
    }

    console.log('[PaymentService] Cleanup complete');
  }
}

export const paymentService = new PaymentService();
