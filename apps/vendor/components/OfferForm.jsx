"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiCheck, FiLoader, FiSlash, FiGrid } from "react-icons/fi";
// ✅ Fixed path using alias for src structure
import { biteToast } from "../app/lib/toast";

export default function OfferForm({ restaurantId, offerId, mode, initialData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  
  const [formData, setFormData] = useState({
    title: initialData?.Title || "",
    description: initialData?.Description || "",
    discountType: initialData?.DiscountType || "Percentage",
    discountValue: initialData?.DiscountValue || "",
    maxDiscount: initialData?.MaxDiscount || "",
    minOrderValue: initialData?.MinOrderValue || 0,
    endTime: initialData?.EndTime?.split('T')[0] || "",
    selectedItemIds: initialData?.applicableItems?.map(i => i.MenuItemID) || [],
    isActive: initialData?.IsActive ?? true 
  });

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    fetch(`${API_BASE}/api/menu/${restaurantId}`)
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error("Menu fetch failed:", err));
  }, [restaurantId, API_BASE]);

  const toggleItemSelection = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedItemIds: prev.selectedItemIds.includes(id)
        ? prev.selectedItemIds.filter(item => item !== id)
        : [...prev.selectedItemIds, id]
    }));
  };

  // ✅ Force selection to empty to apply to "Whole Menu"
  const applyToWholeMenu = () => {
    setFormData(prev => ({ ...prev, selectedItemIds: [] }));
    biteToast.success("Offer set to Whole Menu");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = mode === "edit" ? `${API_BASE}/api/offers/${offerId}` : `${API_BASE}/api/offers/add`;
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, restaurantId }),
      });
      
      if (res.ok) {
        biteToast.success(mode === "edit" ? "Promotion updated!" : "Promotion launched!");
        router.push(`/partner/offers/${restaurantId}`);
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) { 
        biteToast.error("Could not save offer. Check your connection.");
        console.error(err); 
    } finally { setIsSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 font-sans">
      
      {/* --- Section 1: Basic Info --- */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Offer Title</label>
          <input 
            required 
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl border-none focus:ring-2 ring-orange-500 outline-none font-bold text-slate-800"
            placeholder="e.g. Summer Special 50% Off"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Internal Description (Optional)</label>
          <textarea 
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl border-none focus:ring-2 ring-orange-500 outline-none text-sm font-medium text-slate-600 resize-none h-20"
            placeholder="Describe this offer for your records..."
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>
      </div>

      {/* --- Section 2: Discount Logic --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Discount Type</label>
          <select 
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl outline-none font-bold text-slate-700"
            value={formData.discountType}
            onChange={e => setFormData({...formData, discountType: e.target.value})}
          >
            <option value="Percentage">Percentage (%)</option>
            <option value="Flat">Flat Amount (₹)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Discount Value</label>
          <input 
            type="number" required 
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl outline-none font-black text-slate-800"
            placeholder="Value"
            value={formData.discountValue}
            onChange={e => setFormData({...formData, discountValue: e.target.value})}
          />
        </div>
      </div>

      {/* --- Section 3: Constraints & Timeline --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Min. Order (₹)</label>
          <input 
            type="number"
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl outline-none font-bold text-slate-800"
            value={formData.minOrderValue}
            onChange={e => setFormData({...formData, minOrderValue: e.target.value})}
          />
        </div>
        <div>
          <label className="text-xs font-black text-gray-500 uppercase ml-1">Max Discount (₹)</label>
          <input 
            type="number"
            className="w-full p-4 mt-2 bg-gray-50 rounded-2xl outline-none font-bold text-slate-800"
            placeholder="No Limit"
            value={formData.maxDiscount}
            onChange={e => setFormData({...formData, maxDiscount: e.target.value})}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-black text-gray-500 uppercase ml-1">Offer Expiry Date</label>
        <input 
          type="date" required
          className="w-full p-4 mt-2 bg-gray-50 rounded-2xl outline-none font-bold text-slate-800"
          value={formData.endTime}
          onChange={e => setFormData({...formData, endTime: e.target.value})}
        />
      </div>

      <hr className="border-gray-100" />

      {/* --- Section 4: Item Selection --- */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <label className="text-xs font-black text-gray-500 uppercase ml-1">Applicable Items</label>
            <p className="text-[10px] text-slate-400 font-bold ml-1 mt-1">Select items or leave empty for store-wide offer.</p>
          </div>
          {formData.selectedItemIds.length > 0 && (
            <button 
              type="button" 
              onClick={applyToWholeMenu}
              className="text-[10px] flex items-center gap-1 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 px-3 py-1.5 rounded-xl font-black uppercase transition-colors"
            >
              <FiSlash /> Clear All
            </button>
          )}
        </div>

        {/* --- Selection Status Banner --- */}
        <div className={`mb-4 p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${
          formData.selectedItemIds.length === 0 
          ? "border-indigo-100 bg-indigo-50/50 text-indigo-700" 
          : "border-orange-100 bg-orange-50/50 text-orange-700 shadow-sm"
        }`}>
          <div className={`p-2 rounded-xl ${formData.selectedItemIds.length === 0 ? 'bg-indigo-100' : 'bg-orange-100'}`}>
            {formData.selectedItemIds.length === 0 ? <FiGrid /> : <FiCheck />}
          </div>
          <span className="text-xs font-black uppercase tracking-tight">
            {formData.selectedItemIds.length === 0 
              ? "Status: Applying to Whole Menu" 
              : `Status: Applied to ${formData.selectedItemIds.length} items`}
          </span>
        </div>
        
        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <div 
              key={item.ItemID}
              onClick={() => toggleItemSelection(item.ItemID)}
              className={`p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all ${
                formData.selectedItemIds.includes(item.ItemID) 
                ? "border-orange-500 bg-orange-50" 
                : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <span className="text-sm font-bold text-slate-700">{item.ItemName}</span>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
                 formData.selectedItemIds.includes(item.ItemID) 
                 ? "bg-orange-500 border-orange-500 text-white" 
                 : "border-gray-200"
              }`}>
                {formData.selectedItemIds.includes(item.ItemID) && <FiCheck size={14} strokeWidth={4} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Section 5: Status & Submit --- */}
      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-200">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Offer Status</span>
          <span className={`text-sm font-bold ${formData.isActive ? 'text-green-600' : 'text-slate-400'}`}>
            {formData.isActive ? 'Active & Live' : 'Paused'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all outline-none ${
            formData.isActive ? "bg-green-500" : "bg-slate-300"
          }`}
        >
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.isActive ? "translate-x-7" : "translate-x-1"}`} />
        </button>
      </div>

      <button
        disabled={isSaving}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-100 transition-all transform active:scale-95 disabled:bg-slate-300"
      >
        {isSaving ? <FiLoader className="animate-spin mx-auto" size={24} /> : (mode === "edit" ? "Update Promotion" : "Launch Promotion")}
      </button>
    </form>
  );
}