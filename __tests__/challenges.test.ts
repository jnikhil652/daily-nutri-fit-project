import { ChallengeService } from '../lib/challenges';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    admin: {
      getUserById: jest.fn(),
    },
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('ChallengeService', () => {
  const mockUser = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      created_at: '2025-01-01T00:00:00Z',
    },
  };

  const mockChallenge = {
    id: 'challenge-123',
    challenge_name: 'Test Challenge',
    description: 'A test challenge for unit testing',
    challenge_type: 'consistency',
    difficulty_level: 2,
    duration_days: 14,
    max_participants: 100,
    entry_requirements: { min_deliveries: 1 },
    success_criteria: { consecutive_days: 7 },
    reward_structure: { completion_points: 200, credits: 15.0 },
    start_date: '2025-01-15',
    end_date: '2025-01-29',
    created_by: 'admin-123',
    is_public: true,
    is_active: true,
    featured_priority: 5,
    created_at: new Date().toISOString(),
  };

  const mockParticipant = {
    id: 'participant-123',
    challenge_id: 'challenge-123',
    user_id: 'user-123',
    joined_at: new Date().toISOString(),
    completion_status: 'active',
    completion_date: null,
    final_score: 50,
    rank_position: null,
    rewards_earned: null,
    is_visible: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue(mockUser);
  });

  describe('getPublicChallenges', () => {
    it('should retrieve all public challenges', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ChallengeService.getPublicChallenges();

      expect(mockSupabase.from).toHaveBeenCalledWith('community_challenges');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual([mockChallenge]);
    });

    it('should filter by challenge type', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await ChallengeService.getPublicChallenges('consistency');

      expect(mockQuery.eq).toHaveBeenCalledWith('challenge_type', 'consistency');
    });

    it('should include inactive challenges when specified', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await ChallengeService.getPublicChallenges(undefined, false);

      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true);
      expect(mockQuery.eq).not.toHaveBeenCalledWith('is_active', true);
    });
  });

  describe('getFeaturedChallenges', () => {
    it('should retrieve featured challenges', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ChallengeService.getFeaturedChallenges();

      expect(mockQuery.gt).toHaveBeenCalledWith('featured_priority', 0);
      expect(mockQuery.limit).toHaveBeenCalledWith(5);
      expect(result).toEqual([mockChallenge]);
    });
  });

  describe('createChallenge', () => {
    it('should create a new challenge', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockChallenge, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const createData = {
        challenge_name: 'Test Challenge',
        description: 'A test challenge',
        challenge_type: 'consistency' as const,
        difficulty_level: 2,
        duration_days: 14,
        success_criteria: { consecutive_days: 7 },
        reward_structure: { completion_points: 200 },
        start_date: '2025-01-15',
        end_date: '2025-01-29',
      };

      const result = await ChallengeService.createChallenge(createData);

      expect(mockSupabase.from).toHaveBeenCalledWith('community_challenges');
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createData,
          created_by: 'user-123',
          is_public: true,
          is_active: true,
          featured_priority: 0,
        })
      );
      expect(result).toEqual(mockChallenge);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const createData = {
        challenge_name: 'Test Challenge',
        description: 'A test challenge',
        challenge_type: 'consistency' as const,
        difficulty_level: 2,
        duration_days: 14,
        success_criteria: { consecutive_days: 7 },
        reward_structure: { completion_points: 200 },
        start_date: '2025-01-15',
        end_date: '2025-01-29',
      };

      await expect(ChallengeService.createChallenge(createData))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('joinChallenge', () => {
    beforeEach(() => {
      jest.spyOn(ChallengeService, 'getChallenge').mockResolvedValue(mockChallenge);
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(null);
      jest.spyOn(ChallengeService, 'getChallengeParticipants').mockResolvedValue([]);
      jest.spyOn(ChallengeService as any, 'checkEntryRequirements').mockResolvedValue(true);
    });

    it('should join a challenge successfully', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockParticipant, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const joinData = {
        challenge_id: 'challenge-123',
        is_visible: true,
      };

      const result = await ChallengeService.joinChallenge(joinData);

      expect(mockSupabase.from).toHaveBeenCalledWith('challenge_participants');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        challenge_id: 'challenge-123',
        user_id: 'user-123',
        completion_status: 'active',
        final_score: 0,
        is_visible: true,
      });
      expect(result).toEqual(mockParticipant);
    });

    it('should throw error when challenge not found', async () => {
      jest.spyOn(ChallengeService, 'getChallenge').mockResolvedValue(null);

      const joinData = {
        challenge_id: 'non-existent',
        is_visible: true,
      };

      await expect(ChallengeService.joinChallenge(joinData))
        .rejects.toThrow('Challenge not found');
    });

    it('should throw error when already participating', async () => {
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(mockParticipant);

      const joinData = {
        challenge_id: 'challenge-123',
        is_visible: true,
      };

      await expect(ChallengeService.joinChallenge(joinData))
        .rejects.toThrow('Already participating in this challenge');
    });

    it('should throw error when challenge is at capacity', async () => {
      const fullChallenge = { ...mockChallenge, max_participants: 1 };
      jest.spyOn(ChallengeService, 'getChallenge').mockResolvedValue(fullChallenge);
      jest.spyOn(ChallengeService, 'getChallengeParticipants').mockResolvedValue([mockParticipant]);

      const joinData = {
        challenge_id: 'challenge-123',
        is_visible: true,
      };

      await expect(ChallengeService.joinChallenge(joinData))
        .rejects.toThrow('Challenge is at maximum capacity');
    });

    it('should throw error when entry requirements not met', async () => {
      jest.spyOn(ChallengeService as any, 'checkEntryRequirements').mockResolvedValue(false);

      const joinData = {
        challenge_id: 'challenge-123',
        is_visible: true,
      };

      await expect(ChallengeService.joinChallenge(joinData))
        .rejects.toThrow('User does not meet entry requirements');
    });
  });

  describe('addProgress', () => {
    beforeEach(() => {
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(mockParticipant);
    });

    it('should add progress successfully', async () => {
      const mockProgressQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      };

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockProgressQuery) // Check existing progress
        .mockReturnValueOnce(mockProgressQuery) // Get previous progress
        .mockReturnValueOnce(mockProgressQuery) // Insert new progress
        .mockReturnValueOnce(mockUpdateQuery); // Update participant score

      const progressEntry = {
        progress_data: { fruits: ['apple', 'banana'] },
        daily_score: 20,
        notes: 'Good day!',
      };

      // Mock previous progress query
      mockProgressQuery.single.mockResolvedValueOnce({ data: null, error: null })
                              .mockResolvedValueOnce({ data: { cumulative_score: 30 }, error: null })
                              .mockResolvedValueOnce({ 
                                data: { 
                                  id: 'progress-123',
                                  cumulative_score: 50 
                                }, 
                                error: null 
                              });

      const result = await ChallengeService.addProgress('challenge-123', progressEntry);

      expect(mockProgressQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          challenge_participant_id: 'participant-123',
          progress_data: { fruits: ['apple', 'banana'] },
          daily_score: 20,
          cumulative_score: 50,
          notes: 'Good day!',
          auto_generated: false,
        })
      );
    });

    it('should throw error when user not participating', async () => {
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(null);

      const progressEntry = {
        progress_data: { fruits: ['apple'] },
        daily_score: 10,
      };

      await expect(ChallengeService.addProgress('challenge-123', progressEntry))
        .rejects.toThrow('User is not participating in this challenge');
    });

    it('should throw error when participation is not active', async () => {
      const inactiveParticipant = { ...mockParticipant, completion_status: 'completed' };
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(inactiveParticipant);

      const progressEntry = {
        progress_data: { fruits: ['apple'] },
        daily_score: 10,
      };

      await expect(ChallengeService.addProgress('challenge-123', progressEntry))
        .rejects.toThrow('Cannot add progress to inactive participation');
    });

    it('should throw error when progress already exists for today', async () => {
      const mockProgressQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'existing-progress' }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockProgressQuery);

      const progressEntry = {
        progress_data: { fruits: ['apple'] },
        daily_score: 10,
      };

      await expect(ChallengeService.addProgress('challenge-123', progressEntry))
        .rejects.toThrow('Progress already recorded for today');
    });
  });

  describe('withdrawFromChallenge', () => {
    it('should withdraw from challenge successfully', async () => {
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(mockParticipant);

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await ChallengeService.withdrawFromChallenge('challenge-123');

      expect(mockQuery.update).toHaveBeenCalledWith({
        completion_status: 'withdrawn',
        completion_date: expect.any(String),
      });
      expect(result).toEqual({ success: true });
    });

    it('should throw error when user not participating', async () => {
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(null);

      await expect(ChallengeService.withdrawFromChallenge('challenge-123'))
        .rejects.toThrow('User is not participating in this challenge');
    });

    it('should throw error when participation is not active', async () => {
      const completedParticipant = { ...mockParticipant, completion_status: 'completed' };
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(completedParticipant);

      await expect(ChallengeService.withdrawFromChallenge('challenge-123'))
        .rejects.toThrow('Cannot withdraw from inactive participation');
    });
  });

  describe('getChallengeStats', () => {
    it('should calculate challenge statistics', async () => {
      const participants = [
        { ...mockParticipant, completion_status: 'active', final_score: 100 },
        { ...mockParticipant, id: 'p2', completion_status: 'completed', final_score: 150 },
        { ...mockParticipant, id: 'p3', completion_status: 'active', final_score: 75 },
      ];

      jest.spyOn(ChallengeService, 'getChallengeParticipants').mockResolvedValue(participants);
      jest.spyOn(ChallengeService, 'getChallenge').mockResolvedValue({
        ...mockChallenge,
        end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
      });
      jest.spyOn(ChallengeService, 'getUserParticipation').mockResolvedValue(participants[0]);

      const result = await ChallengeService.getChallengeStats('challenge-123');

      expect(result).toEqual({
        total_participants: 3,
        active_participants: 2,
        completed_participants: 1,
        average_score: (100 + 150 + 75) / 3,
        completion_rate: (1 / 3) * 100,
        days_remaining: 5,
        user_rank: 2, // User with score 100 is ranked 2nd
        user_score: 100,
      });
    });
  });

  describe('getChallengeRecommendations', () => {
    it('should get recommendations based on user history', async () => {
      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      const mockRecommendationsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockHistoryQuery)
        .mockReturnValueOnce(mockRecommendationsQuery);

      // Mock user history
      mockHistoryQuery.eq.mockReturnThis();
      mockHistoryQuery.eq.mockResolvedValue({
        data: [{ challenge: { challenge_type: 'consistency' } }],
        error: null,
      });

      const result = await ChallengeService.getChallengeRecommendations();

      expect(mockRecommendationsQuery.in).toHaveBeenCalledWith('challenge_type', ['consistency']);
      expect(result).toEqual([mockChallenge]);
    });

    it('should return empty array when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const result = await ChallengeService.getChallengeRecommendations();

      expect(result).toEqual([]);
    });

    it('should use default types when no history', async () => {
      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      const mockRecommendationsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockChallenge], error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockHistoryQuery)
        .mockReturnValueOnce(mockRecommendationsQuery);

      // Mock empty history
      mockHistoryQuery.eq.mockReturnThis();
      mockHistoryQuery.eq.mockResolvedValue({ data: [], error: null });

      await ChallengeService.getChallengeRecommendations();

      expect(mockRecommendationsQuery.in).toHaveBeenCalledWith('challenge_type', ['consistency', 'variety']);
    });
  });
});