"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiFileText, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";

export default function DocumentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Only keeping dlNumber to map to DB's LicenseNumber
  const [docs, setDocs] = useState({
    dlNumber: "",
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || "http://localhost:5002";

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetch(`${BACKEND_URL}/api/driver/documents`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data?.documents) setDocs(data.documents);
      })
      .catch(err => console.error(err));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/driver/documents`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(docs),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Driving License updated successfully!");
        router.push("/settings");
      } else {
        alert(data.error || "Failed to update documents.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 sm:p-10 h-fit">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-8 relative">
          <Link href="/settings" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors z-10">
            <FiArrowLeft size={18} />
            <span>Back</span>
          </Link>
          <h1 className="text-xl font-bold text-gray-900 absolute left-0 right-0 text-center pointer-events-none">
            Documents
          </h1>
          <div className="w-16"></div>
        </div>

        {/* Info Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Legal & Verification Info</h2>
          <p className="text-gray-500 text-sm">
            We need your Driving License details to process your verification securely. This information is encrypted.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* DL Number ONLY */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Driving License Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                <FiFileText size={18} />
              </div>
              <input 
                type="text" 
                placeholder="E.G. DL-1420110012345"
                value={docs.dlNumber}
                onChange={(e) => setDocs({ dlNumber: e.target.value.toUpperCase() })}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:border-[#E46128] focus:ring-1 focus:ring-[#E46128] transition-all uppercase"
                required
              />
            </div>
          </div>

          {/* Secure Information Box */}
          <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-xl flex gap-3 items-start">
            <FiCheckCircle className="text-green-600 mt-0.5 shrink-0" size={18} />
            <p className="text-sm text-green-800 leading-relaxed">
              Your details are encrypted and securely stored. We only use this information to verify your identity.
            </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-6 py-4 bg-[#E46128] text-white font-bold text-lg rounded-xl hover:bg-[#d05623] transition-colors disabled:opacity-70"
          >
            {loading ? "Saving..." : "Save Documents"}
          </button>
        </form>

      </div>
    </div>
  );
}