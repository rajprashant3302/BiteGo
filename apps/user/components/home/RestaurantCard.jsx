'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, Timer, Plus, Tag } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';

export default function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }) {
  const [index, setIndex] = useState(0);
  const items = restaurant.menuItems || [];
  
  // Display rating as 1 decimal place
  const rating = restaurant.Rating ? parseFloat(restaurant.Rating).toFixed(1) : "4.5";

  // Logic to find the best current offer for the badge
  const activeOffer = restaurant.offers?.find(o => o.IsActive) || null;

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  const activeItem = items[index];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col bg-white rounded-[32px] overflow-hidden border-2 border-gray-100/50 shadow-sm hover:shadow-2xl hover:border-orange-500/10 transition-all duration-500 h-full relative"
    >
      <div className="relative h-56 overflow-hidden bg-gray-100">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeItem?.ItemID || 'default'}
            src={activeItem?.ItemImageURL || "/placeholder.png"}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        
        {/* Dynamic Offer Badge */}
        {activeOffer && (
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-orange-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg animate-bounce">
              <Tag size={12} className="fill-white" />
              {activeOffer.DiscountValue}{activeOffer.DiscountType === 'Percentage' ? '%' : '₹'} OFF
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
          <div className="absolute bottom-4 left-4 text-white">
             <motion.div key={`text-${activeItem?.ItemID}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Featured Dish</p>
                <h4 className="font-bold text-lg truncate w-40">{activeItem?.ItemName || "Delicious Eats"}</h4>
                <div className="flex items-center gap-2">
                   <p className="font-black text-white">₹{activeItem?.Price || "---"}</p>
                   {/* Strikethrough price if menu item has a discount logic applied */}
                   {activeItem?.DiscountedPrice < activeItem?.Price && (
                     <span className="text-gray-400 line-through text-xs">₹{activeItem.Price}</span>
                   )}
                </div>
             </motion.div>
          </div>
        </div>

        {/* Floating Rating & Favorite */}
        <div className="absolute top-4 right-16">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-900 flex items-center gap-1.5 shadow-sm border border-gray-100">
            <Star size={13} className="fill-orange-500 text-orange-500" /> {rating}
          </div>
        </div>

        <button
          onClick={(e) => onToggleFavorite(e, restaurant.RestaurantID)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95 z-10"
        >
          <Heart size={20} className={cn('transition-colors', isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
        </button>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-black text-xl text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
            {restaurant.Name}
        </h3>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">
          {restaurant.categoryName} • 25-35 MIN
        </p>
        
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-50 p-2 rounded-lg">
                <Timer size={16} className="text-orange-500" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Delivery</span>
                <span className="text-xs font-black text-gray-900 tracking-tight">FAST TRACK</span>
            </div>
          </div>
          <Button size="icon" className="w-12 h-12 rounded-2xl shadow-lg shadow-orange-500/20 active:scale-90 transition-transform">
            <Plus size={20} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}