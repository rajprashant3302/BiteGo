"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import AdminOfferForm from "@/components/AdminOfferForm";

export default function EditAdminOfferPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <button 
          onClick={() => router.back()} 
          className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 font-bold transition"
        >
          <FiArrowLeft className="mr-2" /> Back to Campaigns
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">Edit Platform Offer</h1>
          <p className="text-gray-500 mt-2">Update promotion rules, dates, or reward values.</p>
        </header>

        {/* Pass the ID to the form so it knows it's in Edit Mode */}
        <AdminOfferForm offerId={id} />
      </div>
    </div>
  );
}