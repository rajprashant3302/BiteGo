"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FiMessageSquare, FiRefreshCw, FiSearch, FiStar, FiTrendingUp } from "react-icons/fi";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";
import { formatDate, getVendorReviews } from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");

  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const loader = useCallback(() => getVendorReviews(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  const reviews = data?.reviews || [];

  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter((r) =>
      `${r.userName} ${r.restaurantName} ${r.comment} ${r.rating}`.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  if (loading) return <DashboardPageSkeleton title="Loading customer feedback..." />;
  if (error) return <DashboardErrorState message={error} onRetry={refetch} />;
  if (!data || reviews.length === 0) {
    return (
      <DashboardEmptyState
        title="No reviews yet"
        description="Customer ratings and comments will appear here once orders are reviewed."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Customer Feedback</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Monitor live customer sentiment across your restaurant branches.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search by customer, branch, or review"
                className="h-11 w-72 rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={refetch}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Average Rating</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">{data.summary.averageRating}</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Reviews</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">{data.summary.totalReviews}</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">5★ Reviews</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">{data.summary.fiveStarReviews}</h3>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <article key={review.id} className="rounded-[24px] border border-gray-100 p-5 hover:border-orange-200 transition">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-gray-900">{review.userName}</h3>
                      <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF651D]">
                        {review.restaurantName}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <FiStar key={index} className={index < review.rating ? "fill-current" : "text-gray-300"} />
                      ))}
                      <span className="ml-2 text-sm font-bold text-gray-700">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-500">{formatDate(review.createdAt)}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-700">
                  {review.comment || "No review text was left for this order."}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Review Signals</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-4">
                <FiStar className="mt-1 text-[#FF651D]" />
                <div>
                  <p className="font-bold text-gray-900">Average sentiment</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Current average rating is {data.summary.averageRating} across all captured reviews.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
                <FiTrendingUp className="mt-1 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Top-rated experiences</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {data.summary.fiveStarReviews} customers gave a full 5-star rating.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <FiMessageSquare className="mt-1 text-blue-600" />
                <div>
                  <p className="font-bold text-gray-900">Feedback volume</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {data.summary.totalReviews} review entries are available for vendor follow-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
