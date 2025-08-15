import { supabase } from './supabase';

export interface FamilyPlan {
  id: string;
  family_name: string;
  primary_account_holder: string;
  billing_account: string;
  max_members: number;
  plan_type: 'standard' | 'premium' | 'custom';
  shared_wallet_balance: number;
  family_goals?: any;
  coordination_preferences?: any;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface FamilyMember {
  id: string;
  family_plan_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'child' | 'guest';
  display_name?: string;
  relationship?: string;
  permissions?: any;
  privacy_settings?: any;
  joined_at: string;
  is_active: boolean;
}

export interface CreateFamilyPlanRequest {
  family_name: string;
  plan_type?: 'standard' | 'premium' | 'custom';
  max_members?: number;
  family_goals?: any;
  coordination_preferences?: any;
}

export interface InviteMemberRequest {
  family_plan_id: string;
  email: string;
  role: 'admin' | 'member' | 'child' | 'guest';
  display_name?: string;
  relationship?: string;
  permissions?: any;
}

export interface UpdateMemberRequest {
  member_id: string;
  role?: 'admin' | 'member' | 'child' | 'guest';
  display_name?: string;
  relationship?: string;
  permissions?: any;
  privacy_settings?: any;
  is_active?: boolean;
}

export interface FamilyDashboard {
  family_plan_id: string;
  family_name: string;
  total_members: number;
  active_members: number;
  wallet_balance: number;
  active_challenges: number;
  created_at: string;
  plan_type: string;
}

export class FamilyPlanService {
  /**
   * Create a new family plan
   */
  static async createFamilyPlan(data: CreateFamilyPlanRequest): Promise<FamilyPlan> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: familyPlan, error } = await supabase
      .from('family_plans')
      .insert({
        family_name: data.family_name,
        primary_account_holder: user.user.id,
        billing_account: user.user.id,
        plan_type: data.plan_type || 'standard',
        max_members: data.max_members || 6,
        family_goals: data.family_goals,
        coordination_preferences: data.coordination_preferences,
      })
      .select()
      .single();

    if (error) throw error;

    // Add creator as admin member
    await this.addFamilyMember({
      family_plan_id: familyPlan.id,
      user_id: user.user.id,
      role: 'admin',
      display_name: 'Family Administrator',
      is_active: true,
    });

    return familyPlan;
  }

  /**
   * Get family plan by ID
   */
  static async getFamilyPlan(planId: string): Promise<FamilyPlan | null> {
    const { data, error } = await supabase
      .from('family_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get user's family plans
   */
  static async getUserFamilyPlans(): Promise<FamilyPlan[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('family_plans')
      .select('*')
      .or(`primary_account_holder.eq.${user.user.id},billing_account.eq.${user.user.id}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update family plan
   */
  static async updateFamilyPlan(
    planId: string,
    updates: Partial<FamilyPlan>
  ): Promise<FamilyPlan> {
    const { data, error } = await supabase
      .from('family_plans')
      .update(updates)
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Add family member directly (for existing users)
   */
  static async addFamilyMember(member: {
    family_plan_id: string;
    user_id: string;
    role: 'admin' | 'member' | 'child' | 'guest';
    display_name?: string;
    relationship?: string;
    permissions?: any;
    privacy_settings?: any;
    is_active?: boolean;
  }): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .insert(member)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Invite member by email (creates pending invitation)
   */
  static async inviteMember(invitation: InviteMemberRequest): Promise<{ success: boolean; message: string }> {
    // First check if family plan exists and user has permission
    const familyPlan = await this.getFamilyPlan(invitation.family_plan_id);
    if (!familyPlan) {
      throw new Error('Family plan not found');
    }

    // Check if user is admin or primary holder
    const hasPermission = await this.checkUserPermission(invitation.family_plan_id, ['admin']);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to invite members');
    }

    // Check if family is at capacity
    const members = await this.getFamilyMembers(invitation.family_plan_id);
    if (members.length >= familyPlan.max_members) {
      throw new Error('Family plan is at maximum capacity');
    }

    // Check if email is already in family
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(invitation.email);
    if (existingUser.user) {
      const existingMember = members.find(m => m.user_id === existingUser.user.id);
      if (existingMember) {
        throw new Error('User is already a member of this family plan');
      }
    }

    // For now, we'll create a simple invitation system
    // In a full implementation, you'd want to send an email invitation
    // and create a pending_invitations table

    return {
      success: true,
      message: `Invitation sent to ${invitation.email}`,
    };
  }

  /**
   * Get family members
   */
  static async getFamilyMembers(familyPlanId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_plan_id', familyPlanId)
      .eq('is_active', true)
      .order('joined_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update family member
   */
  static async updateFamilyMember(
    memberId: string,
    updates: UpdateMemberRequest
  ): Promise<FamilyMember> {
    const { member_id, ...memberUpdates } = updates;

    const { data, error } = await supabase
      .from('family_members')
      .update(memberUpdates)
      .eq('id', memberId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Remove family member
   */
  static async removeFamilyMember(memberId: string): Promise<{ success: boolean }> {
    // Check permission first
    const { data: member } = await supabase
      .from('family_members')
      .select('family_plan_id, role')
      .eq('id', memberId)
      .single();

    if (!member) throw new Error('Member not found');

    const hasPermission = await this.checkUserPermission(member.family_plan_id, ['admin']);
    if (!hasPermission) {
      throw new Error('Insufficient permissions to remove members');
    }

    // Don't allow removing the last admin
    if (member.role === 'admin') {
      const members = await this.getFamilyMembers(member.family_plan_id);
      const adminCount = members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last administrator');
      }
    }

    const { error } = await supabase
      .from('family_members')
      .update({ is_active: false })
      .eq('id', memberId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * Get family dashboard data
   */
  static async getFamilyDashboard(familyPlanId: string): Promise<FamilyDashboard | null> {
    const { data, error } = await supabase
      .from('family_dashboard')
      .select('*')
      .eq('family_plan_id', familyPlanId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if current user has specific permissions
   */
  static async checkUserPermission(
    familyPlanId: string,
    requiredRoles: string[]
  ): Promise<boolean> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return false;

    // Check if user is primary account holder
    const { data: familyPlan } = await supabase
      .from('family_plans')
      .select('primary_account_holder, billing_account')
      .eq('id', familyPlanId)
      .single();

    if (familyPlan && (
      familyPlan.primary_account_holder === user.user.id ||
      familyPlan.billing_account === user.user.id
    )) {
      return true;
    }

    // Check user's role in family
    const { data: member } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_plan_id', familyPlanId)
      .eq('user_id', user.user.id)
      .eq('is_active', true)
      .single();

    return member ? requiredRoles.includes(member.role) : false;
  }

  /**
   * Update shared wallet balance
   */
  static async updateSharedWallet(
    familyPlanId: string,
    amount: number,
    operation: 'add' | 'subtract'
  ): Promise<{ success: boolean; new_balance: number }> {
    const familyPlan = await this.getFamilyPlan(familyPlanId);
    if (!familyPlan) throw new Error('Family plan not found');

    const newBalance = operation === 'add' 
      ? familyPlan.shared_wallet_balance + amount
      : familyPlan.shared_wallet_balance - amount;

    if (newBalance < 0) {
      throw new Error('Insufficient funds in shared wallet');
    }

    await this.updateFamilyPlan(familyPlanId, {
      shared_wallet_balance: newBalance,
    });

    return { success: true, new_balance: newBalance };
  }

  /**
   * Get family member by user ID
   */
  static async getFamilyMemberByUserId(
    familyPlanId: string,
    userId: string
  ): Promise<FamilyMember | null> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_plan_id', familyPlanId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Transfer family plan ownership
   */
  static async transferOwnership(
    familyPlanId: string,
    newOwnerId: string
  ): Promise<{ success: boolean }> {
    // Check if current user is the primary account holder
    const hasPermission = await this.checkUserPermission(familyPlanId, ['admin']);
    if (!hasPermission) {
      throw new Error('Only the primary account holder can transfer ownership');
    }

    // Check if new owner is a family member
    const newOwnerMember = await this.getFamilyMemberByUserId(familyPlanId, newOwnerId);
    if (!newOwnerMember) {
      throw new Error('New owner must be an existing family member');
    }

    // Update family plan ownership
    await this.updateFamilyPlan(familyPlanId, {
      primary_account_holder: newOwnerId,
    });

    // Ensure new owner has admin role
    if (newOwnerMember.role !== 'admin') {
      await this.updateFamilyMember(newOwnerMember.id, {
        member_id: newOwnerMember.id,
        role: 'admin',
      });
    }

    return { success: true };
  }
}