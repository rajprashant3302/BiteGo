"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserPlus, Users, MessageSquare, Settings, ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, UtensilsCrossed, Star, Bike } from "lucide-react";

// --- Formatters ---
const fmtCurr = (num: number) => `₹${Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNum = (num: number) => Number(num).toLocaleString('en-IN');

// ==========================================
// 1. STAT CARDS WIDGET (LIVE DATA)
// ==========================================
export function StatCards() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/dashboard/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setStats(json.data.statCards);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [session]);

  const cards = [
    { label: "Total Revenue", value: stats ? fmtCurr(stats.totalRevenue) : "₹0", icon: <DollarSign size={18}/>, color: "text-orange-500", bg: "bg-orange-50" },
    { label: "Total Orders", value: stats ? fmtNum(stats.totalOrders) : "0", icon: <ShoppingBag size={18}/>, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Users", value: stats ? fmtNum(stats.activeUsers) : "0", icon: <Users size={18}/>, color: "text-green-500", bg: "bg-green-50" },
    { label: "Restaurants", value: stats ? fmtNum(stats.totalRestaurants) : "0", icon: <UtensilsCrossed size={18}/>, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Avg. Rating", value: stats ? stats.avgRating : "0.0", icon: <Star size={18}/>, color: "text-yellow-500", bg: "bg-yellow-50" },
    { label: "Delivery Partners", value: stats ? fmtNum(stats.totalDeliveryPartners) : "0", icon: <Bike size={18}/>, color: "text-pink-500", bg: "bg-pink-50" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-3 ${card.bg} ${card.color}`}>
            {card.icon}
          </div>
          <p className="text-xs text-gray-500 font-semibold mb-1">{card.label}</p>
          {loading ? (
            <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <h3 className="text-xl font-black text-gray-900">{card.value}</h3>
          )}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 2. TOP RESTAURANTS WIDGET (LIVE DATA)
// ==========================================
export function TopRestaurants() {
  const { data: session } = useSession();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/dashboard/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setRestaurants(json.data.topRestaurants);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [session]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-extrabold text-gray-900">Top Restaurants</h2>
        <Link href="/restaurants" className="text-sm font-bold text-orange-600 hover:text-orange-700">See all</Link>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-3 bg-gray-100 rounded w-16"></div>
              </div>
            </div>
          ))
        ) : restaurants.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">No order data available yet.</div>
        ) : (
          restaurants.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{r.name}</p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-semibold">
                    <span className="text-yellow-500">★ {r.rating}</span>
                    <span>•</span>
                    <span>{fmtNum(r.orders)} orders</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-gray-900">{fmtCurr(r.revenue)}</p>
                {i < 2 ? (
                  <p className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-0.5"><ArrowUpRight size={10}/> Up</p>
                ) : (
                  <p className="text-[10px] font-bold text-gray-400 flex items-center justify-end gap-0.5"><ArrowUpRight size={10}/> Stable</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. QUICK ACTIONS WIDGET (STATIC)
// ==========================================
export function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-extrabold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-2">
        <Link href="/invite" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 text-orange-600 font-bold text-sm transition-colors border border-orange-100 bg-orange-50/50">
          <UserPlus size={18} /> Invite New Member
        </Link>
        <Link href="/users" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 text-blue-600 font-bold text-sm transition-colors border border-transparent hover:border-blue-100">
          <Users size={18} /> View All Users
        </Link>
        <Link href="/chat" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 text-purple-600 font-bold text-sm transition-colors border border-transparent hover:border-purple-100">
          <MessageSquare size={18} /> Support Tickets
        </Link>
        <Link href="/settings" className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 text-gray-700 font-bold text-sm transition-colors border border-transparent">
          <Settings size={18} /> Platform Settings
        </Link>
      </div>
    </div>
  );
}

// ==========================================
// 4. PLATFORM HEALTH WIDGET (STATIC)
// ==========================================
export function PlatformHealth() {
  const services = [
    { name: "Auth Service", status: "Online", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    { name: "Order Service", status: "Online", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    { name: "Mailer Service", status: "Online", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    { name: "Delivery Service", status: "Down", color: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-extrabold text-gray-900 mb-4">Platform Health</h2>
      <div className="space-y-3">
        {services.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">{s.name}</span>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${s.bg}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${s.color} animate-pulse`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${s.text}`}>{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}