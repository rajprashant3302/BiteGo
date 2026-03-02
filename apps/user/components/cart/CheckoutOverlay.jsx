'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bike } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CheckoutOverlay() {
  const { isOrdered } = useCart();

  return (
    <AnimatePresence>
      {isOrdered && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-orange-500 flex flex-col items-center justify-center text-white p-6 text-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
              <Bike size={48} className="text-orange-500" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-black mb-4">Order Placed!</h2>
          <p className="text-orange-100 font-bold text-lg mb-8">Alex, your delicious food is on its way.</p>
          <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.8 }}
              className="bg-white h-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}