// src/app/menu/[restaurantId]/page.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FiArrowLeft, FiPlus, FiTrash2, FiLoader,
  FiEdit3, FiShoppingBag, FiStar
} from "react-icons/fi";

export default function MenuListPage() {
  const router = useRouter();
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchMenu = async () => {
      // ✅ 1. Only proceed if restaurantId is a real value
      if (!restaurantId) {
        console.log("Waiting for restaurantId to be available in URL...");
        return;
      }

      console.log("Fetching menu for:", restaurantId);

      try {
        const res = await fetch(`${API_BASE}/api/menu/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          setMenuItems(data);
        } else {
          console.error("Server error:", res.status);
        }
      } catch (err) {
        console.error("Connection Refused. Check Docker port 5001:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this dish?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) setMenuItems(prev => prev.filter(i => i.ItemID !== id));
    } catch (err) { console.error(err); }
  };

  const toggleAvailability = async (item) => {
    try {
      const res = await fetch(`${API_BASE}/api/menu/edit/${item.ItemID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item, // Send existing data
          isAvailable: !item.IsAvailable // Flip the status
        })
      });

      if (res.ok) {
        setMenuItems(prev => prev.map(i =>
          i.ItemID === item.ItemID ? { ...i, IsAvailable: !i.IsAvailable } : i
        ));
      }
    } catch (err) {
      console.error("Quick Toggle Failed", err);
    }
  };

  if (!restaurantId || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin text-[#FF651D] mb-4" size={40} />
          <p className="text-gray-500 font-medium">Loading your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-0">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-5 flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm"
            >
              <FiArrowLeft className="mr-2" size={18} /> Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">Manage Menu</h1>
            <div className="w-16"></div> {/* Spacer for symmetry */}
          </div>
        </div>

        {/* Menu Items Logic */}
        {menuItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
            {/* Replace src with your specific SVG path */}
            <img src="/no-menu-animate.svg" alt="No Menu" className="w-64 h-64 mb-6 opacity-90" />
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">No Dishes Yet</h2>
            <p className="text-gray-500 mb-8 max-w-sm">Your restaurant menu is currently empty. Add your first signature dish to get started.</p>
            <button
              onClick={() => router.push(`/partner/menu/${restaurantId}/add`)}
              className="bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center"
            >
              <FiPlus className="mr-2" size={20} /> Add Your First Item
            </button>
          </div>
        ) : (
          /* Populated List */
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div key={item.ItemID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group">
                <div className="flex items-start">
                  {/* Dish Image or Icon */}
                  <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                    {item.ItemImageURL ? (
                      <img src={item.ItemImageURL} className="w-full h-full object-cover" alt={item.ItemName} />
                    ) : (
                      <FiShoppingBag size={24} className="text-[#FF651D]" />
                    )}
                  </div>

                  <div className="ml-4 flex-grow pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{item.ItemName}</h3>
                      {/* Veg/Non-Veg Indicator */}
                      <div className={`w-3 h-3 rounded-full border-2 ${item.IsVeg ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'}`}></div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-sm text-[#FF651D] font-black">₹{item.Price}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.AvailableQuantity > 0 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}>
                        Stock: {item.AvailableQuantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                      {item.Description || "No description provided."}
                    </p>

                    <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-50">
                      <button
                        onClick={() => toggleAvailability(item)}
                        className={`text-sm font-semibold flex items-center transition-colors ${item.IsAvailable ? "text-green-600" : "text-slate-400"
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${item.IsAvailable ? "bg-green-600" : "bg-slate-400"}`}></div>
                        {item.IsAvailable ? "Available" : "Hidden"}
                      </button>
                      <button
                        onClick={() => router.push(`/partner/menu/${restaurantId}/edit/${item.ItemID}`)}
                        className="text-sm font-semibold text-[#FF651D] flex items-center hover:underline"
                      >
                        <FiEdit3 className="mr-1.5" size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.ItemID)}
                        className="text-sm font-semibold text-red-500 flex items-center hover:underline cursor-pointer"
                      >
                        <FiTrash2 className="mr-1.5" size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* "Add Another" Dashed Button */}
            <button
              onClick={() => router.push(`/partner/menu/${restaurantId}/add`)}
              className="w-full bg-white border-2 border-dashed border-[#FFDBCB] text-[#FF651D] hover:bg-[#FFF0E6] font-bold py-5 rounded-2xl transition-all flex items-center justify-center mt-6"
            >
              <FiPlus className="mr-2" size={22} /> Add Another Dish
            </button>
          </div>
        )}

      </div>
    </div>
  );
}