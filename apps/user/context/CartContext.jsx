'use client';

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { DEALS } from '@/data/deals';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // ── Search ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');

  // ── Cart ────────────────────────────────────────────
  const [cartItems,    setCartItems]    = useState([]);
  const [isCartOpen,   setIsCartOpen]   = useState(false);

  // ── Delivery ────────────────────────────────────────
  const [deliveryMode,   setDeliveryMode]   = useState('quick'); // 'quick' | 'scheduled'
  const [scheduledTime,  setScheduledTime]  = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // ── Coupons ─────────────────────────────────────────
  const [couponInput,   setCouponInput]   = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError,   setCouponError]   = useState('');

  // ── Misc ────────────────────────────────────────────
  const [copiedCode,          setCopiedCode]          = useState(null);
  const [isOrdered,           setIsOrdered]           = useState(false);
  const [lastAddedRestaurant, setLastAddedRestaurant] = useState(null);
  const [showAddToast,        setShowAddToast]        = useState(false);

  // Hide toast on scroll
  useEffect(() => {
    const hide = () => { if (showAddToast) setShowAddToast(false); };
    window.addEventListener('scroll', hide, { passive: true });
    return () => window.removeEventListener('scroll', hide);
  }, [showAddToast]);

  // ── Cart Actions ────────────────────────────────────
  const addToCart = (restaurant) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === restaurant.id);
      if (existing)
        return prev.map(item => item.id === restaurant.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...restaurant, quantity: 1 }];
    });
    setLastAddedRestaurant(restaurant);
    setShowAddToast(true);
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id, delta) =>
    setCartItems(prev =>
      prev.map(item =>
        item.id !== id ? item : { ...item, quantity: Math.max(1, item.quantity + delta) }
      )
    );

  // ── Coupon Actions ──────────────────────────────────
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.toUpperCase().trim();
    if (!code) return;
    const found = DEALS.find(d => d.code === code);
    if (found) {
      setAppliedCoupon(found);
      setCouponInput('');
    } else {
      setCouponError('Invalid or expired coupon code');
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // ── Schedule Actions ────────────────────────────────
  const handleScheduleConfirm = (val) => {
    setScheduledTime(val);
    setDeliveryMode('scheduled');
  };

  // ── Copy Code ───────────────────────────────────────
  const copyCode = (code) => {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Checkout ────────────────────────────────────────
  const handleCheckout = () => {
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
      setCartItems([]);
      setIsCartOpen(false);
      setAppliedCoupon(null);
    }, 3000);
  };

  // ── Derived Values ───────────────────────────────────
  const cartCount    = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee  = deliveryMode === 'scheduled' ? 0 : 2.99;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const { discount } = appliedCoupon;
    if (discount.type === 'percent') {
      const calc = (cartSubtotal * discount.value) / 100;
      return discount.max ? Math.min(calc, discount.max) : calc;
    }
    if (discount.type === 'fixed') {
      if (appliedCoupon.code === 'FREEDEL') return deliveryFee;
      return discount.value;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal, deliveryFee]);

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  const lastRestaurant = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;

  return (
    <CartContext.Provider
      value={{
        // search
        searchQuery, setSearchQuery,
        // cart
        cartItems, cartCount, cartSubtotal, cartTotal, deliveryFee, discountAmount,
        lastRestaurant,
        isCartOpen, setIsCartOpen,
        addToCart, removeFromCart, updateQuantity,
        // delivery
        deliveryMode, setDeliveryMode,
        scheduledTime,
        isScheduleOpen, setIsScheduleOpen,
        handleScheduleConfirm,
        // coupon
        couponInput, setCouponInput,
        appliedCoupon,
        couponError, setCouponError,
        handleApplyCoupon, removeCoupon,
        // misc
        copiedCode, copyCode,
        isOrdered, handleCheckout,
        lastAddedRestaurant,
        showAddToast, setShowAddToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}