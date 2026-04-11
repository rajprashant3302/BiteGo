"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiTrash2, FiLoader, FiGift, FiCalendar, FiUsers, FiStar } from "react-icons/fi";

export default function AdminOffersListPage() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pointing to your new promotion-service gateway route
  const API_BASE = process.env.NEXT_PUBLIC_PROMOTION_SERVICE_URL || "http://localhost/svc/promotion";

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/offers`, {
          headers: { 'x-user-role': 'SuperAdmin' } // Mock auth header for now
        });
        if (res.ok) {
          const json = await res.json();
          setOffers(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch admin offers", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will instantly remove the offer platform-wide.")) return;
    try {
      // Assuming you'll add a delete route in promotion-service later
      const res = await fetch(`${API_BASE}/api/admin/offers/${id}`, { 
        method: "DELETE",
        headers: { 'x-user-role': 'SuperAdmin' }
      });
      if (res.ok) setOffers(prev => prev.filter(o => o.OfferID !== id));
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><FiLoader className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-indigo-600 flex items-center font-bold">
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-xl font-black text-gray-900">Admin Offers</h1>
          <button 
            onClick={() => router.push(`/offers/add`)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center hover:bg-indigo-700 transition"
          >
            <FiPlus className="mr-2" /> Create Campaign
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FiGift size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No active campaigns</h2>
            <p className="text-gray-500 mt-2">Create platform-wide codes, free delivery events, or wallet bonuses.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => (
              <div key={offer.OfferID} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center group gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl ${offer.Type === 'COUPON' ? 'bg-purple-100 text-purple-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <FiGift size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-900 text-lg">{offer.Title}</h3>
                      {offer.PromoCode && (
                        <span className="bg-gray-100 text-gray-800 text-xs font-black px-2 py-1 rounded tracking-widest border border-gray-200">
                          {offer.PromoCode}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                      <span className="font-bold text-gray-700">{offer.RewardType}</span>
                      <span>•</span>
                      <span>{offer.DiscountType === 'Percentage' ? `${offer.RewardValue}%` : `₹${offer.RewardValue}`}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span className="flex items-center bg-gray-50 px-2 py-1 rounded"><FiUsers className="mr-1" /> {offer.TargetEntity}</span>
                      <span className="flex items-center bg-gray-50 px-2 py-1 rounded"><FiStar className="mr-1" /> {offer.Visibility}</span>
                      <span className="flex items-center"><FiCalendar className="mr-1" /> Ends: {new Date(offer.EndTime).toLocaleDateString()}</span>
                      <span className={offer.IsActive ? "text-green-600" : "text-red-500"}>
                        {offer.IsActive ? "● ACTIVE" : "● PAUSED"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <button onClick={() => router.push(`/offers/edit/${offer.OfferID}`)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold text-gray-600 transition">Edit</button>
                  <button onClick={() => handleDelete(offer.OfferID)} className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition"><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}