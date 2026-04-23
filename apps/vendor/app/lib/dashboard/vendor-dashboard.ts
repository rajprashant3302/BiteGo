"use client";

export type Restaurant = {
  id: string;
  name: string;
  categoryName: string | null;
  isOpen: boolean;
  rating: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  latestOrderAt: string | null;
  status: "Open" | "Busy" | "Closed";
  health: "Stable" | "Needs attention";
  momentum: "Strong" | "Moderate" | "Low";
};

export type VendorOrder = {
  id: string;
  restaurantId: string;
  customer: string;
  branch: string;
  amount: number;
  status: string;
  createdAt: string;
  paymentStatus: string;
  paymentMethod: string;
  itemSummary?: string;
  itemCount?: number;
};

export type VendorReview = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type Payout = {
  branch: string;
  amount: number;
  status: "Settled" | "Pending" | "Under Review";
  date: string;
  paymentMethod: string;
  reference: string;
};

export type OverviewResponse = {
  summary: {
    totalRestaurants: number;
    openRestaurants: number;
    busyRestaurants: number;
    closedRestaurants: number;
    avgRating: number;
    totalOrders: number;
    deliveredOrders: number;
    inProgressOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    repeatCustomersRate: number;
    totalSettled: number;
    pendingPayouts: number;
    payoutHealth: number;
  };
  restaurants: Restaurant[];
  recentOrders: VendorOrder[];
  payouts: Payout[];
  revenueTrend: Array<{ label: string; revenue: number }>;
};

export type AnalyticsResponse = {
  metrics: {
    revenue: number;
    sales: number;
    averageOrderValue: number;
    repeatCustomersRate: number;
  };
  revenueTrend: Array<{ label: string; revenue: number }>;
  statusBreakdown: Array<{ label: string; value: number }>;
  topRestaurants: Array<{ name: string; revenue: number; orders: number }>;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_VENDOR_API_URL ||
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  "http://localhost:5000";

export function getOrderSocketConfig() {
  const raw = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
  try {
    const url = new URL(raw);
    const isSvc = url.pathname.startsWith("/svc/order");
    return {
      url: `${url.protocol}//${url.host}`,
      path: isSvc ? "/svc/order/socket.io" : "/socket.io",
    };
  } catch {
    if (raw.startsWith("/svc/order")) {
      return { url: window?.location?.origin || "http://localhost", path: "/svc/order/socket.io" };
    }
    return { url: raw, path: "/socket.io" };
  }
}

async function request<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export async function getVendorOverview(userId: string, token?: string) {
  return request<OverviewResponse>(`/api/partner/dashboard/${userId}/overview`, token);
}

export async function getVendorRestaurants(userId: string, token?: string) {
  return request<{ restaurants: Restaurant[]; summary: OverviewResponse["summary"] }>(
    `/api/partner/dashboard/${userId}/restaurants`,
    token
  );
}

export async function getVendorOrders(userId: string, token?: string) {
  return request<{
    stats: Pick<
      OverviewResponse["summary"],
      "totalOrders" | "deliveredOrders" | "inProgressOrders" | "cancelledOrders"
    >;
    orders: VendorOrder[];
  }>(`/api/partner/dashboard/${userId}/orders`, token);
}

export async function getVendorReviews(userId: string, token?: string) {
  return request<{
    summary: { totalReviews: number; averageRating: number; fiveStarReviews: number };
    reviews: VendorReview[];
  }>(`/api/partner/dashboard/${userId}/reviews`, token);
}

export async function getVendorAnalytics(userId: string, token?: string) {
  return request<AnalyticsResponse>(`/api/partner/dashboard/${userId}/analytics`, token);
}

export async function getVendorPayouts(userId: string, token?: string) {
  return request<{
    summary: Pick<
      OverviewResponse["summary"],
      "totalSettled" | "pendingPayouts" | "payoutHealth"
    > & {
      underReviewPayouts: number;
    };
    payouts: Payout[];
  }>(`/api/partner/dashboard/${userId}/payouts`, token);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
