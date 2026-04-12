'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle2, Zap, ShoppingCart, MapPin, ChevronRight, ArrowLeft,ArrowRight ,Trash2, Check, Wallet, Tag, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';
import CartItem from '@/components/cart/CartItem';
import CouponSection from '@/components/cart/CouponSection';
import CheckoutOverlay from '@/components/cart/CheckoutOverlay';
import { useRouter } from 'next/navigation';
import { biteToast } from '@/lib/toast';

const PAYMENT_API_BASE = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL || "http://localhost:5005";
const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || "http://localhost";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartPage() {
  const router = useRouter();
  const {
    user,
    cartItems,
    cartSubtotal,
    cartTotal,
    deliveryFee,
    appliedCoupon,
    isOrdered,
    selectedAddress,
    clearCart,
    paymentMode,
    setPaymentMode,
    useWallet,
    setUseWallet,
    amountFromWallet,
  } = useCart();

  const [publicOffers, setPublicOffers] = useState([]);
  
  // ── NEW: CHECKOUT PROGRESS STATE ──
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // FETCH PUBLIC OFFERS
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_GATEWAY}/svc/promotion/api/public/offers`);
        if (res.ok) {
          const json = await res.json();
          setPublicOffers(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch offers for summary", err);
      }
    };
    fetchOffers();
  }, []);

  const walletBalance = parseFloat(user?.walletBalance || 0);

  // Helper to reset progress if something fails
  const resetProgress = () => {
    setIsProcessing(false);
    setCheckoutStatus('');
    setProgress(0);
  };

  const handleRazorpayPayment = async (orderResult) => {
    setCheckoutStatus("Loading secure payment gateway...");
    setProgress(50);
    
    const isScriptLoaded = await loadRazorpayScript();

    if (!isScriptLoaded) {
      biteToast.error("Failed to load payment gateway. Please check your connection.");
      resetProgress();
      return;
    }

    try {
      setCheckoutStatus("Initializing payment details...");
      setProgress(65);

      // A. Call your Payment Service to create a Razorpay Order
      const createOrderRes = await fetch(`${PAYMENT_API_BASE}/api/payments/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderResult.remainingAmount,
          paymentId: orderResult.paymentId
        }),
      });

      const orderData = await createOrderRes.json();

      if (!orderData.success) {
        throw new Error("Could not initialize payment.");
      }

      setCheckoutStatus("Awaiting your payment...");
      setProgress(80);

      // B. Configure Razorpay Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.order.amount, 
        currency: "INR",
        name: "BiteGo Delivery", 
        description: `Order Payment`,
        order_id: orderData.order.id, 
        handler: async function (response) {
          // C. Verify Payment after user completes it
          setCheckoutStatus("Verifying payment...");
          setProgress(95);

          try {
            const verifyRes = await fetch(`${PAYMENT_API_BASE}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...response,
                paymentId: orderResult.paymentId,
                orderId: orderResult.orderId
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setProgress(100);
              setCheckoutStatus("Payment successful! Redirecting...");
              clearCart(); 
              setTimeout(() => {
                router.push(`/order-success/${orderResult.orderId}`); 
              }, 500);
            } else {
              biteToast.error("Payment verification failed.");
              resetProgress();
              router.push(`/orders/${orderResult.orderId}`);
            }
          } catch (error) {
            biteToast.error("Server error during verification.");
            resetProgress();
          }
        },
        prefill: {
          name: user?.name || "Customer", 
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#f97316", 
        },
        // Handle if user explicitly closes the popup without paying
        modal: {
          ondismiss: function() {
            biteToast.error("Payment cancelled by user.");
            resetProgress();
          }
        }
      };

      // D. Open the Razorpay Checkout Interface
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response){
        biteToast.error("Payment failed.");
        resetProgress();
        router.push(`/orders/${orderResult.orderId}`);
      });

      paymentObject.open();

    } catch (error) {
      biteToast.error(error.message || "Something went wrong loading payment.");
      resetProgress();
    }
  };

  const onPlaceOrder = async () => {
    if (!selectedAddress) {
      biteToast.error("Please select a delivery address");
      return;
    }

    try {
      // Start Processing UI
      setIsProcessing(true);
      setCheckoutStatus("Creating your order...");
      setProgress(20);

      // 1. Call your placeOrder API
      const response = await fetch(`${API_BASE}/api/orders/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          restaurantId: cartItems[0]?.RestaurantID,
          items: cartItems.map(item => ({
            id: item.ItemID,
            price: item.DiscountedPrice || item.Price,
            quantity: item.quantity
          })),
          addressId: selectedAddress.AddressID,
          useWallet: useWallet,
          paymentMethod: paymentMode,
          couponCode: appliedCoupon?.code || null 
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // 2. Handle Payment Logic
      if (paymentMode === 'cod' || result.remainingAmount === 0) {
        setProgress(100);
        setCheckoutStatus("Order placed successfully!");
        clearCart();
        setTimeout(() => {
          router.push(`/order-success/${result.orderId}`);
        }, 600);
      } else {
        handleRazorpayPayment(result);
      }

    } catch (err) {
      biteToast.error(err.message || "Something went wrong");
      resetProgress();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6 font-sans">
        <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex items-center justify-center mb-8 border border-slate-100">
          <ShoppingCart className="text-slate-200" size={56} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Your cart is empty</h2>
        <Button className="h-16 px-12 rounded-2xl shadow-orange-500/20" onClick={() => router.push('/')}>
          Browse Restaurants
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-12 pb-24 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:text-orange-500 transition-all">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Your Basket</h1>
          </div>
          <button onClick={clearCart} className="flex items-center gap-2 text-xs font-black text-red-500 uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
            <Trash2 size={16} /> Clear Cart
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* LEFT COLUMN: Items & Address */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-200">
                    <MapPin size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Delivery Address</h3>
                </div>
                <Button variant="ghost" onClick={() => router.push('/cart/addresses')} className="text-orange-500 font-black text-xs uppercase" disabled={isProcessing}>
                  Change <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>

              <div className={`p-6 rounded-[2rem] border-2 transition-all ${selectedAddress ? 'border-orange-100 bg-orange-50/30' : 'border-dashed border-slate-200 bg-slate-50'}`}>
                {selectedAddress ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xl font-black text-slate-900">{selectedAddress.City}</p>
                      <p className="text-slate-500 font-bold mt-1 text-sm">{selectedAddress.AddressLine}</p>
                    </div>
                    <CheckCircle2 className="text-green-500" size={24} />
                  </div>
                ) : (
                  <button onClick={() => router.push('/cart/addresses')} className="w-full py-4 text-orange-500 font-black italic underline" disabled={isProcessing}>Add Delivery Address</button>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><ShoppingBag size={20}/> Review Items</h3>
              <div className="divide-y divide-slate-50">
                {cartItems.map(item => (
                  <div key={item.ItemID} className={`py-6 first:pt-0 last:pb-0 ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
                    <CartItem item={item} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Summary */}
          <aside className="lg:col-span-4 space-y-6 sticky top-28">
            
            {/* Payment Method */}
            <div className={`bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</p>
              <div className="space-y-3">
                {['online', 'cod'].map((mode) => (
                  <button key={mode} onClick={() => setPaymentMode(mode)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${paymentMode === mode ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                    <div className={`p-2 rounded-xl ${paymentMode === mode ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'}`}>
                      {mode === 'online' ? <Zap size={18} /> : <ShoppingBag size={18} />}
                    </div>
                    <p className="text-sm font-black text-slate-900 capitalize">{mode === 'online' ? 'UPI / Cards' : 'Cash on Delivery'}</p>
                    {paymentMode === mode && <Check size={16} className="ml-auto text-orange-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Toggle */}
            <div className={`bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BiteGo Wallet</p>
                <span className="text-[10px] font-black text-orange-500">Balance: ₹{walletBalance.toFixed(0)}</span>
              </div>
              <button onClick={() => setUseWallet(!useWallet)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${useWallet ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${useWallet ? 'bg-orange-500 text-white' : 'bg-white text-slate-400'}`}><Wallet size={18} /></div>
                  <p className="text-sm font-black text-slate-900">Apply Balance</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${useWallet ? 'bg-orange-500 border-orange-500' : 'border-slate-300'}`}>
                  {useWallet && <Check size={14} className="text-white" />}
                </div>
              </button>
            </div>

            <div className={`${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}>
               <CouponSection />
            </div>

            {/* BILL DETAILS & CHECKOUT ACTION */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-orange-500/5">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase">Bill Details</h3>
              <div className="space-y-4">
                
                {/* Math Breakdown */}
                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>Subtotal</span>
                  <span>₹{cartSubtotal.toFixed(0)}</span>
                </div>

                <AnimatePresence>
                  {appliedCoupon?.appliedOffers?.map((offerObj) => {
                    const detail = publicOffers.find(o => o.OfferID === offerObj.offerId);
                    const isManualCode = appliedCoupon.code && (detail?.PromoCode === appliedCoupon.code || !detail);
                    
                    return (
                      <motion.div 
                        key={offerObj.offerId}
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex justify-between text-green-600 font-bold text-sm bg-green-50 p-3 rounded-2xl border border-green-100"
                      >
                        <span className="flex items-center gap-2">
                          {isManualCode ? <Tag size={14} /> : <Sparkles size={14} />}
                          {detail?.Title || (isManualCode ? `Code (${appliedCoupon.code})` : 'Platform Offer')}
                        </span>
                        <span>- ₹{parseFloat(offerObj.appliedDiscount || 0).toFixed(0)}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-black' : ''}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>

                {useWallet && amountFromWallet > 0 && (
                  <div className="flex justify-between text-orange-600 font-bold text-sm bg-orange-50 p-2 rounded-lg">
                    <span>Wallet Applied</span>
                    <span>- ₹{amountFromWallet.toFixed(0)}</span>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-between items-end mb-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable</span>
                    <p className="text-4xl font-black text-orange-500 mt-1">₹{cartTotal.toFixed(0)}</p>
                  </div>
                </div>

                {/* ── NEW: PROGRESS BAR UI ── */}
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div 
                      key="progress"
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-4 overflow-hidden"
                    >
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                        <span className="flex items-center gap-1.5 text-orange-600">
                          <Loader2 size={12} className="animate-spin" /> {checkoutStatus}
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <motion.div 
                          className="bg-orange-500 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button 
                        className="w-full h-16 text-lg rounded-2xl shadow-xl mt-2 flex justify-center items-center gap-2" 
                        onClick={onPlaceOrder} 
                        disabled={isOrdered || !selectedAddress || isProcessing}
                      >
                        Place Order <ArrowRight size={20} />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </aside>
        </div>
      </div>
      <CheckoutOverlay />
    </main>
  );
}
