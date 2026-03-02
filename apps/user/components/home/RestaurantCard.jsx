'use client';

import { motion } from 'framer-motion';
import { Heart, Star, Timer, BadgePercent, Plus } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

export default function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }) {
  const { addToCart } = useCart();

  return (
    <motion.div
      layout
      key={restaurant.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex flex-col bg-white rounded-[32px] overflow-hidden border-2 border-gray-100/50 shadow-sm hover:shadow-2xl hover:border-orange-500/10 transition-all duration-500 hover:-translate-y-2 h-full"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <button
          onClick={(e) => onToggleFavorite(e, restaurant.id)}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
        >
          <Heart size={20} className={cn('transition-colors', isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
        </button>
        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-900 flex items-center gap-1.5 shadow-sm border border-gray-100">
            <Timer size={13} className="text-orange-500" /> {restaurant.time}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-black text-xl text-gray-900 leading-tight group-hover:text-orange-500 transition-colors line-clamp-1">
            {restaurant.name}
          </h3>
          <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
            <Star size={12} className="fill-current" /> {restaurant.rating}
          </div>
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">
          {restaurant.tags.join(' • ')} • {restaurant.priceRange}
        </p>
        {restaurant.offer && (
          <div className="bg-orange-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-orange-100 mb-6">
            <BadgePercent className="text-orange-500" size={18} />
            <span className="text-xs font-black text-orange-900 line-clamp-1">{restaurant.offer}</span>
          </div>
        )}
        <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Starts at</span>
            <span className="text-2xl font-black text-gray-900">${restaurant.price.toFixed(2)}</span>
          </div>
          <Button size="icon" onClick={() => addToCart(restaurant)} className="w-12 h-12 rounded-2xl shadow-lg shadow-orange-500/20">
            <Plus size={20} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}