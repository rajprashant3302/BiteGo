"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  FiChevronRight, FiBox, FiCreditCard, FiUser, 
  FiMapPin, FiStar, FiTag, FiLogOut, FiLoader
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

export default function ProfileSettingsPage() {
  const router = useRouter();
  // Fetch real session data from NextAuth
  const { data: session, status } = useSession();

  // Redirect to login if they are not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Show a loading spinner while NextAuth fetches the session
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    );
  }

  // Safely map session data to your UI variables
  const user = {
    name: session?.user?.name || "BiteGo User",
    email: session?.user?.email || "No email provided",
    phone: session?.user?.phone || "Update your phone number", 
    profilePic: session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'User'}`,
    role: session?.user?.role || "User", 
  };

  // Grouping the settings based on your Prisma Schema
  const menuGroups = [
    {
      title: "Food & Orders",
      items: [
        { name: "Your Orders", icon: <FiBox />, link: "/orders", desc: "Track, return, or buy things again" },
        { name: "Saved Addresses", icon: <FiMapPin />, link: "/addresses", desc: "Manage delivery locations" },
        { name: "Your Reviews", icon: <FiStar />, link: "/reviews", desc: "Ratings you've given to restaurants" },
      ]
    },
    {
      title: "Payments & Offers",
      items: [
        { name: "Wallet History", icon: <MdOutlineAccountBalanceWallet />, link: "/wallet", desc: "Check your BiteGo balance & transactions" },
        { name: "Your Coupons", icon: <FiTag />, link: "/coupons", desc: "View available discounts & offers" },
        { name: "Saved Cards", icon: <FiCreditCard />, link: "/payments/cards", desc: "Manage your payment methods" },
      ]
    },
    {
      title: "Account Settings",
      items: [
        { name: "Account Details", icon: <FiUser />, link: "/profile/details", desc: "Update name, email, and security" },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      
      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-6">
        
        {/* Profile Info Card (Now styled like the other cards below) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-0">
            
            <div className="flex items-center space-x-5">
              {/* Profile Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full bg-orange-100 border-4 border-gray-50 shadow-sm overflow-hidden">
                  <img 
                    src={user.profilePic} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* User Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 text-sm font-medium mt-0.5">{user.email}</p>
                <p className="text-gray-400 text-xs mt-1">{user.phone}</p>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link 
              href="/profile/edit" 
              className="w-full sm:w-auto text-center px-6 py-2.5 bg-[#FFF0E6] text-[#FF651D] font-bold rounded-xl hover:bg-[#FF651D] hover:text-white transition-all duration-300 shadow-sm"
            >
              Edit Profile
            </Link>
            
          </div>
        </div>

        {/* Render standard user groups */}
        {menuGroups.map((group, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{group.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map((item, itemIdx) => (
                <Link key={itemIdx} href={item.link} className="flex items-center justify-between p-5 hover:bg-orange-50/30 transition-colors group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-[#FFF0E6] group-hover:text-[#FF651D] transition-colors">
                      {React.cloneElement(item.icon, { size: 20 })}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#FF651D] transition-colors">{item.name}</h3>
                      {item.desc && <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>}
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400 group-hover:text-[#FF651D]" size={20} />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout Button */}
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full mt-8 flex items-center justify-center space-x-2 py-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors"
        >
          <FiLogOut size={20} />
          <span>Log Out</span>
        </button>

      </div>
    </div>
  );
}