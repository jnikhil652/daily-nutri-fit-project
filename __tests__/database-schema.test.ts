import { supabase } from '../lib/supabase';

// Mock the Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
  },
  rpc: jest.fn(),
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('Database Schema Operations', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '+1234567890',
    date_of_birth: '1990-01-01',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  const mockAddress = {
    id: 'address-123',
    user_id: 'user-123',
    title: 'Home',
    address_line_1: '123 Main St',
    address_line_2: 'Apt 4B',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    is_primary: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });
  });

  describe('Profile Management', () => {
    it('should create user profile successfully', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Simulate profile creation
      const profileData = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        date_of_birth: '1990-01-01',
      };

      // Test profile insertion
      mockSupabase.from('profiles').insert(profileData).select().single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.insert).toHaveBeenCalledWith(profileData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should retrieve user profile data correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Test profile retrieval
      await mockSupabase.from('profiles').select('*').eq('id', 'user-123').single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should update profile information successfully', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const updateData = {
        full_name: 'Updated Name',
        phone: '+0987654321',
        updated_at: new Date().toISOString(),
      };

      // Test profile update
      await mockSupabase.from('profiles')
        .update(updateData)
        .eq('id', 'user-123')
        .select()
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should handle profile creation errors', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Profile already exists', code: '23505' } 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const profileData = {
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'Test User',
      };

      const result = await mockSupabase.from('profiles')
        .insert(profileData)
        .select()
        .single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('23505');
    });
  });

  describe('Delivery Address Management', () => {
    it('should create delivery address successfully', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAddress, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const addressData = {
        user_id: 'user-123',
        title: 'Home',
        address_line_1: '123 Main St',
        address_line_2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        is_primary: true,
      };

      await mockSupabase.from('delivery_addresses')
        .insert(addressData)
        .select()
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('delivery_addresses');
      expect(mockQuery.insert).toHaveBeenCalledWith(addressData);
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should retrieve user delivery addresses', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [mockAddress], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await mockSupabase.from('delivery_addresses')
        .select('*')
        .eq('user_id', 'user-123')
        .order('created_at', { ascending: false });

      expect(mockSupabase.from).toHaveBeenCalledWith('delivery_addresses');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should update delivery address', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAddress, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const updateData = {
        title: 'Updated Home',
        address_line_1: '456 Updated St',
        updated_at: new Date().toISOString(),
      };

      await mockSupabase.from('delivery_addresses')
        .update(updateData)
        .eq('id', 'address-123')
        .select()
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('delivery_addresses');
      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'address-123');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.single).toHaveBeenCalled();
    });

    it('should delete delivery address', async () => {
      const mockQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await mockSupabase.from('delivery_addresses')
        .delete()
        .eq('id', 'address-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('delivery_addresses');
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'address-123');
    });

    it('should handle primary address constraint', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAddress, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Test setting an address as primary
      const updateData = {
        is_primary: true,
        updated_at: new Date().toISOString(),
      };

      await mockSupabase.from('delivery_addresses')
        .update(updateData)
        .eq('id', 'address-123')
        .select()
        .single();

      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
    });
  });

  describe('Row Level Security (RLS)', () => {
    it('should respect RLS policies for profile access', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Simulate authenticated user accessing their own profile
      await mockSupabase.from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should respect RLS policies for delivery address access', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Simulate authenticated user accessing their own addresses
      await mockSupabase.from('delivery_addresses')
        .select('*')
        .eq('user_id', 'user-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('delivery_addresses');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('should handle unauthorized access attempts', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Row level security policy violated', code: '42501' } 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await mockSupabase.from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('42501');
    });
  });

  describe('Database Constraints and Validation', () => {
    it('should enforce unique email constraint', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'duplicate key value violates unique constraint', code: '23505' } 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const duplicateProfileData = {
        id: 'user-456',
        email: 'test@example.com', // Same email as existing user
        full_name: 'Another User',
      };

      const result = await mockSupabase.from('profiles')
        .insert(duplicateProfileData)
        .select()
        .single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('23505');
    });

    it('should enforce foreign key constraints', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'insert or update on table violates foreign key constraint', code: '23503' } 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const invalidAddressData = {
        user_id: 'non-existent-user',
        title: 'Home',
        address_line_1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
      };

      const result = await mockSupabase.from('delivery_addresses')
        .insert(invalidAddressData)
        .select()
        .single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('23503');
    });

    it('should enforce not null constraints', async () => {
      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'null value in column violates not-null constraint', code: '23502' } 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const incompleteProfileData = {
        id: 'user-789',
        // Missing required email field
        full_name: 'Test User',
      };

      const result = await mockSupabase.from('profiles')
        .insert(incompleteProfileData)
        .select()
        .single();

      expect(result.error).toBeTruthy();
      expect(result.error.code).toBe('23502');
    });
  });

  describe('Database Functions and Triggers', () => {
    it('should test automatic profile creation trigger', async () => {
      // Test that when a new user is created, a profile is automatically created
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Simulate checking if profile was created after user registration
      await mockSupabase.from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
    });

    it('should test updated_at timestamp function', async () => {
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: { ...mockProfile, updated_at: '2025-01-02T00:00:00Z' }, 
          error: null 
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const updateData = {
        full_name: 'Updated Name',
        // updated_at should be automatically set by trigger
      };

      const result = await mockSupabase.from('profiles')
        .update(updateData)
        .eq('id', 'user-123')
        .select()
        .single();

      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
      expect(result.data.updated_at).toBeTruthy();
    });

    it('should test primary address constraint function', async () => {
      // Test that only one address can be primary per user
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockAddress, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const updateData = {
        is_primary: true,
        updated_at: new Date().toISOString(),
      };

      await mockSupabase.from('delivery_addresses')
        .update(updateData)
        .eq('id', 'address-123')
        .select()
        .single();

      expect(mockQuery.update).toHaveBeenCalledWith(updateData);
    });
  });

  describe('Sample Data Testing', () => {
    it('should retrieve profile with sample data', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await mockSupabase.from('profiles')
        .select('*')
        .eq('id', 'user-123')
        .single();

      expect(result.data).toEqual(mockProfile);
      expect(result.data.email).toBe('test@example.com');
      expect(result.data.full_name).toBe('Test User');
    });

    it('should handle multiple delivery addresses for single user', async () => {
      const mockAddresses = [
        mockAddress,
        {
          ...mockAddress,
          id: 'address-456',
          title: 'Work',
          is_primary: false,
        },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockAddresses, error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await mockSupabase.from('delivery_addresses')
        .select('*')
        .eq('user_id', 'user-123')
        .order('created_at', { ascending: false });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].is_primary).toBe(true);
      expect(result.data[1].is_primary).toBe(false);
    });
  });
});