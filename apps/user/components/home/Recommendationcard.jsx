'use client';

import { motion } from 'framer-motion';
import { Star, Timer, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import { resolveImageUrl, withFallbackSrc } from '@/lib/image';

export default function RecommendationCard({ item }) {
  // Score-based badge logic
  const isHighMatch = item.score > 1.1;
  const ORDER_SERVICE_BASE =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "/order-api";
  const fallbackImage = "/placeholder-food.svg";
  const imageUrl = resolveImageUrl(item?.ItemImageURL, {
    fallback: fallbackImage,
    baseUrl: ORDER_SERVICE_BASE,
  });
  const handleImageError = withFallbackSrc(fallbackImage);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="flex-shrink-0 w-[280px] bg-white rounded-[32px] overflow-hidden border-2 border-gray-100/50 shadow-sm hover:shadow-xl hover:border-orange-500/10 transition-all duration-300 relative group"
    >
      {/* Image Section */}
      <div className="relative h-40 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          alt={item.name}
          onError={handleImageError}
        />
        
        {isHighMatch && (
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-orange-500 text-white px-2.5 py-1 rounded-xl text-[9px] font-black flex items-center gap-1 shadow-lg">
              <Sparkles size={10} className="fill-white" />
              TOP MATCH
            </div>
          </div>
        )}

        <div className="absolute bottom-3 right-3">
          <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-gray-900 flex items-center gap-1 shadow-sm">
            <Star size={10} className="fill-orange-500 text-orange-500" /> 
            {(item.score * 4).toFixed(1)} {/* Artificial rating based on score */}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col h-full">
        <h4 className="font-black text-md text-gray-900 truncate">
          {item.name}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
          {item.category} • {item.type === 'RESTAURANT' ? 'Restaurant' : 'Menu Item'}
        </p>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-50 p-1.5 rounded-lg">
              <Timer size={14} className="text-orange-500" />
            </div>
            <span className="text-[10px] font-black text-gray-900">FAST TRACK</span>
          </div>
          <Button size="icon" className="w-10 h-10 rounded-xl shadow-md active:scale-90 transition-transform">
            <Plus size={18} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
