"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiFileText, FiHash, FiCheckCircle, FiEdit3, FiLock } from "react-icons/fi";
import Link from "next/link";
import toast from 'react-hot-toast';

export default function DriverDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  const [details, setDetails] = useState({
    dlNumber: "",
    registrationNumber: "",
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || "http://localhost:5004";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.accessToken) {
      fetchDetails();
    }
  }, [status, session]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      console.log("UserId ",session?.user?.accessToken);
      const res = await fetch(`${BACKEND_URL}/driver/details`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` }
      });
      const data = await res.json();
      
      if (data?.details?.dlNumber || data?.details?.registrationNumber) {
        setDetails(data.details);
        setHasExistingData(true);
        setIsEditing(false); 
      } else {
        setIsEditing(true); 
      }
    } catch (err) {
      console.error("Failed to fetch driver details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
        console.log("UserId ",session?.user?.accessToken);
      const res = await fetch(`${BACKEND_URL}/driver/details`, {
        method: "PUT", // Your controller handles upsert in PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.accessToken}`
        },
        body: JSON.stringify(details),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setHasExistingData(true);
        setIsEditing(false);
        toast.success("Details saved successfully!");
      } else {
        toast.error(data.error || "Failed to update details.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) return <SkeletonLoader />;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 font-sans flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden h-fit">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Vehicle & Documents</h1>
          {hasExistingData && !isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-sm font-semibold text-[#E46128] hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-all"
            >
              <FiEdit3 size={14} /> Edit
            </button>
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {/* Info Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
               <h2 className="text-xl font-bold text-gray-900">Legal Information</h2>
               {!isEditing && <FiLock className="text-gray-400" size={14} />}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Verify your identity to start receiving delivery requests. These details must match your physical documents.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* DL Number Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Driving License (DL)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#E46128] transition-colors">
                  <FiFileText size={18} />
                </div>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  placeholder="DL-1420110012345"
                  value={details.dlNumber}
                  onChange={(e) => setDetails(prev => ({ ...prev, dlNumber: e.target.value.toUpperCase() }))}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border transition-all uppercase font-medium
                    ${!isEditing 
                      ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white border-gray-200 text-gray-900 focus:border-[#E46128] focus:ring-4 focus:ring-orange-50"
                    }`}
                  required
                />
              </div>
            </div>

            {/* Registration Number Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Vehicle Registration Number (RC)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#E46128] transition-colors">
                  <FiHash size={18} />
                </div>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  placeholder="MH-12-AB-1234"
                  value={details.registrationNumber}
                  onChange={(e) => setDetails(prev => ({ ...prev, registrationNumber: e.target.value.toUpperCase() }))}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl border transition-all uppercase font-medium
                    ${!isEditing 
                      ? "bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed" 
                      : "bg-white border-gray-200 text-gray-900 focus:border-[#E46128] focus:ring-4 focus:ring-orange-50"
                    }`}
                  required
                />
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3 items-start mt-6">
              <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={18} />
              <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                Your data is encrypted. We only share this with authorities during mandatory checkpoints or verification.
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {hasExistingData && (
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3.5 text-gray-600 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-[2] py-3.5 bg-[#E46128] text-white font-bold rounded-xl shadow-lg shadow-orange-200 hover:bg-[#d05623] active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {saving ? "Processing..." : "Save & Verify Details"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// Simple Skeleton UI for loading state
function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex justify-center">
      <div className="w-full max-w-xl bg-white rounded-[24px] p-8 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-8"></div>
        <div className="h-4 w-full bg-gray-100 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-gray-100 rounded mb-10"></div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
              <div className="h-12 w-full bg-gray-50 rounded-xl border border-gray-100"></div>
            </div>
          ))}
        </div>
        <div className="h-12 w-full bg-gray-200 rounded-xl mt-10"></div>
      </div>
    </div>
  );
}