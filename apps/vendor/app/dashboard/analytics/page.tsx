"use client";

import {
  FiActivity,
  FiBarChart2,
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";

const trend = [42, 58, 64, 71, 63, 84, 92];
const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const maxValue = Math.max(...trend);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          A strategic view of business performance, revenue movement, customer
          retention, and execution efficiency.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Revenue</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">₹4,82,600</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Sales</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">₹5,63,900</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">AOV</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">₹348</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Repeat Customers</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">65%</h3>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-black text-gray-900">Revenue Trend</h2>
            <p className="mt-1 text-sm text-gray-500">
              Weekly revenue progression across the selected business window.
            </p>
          </div>

          <div className="flex h-72 items-end justify-between gap-3 rounded-[24px] border border-dashed border-gray-200 bg-gradient-to-b from-orange-50/50 to-white p-5">
            {trend.map((value, index) => {
              const height = Math.max(14, Math.round((value / maxValue) * 100));
              return (
                <div key={labels[index]} className="flex flex-1 flex-col items-center gap-3">
                  <div className="flex h-56 items-end">
                    <div
                      className="w-10 rounded-t-[18px] bg-gradient-to-t from-[#FF651D] via-orange-400 to-orange-200"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">{labels[index]}</span>
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
                  Revenue generation remains healthy across the top branches.
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiTrendingUp className="text-[#FF651D]" />
                  Growth momentum
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Sales trend suggests upward business momentum in recent windows.
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiActivity className="text-[#FF651D]" />
                  Retention quality
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Returning customers indicate sustained product-market fit.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 shadow-sm text-white">
            <p className="text-sm font-semibold text-orange-200">Executive Insight</p>
            <h2 className="mt-2 text-xl font-black">
              Saturday is the strongest revenue day
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              That makes weekend bundling, promotions, and inventory planning the
              highest-leverage business decision.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiBarChart2 className="text-[#FF651D]" />
            Trend Analytics
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Use this section later for daily, weekly, and monthly API-backed
            comparisons.
          </p>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiPieChart className="text-[#FF651D]" />
            Segment Breakdown
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Add customer segments, branch mix, and menu contribution analysis.
          </p>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="inline-flex items-center gap-2 font-bold text-gray-900">
            <FiActivity className="text-[#FF651D]" />
            Operational KPIs
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Connect fulfilment rate, conversion rate, cancellations, and delay
            metrics here.
          </p>
        </div>
      </section>
    </div>
  );
}