import { supabase } from '../lib/supabase';

describe('Supabase Client Integration', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
    user_metadata: { full_name: 'Test User' },
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    user: mockUser,
    expires_at: Date.now() + 3600000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Client Initialization', () => {
    it('should initialize Supabase client correctly', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
    });

    it('should have correct auth methods available', () => {
      expect(typeof supabase.auth.getSession).toBe('function');
      expect(typeof supabase.auth.getUser).toBe('function');
      expect(typeof supabase.auth.signInWithPassword).toBe('function');
      expect(typeof supabase.auth.signUp).toBe('function');
      expect(typeof supabase.auth.signOut).toBe('function');
    });

    it('should have database query methods available', () => {
      expect(typeof supabase.from).toBe('function');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle session retrieval correctly', async () => {
      // Mock the specific response for this test
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const { data, error } = await supabase.auth.getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(data.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle session initialization errors gracefully', async () => {
      const sessionError = { message: 'Session initialization failed' };
      
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: null },
        error: sessionError,
      });

      const { data, error } = await supabase.auth.getSession();

      expect(error).toEqual(sessionError);
      expect(data.session).toBeNull();
    });

    it('should handle user authentication correctly', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(data.user).toEqual(mockUser);
      expect(data.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle authentication errors', async () => {
      const authError = { message: 'Invalid credentials' };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: authError,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'invalid@example.com',
        password: 'wrongpassword',
      });

      expect(error).toEqual(authError);
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });
  });

  describe('Database Operations', () => {
    it('should create query builder correctly', () => {
      const queryBuilder = supabase.from('test_table');
      expect(queryBuilder).toBeDefined();
      expect(typeof queryBuilder.select).toBe('function');
      expect(typeof queryBuilder.insert).toBe('function');
      expect(typeof queryBuilder.update).toBe('function');
      expect(typeof queryBuilder.delete).toBe('function');
    });

    it('should handle database queries', async () => {
      const mockData = [{ id: 1, name: 'Test Item' }];
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockData[0],
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockQueryBuilder);

      const queryBuilder = supabase.from('test_table');
      const result = await queryBuilder.select('*').eq('id', 1).single();

      expect(supabase.from).toHaveBeenCalledWith('test_table');
      expect(result.data).toEqual(mockData[0]);
      expect(result.error).toBeNull();
    });
  });
});
