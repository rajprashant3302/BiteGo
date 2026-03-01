"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FiArrowLeft, FiPlus, FiTrash2, FiLoader, 
  FiImage, FiDollarSign, FiType 
} from "react-icons/fi";

export default function ManageMenuPage() {
  const router = useRouter();
  const params = useParams();
  const { restaurantId } = params;
  const { data: session, status } = useSession();

  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    isVeg: true
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (status === "authenticated" && restaurantId) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/menu/${restaurantId}` 
            : `http://localhost:5001/api/menu/${restaurantId}`;
            
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            setMenuItems(data);
          }
        } catch (error) {
          console.error("Failed to fetch menu", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchMenu();
  }, [status, restaurantId]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/menu/add`
        : "http://localhost:5001/api/menu/add";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newItem, restaurantId })
      });

      if (res.ok) {
        const data = await res.json();
        setMenuItems([...menuItems, data.item]);
        setShowAddForm(false);
        setNewItem({ name: "", description: "", price: "", imageUrl: "", isVeg: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };


  const handleDelete = async (itemId) => {
    if(!confirm("Delete this item?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/menu/${itemId}`
        : `http://localhost:5001/api/menu/${itemId}`;

      const res = await fetch(apiUrl, { method: "DELETE" });
      if (res.ok) {
        setMenuItems(menuItems.filter(item => item.ItemID !== itemId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-0">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-5 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm">
              <FiArrowLeft className="mr-2" size={18} /> Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">Manage Menu</h1>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-[#FFF0E6] text-[#FF651D] hover:bg-[#FF651D] hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center"
            >
              <FiPlus className="mr-1" /> Add Item
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 animate-fade-in-down">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Add New Dish</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiType className="text-gray-400 group-focus-within:text-[#FF651D]" size={20} />
                  </div>
                  <input type="text" required value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} placeholder="Dish Name" className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-[#FF651D]" />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiDollarSign className="text-gray-400 group-focus-within:text-[#FF651D]" size={20} />
                  </div>
                  <input type="number" step="0.01" required value={newItem.price} onChange={(e) => setNewItem({...newItem, price: e.target.value})} placeholder="Price (₹)" className="w-full pl-12 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-[#FF651D]" />
                </div>
              </div>

              <textarea value={newItem.description} onChange={(e) => setNewItem({...newItem, description: e.target.value})} placeholder="Description (ingredients, taste, etc.)" className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-[#FF651D] h-24 resize-none" />

              <div className="flex items-center space-x-4">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={newItem.isVeg} onChange={(e) => setNewItem({...newItem, isVeg: e.target.checked})} className="w-5 h-5 text-green-500 rounded focus:ring-green-500" />
                  <span className="ml-2 font-bold text-gray-700">Pure Veg</span>
                </label>
              </div>

              <button type="submit" disabled={isSaving || !newItem.name} className="w-full bg-[#FF651D] text-white font-bold py-3.5 rounded-xl shadow-md disabled:opacity-50">
                {isSaving ? "Saving..." : "Save Dish"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {menuItems.map(item => (
            <div key={item.ItemID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start group">
              <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 mt-1 mr-3 ${item.IsVeg ? 'border-green-600' : 'border-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${item.IsVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
              </div>
              
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-lg">{item.Name}</h3>
                <p className="font-bold text-gray-900 mt-1">₹{item.Price}</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.Description}</p>
              </div>

              <button onClick={() => handleDelete(item.ItemID)} className="ml-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <FiTrash2 size={20} />
              </button>
            </div>
          ))}
          {menuItems.length === 0 && !showAddForm && (
            <div className="col-span-full text-center py-12 text-gray-500 font-medium">
              No items in your menu yet. Click "Add Item" to start!
            </div>
          )}
        </div>

      </div>
    </div>
  );
}