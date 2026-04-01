// app/orders/page.tsx
"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from "next-auth/react";
import { Package, Clock, CheckCircle2, Truck, XCircle, MapPin, Receipt, Utensils, User, ArrowLeft} from "lucide-react";
import Link from 'next/link';

// --- TypeScript Interfaces ---
interface OrderItem {
  OrderItemID: string;
  Quantity: number;
  ItemPrice: number;
  item: { ItemName: string };
}

interface Order {
  OrderID: string;
  OrderDateTime: string;
  TotalAmount: number;
  OrderStatus: 'Placed' | 'Preparing' | 'PickedUp' | 'Delivered' | 'Cancelled';
  user: { Name: string; Phone: string };
  restaurant: { Name: string };
  address?: { AddressLine: string; City: string; Pincode: string };
  items?: OrderItem[];
  payments?: { PaymentMethod: string; PaymentStatus: string }[];
}

const fmt = (num: number) => `₹${Number(num).toFixed(2)}`;

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Placed': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Preparing': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'PickedUp': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Cancelled': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { data: session } = useSession();

  // --- Fetch Orders ---
  const fetchOrders = async (page = 1) => {
    const token = (session?.user as any)?.accessToken;
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/orders/all?page=${page}&limit=10&search=${search}&status=${statusFilter}`, {
        method: 'GET', // explicitly state GET
        headers: { 
          'Content-Type': 'application/json', // explicitly state content type
          'Authorization': `Bearer ${token}` 
        }
      });
      
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.message || "Server error");
      }
      
      if (json.success) {
        setOrders(json.data);
        setMeta({
          currentPage: Number(json.meta.currentPage),
          totalPages: Number(json.meta.totalPages)
        });
      } else {
        toast.error(json.message || "Failed to load orders");
      }
    } catch (err: any) {
      console.error("Fetch Orders Error:", err);
      toast.error(err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };
  
  // --- Debounced Search ---
  useEffect(() => {
    if ((session?.user as any)?.accessToken) {
      const delay = setTimeout(() => fetchOrders(1), 500);
      return () => clearTimeout(delay);
    }
  }, [search, statusFilter, session]);

  // --- Fetch Order Details ---
  const handleOrderClick = async (orderId: string) => {
    const token = (session?.user as any)?.accessToken;
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.message || "Server error");
      
      if (json.success) {
        setSelectedOrder(json.data);
      } else {
        toast.error(json.message || "Failed to load order details");
      }
    } catch (err: any) {
      console.error("Fetch Order Details Error:", err);
      toast.error(err.message || "Failed to fetch order details");
    }
  };

  // --- Update Order Status ---
  const handleUpdateStatus = async (newStatus: string) => {
    const token = (session?.user as any)?.accessToken;
    if (!token || !selectedOrder) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/orders/${selectedOrder.OrderID}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Server error");
      
      toast.success(`Order marked as ${newStatus}`);
      setSelectedOrder({ ...selectedOrder, OrderStatus: newStatus as any }); 
      fetchOrders(meta.currentPage); 
    } catch (err: any) {
      console.error("Update Status Error:", err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="h-full bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF651D] transition-colors mb-6 w-fit"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order Management</h1>
            <p className="text-sm text-gray-500 mt-1">Monitor real-time orders, track deliveries, and manage disputes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search Order ID or Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm text-gray-900"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm text-gray-700 cursor-pointer"
            >
              <option value="">All Orders</option>
              <option value="Placed">Placed</option>
              <option value="Preparing">Preparing</option>
              <option value="PickedUp">Picked Up</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="p-5">Order Details</th>
                  <th className="p-5">Customer & Restaurant</th>
                  <th className="p-5">Amount</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-5"><div className="h-8 bg-gray-200 rounded w-32"></div></td>
                      <td className="p-5"><div className="h-8 bg-gray-200 rounded w-48"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded w-16"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-base font-medium text-gray-900">No orders found</p>
                      <p className="text-sm">No orders match your current filters.</p>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.OrderID} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                          #{o.OrderID.substring(0, 8)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock size={12}/>
                          {new Date(o.OrderDateTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="text-sm font-medium text-gray-800">{o.user?.Name || "Unknown"}</div>
                        <div className="text-xs text-gray-500 mt-0.5 font-semibold text-orange-600">→ {o.restaurant?.Name || "Unknown"}</div>
                      </td>
                      <td className="p-5 font-bold text-gray-900">
                        {fmt(o.TotalAmount)}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusStyles(o.OrderStatus)}`}>
                          {o.OrderStatus}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleOrderClick(o.OrderID)}
                          className="text-sm font-bold text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Receipt
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
              onClick={() => fetchOrders(Number(meta.currentPage) - 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {meta.currentPage} of {meta.totalPages || 1}
            </span>
            <button 
              disabled={meta.currentPage >= meta.totalPages || meta.totalPages === 0}
              onClick={() => fetchOrders(Number(meta.currentPage) + 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Slide-Over Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrder(null)}></div>
          
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            
            {/* Panel Header */}
            <div className="p-6 border-b border-gray-100 shrink-0 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-gray-900">Order Receipt</h2>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors">
                  <XCircle size={20}/>
                </button>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Order ID</p>
                  <p className="text-sm font-mono text-gray-900">{selectedOrder.OrderID}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusStyles(selectedOrder.OrderStatus)}`}>
                  {selectedOrder.OrderStatus}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Entities (User & Restaurant) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                  <User size={16} className="text-orange-500 mb-2"/>
                  <p className="text-[10px] text-orange-600/80 font-bold uppercase tracking-wider">Customer</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedOrder.user?.Name || "Unknown"}</p>
                  <p className="text-xs text-gray-500 truncate">{selectedOrder.user?.Phone || "No Phone"}</p>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <Utensils size={16} className="text-blue-500 mb-2"/>
                  <p className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Restaurant</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedOrder.restaurant?.Name || "Unknown"}</p>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={14}/> Delivery Address</h4>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-600">
                  {selectedOrder.address ? (
                    <p>{selectedOrder.address.AddressLine}, {selectedOrder.address.City} - {selectedOrder.address.Pincode}</p>
                  ) : (
                    <p className="italic">No address provided</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Receipt size={14}/> Order Items</h4>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {selectedOrder.items?.map(item => (
                    <div key={item.OrderItemID} className="p-3 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{item.Quantity}x</span>
                        <span className="text-gray-700">{item.item.ItemName}</span>
                      </div>
                      <span className="font-medium text-gray-900">{fmt(Number(item.ItemPrice) * item.Quantity)}</span>
                    </div>
                  ))}
                  
                  {/* Total Row */}
                  <div className="p-4 bg-gray-50 flex justify-between items-center rounded-b-xl">
                    <span className="font-bold text-gray-900">Grand Total</span>
                    <span className="text-lg font-black text-orange-600">{fmt(selectedOrder.TotalAmount)}</span>
                  </div>
                </div>
                
                {/* Payment Status Pill */}
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="mt-3 flex items-center justify-end gap-2 text-xs">
                    <span className="text-gray-500">Paid via {selectedOrder.payments[0].PaymentMethod}:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${selectedOrder.payments[0].PaymentStatus === 'Success' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {selectedOrder.payments[0].PaymentStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions (Bottom Sticky) */}
            <div className="p-6 border-t border-gray-100 bg-white shrink-0">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Admin Actions (Force Update)</h4>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('Preparing')}
                  className="py-2.5 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Utensils size={14}/> Force Preparing
                </button>
                <button 
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('Delivered')}
                  className="py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14}/> Force Delivered
                </button>
                <button 
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('Cancelled')}
                  className="col-span-2 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14}/> Cancel Order & Refund
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}