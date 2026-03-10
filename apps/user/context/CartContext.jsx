'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
  const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:5000";

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState('quick');
  const [showAddToast, setShowAddToast] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMode, setPaymentMode] = useState('online');
  const [useWallet, setUseWallet] = useState(false);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const [userProfile, setUserProfile] = useState(null);


  // ── 1. INITIAL LOAD (Cart & Default Address) ───────────────────
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsLoading(false);
      return;
    }

    if (status !== 'authenticated' || !session?.user?.email) return;

    const loadInitialData = async () => {
      try {
        const [cartRes, addrRes ,profileRes] = await Promise.all([
          fetch(`${API_BASE}/api/cart/${session.user.email}`),
          fetch(`${AUTH_BASE}/api/auth/addresses/${session.user.id}`),
          fetch(`${AUTH_BASE}/api/auth/profile/${session.user.id}`)
        ]);

        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCartItems(Array.isArray(cartData) ? cartData : []);
        }

        if (addrRes.ok) {
          const addrData = await addrRes.json();
          const defaultAddr = addrData.find(addr => addr.IsDefault) || addrData[0];
          setSelectedAddress(defaultAddr || null);
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserProfile(profileData);
        }
      } catch (err) {
        console.error("Initialization Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [session?.user?.email, session?.user?.id, status, API_BASE, AUTH_BASE]);


// ── 2. REFINED USER OBJECT (Using Backend Data) ────────────────
  const user = useMemo(() => {
    // Fallback to session while profile is loading
    return {
      id: userProfile?.UserID || session?.user?.id,
      name: userProfile?.Name || session?.user?.name || "BiteGo User",
      email: userProfile?.Email || session?.user?.email,
      phone: userProfile?.Phone || "Add phone number",
      profilePic: userProfile?.ProfilePicURL || session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name}`,
      role: userProfile?.Role || "User",
      walletBalance: parseFloat(userProfile?.WalletBalance || 0),
    };
  }, [userProfile, session]);


  // ── 2. SYNC TO REDIS (Debounced) ───────────────────────────────
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

  // ── 3. ACTIONS ────────────────────────────────────────────────
  const addToCart = (item) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ItemID === item.ItemID);
      if (existing) {
        return prev.map(i => i.ItemID === item.ItemID ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setShowAddToast(true);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.ItemID === itemId);
      if (existing?.quantity > 1) {
        return prev.map(i => i.ItemID === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.ItemID !== itemId);
    });
  };

  const removeItemCompletely = (itemId) => {
    setCartItems(prev => prev.filter(item => item.ItemID !== itemId));
  };

  const clearCart = async () => {
    setCartItems([]);
    setAppliedCoupon(null);
    if (status === 'authenticated' && session?.user?.email) {
      try {
        await fetch(`${API_BASE}/api/cart/${session.user.email}`, { method: 'DELETE' });
      } catch (err) { console.error("Redis clear failed", err); }
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setCouponError('');
    try {
      const res = await fetch(`${API_BASE}/api/orders/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponInput.toUpperCase(),
          userId: user.id,
          orderValue: cartSubtotal 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAppliedCoupon(data); 
        setCouponInput('');
      } else {
        setCouponError(data.message || "Invalid coupon");
      }
    } catch (err) {
      setCouponError("Service unavailable.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  // ── 4. CALCULATIONS (FINALISED) ───────────────────────────────
  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const price = item.DiscountedPrice !== undefined ? parseFloat(item.DiscountedPrice) : parseFloat(item.Price);
      return acc + (price * item.quantity);
    }, 0);
  }, [cartItems]);

  const totalSavings = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      if (item.DiscountedPrice !== undefined && item.DiscountedPrice < item.Price) {
        return acc + (parseFloat(item.Price) - parseFloat(item.DiscountedPrice)) * item.quantity;
      }
      return acc;
    }, 0);
  }, [cartItems]);

  const couponDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.DiscountType === 'Percentage' 
      ? (cartSubtotal * parseFloat(appliedCoupon.DiscountValue)) / 100 
      : parseFloat(appliedCoupon.DiscountValue);
  }, [appliedCoupon, cartSubtotal]);

  // Delivery Logic: If subtotal < 299 then ₹50, else ₹0
  const deliveryFee = useMemo(() => {
    if (appliedCoupon?.CouponCode === 'FREEDEL' || cartSubtotal >= 299 || cartCount === 0) return 0;
    return 50;
  }, [appliedCoupon, cartSubtotal, cartCount]);

  // Wallet Logic: Deduct from total after coupon and delivery
  const amountFromWallet = useMemo(() => {
    if (!useWallet) return 0;
    const currentPayable = Math.max(0, cartSubtotal - couponDiscountAmount + deliveryFee);
    return Math.min(parseFloat(user.walletBalance), currentPayable);
  }, [useWallet, user.walletBalance, cartSubtotal, couponDiscountAmount, deliveryFee]);

  const cartTotal = Math.max(0, cartSubtotal - couponDiscountAmount + deliveryFee - amountFromWallet);

  return (
    <CartContext.Provider value={{
      user, status, searchQuery, setSearchQuery,
      cartItems, cartCount, cartSubtotal, cartTotal, totalSavings, deliveryFee,
      isCartOpen, setIsCartOpen, addToCart, removeFromCart, removeItemCompletely, clearCart,
      deliveryMode, setDeliveryMode, showAddToast, setShowAddToast,
      selectedAddress, setSelectedAddress, paymentMode, setPaymentMode,
      useWallet, setUseWallet, amountFromWallet,
      couponInput, setCouponInput, appliedCoupon, couponError, couponDiscountAmount, handleApplyCoupon, removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);