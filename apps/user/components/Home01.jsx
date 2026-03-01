// "use client"
// import React, { useState, useEffect, useMemo } from 'react';
// import { 
//   Search, MapPin, ShoppingBag, User, 
//   Home, Heart, CalendarClock, ChevronDown, 
//   Star, Timer, ArrowRight, X, Plus, Minus, Trash2
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// // --- MOCK DATA ---
// const CATEGORIES = [
//   { id: 0, name: 'All', image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=150&q=80', color: 'bg-gray-100' },
//   { id: 1, name: 'Offers', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&q=80', color: 'bg-rose-100' },
//   { id: 2, name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80', color: 'bg-orange-100' },
//   { id: 3, name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&q=80', color: 'bg-green-100' },
//   { id: 4, name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80', color: 'bg-yellow-100' },
//   { id: 5, name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80', color: 'bg-red-100' },
//   { id: 6, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=150&q=80', color: 'bg-pink-100' },
// ];

// const RESTAURANTS = [
//   {
//     id: 1,
//     name: 'The Rustic Oven',
//     tags: ['Pizza', 'Italian'],
//     rating: 4.8,
//     time: '25-35 min',
//     price: 24.99,
//     priceRange: '$$',
//     image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&q=80',
//     featured: true,
//   },
//   {
//     id: 2,
//     name: 'Green Bowl Life',
//     tags: ['Healthy', 'Salads'],
//     rating: 4.9,
//     time: '15-25 min',
//     price: 18.50,
//     priceRange: '$$$',
//     image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
//     featured: false,
//   },
//   {
//     id: 3,
//     name: 'Smash Burger Co.',
//     tags: ['Burgers', 'American'],
//     rating: 4.5,
//     time: '30-40 min',
//     price: 15.99,
//     priceRange: '$',
//     image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
//     featured: false,
//   },
//   {
//     id: 4,
//     name: 'Tokyo Drift Sushi',
//     tags: ['Japanese', 'Sushi'],
//     rating: 4.7,
//     time: '40-50 min',
//     price: 32.00,
//     priceRange: '$$$',
//     image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800&q=80',
//     featured: false,
//   },
// ];

// // --- UTILS & UI COMPONENTS ---
// const cn = (...classes) => classes.filter(Boolean).join(' ');

// const Button = ({ variant = 'default', size = 'default', className, children, ...props }) => {
//   const baseStyle = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50";
//   const variants = {
//     default: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
//     ghost: "hover:bg-gray-100 hover:text-gray-900 text-gray-600",
//     outline: "border border-gray-200 bg-white hover:bg-gray-100 text-gray-900"
//   };
//   const sizes = {
//     default: "h-10 px-4 py-2 rounded-xl",
//     icon: "h-10 w-10 rounded-full",
//     sm: "h-8 rounded-lg px-3 text-xs"
//   };
  
//   return (
//     <button className={cn(baseStyle, variants[variant], sizes[size], className)} {...props}>
//       {children}
//     </button>
//   );
// };

// // --- MAIN APP COMPONENT ---
// export default function App() {
//   // Global App State (Simulating wouter & store)
//   const [location, setLocation] = useState('/');
//   const [searchQuery, setSearchQuery] = useState('');
  
//   // Cart State (Simulating useCart)
//   const [isCartOpen, setIsCartOpen] = useState(false);
//   const [cartItems, setCartItems] = useState([]);
  
//   const addToCart = (restaurant) => {
//     setCartItems(prev => {
//       const existing = prev.find(item => item.id === restaurant.id);
//       if (existing) {
//         return prev.map(item => item.id === restaurant.id ? { ...item, quantity: item.quantity + 1 } : item);
//       }
//       return [...prev, { ...restaurant, quantity: 1 }];
//     });
//     // Optional: open cart when item added
//     // setIsCartOpen(true); 
//   };

//   const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));
//   const updateQuantity = (id, delta) => {
//     setCartItems(prev => prev.map(item => {
//       if (item.id === id) {
//         const newQuantity = Math.max(1, item.quantity + delta);
//         return { ...item, quantity: newQuantity };
//       }
//       return item;
//     }));
//   };

//   const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
//   const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

//   // Mock Link Component
//   const Link = ({ href, children, className, onClick }) => (
//     <a 
//       href={href} 
//       className={className} 
//       onClick={(e) => { 
//         e.preventDefault(); 
//         setLocation(href); 
//         if (onClick) onClick(e); 
//       }}
//     >
//       {children}
//     </a>
//   );

//   // --- SUB-COMPONENTS ---
//   const Navbar = () => (
//     <header className="sticky top-0 z-40 w-full bg-white/80 md:bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
//       <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
//         <Link href="/" className="flex items-center gap-2 group">
//           <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
//             <span className="text-white font-black text-xl leading-none">B</span>
//           </div>
//           <span className="font-black text-2xl tracking-tight text-gray-900">
//             Bite<span className="text-orange-500">Go</span>
//           </span>
//         </Link>

//         {/* Desktop Search Bar */}
//         <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
//           <div className="relative w-full group">
//             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-orange-500 transition-colors">
//               <Search className="h-5 w-5" />
//             </div>
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search for restaurants, cuisines..."
//               className="w-full pl-12 pr-4 py-3 bg-gray-100 border-2 border-transparent focus:border-orange-500/30 focus:bg-white rounded-2xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
//             />
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <Button variant="ghost" size="icon" className="hidden md:flex">
//             <User className="h-5 w-5" />
//           </Button>
          
//           <Button 
//             variant="default" 
//             className="rounded-full pl-4 pr-5 h-12 gap-3 relative"
//             onClick={() => setIsCartOpen(true)}
//           >
//             <div className="relative">
//               <ShoppingBag className="h-5 w-5" />
//               <AnimatePresence>
//                 {cartCount > 0 && (
//                   <motion.div 
//                     initial={{ scale: 0 }}
//                     animate={{ scale: 1 }}
//                     exit={{ scale: 0 }}
//                     key={cartCount}
//                     className="absolute -top-2 -right-2 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white"
//                   >
//                     {cartCount}
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//             <span className="hidden sm:inline font-semibold">Cart</span>
//           </Button>
//         </div>
//       </div>
//     </header>
//   );

//   const BottomNav = () => {
//     const navItems = [
//       { icon: Home, label: "Home", href: "/" },
//       { icon: Search, label: "Search", href: "/search" },
//       { 
//         icon: ShoppingBag, 
//         label: "Cart", 
//         onClick: () => setIsCartOpen(true),
//         badge: cartCount > 0 ? cartCount : null 
//       },
//       { icon: User, label: "Profile", href: "/profile" },
//     ];

//     return (
//       <div className="md:hidden fixed bottom-6 left-4 right-4 z-40">
//         <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-2 flex items-center justify-around shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100">
//           {navItems.map((item, idx) => {
//             const isActive = location === item.href;
//             const Icon = item.icon;
            
//             const content = (
//               <div className="relative flex flex-col items-center gap-1 p-2 w-16">
//                 <div className={cn(
//                   "relative transition-all duration-300 p-2 rounded-2xl",
//                   isActive ? "text-orange-500 bg-orange-50 scale-110" : "text-gray-400 hover:text-gray-900"
//                 )}>
//                   <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
//                   <AnimatePresence>
//                     {item.badge && (
//                       <motion.div 
//                         initial={{ scale: 0 }}
//                         animate={{ scale: 1 }}
//                         exit={{ scale: 0 }}
//                         className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
//                       >
//                         {item.badge}
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//                 <span className={cn(
//                   "text-[10px] font-medium transition-all duration-300",
//                   isActive ? "text-orange-500" : "text-gray-400"
//                 )}>
//                   {item.label}
//                 </span>
//               </div>
//             );

//             if (item.onClick) {
//               return (
//                 <button key={idx} onClick={item.onClick} className="outline-none border-none bg-transparent">
//                   {content}
//                 </button>
//               );
//             }

//             return (
//               <Link key={idx} href={item.href || "#"} className="outline-none">
//                 {content}
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   const Footer = () => (
//     <footer className="bg-white border-t border-gray-100 mt-auto pb-24 md:pb-0">
//       <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
//           <div className="col-span-1 md:col-span-2">
//             <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
//               <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg flex items-center justify-center shadow-md">
//                 <span className="text-white font-black text-lg leading-none">B</span>
//               </div>
//               <span className="font-black text-xl tracking-tight text-gray-900">
//                 Bite<span className="text-orange-500">Go</span>
//               </span>
//             </Link>
//             <p className="text-gray-500 max-w-sm text-balance leading-relaxed text-sm">
//               Experience the future of food delivery. Fast, fresh, and perfectly scheduled to match your busy lifestyle.
//             </p>
//           </div>
          
//           <div>
//             <h4 className="font-bold text-gray-900 mb-4">Company</h4>
//             <ul className="space-y-3 text-sm text-gray-500">
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">About Us</Link></li>
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Careers</Link></li>
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Blog</Link></li>
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Contact</Link></li>
//             </ul>
//           </div>
          
//           <div>
//             <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
//             <ul className="space-y-3 text-sm text-gray-500">
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Terms of Service</Link></li>
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</Link></li>
//               <li><Link href="#" className="hover:text-orange-500 transition-colors">Cookie Policy</Link></li>
//             </ul>
//           </div>
//         </div>
        
//         <div className="mt-12 pt-8 border-t border-gray-100 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
//           <p>© {new Date().getFullYear()} BiteGo Technologies Inc. All rights reserved.</p>
//           <div className="mt-4 md:mt-0 flex gap-4">
//             <span className="hover:text-orange-500 cursor-pointer transition-colors">Twitter</span>
//             <span className="hover:text-orange-500 cursor-pointer transition-colors">Instagram</span>
//             <span className="hover:text-orange-500 cursor-pointer transition-colors">LinkedIn</span>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );

//   const CartSidebar = () => (
//     <AnimatePresence>
//       {isCartOpen && (
//         <>
//           <motion.div 
//             initial={{ opacity: 0 }} 
//             animate={{ opacity: 1 }} 
//             exit={{ opacity: 0 }}
//             onClick={() => setIsCartOpen(false)}
//             className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 cursor-pointer"
//           />
//           <motion.div 
//             initial={{ x: '100%' }}
//             animate={{ x: 0 }}
//             exit={{ x: '100%' }}
//             transition={{ type: "spring", damping: 25, stiffness: 200 }}
//             className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col"
//           >
//             <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
//               <h2 className="text-xl font-black flex items-center gap-2">
//                 <ShoppingBag className="text-orange-500" />
//                 Your Cart
//               </h2>
//               <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}>
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>
            
//             <div className="flex-1 overflow-y-auto p-6 space-y-6">
//               {cartItems.length === 0 ? (
//                 <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
//                   <ShoppingBag className="h-16 w-16 opacity-20" />
//                   <p>Your cart is looking a little empty.</p>
//                   <Button variant="outline" onClick={() => setIsCartOpen(false)}>Browse Restaurants</Button>
//                 </div>
//               ) : (
//                 cartItems.map(item => (
//                   <div key={item.id} className="flex gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
//                     <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
//                     <div className="flex-1 flex flex-col justify-between py-1">
//                       <div>
//                         <h4 className="font-bold text-gray-900 leading-tight line-clamp-1">{item.name}</h4>
//                         <p className="text-orange-500 font-semibold text-sm">${item.price.toFixed(2)}</p>
//                       </div>
//                       <div className="flex items-center justify-between mt-2">
//                         <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-2 py-1">
//                           <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-orange-500"><Minus size={14} /></button>
//                           <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
//                           <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-orange-500"><Plus size={14} /></button>
//                         </div>
//                         <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1">
//                           <Trash2 size={16} />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))
//               )}
//             </div>

//             {cartItems.length > 0 && (
//               <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
//                 <div className="flex justify-between text-gray-600 text-sm">
//                   <span>Subtotal</span>
//                   <span>${cartTotal.toFixed(2)}</span>
//                 </div>
//                 <div className="flex justify-between text-gray-600 text-sm">
//                   <span>Delivery Fee</span>
//                   <span>$2.99</span>
//                 </div>
//                 <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-200">
//                   <span>Total</span>
//                   <span>${(cartTotal + 2.99).toFixed(2)}</span>
//                 </div>
//                 <Button className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-orange-500/30 mt-4">
//                   Checkout
//                 </Button>
//               </div>
//             )}
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );

//   // --- HOME VIEW RENDERER ---
//   const HomeView = () => {
//     const [activeCategory, setActiveCategory] = useState('All');
//     const [favorites, setFavorites] = useState([]);

//     const greeting = useMemo(() => {
//       const hour = new Date().getHours();
//       if (hour < 12) return 'Good Morning';
//       if (hour < 18) return 'Good Afternoon';
//       return 'Good Evening';
//     }, []);

//     const toggleFavorite = (e, id) => {
//       e.stopPropagation();
//       setFavorites(prev => 
//         prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
//       );
//     };

//     const filteredRestaurants = useMemo(() => {
//       return RESTAURANTS.filter(restaurant => {
//         const matchesCategory = activeCategory === 'All' || restaurant.tags.includes(activeCategory) || (activeCategory === 'Offers' && restaurant.featured);
//         const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
//                               restaurant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
//         return matchesCategory && matchesSearch;
//       });
//     }, [activeCategory, searchQuery]);

//     return (
//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-12">
//         {/* Mobile Search */}
//         <div className="md:hidden relative group">
//           <input 
//             type="text" 
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             placeholder="What are you craving?" 
//             className="w-full bg-white border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-2xl py-4 pl-12 pr-4 text-base font-medium transition-all shadow-sm"
//           />
//           <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//         </div>

//         <section>
//           <h1 className="text-2xl sm:text-3xl font-black mb-6 animate-fade-in flex items-center">
//             {greeting}, <span className="text-orange-500 ml-2">Alex</span> 
//             <span className="inline-block animate-wave ml-2 origin-bottom-right">👋</span>
//           </h1>
          
//           <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-6 hide-scrollbar">
//             {CATEGORIES.map((cat) => {
//               const isActive = activeCategory === cat.name;
//               return (
//                 <div 
//                   key={cat.id} 
//                   onClick={() => setActiveCategory(cat.name)}
//                   className={`flex flex-col items-center gap-3 shrink-0 cursor-pointer group transition-all duration-300 ${isActive ? 'scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
//                 >
//                   <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${cat.color} p-1 overflow-hidden transition-all duration-300 shadow-sm ${isActive ? 'ring-4 ring-orange-500 shadow-orange-200 shadow-lg' : 'ring-4 ring-transparent group-hover:ring-white group-hover:shadow-lg'}`}>
//                     <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" />
//                   </div>
//                   <span className={`font-semibold text-sm sm:text-base transition-colors ${isActive ? 'text-orange-600' : 'text-gray-600 group-hover:text-gray-900'}`}>
//                     {cat.name}
//                   </span>
//                 </div>
//               );
//             })}
//           </div>
//         </section>

//         <section>
//           <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 sm:p-10 shadow-2xl group cursor-pointer">
//             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-150"></div>
//             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
//               <div className="max-w-xl">
//                 <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4 text-orange-300">
//                   <CalendarClock size={16} />
//                   <span>New Feature</span>
//                 </div>
//                 <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">Don't leave tomorrow to chance.</h2>
//                 <p className="text-gray-300 text-base sm:text-lg">Schedule your meals up to 5 days in advance. Perfect for office lunches or anticipating your cravings.</p>
//               </div>
//               <Button className="shrink-0 flex items-center gap-2 h-14 px-8 rounded-full font-bold text-lg group-hover:-translate-y-1 group-hover:shadow-[0_10px_20px_rgba(249,115,22,0.3)] transition-all">
//                 Plan Ahead <ArrowRight size={20} />
//               </Button>
//             </div>
//           </div>
//         </section>

//         <section>
//           <div className="flex justify-between items-end mb-6">
//             <div>
//               <h2 className="text-2xl font-bold tracking-tight">Curated for you</h2>
//               <p className="text-gray-500 text-sm mt-1">Based on your recent cravings</p>
//             </div>
//           </div>

//           {filteredRestaurants.length === 0 ? (
//             <div className="py-12 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
//               <div className="bg-gray-50 p-4 rounded-full mb-4">
//                 <Search className="text-gray-400" size={32} />
//               </div>
//               <h3 className="text-lg font-bold text-gray-900">No cravings found</h3>
//               <p className="text-gray-500 text-sm max-w-xs mt-2">We couldn't find any spots matching your search.</p>
//               <Button variant="ghost" className="mt-4 text-orange-500" onClick={() => {setSearchQuery(''); setActiveCategory('All');}}>
//                 Clear filters
//               </Button>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
//               {filteredRestaurants.map((restaurant) => {
//                 const isFavorite = favorites.includes(restaurant.id);
//                 return (
//                   <div key={restaurant.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full animate-fade-in">
//                     <div className="relative h-48 sm:h-56 overflow-hidden cursor-pointer">
//                       <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
//                       <button onClick={(e) => toggleFavorite(e, restaurant.id)} className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:scale-110 transition-transform z-10">
//                         <Heart size={20} className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
//                       </button>
//                       {restaurant.featured && (
//                         <div className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-10">
//                           BiteGo Exclusive
//                         </div>
//                       )}
//                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent top-1/2 pointer-events-none"></div>
//                       <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
//                         <Timer size={14} className="text-orange-500" />
//                         {restaurant.time}
//                       </div>
//                     </div>

//                     <div className="p-5 flex flex-col flex-1">
//                       <div className="flex justify-between items-start mb-2">
//                         <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1 cursor-pointer">
//                           {restaurant.name}
//                         </h3>
//                         <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
//                           <Star size={12} className="fill-current" />
//                           {restaurant.rating}
//                         </div>
//                       </div>
                      
//                       <div className="text-sm text-gray-500 mb-4 flex items-center gap-2 truncate">
//                         <span>{restaurant.tags.join(' • ')}</span>
//                         <span className="w-1 h-1 rounded-full bg-gray-300"></span>
//                         <span>{restaurant.priceRange}</span>
//                       </div>

//                       <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
//                          <span className="text-lg font-black text-gray-900">${restaurant.price.toFixed(2)}</span>
//                          <Button size="sm" onClick={() => addToCart(restaurant)}>
//                            <Plus size={16} className="mr-1" /> Add
//                          </Button>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </section>
//       </main>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 flex flex-col selection:bg-orange-200 selection:text-orange-900">
//       <Navbar />
//       <CartSidebar />
      
//       {/* Basic Routing Simulation */}
//       <div className="flex-1">
//         {location === '/' && <HomeView />}
//         {location !== '/' && (
//           <div className="flex flex-col items-center justify-center py-32 text-center px-4 animate-fade-in">
//             <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-orange-500">
//               <Search size={32} />
//             </div>
//             <h2 className="text-2xl font-black mb-2">Page under construction</h2>
//             <p className="text-gray-500 max-w-md">You navigated to <span className="font-mono text-orange-500 bg-orange-50 px-2 py-1 rounded">{location}</span>. The routing state is working perfectly!</p>
//             <Button className="mt-8" onClick={() => setLocation('/')}>Return Home</Button>
//           </div>
//         )}
//       </div>

//       <Footer />
//       <BottomNav />

//       {/* Global CSS overrides */}
//       <style dangerouslySetInnerHTML={{__html: `
//         .hide-scrollbar::-webkit-scrollbar { display: none; }
//         .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//         @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
//         .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
//         @keyframes wave { 0%, 60%, 100% { transform: rotate(0.0deg) } 10%, 30% { transform: rotate(14.0deg) } 20% { transform: rotate(-8.0deg) } 40% { transform: rotate(-4.0deg) } 50% { transform: rotate(10.0deg) } }
//         .animate-wave { animation: wave 2.5s infinite; transform-origin: 70% 70%; }
//       `}} />
//     </div>
//   );
// }