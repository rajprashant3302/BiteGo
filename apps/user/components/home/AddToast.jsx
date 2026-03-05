'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function AddToast() {
  const { showAddToast, setShowAddToast, lastAddedRestaurant } = useCart();

  return (
    <AnimatePresence>
      {showAddToast && lastAddedRestaurant && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed left-0 right-0 z-[200] flex justify-center px-4 pointer-events-none bottom-[calc(92px+env(safe-area-inset-bottom))] md:bottom-28"
        >
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10 pointer-events-auto max-w-sm w-full mx-auto">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden">
              <span className="font-black text-sm truncate">Added {lastAddedRestaurant.name}</span>
              <span className="text-[10px] text-gray-400 font-bold border-l border-white/20 pl-2 shrink-0">
                {lastAddedRestaurant.tags[0]}
              </span>
            </div>
            <button onClick={() => setShowAddToast(false)} className="ml-auto text-gray-500 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}