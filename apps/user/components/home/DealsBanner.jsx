'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/components/ui/cn';
import { useCart } from '@/context/CartContext';
import { Gift, Zap, Percent, Tag } from 'lucide-react';

export default function DealsBanner() {
  const { copiedCode, copyCode } = useCart();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Icon mapping
  const getIcon = (type) => {
    switch (type) {
      case 'FreeDelivery':
        return Zap;
      case 'DiscountOnOrder':
        return Percent;
      case 'Bonus':
      case 'Cashback':
        return Gift;
      default:
        return Tag;
    }
  };

  // 🔥 Multiple gradients (independent of type)
  const gradients = [
    'from-orange-500 to-rose-500',
    'from-violet-500 to-indigo-500',
    'from-emerald-500 to-teal-500',
    'from-pink-500 to-fuchsia-500',
    'from-yellow-400 to-orange-500',
    'from-cyan-500 to-blue-500',
    'from-lime-500 to-green-600',
    'from-red-500 to-pink-500',
  ];

  // 🔥 Fetch offers
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PROMOTION_SERVICE_URL}/api/public/offers`
        );
        const data = await res.json();

        if (data.success) {
          const formatted = data.data.map((offer, index) => ({
            id: offer.OfferID,

            // 🔥 Title = discount text (UI friendly)
            title:
              offer.RewardType === 'FreeDelivery'
                ? 'Free Delivery'
                : offer.DiscountType === 'Percentage'
                ? `${offer.RewardValue}% OFF`
                : `₹${offer.RewardValue} OFF`,

            subtitle:
              offer.MinOrderValue
                ? `Min order ₹${offer.MinOrderValue}`
                : 'Limited time offer',

            // 🔥 Code = Title (backend stores code here)
            code: offer.Title?.toUpperCase() || 'AUTO APPLIED',

            icon: getIcon(offer.RewardType),

            // 🔥 Stable colorful gradients
            gradient: gradients[index % gradients.length],

            expiry: `Ends ${new Date(offer.EndTime).toLocaleDateString()}`,
          }));

          setDeals(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch offers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // 🔥 COLORFUL SKELETON LOADER
  if (loading) {
    return (
      <section>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative flex-shrink-0 w-[280px] sm:w-[320px] h-[180px] rounded-[32px] overflow-hidden"
            >
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-500 opacity-70" />

              {/* Shimmer */}
              <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.6),transparent)] animate-[shimmer_1.5s_infinite]" />

              {/* Content */}
              <div className="relative p-7 h-full flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-white/30" />
                  <div className="w-20 h-4 rounded-full bg-white/30" />
                </div>

                <div className="space-y-2">
                  <div className="w-3/4 h-6 bg-white/30 rounded-lg" />
                  <div className="w-1/2 h-4 bg-white/30 rounded-lg" />
                </div>

                <div className="flex justify-between items-center">
                  <div className="w-24 h-4 bg-white/30 rounded-lg" />
                  <div className="w-16 h-6 bg-white/30 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </section>
    );
  }

  // 🔥 MAIN UI
  return (
    <section>
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {deals.map((deal) => {
          const Icon = deal.icon;
          const isCopied = copiedCode === deal.code;

          return (
            <motion.div
              whileHover={{ y: -4 }}
              key={deal.id}
              className="relative flex-shrink-0 w-[280px] sm:w-[320px] rounded-[32px] overflow-hidden cursor-pointer group shadow-lg"
              onClick={() => copyCode(deal.code)}
            >
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  deal.gradient
                )}
              />
              <div className="absolute inset-0 bg-black/5" />

              <div className="relative p-7 h-full flex flex-col justify-between space-y-4">
                {/* Top */}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                    <Icon size={24} className="text-white" />
                  </div>

                  <span className="text-[10px] font-black text-white/80 bg-black/10 px-3 py-1 rounded-full uppercase tracking-widest">
                    {deal.expiry}
                  </span>
                </div>

                {/* Middle */}
                <div>
                  <h3 className="text-white font-black text-2xl leading-tight mb-1">
                    {deal.title}
                  </h3>
                  <p className="text-white/80 text-sm font-bold">
                    {deal.subtitle}
                  </p>
                </div>

                {/* Bottom */}
                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 group-hover:bg-white/25 transition-all">
                  <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
                    {deal.code}
                  </span>

                  <span className="text-[10px] font-black text-white/90 uppercase bg-black/20 px-3 py-1.5 rounded-xl">
                    {isCopied ? 'Copied!' : 'Copy'}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}