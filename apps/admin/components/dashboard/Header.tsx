// src/components/dashboard/Header.tsx
"use client";

import { Bell, Menu, X, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from 'framer-motion';
import BiteGoLogo from './BiteGoLogo';
import Button from '@/components/ui/Button';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  adminName: string;
}

export default function Header({ sidebarOpen, setSidebarOpen, adminName }: HeaderProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Example notification count (you can hook this up to state/backend later)
  const notificationCount = 3;

  return (
    <header className="sticky top-0 z-[60] w-full bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-[2000px] mx-auto px-4 md:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* --- Left Side: Mobile Menu & Logo --- */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Mobile Toggle Button (Hamburger / X) */}
          <button 
            className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle Menu"
          >
            {sidebarOpen ? <X size={24} className="text-gray-900" /> : <Menu size={24} />}
          </button>

          {/* --- Logo Section --- */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <BiteGoLogo size={160} className="group-hover:scale-105 transition-transform duration-300 hidden sm:block" />
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl tracking-tight text-gray-900 leading-none">
                Bite<span className="text-orange-500">Go</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* --- Right Side Actions --- */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          
          {/* User Profile */}
          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="h-10 w-10 rounded-2xl bg-gray-100 animate-pulse" />
            ) : status === 'authenticated' ? (
              <button 
                onClick={() => router.push('/settings')}
                className="flex items-center gap-2 p-1 pr-1 sm:pr-3 hover:bg-gray-50 rounded-2xl transition-all group border border-transparent hover:border-gray-100"
              >
                <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100">
                  {/* Using the Google profile pic if available, otherwise fallback */}
                  <img
                    src={session?.user?.image || 'https://via.placeholder.com/100'}
                    alt={adminName}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="hidden xl:flex flex-col items-start">
                  <span className="text-[11px] font-black text-gray-900 leading-none truncate max-w-[70px]">
                    {adminName.split(' ')[0]}
                  </span>
                  <span className="text-[8px] font-black text-orange-500 uppercase tracking-tighter mt-0.5">
                    {/* Assuming session includes role, otherwise default to SuperAdmin */}
                    {(session?.user as any)?.role || 'SuperAdmin'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:text-orange-500 transition-colors hidden sm:block" />
              </button>
            ) : (
              <Button variant="ghost" size="icon" className="bg-gray-50 rounded-2xl hover:bg-gray-100" onClick={() => router.push('/login')}>
                <User className="h-5 w-5 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Notification Bell Button (Replaces Cart) */}
          <Button
            variant="dark"
            className="rounded-2xl pl-3 pr-3 sm:pl-4 sm:pr-5 h-10 sm:h-12 gap-3 shadow-xl shadow-gray-200 group relative overflow-hidden"
            onClick={() => {/* Open Notifications Panel */}}
          >
            <div className="relative z-10">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              <AnimatePresence>
                {notificationCount > 0 && (
                  <motion.div
                    key={notificationCount}
                    initial={{ scale: 0, y: 5 }} 
                    animate={{ scale: 1, y: 0 }} 
                    exit={{ scale: 0 }}
                    className="absolute -top-2.5 -right-2.5 w-4 h-4 sm:w-5 sm:h-5 bg-orange-500 text-white text-[8px] sm:text-[9px] font-black rounded-lg flex items-center justify-center border-2 border-gray-900"
                  >
                    {notificationCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <span className="hidden sm:inline font-black uppercase text-[11px] tracking-widest relative z-10">
              Alerts
            </span>
            <div className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10" />
          </Button>

        </div>
      </div>
    </header>
  );
}