// 'use client';

// import { motion, AnimatePresence } from 'framer-motion';
// import { X, ShoppingBag, CheckCircle2, Zap, Clock, MapPin, ChevronRight } from 'lucide-react';
// import { useCart } from '@/context/CartContext';
// import Button from '@/components/ui/Button';
// import CartItem from './CartItem';
// import CouponSection from './CouponSection';
// import CheckoutOverlay from './CheckoutOverlay';
// import { useRouter } from 'next/navigation';

// export default function CartSidebar() {
//   const router = useRouter();
//   const {
//     isCartOpen, setIsCartOpen,
//     cartItems,
//     cartSubtotal, cartTotal, deliveryFee,
//     deliveryMode,
//     scheduledTime,
//     setIsScheduleOpen,
//     appliedCoupon,
//     isOrdered, handleCheckout,
//     selectedAddress // ✅ Ensure this is exported from your CartContext
//   } = useCart();

//   return (
//     <AnimatePresence>
//       {isCartOpen && (
//         <>
//           <motion.div
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={() => setIsCartOpen(false)}
//             className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] cursor-pointer"
//           />
//           <motion.div
//             initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
//             transition={{ type: 'spring', damping: 28, stiffness: 220, bounce: 0 }}
//             className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-[100] flex flex-col overflow-hidden"
//           >
//             {/* Header */}
//             <div className="p-8 border-b border-gray-100 flex items-center justify-between">
//               <h2 className="text-2xl font-black flex items-center gap-3 text-gray-900">
//                 Your Order <ShoppingBag className="text-orange-500" />
//               </h2>
//               <Button variant="ghost" size="icon" className="bg-gray-100" onClick={() => setIsCartOpen(false)}>
//                 <X className="h-5 w-5" />
//               </Button>
//             </div>

//             {/* ── NEW ADDRESS SECTION ── */}
//             {cartItems.length > 0 && (
//               <div 
//                 onClick={() => {
//                   setIsCartOpen(false); // Close sidebar before navigating
//                   router.push('/addresses'); 
//                 }}
//                 className="mx-8 mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all group"
//               >
//                 <div className="flex items-start gap-3">
//                   <div className="bg-white p-2 rounded-xl shadow-sm text-orange-500">
//                     <MapPin size={18} />
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center justify-between">
//                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivering to</p>
//                       <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1 group-hover:translate-x-1 transition-transform">
//                         Change <ChevronRight size={12} />
//                       </span>
//                     </div>
//                     <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">
//                       {selectedAddress ? selectedAddress.AddressLine : "Select a delivery address"}
//                     </p>
//                     <p className="text-[11px] font-medium text-slate-500">
//                       {selectedAddress ? `${selectedAddress.City}, ${selectedAddress.Pincode}` : "Tap to add your location"}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             )}

//             <div className="flex-1 overflow-y-auto p-8 space-y-6">
//               {cartItems.length === 0 ? (
//                 <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
//                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
//                     <ShoppingBag size={40} className="text-gray-200" />
//                   </div>
//                   <h3 className="text-xl font-black text-gray-900">Your cart is empty</h3>
//                   <Button variant="outline" onClick={() => setIsCartOpen(false)}>Explore Menu</Button>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="bg-orange-50 rounded-2xl p-4 flex items-center justify-between border border-orange-100">
//                     <div className="flex items-center gap-3">
//                       {deliveryMode === 'quick' ? <Zap className="text-orange-500" size={18} /> : <Clock className="text-orange-500" size={18} />}
//                       <span className="text-sm font-black text-orange-900">
//                         {deliveryMode === 'quick' ? 'Quick Delivery (25-35 min)' : `Scheduled: ${scheduledTime?.time}`}
//                       </span>
//                     </div>
//                     <button onClick={() => setIsScheduleOpen(true)} className="text-xs font-black text-orange-500 uppercase tracking-wider hover:underline">Change</button>
//                   </div>
//                   {cartItems.map(item => <CartItem key={item.ItemID} item={item} />)}
//                   <CouponSection />
//                 </div>
//               )}
//             </div>

//             {/* Footer Summary */}
//             {cartItems.length > 0 && (
//               <div className="p-8 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm space-y-4">
//                 <div className="space-y-2">
//                   <div className="flex justify-between text-gray-500 font-bold text-sm">
//                     <span>Items Subtotal</span><span>₹{cartSubtotal.toFixed(0)}</span>
//                   </div>
//                   <div className="flex justify-between text-gray-500 font-bold text-sm">
//                     <span>Delivery Fee</span>
//                     <span className={deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'text-green-600' : ''}>
//                       {deliveryMode === 'scheduled' || appliedCoupon?.code === 'FREEDEL' ? 'FREE' : `₹${deliveryFee.toFixed(0)}`}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t border-gray-200/50">
//                   <span>Total</span>
//                   <span className="text-orange-500">₹{cartTotal.toFixed(0)}</span>
//                 </div>
//                 <Button
//                   className="w-full h-16 text-lg rounded-[24px] shadow-xl shadow-orange-500/20"
//                   onClick={handleCheckout}
//                   disabled={isOrdered || !selectedAddress} // ✅ Prevent checkout without address
//                 >
//                   {!selectedAddress ? 'Select Address First' : isOrdered ? 'Processing...' : 'Place Order'}
//                 </Button>
//               </div>
//             )}
//           </motion.div>
//           <CheckoutOverlay />
//         </>
//       )}
//     </AnimatePresence>
//   );
// }