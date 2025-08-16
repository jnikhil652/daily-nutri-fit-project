import { supabase } from './supabase';
import type { ShoppingCart, ShoppingCartWithFruit, Fruit } from './supabase';

export class CartService {
  /**
   * Add item to cart or update quantity if item exists
   */
  static async addToCart(fruitId: string, quantity: number = 1): Promise<ShoppingCart> {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get fruit details for price
    const { data: fruit, error: fruitError } = await supabase
      .from('fruits')
      .select('price')
      .eq('id', fruitId)
      .single();
    
    if (fruitError || !fruit) {
      throw new Error('Fruit not found');
    }

    // Check if item already exists in cart
    const { data: existingItem, error: existingError } = await supabase
      .from('shopping_carts')
      .select('*')
      .eq('user_id', user.id)
      .eq('fruit_id', fruitId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      throw new Error('Failed to check cart');
    }

    if (existingItem) {
      // Update existing item quantity
      const { data, error } = await supabase
        .from('shopping_carts')
        .update({ 
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) throw new Error('Failed to update cart item');
      return data;
    } else {
      // Add new item to cart
      const { data, error } = await supabase
        .from('shopping_carts')
        .insert({
          user_id: user.id,
          fruit_id: fruitId,
          quantity,
          price_per_unit: fruit.price
        })
        .select()
        .single();

      if (error) throw new Error('Failed to add item to cart');
      return data;
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(cartItemId: string, quantity: number): Promise<ShoppingCart> {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const { data, error } = await supabase
      .from('shopping_carts')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartItemId)
      .select()
      .single();

    if (error) throw new Error('Failed to update cart item');
    return data;
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(cartItemId: string): Promise<void> {
    const { error } = await supabase
      .from('shopping_carts')
      .delete()
      .eq('id', cartItemId);

    if (error) throw new Error('Failed to remove item from cart');
  }

  /**
   * Get current user's cart with fruit details
   */
  static async getCart(): Promise<ShoppingCartWithFruit[]> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('shopping_carts')
      .select(`
        *,
        fruit:fruits (
          id,
          name,
          description,
          price,
          unit,
          image_url,
          is_available
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error loading cart:', error);
      throw new Error(`Failed to load cart: ${error.message}`);
    }
    return data as ShoppingCartWithFruit[];
  }

  /**
   * Get cart total (subtotal)
   */
  static async getCartTotal(): Promise<number> {
    const cartItems = await this.getCart();
    return cartItems.reduce((total, item) => total + (item.quantity * item.price_per_unit), 0);
  }

  /**
   * Get cart item count
   */
  static async getCartItemCount(): Promise<number> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return 0;
    }

    const { data, error } = await supabase
      .from('shopping_carts')
      .select('quantity')
      .eq('user_id', user.id);

    if (error) return 0;
    return data.reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Clear entire cart
   */
  static async clearCart(): Promise<void> {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('shopping_carts')
      .delete()
      .eq('user_id', user.id);

    if (error) throw new Error('Failed to clear cart');
  }

  /**
   * Subscribe to cart changes for real-time updates
   */
  static subscribeToCartChanges(
    userId: string,
    onCartChange: (payload: any) => void
  ) {
    return supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_carts',
          filter: `user_id=eq.${userId}`
        },
        onCartChange
      )
      .subscribe();
  }
}