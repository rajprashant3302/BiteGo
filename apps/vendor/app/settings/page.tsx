"use client";

import React from "react";
import Link from "next/link";
import { 
  FiChevronRight, FiBox, FiCreditCard, FiUser, 
  FiMapPin, FiStar, FiTag, FiBriefcase, FiPlusCircle,
  FiFileText, FiLogOut
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";

export default function ProfileSettingsPage() {
  // Mock User Data (You will fetch this from your backend/context later)
  const user = {
    name: "Prashant Raj",
    email: "rajprashant@example.com",
    phone: "+91 9876543210",
    profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prashant",
    role: "RestaurantOwner", // To conditionally show partner settings
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

  // Restaurant Owner Specific Settings (From your schema)
  const partnerMenu = [
    { name: "Business Details (PAN/Bank)", icon: <FiFileText />, link: "/partner/business-details" },
    { name: "Manage Restaurants", icon: <FiBriefcase />, link: "/partner/restaurants" },
    { name: "Add Menu Items", icon: <FiPlusCircle />, link: "/partner/menu/add" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      
      {/* Top Header / Profile Card */}
      <div className="bg-white shadow-sm pt-12 pb-6 px-4 sm:px-8 border-b border-gray-200">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-5">
            {/* Profile Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-orange-100 border-4 border-white shadow-md overflow-hidden">
                <img 
                  src={user.profilePic} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500 text-sm font-medium mt-0.5">{user.email}</p>
              <p className="text-gray-400 text-xs mt-0.5">{user.phone}</p>
            </div>
          </div>

          {/* Edit Profile Button */}
          <Link 
            href="/profile/edit" 
            className="hidden sm:inline-block px-5 py-2.5 bg-[#FFF0E6] text-[#FF651D] font-bold rounded-xl hover:bg-[#FF651D] hover:text-white transition-all duration-300 shadow-sm"
          >
            Edit Profile
          </Link>
        </div>

        {/* Mobile Edit Button (Shows only on small screens) */}
        <div className="max-w-3xl mx-auto mt-6 sm:hidden">
          <Link 
            href="/profile/edit" 
            className="block w-full text-center py-3 bg-[#FFF0E6] text-[#FF651D] font-bold rounded-xl active:bg-[#FF651D] active:text-white transition-all"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Main Settings List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-0 mt-6 space-y-6">
        
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

        {/* Render Partner/Restaurant Owner Section (Conditional based on Role) */}
        {user.role === "RestaurantOwner" && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-[#FFF0E6] to-white">
              <h2 className="text-sm font-bold text-[#D84A00] uppercase tracking-wider flex items-center">
                <FiBriefcase className="mr-2" size={16}/> Restaurant Partner Hub
              </h2>
            </div>
            <div className="divide-y divide-orange-50">
              {partnerMenu.map((item, itemIdx) => (
                <Link key={itemIdx} href={item.link} className="flex items-center justify-between p-5 hover:bg-orange-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-[#FFF0E6] flex items-center justify-center text-[#FF651D]">
                      {React.cloneElement(item.icon, { size: 20 })}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#FF651D] transition-colors">{item.name}</h3>
                  </div>
                  <FiChevronRight className="text-gray-400 group-hover:text-[#FF651D]" size={20} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button className="w-full mt-8 flex items-center justify-center space-x-2 py-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors">
          <FiLogOut size={20} />
          <span>Log Out</span>
        </button>

      </div>
    </div>
  );
}