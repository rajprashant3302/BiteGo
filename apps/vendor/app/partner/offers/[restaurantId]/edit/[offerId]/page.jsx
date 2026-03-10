// src/app/partner/offers/[restaurantId]/edit/[offerId]/page.jsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import OfferForm from "@/components/OfferForm";

export default function EditOfferPage() {
  const { restaurantId, offerId } = useParams();
  const router = useRouter();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchOfferDetails = async () => {
      try {
        // Fetch all offers for this restaurant and find the specific one
        const res = await fetch(`${API_BASE}/api/offers/restaurant/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          const offer = data.find(o => o.OfferID === offerId);
          setInitialData(offer);
        }
      } catch (err) {
        console.error("Failed to load offer data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferDetails();
  }, [restaurantId, offerId, API_BASE]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FiLoader className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 font-bold">Offer not found.</p>
        <button onClick={() => router.back()} className="text-orange-600 mt-4 underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button 
          onClick={() => router.back()} 
          className="mb-6 flex items-center text-gray-500 hover:text-orange-600 font-bold transition"
        >
          <FiArrowLeft className="mr-2" /> Cancel Edit
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Edit Promotion</h1>
          <p className="text-gray-500">Update your offer details or active items.</p>
        </header>

        <OfferForm 
          restaurantId={restaurantId} 
          offerId={offerId} 
          mode="edit" 
          initialData={initialData} 
        />
      </div>
    </div>
  );
}