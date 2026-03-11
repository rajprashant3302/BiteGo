'use client';

<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { Search, ShoppingBag, User, Zap, Clock, ChevronDown, Loader2, Utensils } from 'lucide-react';
=======
import { Search, ShoppingBag, User, ChevronDown } from 'lucide-react';
>>>>>>> 741a5b43f435e83ea4d7bd27a171591baeebd18f
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/cn';
import Button from '@/components/ui/Button';
import BiteGoLogo from '@/components/layout/BiteGoLogo';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
<<<<<<< HEAD
  const dropdownRef = useRef(null);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

=======
>>>>>>> 741a5b43f435e83ea4d7bd27a171591baeebd18f
  const {
    searchQuery, setSearchQuery,
    cartCount, cartTotal,
    user,
    status
  } = useCart();

  // 1. SEARCH LOGIC: Fetch from Elasticsearch Service
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      setShowDropdown(true);

      try {
        const response = await fetch(`http://localhost:8001/search?q=${searchQuery}`);
        const json = await response.json();
        setResults(json.data || []);
      } catch (err) {
        console.error("Search API Error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close dropdown when clicking outside
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
    <header className="sticky top-0 z-[80] w-full bg-white/80 md:bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">

        {/* Logo Section */}
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

        {/* Desktop Search Section with Dropdown */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative" ref={dropdownRef}>
          <div className="relative w-full group">
            {isSearching ? (
              <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 animate-spin" />
            ) : (
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              placeholder="Hungry for sushi? Search here..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 border-2 border-transparent focus:border-orange-500/30 focus:bg-white rounded-2xl outline-none transition-all duration-300 text-sm font-semibold text-gray-800"
            />
          </div>

          {/* ── RESULTS DROPDOWN ── */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
              >
                <div className="max-h-[400px] overflow-y-auto p-2">
                  {results.length > 0 ? (
                    results.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowDropdown(false);
                          router.push(`/menu/${item.id}`); // Navigates to item
                        }}
                        className="w-full flex items-center gap-4 p-3 hover:bg-orange-50 rounded-xl transition-colors text-left group"
                      >
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-orange-500">
                          <Utensils size={20} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm group-hover:text-orange-600 transition-colors">
                              {item.name}
                            </span>
                            <span className="text-xs font-black text-gray-400 italic">₹{item.price}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1 italic">{item.restaurant_name}</p>
                          {item.isVeg && (
                             <span className="text-[9px] font-bold text-green-600 border border-green-200 px-1 rounded uppercase tracking-tighter">Veg</span>
                          )}
                        </div>
                      </button>
                    ))
                  ) : !isSearching && (
                    <div className="p-8 text-center">
                      <p className="text-sm font-bold text-gray-400">No bites found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-4">
          
          {/* ── USER PROFILE SECTION ── */}
          <div className="flex items-center gap-3 pl-2 border-gray-100 ml-2">
            {status === 'loading' ? (
              <div className="h-10 w-10 rounded-2xl bg-gray-100 animate-pulse" />
            ) : status === 'authenticated' ? (
              <button 
                onClick={() => router.push('/settings')}
                className="flex items-center gap-3 p-1 pr-3 hover:bg-gray-50 rounded-2xl transition-all group"
              >
                <div className="relative h-10 w-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm group-hover:border-orange-500/20 transition-all">
                  <img
                    src={user.profilePic}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="hidden xl:flex flex-col items-start">
                  <span className="text-[11px] font-black text-gray-900 leading-none truncate max-w-[80px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">
                    {user.role}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
              </button>
            ) : (
              <Button variant="ghost" size="icon" className="bg-gray-100 rounded-2xl" onClick={() => router.push('/login')}>
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            )}
          </div>

          <Button
            variant="dark"
            className="rounded-2xl pl-4 pr-6 h-12 gap-3 shadow-lg shadow-gray-200"
            onClick={() => router.push('/cart')}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div
                    key={cartCount}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-gray-900"
                  >
                    {cartCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="hidden sm:inline font-black uppercase text-xs tracking-widest">
              ₹{cartTotal.toFixed(0)}
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}