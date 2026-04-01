"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import {ArrowLeft} from "lucide-react"

// 1. TypeScript Interfaces for Restaurant Data
interface Order {
  OrderID: string;
  TotalAmount: number;
  OrderDateTime: string;
  OrderStatus: string;
  customer?: { Name: string };
}

interface Restaurant {
  RestaurantID: string;
  Name: string;
  CategoryName?: string; 
  IsActive: boolean;
  IsOpen: boolean;
  Rating?: number;
  TotalEarnings?: number; // Added to interface
  owner?: {
    user?: {
      Email: string;
      Phone?: string;
    }
  };
  orders?: Order[];
}

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Fetch initial list
  const fetchRestaurants = async (page = 1) => {
    const token = (session?.user as any)?.accessToken;

    if (!token) return; 

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/restaurants/all?page=${page}&limit=10&search=${search}&status=${statusFilter}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      
      if (json.success) {
        setRestaurants(json.data);
        setMeta(json.meta);
      } else {
        toast.error(json.message || "Failed to load restaurants");
      }
    } catch (err) {
      toast.error("Network error: Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if ((session?.user as any)?.accessToken) {
      const delayDebounceFn = setTimeout(() => {
        fetchRestaurants(1);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, statusFilter, session]); 

  // Fetch full details when a restaurant is clicked
  const handleRestaurantClick = async (restaurantId: string) => {
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      toast.error("❌ You must be logged in to view details.");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/restaurants/${restaurantId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      
      if (json.success) {
        setSelectedRestaurant(json.data);
      } else {
        toast.error(json.message || "Failed to load restaurant details");
      }
    } catch (err) {
      toast.error("Failed to fetch restaurant details");
    }
  };

  // Toggle Active/Blocked status
  const handleToggleBlock = async () => {
    const token = (session?.user as any)?.accessToken;

    if (!token) {
      toast.error("❌ You must be logged in to perform this action.");
      return;
    }

    if (!selectedRestaurant) return;
    const newStatus = !selectedRestaurant.IsActive;
    
    // Optimistic UI update
    const previousStatus = selectedRestaurant.IsActive;
    setSelectedRestaurant({ ...selectedRestaurant, IsActive: newStatus });
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/restaurants/${selectedRestaurant.RestaurantID}/toggle-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      if (!res.ok) throw new Error("Server error");
      
      toast.success(`Restaurant successfully ${newStatus ? 'activated' : 'suspended'}`);
      fetchRestaurants(meta.currentPage); 
      
    } catch (err) {
      // Revert on failure
      setSelectedRestaurant({ ...selectedRestaurant, IsActive: previousStatus });
      toast.error("Failed to update restaurant status");
    }
  };

  return (
    <div className="h-full bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* NEW: Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF651D] transition-colors mb-6 w-fit"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Restaurant Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage restaurant partners, cuisines, and operational status.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search restaurants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-black text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm text-gray-700 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="p-5">Restaurant</th>
                  <th className="p-5">Contact</th>
                  <th className="p-5">Cuisine</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-5"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                      <td className="p-5 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <p className="text-base font-medium text-gray-900">No restaurants found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  restaurants.map((r) => (
                    <tr key={r.RestaurantID} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                            {r.Name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 block">{r.Name}</span>
                            {r.Rating && (
                              <span className="text-[10px] text-yellow-600 flex items-center gap-0.5 font-bold">
                                ★ {r.Rating}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* UPDATED: Contact Column shows Email and Phone */}
                      <td className="p-5">
                        <div className="text-sm font-medium text-gray-800">
                          {r.owner?.user?.Email || 'No Email Linked'}
                        </div>
                        {r.owner?.user?.Phone && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {r.owner.user.Phone}
                          </div>
                        )}
                      </td>

                      <td className="p-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {r.CategoryName || 'General'}
                        </span>
                      </td>

                      {/* UPDATED: Status Column shows Status AND Earnings */}
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className={`inline-flex w-fit items-center px-2.5 py-1 rounded-full text-xs font-medium border ${r.IsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {r.IsActive ? 'Active' : 'Suspended'}
                          </span>
                          <span className="text-xs font-bold text-green-600 mt-1.5 ml-1">
                            ₹{r.TotalEarnings || 0} Earned
                          </span>
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleRestaurantClick(r.RestaurantID)}
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-5 flex justify-between items-center border-t border-gray-200 bg-gray-50/50">
            <button 
              disabled={meta.currentPage === 1}
              onClick={() => fetchRestaurants(meta.currentPage - 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {meta.currentPage} of {meta.totalPages || 1}
            </span>
            <button 
              disabled={meta.currentPage === meta.totalPages || meta.totalPages === 0}
              onClick={() => fetchRestaurants(meta.currentPage + 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Slide-Over Panel */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedRestaurant(null)}
          ></div>
          
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
            
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Restaurant Profile</h2>
                <button 
                  onClick={() => setSelectedRestaurant(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Restaurant Identity Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 mb-8 border border-orange-100 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                   <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${selectedRestaurant.IsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedRestaurant.IsActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
                <div className="w-20 h-20 bg-orange-200/80 rounded-2xl mx-auto mb-4 flex items-center justify-center text-orange-700 text-3xl font-extrabold shadow-sm ring-4 ring-white">
                  {selectedRestaurant.Name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedRestaurant.Name}</h3>
                <span className="text-xs text-orange-600 font-bold uppercase tracking-wider">{selectedRestaurant.CategoryName || 'General'}</span>
                
                <div className="flex flex-col items-center mt-3 gap-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {selectedRestaurant.owner?.user?.Email || 'No Email'}
                  </div>
                  {selectedRestaurant.owner?.user?.Phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {selectedRestaurant.owner.user.Phone}
                    </div>
                  )}
                </div>
                
                {/* Earnings Pill */}
                <div className="mt-5 inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-orange-50">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Earnings</span>
                  <span className="font-bold text-green-600">₹{selectedRestaurant.TotalEarnings || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-8 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Administration</h4>
                <button 
                  onClick={handleToggleBlock}
                  className={`w-full py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                    selectedRestaurant.IsActive 
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-100' 
                    : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-100'
                  }`}
                >
                  {selectedRestaurant.IsActive ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Suspend Restaurant</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Activate Restaurant</>
                  )}
                </button>
              </div>

              {/* Recent Orders List */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  Recent Orders
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{selectedRestaurant.orders?.length || 0}</span>
                </h4>
                
                {!selectedRestaurant.orders || selectedRestaurant.orders.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-sm">No recent orders for this restaurant.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedRestaurant.orders.map(order => (
                      <div key={order.OrderID} className="group border border-gray-100 hover:border-orange-200 p-4 rounded-xl bg-white shadow-sm hover:shadow transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {order.customer?.Name || 'Guest User'}
                          </span>
                          <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded text-sm">
                            ₹{order.TotalAmount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {new Date(order.OrderDateTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="uppercase font-semibold tracking-wider text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {order.OrderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}