'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronRight, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import Categories from './Categories';
import DealsBanner from './DealsBanner';
import RestaurantCard from './RestaurantCard';
import { useCart } from '@/context/CartContext';
import { useRouter } from "next/navigation";

export default function HomeView() {
  const { 
    searchQuery, 
    setSearchQuery, 
    deliveryMode, 
    setDeliveryMode, 
    setIsScheduleOpen, 
    scheduledTime 
  } = useCart();

  const [activeCategory, setActiveCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good Morning');

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
  const router = useRouter();

  // 1. Fetching & Greeting Logic
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/restaurants`);
        if (res.ok) {
          const data = await res.json();
          setRestaurants(data);
        }
      } catch (err) {
        console.error("Failed to fetch restaurants:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    const h = new Date().getHours();
    if (h < 12) setGreeting('Good Morning');
    else if (h < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, [API_BASE]);

  // 2. Memoized Filtering with Rating logic
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(r => {
      // Category Filter: categoryType or 'Top Rated' (Rating > 4.5)
      const matchCat = activeCategory === 'All' || 
                       (activeCategory === 'Top Rated' ? parseFloat(r.Rating) >= 4.5 : r.categoryName === activeCategory);

      const searchLower = searchQuery.toLowerCase();
      
      // Search Filter: matches Name OR any MenuItem Name
      const matchSearch =
        r.Name?.toLowerCase().includes(searchLower) ||
        (r.menuItems && r.menuItems.some(item =>
          item.ItemName?.toLowerCase().includes(searchLower)
        ));

      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery, restaurants]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

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

      {/* Hero Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
            {greeting}, <span className="text-orange-500">Alex</span>
            <span className="inline-block animate-wave ml-2 origin-bottom-right">👋</span>
          </h1>
          <p className="text-gray-500 text-lg font-medium">Ready to bite into something new?</p>
        </div>
      </section>

      <DealsBanner />

      {/* Main List Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Popular Nearby</h2>
          <Button variant="ghost" className="text-orange-500 font-black uppercase text-xs tracking-widest hover:bg-orange-50">
            See All <ChevronRight size={16} className="ml-1" />
          </Button>
        </div>

        <Categories activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={44} />
            <p className="text-gray-400 font-black animate-pulse uppercase tracking-widest">Finding the best bites...</p>
          </div>
        ) : filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-4">
            {filteredRestaurants.map(res => (
              <div
                key={res.RestaurantID}
                onClick={() => router.push(`/restaurants/${res.RestaurantID}`)}
                className="cursor-pointer"
              >
                <RestaurantCard
                  restaurant={res}
                  isFavorite={favorites.includes(res.RestaurantID)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <XCircle size={64} className="text-gray-200 mb-6" />
            <h3 className="text-2xl font-black text-gray-900">No Bites Found</h3>
            <p className="text-gray-500 mt-2 font-medium max-w-xs">
              We couldn't find anything matching "{searchQuery}" in {activeCategory}.
            </p>
            <Button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
              className="mt-8 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-4 rounded-2xl shadow-lg"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}