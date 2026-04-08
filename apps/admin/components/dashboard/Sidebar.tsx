"use client";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, X, LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, TrendingUp, UserPlus, Mail, Settings } from "lucide-react";

const ICONS = [LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, TrendingUp, UserPlus, Mail, Settings];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
  adminName: string;
  adminEmail: string;
}

const NAV_ITEMS = [
  { label: "Dashboard",   href: "/"           },
  { label: "All Users",   href: "/all-users" },
  { label: "Restaurants", href: "/restaurants"},
  { label: "Orders",      href: "/orders"    },
  { label: "Analytics",   href: "/analytics" },
  { label: "Invite",      href: "/invite"    },
  { label: "Support",     href: "/chat"   },
  { label: "Settings",    href: "/settings"  },
];

export default function Sidebar({ 
  sidebarOpen, setSidebarOpen, activeNav, setActiveNav, adminName, adminEmail 
}: SidebarProps) {
  const router = useRouter();

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`
        /* Base Styling */
        bg-white border-r border-gray-100 flex flex-col z-40
        transition-transform duration-300 ease-in-out
        
        /* Mobile: Fixed overlay */
        fixed top-0 left-0 h-full w-64
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        
        /* Desktop: Constant side position */
        md:translate-x-0 md:static md:h-full md:w-64
      `}>
        {/* Logo Section */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <button className="md:hidden text-gray-400 p-1" onClick={() => setSidebarOpen(false)}>
            <X size={20}/>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = ICONS[idx];
            return (
              <button
                key={item.label}
                onClick={() => { 
                  setActiveNav(item.label); 
                  router.push(item.href); 
                  setSidebarOpen(false); // Auto-close on mobile
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeNav === item.label 
                    ? "bg-[#FF651D] text-white shadow-sm shadow-orange-200" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Profile / Logout Section (Stays at bottom) */}
        {/* <div className="px-3 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-xs shrink-0">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{adminName}</p>
              <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-gray-300 group-hover:text-red-500 transition-colors p-1" 
              title="Logout"
            >
              <LogOut size={16}/>
            </button>
          </div>
        </div> */}
      </aside>
    </>
  );
}