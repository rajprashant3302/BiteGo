// "use client"

// import React from "react"
// import { Home, Search, ShoppingBag, Heart, User } from "lucide-react"

// interface BottompanelProps {
//   location: string
//   setLocation: React.Dispatch<React.SetStateAction<string>>
//   cartCount: number
//   setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>
// }

// export default function Bottompanel({
//   location,
//   setLocation,
//   cartCount,
//   setIsCartOpen,
// }: BottompanelProps) {
//   const navItems = [
//     { icon: Home, href: "/" },
//     { icon: Search, href: "/search" },
//     { icon: ShoppingBag, action: () => setIsCartOpen(true) },
//     { icon: Heart, href: "/saved" },
//     { icon: User, href: "/profile" },
//   ]

//   return (
//     <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
//       <div className="bg-gray-900 rounded-[32px] p-2 flex justify-around">
//         {navItems.map((item, idx) => {
//           const Icon = item.icon
//           return (
//             <button
//               key={idx}
//               onClick={() =>
//                 item.action ? item.action() : setLocation(item.href!)
//               }
//               className={`relative p-2 ${
//                 location === item.href ? "text-orange-500" : "text-gray-400"
//               }`}
//             >
//               <Icon size={22} />
//               {idx === 2 && cartCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
//                   {cartCount}
//                 </span>
//               )}
//             </button>
//           )
//         })}
//       </div>
//     </div>
//   )
// }