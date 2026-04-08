"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Clock } from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import RevenueOverview from "@/components/dashboard/RevenueOverview";
import RecentOrders from "@/components/dashboard/RecentOrders";
import {
  StatCards,
  TopRestaurants,
  QuickActions,
  PlatformHealth,
} from "@/components/dashboard/DashboardWidgets";

export default function AdminDashboard() {
  const { data: session } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("Dashboard");

  const adminName: string = session?.user?.name || "Admin";
  const adminEmail: string = session?.user?.email || "";

  return (
    /* 1. Changed main wrapper to flex-col so Header sits on top and spans full width */
    <div className="h-screen bg-gray-50 font-sans flex flex-col text-gray-900 overflow-hidden">
      {/* HEADER: Now at the very top level, it naturally takes 100% width */}
      <Header
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        adminName={adminName}
      />

      {/* LOWER SECTION: Contains Sidebar and Main Content side-by-side */}
      <div className="flex-1 flex min-h-0">
        {/* SIDEBAR: Now sits below the header */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          adminName={adminName}
          adminEmail={adminEmail}
        />

        {/* MAIN SCROLL AREA: flex-1 fills remaining width to the right of the sidebar */}
        <main className="flex-1 px-4 md:px-8 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Welcome back, {adminName.split(" ")[0]} 👋
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Clock size={13} /> Last updated: just now
            </div>
          </div>

          {/* Top Stat Cards */}
          <StatCards />

          {/* Middle Row: Revenue & Top Restaurants */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <RevenueOverview />
            </div>
            <div>
              <TopRestaurants />
            </div>
          </div>

          {/* Bottom Row: Recent Orders & Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left side takes up 2 out of 3 columns on large screens */}
            <div className="xl:col-span-2">
              <RecentOrders />
            </div>

            {/* Right side takes up the remaining 1 column */}
            <div className="space-y-4">
              <QuickActions />
              <PlatformHealth />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
