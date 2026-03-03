'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, BadgePercent, CheckCircle2, Zap, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';
import CartItem from './CartItem';
import CouponSection from './CouponSection';
import CheckoutOverlay from './CheckoutOverlay';

// ... imports stay same

export default function CartSidebar() {
  const {
    isCartOpen, setIsCartOpen,
    cartItems,
    cartSubtotal, cartTotal, deliveryFee, discountAmount,
    deliveryMode,
    scheduledTime,
    setIsScheduleOpen,
    appliedCoupon,
    isOrdered, handleCheckout,
    user // Using user from context for the overlay
  } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] cursor-pointer"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220, bounce: 0 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900">
                  Your Order <ShoppingBag className="text-orange-500" />
                </h2>
              </div>
              <Button variant="ghost" size="icon" className="bg-gray-100" onClick={() => setIsCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

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
                  <Button variant="outline" onClick={() => setIsCartOpen(false)}>Explore Menu</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
                    <div className="flex items-center gap-3">
                      {deliveryMode === 'quick'
                        ? <Zap className="text-orange-500" size={18} />
                        : <Clock className="text-orange-500" size={18} />}
                      <span className="text-sm font-black text-orange-900">
                        {deliveryMode === 'quick' ? 'Quick Delivery (25-35 min)' : `Scheduled: ${scheduledTime?.time}`}
                      </span>
                    </div>
                    <button onClick={() => setIsScheduleOpen(true)} className="text-xs font-black text-orange-500 uppercase tracking-wider hover:underline">
                      Change
                    </button>
                  </div>
                  
                  {/* FIX: Using ItemID as the unique key */}
                  {cartItems.map(item => <CartItem key={item.ItemID} item={item} />)}
                  
                  <CouponSection />
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500 font-bold text-sm">
                    <span>Items Subtotal</span><span>₹{cartSubtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-bold text-sm">
                    <span>Delivery Fee</span>
                    <span className={deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'text-green-600' : ''}>
                      {deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'FREE' : `₹${deliveryFee.toFixed(0)}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t border-gray-200/50">
                  <span>Total</span>
                  <span className="text-orange-500">₹{cartTotal.toFixed(0)}</span>
                </div>
                <Button
                  className="w-full h-16 text-lg rounded-[24px] shadow-xl shadow-orange-500/20"
                  onClick={handleCheckout}
                  disabled={isOrdered}
                >
                  {isOrdered
                    ? <span className="flex items-center gap-2"><CheckCircle2 className="animate-bounce" /> Processing...</span>
                    : 'Place Order'}
                </Button>
              </div>
            )}
          </motion.div>
          <CheckoutOverlay />
        </>
      )}
    </AnimatePresence>
  );
}