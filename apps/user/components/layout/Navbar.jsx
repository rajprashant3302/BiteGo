'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Zap, 
  ChevronDown, 
  Loader2, 
  Utensils, 
  Star, 
  MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import BiteGoLogo from '@/components/layout/BiteGoLogo';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    searchQuery, setSearchQuery,
    cartCount, cartTotal,
    user,
    status
  } = useCart();

  // 1. SEARCH LOGIC: Fetch from Elasticsearch Service via FastAPI
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);

      try {
        const response = await fetch(`http://localhost:8001/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await response.json();
        setResults(json.data || []);
      } catch (err) {
        console.error("Search API Error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // 2. UI LOGIC: Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-[80] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

        {/* --- Logo Section --- */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <BiteGoLogo size={160} className="group-hover:scale-105 transition-transform duration-300" />
          <div className="hidden lg:flex flex-col">
            <span className="font-black text-2xl tracking-tight text-gray-900 leading-none">
              Bite<span className="text-orange-500">Go</span>
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
              Food & Delivery
            </span>
          </div>
        </Link>

        {/* --- Desktop Search Section --- */}
        <div className="hidden md:flex items-center flex-1 max-w-lg mx-8 relative" ref={dropdownRef}>
          <div className="relative w-full group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {isSearching ? (
                <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
              ) : (
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              placeholder="Search for restaurants or dishes..."
              className="w-full pl-12 pr-4 py-3 bg-gray-100/80 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl outline-none transition-all duration-300 text-sm font-bold text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* ── SEARCH DROPDOWN ── */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
              >
                <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                  {/* Results Header */}
                  {results.length > 0 && (
                    <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-50 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Suggestions</span>
                      <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                        {results.length} results
                      </span>
                    </div>
                  )}

                  <div className="p-2">
                    {results.length > 0 ? (
                      results.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setShowDropdown(false);
                            const path = item.type === 'RESTAURANT' ? `/restaurant/${item.id}` : `/item/${item.id}`;
                            router.push(path);
                          }}
                          className="w-full flex items-center gap-4 p-3 hover:bg-orange-50/50 rounded-2xl transition-all duration-200 text-left group"
                        >
                          {/* Dynamic Icon Icon */}
                          <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            item.type === 'RESTAURANT' ? "bg-orange-100 text-orange-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {item.type === 'RESTAURANT' ? <Utensils size={20} /> : <Zap size={20} />}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">
                                {item.name}
                              </h4>
                              {item.price && (
                                <span className="text-xs font-black text-gray-900 pl-2 tracking-tighter">₹{item.price}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.type === 'RESTAURANT' ? (
                                <>
                                  <div className="flex items-center text-orange-500 font-bold text-[10px]">
                                    <Star size={10} className="fill-orange-500 mr-0.5" />
                                    {item.rating || 'New'}
                                  </div>
                                  <span className="h-1 w-1 rounded-full bg-gray-300" />
                                  <span className="text-[10px] text-gray-500 font-bold truncate uppercase tracking-tight">
                                    {item.category}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-gray-500 font-bold italic truncate">
                                    {item.restaurant_name}
                                  </span>
                                  {item.isVeg && (
                                    <div className="flex items-center justify-center border border-green-600 p-[1.5px] rounded-sm ml-1">
                                      <div className="h-1 w-1 rounded-full bg-green-600" />
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : !isSearching && (
                      <div className="py-12 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Search size={24} className="text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-sm">No results found</h3>
                        <p className="text-xs text-gray-500 mt-1">Try searching for 'Pizza' or 'Burger'</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* --- Right Side Actions --- */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          {/* User Profile */}
          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="h-10 w-10 rounded-2xl bg-gray-100 animate-pulse" />
            ) : status === 'authenticated' ? (
              <button 
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 p-1 pr-3 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-100"
              >
                <div className="relative h-10 w-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                  <img
                    src={user.profilePic || 'https://via.placeholder.com/100'}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="hidden xl:flex flex-col items-start">
                  <span className="text-[11px] font-black text-gray-900 leading-none truncate max-w-[70px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter mt-0.5">
                    {user.role}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
              </button>
            ) : (
              <Button variant="ghost" size="icon" className="bg-gray-50 rounded-2xl hover:bg-gray-100" onClick={() => router.push('/login')}>
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Cart Button */}
          <Button
            variant="dark"
            className="rounded-2xl pl-4 pr-5 h-12 gap-3 shadow-xl shadow-gray-200 group relative overflow-hidden"
            onClick={() => router.push('/cart')}
          >
            <div className="relative z-10">
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div
                    key={cartCount}
                    initial={{ scale: 0, y: 5 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0 }}
                    className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-lg flex items-center justify-center border-2 border-gray-900"
                  >
                    {cartCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="hidden sm:inline font-black uppercase text-[11px] tracking-widest relative z-10">
              ₹{cartTotal.toFixed(0)}
            </span>
            <div className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10" />
          </Button>

        </div>
      </div>
    </header>
  );
}