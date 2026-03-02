"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FiArrowLeft, FiPlus, FiBriefcase, FiStar, 
  FiClock, FiLoader, FiMenu, FiEdit2 
} from "react-icons/fi";

export default function PartnerRestaurantsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/partner/restaurants/${session.user.id}` 
            : `http://localhost:5000/api/partner/restaurants/${session.user.id}`;
            
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            setRestaurants(data);
          }
        } catch (error) {
          console.error("Failed to fetch restaurants", error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchRestaurants();
  }, [status, session]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-0">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-6 py-5 flex items-center justify-between">
            <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm">
              <FiArrowLeft className="mr-2" size={18} /> Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Restaurants</h1>
            <div className="w-16"></div>
          </div>
        </div>

        {restaurants.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
            <img src="/restaurant-animate.svg" alt="No Restaurants" className="w-64 h-64 mb-6 opacity-90" />
            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Grow your business!</h2>
            <p className="text-gray-500 mb-8 max-w-sm">You haven't added any restaurants yet. Set up your first storefront to start receiving orders.</p>
            <Link href="/partner/restaurants/add" className="bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center">
              <FiPlus className="mr-2" size={20} /> Add New Restaurant
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            
            <div className="flex justify-end">
              <Link href="/partner/restaurants/add" className="text-[#FF651D] font-bold text-sm hover:text-[#D84A00] transition-colors flex items-center bg-[#FFF0E6] px-4 py-2 rounded-lg">
                <FiPlus className="mr-1.5" size={16} /> Add Another
              </Link>
            </div>

            {restaurants.map((rest) => (
              <div key={rest.RestaurantID} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group">
                
                <div className={`absolute top-0 right-0 text-xs font-bold px-3 py-1.5 rounded-bl-xl flex items-center ${rest.IsOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <FiClock className="mr-1" size={12} /> {rest.IsOpen ? "Accepting Orders" : "Currently Closed"}
                </div>

                <div className="flex items-start mt-2">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF651D] shrink-0 border border-orange-100">
                    <FiBriefcase size={22} />
                  </div>
                  
                  <div className="ml-4 flex-grow pr-20">
                    <h3 className="text-xl font-bold text-gray-900">{rest.Name}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">{rest.CategoryName || "General"}</p>
                    
                    <div className="flex items-center space-x-3 mt-2 text-sm font-semibold">
                      <span className="flex items-center text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-md">
                        <FiStar className="mr-1" size={14} fill="currentColor" /> {rest.Rating ? Number(rest.Rating).toFixed(1) : "New"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md ${rest.IsActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {rest.IsActive ? "Listed on App" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-gray-50">
                  <Link href={`/partner/restaurants/edit/${rest.RestaurantID}`} className="flex items-center justify-center py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors text-sm">
                    <FiEdit2 className="mr-2" size={16} /> Edit Details
                  </Link>
                  <Link href={`/partner/menu/${rest.RestaurantID}`} className="flex items-center justify-center py-2.5 bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold rounded-xl transition-colors text-sm shadow-sm">
                    <FiMenu className="mr-2" size={16} /> Manage Menu
                  </Link>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}