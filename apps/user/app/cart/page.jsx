'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, CheckCircle2, Zap, ShoppingCart, MapPin, ChevronRight, ArrowLeft, Trash2, Check, Wallet } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';
import CartItem from '@/components/cart/CartItem';
import CouponSection from '@/components/cart/CouponSection';
import CheckoutOverlay from '@/components/cart/CheckoutOverlay';
import { useRouter } from 'next/navigation';
import { biteToast } from '@/lib/toast';

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
    couponDiscountAmount
  } = useCart();

  // Safety check for wallet balance display
  const walletBalance = parseFloat(user?.walletBalance || 0);
    const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

 const onPlaceOrder = async () => {
  if (!selectedAddress) {
    biteToast.error("Please select a delivery address");
    return;
  }

  try {
    // 1. Call your placeOrder API (The one we wrote earlier)
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
        couponCode: appliedCoupon?.CouponCode || null
      })
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.error);

    // 2. Handle Payment Logic
    if (paymentMode === 'cod' || result.remainingAmount === 0) {
      // If COD or fully paid by Wallet, go straight to success
      router.push(`/order-success/${result.orderId}`);
    } else {
      // If Online, trigger Razorpay
      handleRazorpayPayment(result);
    }

  } catch (err) {
    biteToast.error(err.message || "Something went wrong");
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
                <Button variant="ghost" onClick={() => router.push('/cart/addresses')} className="text-orange-500 font-black text-xs uppercase">
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
                  <button onClick={() => router.push('/addresses')} className="w-full py-4 text-orange-500 font-black italic underline">Add Delivery Address</button>
                )}
              </div>
            </section>

            <section className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><ShoppingBag size={20}/> Review Items</h3>
              <div className="divide-y divide-slate-50">
                {cartItems.map(item => (
                  <div key={item.ItemID} className="py-6 first:pt-0 last:pb-0">
                    <CartItem item={item} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Summary */}
          <aside className="lg:col-span-4 space-y-6 sticky top-28">
            
            {/* Payment Method */}
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
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
            <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
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

            <CouponSection />

            {/* Bill Details */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border-2 border-orange-500/5">
              <h3 className="text-lg font-black text-slate-900 mb-6 uppercase">Bill Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>Subtotal</span><span>₹{cartSubtotal.toFixed(0)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold text-sm bg-green-50 p-2 rounded-lg">
                    <span>Coupon ({appliedCoupon.code})</span><span>- ₹{couponDiscountAmount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 font-bold text-sm">
                  <span>Delivery Fee</span><span className={deliveryFee === 0 ? 'text-green-600' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                {useWallet && amountFromWallet > 0 && (
                  <div className="flex justify-between text-orange-600 font-bold text-sm bg-orange-50 p-2 rounded-lg">
                    <span>Wallet Applied</span><span>- ₹{amountFromWallet.toFixed(0)}</span>
                  </div>
                )}
                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable</span>
                    <p className="text-4xl font-black text-orange-500 mt-1">₹{cartTotal.toFixed(0)}</p>
                  </div>
                </div>
                <Button className="w-full h-16 text-lg rounded-2xl shadow-xl mt-4" onClick={onPlaceOrder} disabled={isOrdered || !selectedAddress}>
                  {isOrdered ? "Processing..." : "Place Order"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <CheckoutOverlay />
    </main>
  );
}