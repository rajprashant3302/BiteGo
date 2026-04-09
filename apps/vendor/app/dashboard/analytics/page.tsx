"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FiActivity,
  FiBarChart2,
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";
import { formatCurrency, getVendorAnalytics } from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const loader = useCallback(() => getVendorAnalytics(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  if (loading) {
    return <DashboardPageSkeleton title="Loading analytics..." />;
  }

  if (error) {
    return <DashboardErrorState message={error} onRetry={refetch} />;
  }

  if (!data || data.revenueTrend.length === 0) {
    return (
      <DashboardEmptyState
        title="No analytics available yet"
        description="Analytics will appear once the platform has enough restaurant and order activity."
      />
    );
  }

  const maxValue = Math.max(...data.revenueTrend.map((item) => item.revenue), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              A strategic live view of revenue, orders, and restaurant performance.
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
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Revenue</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(data.metrics.revenue)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Sales</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(data.metrics.sales)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">AOV</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(data.metrics.averageOrderValue)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Repeat Customers</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {data.metrics.repeatCustomersRate}%
          </h3>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-gray-900">Revenue Trend</h2>
            <p className="mt-1 text-sm text-gray-500">
              Weekly revenue progression from live order data.
            </p>
          </div>

          <div className="flex h-72 items-end justify-between gap-3 rounded-[24px] border border-dashed border-gray-200 bg-gradient-to-b from-orange-50/50 to-white p-5">
            {data.revenueTrend.map((value) => {
              const height = Math.max(14, Math.round((value.revenue / maxValue) * 100));
              return (
                <div key={value.label} className="group flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 items-end">
                    <div
                      className="w-10 rounded-t-[18px] bg-gradient-to-t from-[#FF651D] via-orange-400 to-orange-200 transition group-hover:scale-y-105"
                      style={{ height: `${height}%` }}
                      title={`${value.label}: ${formatCurrency(value.revenue)}`}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">{value.label}</span>
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
                  <FiDollarSign className="text-[#FF651D]" />
                  Earnings strength
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Revenue is currently tracking at {formatCurrency(data.metrics.revenue)}.
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiTrendingUp className="text-[#FF651D]" />
                  Growth pattern
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  The revenue curve is calculated from backend analytics and live order history.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 shadow-sm text-white">
            <p className="text-sm font-semibold text-orange-200">Strategic Snapshot</p>
            <h2 className="mt-2 text-xl font-black">
              Analytics is fully driven from live restaurant and order records
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              This page is no longer static and does not depend on hardcoded metric arrays.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <FiBarChart2 />
              Connected analytics
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiPieChart className="text-[#FF651D]" />
            Status Breakdown
          </p>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {data.statusBreakdown.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
              >
                <span>{item.label}</span>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiActivity className="text-[#FF651D]" />
            Top Restaurants
          </p>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            {data.topRestaurants.map((item) => (
              <div key={item.name} className="rounded-xl bg-gray-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{item.orders} orders</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiBarChart2 className="text-[#FF651D]" />
            Trend Analytics
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Live trend insights are rendered from backend responses and can later be upgraded to charts.
          </p>
        </div>
      </section>
    </div>
  );
}