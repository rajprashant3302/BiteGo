"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import { formatCurrency, getVendorOverview } from "../../app/lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../app/lib/dashboard/use-vendor-query";
import DashboardPageSkeleton from "./DashboardPageSkeleton";
import DashboardEmptyState from "./DashboardEmptyState";
import DashboardErrorState from "./DashboardErrorState";

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <h3 className={`mt-2 text-2xl font-black ${accent || "text-gray-900"}`}>
        {value}
      </h3>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const loader = useCallback(() => getVendorOverview(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  if (loading) {
    return <DashboardPageSkeleton title="Loading dashboard overview..." />;
  }

  if (error) {
    return <DashboardErrorState message={error} onRetry={refetch} />;
  }

  if (!data) {
    return (
      <DashboardEmptyState
        title="No dashboard data yet"
        description="Your vendor dashboard will appear here once your restaurants and orders are available."
      />
    );
  }

  const { summary, restaurants, recentOrders, payouts, revenueTrend } = data;

  if (
    summary.totalRestaurants === 0 &&
    summary.totalOrders === 0 &&
    payouts.length === 0
  ) {
    return (
      <DashboardEmptyState
        title="No business activity yet"
        description="Add restaurants and start receiving orders to unlock your dashboard insights."
      />
    );
  }

  const maxRevenue = Math.max(...revenueTrend.map((item) => item.revenue), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Overview</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Live vendor metrics across restaurants, orders, analytics, and payouts.
            </p>
          </div>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <FiBarChart2 size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(summary.totalRevenue)} />
        <StatCard label="Orders" value={String(summary.totalOrders)} />
        <StatCard label="Open Restaurants" value={String(summary.openRestaurants)} accent="text-[#FF651D]" />
        <StatCard label="Payout Health" value={`${summary.payoutHealth}%`} accent="text-green-600" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-gray-900">Revenue Trend</h2>
            <p className="mt-1 text-sm text-gray-500">
              Recent revenue progression based on live order and payment data.
            </p>
          </div>

          <div className="flex h-72 items-end justify-between gap-3 rounded-[24px] border border-dashed border-gray-200 bg-gradient-to-b from-orange-50/50 to-white p-5">
            {revenueTrend.map((point) => {
              const height = Math.max(14, Math.round((point.revenue / maxRevenue) * 100));

              return (
                <div key={point.label} className="group flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 items-end">
                    <div
                      className="w-10 rounded-t-[18px] bg-gradient-to-t from-[#FF651D] via-orange-400 to-orange-200 transition group-hover:scale-y-105"
                      style={{ height: `${height}%` }}
                      title={`${point.label}: ${formatCurrency(point.revenue)}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">{point.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Key Signals</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiTrendingUp className="text-[#FF651D]" />
                  Restaurant growth
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {summary.openRestaurants} of {summary.totalRestaurants} restaurants are currently open.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiShoppingBag className="text-[#FF651D]" />
                  Order execution
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {summary.deliveredOrders} delivered, {summary.inProgressOrders} in progress, and {summary.cancelledOrders} cancelled.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiCreditCard className="text-[#FF651D]" />
                  Payout summary
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Settled: {formatCurrency(summary.totalSettled)} · Pending: {formatCurrency(summary.pendingPayouts)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-orange-200">Connected summary</p>
            <h2 className="mt-2 text-xl font-black">
              Average order value is {formatCurrency(summary.avgOrderValue)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Repeat customer rate is currently {summary.repeatCustomersRate}%, and the average rating across your portfolio is {summary.avgRating}.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <FiBarChart2 />
              Live business telemetry
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Restaurants</h2>
          <div className="mt-4 space-y-3">
            {restaurants.slice(0, 4).map((restaurant) => (
              <div
                key={restaurant.id}
                className="rounded-2xl bg-gray-50 p-4 transition hover:bg-orange-50/40"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{restaurant.name}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {restaurant.status} · {restaurant.totalOrders} orders
                    </p>
                  </div>
                  <span className="text-sm font-black text-[#FF651D]">
                    {formatCurrency(restaurant.totalRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Recent Orders</h2>
          <div className="mt-4 space-y-3">
            {recentOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="rounded-2xl bg-gray-50 p-4 transition hover:bg-orange-50/40"
              >
                <p className="font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-gray-600">
                  {order.customer} · {order.branch}
                </p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(order.amount)}
                  </span>
                  <span className="text-gray-500">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Alerts & Actions</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
              <FiCheckCircle className="mt-1 text-green-600" />
              <div>
                <p className="font-bold text-gray-900">Settlements processed</p>
                <p className="mt-1 text-sm text-gray-600">
                  {payouts.filter((item) => item.status === "Settled").length} payout entries are already settled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
              <FiClock className="mt-1 text-amber-600" />
              <div>
                <p className="font-bold text-gray-900">Operational watch</p>
                <p className="mt-1 text-sm text-gray-600">
                  {summary.inProgressOrders} orders are currently active and need timely action.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
              <FiCreditCard className="mt-1 text-red-600" />
              <div>
                <p className="font-bold text-gray-900">Exceptions</p>
                <p className="mt-1 text-sm text-gray-600">
                  {summary.cancelledOrders} cancellations and {payouts.filter((item) => item.status === "Under Review").length} payouts under review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}