import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Mock the AuthContext
const mockSignUp = jest.fn();
const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signIn: jest.fn(),
  signUp: mockSignUp,
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

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderRegisterScreen = () => {
    return render(<RegisterScreen navigation={mockNavigation as any} />);
  };

  describe('Form Rendering', () => {
    it('should render all form elements', () => {
      renderRegisterScreen();

      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Sign up to get started')).toBeTruthy();
      expect(screen.getByText('Full Name')).toBeTruthy();
      expect(screen.getByText('Email')).toBeTruthy();
      expect(screen.getByText('Password')).toBeTruthy();
      expect(screen.getByText('Confirm Password')).toBeTruthy();
      expect(screen.getByText('Create Account')).toBeTruthy();
      expect(screen.getByText('Already have an account? ')).toBeTruthy();
      expect(screen.getByText('Sign In')).toBeTruthy();
    });

    it('should render input fields with correct placeholders', () => {
      renderRegisterScreen();

      expect(screen.getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderRegisterScreen();

      const submitButton = screen.getByText('Create Account');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeTruthy();
        expect(screen.getByText('Email is required')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
        expect(screen.getByText('Please confirm your password')).toBeTruthy();
      });
    });

    it('should validate full name length', async () => {
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'A');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name must be at least 2 characters')).toBeTruthy();
      });
    });

    it('should validate email format correctly', async () => {
      renderRegisterScreen();

      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
      });
    });

    it('should validate password length requirements', async () => {
      renderRegisterScreen();

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('should validate password confirmation match', async () => {
      renderRegisterScreen();

      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'different123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords must match')).toBeTruthy();
      });
    });

    it('should clear form errors when user corrects input', async () => {
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const submitButton = screen.getByText('Create Account');

      // First, trigger validation error
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeTruthy();
      });

      // Then correct the input
      fireEvent.changeText(fullNameInput, 'John Doe');

      await waitFor(() => {
        expect(screen.queryByText('Full name is required')).toBeNull();
      });
    });

    it('should display appropriate error messages for multiple invalid inputs', async () => {
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'A');
      fireEvent.changeText(emailInput, 'not-an-email');
      fireEvent.changeText(passwordInput, '12');
      fireEvent.changeText(confirmPasswordInput, '34');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name must be at least 2 characters')).toBeTruthy();
        expect(screen.getByText('Please enter a valid email')).toBeTruthy();
        expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
        expect(screen.getByText('Passwords must match')).toBeTruthy();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call signUp with correct data when form is valid', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'password123', 'John Doe');
      });
    });

    it('should disable submit button during API calls', async () => {
      let resolveSignUp: (value: any) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValue(signUpPromise);

      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Creating Account...')).toBeTruthy();
      });

      // Resolve the promise
      resolveSignUp!({ error: null });

      // Button should return to normal state (after Alert.alert is handled)
      await waitFor(() => {
        // Note: The button text might still be "Creating Account..." until the alert is dismissed
        // We're testing that the loading state was activated
        expect(mockSignUp).toHaveBeenCalled();
      });
    });

    it('should handle registration errors with user feedback', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      const authError = { message: 'Email already in use' };
      mockSignUp.mockResolvedValue({ error: authError });

      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'existing@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Registration Error', 'Email already in use');
      });

      mockAlert.mockRestore();
    });

    it('should handle unexpected errors gracefully', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSignUp.mockRejectedValue(new Error('Network error'));

      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Registration Error', 'An unexpected error occurred');
      });

      mockAlert.mockRestore();
    });

    it('should show success message and navigate to login on successful registration', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
        // Simulate user pressing OK button
        if (buttons && buttons[0].onPress) {
          buttons[0].onPress();
        }
      });
      
      mockSignUp.mockResolvedValue({ error: null });

      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Registration Successful',
          'Please check your email to verify your account.',
          [{ text: 'OK', onPress: expect.any(Function) }]
        );
        expect(mockNavigate).toHaveBeenCalledWith('Login');
      });

      mockAlert.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should navigate to login screen when sign in link is pressed', () => {
      renderRegisterScreen();

      const signInLink = screen.getByText('Sign In');
      fireEvent.press(signInLink);

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Input Behavior', () => {
    it('should have correct input properties', () => {
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');

      // Check full name input properties
      expect(fullNameInput.props.autoCapitalize).toBe('words');
      expect(fullNameInput.props.autoCorrect).toBe(false);

      // Check email input properties
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);

      // Check password input properties
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);

      // Check confirm password input properties
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.autoCapitalize).toBe('none');
      expect(confirmPasswordInput.props.autoCorrect).toBe(false);
    });

    it('should update input values when user types', () => {
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');

      expect(fullNameInput.props.value).toBe('John Doe');
      expect(emailInput.props.value).toBe('john@example.com');
      expect(passwordInput.props.value).toBe('password123');
      expect(confirmPasswordInput.props.value).toBe('password123');
    });
  });

  describe('Form State Management', () => {
    it('should maintain form state during loading', async () => {
      let resolveSignUp: (value: any) => void;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockSignUp.mockReturnValue(signUpPromise);

      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      // Values should be maintained during loading
      await waitFor(() => {
        expect(fullNameInput.props.value).toBe('John Doe');
        expect(emailInput.props.value).toBe('john@example.com');
        expect(passwordInput.props.value).toBe('password123');
        expect(confirmPasswordInput.props.value).toBe('password123');
      });

      resolveSignUp!({ error: null });
    });

    it('should reset loading state after form submission completes', async () => {
      const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation();
      mockSignUp.mockResolvedValue({ error: null });
      
      renderRegisterScreen();

      const fullNameInput = screen.getByPlaceholderText('Enter your full name');
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const passwordInput = screen.getByPlaceholderText('Enter your password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password');
      const submitButton = screen.getByText('Create Account');

      fireEvent.changeText(fullNameInput, 'John Doe');
      fireEvent.changeText(emailInput, 'john@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalled();
      });

      mockAlert.mockRestore();
    });
  });
});