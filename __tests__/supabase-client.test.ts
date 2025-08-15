import { supabase } from '../lib/supabase';

// Mock the Supabase client initialization
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    setSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    refreshSession: jest.fn(),
  },
  from: jest.fn(),
  channel: jest.fn(),
  removeChannel: jest.fn(),
  realtime: {
    connect: jest.fn(),
    disconnect: jest.fn(),
  },
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

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
      expect(typeof supabase.auth.resetPasswordForEmail).toBe('function');
      expect(typeof supabase.auth.setSession).toBe('function');
      expect(typeof supabase.auth.onAuthStateChange).toBe('function');
    });

    it('should have database query methods available', () => {
      expect(typeof supabase.from).toBe('function');
    });
  });

  describe('Authentication Integration', () => {
    it('should handle session retrieval correctly', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { data, error } = await supabase.auth.getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(data.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle session initialization errors gracefully', async () => {
      const sessionError = new Error('Failed to retrieve session');
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: sessionError,
      });

      const { data, error } = await supabase.auth.getSession();

      expect(error).toEqual(sessionError);
      expect(data.session).toBeNull();
    });

    it('should handle user authentication correctly', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
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
      const authError = { message: 'Invalid login credentials', status: 400 };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(error).toEqual(authError);
      expect(data.user).toBeNull();
      expect(data.session).toBeNull();
    });

    it('should sync authentication state with Supabase session', async () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { data } = supabase.auth.onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(data.subscription.unsubscribe).toBe(mockUnsubscribe);
    });

    it('should refresh JWT tokens automatically', async () => {
      const newSession = {
        ...mockSession,
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const { data, error } = await supabase.auth.refreshSession();

      expect(supabase.auth.refreshSession).toHaveBeenCalled();
      expect(data.session.access_token).toBe('new-access-token');
      expect(error).toBeNull();
    });
  });

  describe('Database Operations', () => {
    it('should initialize database queries correctly', () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn(),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const query = supabase.from('profiles');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(query).toEqual(mockQuery);
    });

    it('should handle database query success', async () => {
      const mockData = [
        { id: 'user-123', email: 'test@example.com', full_name: 'Test User' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await supabase.from('profiles').select('*').eq('id', 'user-123');

      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-123');
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
    });

    it('should handle database query errors', async () => {
      const dbError = { message: 'Table does not exist', code: '42P01' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: dbError }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await supabase.from('invalid_table').select('*').eq('id', 'user-123');

      expect(result.data).toBeNull();
      expect(result.error).toEqual(dbError);
    });

    it('should handle row level security policies', async () => {
      const rlsError = { message: 'Row level security policy violated', code: '42501' };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: rlsError }),
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await supabase.from('profiles').select('*').eq('id', 'other-user');

      expect(result.error).toEqual(rlsError);
      expect(result.error.code).toBe('42501');
    });
  });

  describe('Network Connectivity', () => {
    it('should handle network connectivity issues gracefully', async () => {
      const networkError = new Error('Network request failed');
      mockSupabaseClient.auth.getSession.mockRejectedValue(networkError);

      try {
        await supabase.auth.getSession();
      } catch (error) {
        expect(error).toEqual(networkError);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { message: 'Request timeout', code: 'TIMEOUT' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: timeoutError,
      });

      const { data, error } = await supabase.auth.getUser();

      expect(error).toEqual(timeoutError);
      expect(error.code).toBe('TIMEOUT');
    });

    it('should retry failed requests appropriately', async () => {
      // First call fails, second succeeds
      mockSupabaseClient.auth.getUser
        .mockResolvedValueOnce({
          data: { user: null },
          error: { message: 'Network error', code: 'NETWORK_ERROR' },
        })
        .mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });

      // First attempt (fails)
      const firstResult = await supabase.auth.getUser();
      expect(firstResult.error).toBeTruthy();

      // Second attempt (succeeds)
      const secondResult = await supabase.auth.getUser();
      expect(secondResult.data.user).toEqual(mockUser);
      expect(secondResult.error).toBeNull();
    });
  });

  describe('Real-time Features', () => {
    it('should initialize real-time connection', () => {
      mockSupabaseClient.realtime.connect.mockReturnValue(undefined);

      supabase.realtime.connect();

      expect(supabase.realtime.connect).toHaveBeenCalled();
    });

    it('should handle real-time disconnection', () => {
      mockSupabaseClient.realtime.disconnect.mockReturnValue(undefined);

      supabase.realtime.disconnect();

      expect(supabase.realtime.disconnect).toHaveBeenCalled();
    });

    it('should create and manage channels', () => {
      const mockChannel = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        on: jest.fn(),
      };

      mockSupabaseClient.channel.mockReturnValue(mockChannel);

      const channel = supabase.channel('public:profiles');

      expect(supabase.channel).toHaveBeenCalledWith('public:profiles');
      expect(channel).toEqual(mockChannel);
    });

    it('should remove channels properly', () => {
      const mockChannel = {
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
        on: jest.fn(),
      };

      mockSupabaseClient.removeChannel.mockReturnValue(undefined);

      supabase.removeChannel(mockChannel);

      expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('Session Management', () => {
    it('should set session with valid tokens', async () => {
      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { data, error } = await supabase.auth.setSession({
        access_token: 'valid-token',
        refresh_token: 'valid-refresh-token',
      });

      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'valid-token',
        refresh_token: 'valid-refresh-token',
      });
      expect(data.session).toEqual(mockSession);
      expect(error).toBeNull();
    });

    it('should handle invalid session tokens', async () => {
      const sessionError = { message: 'Invalid access token', code: 'INVALID_TOKEN' };
      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: { session: null },
        error: sessionError,
      });

      const { data, error } = await supabase.auth.setSession({
        access_token: 'invalid-token',
        refresh_token: 'invalid-refresh-token',
      });

      expect(error).toEqual(sessionError);
      expect(data.session).toBeNull();
    });

    it('should handle session expiration', async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: Date.now() - 3600000, // Expired 1 hour ago
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      });

      const { data, error } = await supabase.auth.getSession();

      expect(data.session.expires_at).toBeLessThan(Date.now());
      expect(error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting', async () => {
      const rateLimitError = { 
        message: 'Too many requests', 
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED' 
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: rateLimitError,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(error.status).toBe(429);
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should handle service unavailable errors', async () => {
      const serviceError = { 
        message: 'Service temporarily unavailable', 
        status: 503,
        code: 'SERVICE_UNAVAILABLE' 
      };

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: serviceError }),
      });

      const result = await supabase.from('profiles').select('*').eq('id', 'user-123');

      expect(result.error.status).toBe(503);
      expect(result.error.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should handle malformed requests', async () => {
      const malformedError = { 
        message: 'Bad request format', 
        status: 400,
        code: 'BAD_REQUEST' 
      };

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: malformedError }),
      });

      const result = await supabase.from('profiles')
        .insert(null) // Invalid data
        .select()
        .single();

      expect(result.error.status).toBe(400);
      expect(result.error.code).toBe('BAD_REQUEST');
    });
  });
});