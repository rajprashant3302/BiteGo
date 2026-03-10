"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  FiChevronRight, FiBox, FiCreditCard, FiUser, 
  FiMapPin, FiStar, FiTag, FiLogOut, FiLoader,
  FiBriefcase, FiFileText, FiPieChart, FiTruck, FiList, FiClock 
} from "react-icons/fi";
import { MdOutlineAccountBalanceWallet, MdOutlinePayments } from "react-icons/md";

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  // Driver-specific states
  const [isAvailable, setIsAvailable] = useState(false);
  const [driverStats, setDriverStats] = useState({ todayEarnings: 0, totalDeliveries: 0 });

  useEffect(() => {
    // Only redirect when we are sure the user is not authenticated
    if (status !== "loading" && status === "unauthenticated") {
      router.push("/login");
    }
    
    // Logic to fetch live driver status if the user is a DeliveryPartner
    if (session?.user?.role === "DeliveryPartner") {
      // fetchDriverData(); 
    }
  }, [status, router, session]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    );
  }

  const user = {
    name: session?.user?.name || "BiteGo Partner",
    email: session?.user?.email || "No email provided",
    profilePic: session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name}`,
    role: session?.user?.role, // "User", "DeliveryPartner", "Merchant"
  };

  // --- MENU DEFINITIONS BASED ON ROLE ---

  const userGroups = [
    {
      title: "Food & Orders",
      items: [
        { name: "Your Orders", icon: <FiBox />, link: "/orders", desc: "Track or view history" },
        { name: "Saved Addresses", icon: <FiMapPin />, link: "/addresses", desc: "Manage locations" },
      ]
    },
    {
      title: "Payments",
      items: [
        { name: "Wallet History", icon: <MdOutlineAccountBalanceWallet />, link: "/wallet", desc: "Balance & transactions" },
      ]
    }
  ];

  const driverGroups = [
    {
      title: "Deliveries & Earnings",
      items: [
        { name: "Delivery History", icon: <FiList />, link: "/history", desc: "View all past deliveries" },
        { name: "Earnings & Payouts", icon: <MdOutlinePayments />, link: "/earnings", desc: "Track your income" },
        { name: "Wallet Balance", icon: <MdOutlineAccountBalanceWallet />, link: "/wallet", desc: "Manage BiteGo wallet" },
      ]
    },
    {
      title: "Vehicle & Documents",
      items: [
        { name: "Vehicle Details", icon: <FiTruck />, link: "/document/vehicle-details", desc: "Manage your registration number" },
        { name: "Documents", icon: <FiFileText />, link: "/document/documents", desc: "Driving License Details" },
      ]
    }
  ];

  const merchantGroups = [
    {
      title: "Restaurant Partner",
      items: [
        { name: "My Restaurants", icon: <FiBriefcase />, link: "/partner/restaurants", desc: "Manage storefronts" },
        { name: "Analytics", icon: <FiPieChart />, link: "/partner/analytics", desc: "Order history & stats" },
      ]
    }
  ];

  // Decide which menu to show
  const activeGroups = user.role === "DeliveryPartner" 
    ? driverGroups 
    : user.role === "Merchant" 
      ? merchantGroups 
      : userGroups;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-20 h-20 rounded-full bg-orange-100 border-4 border-gray-50 shadow-sm overflow-hidden">
                <img src={user.profilePic} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-gray-500 text-sm font-medium">{user.email}</p>
                <div className="flex items-center mt-1">
                    <span className="bg-orange-100 text-[#FF651D] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                        {user.role}
                    </span>
                </div>
              </div>
            </div>
            <Link href="/profile/edit" className="w-full sm:w-auto text-center px-6 py-2.5 bg-[#FFF0E6] text-[#FF651D] font-bold rounded-xl hover:bg-[#FF651D] hover:text-white transition-all">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* DRIVER SPECIFIC: Duty Status & Quick Stats */}
        {user.role === "DeliveryPartner" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Duty Status</h2>
                <p className={`text-sm mt-1 ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
                  {isAvailable ? "Online - Receiving Orders" : "Offline - Go online to earn"}
                </p>
              </div>
              <button 
                onClick={() => setIsAvailable(!isAvailable)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition shadow-sm ${isAvailable ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#FFF0E6] to-white rounded-2xl p-5 border border-orange-100 shadow-sm">
                <p className="text-xs font-bold text-[#D84A00] uppercase mb-1">Today's Earnings</p>
                <h3 className="text-2xl font-extrabold text-gray-900">₹{driverStats.todayEarnings}</h3>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl p-5 border border-green-100 shadow-sm">
                <p className="text-xs font-bold text-green-700 uppercase mb-1">Deliveries Today</p>
                <h3 className="text-2xl font-extrabold text-gray-900">{driverStats.totalDeliveries}</h3>
              </div>
            </div>
          </>
        )}

        {/* Dynamic Menu Groups */}
        {activeGroups.map((group, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{group.title}</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {group.items.map((item, i) => (
                <Link key={i} href={item.link} className="flex items-center justify-between p-5 hover:bg-orange-50/30 transition-colors group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 group-hover:text-[#FF651D] group-hover:bg-[#FFF0E6]">
                      {React.cloneElement(item.icon, { size: 20 })}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#FF651D]">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-400 group-hover:text-[#FF651D]" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center space-x-2 py-4 bg-white rounded-2xl shadow-sm border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-colors"
        >
          <FiLogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
}