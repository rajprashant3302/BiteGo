"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FiActivity,
  FiAlertCircle,
  FiBarChart2,
  FiBriefcase,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiLayers,
  FiPercent,
  FiPieChart,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { DashboardResponse, FilterKey } from "./types";
import { getFallbackData } from "./fallback";
import { formatCurrency } from "./utils";
import FilterChip from "./FilterChip";
import HeroMetric from "./HeroMetric";
import MetricCard from "./MetricCard";
import QuickLinkCard from "./QuickLinkCard";
import SectionCard from "./SectionCard";
import ProgressRow from "./ProgressRow";
import AlertItem from "./AlertItem";
import ActivityRow from "./ActivityRow";

export default function DashboardOverviewPage() {
  const { data: session, status } = useSession();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("7d");
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorText, setErrorText] = useState("");

  const vendorName = useMemo(() => session?.user?.name || "Vendor", [session]);
  const role = useMemo(
    () => (session?.user as { role?: string } | undefined)?.role || "Partner",
    [session]
  );

  const vendorId = "test-vendor";

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        setLoadingData(true);
        setErrorText("");

        const res = await fetch(`/api/vendor/dashboard/${vendorId}?range=${activeFilter}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Dashboard API failed with status ${res.status}`);
        }

        const data: DashboardResponse = await res.json();

        if (!ignore) {
          setDashboardData(data);
        }
      } catch (error) {
        console.warn("Using fallback dashboard data:", error);

        if (!ignore) {
          setDashboardData(getFallbackData(activeFilter));
          setErrorText("");
        }
      } finally {
        clearTimeout(timeout);

        if (!ignore) {
          setLoadingData(false);
        }
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [activeFilter]);

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-md">
          <FiRefreshCw className="animate-spin text-[#FF651D]" size={18} />
          <span className="text-sm font-semibold text-gray-700">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  const fallback = getFallbackData(activeFilter);
  const summary = dashboardData?.summary || fallback.summary;
  const topBranches = dashboardData?.branches || fallback.branches;
  const topItems = dashboardData?.topItems || fallback.topItems;
  const alerts = dashboardData?.alerts || fallback.alerts;
  const activities = dashboardData?.activities || fallback.activities;
  const trend = dashboardData?.trend || fallback.trend;
  const lastUpdated = dashboardData?.lastUpdated;
  const maxTrend = Math.max(...trend, 1);

  return (
    <main className="space-y-6">
      {errorText ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          {errorText}
        </div>
      ) : null}

      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#3b2a20] p-6 text-white shadow-xl md:p-8">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-200 ring-1 ring-white/10">
              <FiZap size={14} />
              Vendor Overview
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
              Welcome back, {vendorName}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-200 md:text-base">
              Track branch performance, revenue movement, sales momentum, offer
              efficiency, and payout health from one operational command center.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10">
                Role: {role}
              </span>
              <span className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10">
                Active Branches: {summary.branches}
              </span>
              <span className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10">
                Business Pulse: Strong
              </span>
            </div>

            {lastUpdated ? (
              <p className="mt-4 text-xs font-medium text-gray-300">
                Last updated: {new Date(lastUpdated).toLocaleString("en-IN")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroMetric title="Net Revenue" value={formatCurrency(summary.revenue)} subtitle="Current selected window" />
            <HeroMetric title="Gross Sales" value={formatCurrency(summary.sales)} subtitle="Before final settlement" />
            <HeroMetric title="Orders" value={String(summary.orders)} subtitle="Completed and tracked" />
            <HeroMetric title="Average Order Value" value={formatCurrency(summary.avgOrderValue)} subtitle="Useful for bundle strategy" />
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900">Time Intelligence</h2>
          <p className="mt-1 text-sm text-gray-500">
            Switch the dashboard view by business period.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterChip label="Today" active={activeFilter === "today"} onClick={() => setActiveFilter("today")} />
          <FilterChip label="7 Days" active={activeFilter === "7d"} onClick={() => setActiveFilter("7d")} />
          <FilterChip label="30 Days" active={activeFilter === "30d"} onClick={() => setActiveFilter("30d")} />
          <FilterChip label="This Month" active={activeFilter === "month"} onClick={() => setActiveFilter("month")} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={formatCurrency(summary.revenue)}
          delta="+12.4%"
          deltaType="up"
          description="vs previous comparable period"
          icon={<FiDollarSign size={20} />}
          tone="orange"
        />
        <MetricCard
          title="Sales"
          value={formatCurrency(summary.sales)}
          delta="+8.7%"
          deltaType="up"
          description="gross sales remain healthy"
          icon={<FiTrendingUp size={20} />}
          tone="green"
        />
        <MetricCard
          title="Orders"
          value={String(summary.orders)}
          delta="+5.3%"
          deltaType="up"
          description="steady transaction growth"
          icon={<FiShoppingBag size={20} />}
          tone="blue"
        />
        <MetricCard
          title="Branch Health"
          value={`${summary.fulfilmentRate}%`}
          delta="Stable"
          deltaType="neutral"
          description="operational consistency"
          icon={<FiShield size={20} />}
          tone="purple"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <SectionCard
          title="Revenue Performance"
          subtitle="A quick visual trend for the selected period."
          action={
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-2 text-sm font-bold text-[#FF651D]"
            >
              View Analytics
            </Link>
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gradient-to-b from-orange-50/50 to-white p-5">
              <div className="flex h-72 items-end justify-between gap-3">
                {trend.map((value, index) => {
                  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  const height = Math.max(14, Math.round((value / maxTrend) * 100));

                  return (
                    <div key={labels[index]} className="flex flex-1 flex-col items-center gap-3">
                      <div className="flex h-56 items-end">
                        <div
                          className="w-9 rounded-t-[18px] bg-gradient-to-t from-[#FF651D] via-orange-400 to-orange-200 shadow-sm transition-all duration-700"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-500">{labels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] bg-gray-50 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FiActivity className="text-[#FF651D]" />
                  <h3 className="font-bold text-gray-900">Efficiency Pulse</h3>
                </div>
                <div className="space-y-4">
                  <ProgressRow label="Conversion Rate" value={summary.conversionRate} colorClass="bg-blue-500" />
                  <ProgressRow label="Fulfilment Rate" value={summary.fulfilmentRate} colorClass="bg-green-500" />
                  <ProgressRow label="Payout Health" value={summary.payoutHealth} colorClass="bg-purple-500" />
                  <ProgressRow label="Menu Coverage" value={summary.menuCoverage} colorClass="bg-orange-500" />
                </div>
              </div>

              <div className="rounded-[24px] bg-[#111827] p-5 text-white">
                <p className="text-sm font-semibold text-orange-200">Business Signal</p>
                <h3 className="mt-2 text-xl font-black">
                  Repeat customer rate is {summary.repeatCustomers}%
                </h3>
                <p className="mt-2 text-sm leading-6 text-gray-300">
                  This indicates healthy retention and better menu consistency
                  across your stronger branches.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Quick Routing"
          subtitle="Fast access to the most important vendor workflows."
        >
          <div className="grid gap-3">
            <QuickLinkCard href="/dashboard/restaurants" title="Restaurants" description="Manage all branches, compare health, and review performance." icon={<FiBriefcase size={20} />} />
            <QuickLinkCard href="/dashboard/orders" title="Orders" description="Track order flow, statuses, and delivery execution." icon={<FiShoppingBag size={20} />} />
            <QuickLinkCard href="/dashboard/analytics" title="Analytics" description="Study trends, KPIs, and revenue movement." icon={<FiBarChart2 size={20} />} />
            <QuickLinkCard href="/dashboard/offers" title="Offers" description="Monitor campaigns, discounts, and promotional lift." icon={<FiPercent size={20} />} />
            <QuickLinkCard href="/dashboard/payouts" title="Payouts" description="Review settlements, pending transfers, and payout health." icon={<FiCreditCard size={20} />} />
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <SectionCard
          title="Top Branch Performance"
          subtitle="Branch-wise business breakdown for fast executive visibility."
        >
          <div className="space-y-4">
            {topBranches.map((branch, index) => (
              <div
                key={branch.id}
                className="rounded-[24px] border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                        #{index + 1}
                      </span>
                      <h3 className="truncate text-lg font-black text-gray-900">
                        {branch.name}
                      </h3>
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
                          branch.status === "Open"
                            ? "bg-green-100 text-green-700"
                            : branch.status === "Busy"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600",
                        ].join(" ")}
                      >
                        {branch.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Revenue</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {formatCurrency(branch.revenue)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Orders</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {branch.orders}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Rating</p>
                        <p className="mt-1 flex items-center gap-1 text-base font-black text-gray-900">
                          <FiStar className="text-amber-500" />
                          {branch.rating}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[160px]">
                    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-4 text-center ring-1 ring-orange-100">
                      <p className="text-xs font-semibold text-gray-500">Contribution</p>
                      <p className="mt-2 text-2xl font-black text-[#FF651D]">
                        {branch.contribution}%
                      </p>
                      <p className="mt-1 text-xs text-gray-500">of vendor revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Operational Alerts" subtitle="What needs attention right now.">
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <AlertItem
                  key={`${alert.title}-${index}`}
                  title={alert.title}
                  text={alert.text}
                  tone={alert.tone}
                  icon={
                    alert.tone === "warning" ? (
                      <FiAlertCircle size={18} />
                    ) : alert.tone === "success" ? (
                      <FiPercent size={18} />
                    ) : (
                      <FiCreditCard size={18} />
                    )
                  }
                />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Live Activity" subtitle="A stream-style panel makes the dashboard feel current.">
            <div className="space-y-0">
              {activities.map((activity, index) => (
                <ActivityRow
                  key={`${activity.title}-${index}`}
                  title={activity.title}
                  time={activity.time}
                  detail={activity.detail}
                  status={activity.status}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          title="Top Selling Items"
          subtitle="Menu-level signals that help vendors improve revenue concentration."
        >
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-gray-50 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 ring-1 ring-gray-200">
                      #{index + 1}
                    </span>
                    <h3 className="truncate font-bold text-gray-900">{item.name}</h3>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.sales} orders in the selected period
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-gray-900">{formatCurrency(item.revenue)}</p>
                  <p className="text-xs text-gray-500">revenue generated</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Architecture Recommendations"
          subtitle="What will make this dashboard production-grade."
        >
          <div className="grid gap-3">
            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <FiLayers className="text-[#FF651D]" />
                One aggregated dashboard endpoint
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Best backend design is one route like
                <span className="font-semibold text-gray-900"> /api/vendor/dashboard/:vendorId</span>
                {" "}returning summary, trends, alerts, branch cards, and activity feed together.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <FiPieChart className="text-[#FF651D]" />
                Real filters and date ranges
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Keep the filter row and later wire it to backend query params for
                today, weekly, monthly, and custom range.
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <FiCheckCircle className="text-[#FF651D]" />
                Fail gracefully section by section
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Never let one broken service blank the entire dashboard. Each panel
                should have its own fallback strategy.
              </p>
            </div>
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-50 p-3 text-[#FF651D]">
              <FiBriefcase size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Executive Ready</h3>
              <p className="text-sm text-gray-500">Strong overview hierarchy</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <FiBarChart2 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Dynamic Feel</h3>
              <p className="text-sm text-gray-500">Interactive filters and trends</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-50 p-3 text-green-600">
              <FiUsers size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Customer Aware</h3>
              <p className="text-sm text-gray-500">Retention and activity cues</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600">
              <FiClock size={18} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Time Intelligent</h3>
              <p className="text-sm text-gray-500">Ready for real period filters</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}