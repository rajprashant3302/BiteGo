"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import {
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiXCircle,
} from "react-icons/fi";
import {
  VendorOrder,
  formatCurrency,
  getOrderSocketConfig,
  getVendorOrders,
} from "../../lib/dashboard/vendor-dashboard";
import { useVendorQuery } from "../../lib/dashboard/use-vendor-query";
import DashboardPageSkeleton from "../../../components/dashboard/DashboardPageSkeleton";
import DashboardEmptyState from "../../../components/dashboard/DashboardEmptyState";
import DashboardErrorState from "../../../components/dashboard/DashboardErrorState";

type OrderStatus = "Placed" | "Preparing" | "Prepared" | "PickedUp" | "Delivered" | "Cancelled";

function statusClass(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-700";
  if (["Preparing", "Prepared", "PickedUp", "Placed"].includes(status)) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function sortOrders(orders: VendorOrder[]) {
  const priority: Record<string, number> = {
    Placed: 1,
    Preparing: 2,
    Prepared: 3,
    PickedUp: 4,
    Delivered: 5,
    Cancelled: 6,
  };

  return [...orders].sort((a, b) => {
    const aPriority = priority[a.status] ?? 99;
    const bPriority = priority[b.status] ?? 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function timeAgo(value: string, nowTs: number) {
  const diff = Math.max(0, nowTs - new Date(value).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function OrdersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [nowTs, setNowTs] = useState(Date.now());

  const userId = session?.user?.id;
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const loader = useCallback(() => getVendorOrders(userId!, token), [userId, token]);
  const { data, loading, error, refetch } = useVendorQuery(Boolean(userId), loader);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data?.orders?.length) return;

    const { url, path } = getOrderSocketConfig();
    const restaurantIds = Array.from(new Set(data.orders.map((order) => String(order.restaurantId)).filter(Boolean)));
    if (!restaurantIds.length) return;

    const socket: Socket = io(url, {
      path,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      restaurantIds.forEach((id) => socket.emit("join_room", `restaurant_${id}`));
    });

    const sync = () => refetch();
    socket.on("new_vendor_order", sync);
    socket.on("vendor_new_order", sync);
    socket.on("vendor_order_status_updated", sync);

    return () => {
      restaurantIds.forEach((id) => socket.emit("leave_room", `restaurant_${id}`));
      socket.off("new_vendor_order", sync);
      socket.off("vendor_new_order", sync);
      socket.off("vendor_order_status_updated", sync);
      socket.disconnect();
    };
  }, [data?.orders, refetch]);

  const restaurantOptions = useMemo(() => {
    const rows = data?.orders || [];
    return Array.from(new Set(rows.map((order) => order.branch))).sort();
  }, [data?.orders]);

  const filteredOrders = useMemo(() => {
    const rows = sortOrders(data?.orders || []);
    const q = search.trim().toLowerCase();
    return rows.filter((order) => {
      const matchesSearch = !q || `${order.id} ${order.customer} ${order.branch} ${order.itemSummary || ""}`.toLowerCase().includes(q);
      const matchesRestaurant = restaurantFilter === "all" || order.branch === restaurantFilter;
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      return matchesSearch && matchesRestaurant && matchesStatus;
    });
  }, [data?.orders, search, restaurantFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, restaurantFilter, statusFilter]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  async function updateOrderStatus(order: VendorOrder, status: OrderStatus) {
    try {
      setUpdatingOrderId(order.id);
      const base = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
      const isVendorAction = status === "Preparing" || status === "Prepared";
      const endpoint = isVendorAction
        ? `${base}/api/orders/${order.id}/vendor-status`
        : `${base}/api/orders/${order.id}/status`;
      const payload = isVendorAction
        ? { status, restaurantId: order.restaurantId }
        : { status, restaurantId: order.restaurantId };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.message || result.error || "Failed to update order status");
      }
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) return <DashboardPageSkeleton title="Loading orders..." />;
  if (error) return <DashboardErrorState message={error} onRetry={refetch} />;
  if (!data || data.orders.length === 0) {
    return (
      <DashboardEmptyState
        title="No orders yet"
        description="As soon as customers place orders, they will appear here automatically."
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Orders</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Live restaurant queue with instant order updates, smart search, and action controls.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative sm:col-span-2">
              <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search order ID, customer, item, or restaurant"
                className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-orange-300 focus:bg-white"
              />
            </div>
            <select
              value={restaurantFilter}
              onChange={(e) => setRestaurantFilter(e.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none focus:border-orange-300"
            >
              <option value="all">All restaurants</option>
              {restaurantOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 outline-none focus:border-orange-300"
            >
              <option value="all">All statuses</option>
              <option value="Placed">Placed</option>
              <option value="Preparing">Preparing</option>
              <option value="Prepared">Prepared</option>
              <option value="PickedUp">Picked Up</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={refetch}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {orderStats.map((item) => (
          <div key={item.label} className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{item.label}</p>
            <h3 className="mt-2 text-2xl font-black text-gray-900">{item.value}</h3>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {paginatedOrders.map((order) => {
              const isUpdating = updatingOrderId === order.id;
              const canAccept = order.status === "Placed";
              const canCancel = !["Cancelled", "Delivered"].includes(order.status);

              return (
                <div key={order.id} className="rounded-[24px] border border-gray-100 p-5 transition hover:border-orange-200 hover:bg-orange-50/20">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-gray-900">#{order.id.slice(0, 8)}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                          {timeAgo(order.createdAt, nowTs)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Customer</p>
                          <p className="mt-1 text-sm font-black text-gray-900">{order.customer}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Restaurant</p>
                          <p className="mt-1 text-sm font-black text-gray-900">{order.branch}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Items</p>
                          <p className="mt-1 text-sm font-black text-gray-900">{order.itemCount || 0}</p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{order.itemSummary}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Amount</p>
                          <p className="mt-1 text-sm font-black text-gray-900">{formatCurrency(order.amount)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 p-3">
                          <p className="text-xs font-semibold text-gray-500">Payment</p>
                          <p className="mt-1 text-sm font-black text-gray-900">{order.paymentMethod} · {order.paymentStatus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                      <button
                        disabled={isUpdating || !canAccept}
                        onClick={() => updateOrderStatus(order, "Preparing")}
                        className="rounded-2xl bg-[#FF651D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#e75a18] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUpdating ? (
                          <span className="inline-flex items-center gap-2"><FiLoader className="animate-spin" /> Updating</span>
                        ) : (
                          "Order"
                        )}
                      </button>
                      <button
                        disabled={isUpdating || !canCancel}
                        onClick={() => updateOrderStatus(order, "Cancelled")}
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
              <p className="text-sm font-semibold text-gray-500">Page {page} of {totalPages}</p>
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
                  <p className="font-bold text-gray-900">Completed orders</p>
                  <p className="mt-1 text-sm text-gray-600">{data.stats.deliveredOrders} orders have already been delivered.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                <FiClock className="mt-1 text-amber-600" />
                <div>
                  <p className="font-bold text-gray-900">Active queue</p>
                  <p className="mt-1 text-sm text-gray-600">{data.stats.inProgressOrders} orders are live in the kitchen or dispatch flow.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
                <FiXCircle className="mt-1 text-red-600" />
                <div>
                  <p className="font-bold text-gray-900">Cancelled orders</p>
                  <p className="mt-1 text-sm text-gray-600">{data.stats.cancelledOrders} orders were cancelled and updated to the vendor view.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <FiFilter className="mt-1 text-blue-600" />
                <div>
                  <p className="font-bold text-gray-900">Smart filtering</p>
                  <p className="mt-1 text-sm text-gray-600">Search by customer, order, or item and filter by restaurant and status.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
