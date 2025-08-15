import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { razorpayService } from '../services/razorpayService';

interface TopUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (amount: number, transactionId?: string) => void;
}

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export const TopUpModal: React.FC<TopUpModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    setConfigured(razorpayService.isConfigured());
  }, []);

  const getAmount = (): number => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const isValidAmount = (): boolean => {
    const amount = getAmount();
    return amount >= 1 && amount <= 100000; // Minimum ₹1, Maximum ₹100,000
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (text: string) => {
    // Only allow numbers and decimal point
    const numericText = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericText.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setCustomAmount(numericText);
    setSelectedAmount(null);
  };

  const handleTopUp = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    if (!configured) {
      Alert.alert(
        'Configuration Error',
        'Payment service is not properly configured. Please contact support.'
      );
      return;
    }

    if (!isValidAmount()) {
      Alert.alert(
        'Invalid Amount',
        'Please enter an amount between ₹1 and ₹100,000'
      );
      return;
    }

    setLoading(true);
    
    try {
      const amount = getAmount();
      
      const result = await razorpayService.processWalletTopUp(
        user.id,
        amount,
        user.email || undefined,
        user.phone || undefined
      );

      if (result.success) {
        Alert.alert(
          'Payment Successful!',
          `₹${amount.toFixed(2)} has been added to your wallet.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(amount, result.transactionId);
                handleClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Payment Failed',
          result.error || 'Something went wrong. Please try again.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Top-up error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedAmount(null);
      setCustomAmount('');
      onClose();
    }
  };

  const renderAmountButton = (amount: number) => (
    <TouchableOpacity
      key={amount}
      style={[
        styles.amountButton,
        selectedAmount === amount && styles.selectedAmountButton,
      ]}
      onPress={() => handleAmountSelect(amount)}
    >
      <Text
        style={[
          styles.amountButtonText,
          selectedAmount === amount && styles.selectedAmountButtonText,
        ]}
      >
        ₹{amount}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Funds</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          {!configured && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Payment service is not configured. Please check your environment settings.
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
            <View style={styles.amountGrid}>
              {PRESET_AMOUNTS.map(renderAmountButton)}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Custom Amount</Text>
            <View style={styles.customAmountContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[
                  styles.customAmountInput,
                  customAmount && styles.activeCustomAmountInput,
                ]}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
            <Text style={styles.amountLimits}>
              Minimum: ₹1 • Maximum: ₹100,000
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount to add:</Text>
                <Text style={styles.summaryValue}>₹{getAmount().toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processing fee:</Text>
                <Text style={styles.summaryValue}>₹0.00</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>₹{getAmount().toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>💳 Secure Payment</Text>
            <Text style={styles.infoText}>
              Your payment is processed securely through Razorpay. We don't store your card details.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>⚡ Instant Top-up</Text>
            <Text style={styles.infoText}>
              Funds will be added to your wallet immediately after successful payment.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.payButton,
              (!isValidAmount() || !configured || loading) && styles.payButtonDisabled,
            ]}
            onPress={handleTopUp}
            disabled={!isValidAmount() || !configured || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ₹{getAmount().toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amountButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedAmountButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  amountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedAmountButtonText: {
    color: '#fff',
  },
  customAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 12,
  },
  activeCustomAmountInput: {
    color: '#4CAF50',
  },
  amountLimits: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 8,
    paddingTop: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  infoSection: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});