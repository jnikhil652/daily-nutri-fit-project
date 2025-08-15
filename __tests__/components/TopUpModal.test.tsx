import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { TopUpModal } from '../../components/TopUpModal';
import { useAuth } from '../../contexts/AuthContext';
import { razorpayService } from '../../services/razorpayService';

// Mock dependencies
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/razorpayService');
jest.spyOn(Alert, 'alert');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockRazorpayService = razorpayService as jest.Mocked<typeof razorpayService>;

describe('TopUpModal', () => {
  const mockUser = {
    id: 'user_123',
    email: 'test@example.com',
    phone: '9876543210',
  };

  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
    mockRazorpayService.isConfigured.mockReturnValue(true);
  });

  it('should render correctly when visible', () => {
    const { getByText, getByPlaceholderText } = render(<TopUpModal {...defaultProps} />);

    expect(getByText('Add Funds')).toBeTruthy();
    expect(getByText('Quick Select')).toBeTruthy();
    expect(getByText('Custom Amount')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
  });

  it('should show warning when Razorpay is not configured', () => {
    mockRazorpayService.isConfigured.mockReturnValue(false);
    
    const { getByText } = render(<TopUpModal {...defaultProps} />);

    expect(getByText(/Payment service is not configured/)).toBeTruthy();
  });

  it('should handle preset amount selection', () => {
    const { getByText } = render(<TopUpModal {...defaultProps} />);

    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);

    expect(getByText('Pay ₹25.00')).toBeTruthy();
  });

  it('should handle custom amount input', () => {
    const { getByPlaceholderText, getByText } = render(<TopUpModal {...defaultProps} />);

    const customInput = getByPlaceholderText('0.00');
    fireEvent.changeText(customInput, '150');

    expect(getByText('Pay ₹150.00')).toBeTruthy();
  });

  it('should validate amount input - only allow numeric values', () => {
    const { getByPlaceholderText } = render(<TopUpModal {...defaultProps} />);

    const customInput = getByPlaceholderText('0.00');
    
    // Try to enter non-numeric characters
    fireEvent.changeText(customInput, 'abc123');
    
    // Should only keep numeric part
    expect(customInput.props.value).toBe('123');
  });

  it('should limit decimal places to 2', () => {
    const { getByPlaceholderText } = render(<TopUpModal {...defaultProps} />);

    const customInput = getByPlaceholderText('0.00');
    
    // Try to enter more than 2 decimal places
    fireEvent.changeText(customInput, '100.123');
    
    // Should be limited to 2 decimal places
    expect(customInput.props.value).toBe('100.12');
  });

  it('should disable pay button for invalid amounts', () => {
    const { getByPlaceholderText, getByText } = render(<TopUpModal {...defaultProps} />);

    const customInput = getByPlaceholderText('0.00');
    const payButton = getByText('Pay ₹0.00');

    // Test amount below minimum
    fireEvent.changeText(customInput, '0.5');
    expect(payButton).toBeDisabled();

    // Test amount above maximum
    fireEvent.changeText(customInput, '200000');
    expect(payButton).toBeDisabled();
  });

  it('should process payment successfully', async () => {
    mockRazorpayService.processWalletTopUp.mockResolvedValue({
      success: true,
      paymentId: 'pay_123',
      transactionId: 'txn_123',
    });

    const { getByText } = render(<TopUpModal {...defaultProps} />);

    // Select amount
    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);

    // Press pay button
    const payButton = getByText('Pay ₹25.00');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(mockRazorpayService.processWalletTopUp).toHaveBeenCalledWith(
        'user_123',
        25,
        'test@example.com',
        '9876543210'
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Payment Successful!',
      '₹25.00 has been added to your wallet.',
      expect.any(Array)
    );
  });

  it('should handle payment failure', async () => {
    mockRazorpayService.processWalletTopUp.mockResolvedValue({
      success: false,
      error: 'Payment was cancelled by user',
      errorCode: 'user_cancelled',
    });

    const { getByText } = render(<TopUpModal {...defaultProps} />);

    // Select amount
    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);

    // Press pay button
    const payButton = getByText('Pay ₹25.00');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Failed',
        'Payment was cancelled by user',
        expect.any(Array)
      );
    });
  });

  it('should call onClose when cancel button is pressed', () => {
    const { getByText } = render(<TopUpModal {...defaultProps} />);

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onSuccess after successful payment', async () => {
    mockRazorpayService.processWalletTopUp.mockResolvedValue({
      success: true,
      paymentId: 'pay_123',
      transactionId: 'txn_123',
    });

    const { getByText } = render(<TopUpModal {...defaultProps} />);

    // Select amount
    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);

    // Press pay button
    const payButton = getByText('Pay ₹25.00');
    fireEvent.press(payButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Payment Successful!',
        '₹25.00 has been added to your wallet.',
        expect.arrayContaining([
          expect.objectContaining({
            text: 'OK',
            onPress: expect.any(Function),
          }),
        ])
      );
    });

    // Simulate pressing OK in the alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const okButton = alertCall[2].find((button: any) => button.text === 'OK');
    okButton.onPress();

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(25, 'txn_123');
  });

  it('should show error when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null } as any);

    const { getByText } = render(<TopUpModal {...defaultProps} />);

    // Select amount
    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);

    // Press pay button
    const payButton = getByText('Pay ₹25.00');
    fireEvent.press(payButton);

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please login to continue');
  });

  it('should show configuration error when Razorpay is not configured', () => {
    mockRazorpayService.isConfigured.mockReturnValue(false);

    const { getByText } = render(<TopUpModal {...defaultProps} />);

    // Try to select amount - button should be disabled
    const payButton = getByText('Pay ₹0.00');
    expect(payButton).toBeDisabled();
  });

  it('should reset state when modal is closed and reopened', () => {
    const { getByText, getByPlaceholderText, rerender } = render(
      <TopUpModal {...defaultProps} />
    );

    // Select amount and enter custom amount
    const amount25Button = getByText('₹25');
    fireEvent.press(amount25Button);
    
    const customInput = getByPlaceholderText('0.00');
    fireEvent.changeText(customInput, '100');

    // Close modal
    rerender(<TopUpModal {...defaultProps} visible={false} />);
    
    // Reopen modal
    rerender(<TopUpModal {...defaultProps} visible={true} />);

    // State should be reset
    expect(getByText('Pay ₹0.00')).toBeTruthy();
  });
});