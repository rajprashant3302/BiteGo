// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { ChevronLeft, ShoppingBag, Leaf, Flame, Star, Clock } from 'lucide-react';
// import Button from '@/components/ui/Button';
// import { useCart } from '@/context/CartContext';
// import { motion } from 'framer-motion';

// export default function MenuItemPage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const { addToCart } = useCart();
//   const [item, setItem] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // In a real app, you'd fetch from your Order Service or Search Service
//     // For now, we'll simulate fetching the specific pizza details
//     const fetchItem = async () => {
//       try {
//         const res = await fetch(`http://localhost:8001/search?q=${id}`); // Or your specific Item API
//         const json = await res.json();
//         // Finding the specific item from results
//         const foundItem = json.data.find(i => i.id === id);
//         setItem(foundItem);
//       } catch (err) {
//         console.error("Failed to load item", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchItem();
//   }, [id]);

//   if (loading) return <div className="h-screen flex items-center justify-center font-black animate-pulse text-orange-500 uppercase tracking-widest">Preparing your bite...</div>;
//   if (!item) return <div className="p-20 text-center font-bold">Item not found.</div>;

//   return (
//     <main className="max-w-7xl mx-auto px-4 py-8">
//       {/* Back Button */}
//       <button 
//         onClick={() => router.back()}
//         className="flex items-center gap-2 font-black text-gray-500 hover:text-orange-500 transition-colors mb-8"
//       >
//         <ChevronLeft size={20} /> BACK TO DISCOVER
//       </button>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
//         {/* Left: Image Hero */}
//         <motion.div 
//           initial={{ opacity: 0, x: -20 }} 
//           animate={{ opacity: 1, x: 0 }}
//           className="relative aspect-square rounded-[3rem] overflow-hidden bg-gray-100 shadow-2xl border-8 border-white"
//         >
//           <img 
//             src="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop" 
//             alt={item.name} 
//             className="w-full h-full object-cover"
//           />
//           {item.isVeg && (
//             <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
//               <Leaf size={16} className="text-green-500 fill-green-500" />
//               <span className="text-xs font-black text-green-600 uppercase tracking-tighter">100% Veg</span>
//             </div>
//           )}
//         </motion.div>

//         {/* Right: Details */}
//         <motion.div 
//           initial={{ opacity: 0, x: 20 }} 
//           animate={{ opacity: 1, x: 0 }}
//           className="space-y-8"
//         >
//           <div className="space-y-4">
//             <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
//               {item.restaurant_name}
//             </span>
//             <h1 className="text-5xl font-black text-gray-900 leading-none tracking-tight">
//               {item.name}
//             </h1>
//             <p className="text-xl text-gray-500 font-medium leading-relaxed italic">
//               "{item.description}"
//             </p>
//           </div>

//           <div className="flex items-center gap-8 py-4 border-y border-gray-100">
//             <div className="flex flex-col">
//               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</span>
//               <span className="text-3xl font-black text-gray-900">₹{item.price}</span>
//             </div>
//             <div className="h-10 w-px bg-gray-100" />
//             <div className="flex flex-col">
//               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating</span>
//               <div className="flex items-center gap-1">
//                 <Star size={18} className="text-yellow-400 fill-yellow-400" />
//                 <span className="text-lg font-black text-gray-900">{item.score.toFixed(1)}</span>
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-4">
//             <Button 
//               className="flex-1 h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-200 gap-3"
//               //onClick={() => addToCart(item)}
//             >
//               <ShoppingBag size={20} /> ADD TO CART
//             </Button>
//             <Button variant="ghost" className="h-16 w-16 rounded-2xl bg-gray-100">
//               <Flame size={20} className="text-orange-500" />
//             </Button>
//           </div>
//         </motion.div>
//       </div>
//     </main>
//   );
// }