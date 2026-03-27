"use client";

import {
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";

const orderStats = [
  { label: "Total Orders", value: "438" },
  { label: "Delivered", value: "391" },
  { label: "In Progress", value: "29" },
  { label: "Cancelled", value: "18" },
];

const recentOrders = [
  {
    id: "#BG-1024",
    customer: "Rahul Kumar",
    branch: "Patna Central",
    amount: "₹420",
    status: "Delivered",
  },
  {
    id: "#BG-1025",
    customer: "Ananya Singh",
    branch: "Kankarbagh",
    amount: "₹310",
    status: "Preparing",
  },
  {
    id: "#BG-1026",
    customer: "Ravi Prakash",
    branch: "Ashok Rajpath",
    amount: "₹560",
    status: "On The Way",
  },
  {
    id: "#BG-1027",
    customer: "Neha Sharma",
    branch: "Fraser Road",
    amount: "₹260",
    status: "Cancelled",
  },
];

function statusClass(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-700";
  if (status === "Preparing" || status === "On The Way")
    return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Track order flow, delivery progress, and execution quality across
              all branches.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                className="h-11 rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white"
              />
            </div>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
              <FiFilter />
              Filter
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orderStats.map((item) => (
          <div
            key={item.label}
            className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-gray-500">{item.label}</p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">{item.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Recent Orders</h2>
          <p className="mt-1 text-sm text-gray-500">
            Live order stream styled for vendor-side visibility.
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500">
                  <th className="pb-3 font-semibold">Order ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Branch</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="py-4 font-bold text-gray-900">{order.id}</td>
                    <td className="py-4 text-sm text-gray-600">{order.customer}</td>
                    <td className="py-4 text-sm text-gray-600">{order.branch}</td>
                    <td className="py-4 font-semibold text-gray-900">{order.amount}</td>
                    <td className="py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Order Health</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
                <FiCheckCircle className="mt-1 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Delivery quality strong</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Delivered orders continue to dominate the order mix.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                <FiClock className="mt-1 text-amber-600" />
                <div>
                  <p className="font-bold text-gray-900">Active order load</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor preparing and in-transit orders during peak periods.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
                <FiXCircle className="mt-1 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">Cancellation watch</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Cancelled orders should be tracked for branch-level root causes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Execution Signals</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiTruck className="text-[#FF651D]" />
                  Dispatch activity
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Keep a close watch on orders waiting for dispatch handoff.
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="inline-flex items-center gap-2 font-bold text-gray-900">
                  <FiShoppingBag className="text-[#FF651D]" />
                  Order throughput
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Throughput remains healthy, especially across top-performing
                  branches.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}