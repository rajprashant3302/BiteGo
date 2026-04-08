"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";
import { ShoppingBag } from "lucide-react";

// --- Types ---
interface Order {
  OrderID: string;
  OrderDateTime: string;
  TotalAmount: number;
  OrderStatus: 'Placed' | 'Preparing' | 'PickedUp' | 'Delivered' | 'Cancelled';
  user: { Name: string };
  restaurant: { Name: string };
}

// --- Helpers ---
const fmt = (num: number) => `₹${Number(num).toFixed(0)}`; // Matches design (no decimals)

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Preparing': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Placed': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

// Calculates "2m ago", "5h ago", etc.
const timeAgo = (dateString: string) => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMins = Math.round((now.getTime() - past.getTime()) / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.round(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchRecentOrders = async () => {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;

      try {
        // Fetch only the 5 most recent orders
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/orders/all?page=1&limit=5`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const json = await res.json();
        if (json.success) {
          setOrders(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch recent orders", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentOrders();
    
    // Optional: Refresh every 30 seconds to keep the dashboard live
    const interval = setInterval(fetchRecentOrders, 30000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-extrabold text-gray-900">Recent Orders</h2>
        <Link href="/orders" className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors">
          View all
        </Link>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4 flex-1">
        {loading ? (
          // Loading Skeletons
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-32"></div>
                </div>
              </div>
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
            <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No recent orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.OrderID} className="flex items-center justify-between group">
              
              {/* Left: Icon & Info */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{order.user?.Name || "Guest"}</p>
                    <span className="text-[10px] text-gray-400 font-mono">ORD-{order.OrderID.substring(0, 4).toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium line-clamp-1">{order.restaurant?.Name || "Unknown"}</p>
                </div>
              </div>

              {/* Right: Amount, Time, Status */}
              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <p className="text-sm font-extrabold text-gray-900">{fmt(order.TotalAmount)}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{timeAgo(order.OrderDateTime)}</p>
                </div>
                <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider w-20 ${getStatusStyles(order.OrderStatus)}`}>
                  {order.OrderStatus}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}