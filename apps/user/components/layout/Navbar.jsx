'use client';

import { Search, ShoppingBag, User, Zap, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import BiteGoLogo from '@/components/layout/BiteGoLogo';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';

export default function Navbar() {
  const {
    searchQuery, setSearchQuery,
    deliveryMode, setDeliveryMode,
    scheduledTime, setIsScheduleOpen,
    setIsCartOpen,
    cartCount, cartTotal,
  } = useCart();

  return (
    <header className="sticky top-0 z-[80] w-full bg-white/80 md:bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3 group">
          <BiteGoLogo size={160} className="group-hover:scale-110 transition-transform duration-300" />
          <div className="hidden sm:flex flex-col -gap-1">
            <span className="font-black text-2xl tracking-tight text-gray-900 leading-none">
              Bite<span className="text-orange-500">Go</span>
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
              Food & Delivery
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hungry for sushi? Search here..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-2 border-transparent focus:border-orange-500/30 focus:bg-white rounded-2xl outline-none transition-all duration-300 text-sm font-semibold text-gray-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-gray-100 rounded-2xl p-1.5 gap-1 shadow-inner">
            <button
              onClick={() => setDeliveryMode('quick')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider',
                deliveryMode === 'quick' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Zap size={14} className={deliveryMode === 'quick' ? 'fill-orange-400' : ''} />
              Quick
            </button>
            <button
              onClick={() => setIsScheduleOpen(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-wider',
                deliveryMode === 'scheduled' ? 'bg-white text-indigo-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Clock size={14} />
              {scheduledTime ? scheduledTime.time : 'Schedule'}
            </button>
          </div>

          <Button variant="ghost" size="icon" className="hidden sm:flex bg-gray-100">
            <User className="h-5 w-5" />
          </Button>

          <Button
            variant="dark"
            className="rounded-2xl pl-4 pr-6 h-12 gap-3"
            onClick={() => setIsCartOpen(true)}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div
                    key={cartCount}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white"
                  >
                    {cartCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="hidden sm:inline font-black uppercase text-xs tracking-widest">
              ${cartTotal.toFixed(2)}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}