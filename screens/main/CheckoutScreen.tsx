import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { DeliveryAddress, DeliveryTimeSlot } from '../../lib/supabase';
import { MainStackParamList } from '../../types/navigation';

type CheckoutNavigationProp = NativeStackNavigationProp<MainStackParamList, 'Checkout'>;

interface OrderSummary {
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;
}

export function CheckoutScreen() {
  const navigation = useNavigation<CheckoutNavigationProp>();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
  const [timeSlots, setTimeSlots] = useState<DeliveryTimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Calculate order summary
  const orderSummary: OrderSummary = {
    subtotal: cartTotal,
    deliveryFee: 5.99,
    taxAmount: Math.round(cartTotal * 0.0875 * 100) / 100, // 8.75% tax
    total: 0,
  };
  orderSummary.total = orderSummary.subtotal + orderSummary.deliveryFee + orderSummary.taxAmount;

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadAddresses(),
        loadTimeSlots(),
        loadWalletBalance(),
      ]);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      Alert.alert('Error', 'Failed to load checkout information');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    const { data, error } = await supabase
      .from('delivery_addresses')
      .select('*')
      .eq('user_id', user!.id)
      .order('is_primary', { ascending: false });

    if (error) throw error;
    
    setAddresses(data || []);
    if (data && data.length > 0) {
      const primaryAddress = data.find(addr => addr.is_primary) || data[0];
      setSelectedAddress(primaryAddress);
    }
  };

  const loadTimeSlots = async () => {
    const { data, error } = await supabase
      .from('delivery_time_slots')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    if (error) throw error;
    setTimeSlots(data || []);
  };

  const loadWalletBalance = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user!.id)
      .single();

    if (error) throw error;
    setWalletBalance(data?.balance || 0);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select a delivery address');
      return;
    }
    
    if (!selectedTimeSlot) {
      Alert.alert('Error', 'Please select a delivery time slot');
      return;
    }
    
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a delivery date');
      return;
    }
    
    if (walletBalance < orderSummary.total) {
      Alert.alert(
        'Insufficient Balance',
        `Your wallet balance ($${walletBalance.toFixed(2)}) is insufficient for this order ($${orderSummary.total.toFixed(2)}). Please top up your wallet first.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet' as never) },
        ]
      );
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Call the create_order_from_cart function
      const { data, error } = await supabase.rpc('create_order_from_cart', {
        p_user_id: user!.id,
        p_delivery_address_id: selectedAddress.id,
        p_delivery_date: selectedDate,
        p_delivery_time_slot: selectedTimeSlot,
        p_delivery_instructions: deliveryInstructions || null,
      });

      if (error) throw error;

      // Deduct from wallet
      const { error: walletError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user!.id,
        p_amount: -orderSummary.total,
        p_type: 'payment',
        p_description: `Order payment for order ${data}`,
        p_reference_id: data,
      });

      if (walletError) throw walletError;

      // Clear cart and navigate to confirmation
      await clearCart();
      
      Alert.alert(
        'Order Placed Successfully!',
        `Your order has been placed and will be delivered on ${selectedDate} during ${selectedTimeSlot}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to your cart before checking out</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('FruitCatalog' as never)}
          >
            <Text style={styles.shopButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.itemName}>{item.fruit?.name}</Text>
              <Text style={styles.itemDetails}>
                {item.quantity} × ${item.price_per_unit.toFixed(2)} = ${(item.quantity * item.price_per_unit).toFixed(2)}
              </Text>
            </View>
          ))}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${orderSummary.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>${orderSummary.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax:</Text>
            <Text style={styles.summaryValue}>${orderSummary.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${orderSummary.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          {addresses.length === 0 ? (
            <Text style={styles.noAddressText}>No delivery addresses found. Please add one in your profile.</Text>
          ) : (
            addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.addressCard,
                  selectedAddress?.id === address.id && styles.selectedCard,
                ]}
                onPress={() => setSelectedAddress(address)}
              >
                <Text style={styles.addressTitle}>{address.title}</Text>
                <Text style={styles.addressText}>
                  {address.address_line_1}
                  {address.address_line_2 && `, ${address.address_line_2}`}
                </Text>
                <Text style={styles.addressText}>
                  {address.city}, {address.state} {address.postal_code}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Delivery Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Schedule</Text>
          
          <Text style={styles.fieldLabel}>Delivery Date:</Text>
          <Text style={styles.dateText}>{selectedDate}</Text>
          
          <Text style={styles.fieldLabel}>Time Slot:</Text>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.timeSlotCard,
                selectedTimeSlot === slot.name && styles.selectedCard,
              ]}
              onPress={() => setSelectedTimeSlot(slot.name)}
            >
              <Text style={styles.timeSlotText}>{slot.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet Balance:</Text>
            <Text style={[styles.walletBalance, walletBalance < orderSummary.total && styles.insufficientBalance]}>
              ${walletBalance.toFixed(2)}
            </Text>
          </View>
          {walletBalance < orderSummary.total && (
            <Text style={styles.warningText}>
              Insufficient balance. Please top up your wallet.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (isPlacingOrder || walletBalance < orderSummary.total || !selectedAddress || !selectedTimeSlot) && styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || walletBalance < orderSummary.total || !selectedAddress || !selectedTimeSlot}
        >
          <Text style={styles.placeOrderButtonText}>
            {isPlacingOrder ? 'Placing Order...' : `Place Order - $${orderSummary.total.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  addressCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noAddressText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  timeSlotCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSlotText: {
    fontSize: 16,
    color: '#333',
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletLabel: {
    fontSize: 16,
    color: '#333',
  },
  walletBalance: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  insufficientBalance: {
    color: '#f44336',
  },
  warningText: {
    fontSize: 14,
    color: '#f44336',
    marginTop: 8,
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  placeOrderButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});