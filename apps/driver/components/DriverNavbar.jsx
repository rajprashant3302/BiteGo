"use client";

import { Menu, X, Power, Loader2 } from "lucide-react";

export default function DriverNavbar({
  sidebarOpen,
  setSidebarOpen,
  isOnline,
  toggleOnline,
  isSearching
}) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white backdrop-blur-xl border-b border-gray-100">
      
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-3">

          {/* MOBILE MENU */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition"
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            {sidebarOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>

          {/* LOGO / TITLE */}
          <div className="flex flex-col leading-none">
            <span className="font-black text-xl tracking-tight text-gray-900">
              Bite<span className="text-orange-500">Go</span>
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Driver Panel
            </span>
          </div>

        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-3">

          {/* ONLINE BUTTON */}
          {/* <button
            onClick={toggleOnline}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-2xl
              text-xs font-black uppercase tracking-wider
              transition-all duration-300 overflow-hidden
              ${isOnline
                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                : "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-200"
              }
            `}
          >
            <Power size={14} />

            {isOnline ? "Go Offline" : "Go Online"} */}

            {/* 🔄 LOADER */}
            {/* {isOnline && isSearching && (
              <Loader2 size={14} className="animate-spin" />
            )} */}

            {/* HOVER EFFECT */}
            {/* <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
          </button> */}

        </div>

      </div>
    </header>
  );
}