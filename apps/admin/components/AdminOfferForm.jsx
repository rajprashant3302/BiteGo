"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiSave, FiLoader } from "react-icons/fi";

// Accept offerId as a prop (will be undefined on the "Add" page, and populated on the "Edit" page)
export default function AdminOfferForm({ offerId }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!offerId); // Only load if we are editing

  const API_BASE = process.env.NEXT_PUBLIC_PROMOTION_SERVICE_URL || "http://localhost/svc/promotion";

  const [formData, setFormData] = useState({
    Title: "",
    Description: "",
    Type: "AUTOMATIC", // AUTOMATIC or COUPON
    PromoCode: "",
    Visibility: "PUBLIC", // PUBLIC, HIDDEN, PRIVATE
    TargetEntity: "User", // User, DeliveryPartner, RestaurantOwner, All
    RewardType: "DiscountOnOrder", // Bonus, Cashback, DiscountOnOrder, FreeDelivery
    RewardValue: "",
    DiscountType: "Percentage", // Flat or Percentage
    MinOrderValue: "0",
    MaxDiscount: "",
    IsStackable: false,
    Priority: 0,
    StartTime: "",
    EndTime: "",
  });

  // FORMATTER: HTML datetime-local inputs require YYYY-MM-DDThh:mm format
  const formatForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  // FETCH EXISTING DATA IF EDITING
  useEffect(() => {
    if (!offerId) return;

    const fetchOffer = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/offers/${offerId}`, {
          headers: { 'x-user-role': 'SuperAdmin' }
        });
        if (res.ok) {
          const json = await res.json();
          const data = json.data;
          
          setFormData({
            ...data,
            PromoCode: data.PromoCode || "",
            MaxDiscount: data.MaxDiscount || "",
            StartTime: formatForInput(data.StartTime),
            EndTime: formatForInput(data.EndTime),
          });
        }
      } catch (err) {
        console.error("Failed to load offer", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffer();
  }, [offerId, API_BASE]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setIsSubmitting(true);

  //   try {
  //     const payload = {
  //       ...formData,
  //       RewardValue: parseFloat(formData.RewardValue),
  //       MinOrderValue: parseFloat(formData.MinOrderValue || 0),
  //       MaxDiscount: formData.MaxDiscount ? parseFloat(formData.MaxDiscount) : null,
  //       Priority: parseInt(formData.Priority, 10),
  //       StartTime: new Date(formData.StartTime).toISOString(),
  //       EndTime: new Date(formData.EndTime).toISOString(),
  //       // Clear promo code if it's an automatic offer
  //       PromoCode: formData.Type === "AUTOMATIC" ? null : formData.PromoCode.toUpperCase()
  //     };

  //     // Determine URL and Method based on whether we are adding or editing
  //     const url = offerId ? `${API_BASE}/api/admin/offers/${offerId}` : `${API_BASE}/api/admin/offers`;
  //     const method = offerId ? "PUT" : "POST";

  //     const res = await fetch(url, {
  //       method: method,
  //       headers: { 
  //         "Content-Type": "application/json",
  //         "x-user-role": "SuperAdmin"
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (res.ok) {
  //       router.push("/admin/offers");
  //     } else {
  //       const err = await res.json();
  //       alert(`Error: ${err.message || 'Failed to save offer'}`);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     alert("Something went wrong");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        // SAFE PARSING: Add || 0 so empty strings become 0 instead of NaN
        RewardValue: parseFloat(formData.RewardValue || 0),
        MinOrderValue: parseFloat(formData.MinOrderValue || 0),
        Priority: parseInt(formData.Priority || 0, 10),
        MaxDiscount: formData.MaxDiscount ? parseFloat(formData.MaxDiscount) : null,
        
        StartTime: new Date(formData.StartTime).toISOString(),
        EndTime: new Date(formData.EndTime).toISOString(),
        
        // Clear promo code if it's an automatic offer
        PromoCode: formData.Type === "AUTOMATIC" ? null : formData.PromoCode.toUpperCase(),
        
        // Clear discount type if it's Free Delivery (since flat/percentage doesn't apply)
        DiscountType: formData.RewardType === 'FreeDelivery' ? null : formData.DiscountType
      };

      // Determine URL and Method based on whether we are adding or editing
      const url = offerId ? `${API_BASE}/api/admin/offers/${offerId}` : `${API_BASE}/api/admin/offers`;
      const method = offerId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { 
          "Content-Type": "application/json",
          "x-user-role": "SuperAdmin"
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/offers");
      } else {
        // This will now successfully alert the exact Prisma error if it fails!
        const err = await res.json();
        alert(`Database Error: ${err.error || err.message}`);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong with the network request.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const inputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-medium text-gray-900";
  const labelClass = "block text-sm font-bold text-gray-700 mb-2";

  if (isLoading) return <div className="flex justify-center py-20"><FiLoader className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Core Info */}
        <div className="md:col-span-2">
          <label className={labelClass}>Offer Title</label>
          <input required type="text" name="Title" value={formData.Title} onChange={handleChange} className={inputClass} placeholder="e.g., Diwali Mega Blast 2024" />
        </div>

        <div>
          <label className={labelClass}>Offer Type</label>
          <select name="Type" value={formData.Type} onChange={handleChange} className={inputClass}>
            <option value="AUTOMATIC">Automatic (System Applied)</option>
            <option value="COUPON">Coupon Code (User must type)</option>
          </select>
        </div>

        {formData.Type === "COUPON" && (
          <div>
            <label className={labelClass}>Promo Code</label>
            <input required={formData.Type === "COUPON"} type="text" name="PromoCode" value={formData.PromoCode} onChange={handleChange} className={`${inputClass} uppercase`} placeholder="e.g., DIWALI50" />
          </div>
        )}

        <div>
          <label className={labelClass}>Target Audience</label>
          <select name="TargetEntity" value={formData.TargetEntity} onChange={handleChange} className={inputClass}>
            <option value="User">Customers (Users)</option>
            <option value="DeliveryPartner">Delivery Partners (Drivers)</option>
            <option value="RestaurantOwner">Restaurant Owners</option>
            <option value="All">Platform Wide (Everyone)</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Visibility</label>
          <select name="Visibility" value={formData.Visibility} onChange={handleChange} className={inputClass}>
            <option value="PUBLIC">Public (Shown on banners/lists)</option>
            <option value="HIDDEN">Hidden (Code required, not listed)</option>
            <option value="PRIVATE">Private (Only for whitelisted users)</option>
          </select>
        </div>

        {/* Reward Logic */}
        <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
          <h3 className="text-lg font-black text-gray-900 mb-4">Reward Configuration</h3>
        </div>

        <div>
          <label className={labelClass}>Reward Type</label>
          <select name="RewardType" value={formData.RewardType} onChange={handleChange} className={inputClass}>
            <option value="DiscountOnOrder">Instant Cart Discount</option>
            <option value="Cashback">Cashback to Wallet (Post-order)</option>
            <option value="Bonus">Instant Wallet Bonus</option>
            <option value="FreeDelivery">Free Delivery</option>
          </select>
        </div>

        {formData.RewardType !== 'FreeDelivery' && (
          <div>
            <label className={labelClass}>Discount Format</label>
            <select name="DiscountType" value={formData.DiscountType} onChange={handleChange} className={inputClass}>
              <option value="Percentage">Percentage (%)</option>
              <option value="Flat">Flat Amount (₹)</option>
            </select>
          </div>
        )}

        {formData.RewardType !== 'FreeDelivery' && (
          <div>
            <label className={labelClass}>Reward Value {formData.DiscountType === 'Percentage' ? '(%)' : '(₹)'}</label>
            <input required type="number" name="RewardValue" value={formData.RewardValue} onChange={handleChange} className={inputClass} placeholder="e.g., 50" />
          </div>
        )}

        {formData.DiscountType === "Percentage" && formData.RewardType !== 'FreeDelivery' && (
          <div>
            <label className={labelClass}>Maximum Discount Cap (₹)</label>
            <input type="number" name="MaxDiscount" value={formData.MaxDiscount} onChange={handleChange} className={inputClass} placeholder="e.g., 100" />
          </div>
        )}

        <div>
          <label className={labelClass}>Minimum Order Value (₹)</label>
          <input type="number" name="MinOrderValue" value={formData.MinOrderValue} onChange={handleChange} className={inputClass} />
        </div>

        {/* System Logic */}
        <div className="md:col-span-2 border-t border-gray-100 pt-6 mt-2">
          <h3 className="text-lg font-black text-gray-900 mb-4">Engine Logic & Timing</h3>
        </div>

        <div>
          <label className={labelClass}>Start Date & Time</label>
          <input required type="datetime-local" name="StartTime" value={formData.StartTime} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>End Date & Time</label>
          <input required type="datetime-local" name="EndTime" value={formData.EndTime} onChange={handleChange} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Calculation Priority</label>
          <input type="number" name="Priority" value={formData.Priority} onChange={handleChange} className={inputClass} placeholder="Higher number applies first (e.g., 10)" />
          <p className="text-xs text-gray-500 mt-1">Determines execution order if multiple offers apply.</p>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <input type="checkbox" id="IsStackable" name="IsStackable" checked={formData.IsStackable} onChange={handleChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
          <div>
            <label htmlFor="IsStackable" className="font-bold text-gray-900 block">Allow Stacking?</label>
            <span className="text-xs text-gray-500">Can this be used alongside other active offers?</span>
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-6 border-t border-gray-100 mt-4">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl mr-4 transition"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-black flex items-center transition disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
        >
          {isSubmitting ? <FiLoader className="animate-spin mr-2" /> : <FiSave className="mr-2" />}
          {isSubmitting ? "Saving..." : offerId ? "Update Campaign" : "Deploy Campaign"}
        </button>
      </div>
    </form>
  );
}