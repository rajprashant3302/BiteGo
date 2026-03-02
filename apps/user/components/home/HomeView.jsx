'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import Categories from './Categories';
import DealsBanner from './DealsBanner';
import RestaurantCard from './RestaurantCard';
import { RESTAURANTS } from '@/data/restaurants';
import { useCart } from '@/context/CartContext';

export default function HomeView() {
  const { searchQuery, setSearchQuery, deliveryMode, setDeliveryMode, setIsScheduleOpen, scheduledTime } = useCart();
  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);

  const [greeting, setGreeting] = useState('Good Morning');

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filteredRestaurants = useMemo(
    () => RESTAURANTS.filter(r => {
      const matchCat =
        activeCategory === 'All' ||
        r.tags.includes(activeCategory) ||
        (activeCategory === 'Offers' && (r.featured || r.offer));
      const matchSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    }),
    [activeCategory, searchQuery]
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 md:pb-12 space-y-12 overflow-hidden">
      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30%      { transform: rotate(14deg); }
          20%           { transform: rotate(-8deg); }
          40%           { transform: rotate(-4deg); }
          50%           { transform: rotate(10deg); }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
          transform-origin: 70% 70%;
        }
      `}</style>

      {/* Mobile search */}
      <div className="md:hidden">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search cravings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 focus:border-orange-500 rounded-2xl py-4 pl-12 pr-4 font-black shadow-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Hero */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
            {greeting}, <span className="text-orange-500">Alex</span>
            <span className="inline-block animate-wave ml-2 origin-bottom-right">👋</span>
          </h1>
          <p className="text-gray-500 text-lg font-medium">Ready to bite into something new?</p>
        </div>
        {/* Mobile delivery toggle */}
        <div className="md:hidden flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
          <button
            onClick={() => setDeliveryMode('quick')}
            className={cn('flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all', deliveryMode === 'quick' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500')}
          >
            Quick
          </button>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className={cn('flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all', deliveryMode === 'scheduled' ? 'bg-white text-indigo-500 shadow-sm' : 'text-gray-500')}
          >
            {scheduledTime ? scheduledTime.time : 'Schedule'}
          </button>
        </div>
      </section>

      {/* Deals Banner */}
      <DealsBanner />

      {/* Popular Nearby — heading + categories + cards all together */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Popular Nearby</h2>
          <Button variant="ghost" className="text-orange-500 font-black uppercase text-xs tracking-widest hover:bg-orange-50">
            See All <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        {/* Categories sit right below the heading */}
        <Categories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {/* Restaurant cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-2">
          {filteredRestaurants.map(res => (
            <RestaurantCard
              key={res.id}
              restaurant={res}
              isFavorite={favorites.includes(res.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </section>

    </main>
  );
}