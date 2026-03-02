'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Ticket, Trash2, XCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

export default function CouponSection() {
  const {
    couponInput, setCouponInput,
    appliedCoupon,
    couponError, setCouponError,
    handleApplyCoupon,
    removeCoupon,
  } = useCart();

  return (
    <div className="pt-6 border-t border-gray-100 space-y-3">
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Coupons & Offers</p>
      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-green-800 tracking-tight">{appliedCoupon.code}</p>
                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Coupon Applied</p>
              </div>
            </div>
            <button onClick={removeCoupon} className="p-2 text-green-700 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  placeholder="Enter Promo Code"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all uppercase tracking-widest"
                />
              </div>
              <Button onClick={handleApplyCoupon} size="sm" className="h-auto px-6">Apply</Button>
            </div>
            {couponError && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 flex items-center gap-1">
                <XCircle size={12} /> {couponError}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}