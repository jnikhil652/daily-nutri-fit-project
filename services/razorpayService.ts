import RazorpayCheckout from 'react-native-razorpay';
import { supabase } from '../lib/supabase';

export interface RazorpayPaymentOptions {
  amount: number; // Amount in rupees (will be converted to paise)
  currency?: string;
  orderId?: string;
  name: string;
  description: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
  errorCode?: string;
  errorDescription?: string;
}

export class RazorpayService {
  private static instance: RazorpayService;
  private readonly keyId: string;

  private constructor() {
    this.keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '';
    
    if (!this.keyId) {
      console.warn('Razorpay Key ID is not configured. Please set EXPO_PUBLIC_RAZORPAY_KEY_ID in your environment variables.');
    }
  }

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Create an order on the backend before initiating payment
   */
  async createOrder(amount: number, currency = 'INR', receipt?: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: Math.round(amount * 100), // Convert to paise
          currency,
          receipt: receipt || `receipt_${Date.now()}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create order');
      }

      return data;
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      throw error;
    }
  }

  /**
   * Open Razorpay checkout and process payment
   */
  async processPayment(options: RazorpayPaymentOptions): Promise<PaymentResult> {
    try {
      if (!this.keyId) {
        throw new Error('Razorpay is not properly configured');
      }

      // Create order first
      const order = await this.createOrder(options.amount, options.currency);

      // Prepare Razorpay checkout options
      const checkoutOptions = {
        key: this.keyId,
        amount: Math.round(options.amount * 100), // Amount in paise
        currency: options.currency || 'INR',
        order_id: order.id,
        name: options.name,
        description: options.description,
        image: '', // Add your app logo URL here
        prefill: {
          email: options.email || '',
          contact: options.contact || '',
        },
        notes: options.notes || {},
        theme: {
          color: '#4CAF50', // Your app's primary color
        },
      };

      const response: RazorpayPaymentResponse = await RazorpayCheckout.open(checkoutOptions);

      // Verify payment on backend
      const verificationResult = await this.verifyPayment({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (verificationResult.verified) {
        return {
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        };
      } else {
        return {
          success: false,
          error: 'Payment verification failed',
          errorCode: 'verification_failed',
        };
      }
    } catch (error: any) {
      console.error('Razorpay payment error:', error);
      
      return {
        success: false,
        error: error.description || error.message || 'Payment failed',
        errorCode: error.code || 'unknown_error',
        errorDescription: error.description,
      };
    }
  }

  /**
   * Verify payment signature on the backend
   */
  private async verifyPayment(paymentData: RazorpayPaymentResponse): Promise<{ verified: boolean }> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: paymentData,
      });

      if (error) {
        console.error('Payment verification error:', error);
        return { verified: false };
      }

      return { verified: data.verified || false };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return { verified: false };
    }
  }

  /**
   * Process wallet top-up with Razorpay payment
   */
  async processWalletTopUp(
    userId: string,
    amount: number,
    userEmail?: string,
    userContact?: string
  ): Promise<PaymentResult & { transactionId?: string }> {
    try {
      const paymentResult = await this.processPayment({
        amount,
        name: 'DailyNutriFit',
        description: `Wallet top-up of ₹${amount.toFixed(2)}`,
        email: userEmail,
        contact: userContact,
        notes: {
          purpose: 'wallet_topup',
          user_id: userId,
        },
      });

      if (paymentResult.success && paymentResult.paymentId) {
        // Update wallet balance after successful payment
        const { data, error } = await supabase.rpc('update_wallet_balance', {
          p_user_id: userId,
          p_amount: amount,
          p_type: 'top_up',
          p_description: `Wallet top-up via Razorpay - ₹${amount.toFixed(2)}`,
          p_reference_id: paymentResult.paymentId,
        });

        if (error) {
          console.error('Error updating wallet balance:', error);
          return {
            ...paymentResult,
            success: false,
            error: 'Payment successful but failed to update wallet balance',
            errorCode: 'wallet_update_failed',
          };
        }

        return {
          ...paymentResult,
          transactionId: data?.transaction_id,
        };
      }

      return paymentResult;
    } catch (error: any) {
      console.error('Wallet top-up error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process wallet top-up',
        errorCode: 'topup_failed',
      };
    }
  }

  /**
   * Get payment details from Razorpay
   */
  async getPaymentDetails(paymentId: string): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('get-razorpay-payment', {
        body: { payment_id: paymentId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch payment details');
      }

      return data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  /**
   * Check if Razorpay is properly configured
   */
  isConfigured(): boolean {
    return !!this.keyId;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigStatus(): { configured: boolean; keyId: string } {
    return {
      configured: this.isConfigured(),
      keyId: this.keyId ? `${this.keyId.substring(0, 8)}...` : 'Not set',
    };
  }
}

export const razorpayService = RazorpayService.getInstance();