"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  FiChevronRight, FiUser, FiShield, FiSliders, 
  FiUsers, FiCpu, FiLogOut, FiLoader, FiBell
} from "react-icons/fi";

export default function AdminSettingsPage() {
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
  const admin = {
    name: session?.user?.name || "BiteGo Admin",
    email: session?.user?.email || "admin@bitego.com",
    phone: (session?.user as any)?.phone || "No phone provided", 
    profilePic: session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.name || 'Admin'}`,
    role: (session?.user as any)?.role || "SuperAdmin", 
  };

  // Grouping the Admin settings
  const menuGroups = [
    {
      title: "Personal Account",
      items: [
        { name: "Profile Details", icon: <FiUser />, link: "/settings/profile", desc: "Update your name, email, and avatar" },
        { name: "Security & Password", icon: <FiShield />, link: "/settings/security", desc: "Manage your password and 2FA" },
        { name: "Notifications", icon: <FiBell />, link: "/settings/notifications", desc: "Configure your email and push alerts" },
      ]
    },
    {
      title: "Platform Configuration",
      items: [
        { name: "General Settings", icon: <FiSliders />, link: "/settings/general", desc: "Platform name, maintenance mode, and global fees" },
        { name: "Team & Roles", icon: <FiUsers />, link: "/settings/team", desc: "Manage admin access and operational roles" },
        { name: "API & Integrations", icon: <FiCpu />, link: "/settings/integrations", desc: "Manage Payment Gateways, Maps, and SMS providers" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      
      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-0 space-y-6">
        
        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-0">
            
            <div className="flex items-center space-x-5">
              {/* Profile Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-orange-100 border-4 border-gray-50 shadow-sm overflow-hidden">
                  <img 
                    src={admin.profilePic} 
                    alt={admin.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              {/* Admin Info */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{admin.name}</h1>
                <p className="text-gray-500 text-sm font-medium mt-0.5">{admin.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                    {admin.role}
                  </span>
                  <span className="text-gray-400 text-xs">{admin.phone}</span>
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Link 
              href="/settings/profile" 
              className="w-full sm:w-auto text-center px-6 py-2.5 bg-[#FFF0E6] text-[#FF651D] font-bold rounded-xl hover:bg-[#FF651D] hover:text-white transition-all duration-300 shadow-sm"
            >
              Edit Profile
            </Link>
            
          </div>
        </div>

        {/* Render Admin Settings Groups */}
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