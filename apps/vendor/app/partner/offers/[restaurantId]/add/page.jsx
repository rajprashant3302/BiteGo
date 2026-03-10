// src/app/partner/offers/[restaurantId]/add/page.jsx
"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import OfferForm from "@/components/OfferForm";

export default function AddOfferPage() {
  const { restaurantId } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <button 
          onClick={() => router.back()} 
          className="mb-6 flex items-center text-gray-500 hover:text-orange-600 font-bold transition"
        >
          <FiArrowLeft className="mr-2" /> Back to Offers
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Create Promotion</h1>
          <p className="text-gray-500">Boost your sales by offering discounts to your customers.</p>
        </header>

        <OfferForm restaurantId={restaurantId} mode="add" />
      </div>
    </div>
  );
}