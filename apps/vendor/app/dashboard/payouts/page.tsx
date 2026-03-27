"use client";

import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";

const payouts = [
  {
    branch: "Patna Central",
    amount: "₹42,500",
    status: "Settled",
    date: "26 Mar 2026",
  },
  {
    branch: "Kankarbagh",
    amount: "₹36,200",
    status: "Settled",
    date: "26 Mar 2026",
  },
  {
    branch: "Ashok Rajpath",
    amount: "₹28,100",
    status: "Pending",
    date: "27 Mar 2026",
  },
  {
    branch: "Fraser Road",
    amount: "₹21,650",
    status: "Under Review",
    date: "27 Mar 2026",
  },
];

function payoutStatusClass(status: string) {
  if (status === "Settled") return "bg-green-100 text-green-700";
  if (status === "Pending") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function PayoutsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-gray-900">Payouts</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Track settlements, payment health, and branch-level payout visibility.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Total Settled</p>
          <h3 className="mt-2 text-2xl font-black text-gray-900">₹78,700</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Pending</p>
          <h3 className="mt-2 text-2xl font-black text-amber-600">₹28,100</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Under Review</p>
          <h3 className="mt-2 text-2xl font-black text-red-600">₹21,650</h3>
        </div>
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-500">Payout Health</p>
          <h3 className="mt-2 text-2xl font-black text-green-600">88%</h3>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Settlement Ledger</h2>
          <p className="mt-1 text-sm text-gray-500">
            A clean vendor-side payout register across branches.
          </p>

          <div className="mt-5 space-y-4">
            {payouts.map((payout) => (
              <div
                key={`${payout.branch}-${payout.date}`}
                className="rounded-[24px] border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/20"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-gray-900">
                        {payout.branch}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${payoutStatusClass(
                          payout.status
                        )}`}
                      >
                        {payout.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Amount</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {payout.amount}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Date</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          {payout.date}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <p className="text-xs font-semibold text-gray-500">Method</p>
                        <p className="mt-1 text-base font-black text-gray-900">
                          Bank Transfer
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
                    Ashok Rajpath payout should be monitored until completion.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
                <FiAlertCircle className="mt-1 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">Review required</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Fraser Road payout is under review and may need manual attention.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 shadow-sm text-white">
            <p className="text-sm font-semibold text-orange-200">Financial Integrity</p>
            <h2 className="mt-2 text-xl font-black">
              Add verified bank and settlement APIs next
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              This section becomes truly real when connected to actual settlement,
              payout, and verification services.
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
              Add payout filters for settled, pending, failed, and disputed states,
              along with downloadable settlement history.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}