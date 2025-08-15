import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartService } from '../lib/cart';
import { useAuth } from './AuthContext';
import type { ShoppingCartWithFruit } from '../lib/supabase';

interface CartContextType {
  cartItems: ShoppingCartWithFruit[];
  cartItemCount: number;
  cartTotal: number;
  isLoading: boolean;
  addToCart: (fruitId: string, quantity?: number) => Promise<void>;
  updateCartItem: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cartItems, setCartItems] = useState<ShoppingCartWithFruit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Calculate derived values
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + (item.quantity * item.price_per_unit), 0);

  // Load cart from API and AsyncStorage
  const loadCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    setIsLoading(true);
    try {
      // Try to load from API first
      const apiCart = await CartService.getCart();
      setCartItems(apiCart);
      
      // Save to AsyncStorage for offline access
      await AsyncStorage.setItem(`cart_${user.id}`, JSON.stringify(apiCart));
    } catch (error) {
      console.error('Failed to load cart from API:', error);
      
      // Fallback to AsyncStorage
      try {
        const cachedCart = await AsyncStorage.getItem(`cart_${user.id}`);
        if (cachedCart) {
          setCartItems(JSON.parse(cachedCart));
        }
      } catch (cacheError) {
        console.error('Failed to load cart from cache:', cacheError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save cart to AsyncStorage
  const saveCartToStorage = async (items: ShoppingCartWithFruit[]) => {
    if (user) {
      try {
        await AsyncStorage.setItem(`cart_${user.id}`, JSON.stringify(items));
      } catch (error) {
        console.error('Failed to save cart to storage:', error);
      }
    }
  };

  // Add item to cart with optimistic updates
  const addToCart = async (fruitId: string, quantity: number = 1) => {
    if (!user) throw new Error('User not authenticated');

    setIsLoading(true);
    try {
      await CartService.addToCart(fruitId, quantity);
      await loadCart(); // Refresh cart after adding
    } catch (error) {
      console.error('Failed to add to cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (cartItemId: string, quantity: number) => {
    setIsLoading(true);
    try {
      await CartService.updateCartItem(cartItemId, quantity);
      
      // Optimistic update
      const updatedItems = cartItems.map(item =>
        item.id === cartItemId ? { ...item, quantity } : item
      );
      setCartItems(updatedItems);
      await saveCartToStorage(updatedItems);
    } catch (error) {
      console.error('Failed to update cart item:', error);
      await loadCart(); // Refresh on error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartItemId: string) => {
    setIsLoading(true);
    try {
      await CartService.removeFromCart(cartItemId);
      
      // Optimistic update
      const updatedItems = cartItems.filter(item => item.id !== cartItemId);
      setCartItems(updatedItems);
      await saveCartToStorage(updatedItems);
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      await loadCart(); // Refresh on error
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setIsLoading(true);
    try {
      await CartService.clearCart();
      setCartItems([]);
      if (user) {
        await AsyncStorage.removeItem(`cart_${user.id}`);
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh cart from API
  const refreshCart = async () => {
    await loadCart();
  };

  // Load cart when user changes or component mounts
  useEffect(() => {
    loadCart();
  }, [user]);

  // Set up real-time cart updates
  useEffect(() => {
    if (!user) return;

    const subscription = CartService.subscribeToCartChanges(user.id, (payload) => {
      console.log('Cart changed:', payload);
      loadCart(); // Refresh cart on changes
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const value: CartContextType = {
    cartItems,
    cartItemCount,
    cartTotal,
    isLoading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}