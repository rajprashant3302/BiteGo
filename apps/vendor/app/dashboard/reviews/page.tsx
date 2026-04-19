"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  FiStar,
  FiMessageSquare,
  FiTrendingUp,
  FiSearch,
  FiFilter,
  FiRefreshCw,
} from "react-icons/fi";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";

// Types matching your GraphQL schema
type Review = {
  id: string;
  ratingRestaurant: number;
  reviewTextRestaurant: string;
  createdAt: string;
  user?: { name: string };
};

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MOCK FETCH FUNCTION: We use this just so you can see the UI working!
  const fetchReviews = () => {
    setLoading(true);
    setError(null);
    
    // Simulating an API call delay
    setTimeout(() => {
      setReviews([
        { 
          id: "1", 
          ratingRestaurant: 5, 
          reviewTextRestaurant: "Absolutely amazing food! The packaging was great and it arrived piping hot. Will definitely order again.", 
          createdAt: new Date().toISOString(), 
          user: { name: "Rahul S." } 
        },
        { 
          id: "2", 
          ratingRestaurant: 4, 
          reviewTextRestaurant: "Taste is good, but portion size could be a little bigger for the price.", 
          createdAt: new Date(Date.now() - 86400000).toISOString(), 
          user: { name: "Sneha M." } 
        },
        { 
          id: "3", 
          ratingRestaurant: 5, 
          reviewTextRestaurant: "Best biryani in the city. Delivery was fast too!", 
          createdAt: new Date(Date.now() - 172800000).toISOString(), 
          user: { name: "Amit P." } 
        },
        { 
          id: "4", 
          ratingRestaurant: 3, 
          reviewTextRestaurant: "It was okay. A bit too spicy for my liking.", 
          createdAt: new Date(Date.now() - 259200000).toISOString(), 
          user: { name: "Priya K." } 
        }
      ]);
      setLoading(false);
    }, 800);
  };

  // Load the data when the page opens
  useEffect(() => {
    fetchReviews();
  }, []);

  // Search filter logic
  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(
      (r) => r.reviewTextRestaurant?.toLowerCase().includes(q) || r.user?.name?.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  // Math for the stat cards
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + r.ratingRestaurant, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const fiveStarCount = reviews.filter((r) => r.ratingRestaurant === 5).length;

  if (loading) {
    return <DashboardPageSkeleton title="Loading customer feedback..." />;
  }

  if (error) {
    return <DashboardErrorState message={error} onRetry={fetchReviews} />;
  }

  if (reviews.length === 0) {
    return (
      <DashboardEmptyState
        title="No reviews yet"
        description="Once customers start receiving and rating your orders, their feedback will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Customer Feedback</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Read what your customers are saying and track your restaurant's reputation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search reviews..."
                className="h-11 w-64 rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={fetchReviews}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">Average Rating</p>
            <h3 className="mt-2 text-3xl font-black text-gray-900 flex items-center gap-2">
              {averageRating} <FiStar className="text-[#FF651D] fill-[#FF651D] text-xl" />
            </h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center text-[#FF651D]">
            <FiTrendingUp size={24} />
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">Total Ratings</p>
            <h3 className="mt-2 text-3xl font-black text-gray-900">{reviews.length}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <FiMessageSquare size={24} />
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500">5-Star Reviews</p>
            <h3 className="mt-2 text-3xl font-black text-gray-900">{fiveStarCount}</h3>
          </div>
          <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
            <FiStar size={24} className="fill-green-500" />
          </div>
        </div>
      </section>

      {/* Reviews Feed */}
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-gray-900">Recent Reviews</h2>
          <button className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
            <FiFilter /> Filter
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="rounded-[24px] border border-gray-100 p-6 transition-all hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FiStar
                      key={star}
                      size={16}
                      className={
                        star <= review.ratingRestaurant
                          ? "fill-[#FF651D] text-[#FF651D]"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              <h4 className="font-bold text-gray-900 text-sm mb-2">{review.user?.name || "Verified Customer"}</h4>
              
              {review.reviewTextRestaurant ? (
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  "{review.reviewTextRestaurant}"
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">No written feedback provided.</p>
              )}
            </div>
          ))}

          {filteredReviews.length === 0 && (
            <div className="col-span-full py-10 text-center">
              <p className="text-gray-500 font-medium">No reviews match your search.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}