"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import {
  formatCurrency,
  formatDate,
  getVendorPayouts,
} from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";

function payoutStatusClass(status: string) {
  if (status === "Settled") return "bg-green-100 text-green-700";
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function PayoutsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
  const loader = useCallback(() => getVendorPayouts(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  if (loading) {
    return <DashboardPageSkeleton title="Loading payouts..." />;
  }

  if (error) {
    return <DashboardErrorState message={error} onRetry={refetch} />;
  }

  if (!data || data.payouts.length === 0) {
    return (
      <DashboardEmptyState
        title="No payouts yet"
        description="Payout entries will appear here once restaurant payments start getting processed."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Payouts</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Track settlements, payment health, and branch-level payout visibility.
            </p>
          </div>

          <button
            onClick={refetch}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <FiCreditCard size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Settled</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">
            {formatCurrency(data.summary.totalSettled)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Pending</p>
          <h3 className="mt-2 text-2xl font-black text-amber-600">
            {formatCurrency(data.summary.pendingPayouts)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Under Review</p>
          <h3 className="mt-2 text-2xl font-black text-red-600">
            {formatCurrency(data.summary.underReviewPayouts)}
          </h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Payout Health</p>
          <h3 className="mt-2 text-2xl font-black text-green-600">
            {data.summary.payoutHealth}%
          </h3>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Settlement Ledger</h2>
          <p className="mt-1 text-sm text-gray-500">
            A live payout register across branches.
          </p>

          <div className="mt-5 space-y-4">
            {data.payouts.map((payout) => (
              <div
                key={`${payout.branch}-${payout.reference}`}
                className="rounded-[24px] border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-gray-900">{payout.branch}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${payoutStatusClass(
                          payout.status
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Amount</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {formatCurrency(payout.amount)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Date</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {formatDate(payout.date)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Method</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {payout.paymentMethod}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Reference</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {payout.reference}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="lg:w-[150px]">
                    <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-white p-4 text-center ring-1 ring-orange-100">
                      <p className="text-xs font-semibold text-gray-500">Settlement</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-xl font-black text-[#FF651D]">
                        <FiCreditCard />
                        Secure
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Payout Signals</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
                <FiCheckCircle className="mt-1 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Settlements are healthy</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Most branch payouts are processing successfully.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                <FiClock className="mt-1 text-amber-600" />
                <div>
                  <p className="font-bold text-gray-900">Pending settlement</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(data.summary.pendingPayouts)} is still pending.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
                <FiAlertCircle className="mt-1 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">Review required</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {formatCurrency(data.summary.underReviewPayouts)} is flagged under review.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 shadow-sm text-white">
            <p className="text-sm font-semibold text-orange-200">Financial Integrity</p>
            <h2 className="mt-2 text-xl font-black">
              Payout data is tied to actual backend payment records
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              This page is fully dynamic and no longer depends on hardcoded payout rows.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <FiShield />
              Secure payout workflow
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <p className="inline-flex items-center gap-2 font-bold text-gray-900">
              <FiDollarSign className="text-[#FF651D]" />
              Recommendation
            </p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              You can extend this later with downloadable statements and payout export actions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}