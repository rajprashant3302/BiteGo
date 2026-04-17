"use client";

import { useRouter, usePathname } from "next/navigation";
import { X, LogOut, LayoutDashboard, Map, ClipboardList, Wallet, Bell, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

/* ✅ ROUTES (SCALABLE) */
const DRIVER_ROUTES = [
  { label: "Dashboard", href: "/dash", icon: LayoutDashboard },
  { label: "Live Orders", href: "/orders", icon: ClipboardList },
  { label: "Map / Navigation", href: "/map", icon: Map },
  { label: "Earnings", href: "/earnings", icon: Wallet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DriverSidebar({
  sidebarOpen,
  setSidebarOpen
}: SidebarProps) {

  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        bg-white border-r border-gray-100 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        
        fixed top-0 left-0 h-full w-64
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        
        md:translate-x-0 md:static md:h-full md:w-64
      `}>

        {/* HEADER */}
        <div className="px-6 border-gray-100 flex items-center justify-between">

          {/* CLOSE BTN MOBILE */}
          <button
            className="md:hidden text-gray-400 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20}/>
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

          {DRIVER_ROUTES.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-semibold transition-all
                  
                  ${isActive
                    ? "bg-orange-500 text-white shadow-sm shadow-orange-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={17} />
                {item.label}
              </button>
            );
          })}

        </nav>

        {/* PROFILE / LOGOUT */}
        <div className="px-4 py-4 border-t border-gray-100">

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={16}/>
            Logout
          </button>

        </div>

      </aside>
    </>
  );
}