"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FiChevronRight, FiUser, FiMapPin, FiLogOut, 
  FiTruck, FiFileText, FiList, FiClock
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet, MdOutlinePayments } from "react-icons/md";

export default function DriverProfilePage() {
  // Mock Driver Data (Fetch from your backend later)
  const [isAvailable, setIsAvailable] = useState(false); // Maps to DeliveryPartner.IsAvailable

  const driver = {
    name: "Rahul Kumar",
    email: "rahul.driver@example.com",
    phone: "+91 9876500000",
    profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    walletBalance: "₹1,250",
    vehicleNumber: "BR 01 XX 1234",
  };

  // Grouping settings for a Delivery Partner
  const menuGroups = [
    {
      title: "Deliveries & Earnings",
      items: [
        { name: "Delivery History", icon: <FiList />, link: "/driver/history", desc: "View all your past deliveries" },
        { name: "Earnings & Payouts", icon: <MdOutlinePayments />, link: "/driver/earnings", desc: "Track your daily and weekly earnings" },
        { name: "Wallet Balance", icon: <MdOutlineAccountBalanceWallet />, link: "/wallet", desc: "Manage your BiteGo wallet transactions" },
      ]
    },
    {
      title: "Vehicle & Documents",
      items: [
        { name: "Vehicle Details", icon: <FiTruck />, link: "/driver/vehicle", desc: `Current Vehicle: ${driver.vehicleNumber}` },
        { name: "Driving License & PAN", icon: <FiFileText />, link: "/driver/documents", desc: "Manage your registered documents" },
      ]
    },
    {
      title: "Account Settings",
      items: [
        { name: "Account Details", icon: <FiUser />, link: "/profile/details", desc: "Update your personal information" },
        { name: "Current Zone", icon: <FiMapPin />, link: "/driver/zone", desc: "View your assigned delivery zone" },
      ]
    },
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
                  src={driver.profilePic} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{driver.name}</h1>
              <p className="text-gray-500 text-sm font-medium mt-0.5">{driver.phone}</p>
              <p className="text-gray-400 text-xs mt-0.5">{driver.email}</p>
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

      <div className="max-w-3xl mx-auto px-4 sm:px-0 mt-6 space-y-6">
        
        {/* ONLINE / OFFLINE TOGGLE CARD (Driver Specific) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Duty Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              {isAvailable ? "You are online and receiving orders." : "You are offline. Go online to earn."}
            </p>
          </div>
          
          {/* Custom Toggle Switch */}
          <button 
            onClick={() => setIsAvailable(!isAvailable)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${
              isAvailable ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span 
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 ease-in-out shadow-sm ${
                isAvailable ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Quick Stats (Driver Specific) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#FFF0E6] to-white rounded-2xl p-5 border border-orange-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-[#D84A00] uppercase tracking-wider mb-1">Today's Earnings</p>
            <h3 className="text-2xl font-extrabold text-gray-900">₹450</h3>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 border border-green-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Total Deliveries</p>
            <h3 className="text-2xl font-extrabold text-gray-900">12</h3>
          </div>
        </div>

        {/* Render Driver Settings Groups */}
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
        <button className="w-full mt-8 flex items-center justify-center space-x-2 py-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors">
          <FiLogOut size={20} />
          <span>Log Out</span>
        </button>

      </div>
    </div>
  );
}