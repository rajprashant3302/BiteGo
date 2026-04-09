"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import { formatCurrency, getVendorOrders } from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";

type OrderStatus = "Placed" | "Preparing" | "PickedUp" | "Delivered" | "Cancelled";

function statusClass(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-700";
  if (["Preparing", "PickedUp", "Placed"].includes(status))
    return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function sortOrders(orders: any[]) {
  const priority: Record<string, number> = {
    Preparing: 1,
    Placed: 2,
    PickedUp: 3,
    Delivered: 4,
    Cancelled: 5,
  };

  return [...orders].sort((a, b) => {
    const aPriority = priority[a.status] ?? 99;
    const bPriority = priority[b.status] ?? 99;

    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const loader = useCallback(() => getVendorOrders(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  const filteredOrders = useMemo(() => {
    const rows = sortOrders(data?.orders || []);
    if (!search.trim()) return rows;

    const q = search.toLowerCase();
    return rows.filter((order) =>
      `${order.id} ${order.customer} ${order.branch} ${order.status}`
        .toLowerCase()
        .includes(q)
    );
  }, [data?.orders, search]);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      setUpdatingOrderId(orderId);

      const base =
        process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

      const res = await fetch(`${base}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Failed to update order status");
      }

      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) {
    return <DashboardPageSkeleton title="Loading live orders..." />;
  }

  if (error) {
    return <DashboardErrorState message={error} onRetry={refetch} />;
  }

  if (!data || data.orders.length === 0) {
    return (
      <DashboardEmptyState
        title="No orders yet"
        description="As soon as users place orders, they will appear here for vendor action."
      />
    );
  }

  const orderStats = [
    { label: "Total Orders", value: String(data.stats.totalOrders) },
    { label: "Delivered", value: String(data.stats.deliveredOrders) },
    { label: "In Progress", value: String(data.stats.inProgressOrders) },
    { label: "Cancelled", value: String(data.stats.cancelledOrders) },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Live vendor queue with action buttons, prioritized by what needs attention first.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                type="text"
                placeholder="Search orders..."
                className="h-11 rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white"
              />
            </div>

            <button
              onClick={refetch}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <FiRefreshCw />
              Refresh
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

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900">Priority Order Queue</h2>
          <p className="mt-1 text-sm text-gray-500">
            Preparing orders are shown first, then placed, then the rest.
          </p>

          <div className="mt-5 space-y-4">
            {paginatedOrders.map((order) => {
              const isUpdating = updatingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-[24px] border border-gray-100 p-4 transition hover:border-orange-200 hover:bg-orange-50/20"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">
                          #{order.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Customer</p>
                          <p className="mt-1 text-sm font-black text-gray-900">
                            {order.customer}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Branch</p>
                          <p className="mt-1 text-sm font-black text-gray-900">
                            {order.branch}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Amount</p>
                          <p className="mt-1 text-sm font-black text-gray-900">
                            {formatCurrency(order.amount)}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Payment</p>
                          <p className="mt-1 text-sm font-black text-gray-900">
                            {order.paymentMethod} · {order.paymentStatus}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:w-[310px] xl:justify-end">
                      <button
                        disabled={isUpdating || order.status === "Preparing"}
                        onClick={() => updateOrderStatus(order.id, "Preparing")}
                        className="rounded-2xl bg-[#FF651D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#e75a18] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-2">
                            <FiLoader className="animate-spin" />
                            Updating
                          </span>
                        ) : (
                          "Prepare"
                        )}
                      </button>

                      <button
                        disabled={isUpdating || order.status === "PickedUp"}
                        onClick={() => updateOrderStatus(order.id, "PickedUp")}
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Dispatch
                      </button>

                      <button
                        disabled={isUpdating || order.status === "Delivered"}
                        onClick={() => updateOrderStatus(order.id, "Delivered")}
                        className="rounded-2xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Complete
                      </button>

                      <button
                        disabled={isUpdating || order.status === "Cancelled"}
                        onClick={() => updateOrderStatus(order.id, "Cancelled")}
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredOrders.length > pageSize ? (
            <div className="mt-6 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50"
              >
                Previous
              </button>

              <p className="text-sm font-semibold text-gray-500">
                Page {page} of {totalPages}
              </p>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-gray-900">Queue Signals</h2>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4">
                <FiCheckCircle className="mt-1 text-green-600" />
                <div>
                  <p className="font-bold text-gray-900">Delivered orders</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {data.stats.deliveredOrders} orders have already been completed.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                <FiClock className="mt-1 text-amber-600" />
                <div>
                  <p className="font-bold text-gray-900">Active workload</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {data.stats.inProgressOrders} orders are currently in progress.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
                <FiXCircle className="mt-1 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">Cancellation watch</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {data.stats.cancelledOrders} orders were cancelled and should be reviewed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-100 bg-[#111827] p-6 text-white shadow-sm">
            <p className="text-sm font-semibold text-orange-200">Interactive Vendor Flow</p>
            <h2 className="mt-2 text-xl font-black">
              Orders now feel actionable instead of static
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Vendors can move orders through prepare, dispatch, complete, and cancel steps directly from the queue.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <FiTruck />
              Live action workflow
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}