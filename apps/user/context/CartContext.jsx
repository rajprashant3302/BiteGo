'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  const user = {
    name: session?.user?.name || "BiteGo User",
    email: session?.user?.email || "No email provided",
    phone: session?.user?.phone || "Update your phone number",
    profilePic: session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'User'}`,
    role: session?.user?.role || "User",
  };

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('quick');
  const [showAddToast, setShowAddToast] = useState(false);

  // 1. Fetch Saved Cart from Redis
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      if (status === 'unauthenticated') setIsLoading(false);
      return;
    }

    const fetchSavedCart = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/cart/${session.user.email}`);
        if (res.ok) {
          const data = await res.json();
          setCartItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load cart from Redis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedCart();
  }, [session?.user?.email, status, API_BASE]);

  // 2. Sync to Redis (Debounced)
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email || isLoading) return;

    const syncTimeout = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/api/cart/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: session.user.email, 
            items: cartItems 
          }),
        });
      } catch (err) {
        console.error("Redis Sync Failed:", err);
      }
    }, 1000);

    return () => clearTimeout(syncTimeout);
  }, [cartItems, session?.user?.email, status, isLoading, API_BASE]);

  // ── CART ACTIONS ────────────────────────────────────
  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ItemID === item.ItemID);
      if (existing) {
        return prev.map(i => 
          i.ItemID === item.ItemID ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      // Store the full item, which now includes DiscountedPrice from the backend
      return [...prev, { ...item, quantity: 1 }];
    });
    setShowAddToast(true);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ItemID === itemId);
      if (existing?.quantity > 1) {
        return prev.map(i => 
          i.ItemID === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.ItemID !== itemId);
    });
  };

  const clearCart = async () => {
    setCartItems([]);
    if (status === 'authenticated' && session?.user?.email) {
      try {
        await fetch(`${API_BASE}/api/cart/${session.user.email}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error("Failed to clear Redis cart:", err);
      }
    }
  };

  // ── CALCULATIONS ────────────────────────────────────
  
  // Total number of individual items
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Subtotal using DiscountedPrice if it exists, otherwise use base Price
  const cartSubtotal = cartItems.reduce((acc, item) => {
    const activePrice = item.DiscountedPrice !== undefined ? parseFloat(item.DiscountedPrice) : parseFloat(item.Price);
    return acc + (activePrice * item.quantity);
  }, 0);

  // Added Savings calculation: Original Price - Discounted Price
  const totalSavings = cartItems.reduce((acc, item) => {
    if (item.DiscountedPrice !== undefined && item.DiscountedPrice < item.Price) {
      const saving = (parseFloat(item.Price) - parseFloat(item.DiscountedPrice)) * item.quantity;
      return acc + saving;
    }
    return acc;
  }, 0);

  const deliveryFee = deliveryMode === 'quick' ? 40 : 0; // Using 40 as a standard delivery charge
  const cartTotal = cartSubtotal + deliveryFee;

  return (
    <CartContext.Provider value={{
      user,
      status,
      searchQuery, setSearchQuery,
      cartItems, cartCount, cartSubtotal, cartTotal, totalSavings, deliveryFee,
      isCartOpen, setIsCartOpen,
      addToCart, removeFromCart, clearCart,
      deliveryMode, setDeliveryMode,
      showAddToast, setShowAddToast
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};