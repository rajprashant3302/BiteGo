"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, CheckCircle2, Zap, Clock, BadgePercent } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Button from "@/components/ui/Button";
import CartItem from "./CartItem";
import { cn } from "@/components/ui/cn";

export default function CartSidebar() {
  const ctx = useCart();

  // ---- Required from context (no silent fallbacks; better to fail loudly) ----
  const {
    isCartOpen,
    setIsCartOpen,

    cartItems,
    cartSubtotal,
    cartTotal,
    deliveryFee,

    deliveryMode,
    setDeliveryMode,
    scheduledTime,
    setIsScheduleOpen,

    couponCode,
    setCouponCode,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,

    placeOrder,
  } = ctx;

  const [isPlacing, setIsPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const close = () => setIsCartOpen(false);

  const missing = useMemo(() => {
    const miss = [];
    if (typeof setCouponCode !== "function") miss.push("setCouponCode");
    if (typeof applyCoupon !== "function") miss.push("applyCoupon");
    if (typeof removeCoupon !== "function") miss.push("removeCoupon");
    if (typeof placeOrder !== "function") miss.push("placeOrder");
    if (typeof setIsScheduleOpen !== "function") miss.push("setIsScheduleOpen");
    if (typeof setDeliveryMode !== "function") miss.push("setDeliveryMode");
    return miss;
  }, [setCouponCode, applyCoupon, removeCoupon, placeOrder, setIsScheduleOpen, setDeliveryMode]);

  const scheduleLabel =
    scheduledTime?.time
      ? `${scheduledTime?.date ? `${scheduledTime.date} • ` : ""}${scheduledTime.time}`
      : "";

  const handlePlaceOrder = async () => {
    setPlaceError("");
    setIsPlacing(true);
    try {
      await placeOrder();
      setOrderSuccess(true);
      setTimeout(() => {
        setOrderSuccess(false);
        close();
      }, 1400);
    } catch (e) {
      setPlaceError(e?.message || "Failed to place order");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] cursor-pointer"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220, bounce: 0 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white shadow-2xl z-[310] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900">
                  Your Order <ShoppingBag className="text-orange-500" />
                </h2>
                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                  Review & checkout
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="bg-gray-100 rounded-2xl"
                onClick={close}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Missing context warning */}
            {missing.length > 0 && (
              <div className="mx-8 mt-6 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
                CartContext is missing: <span className="font-black">{missing.join(", ")}</span>.
                <div className="text-xs font-semibold mt-1 text-red-600">
                  Fix your CartProvider value object (wrong/old CartContext file is being used).
                </div>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gray-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Your cart is empty</h3>
                    <p className="text-gray-400 text-sm max-w-[240px] mt-2 font-medium">
                      Add some tasty items to start your food journey.
                    </p>
                  </div>
                  <Button variant="outline" onClick={close} className="rounded-2xl">
                    Explore Menu
                  </Button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Delivery pill */}
                  <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
                    <div className="flex items-center gap-3">
                      {deliveryMode === "quick" ? (
                        <Zap className="text-orange-500" size={18} />
                      ) : (
                        <Clock className="text-orange-500" size={18} />
                      )}

                      <span className="text-sm font-black text-orange-900">
                        {deliveryMode === "quick"
                          ? "Quick Delivery (25-35 min)"
                          : scheduleLabel
                          ? `Scheduled: ${scheduleLabel}`
                          : "Scheduled Delivery"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode("scheduled");  // ✅ important
                        setIsScheduleOpen(true);       // ✅ open modal
                      }}
                      className="text-xs font-black text-orange-500 uppercase tracking-wider hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <CartItem key={item.ItemID} item={item} />
                    ))}
                  </div>

                  {/* Coupon */}
                  <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-9 h-9 rounded-2xl bg-white border border-gray-100 flex items-center justify-center">
                        <BadgePercent size={18} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">Apply Coupon</p>
                        <p className="text-[11px] font-bold text-gray-400">Save more on this order</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="e.g. WELCOME50"
                        className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-100"
                      />
                      <Button
                        onClick={() => applyCoupon(couponCode)}
                        className="rounded-2xl px-5"
                      >
                        Apply
                      </Button>
                    </div>

                    {couponError && (
                      <p className="text-red-500 text-xs font-bold mt-2">{couponError}</p>
                    )}

                    {couponDiscount > 0 && (
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs font-black text-green-600 uppercase tracking-wider">
                          Discount applied: -₹{Number(couponDiscount).toFixed(0)}
                        </p>
                        <button
                          onClick={removeCoupon}
                          className="text-xs font-black text-orange-500 uppercase tracking-wider hover:underline"
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {placeError && (
                    <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
                      {placeError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500 font-bold text-sm">
                    <span>Items Subtotal</span>
                    <span>₹{Number(cartSubtotal).toFixed(0)}</span>
                  </div>

                  <div className="flex justify-between text-gray-500 font-bold text-sm">
                    <span>Delivery Fee</span>
                    <span className="text-gray-700">₹{Number(deliveryFee).toFixed(0)}</span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-700 font-black text-sm">
                      <span>Coupon Discount</span>
                      <span>-₹{Number(couponDiscount).toFixed(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t border-gray-200/50">
                  <span>Total</span>
                  <span className="text-orange-500">₹{Number(cartTotal).toFixed(0)}</span>
                </div>

                <Button
                  className={cn(
                    "w-full h-16 text-lg rounded-[24px] shadow-xl shadow-orange-500/20",
                    isPlacing ? "opacity-90" : ""
                  )}
                  onClick={handlePlaceOrder}
                  disabled={isPlacing}
                >
                  {isPlacing ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="animate-bounce" />
                      Processing...
                    </span>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Success Overlay */}
          <AnimatePresence>
            {orderSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.98, y: 10 }}
                  className="bg-white rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="text-green-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-black text-gray-900">Order placed!</h3>
                  <p className="mt-1 text-sm font-bold text-gray-400">Your food is on the way 🚀</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}