// "use client"

// import React from "react"
// import { Search, ShoppingBag, User, Zap, Clock } from "lucide-react"
// import { motion, AnimatePresence } from "framer-motion"

// interface NavbarProps {
//   searchQuery: string
//   setSearchQuery: React.Dispatch<React.SetStateAction<string>>
//   deliveryMode: "quick" | "scheduled"
//   setDeliveryMode: React.Dispatch<React.SetStateAction<"quick" | "scheduled">>
//   scheduledTime: any
//   setIsScheduleOpen: React.Dispatch<React.SetStateAction<boolean>>
//   cartCount: number
//   cartTotal: number
//   setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>
// }

// export default function Navbar({
//   searchQuery,
//   setSearchQuery,
//   deliveryMode,
//   setDeliveryMode,
//   scheduledTime,
//   setIsScheduleOpen,
//   cartCount,
//   cartTotal,
//   setIsCartOpen,
// }: NavbarProps) {
//   return (
//     <header className="sticky top-0 z-[80] w-full bg-white/90 backdrop-blur-xl border-b border-gray-100">
//       <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

//         {/* Search */}
//         <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
//           <div className="relative w-full">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search..."
//               className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-2xl outline-none"
//             />
//           </div>
//         </div>

//         {/* Controls */}
//         <div className="flex items-center gap-4">
//           <div className="hidden lg:flex items-center bg-gray-100 rounded-2xl p-1 gap-1">
//             <button
//               onClick={() => setDeliveryMode("quick")}
//               className={`px-4 py-2 rounded-xl text-xs font-bold ${
//                 deliveryMode === "quick" ? "bg-white text-orange-500" : "text-gray-400"
//               }`}
//             >
//               <Zap size={14} /> Quick
//             </button>

//             <button
//               onClick={() => setIsScheduleOpen(true)}
//               className={`px-4 py-2 rounded-xl text-xs font-bold ${
//                 deliveryMode === "scheduled"
//                   ? "bg-white text-indigo-500"
//                   : "text-gray-400"
//               }`}
//             >
//               <Clock size={14} />{" "}
//               {scheduledTime ? scheduledTime.time : "Schedule"}
//             </button>
//           </div>

//           <button className="hidden sm:flex bg-gray-100 p-2 rounded-full">
//             <User size={18} />
//           </button>

//           <button
//             onClick={() => setIsCartOpen(true)}
//             className="bg-gray-900 text-white rounded-2xl px-5 py-2 flex items-center gap-3"
//           >
//             <ShoppingBag size={18} />
//             <span>${cartTotal.toFixed(2)}</span>

//             <AnimatePresence>
//               {cartCount > 0 && (
//                 <motion.div
//                   key={cartCount}
//                   initial={{ scale: 0 }}
//                   animate={{ scale: 1 }}
//                   exit={{ scale: 0 }}
//                   className="bg-orange-500 text-white w-5 h-5 text-xs rounded-full flex items-center justify-center"
//                 >
//                   {cartCount}
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </button>
//         </div>
//       </div>
//     </header>
//   )
// }