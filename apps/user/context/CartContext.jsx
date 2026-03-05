"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { DEALS } from "@/data/deals";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { data: session, status } = useSession();
  const API_BASE =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  // ───────────────── USER ──────────────────────
  const user = useMemo(
    () => ({
      name: session?.user?.name || "BiteGo User",
      email: session?.user?.email || null,
      phone: session?.user?.phone || "Update your phone number",
      profilePic:
        session?.user?.image ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${
          session?.user?.name || "User"
        }`,
      role: session?.user?.role || "User",
    }),
    [session]
  );

  // ───────────────── UI ────────────────────────
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showAddToast, setShowAddToast] = useState(false);

  // ───────────────── SEARCH / DELIVERY ─────────
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("quick"); // quick | scheduled

  // ───────────────── SCHEDULE ──────────────────
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null); // { date, time } | null

  // ✅ One canonical way to set schedule (use this everywhere)
  const confirmSchedule = (val) => {
    // Accept either object {date,time} or string (safety)
    if (!val) return;
    if (typeof val === "string") {
      setScheduledTime({ date: "Scheduled", time: val });
    } else {
      const date = val?.date ?? "Today";
      const time = val?.time ?? "";
      setScheduledTime(time ? { date, time } : null);
    }
    setDeliveryMode("scheduled");
    setIsScheduleOpen(false);
  };

  // ───────────────── CART ──────────────────────
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ───────────────── COUPON ────────────────────
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  // ───────────────── LOAD CART (Redis) ─────────
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) {
      if (status === "unauthenticated") setIsLoading(false);
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

  // ───────────────── SYNC CART (Redis) ─────────
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email || isLoading) return;

    const syncTimeout = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/api/cart/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.email,
            items: cartItems,
          }),
        });
      } catch (err) {
        console.error("Redis Sync Failed:", err);
      }
    }, 700);

    return () => clearTimeout(syncTimeout);
  }, [cartItems, session?.user?.email, status, isLoading, API_BASE]);

  // ───────────────── CART ACTIONS ──────────────
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.ItemID === item.ItemID);
      if (existing) {
        return prev.map((i) =>
          i.ItemID === item.ItemID ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setShowAddToast(true);
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.ItemID === itemId);
      if (!existing) return prev;

      if (existing.quantity > 1) {
        return prev.map((i) =>
          i.ItemID === itemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.ItemID !== itemId);
    });
  };

  const removeItem = (itemId) => {
    setCartItems((prev) => prev.filter((i) => i.ItemID !== itemId));
  };

  const clearCartLocal = () => {
    setCartItems([]);
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
    setDeliveryMode("quick");
    setScheduledTime(null);
    setIsScheduleOpen(false);
  };

  const clearCart = async () => {
    clearCartLocal();
    if (status === "authenticated" && session?.user?.email) {
      try {
        await fetch(`${API_BASE}/api/cart/${session.user.email}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Failed to clear Redis cart:", err);
      }
    }
  };

  // ───────────────── CALCULATIONS ──────────────
  const cartCount = cartItems.reduce(
    (acc, item) => acc + Number(item.quantity || 0),
    0
  );

  const cartSubtotal = cartItems.reduce((acc, item) => {
    const price = Number(item.Price);
    const qty = Number(item.quantity || 0);
    return acc + (Number.isFinite(price) ? price : 0) * qty;
  }, 0);

  const deliveryFee = deliveryMode === "quick" ? 2.99 : 0;

  const cartTotalRaw = cartSubtotal + deliveryFee;
  const cartTotal = Math.max(0, cartTotalRaw - (couponDiscount || 0));

  // Switching to quick resets schedule
  useEffect(() => {
    if (deliveryMode === "quick") setScheduledTime(null);
  }, [deliveryMode]);

  // ───────────────── COUPON (MATCH DEALS) ──────
  const findDealByCode = (code) => {
    const c = (code || "").trim().toUpperCase();
    return DEALS.find((d) => d.code.toUpperCase() === c) || null;
  };

  const applyCoupon = async (code, { silent = false } = {}) => {
    const c = (code || "").trim().toUpperCase();
    if (!silent) setCouponError("");

    if (!c) {
      setCouponCode("");
      setCouponDiscount(0);
      if (!silent) setCouponError("Enter a coupon code");
      return;
    }

    // Try backend if available; if fails, fallback to DEALS
    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: c,
          subtotal: cartSubtotal,
          userId: session?.user?.email || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const amount =
          data?.discountAmount ??
          (data?.discountPercent
            ? (cartSubtotal * Number(data.discountPercent)) / 100
            : 0);

        setCouponCode(c);
        setCouponDiscount(Number(amount || 0));
        return;
      }
    } catch {
      // ignore
    }

    // Fallback based on DEALS
    const deal = findDealByCode(c);
    if (!deal?.discount) {
      setCouponCode("");
      setCouponDiscount(0);
      if (!silent) setCouponError("Invalid coupon code");
      return;
    }

    let amount = 0;

    if (deal.discount.type === "percent") {
      amount = (cartSubtotal * Number(deal.discount.value || 0)) / 100;
      if (deal.discount.max != null) amount = Math.min(amount, Number(deal.discount.max));
    } else if (deal.discount.type === "fixed") {
      amount = Math.min(Number(deal.discount.value || 0), deliveryFee);
    }

    setCouponCode(c);
    setCouponDiscount(Number(amount || 0));
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponError("");
  };

  // Recompute discount when subtotal/deliveryFee changes WITHOUT throwing error UI
  useEffect(() => {
    if (!couponCode) return;
    applyCoupon(couponCode, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal, deliveryFee]);

  // ───────────────── ORDER ─────────────────────
  const placeOrder = async () => {
    if (!cartItems.length) throw new Error("Cart is empty");

    // ✅ Accept object or string (safety)
    const hasScheduled =
      scheduledTime &&
      (typeof scheduledTime === "string"
        ? scheduledTime.trim().length > 0
        : Boolean(scheduledTime.time));

    if (deliveryMode === "scheduled" && !hasScheduled) {
      throw new Error("Please select a scheduled time");
    }

    const payload = {
      userId: session?.user?.email || null,
      items: cartItems,
      subtotal: cartSubtotal,
      deliveryFee,
      couponCode: couponCode || null,
      couponDiscount: couponDiscount || 0,
      total: cartTotal,
      deliveryMode,
      scheduledTime: deliveryMode === "scheduled" ? scheduledTime : null,
    };

    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(msg || "Failed to place order (backend route mismatch)");
    }

    const data = await res.json();
    await clearCart();
    return data;
  };

  return (
    <CartContext.Provider
      value={{
        // user/session
        user,
        status,

        // ui
        isCartOpen,
        setIsCartOpen,
        showAddToast,
        setShowAddToast,

        // search
        searchQuery,
        setSearchQuery,

        // delivery & schedule
        deliveryMode,
        setDeliveryMode,
        isScheduleOpen,
        setIsScheduleOpen,
        scheduledTime,
        setScheduledTime,
        confirmSchedule, // ✅ ADD THIS

        // cart values
        cartItems,
        cartCount,
        cartSubtotal,
        cartTotal,
        deliveryFee,

        // cart actions
        addToCart,
        removeFromCart,
        removeItem,
        clearCart,

        // coupon
        couponCode,
        setCouponCode,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon,

        // order
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
};