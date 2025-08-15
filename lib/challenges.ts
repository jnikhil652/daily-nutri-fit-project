import { supabase } from './supabase';

export interface CommunityChallenge {
  id: string;
  challenge_name: string;
  description: string;
  challenge_type: 'consistency' | 'variety' | 'seasonal' | 'goal_based';
  difficulty_level: number; // 1-5
  duration_days: number;
  max_participants?: number;
  entry_requirements?: any;
  success_criteria: any;
  reward_structure: any;
  start_date: string;
  end_date: string;
  created_by?: string;
  is_public: boolean;
  is_active: boolean;
  featured_priority: number;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  completion_status: 'active' | 'completed' | 'failed' | 'withdrawn';
  completion_date?: string;
  final_score: number;
  rank_position?: number;
  rewards_earned?: any;
  is_visible: boolean;
}

export interface ChallengeProgress {
  id: string;
  challenge_participant_id: string;
  progress_date: string;
  progress_data: any;
  daily_score: number;
  cumulative_score: number;
  notes?: string;
  auto_generated: boolean;
  created_at: string;
}

export interface CreateChallengeRequest {
  challenge_name: string;
  description: string;
  challenge_type: 'consistency' | 'variety' | 'seasonal' | 'goal_based';
  difficulty_level: number;
  duration_days: number;
  max_participants?: number;
  entry_requirements?: any;
  success_criteria: any;
  reward_structure: any;
  start_date: string;
  end_date: string;
  is_public?: boolean;
}

export interface JoinChallengeRequest {
  challenge_id: string;
  is_visible?: boolean;
}

export interface ProgressEntry {
  progress_data: any;
  daily_score: number;
  notes?: string;
}

export interface ChallengeLeaderboard {
  challenge_id: string;
  challenge_name: string;
  user_id: string;
  final_score: number;
  rank_position?: number;
  completion_status: string;
  current_rank: number;
  challenge_active: boolean;
  joined_at: string;
  completion_date?: string;
}

export interface ChallengeStats {
  total_participants: number;
  active_participants: number;
  completed_participants: number;
  average_score: number;
  completion_rate: number;
  days_remaining: number;
  user_rank?: number;
  user_score?: number;
}

export class ChallengeService {
  /**
   * Get all public challenges
   */
  static async getPublicChallenges(
    filterType?: 'consistency' | 'variety' | 'seasonal' | 'goal_based',
    onlyActive: boolean = true
  ): Promise<CommunityChallenge[]> {
    let query = supabase
      .from('community_challenges')
      .select('*')
      .eq('is_public', true);

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    if (filterType) {
      query = query.eq('challenge_type', filterType);
    }

    query = query.order('featured_priority', { ascending: false })
                 .order('start_date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get featured challenges
   */
  static async getFeaturedChallenges(): Promise<CommunityChallenge[]> {
    const { data, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .gt('featured_priority', 0)
      .order('featured_priority', { ascending: false })
      .limit(5);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get challenge by ID
   */
  static async getChallenge(challengeId: string): Promise<CommunityChallenge | null> {
    const { data, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Create a new challenge
   */
  static async createChallenge(challengeData: CreateChallengeRequest): Promise<CommunityChallenge> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('community_challenges')
      .insert({
        ...challengeData,
        created_by: user.user.id,
        is_public: challengeData.is_public ?? true,
        is_active: true,
        featured_priority: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Join a challenge
   */
  static async joinChallenge(joinData: JoinChallengeRequest): Promise<ChallengeParticipant> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if challenge exists and is joinable
    const challenge = await this.getChallenge(joinData.challenge_id);
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (!challenge.is_active || !challenge.is_public) {
      throw new Error('Challenge is not available for joining');
    }

    // Check if user is already participating
    const existingParticipant = await this.getUserParticipation(joinData.challenge_id);
    if (existingParticipant) {
      throw new Error('Already participating in this challenge');
    }

    // Check challenge capacity
    if (challenge.max_participants) {
      const currentParticipants = await this.getChallengeParticipants(joinData.challenge_id);
      if (currentParticipants.length >= challenge.max_participants) {
        throw new Error('Challenge is at maximum capacity');
      }
    }

    // Check entry requirements
    if (challenge.entry_requirements) {
      const meetsRequirements = await this.checkEntryRequirements(
        user.user.id,
        challenge.entry_requirements
      );
      if (!meetsRequirements) {
        throw new Error('User does not meet entry requirements');
      }
    }

    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        challenge_id: joinData.challenge_id,
        user_id: user.user.id,
        completion_status: 'active',
        final_score: 0,
        is_visible: joinData.is_visible ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's participation in a specific challenge
   */
  static async getUserParticipation(challengeId: string): Promise<ChallengeParticipant | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data, error } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('user_id', user.user.id)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Get all participants for a challenge
   */
  static async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select('*')
      .eq('challenge_id', challengeId)
      .eq('is_visible', true)
      .order('final_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's active challenges
   */
  static async getUserActiveChallenges(): Promise<(CommunityChallenge & { participation: ChallengeParticipant })[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenge:community_challenges(*)
      `)
      .eq('user_id', user.user.id)
      .eq('completion_status', 'active')
      .order('joined_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map((item: any) => ({
      ...item.challenge,
      participation: {
        id: item.id,
        challenge_id: item.challenge_id,
        user_id: item.user_id,
        joined_at: item.joined_at,
        completion_status: item.completion_status,
        completion_date: item.completion_date,
        final_score: item.final_score,
        rank_position: item.rank_position,
        rewards_earned: item.rewards_earned,
        is_visible: item.is_visible,
      },
    }));
  }

  /**
   * Add progress entry for a challenge
   */
  static async addProgress(
    challengeId: string,
    progressEntry: ProgressEntry
  ): Promise<ChallengeProgress> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const participation = await this.getUserParticipation(challengeId);
    if (!participation) {
      throw new Error('User is not participating in this challenge');
    }

    if (participation.completion_status !== 'active') {
      throw new Error('Cannot add progress to inactive participation');
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if progress already exists for today
    const { data: existingProgress } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_participant_id', participation.id)
      .eq('progress_date', today)
      .single();

    if (existingProgress) {
      throw new Error('Progress already recorded for today');
    }

    // Calculate cumulative score
    const { data: previousProgress } = await supabase
      .from('challenge_progress')
      .select('cumulative_score')
      .eq('challenge_participant_id', participation.id)
      .order('progress_date', { ascending: false })
      .limit(1)
      .single();

    const cumulativeScore = (previousProgress?.cumulative_score || 0) + progressEntry.daily_score;

    const { data, error } = await supabase
      .from('challenge_progress')
      .insert({
        challenge_participant_id: participation.id,
        progress_date: today,
        progress_data: progressEntry.progress_data,
        daily_score: progressEntry.daily_score,
        cumulative_score: cumulativeScore,
        notes: progressEntry.notes,
        auto_generated: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Update participant's final score
    await supabase
      .from('challenge_participants')
      .update({ final_score: cumulativeScore })
      .eq('id', participation.id);

    return data;
  }

  /**
   * Get progress for a challenge participation
   */
  static async getChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const participation = await this.getUserParticipation(challengeId);
    if (!participation) {
      throw new Error('User is not participating in this challenge');
    }

    const { data, error } = await supabase
      .from('challenge_progress')
      .select('*')
      .eq('challenge_participant_id', participation.id)
      .order('progress_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get challenge leaderboard
   */
  static async getChallengeLeaderboard(challengeId: string): Promise<ChallengeLeaderboard[]> {
    const { data, error } = await supabase
      .from('challenge_leaderboards')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('current_rank', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get challenge statistics
   */
  static async getChallengeStats(challengeId: string): Promise<ChallengeStats> {
    const [participants, challenge, userParticipation] = await Promise.all([
      this.getChallengeParticipants(challengeId),
      this.getChallenge(challengeId),
      this.getUserParticipation(challengeId),
    ]);

    const totalParticipants = participants.length;
    const activeParticipants = participants.filter(p => p.completion_status === 'active').length;
    const completedParticipants = participants.filter(p => p.completion_status === 'completed').length;
    
    const averageScore = totalParticipants > 0 
      ? participants.reduce((sum, p) => sum + p.final_score, 0) / totalParticipants 
      : 0;
    
    const completionRate = totalParticipants > 0 
      ? (completedParticipants / totalParticipants) * 100 
      : 0;

    const daysRemaining = challenge 
      ? Math.max(0, Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const userRank = userParticipation 
      ? participants.findIndex(p => p.user_id === userParticipation.user_id) + 1 
      : undefined;

    return {
      total_participants: totalParticipants,
      active_participants: activeParticipants,
      completed_participants: completedParticipants,
      average_score: averageScore,
      completion_rate: completionRate,
      days_remaining: daysRemaining,
      user_rank: userRank || undefined,
      user_score: userParticipation?.final_score || undefined,
    };
  }

  /**
   * Withdraw from a challenge
   */
  static async withdrawFromChallenge(challengeId: string): Promise<{ success: boolean }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const participation = await this.getUserParticipation(challengeId);
    if (!participation) {
      throw new Error('User is not participating in this challenge');
    }

    if (participation.completion_status !== 'active') {
      throw new Error('Cannot withdraw from inactive participation');
    }

    const { error } = await supabase
      .from('challenge_participants')
      .update({ 
        completion_status: 'withdrawn',
        completion_date: new Date().toISOString(),
      })
      .eq('id', participation.id);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Check entry requirements for a challenge
   */
  private static async checkEntryRequirements(
    userId: string,
    requirements: any
  ): Promise<boolean> {
    // Example requirements check
    if (requirements.min_deliveries) {
      // Check user's delivery count
      // This would integrate with the delivery/order system
      // For now, we'll assume they meet the requirements
    }

    if (requirements.account_age_days) {
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (user.user) {
        const accountAge = Math.floor(
          (new Date().getTime() - new Date(user.user.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (accountAge < requirements.account_age_days) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Complete a challenge (automated check)
   */
  static async checkChallengeCompletion(challengeId: string): Promise<void> {
    const challenge = await this.getChallenge(challengeId);
    if (!challenge) return;

    const participants = await this.getChallengeParticipants(challengeId);
    const activeParticipants = participants.filter(p => p.completion_status === 'active');

    for (const participant of activeParticipants) {
      const progress = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('challenge_participant_id', participant.id)
        .order('progress_date', { ascending: true });

      if (progress.data) {
        const meetsSuccess = this.evaluateSuccessCriteria(
          challenge.success_criteria,
          progress.data,
          challenge
        );

        if (meetsSuccess) {
          await this.completeChallengeParticipation(participant.id, challenge);
        }
      }
    }
  }

  /**
   * Evaluate if participant meets success criteria
   */
  private static evaluateSuccessCriteria(
    criteria: any,
    progressData: ChallengeProgress[],
    challenge: CommunityChallenge
  ): boolean {
    switch (challenge.challenge_type) {
      case 'consistency':
        if (criteria.consecutive_days) {
          // Check for consecutive days of progress
          const consecutiveDays = this.getConsecutiveDays(progressData);
          return consecutiveDays >= criteria.consecutive_days;
        }
        break;

      case 'variety':
        if (criteria.unique_fruits) {
          // Check unique fruits from progress data
          const uniqueFruits = new Set();
          progressData.forEach(p => {
            if (p.progress_data.fruits) {
              p.progress_data.fruits.forEach((fruit: string) => uniqueFruits.add(fruit));
            }
          });
          return uniqueFruits.size >= criteria.unique_fruits;
        }
        break;

      case 'goal_based':
        if (criteria.target_score) {
          const totalScore = progressData.reduce((sum, p) => sum + p.daily_score, 0);
          return totalScore >= criteria.target_score;
        }
        break;

      case 'seasonal':
        // Custom criteria based on seasonal requirements
        break;
    }

    return false;
  }

  /**
   * Get consecutive days from progress data
   */
  private static getConsecutiveDays(progressData: ChallengeProgress[]): number {
    if (progressData.length === 0) return 0;

    const sortedDates = progressData
      .map(p => new Date(p.progress_date))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const diffInDays = Math.floor(
        (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffInDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  /**
   * Complete challenge participation
   */
  private static async completeChallengeParticipation(
    participantId: string,
    challenge: CommunityChallenge
  ): Promise<void> {
    const { error } = await supabase
      .from('challenge_participants')
      .update({
        completion_status: 'completed',
        completion_date: new Date().toISOString(),
        rewards_earned: challenge.reward_structure,
      })
      .eq('id', participantId);

    if (error) {
      console.error('Failed to complete challenge participation:', error);
      return;
    }

    // Award rewards and create achievements
    await this.awardChallengeRewards(participantId, challenge);
  }

  /**
   * Award challenge rewards
   */
  private static async awardChallengeRewards(
    participantId: string,
    challenge: CommunityChallenge
  ): Promise<void> {
    const { data: participant } = await supabase
      .from('challenge_participants')
      .select('user_id')
      .eq('id', participantId)
      .single();

    if (!participant) return;

    const rewards = challenge.reward_structure;

    // Credit points and monetary rewards
    if (rewards.completion_points) {
      // Award points to user
    }

    if (rewards.credits) {
      // Credit wallet with reward amount
      await supabase.rpc('increment_user_credits', {
        user_id: participant.user_id,
        credit_amount: rewards.credits,
      });
    }

    // Create achievement
    if (rewards.badges) {
      await supabase
        .from('social_achievements')
        .insert({
          user_id: participant.user_id,
          achievement_type: 'challenge_completion',
          achievement_name: `${challenge.challenge_name} Champion`,
          description: `Successfully completed the ${challenge.challenge_name} challenge`,
          related_entity_id: challenge.id,
          related_entity_type: 'challenge',
          points_awarded: rewards.completion_points || 0,
          badge_awarded: rewards.badges[0],
          special_reward: rewards.bonus_items || null,
          is_public: true,
        });
    }
  }

  /**
   * Get challenge recommendations for user
   */
  static async getChallengeRecommendations(): Promise<CommunityChallenge[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    // Get user's challenge history to recommend similar types
    const { data: userHistory } = await supabase
      .from('challenge_participants')
      .select('challenge:community_challenges(challenge_type)')
      .eq('user_id', user.user.id)
      .eq('completion_status', 'completed');

    const completedTypes = userHistory?.map(h => h.challenge.challenge_type) || [];
    
    // Recommend challenges of types user has successfully completed
    const typeFilter = completedTypes.length > 0 ? completedTypes : ['consistency', 'variety'];

    const { data, error } = await supabase
      .from('community_challenges')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .in('challenge_type', typeFilter)
      .order('featured_priority', { ascending: false })
      .limit(3);

    if (error) return [];
    return data || [];
  }
}