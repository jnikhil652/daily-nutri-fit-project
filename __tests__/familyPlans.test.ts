import { FamilyPlanService } from '../lib/familyPlans';

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    admin: {
      getUserByEmail: jest.fn(),
    },
  },
  from: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('FamilyPlanService', () => {
  const mockUser = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  const mockFamilyPlan = {
    id: 'plan-123',
    family_name: 'Test Family',
    primary_account_holder: 'user-123',
    billing_account: 'user-123',
    max_members: 6,
    plan_type: 'standard',
    shared_wallet_balance: 100.0,
    family_goals: {},
    coordination_preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  };

  const mockFamilyMember = {
    id: 'member-123',
    family_plan_id: 'plan-123',
    user_id: 'user-123',
    role: 'admin',
    display_name: 'Test User',
    relationship: 'parent',
    permissions: {},
    privacy_settings: {},
    joined_at: new Date().toISOString(),
    is_active: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue(mockUser);
  });

  describe('createFamilyPlan', () => {
    it('should create a family plan successfully', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFamilyPlan, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Mock addFamilyMember call
      jest.spyOn(FamilyPlanService, 'addFamilyMember').mockResolvedValue(mockFamilyMember);

      const createData = {
        family_name: 'Test Family',
        plan_type: 'standard' as const,
        max_members: 6,
      };

      const result = await FamilyPlanService.createFamilyPlan(createData);

      expect(mockSupabase.from).toHaveBeenCalledWith('family_plans');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        family_name: 'Test Family',
        primary_account_holder: 'user-123',
        billing_account: 'user-123',
        plan_type: 'standard',
        max_members: 6,
        family_goals: undefined,
        coordination_preferences: undefined,
      });
      expect(result).toEqual(mockFamilyPlan);
    });

    it('should throw error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const createData = {
        family_name: 'Test Family',
      };

      await expect(FamilyPlanService.createFamilyPlan(createData))
        .rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: new Error('Database error') 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const createData = {
        family_name: 'Test Family',
      };

      await expect(FamilyPlanService.createFamilyPlan(createData))
        .rejects.toThrow('Database error');
    });
  });

  describe('getFamilyPlan', () => {
    it('should retrieve family plan by ID', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFamilyPlan, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FamilyPlanService.getFamilyPlan('plan-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('family_plans');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'plan-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockFamilyPlan);
    });

    it('should return null when plan not found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FamilyPlanService.getFamilyPlan('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('addFamilyMember', () => {
    it('should add a family member successfully', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockFamilyMember, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const memberData = {
        family_plan_id: 'plan-123',
        user_id: 'user-456',
        role: 'member' as const,
        display_name: 'New Member',
      };

      const result = await FamilyPlanService.addFamilyMember(memberData);

      expect(mockSupabase.from).toHaveBeenCalledWith('family_members');
      expect(mockQuery.insert).toHaveBeenCalledWith(memberData);
      expect(result).toEqual(mockFamilyMember);
    });
  });

  describe('getFamilyMembers', () => {
    it('should retrieve all family members', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockFamilyMember], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FamilyPlanService.getFamilyMembers('plan-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('family_members');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('family_plan_id', 'plan-123');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual([mockFamilyMember]);
    });
  });

  describe('updateSharedWallet', () => {
    beforeEach(() => {
      jest.spyOn(FamilyPlanService, 'getFamilyPlan').mockResolvedValue(mockFamilyPlan);
      jest.spyOn(FamilyPlanService, 'updateFamilyPlan').mockResolvedValue(mockFamilyPlan);
    });

    it('should add funds to shared wallet', async () => {
      const result = await FamilyPlanService.updateSharedWallet('plan-123', 50, 'add');

      expect(FamilyPlanService.updateFamilyPlan).toHaveBeenCalledWith('plan-123', {
        shared_wallet_balance: 150,
      });
      expect(result).toEqual({ success: true, new_balance: 150 });
    });

    it('should subtract funds from shared wallet', async () => {
      const result = await FamilyPlanService.updateSharedWallet('plan-123', 30, 'subtract');

      expect(FamilyPlanService.updateFamilyPlan).toHaveBeenCalledWith('plan-123', {
        shared_wallet_balance: 70,
      });
      expect(result).toEqual({ success: true, new_balance: 70 });
    });

    it('should throw error when insufficient funds', async () => {
      await expect(FamilyPlanService.updateSharedWallet('plan-123', 150, 'subtract'))
        .rejects.toThrow('Insufficient funds in shared wallet');
    });
  });

  describe('checkUserPermission', () => {
    it('should return true for primary account holder', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            primary_account_holder: 'user-123',
            billing_account: 'user-456'
          }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FamilyPlanService.checkUserPermission('plan-123', ['admin']);

      expect(result).toBe(true);
    });

    it('should return true for billing account holder', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            primary_account_holder: 'user-456',
            billing_account: 'user-123'
          }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FamilyPlanService.checkUserPermission('plan-123', ['admin']);

      expect(result).toBe(true);
    });

    it('should check user role in family when not account holder', async () => {
      const familyPlanQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            primary_account_holder: 'user-456',
            billing_account: 'user-789'
          }, 
          error: null 
        }),
      };

      const memberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { role: 'admin' }, 
          error: null 
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(familyPlanQuery)
        .mockReturnValueOnce(memberQuery);

      const result = await FamilyPlanService.checkUserPermission('plan-123', ['admin']);

      expect(result).toBe(true);
    });

    it('should return false when user has insufficient permissions', async () => {
      const familyPlanQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { 
            primary_account_holder: 'user-456',
            billing_account: 'user-789'
          }, 
          error: null 
        }),
      };

      const memberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { role: 'member' }, 
          error: null 
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(familyPlanQuery)
        .mockReturnValueOnce(memberQuery);

      const result = await FamilyPlanService.checkUserPermission('plan-123', ['admin']);

      expect(result).toBe(false);
    });

    it('should return false when user not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ user: null });

      const result = await FamilyPlanService.checkUserPermission('plan-123', ['admin']);

      expect(result).toBe(false);
    });
  });

  describe('removeFamilyMember', () => {
    beforeEach(() => {
      jest.spyOn(FamilyPlanService, 'checkUserPermission').mockResolvedValue(true);
      jest.spyOn(FamilyPlanService, 'getFamilyMembers').mockResolvedValue([
        mockFamilyMember,
        { ...mockFamilyMember, id: 'member-456', role: 'member' },
      ]);
    });

    it('should remove a non-admin member successfully', async () => {
      const memberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { family_plan_id: 'plan-123', role: 'member' }, 
          error: null 
        }),
      };

      const updateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(memberQuery)
        .mockReturnValueOnce(updateQuery);

      const result = await FamilyPlanService.removeFamilyMember('member-456');

      expect(updateQuery.update).toHaveBeenCalledWith({ is_active: false });
      expect(result).toEqual({ success: true });
    });

    it('should prevent removing the last admin', async () => {
      const memberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { family_plan_id: 'plan-123', role: 'admin' }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValueOnce(memberQuery);

      // Mock only one admin in family
      jest.spyOn(FamilyPlanService, 'getFamilyMembers').mockResolvedValue([
        mockFamilyMember, // Only one admin
      ]);

      await expect(FamilyPlanService.removeFamilyMember('member-123'))
        .rejects.toThrow('Cannot remove the last administrator');
    });

    it('should throw error when user lacks permission', async () => {
      jest.spyOn(FamilyPlanService, 'checkUserPermission').mockResolvedValue(false);

      const memberQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { family_plan_id: 'plan-123', role: 'member' }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValueOnce(memberQuery);

      await expect(FamilyPlanService.removeFamilyMember('member-456'))
        .rejects.toThrow('Insufficient permissions to remove members');
    });
  });
});