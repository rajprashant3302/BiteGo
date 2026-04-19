"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiArrowLeft, FiLoader, FiCheckCircle, FiStar } from "react-icons/fi";
import Button from "@/components/ui/Button";

// Internal Helper for the Rating UI
const StarRating = ({ rating, setRating, label }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-700 mb-3">{label}</label>
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hover || rating);
          return (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform transform hover:scale-110 focus:outline-none"
            >
              <FiStar
                size={36}
                className={`transition-colors duration-200 ${
                  isActive ? "fill-[#FF651D] text-[#FF651D]" : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      {!rating && <p className="text-[10px] text-orange-500 font-bold mt-2 uppercase tracking-tight">Selection Required</p>}
    </div>
  );
};

export default function OrderReviewPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;
  const { data: session, status } = useSession();

  // Review Form State
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [restaurantText, setRestaurantText] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  
  const [reqStatus, setReqStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurantRating || !deliveryRating) {
      setReqStatus({ loading: false, error: "Please provide ratings for both food and delivery.", success: null });
      return;
    }

    setReqStatus({ loading: true, error: null, success: null });

    // GraphQL Mutation matching your review.resolver.js
    const mutation = `
      mutation AddReview($orderId: ID!, $input: AddReviewInput!) {
        addReview(orderId: $orderId, input: $input) {
          id
          ratingRestaurant
          ratingDelivery
        }
      }
    `;

    const variables = {
      orderId: orderId,
      input: {
        ratingRestaurant: restaurantRating,
        ratingDelivery: deliveryRating,
        reviewTextRestaurant: restaurantText,
        reviewTextDeliveryPartner: deliveryText
      }
    };

    try {
      const gatewayUrl = process.env.NEXT_PUBLIC_GRAPHQL_GATEWAY_URL || "/svc/graphql";
      
      const response = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Token injection from NextAuth Session
          "Authorization": `Bearer ${session?.accessToken || ""}` 
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message || "Submission failed.");
      }

      setReqStatus({ loading: false, error: null, success: "Review submitted! Redirecting..." });

      setTimeout(() => {
        router.push(`/orders/${orderId}`);
        router.refresh();
      }, 2000);

    } catch (error) {
      setReqStatus({ 
        loading: false, 
        error: error.message || "An unexpected error occurred.", 
        success: null 
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FiLoader className="animate-spin text-[#FF651D]" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-6 pb-12 font-sans">
      <div className="max-w-xl mx-auto px-4">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Custom Header Bar */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-gray-50 bg-white">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-bold text-sm"
            >
              <FiArrowLeft className="mr-2" size={20} />
              Back
            </button>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">Rate Order</h1>
            <div className="w-12"></div> 
          </div>

          <div className="px-6 py-8 sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Restaurant Rating Card */}
              <div className="bg-[#FFF0E6] p-6 rounded-3xl border border-[#FFDBCB]/50">
                <StarRating 
                  rating={restaurantRating} 
                  setRating={setRestaurantRating} 
                  label="Restaurant & Food" 
                />
                <textarea 
                  value={restaurantText}
                  onChange={(e) => setRestaurantText(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-transparent rounded-2xl text-sm font-medium text-gray-900 focus:border-[#FF651D] outline-none transition-all resize-none h-24 shadow-sm"
                  placeholder="How was the taste and packaging?"
                />
              </div>

              {/* Delivery Rating Card */}
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <StarRating 
                  rating={deliveryRating} 
                  setRating={setDeliveryRating} 
                  label="Delivery Service" 
                />
                <textarea 
                  value={deliveryText}
                  onChange={(e) => setDeliveryText(e.target.value)}
                  className="w-full p-4 bg-white border-2 border-transparent rounded-2xl text-sm font-medium text-gray-900 focus:border-[#FF651D] outline-none transition-all resize-none h-24 shadow-sm"
                  placeholder="Was the delivery partner professional?"
                />
              </div>

              {/* Feedback Notifications */}
              {reqStatus.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-100 flex items-center animate-pulse">
                  {reqStatus.error}
                </div>
              )}
              {reqStatus.success && (
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl text-xs font-bold border border-green-100 flex items-center justify-center animate-bounce">
                  <FiCheckCircle className="mr-2" size={18} />
                  {reqStatus.success}
                </div>
              )}

              {/* Submit Button using shared UI Component */}
              <Button
                type="submit"
                size="lg"
                disabled={reqStatus.loading || reqStatus.success !== null}
                className="w-full shadow-lg"
              >
                {reqStatus.loading ? (
                  <div className="flex items-center">
                    <FiLoader className="animate-spin mr-3" size={20} />
                    Processing...
                  </div>
                ) : (
                  "Submit Feedback"
                )}
              </Button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}