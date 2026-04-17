"use client";

import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Wallet,
  Bell,
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" , icon: LayoutDashboard },
  { label: "Live Orders", href: "/orders", icon: ClipboardList },
  { label: "Map / Navigation", href: "/map", icon: Map },
  { label: "Earnings", href: "/earnings", icon: Wallet },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function DriverSidebar({
  sidebarOpen,
  setSidebarOpen,
  activeNav,
  setActiveNav
}: SidebarProps) {

  const router = useRouter();

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        bg-white border-r flex flex-col z-40 transition-transform duration-300
        fixed top-0 left-0 h-full w-64
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static
      `}>

        <div className="px-6 py-5 border-b font-black text-xl">
          🚚 Driver Panel
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveNav(item.label);
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  activeNav === item.label
                    ? "bg-orange-500 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button className="flex items-center gap-2 text-red-500 font-semibold">
            <LogOut size={18} /> Logout
          </button>
        </div>

      </aside>
    </>
  );
}