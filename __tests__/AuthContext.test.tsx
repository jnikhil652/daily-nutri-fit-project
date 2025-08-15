import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    setSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
};

jest.mock('../lib/supabase', () => ({
  supabase: mockSupabase,
}));

// Test component to access AuthContext
const TestComponent = () => {
  const auth = useAuth();
  return null;
};

// Helper component to test AuthContext hook
const AuthContextConsumer = ({ onAuthChange }: { onAuthChange: (auth: any) => void }) => {
  const auth = useAuth();
  React.useEffect(() => {
    onAuthChange(auth);
  }, [auth, onAuthChange]);
  return null;
};

describe('AuthContext', () => {
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
    
    // Mock the auth state change listener
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    
    // Mock initial session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    AsyncStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with null user state', async () => {
      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState).toBeTruthy();
        expect(authState.user).toBeNull();
        expect(authState.session).toBeNull();
        expect(authState.loading).toBe(false);
      });
    });

    it('should initialize with existing session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.user).toEqual(mockUser);
        expect(authState.session).toEqual(mockSession);
        expect(authState.loading).toBe(false);
      });
    });

    it('should handle session initialization error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      });

      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState.loading).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith('Error getting session:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Authentication Methods', () => {
    let authMethods: any = null;

    beforeEach(async () => {
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authMethods = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeTruthy();
      });
    });

    describe('signUp', () => {
      it('should sign up user successfully', async () => {
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        const result = await authMethods.signUp('test@example.com', 'password123', 'Test User');

        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: { full_name: 'Test User' },
            emailRedirectTo: 'dailynutrifit://auth/verify',
          },
        });
        expect(result.error).toBeNull();
      });

      it('should handle sign up error', async () => {
        const signUpError = new Error('Email already exists');
        mockSupabase.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: signUpError,
        });

        const result = await authMethods.signUp('test@example.com', 'password123', 'Test User');

        expect(result.error).toEqual(signUpError);
      });

      it('should handle sign up exception', async () => {
        const signUpError = new Error('Network error');
        mockSupabase.auth.signUp.mockRejectedValue(signUpError);

        const result = await authMethods.signUp('test@example.com', 'password123', 'Test User');

        expect(result.error).toEqual(signUpError);
      });
    });

    describe('signIn', () => {
      it('should sign in user successfully', async () => {
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        });

        const result = await authMethods.signIn('test@example.com', 'password123');

        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.error).toBeNull();
      });

      it('should handle sign in error', async () => {
        const signInError = new Error('Invalid credentials');
        mockSupabase.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: signInError,
        });

        const result = await authMethods.signIn('test@example.com', 'wrongpassword');

        expect(result.error).toEqual(signInError);
      });

      it('should handle sign in exception', async () => {
        const signInError = new Error('Network error');
        mockSupabase.auth.signInWithPassword.mockRejectedValue(signInError);

        const result = await authMethods.signIn('test@example.com', 'password123');

        expect(result.error).toEqual(signInError);
      });
    });

    describe('signOut', () => {
      it('should sign out user successfully', async () => {
        mockSupabase.auth.signOut.mockResolvedValue({ error: null });

        await authMethods.signOut();

        expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('supabase_session');
      });

      it('should handle sign out error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const signOutError = new Error('Sign out failed');
        mockSupabase.auth.signOut.mockRejectedValue(signOutError);

        await authMethods.signOut();

        expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', signOutError);
        
        consoleSpy.mockRestore();
      });
    });

    describe('resetPassword', () => {
      it('should send password reset email successfully', async () => {
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

        const result = await authMethods.resetPassword('test@example.com');

        expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: 'dailynutrifit://auth/reset-password' }
        );
        expect(result.error).toBeNull();
      });

      it('should handle password reset error', async () => {
        const resetError = new Error('Email not found');
        mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: resetError });

        const result = await authMethods.resetPassword('test@example.com');

        expect(result.error).toEqual(resetError);
      });

      it('should handle password reset exception', async () => {
        const resetError = new Error('Network error');
        mockSupabase.auth.resetPasswordForEmail.mockRejectedValue(resetError);

        const result = await authMethods.resetPassword('test@example.com');

        expect(result.error).toEqual(resetError);
      });
    });
  });

  describe('Auth State Changes', () => {
    it('should update user state when login succeeds', async () => {
      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      // Wait for initial state
      await waitFor(() => {
        expect(authState).toBeTruthy();
        expect(authState.user).toBeNull();
      });

      // Simulate auth state change
      const [callback] = mockSupabase.auth.onAuthStateChange.mock.calls[0];
      
      await act(async () => {
        await callback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(authState.user).toEqual(mockUser);
        expect(authState.session).toEqual(mockSession);
        expect(authState.loading).toBe(false);
      });

      // Verify session was stored in AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'supabase_session',
        JSON.stringify(mockSession)
      );
    });

    it('should clear user state when logout is called', async () => {
      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      // Wait for initial state
      await waitFor(() => {
        expect(authState).toBeTruthy();
      });

      // Simulate logout
      const [callback] = mockSupabase.auth.onAuthStateChange.mock.calls[0];
      
      await act(async () => {
        await callback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(authState.user).toBeNull();
        expect(authState.session).toBeNull();
        expect(authState.loading).toBe(false);
      });

      // Verify session was removed from AsyncStorage
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('supabase_session');
    });

    it('should handle authentication errors gracefully', async () => {
      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState).toBeTruthy();
      });

      // Simulate auth error
      const [callback] = mockSupabase.auth.onAuthStateChange.mock.calls[0];
      
      await act(async () => {
        await callback('TOKEN_REFRESHED', null);
      });

      await waitFor(() => {
        expect(authState.user).toBeNull();
        expect(authState.session).toBeNull();
        expect(authState.loading).toBe(false);
      });
    });

    it('should persist user session across app restarts', async () => {
      // Test that session persistence is handled in auth state change
      let authState: any = null;
      
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authState = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authState).toBeTruthy();
      });

      const [callback] = mockSupabase.auth.onAuthStateChange.mock.calls[0];
      
      await act(async () => {
        await callback('SIGNED_IN', mockSession);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'supabase_session',
        JSON.stringify(mockSession)
      );
    });
  });

  describe('Deep Link Handling', () => {
    let authMethods: any = null;

    beforeEach(async () => {
      render(
        <AuthProvider>
          <AuthContextConsumer onAuthChange={(auth) => { authMethods = auth; }} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(authMethods).toBeTruthy();
      });
    });

    it('should handle email verification deep link', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const verificationUrl = 'dailynutrifit://auth/verify#access_token=token123&refresh_token=refresh123&type=signup';

      await authMethods.handleDeepLink(verificationUrl);

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'token123',
        refresh_token: 'refresh123',
      });
      expect(mockAlert).toHaveBeenCalledWith(
        'Success',
        'Email verified successfully! You can now use the app.'
      );

      mockAlert.mockRestore();
    });

    it('should handle password reset deep link', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSupabase.auth.setSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const resetUrl = 'dailynutrifit://auth/reset-password#access_token=token123&refresh_token=refresh123&type=recovery';

      await authMethods.handleDeepLink(resetUrl);

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: 'token123',
        refresh_token: 'refresh123',
      });
      expect(mockAlert).toHaveBeenCalledWith(
        'Success',
        'You can now set a new password.'
      );

      mockAlert.mockRestore();
    });

    it('should handle deep link errors', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();

      const errorUrl = 'dailynutrifit://auth/verify#error=access_denied&error_description=User%20denied%20access';

      await authMethods.handleDeepLink(errorUrl);

      expect(mockAlert).toHaveBeenCalledWith(
        'Authentication Error',
        'User denied access'
      );

      mockAlert.mockRestore();
    });

    it('should handle session set errors during deep link processing', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSupabase.auth.setSession.mockResolvedValue({
        data: null,
        error: new Error('Invalid tokens'),
      });

      const verificationUrl = 'dailynutrifit://auth/verify#access_token=invalid&refresh_token=invalid&type=signup';

      await authMethods.handleDeepLink(verificationUrl);

      expect(mockAlert).toHaveBeenCalledWith(
        'Verification Error',
        'Failed to verify email. Please try again.'
      );

      mockAlert.mockRestore();
    });

    it('should handle malformed deep links gracefully', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const malformedUrl = 'not-a-valid-url';

      await authMethods.handleDeepLink(malformedUrl);

      expect(mockAlert).toHaveBeenCalledWith(
        'Error',
        'Failed to process authentication link.'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error handling deep link:',
        expect.any(Error)
      );

      mockAlert.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Hook Usage', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});