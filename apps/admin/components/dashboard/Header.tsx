// src/components/dashboard/Header.tsx
"use client";
import { Search, Bell, Menu } from "lucide-react";

// 1. Define the types for your props
interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
  adminName: string;
}

// 2. Apply the interface to your component
export default function Header({ setSidebarOpen, adminName }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input placeholder="Search orders, users..." className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-300 focus:bg-white transition-all w-56"/>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500">
          <Bell size={18}/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF651D] rounded-full"/>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-xs">
          {adminName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}