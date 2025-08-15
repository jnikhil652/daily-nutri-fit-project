import { ReferralService } from '../lib/referrals';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('ReferralService', () => {
  const mockUser = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        display_name: 'Test User',
      },
    },
  };

  const mockReferral = {
    id: 'ref-123',
    referrer_id: 'user-123',
    referee_id: null,
    referral_code: 'ABC12345',
    referral_method: 'link',
    referral_source: 'app_share',
    invited_at: new Date().toISOString(),
    signed_up_at: null,
    first_purchase_at: null,
    reward_status: 'pending',
    reward_amount: null,
    bonus_tier: 1,
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue(mockUser);
  });

  describe('createReferral', () => {
    it('should create a referral with unique code', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // Code check - not found (unique)
          .mockResolvedValueOnce({ data: [], error: null }), // Bonus tier query
        insert: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const createData = {
        referral_method: 'link' as const,
        referral_source: 'app_share' as const,
        metadata: { test: true },
      };

      // Mock successful insert
      mockQuery.single.mockResolvedValueOnce({ data: mockReferral, error: null });

      const result = await ReferralService.createReferral(createData);

      expect(mockSupabase.from).toHaveBeenCalledWith('referrals');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          referrer_id: 'user-123',
          referral_method: 'link',
          referral_source: 'app_share',
          reward_status: 'pending',
          bonus_tier: 1,
          metadata: { test: true },
        })
      );
      expect(result.referral_code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const createData = {
        referral_method: 'link' as const,
        referral_source: 'app_share' as const,
      };

      await expect(ReferralService.createReferral(createData))
        .rejects.toThrow('User not authenticated');
    });

    it('should handle unique code generation retries', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: { id: 'existing' }, error: null }) // First code exists
          .mockResolvedValueOnce({ data: null, error: null }) // Second code is unique
          .mockResolvedValueOnce({ data: [], error: null }), // Bonus tier query
        insert: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const createData = {
        referral_method: 'link' as const,
        referral_source: 'app_share' as const,
      };

      // Mock successful insert after retry
      mockQuery.single.mockResolvedValueOnce({ data: mockReferral, error: null });

      const result = await ReferralService.createReferral(createData);

      expect(result).toBeDefined();
      expect(result.referral_code).toMatch(/^[A-Z0-9]{8}$/);
    });
  });

  describe('validateReferralCode', () => {
    it('should validate a valid referral code', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReferral, error: null }),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.validateReferralCode('ABC12345', 'user-456');

      expect(result.valid).toBe(true);
      expect(result.referral).toBeDefined();
      expect(mockQuery.update).toHaveBeenCalledWith({
        referee_id: 'user-456',
        signed_up_at: expect.any(String),
      });
    });

    it('should reject invalid referral code', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.validateReferralCode('INVALID', 'user-456');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid or expired referral code');
    });

    it('should prevent self-referral', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockReferral, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.validateReferralCode('ABC12345', 'user-123');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot use your own referral code');
    });
  });

  describe('processFirstPurchase', () => {
    it('should process first purchase and distribute rewards', async () => {
      const purchaseReferral = {
        ...mockReferral,
        referee_id: 'user-456',
        signed_up_at: new Date().toISOString(),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: purchaseReferral, error: null }),
        update: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);
      mockSupabase.rpc.mockResolvedValue({ error: null });

      // Mock the private methods by spying on the class
      const creditRewardSpy = jest.spyOn(ReferralService as any, 'creditReferralReward')
        .mockResolvedValue(undefined);
      const updateCreditsSpy = jest.spyOn(ReferralService as any, 'updateReferrerCredits')
        .mockResolvedValue(undefined);
      const createAchievementSpy = jest.spyOn(ReferralService as any, 'createReferralAchievement')
        .mockResolvedValue(undefined);

      const result = await ReferralService.processFirstPurchase('user-456');

      expect(result).toEqual({
        referrer_reward: 10.0,
        referee_reward: 5.0,
        bonus_multiplier: 1,
        total_earned: 15.0,
      });

      expect(mockQuery.update).toHaveBeenCalledWith({
        first_purchase_at: expect.any(String),
        reward_status: 'earned',
        reward_amount: 10.0,
      });

      creditRewardSpy.mockRestore();
      updateCreditsSpy.mockRestore();
      createAchievementSpy.mockRestore();
    });

    it('should return null when no pending referral found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.processFirstPurchase('user-456');

      expect(result).toBeNull();
    });
  });

  describe('getUserReferrals', () => {
    it('should retrieve user referrals', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockReferral], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.getUserReferrals();

      expect(mockSupabase.from).toHaveBeenCalledWith('referrals');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('referrer_id', 'user-123');
      expect(result).toEqual([mockReferral]);
    });

    it('should filter by status when provided', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockReferral], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await ReferralService.getUserReferrals('pending');

      expect(mockQuery.eq).toHaveBeenCalledWith('referrer_id', 'user-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('reward_status', 'pending');
    });
  });

  describe('generateShareContent', () => {
    it('should generate share content with referral code', async () => {
      const result = await ReferralService.generateShareContent('ABC12345');

      expect(result).toEqual({
        title: 'Join me on DailyNutriFit!',
        message: expect.stringContaining('Test User invited you'),
        url: 'https://dailynutrifit.app/signup?ref=ABC12345',
        image: 'https://dailynutrifit.app/assets/referral-share.jpg',
      });
    });

    it('should handle missing display name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        user: {
          id: 'user-123',
          user_metadata: {},
        },
      });

      const result = await ReferralService.generateShareContent('ABC12345');

      expect(result.message).toContain('A friend invited you');
    });
  });

  describe('getReferralAnalytics', () => {
    it('should return analytics for user with referrals', async () => {
      const analyticsData = {
        referrer_id: 'user-123',
        total_referrals: 10,
        successful_signups: 8,
        converted_purchases: 6,
        total_rewards_earned: 60.0,
        avg_conversion_days: 3.5,
      };

      const sourcesData = [
        { referral_source: 'app_share' },
        { referral_source: 'app_share' },
        { referral_source: 'sms' },
        { referral_source: 'email' },
      ];

      const analyticsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: analyticsData, error: null }),
      };

      const sourcesQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: sourcesData, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(analyticsQuery)
        .mockReturnValueOnce(sourcesQuery);

      const result = await ReferralService.getReferralAnalytics();

      expect(result).toEqual({
        total_referrals: 10,
        successful_signups: 8,
        converted_purchases: 6,
        total_rewards_earned: 60.0,
        avg_conversion_days: 3.5,
        conversion_rate: 60.0, // 6/10 * 100
        top_referral_sources: [
          { source: 'app_share', count: 2, conversion_rate: 20.0 },
          { source: 'sms', count: 1, conversion_rate: 10.0 },
          { source: 'email', count: 1, conversion_rate: 10.0 },
        ],
      });
    });

    it('should return empty analytics for new user', async () => {
      const analyticsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(analyticsQuery);

      const result = await ReferralService.getReferralAnalytics();

      expect(result).toEqual({
        total_referrals: 0,
        successful_signups: 0,
        converted_purchases: 0,
        total_rewards_earned: 0,
        avg_conversion_days: 0,
        conversion_rate: 0,
        top_referral_sources: [],
      });
    });
  });

  describe('getActiveReferralCode', () => {
    it('should return active referral code for user', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { referral_code: 'ABC12345' }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.getActiveReferralCode();

      expect(result).toBe('ABC12345');
      expect(mockQuery.eq).toHaveBeenCalledWith('referrer_id', 'user-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('reward_status', 'pending');
    });

    it('should return null when no active code exists', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.getActiveReferralCode();

      expect(result).toBeNull();
    });

    it('should return null when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const result = await ReferralService.getActiveReferralCode();

      expect(result).toBeNull();
    });
  });

  describe('expireOldReferrals', () => {
    it('should expire referrals older than 30 days', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ 
          data: [{ id: 'ref-1' }, { id: 'ref-2' }], 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ReferralService.expireOldReferrals();

      expect(result).toBe(2);
      expect(mockQuery.update).toHaveBeenCalledWith({ reward_status: 'expired' });
      expect(mockQuery.eq).toHaveBeenCalledWith('reward_status', 'pending');
      expect(mockQuery.is).toHaveBeenCalledWith('referee_id', null);
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Database error') 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await ReferralService.expireOldReferrals();

      expect(result).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to expire old referrals:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});