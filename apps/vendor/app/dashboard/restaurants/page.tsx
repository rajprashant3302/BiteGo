"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FiCheckCircle,
  FiClock,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrendingUp,
} from "react-icons/fi";
import { formatCurrency, getVendorRestaurants } from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";

function getStatusStyle(status: string) {
  if (status === "Open") return "bg-green-100 text-green-700";
  if (status === "Busy") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function RestaurantsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const loader = useCallback(() => getVendorRestaurants(userId!, token), [userId, token]);
  const { data, loading, error } = useVendorQuery(Boolean(userId), loader);

  const restaurants = useMemo(() => {
    const rows = data?.restaurants || [];
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((restaurant) =>
      `${restaurant.name} ${restaurant.categoryName || ""}`.toLowerCase().includes(q)
    );
  }, [data?.restaurants, search]);

  if (loading)
    return (
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm text-sm text-gray-500">
        Loading restaurants…
      </div>
    );
  if (error || !data)
    return (
      <div className="rounded-[28px] border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        {error || "Unable to load restaurants."}
      </div>
    );

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              Restaurants
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Monitor all branches, compare business health, and keep restaurant
              operations consistent.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search restaurants..."
                className="h-11 rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#FF651D] px-4 text-sm font-bold text-white opacity-70 cursor-not-allowed"
            >
              <FiPlus />
              Add Restaurant
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Branches</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {data.summary.totalRestaurants}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Open Now</p>
          <h3 className="mt-2 text-2xl font-black text-green-600">
            {data.summary.openRestaurants}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Busy Branches</p>
          <h3 className="mt-2 text-2xl font-black text-amber-600">
            {data.summary.busyRestaurants}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Avg Rating</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {data.summary.avgRating}
          </h3>
        </div>
      </section>

      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900">Branch Overview</h2>
          <p className="mt-1 text-sm text-gray-500">
            A quick operational and commercial snapshot of each branch.
          </p>
        </div>

        <div className="space-y-4">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="rounded-[24px] border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-black text-gray-900">
                      {restaurant.name}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(
                        restaurant.status
                      )}`}
                    >
                      {restaurant.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin size={14} />
                      {restaurant.categoryName || "Restaurant"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiStar size={14} className="text-amber-500" />
                      {restaurant.rating}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-500">Revenue</p>
                      <p className="mt-1 text-base font-black text-gray-900">
                        {formatCurrency(restaurant.totalRevenue)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-500">Orders</p>
                      <p className="mt-1 text-base font-black text-gray-900">
                        {restaurant.totalOrders}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-3">
                      <p className="text-xs font-semibold text-gray-500">Health</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-base font-black text-green-600">
                        <FiCheckCircle size={16} />
                        {restaurant.health}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[150px]">
                  <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-4 text-center ring-1 ring-orange-100">
                    <p className="text-xs font-semibold text-gray-500">Momentum</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-2xl font-black text-[#FF651D]">
                      <FiTrendingUp />
                      {restaurant.momentum}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {restaurants.length === 0 && (
            <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
              No restaurants match your search.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Operational Notes</h2>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <p className="font-bold text-gray-900">Top performer</p>
              <p className="mt-1 text-sm text-gray-600">
                {restaurants[0]
                  ? `${restaurants[0].name} is currently leading by revenue.`
                  : "No restaurant data available."}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-bold text-gray-900">Needs review</p>
              <p className="mt-1 text-sm text-gray-600">
                {data.summary.closedRestaurants > 0
                  ? `${data.summary.closedRestaurants} branch(es) are currently closed and may need operational follow-up.`
                  : "No closed branches right now."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Branch Activity</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
              <FiClock className="mt-1 text-[#FF651D]" />
              <div>
                <p className="font-bold text-gray-900">Recent activity</p>
                <p className="mt-1 text-sm text-gray-600">
                  {restaurants.find((item) => item.latestOrderAt)?.name
                    ? `${restaurants.find((item) => item.latestOrderAt)?.name} has the most recent order activity.`
                    : "No recent order timestamps available."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
              <FiTrendingUp className="mt-1 text-[#FF651D]" />
              <div>
                <p className="font-bold text-gray-900">Steady multi-branch growth</p>
                <p className="mt-1 text-sm text-gray-600">
                  Open branches are sustaining healthy order performance this cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}