// src/app/partner/offers/[restaurantId]/page.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiPlus, FiTrash2, FiLoader, FiPercent, FiTag, FiCalendar } from "react-icons/fi";

export default function OffersListPage() {
  const router = useRouter();
  const { restaurantId } = useParams();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchOffers = async () => {
      if (!restaurantId) return;
      try {
        const res = await fetch(`${API_BASE}/api/offers/restaurant/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          setOffers(data);
        }
      } catch (err) {
        console.error("Failed to fetch offers", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, [restaurantId]);

  const handleDelete = async (id) => {
    if (!confirm("Remove this offer? It will stop applying to customer carts immediately.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/offers/${id}`, { method: "DELETE" });
      if (res.ok) setOffers(prev => prev.filter(o => o.OfferID !== id));
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="flex justify-center pt-20"><FiLoader className="animate-spin text-orange-600" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-orange-600 flex items-center font-bold">
            <FiArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-xl font-black text-gray-900">Promotions & Offers</h1>
          <button 
            onClick={() => router.push(`/partner/offers/${restaurantId}/add`)}
            className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center"
          >
            <FiPlus className="mr-1" /> Create
          </button>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FiPercent size={48} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">No active offers</h2>
            <p className="text-gray-500 mt-2">Create a 50% off or Flat discount to attract customers.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => (
              <div key={offer.OfferID} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-4 rounded-xl text-orange-600">
                    <FiTag size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-lg">{offer.Title}</h3>
                    <p className="text-sm text-gray-500">{offer.DiscountValue}{offer.DiscountType === 'Percentage' ? '%' : '₹'} OFF</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      <span className="flex items-center"><FiCalendar className="mr-1" /> {new Date(offer.EndTime).toLocaleDateString()}</span>
                      <span className={offer.IsActive ? "text-green-600" : "text-red-500"}>
                        {offer.IsActive ? "● Active" : "● Paused"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => router.push(`/partner/offers/${restaurantId}/edit/${offer.OfferID}`)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">Edit</button>
                  <button onClick={() => handleDelete(offer.OfferID)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}