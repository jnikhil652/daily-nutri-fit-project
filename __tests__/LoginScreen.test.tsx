import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';

// Mock the AuthContext
const mockSignIn = jest.fn();
const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: mockSignIn,
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  handleDeepLink: jest.fn(),
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  reset: jest.fn(),
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginScreen = () => {
    return render(<LoginScreen navigation={mockNavigation as any} />);
  };

  describe('Form Rendering', () => {
    it('should render all form elements', () => {
      renderLoginScreen();

      expect(screen.getByText('Welcome Back')).toBeTruthy();
      expect(screen.getByText('Sign in to your account')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByText('Forgot Password?')).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
      expect(screen.getByText("Don't have an account? ")).toBeTruthy();
      expect(screen.getByText('Sign Up')).toBeTruthy();
    });

    it('should render input fields with correct placeholders', () => {
      renderLoginScreen();

      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should validate email format correctly', async () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      // Enter invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('should validate password length requirements', async () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      // Enter short password
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('should validate required fields', async () => {
      renderLoginScreen();

      const submitButton = screen.getByText('Sign In');

      // Submit without filling fields
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
      });
    });

    it('should clear form errors when user corrects input', async () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByText('Sign In');

      // First, trigger validation error
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeTruthy();
      });

      // Then correct the input
      fireEvent.changeText(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).toBeNull();
      });
    });

    it('should display appropriate error messages for invalid inputs', async () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      // Test multiple validation errors
      fireEvent.changeText(emailInput, 'not-an-email');
      fireEvent.changeText(passwordInput, '12');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct credentials when form is valid', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should disable submit button during API calls', async () => {
      // Make signIn promise that we can control
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValue(signInPromise);

      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Signing In...')).toBeTruthy();
      });

      // Resolve the promise
      resolveSignIn!({ error: null });

      // Button should return to normal state
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeTruthy();
      });
    });

    it('should handle authentication errors with user feedback', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      const authError = { message: 'Invalid email or password' };
      mockSignIn.mockResolvedValue({ error: authError });

      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Login Error', 'Invalid email or password');
      });

      mockAlert.mockRestore();
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSignIn.mockRejectedValue(new Error('Network error'));

      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Login Error', 'An unexpected error occurred');
      });

      mockAlert.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password screen when link is pressed', () => {
      renderLoginScreen();

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      fireEvent.press(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('should navigate to register screen when sign up link is pressed', () => {
      renderLoginScreen();

      const signUpLink = screen.getByText('Sign Up');
      fireEvent.press(signUpLink);

      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('Input Behavior', () => {
    it('should have correct input properties', () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      // Check email input properties
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);

      // Check password input properties
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);
    });

    it('should update input values when user types', () => {
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state during loading', async () => {
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignIn.mockReturnValue(signInPromise);

      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      // Values should be maintained during loading
      await waitFor(() => {
        expect(emailInput.props.value).toBe('test@example.com');
        expect(passwordInput.props.value).toBe('password123');
      });

      resolveSignIn!({ error: null });
    });

    it('should reset loading state after form submission completes', async () => {
      mockSignIn.mockResolvedValue({ error: null });
      renderLoginScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeTruthy();
      });
    });
  });
});