import { supabase } from './supabase';

export interface Referral {
  id: string;
  referrer_id: string;
  referee_id?: string;
  referral_code: string;
  referral_method: 'code' | 'link' | 'qr_code' | 'contact_share';
  referral_source: 'app_share' | 'sms' | 'email' | 'social';
  invited_at: string;
  signed_up_at?: string;
  first_purchase_at?: string;
  reward_status: 'pending' | 'earned' | 'credited' | 'expired';
  reward_amount?: number;
  bonus_tier: number;
  metadata?: any;
}

export interface CreateReferralRequest {
  referral_method: 'code' | 'link' | 'qr_code' | 'contact_share';
  referral_source: 'app_share' | 'sms' | 'email' | 'social';
  metadata?: any;
}

export interface ReferralReward {
  referrer_reward: number;
  referee_reward: number;
  bonus_multiplier: number;
  total_earned: number;
}

export interface ReferralAnalytics {
  total_referrals: number;
  successful_signups: number;
  converted_purchases: number;
  total_rewards_earned: number;
  avg_conversion_days: number;
  conversion_rate: number;
  top_referral_sources: Array<{
    source: string;
    count: number;
    conversion_rate: number;
  }>;
}

export interface ShareContent {
  title: string;
  message: string;
  url: string;
  image?: string;
}

export class ReferralService {
  private static readonly REFERRAL_CODE_LENGTH = 8;
  private static readonly BASE_REFERRER_REWARD = 10.00;
  private static readonly BASE_REFEREE_REWARD = 5.00;

  /**
   * Generate a unique referral code
   */
  private static generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < this.REFERRAL_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Create a new referral
   */
  static async createReferral(data: CreateReferralRequest): Promise<Referral> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Generate unique referral code
    let referralCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      referralCode = this.generateReferralCode();
      const { data: existing } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < maxAttempts);

    if (!isUnique) {
      throw new Error('Failed to generate unique referral code');
    }

    // Calculate bonus tier based on user's successful referrals
    const bonusTier = await this.calculateBonusTier(user.user.id);

    const { data: referral, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.user.id,
        referral_code: referralCode,
        referral_method: data.referral_method,
        referral_source: data.referral_source,
        reward_status: 'pending',
        bonus_tier: bonusTier,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return referral;
  }

  /**
   * Get user's referrals
   */
  static async getUserReferrals(
    status?: 'pending' | 'earned' | 'credited' | 'expired'
  ): Promise<Referral[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    let query = supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.user.id)
      .order('invited_at', { ascending: false });

    if (status) {
      query = query.eq('reward_status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Validate and use referral code during signup
   */
  static async validateReferralCode(
    referralCode: string,
    newUserId: string
  ): Promise<{ valid: boolean; referral?: Referral; error?: string }> {
    const { data: referral, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode.toUpperCase())
      .eq('reward_status', 'pending')
      .is('referee_id', null)
      .single();

    if (error || !referral) {
      return { valid: false, error: 'Invalid or expired referral code' };
    }

    // Check if the referrer is not the same as the new user
    if (referral.referrer_id === newUserId) {
      return { valid: false, error: 'Cannot use your own referral code' };
    }

    // Update referral with new user
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        referee_id: newUserId,
        signed_up_at: new Date().toISOString(),
      })
      .eq('id', referral.id);

    if (updateError) {
      return { valid: false, error: 'Failed to process referral' };
    }

    return { valid: true, referral: { ...referral, referee_id: newUserId } };
  }

  /**
   * Process first purchase to complete referral
   */
  static async processFirstPurchase(userId: string): Promise<ReferralReward | null> {
    // Find pending referral where user is the referee
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referee_id', userId)
      .eq('reward_status', 'pending')
      .single();

    if (!referral) return null;

    // Calculate rewards based on bonus tier
    const referrerReward = this.BASE_REFERRER_REWARD * referral.bonus_tier;
    const refereeReward = this.BASE_REFEREE_REWARD;

    // Update referral status
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        first_purchase_at: new Date().toISOString(),
        reward_status: 'earned',
        reward_amount: referrerReward,
      })
      .eq('id', referral.id);

    if (updateError) throw updateError;

    // Credit rewards to both users' wallets
    await this.creditReferralReward(referral.referrer_id, referrerReward);
    await this.creditReferralReward(userId, refereeReward);

    // Update referrer's total credits
    await this.updateReferrerCredits(referral.referrer_id, referrerReward);

    // Create achievement for successful referral
    await this.createReferralAchievement(referral.referrer_id, referral.id);

    return {
      referrer_reward: referrerReward,
      referee_reward: refereeReward,
      bonus_multiplier: referral.bonus_tier,
      total_earned: referrerReward + refereeReward,
    };
  }

  /**
   * Calculate bonus tier based on successful referrals
   */
  private static async calculateBonusTier(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', userId)
      .in('reward_status', ['earned', 'credited']);

    if (error) return 1;

    const successfulReferrals = data?.length || 0;

    // Tier calculation: 1x for 0-4, 1.2x for 5-9, 1.5x for 10-24, 2x for 25+
    if (successfulReferrals >= 25) return 2.0;
    if (successfulReferrals >= 10) return 1.5;
    if (successfulReferrals >= 5) return 1.2;
    return 1.0;
  }

  /**
   * Credit referral reward to user's wallet
   */
  private static async creditReferralReward(userId: string, amount: number): Promise<void> {
    // This would integrate with the wallet system
    // For now, we'll update the user's referral credits
    const { error } = await supabase.rpc('increment_user_credits', {
      user_id: userId,
      credit_amount: amount,
    });

    if (error) {
      console.error('Failed to credit referral reward:', error);
      // In a production system, you'd want to implement retry logic
      // and maintain a transaction log for manual reconciliation
    }
  }

  /**
   * Update referrer's total earned credits
   */
  private static async updateReferrerCredits(userId: string, amount: number): Promise<void> {
    const { error } = await supabase
      .from('auth.users')
      .update({
        referral_credits_earned: supabase.rpc('increment_credits', { 
          current_amount: amount 
        }),
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update referrer credits:', error);
    }
  }

  /**
   * Create achievement for successful referral
   */
  private static async createReferralAchievement(userId: string, referralId: string): Promise<void> {
    // Get current referral count to determine achievement level
    const { data: referrals } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', userId)
      .in('reward_status', ['earned', 'credited']);

    const referralCount = referrals?.length || 0;
    
    let achievementName = 'First Referral';
    let pointsAwarded = 100;

    if (referralCount >= 25) {
      achievementName = 'Referral Ambassador';
      pointsAwarded = 1000;
    } else if (referralCount >= 10) {
      achievementName = 'Referral Expert';
      pointsAwarded = 500;
    } else if (referralCount >= 5) {
      achievementName = 'Referral Champion';
      pointsAwarded = 250;
    }

    const { error } = await supabase
      .from('social_achievements')
      .insert({
        user_id: userId,
        achievement_type: 'referral_milestone',
        achievement_name: achievementName,
        description: `Successfully referred ${referralCount} friends to DailyNutriFit`,
        related_entity_id: referralId,
        related_entity_type: 'referral',
        points_awarded: pointsAwarded,
        badge_awarded: achievementName.toLowerCase().replace(/\s+/g, '_'),
        is_public: true,
      });

    if (error) {
      console.error('Failed to create referral achievement:', error);
    }
  }

  /**
   * Get referral analytics for user
   */
  static async getReferralAnalytics(): Promise<ReferralAnalytics> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: analyticsData } = await supabase
      .from('referral_analytics')
      .select('*')
      .eq('referrer_id', user.user.id)
      .single();

    if (!analyticsData) {
      return {
        total_referrals: 0,
        successful_signups: 0,
        converted_purchases: 0,
        total_rewards_earned: 0,
        avg_conversion_days: 0,
        conversion_rate: 0,
        top_referral_sources: [],
      };
    }

    // Calculate conversion rate
    const conversionRate = analyticsData.total_referrals > 0 
      ? (analyticsData.converted_purchases / analyticsData.total_referrals) * 100 
      : 0;

    // Get top referral sources
    const { data: sourcesData } = await supabase
      .from('referrals')
      .select('referral_source')
      .eq('referrer_id', user.user.id);

    const sourceCounts = sourcesData?.reduce((acc, item) => {
      acc[item.referral_source] = (acc[item.referral_source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topReferralSources = Object.entries(sourceCounts)
      .map(([source, count]) => ({
        source,
        count,
        conversion_rate: (count / analyticsData.total_referrals) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_referrals: analyticsData.total_referrals,
      successful_signups: analyticsData.successful_signups,
      converted_purchases: analyticsData.converted_purchases,
      total_rewards_earned: analyticsData.total_rewards_earned,
      avg_conversion_days: analyticsData.avg_conversion_days,
      conversion_rate: conversionRate,
      top_referral_sources: topReferralSources,
    };
  }

  /**
   * Generate sharing content for referral
   */
  static async generateShareContent(referralCode: string): Promise<ShareContent> {
    const { data: user } = await supabase.auth.getUser();
    const displayName = user?.user?.user_metadata?.display_name || 'A friend';

    return {
      title: 'Join me on DailyNutriFit!',
      message: `Hey! ${displayName} invited you to try DailyNutriFit - personalized fruit delivery for better health. Use code ${referralCode} and we both get credits! 🍎✨`,
      url: `https://dailynutrifit.app/signup?ref=${referralCode}`,
      image: 'https://dailynutrifit.app/assets/referral-share.jpg',
    };
  }

  /**
   * Track referral interaction
   */
  static async trackReferralInteraction(
    referralCode: string,
    interaction: 'view' | 'click' | 'signup_attempt'
  ): Promise<void> {
    const { error } = await supabase
      .from('referrals')
      .update({
        metadata: supabase.rpc('jsonb_set_interaction', {
          metadata_column: 'metadata',
          interaction_type: interaction,
          timestamp: new Date().toISOString(),
        }),
      })
      .eq('referral_code', referralCode);

    if (error) {
      console.error('Failed to track referral interaction:', error);
    }
  }

  /**
   * Get active referral code for user
   */
  static async getActiveReferralCode(): Promise<string | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data: referral } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referrer_id', user.user.id)
      .eq('reward_status', 'pending')
      .order('invited_at', { ascending: false })
      .limit(1)
      .single();

    return referral?.referral_code || null;
  }

  /**
   * Check if referral code is available
   */
  static async isReferralCodeAvailable(code: string): Promise<boolean> {
    const { data } = await supabase
      .from('referrals')
      .select('id')
      .eq('referral_code', code.toUpperCase())
      .single();

    return !data;
  }

  /**
   * Get referral by code (for admin/debugging)
   */
  static async getReferralByCode(code: string): Promise<Referral | null> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', code.toUpperCase())
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Expire old unused referrals
   */
  static async expireOldReferrals(): Promise<number> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 30); // 30 days expiration

    const { data, error } = await supabase
      .from('referrals')
      .update({ reward_status: 'expired' })
      .eq('reward_status', 'pending')
      .is('referee_id', null)
      .lt('invited_at', expirationDate.toISOString())
      .select('id');

    if (error) {
      console.error('Failed to expire old referrals:', error);
      return 0;
    }

    return data?.length || 0;
  }
}