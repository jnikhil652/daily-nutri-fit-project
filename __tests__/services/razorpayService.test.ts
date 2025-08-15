import { RazorpayService } from '../../services/razorpayService';

// Mock react-native-razorpay
jest.mock('react-native-razorpay', () => ({
  open: jest.fn(),
}));

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

describe('RazorpayService', () => {
  let razorpayService: RazorpayService;

  beforeEach(() => {
    razorpayService = RazorpayService.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = RazorpayService.getInstance();
      const instance2 = RazorpayService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('isConfigured', () => {
    it('should return false when key is not configured', () => {
      // Clear environment variable for test
      delete process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      
      // Create new instance to pick up cleared env
      const service = new (RazorpayService as any)();
      expect(service.isConfigured()).toBe(false);
    });

    it('should return true when key is configured', () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345';
      
      const service = new (RazorpayService as any)();
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('getConfigStatus', () => {
    it('should return configuration status with masked key', () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345678901234567890';
      
      const service = new (RazorpayService as any)();
      const status = service.getConfigStatus();
      
      expect(status.configured).toBe(true);
      expect(status.keyId).toBe('rzp_test...');
    });

    it('should return not configured status when key is missing', () => {
      delete process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      
      const service = new (RazorpayService as any)();
      const status = service.getConfigStatus();
      
      expect(status.configured).toBe(false);
      expect(status.keyId).toBe('Not set');
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrderResponse = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
        receipt: 'receipt_123',
      };

      const { supabase } = require('../../lib/supabase');
      supabase.functions.invoke.mockResolvedValue({
        data: mockOrderResponse,
        error: null,
      });

      const result = await razorpayService.createOrder(100, 'INR', 'receipt_123');

      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-razorpay-order', {
        body: {
          amount: 10000, // 100 * 100 paise
          currency: 'INR',
          receipt: 'receipt_123',
        },
      });

      expect(result).toEqual(mockOrderResponse);
    });

    it('should handle order creation error', async () => {
      const { supabase } = require('../../lib/supabase');
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Order creation failed' },
      });

      await expect(razorpayService.createOrder(100)).rejects.toThrow('Order creation failed');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      // Set up environment
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345';
      
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
      };

      const mockPaymentResponse = {
        razorpay_payment_id: 'pay_test123',
        razorpay_order_id: 'order_test123',
        razorpay_signature: 'signature_test123',
      };

      const { supabase } = require('../../lib/supabase');
      
      // Mock createOrder
      supabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockOrder,
          error: null,
        })
        // Mock verifyPayment
        .mockResolvedValueOnce({
          data: { verified: true },
          error: null,
        });

      // Mock Razorpay checkout
      const RazorpayCheckout = require('react-native-razorpay');
      RazorpayCheckout.open.mockResolvedValue(mockPaymentResponse);

      const service = new (RazorpayService as any)();
      const result = await service.processPayment({
        amount: 100,
        name: 'Test Payment',
        description: 'Test description',
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pay_test123');
      expect(result.orderId).toBe('order_test123');
      expect(result.signature).toBe('signature_test123');
    });

    it('should handle payment failure', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345';
      
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
      };

      const { supabase } = require('../../lib/supabase');
      supabase.functions.invoke.mockResolvedValue({
        data: mockOrder,
        error: null,
      });

      // Mock Razorpay checkout failure
      const RazorpayCheckout = require('react-native-razorpay');
      RazorpayCheckout.open.mockRejectedValue({
        code: 'BAD_REQUEST_ERROR',
        description: 'Payment was cancelled by user',
        message: 'Payment cancelled',
      });

      const service = new (RazorpayService as any)();
      const result = await service.processPayment({
        amount: 100,
        name: 'Test Payment',
        description: 'Test description',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment was cancelled by user');
      expect(result.errorCode).toBe('BAD_REQUEST_ERROR');
    });

    it('should handle unconfigured service', async () => {
      delete process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
      
      const service = new (RazorpayService as any)();
      const result = await service.processPayment({
        amount: 100,
        name: 'Test Payment',
        description: 'Test description',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Razorpay is not properly configured');
    });
  });

  describe('processWalletTopUp', () => {
    it('should process wallet top-up successfully', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345';
      
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
      };

      const mockPaymentResponse = {
        razorpay_payment_id: 'pay_test123',
        razorpay_order_id: 'order_test123',
        razorpay_signature: 'signature_test123',
      };

      const { supabase } = require('../../lib/supabase');
      
      // Mock createOrder and verifyPayment
      supabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockOrder,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { verified: true },
          error: null,
        });

      // Mock wallet balance update
      supabase.rpc.mockResolvedValue({
        data: { transaction_id: 'txn_123' },
        error: null,
      });

      // Mock Razorpay checkout
      const RazorpayCheckout = require('react-native-razorpay');
      RazorpayCheckout.open.mockResolvedValue(mockPaymentResponse);

      const service = new (RazorpayService as any)();
      const result = await service.processWalletTopUp('user_123', 100, 'test@example.com', '9876543210');

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_123');
      expect(supabase.rpc).toHaveBeenCalledWith('update_wallet_balance', {
        p_user_id: 'user_123',
        p_amount: 100,
        p_type: 'top_up',
        p_description: 'Wallet top-up via Razorpay - ₹100.00',
        p_reference_id: 'pay_test123',
      });
    });

    it('should handle wallet update failure after successful payment', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_12345';
      
      const mockOrder = {
        id: 'order_test123',
        amount: 10000,
        currency: 'INR',
      };

      const mockPaymentResponse = {
        razorpay_payment_id: 'pay_test123',
        razorpay_order_id: 'order_test123',
        razorpay_signature: 'signature_test123',
      };

      const { supabase } = require('../../lib/supabase');
      
      // Mock successful payment
      supabase.functions.invoke
        .mockResolvedValueOnce({
          data: mockOrder,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { verified: true },
          error: null,
        });

      // Mock wallet update failure
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Wallet update failed' },
      });

      const RazorpayCheckout = require('react-native-razorpay');
      RazorpayCheckout.open.mockResolvedValue(mockPaymentResponse);

      const service = new (RazorpayService as any)();
      const result = await service.processWalletTopUp('user_123', 100);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment successful but failed to update wallet balance');
      expect(result.errorCode).toBe('wallet_update_failed');
    });
  });
});