'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Ticket, Trash2, XCircle, CheckCircle2, Info } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

export default function CouponSection() {
  const {
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponError,
    setCouponError,
    handleApplyCoupon,
    removeCoupon,
    cartSubtotal,
  } = useCart();

  // Delivery Threshold Logic for UI
  const freeDeliveryThreshold = 299;
  const amountNeededForFreeDelivery = freeDeliveryThreshold - cartSubtotal;

  return (
    <div className="pt-6 border-t border-gray-100 space-y-4">
      {/* ── Dynamic Delivery Fee Indicator ── */}
      {cartSubtotal > 0 && cartSubtotal < freeDeliveryThreshold && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-3 rounded-2xl"
        >
          <Info size={14} className="text-blue-500" />
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
            Add ₹{amountNeededForFreeDelivery.toFixed(0)} more for FREE delivery
          </p>
        </motion.div>
      )}
      
      {cartSubtotal >= freeDeliveryThreshold && cartSubtotal > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-green-50 border border-green-100 p-3 rounded-2xl"
        >
          <CheckCircle2 size={14} className="text-green-600" />
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-tight">
            You unlocked FREE delivery!
          </p>
        </motion.div>
      )}

      <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
        Coupons & Offers
      </p>

      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center justify-between bg-green-50 border-2 border-green-100 p-4 rounded-3xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-green-900 tracking-tight">
                  {appliedCoupon.CouponCode || appliedCoupon.code}
                </p>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                  {appliedCoupon.DiscountType === 'Percentage' 
                    ? `${appliedCoupon.DiscountValue}% OFF Applied` 
                    : `₹${appliedCoupon.DiscountValue} OFF Applied`}
                </p>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Ticket
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (couponError) setCouponError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  placeholder="ENTER CODE"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-xs font-black outline-none transition-all uppercase tracking-widest"
                />
              </div>
              <Button
                onClick={handleApplyCoupon}
                size="sm"
                className="h-auto px-6 rounded-2xl shadow-lg"
                disabled={!couponInput}
              >
                Apply
              </Button>
            </div>
            {couponError && (
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 flex items-center gap-1"
              >
                <XCircle size={12} /> {couponError}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}