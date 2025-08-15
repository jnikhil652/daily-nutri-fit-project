import { supabase } from './supabase';
import type { Order, OrderWithDetails, OrderItem, DeliveryTimeSlot } from './supabase';

export class OrderService {
  /**
   * Get available delivery time slots
   */
  static async getDeliveryTimeSlots(): Promise<DeliveryTimeSlot[]> {
    const { data, error } = await supabase
      .from('delivery_time_slots')
      .select('*')
      .eq('is_active', true)
      .order('start_time');

    if (error) throw new Error('Failed to load delivery time slots');
    return data;
  }

  /**
   * Create order from current user's cart
   */
  static async createOrderFromCart(
    deliveryAddressId: string,
    deliveryDate: string,
    deliveryTimeSlot: string,
    deliveryInstructions?: string
  ): Promise<string> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Call the database function to create order from cart
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      p_user_id: user.id,
      p_delivery_address_id: deliveryAddressId,
      p_delivery_date: deliveryDate,
      p_delivery_time_slot: deliveryTimeSlot,
      p_delivery_instructions: deliveryInstructions || null
    });

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data; // Returns the order ID
  }

  /**
   * Get user's orders with details
   */
  static async getUserOrders(): Promise<OrderWithDetails[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        ),
        delivery_address:delivery_addresses (
          id,
          title,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to load orders');
    return data as OrderWithDetails[];
  }

  /**
   * Get a specific order by ID
   */
  static async getOrderById(orderId: string): Promise<OrderWithDetails> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        ),
        delivery_address:delivery_addresses (
          id,
          title,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error('Failed to load order');
    return data as OrderWithDetails;
  }

  /**
   * Get order by order number
   */
  static async getOrderByNumber(orderNumber: string): Promise<OrderWithDetails> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *
        ),
        delivery_address:delivery_addresses (
          id,
          title,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code
        )
      `)
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single();

    if (error) throw new Error('Failed to load order');
    return data as OrderWithDetails;
  }

  /**
   * Calculate order totals for preview (without creating order)
   */
  static async calculateOrderTotals(): Promise<{
    subtotal: number;
    deliveryFee: number;
    taxAmount: number;
    totalAmount: number;
  }> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get cart items and calculate subtotal
    const { data: cartItems, error: cartError } = await supabase
      .from('shopping_carts')
      .select('quantity, price_per_unit')
      .eq('user_id', user.id);

    if (cartError) throw new Error('Failed to load cart');

    const subtotal = cartItems.reduce(
      (total, item) => total + (item.quantity * item.price_per_unit), 
      0
    );

    // Constants (should match database function)
    const deliveryFee = 5.99;
    const taxRate = 0.0875; // 8.75%
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    const totalAmount = subtotal + deliveryFee + taxAmount;

    return {
      subtotal,
      deliveryFee,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Check if delivery date and time slot are available
   */
  static async isDeliverySlotAvailable(
    date: string,
    timeSlot: string
  ): Promise<boolean> {
    // Get the time slot configuration
    const { data: slot, error: slotError } = await supabase
      .from('delivery_time_slots')
      .select('max_orders_per_slot')
      .eq('name', timeSlot)
      .eq('is_active', true)
      .single();

    if (slotError || !slot) return false;

    // Count existing orders for this date and time slot
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('requested_delivery_date', date)
      .eq('delivery_time_slot', timeSlot)
      .in('status', ['pending', 'confirmed', 'processing']);

    if (countError) return false;

    return (count || 0) < slot.max_orders_per_slot;
  }

  /**
   * Subscribe to order status changes
   */
  static subscribeToOrderChanges(
    userId: string,
    onOrderChange: (payload: any) => void
  ) {
    return supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`
        },
        onOrderChange
      )
      .subscribe();
  }
}