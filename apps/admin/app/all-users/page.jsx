// components/UserManagement.jsx
"use client";
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSession } from "next-auth/react";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Fetch initial list
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users?page=${page}&limit=10&search=${search}&role=${role}`);
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      
      if (json.success) {
        setUsers(json.data);
        setMeta(json.meta);
      } else {
        toast.error(json.message || "Failed to load users");
      }
    } catch (err) {
      toast.error("Network error: Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, role]);

  // Fetch full details when a user is clicked
  const handleUserClick = async (userId) => {
    const token = session?.user?.accessToken;

    console.log("Token : ", token);

    if (!token) {
      toast.error("❌ You must be logged in to view user details.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- Token added here
        }
      });
      
      if (!res.ok) throw new Error("Server error");
      const json = await res.json();
      
      if (json.success) {
        setSelectedUser(json.data);
      } else {
        toast.error(json.message || "Failed to load user details");
      }
    } catch (err) {
      toast.error("Failed to fetch user details");
    }
  };

  const handleToggleBlock = async () => {
    const token = session?.user?.accessToken;

    if (!token) {
      toast.error("❌ You must be logged in to perform this action.");
      return;
    }

    if (!selectedUser) return;
    const newStatus = !selectedUser.IsActive;
    
    // Optimistic UI update for immediate feedback
    const previousStatus = selectedUser.IsActive;
    setSelectedUser({ ...selectedUser, IsActive: newStatus });
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/${selectedUser.UserID}/toggle-status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <--- Token added here
        },
        body: JSON.stringify({ isActive: newStatus })
      });
      
      if (!res.ok) throw new Error("Server error");
      
      toast.success(`User successfully ${newStatus ? 'unblocked' : 'blocked'}`);
      fetchUsers(meta.currentPage); // Refresh list in background
      
    } catch (err) {
      // Revert on failure
      setSelectedUser({ ...selectedUser, IsActive: previousStatus });
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage platform users, roles, and account status.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input with Icon */}
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm"
              />
            </div>
            
            {/* Role Filter */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all shadow-sm text-gray-700 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="User">User</option>
              <option value="RestaurantOwner">Restaurant Owner</option>
              <option value="DeliveryPartner">Delivery Partner</option>
              <option value="SuperAdmin">SuperAdmin</option>
              <option value="Ops">Ops</option>
              <option value="Support">Support</option>
            </select>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="p-5">User</th>
                  <th className="p-5">Contact</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  // Loading Skeleton
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-5"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="p-5"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-20"></div></td>
                      <td className="p-5"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                      <td className="p-5 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <p className="text-base font-medium text-gray-900">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.UserID} className="hover:bg-orange-50/30 transition-colors group">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                            {u.Name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{u.Name}</span>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-600">{u.Email}</td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                          {u.Role || 'User'}
                        </span>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${u.IsActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {u.IsActive ? 'Active' : 'Blocked'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => handleUserClick(u.UserID)}
                          className="text-sm font-medium text-orange-600 hover:text-orange-800 opacity-0 group-hover:opacity-100 transition-opacity bg-orange-50 px-3 py-1.5 rounded-lg"
                        >
                          Details
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
              onClick={() => fetchUsers(meta.currentPage - 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Page {meta.currentPage} of {meta.totalPages || 1}
            </span>
            <button 
              disabled={meta.currentPage === meta.totalPages || meta.totalPages === 0}
              onClick={() => fetchUsers(meta.currentPage + 1)}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white shadow-sm transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Details Slide-Over Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedUser(null)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl animate-[slideIn_0.3s_ease-out]">
            <style>{`
              @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>
            
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* User Identity Card */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-6 mb-8 border border-orange-100 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3">
                   <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${selectedUser.IsActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {selectedUser.IsActive ? 'Active' : 'Blocked'}
                  </span>
                </div>
                <div className="w-20 h-20 bg-orange-200/80 rounded-full mx-auto mb-4 flex items-center justify-center text-orange-700 text-3xl font-extrabold shadow-sm ring-4 ring-white">
                  {selectedUser.Name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedUser.Name}</h3>
                <div className="flex flex-col items-center mt-2 gap-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    {selectedUser.Email}
                  </div>
                  {selectedUser.Phone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {selectedUser.Phone}
                    </div>
                  )}
                </div>
                
                {/* Wallet Pill */}
                <div className="mt-5 inline-flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-orange-50">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Wallet</span>
                  <span className="font-bold text-orange-600">₹{selectedUser.WalletBalance || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mb-8 space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Administration</h4>
                <button 
                  onClick={handleToggleBlock}
                  className={`w-full py-2.5 rounded-xl font-semibold text-white transition-all shadow-sm flex items-center justify-center gap-2 ${
                    selectedUser.IsActive 
                    ? 'bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-100' 
                    : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-4 focus:ring-emerald-100'
                  }`}
                >
                  {selectedUser.IsActive ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg> Block User</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Unblock User</>
                  )}
                </button>
              </div>

              {/* Recent Orders List */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
                  Recent Orders
                  <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">{selectedUser.orders?.length || 0}</span>
                </h4>
                
                {!selectedUser.orders || selectedUser.orders.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-gray-500 text-sm">This user hasn't placed any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.orders.map(order => (
                      <div key={order.OrderID} className="group border border-gray-100 hover:border-orange-200 p-4 rounded-xl bg-white shadow-sm hover:shadow transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {order.restaurant?.Name || 'Unknown Restaurant'}
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
};

export default UserManagement;