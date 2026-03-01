"use client"
import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, MapPin, ShoppingBag, User,
  Home, Heart, CalendarClock, ChevronDown,
  Star, Timer, ArrowRight, X, Plus, Minus, Trash2,
  Zap, Clock, Tag, ChevronRight, Gift, Percent, BadgePercent,
  CheckCircle2, UtensilsCrossed, Bike, Ticket, XCircle
} from 'lucide-react';
import { motion, AnimatePresence, px } from 'framer-motion';

// --- MOCK DATA ---
const CATEGORIES = [
  { id: 0, name: 'All', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=150&q=80', color: 'bg-gray-100' },
  { id: 1, name: 'Offers', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&q=80', color: 'bg-rose-100' },
  { id: 2, name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80', color: 'bg-orange-100' },
  { id: 3, name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&q=80', color: 'bg-green-100' },
  { id: 4, name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80', color: 'bg-yellow-100' },
  { id: 5, name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80', color: 'bg-red-100' },
  { id: 6, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=150&q=80', color: 'bg-pink-100' },
];

const RESTAURANTS = [
  {
    id: 1,
    name: 'The Rustic Oven',
    tags: ['Pizza', 'Italian'],
    rating: 4.8,
    time: '25-35 min',
    price: 24.99,
    priceRange: '$$',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
    featured: true,
    offer: '20% off above $499',
    offerCode: 'RUSTIC20',
  },
  {
    id: 2,
    name: 'Green Bowl Life',
    tags: ['Healthy', 'Salads'],
    rating: 4.9,
    time: '15-25 min',
    price: 18.50,
    priceRange: '$$$',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    featured: false,
    offer: 'Free delivery today',
    offerCode: null,
  },
  {
    id: 3,
    name: 'Smash Burger Co.',
    tags: ['Burgers', 'American'],
    rating: 4.5,
    time: '30-40 min',
    price: 15.99,
    priceRange: '$',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    featured: false,
    offer: 'Buy 1 Get 1 Free',
    offerCode: 'BOGO',
  },
  {
    id: 4,
    name: 'Tokyo Drift Sushi',
    tags: ['Japanese', 'Sushi'],
    rating: 4.7,
    time: '40-50 min',
    price: 32.00,
    priceRange: '$$$',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
    featured: false,
    offer: '15% off first order',
    offerCode: 'TOKYO15',
  },
];

const DEALS = [
  {
    id: 'd1',
    title: '50% OFF up to $10',
    subtitle: 'On your first 3 orders',
    code: 'WELCOME50',
    icon: Gift,
    gradient: 'from-orange-500 to-rose-500',
    expiry: 'Ends tonight',
    discount: { type: 'percent', value: 50, max: 10 }
  },
  {
    id: 'd2',
    title: 'Free Delivery',
    subtitle: 'All weekend long on any order',
    code: 'FREEDEL',
    icon: Zap,
    gradient: 'from-violet-500 to-indigo-500',
    expiry: 'Ends Sunday',
    discount: { type: 'fixed', value: 2.99 }
  },
  {
    id: 'd3',
    title: '30% OFF Healthy',
    subtitle: 'On all Green Bowl items',
    code: 'EAT30',
    icon: Percent,
    gradient: 'from-emerald-500 to-teal-500',
    expiry: 'Limited time',
    discount: { type: 'percent', value: 30 }
  },
];

const SCHEDULE_TIMES = [
  '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM',  '2:00 PM',  '6:00 PM',
  '7:00 PM',  '8:00 PM',  '9:00 PM',
];

const cn = (...classes) => classes.filter(Boolean).join(' ');

// --- LOGO COMPONENT ---
// Corrected the path with forward slashes and updated extension to .png
const BiteGoLogo = ({ size = 100, className }) => (
  <div style={{ width: size,height: size }} className={cn("relative overflow-hidden shrink-0", className)}>
    <img 
      src="/bitego-logo-complete (2).svg"
      alt="BiteGo Logo" 
      className="w-full h-full object-contain"
      onError={(e) => {
        // Fallback to a simple colored box if image is missing
        e.target.style.display = 'none';
        e.target.parentNode.className += ' bg-orange-500 rounded-xl flex items-center justify-center';
        e.target.parentNode.innerHTML = '<span class="text-white font-black text-xl">B</span>';
      }}
    />
  </div>
);

const Button = ({ variant = 'default', size = 'default', className, children, ...props }) => {
  const base = "inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95";
  const variants = {
    default: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
    ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
    outline: "border border-gray-200 bg-white hover:bg-gray-100 text-gray-900",
    dark: "bg-gray-900 text-white hover:bg-black",
  };
  const sizes = {
    default: "h-11 px-6 rounded-2xl",
    icon: "h-10 w-10 rounded-full",
    sm: "h-9 rounded-xl px-4 text-sm",
    lg: "h-14 px-8 rounded-2xl text-lg",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
};

// ─── SCHEDULE MODAL ───────────────────────────────────
const ScheduleModal = ({ open, onClose, onConfirm }) => {
  const [selectedDate, setSelectedDate] = useState('Today');
  const [selectedTime, setSelectedTime] = useState(null);
  const days = ['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri'];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[110] bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Schedule Delivery</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Get it right when you need it</p>
              </div>
              <button onClick={onClose} className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">Select Day</p>
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
              {days.map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    'flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black transition-all border-2',
                    selectedDate === d
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">Select Time Window</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {SCHEDULE_TIMES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={cn(
                    'py-4 rounded-2xl text-sm font-black transition-all border-2',
                    selectedTime === t
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              onClick={() => {
                if (selectedTime) {
                  onConfirm({ date: selectedDate, time: selectedTime });
                  onClose();
                }
              }}
              disabled={!selectedTime}
              className="w-full h-16 rounded-[24px] text-lg mb-4"
            >
              {selectedTime ? `Deliver ${selectedDate} at ${selectedTime}` : 'Pick a time'}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── MAIN APP ─────────────────────────────────────────
export default function App() {
  const [location, setLocation] = useState('/');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [deliveryMode, setDeliveryMode] = useState('quick'); // 'quick' | 'scheduled'
  const [scheduledTime, setScheduledTime] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isOrdered, setIsOrdered] = useState(false);
  
  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Feature states for the "Add" notification
  const [lastAddedRestaurant, setLastAddedRestaurant] = useState(null);
  const [showAddToast, setShowAddToast] = useState(false);

  // Sync delivery mode when a time is picked
  const handleScheduleConfirm = (val) => {
    setScheduledTime(val);
    setDeliveryMode('scheduled');
  };

  const addToCart = (restaurant) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === restaurant.id);
      if (existing) return prev.map(item => item.id === restaurant.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...restaurant, quantity: 1 }];
    });
    
    // Feature implementation: Show one-line toast
    setLastAddedRestaurant(restaurant);
    setShowAddToast(true);
  };

  // Scroll listener to hide toast on movement
  useEffect(() => {
    const handleScroll = () => {
      if (showAddToast) setShowAddToast(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAddToast]);

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const q = Math.max(1, item.quantity + delta);
      return { ...item, quantity: q };
    }));
  };

  // Coupon Logic
  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.toUpperCase().trim();
    if (!code) return;

    const foundDeal = DEALS.find(d => d.code === code);
    if (foundDeal) {
      setAppliedCoupon(foundDeal);
      setCouponInput('');
    } else {
      setCouponError('Invalid or expired coupon code');
    }
  };

  const removeCoupon = () => setAppliedCoupon(null);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = deliveryMode === 'scheduled' ? 0 : 2.99;
  
  // Discount Calculation
  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const { discount } = appliedCoupon;
    if (discount.type === 'percent') {
      const calculated = (cartSubtotal * discount.value) / 100;
      return discount.max ? Math.min(calculated, discount.max) : calculated;
    }
    if (discount.type === 'fixed') {
        // Handle special "Free delivery" coupon case
        if (appliedCoupon.code === 'FREEDEL') return deliveryFee;
        return discount.value;
    }
    return 0;
  }, [appliedCoupon, cartSubtotal, deliveryFee]);

  const cartTotal = Math.max(0, cartSubtotal + deliveryFee - discountAmount);

  const lastRestaurant = cartItems.length > 0 ? cartItems[cartItems.length - 1] : null;

  const copyCode = (code) => {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCheckout = () => {
    setIsOrdered(true);
    setTimeout(() => {
        setIsOrdered(false);
        setCartItems([]);
        setIsCartOpen(false);
        setAppliedCoupon(null);
        setLocation('/');
    }, 3000);
  };

  const Link = ({ href, children, className, onClick }) => (
    <a href={href} className={className} onClick={(e) => { 
        e.preventDefault(); 
        setLocation(href); 
        if (onClick) onClick(e); 
        window.scrollTo(0, 0);
    }}>
      {children}
    </a>
  );

  // ── NAVBAR ────────────────────────────────────────
  const Navbar = () => (
    <header className="sticky top-0 z-[80] w-full bg-white/80 md:bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <BiteGoLogo size={160} className="group-hover:scale-110 transition-transform duration-300" />
          <div className="hidden sm:flex flex-col -gap-1">
            <span className="font-black text-2xl tracking-tight text-gray-900 leading-none">
              Bite<span className="text-orange-500">Go</span>
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Food & Delivery</span>
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
            <span className="hidden sm:inline font-black uppercase text-xs tracking-widest">${cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      </div>
    </header>
  );

  // ── CART SIDEBAR ─────────────────────────────────
  const CartSidebar = () => (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] cursor-pointer"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220, bounce: 0 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  Your Order <ShoppingBag className="text-orange-500" />
                </h2>
                {lastRestaurant && <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">From {lastRestaurant.name}</p>}
              </div>
              <Button variant="ghost" size="icon" className="bg-gray-100" onClick={() => setIsCartOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gray-200" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Your cart is empty</h3>
                    <p className="text-gray-400 text-sm max-w-[240px] mt-2 font-medium">Add some tasty items to start your food journey.</p>
                  </div>
                  <Button variant="outline" onClick={() => setIsCartOpen(false)}>Explore Menu</Button>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
                        <div className="flex items-center gap-3">
                            {deliveryMode === 'quick' ? <Zap className="text-orange-500" size={18} /> : <Clock className="text-orange-500" size={18} />}
                            <span className="text-sm font-black text-orange-900">
                                {deliveryMode === 'quick' ? 'Quick Delivery (25-35 min)' : `Scheduled: ${scheduledTime?.time}`}
                            </span>
                        </div>
                        <button onClick={() => setIsScheduleOpen(true)} className="text-xs font-black text-orange-500 uppercase tracking-wider hover:underline">Change</button>
                   </div>

                  {cartItems.map(item => (
                    <motion.div layout key={item.id} className="flex gap-4 group">
                      <img src={item.image} alt={item.name} className="w-24 h-24 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100" />
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-black text-gray-900 leading-tight mb-1">{item.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-orange-500 font-black text-sm">${item.price.toFixed(2)}</span>
                            {item.offer && <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">{item.offer}</span>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-orange-500 transition-colors"><Minus size={16} /></button>
                            <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-orange-500 transition-colors"><Plus size={16} /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Coupon Section */}
                  <div className="pt-6 border-t border-gray-100 space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Coupons & Offers</p>
                    <AnimatePresence mode="wait">
                        {appliedCoupon ? (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-2xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                        <Tag size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-green-800 tracking-tight">{appliedCoupon.code}</p>
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Coupon Applied</p>
                                    </div>
                                </div>
                                <button onClick={removeCoupon} className="p-2 text-green-700 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="relative flex flex-col gap-2"
                            >
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="text" 
                                            value={couponInput}
                                            onChange={(e) => {
                                                setCouponInput(e.target.value);
                                                if (couponError) setCouponError('');
                                            }}
                                            placeholder="Enter Promo Code"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-orange-500 outline-none transition-all uppercase tracking-widest"
                                        />
                                    </div>
                                    <Button onClick={handleApplyCoupon} size="sm" className="h-auto px-6">Apply</Button>
                                </div>
                                {couponError && (
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 flex items-center gap-1">
                                        <XCircle size={12} /> {couponError}
                                    </p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-gray-500 font-bold text-sm">
                        <span>Items Subtotal</span><span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 font-bold text-sm">
                        <span>Delivery Fee</span>
                        <span className={deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'text-green-600' : ''}>
                            {deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                        </span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600 font-black text-sm">
                            <span className="flex items-center gap-1.5"><BadgePercent size={16}/> Discount Applied</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t border-gray-200/50">
                  <span>Total</span>
                  <span className="text-orange-500">${cartTotal.toFixed(2)}</span>
                </div>
                <Button 
                    className="w-full h-16 text-lg rounded-[24px] shadow-xl shadow-orange-500/20" 
                    onClick={handleCheckout}
                    disabled={isOrdered}
                >
                  {isOrdered ? <span className="flex items-center gap-2"><CheckCircle2 className="animate-bounce" /> Processing...</span> : 'Place Order'}
                </Button>
                <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-[0.1em]">By ordering you agree to our Terms of Service</p>
              </div>
            )}
          </motion.div>

          {/* Checkout Success Overlay */}
          <AnimatePresence>
            {isOrdered && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[120] bg-orange-500 flex flex-col items-center justify-center text-white p-6 text-center"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-2xl">
                        <Bike size={48} className="text-orange-500" />
                    </div>
                </motion.div>
                <h2 className="text-4xl font-black mb-4">Order Placed!</h2>
                <p className="text-orange-100 font-bold text-lg mb-8">Alex, your delicious food is on its way.</p>
                <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.8 }}
                        className="bg-white h-full"
                    />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  // ── HOME VIEW ─────────────────────────────────────
  const HomeView = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [favorites, setFavorites] = useState([]);

    const greeting = useMemo(() => {
      const h = new Date().getHours();
      if (h < 12) return 'Good Morning';
      if (h < 18) return 'Good Afternoon';
      return 'Good Evening';
    }, []);

    const toggleFavorite = (e, id) => {
      e.stopPropagation();
      setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    };

    const filteredRestaurants = useMemo(() => RESTAURANTS.filter(r => {
      const matchCat = activeCategory === 'All' || r.tags.includes(activeCategory) || (activeCategory === 'Offers' && (r.featured || r.offer));
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    }), [activeCategory, searchQuery]);

    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-32 md:pb-12 space-y-12 overflow-hidden">
        
        {/* Mobile search bar */}
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

        {/* Hero Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
              {greeting}, <span className="text-orange-500">Alex</span>
              <span className="inline-block animate-wave ml-2 origin-bottom-right">👋</span>
            </h1>
            <p className="text-gray-500 text-lg font-medium">Ready to bite into something new?</p>
          </div>

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

        {/* Categories */}
        <section>
          <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-8 hide-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={cn(
                    'flex flex-col items-center gap-3 shrink-0 cursor-pointer group select-none',
                    isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  )}
                >
                  <div className={cn(
                    'w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] overflow-hidden transition-all duration-300 shadow-xl p-1 relative',
                    cat.color,
                    isActive ? 'ring-4 ring-orange-500 ring-offset-4' : 'ring-4 ring-transparent'
                  )}>
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-[28px]" />
                  </div>
                  <span className={cn(
                    'font-black text-xs uppercase tracking-widest transition-colors',
                    isActive ? 'text-orange-600' : 'text-gray-500'
                  )}>{cat.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Promo Banner */}
        <section>
             <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                {DEALS.map(deal => {
                  const Icon = deal.icon;
                  const isCopied = copiedCode === deal.code;
                  return (
                    <motion.div
                      whileHover={{ y: -4 }}
                      key={deal.id}
                      className="relative flex-shrink-0 w-[280px] sm:w-[320px] rounded-[32px] overflow-hidden cursor-pointer select-none group shadow-lg"
                      onClick={() => copyCode(deal.code)}
                    >
                      <div className={cn('absolute inset-0 bg-gradient-to-br', deal.gradient)} />
                      <div className="absolute inset-0 bg-black/5" />
                      <div className="relative p-7 h-full flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-start">
                             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                                <Icon size={24} className="text-white" />
                             </div>
                             <span className="text-[10px] font-black text-white/80 bg-black/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                                {deal.expiry}
                             </span>
                        </div>
                        <div>
                             <h3 className="text-white font-black text-2xl leading-tight mb-1">{deal.title}</h3>
                             <p className="text-white/80 text-sm font-bold">{deal.subtitle}</p>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 group-hover:bg-white/25 transition-all">
                             <span className="text-white font-black tracking-[0.2em] text-sm uppercase">{deal.code}</span>
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

        {/* Restaurants Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Popular Nearby</h2>
            <Button variant="ghost" className="text-orange-500 font-black uppercase text-xs tracking-widest hover:bg-orange-50">
                See All <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredRestaurants.map((res) => (
              <motion.div
                layout
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex flex-col bg-white rounded-[32px] overflow-hidden border-2 border-gray-100/50 shadow-sm hover:shadow-2xl hover:border-orange-500/10 transition-all duration-500 hover:-translate-y-2 h-full"
              >
                <div className="relative h-56 overflow-hidden">
                  <img src={res.image} alt={res.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <button 
                    onClick={(e) => toggleFavorite(e, res.id)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"
                  >
                    <Heart size={20} className={cn('transition-colors', favorites.includes(res.id) ? 'fill-red-500 text-red-500' : 'text-gray-400')} />
                  </button>

                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black text-gray-900 flex items-center gap-1.5 shadow-sm border border-gray-100">
                        <Timer size={13} className="text-orange-500" /> {res.time}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-xl text-gray-900 leading-tight group-hover:text-orange-500 transition-colors line-clamp-1">{res.name}</h3>
                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
                        <Star size={12} className="fill-current" /> {res.rating}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">{res.tags.join(' • ')} • {res.priceRange}</p>

                  {res.offer && (
                    <div className="bg-orange-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-orange-100 mb-6">
                        <BadgePercent className="text-orange-500" size={18} />
                        <span className="text-xs font-black text-orange-900 line-clamp-1">{res.offer}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Starts at</span>
                        <span className="text-2xl font-black text-gray-900">${res.price.toFixed(2)}</span>
                    </div>
                    <Button 
                        size="icon" 
                        onClick={() => addToCart(res)}
                        className="w-12 h-12 rounded-2xl shadow-lg shadow-orange-500/20"
                    >
                        <Plus size={20} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    );
  };

  // ── FOOTER & MOBILE NAV ──────────────────────────
  const BottomNav = () => {
    const navItems = [
      { icon: Home, label: 'Home', href: '/' },
      { icon: Search, label: 'Search', href: '/search' },
      { icon: ShoppingBag, label: 'Order', onClick: () => setIsCartOpen(true), badge: cartCount },
      { icon: Heart, label: 'Saved', href: '/saved' },
      { icon: User, label: 'Account', href: '/profile' },
    ];

    return (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-[32px] p-2 flex items-center justify-around shadow-2xl shadow-black/20 border border-white/10">
                {navItems.map((item, idx) => {
                    const isActive = location === item.href;
                    const Icon = item.icon;
                    return (
                        <button
                            key={idx}
                            onClick={() => item.onClick ? item.onClick() : setLocation(item.href)}
                            className={cn(
                                'relative flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300',
                                isActive ? 'text-orange-500 scale-110' : 'text-gray-400 hover:text-white'
                            )}
                        >
                            <div className="relative">
                                <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                {item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-gray-900">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 flex flex-col selection:bg-orange-100">
      <Navbar />
      <CartSidebar />

      {/* Floating Add Toast - Positioned above the bottom panel */}
      <AnimatePresence>
        {showAddToast && lastAddedRestaurant && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-28 left-0 right-0 z-[150] flex justify-center px-4 pointer-events-none"
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

      <div className="flex-1">
        {location === '/' ? <HomeView /> : (
            <div className="py-40 flex flex-col items-center justify-center text-center px-6">
                <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 border-2 border-gray-100">
                    <Search className="text-gray-200" size={40} />
                </div>
                <h2 className="text-3xl font-black mb-4">Under Construction</h2>
                <p className="text-gray-400 font-medium max-w-sm">We're cooking up something great for {location}. Check back soon!</p>
                <Button className="mt-10 h-14 px-10" onClick={() => setLocation('/')}>Return Home</Button>
            </div>
        )}
      </div>

      <footer className="bg-white border-t border-gray-100 py-16 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
                 <div className="flex items-center gap-4">
                    <BiteGoLogo size={160} />
                    <div className="flex flex-col -gap-1">
                      <span className="font-black text-3xl tracking-tight text-gray-900 italic">BiteGo</span>
                      <span className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">Food & Delivery</span>
                    </div>
                </div>
                <p className="text-gray-400 font-medium text-lg max-w-sm leading-relaxed">Delicious meals from your local favorites, delivered to your door or scheduled for later.</p>
            </div>
            <div>
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 mb-6">Discover</h4>
                <ul className="space-y-4 text-gray-500 font-bold text-sm">
                    <li><a href="#" className="hover:text-orange-500">Trending Now</a></li>
                    <li><a href="#" className="hover:text-orange-500">BiteGo Points</a></li>
                    <li><a href="#" className="hover:text-orange-500">Gift Cards</a></li>
                </ul>
            </div>
            <div>
                <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 mb-6">Support</h4>
                <ul className="space-y-4 text-gray-500 font-bold text-sm">
                    <li><a href="#" className="hover:text-orange-500">Help Center</a></li>
                    <li><a href="#" className="hover:text-orange-500">Become a Driver</a></li>
                    <li><a href="#" className="hover:text-orange-500">Privacy Policy</a></li>
                </ul>
            </div>
        </div>
      </footer>

      <BottomNav />
      <ScheduleModal open={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} onConfirm={handleScheduleConfirm} />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
        .animate-wave { animation: wave 2.5s infinite; transform-origin: 70% 70%; }

        /* Smooth scroll across all sections */
        * { scroll-behavior: smooth; }
      `}} />
    </div>
  );
}