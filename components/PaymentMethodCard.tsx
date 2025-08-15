import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { PaymentMethod } from '../lib/supabase';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  paymentMethod,
  onSetDefault,
  onDelete,
  showActions = true,
}) => {
  const getCardIcon = (brand: string | null) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  const handleSetDefault = () => {
    if (onSetDefault && !paymentMethod.is_default) {
      Alert.alert(
        'Set as Default',
        'Set this payment method as your default?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Default',
            onPress: () => onSetDefault(paymentMethod.id),
          },
        ]
      );
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        'Delete Payment Method',
        'Are you sure you want to delete this payment method?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(paymentMethod.id),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, paymentMethod.is_default && styles.defaultContainer]}>
      <View style={styles.cardInfo}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{getCardIcon(paymentMethod.card_brand)}</Text>
          <View style={styles.cardDetails}>
            <Text style={styles.cardBrand}>
              {paymentMethod.card_brand?.toUpperCase() || 'CARD'} •••• {paymentMethod.card_last4}
            </Text>
            <Text style={styles.cardExpiry}>
              Expires {paymentMethod.card_exp_month?.toString().padStart(2, '0')}/{paymentMethod.card_exp_year}
            </Text>
          </View>
          {paymentMethod.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>DEFAULT</Text>
            </View>
          )}
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          {!paymentMethod.is_default && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSetDefault}
            >
              <Text style={styles.actionButtonText}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultContainer: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  cardInfo: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  deleteButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  deleteButtonText: {
    color: '#dc2626',
  },
});