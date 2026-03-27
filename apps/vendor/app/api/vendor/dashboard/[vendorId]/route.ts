import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: {
    vendorId: string;
  };
};

type DashboardResponse = {
  vendorId: string;
  range: string;
  lastUpdated: string;
  summary: {
    revenue: number;
    sales: number;
    orders: number;
    avgOrderValue: number;
    branches: number;
    repeatCustomers: number;
    conversionRate: number;
    fulfilmentRate: number;
    payoutHealth: number;
    menuCoverage: number;
  };
  trend: number[];
  branches: Array<{
    id: string;
    name: string;
    revenue: number;
    orders: number;
    rating: number;
    status: "Open" | "Busy" | "Closed";
    contribution: number;
  }>;
  topItems: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  alerts: Array<{
    title: string;
    text: string;
    tone: "warning" | "success" | "neutral";
  }>;
  activities: Array<{
    title: string;
    time: string;
    detail: string;
    status: "hot" | "good" | "note";
  }>;
};

function getRangeData(range: string) {
  switch (range) {
    case "today":
      return {
        summary: {
          revenue: 18450,
          sales: 22300,
          orders: 58,
          avgOrderValue: 384,
          branches: 4,
          repeatCustomers: 44,
          conversionRate: 69,
          fulfilmentRate: 92,
          payoutHealth: 86,
          menuCoverage: 77,
        },
        trend: [35, 54, 48, 72, 66, 88, 58],
      };

    case "30d":
      return {
        summary: {
          revenue: 482600,
          sales: 563900,
          orders: 1620,
          avgOrderValue: 348,
          branches: 4,
          repeatCustomers: 65,
          conversionRate: 76,
          fulfilmentRate: 93,
          payoutHealth: 90,
          menuCoverage: 82,
        },
        trend: [40, 51, 69, 73, 77, 89, 96],
      };

    case "month":
      return {
        summary: {
          revenue: 525300,
          sales: 612400,
          orders: 1785,
          avgOrderValue: 343,
          branches: 4,
          repeatCustomers: 67,
          conversionRate: 78,
          fulfilmentRate: 94,
          payoutHealth: 91,
          menuCoverage: 84,
        },
        trend: [44, 55, 63, 78, 82, 90, 98],
      };

    case "7d":
    default:
      return {
        summary: {
          revenue: 128450,
          sales: 153200,
          orders: 438,
          avgOrderValue: 350,
          branches: 4,
          repeatCustomers: 62,
          conversionRate: 74,
          fulfilmentRate: 91,
          payoutHealth: 88,
          menuCoverage: 79,
        },
        trend: [45, 58, 66, 72, 61, 80, 87],
      };
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { vendorId } = params;
    const { searchParams } = new URL(request.url);

    const requestedRange = searchParams.get("range") ?? "7d";
    const allowedRanges = ["today", "7d", "30d", "month"];
    const range = allowedRanges.includes(requestedRange) ? requestedRange : "7d";

    const { summary, trend } = getRangeData(range);

    const response: DashboardResponse = {
      vendorId,
      range,
      lastUpdated: new Date().toISOString(),
      summary,
      trend,
      branches: [
        {
          id: "r1",
          name: "BiteGo Patna Central",
          revenue: 142500,
          orders: 412,
          rating: 4.8,
          status: "Open",
          contribution: 32,
        },
        {
          id: "r2",
          name: "BiteGo Kankarbagh",
          revenue: 119200,
          orders: 355,
          rating: 4.6,
          status: "Open",
          contribution: 26,
        },
        {
          id: "r3",
          name: "BiteGo Ashok Rajpath",
          revenue: 98800,
          orders: 298,
          rating: 4.4,
          status: "Busy",
          contribution: 22,
        },
        {
          id: "r4",
          name: "BiteGo Fraser Road",
          revenue: 76400,
          orders: 240,
          rating: 4.3,
          status: "Closed",
          contribution: 17,
        },
      ],
      topItems: [
        {
          id: "m1",
          name: "Chicken Burger Combo",
          sales: 182,
          revenue: 36400,
        },
        {
          id: "m2",
          name: "Paneer Wrap Special",
          sales: 144,
          revenue: 25200,
        },
        {
          id: "m3",
          name: "Smoky Fries Bucket",
          sales: 126,
          revenue: 18900,
        },
        {
          id: "m4",
          name: "Cold Coffee Large",
          sales: 118,
          revenue: 14160,
        },
      ],
      alerts: [
        {
          title: "6 menu items are near stock risk",
          text: "Prioritize fast-moving SKUs so customer-facing availability stays stable during peak windows.",
          tone: "warning",
        },
        {
          title: "Weekend Combo campaign is performing well",
          text: "Offer-driven conversion is healthy. Extend high-performing bundles to weaker branches.",
          tone: "success",
        },
        {
          title: "Bank settlement monitoring is stable",
          text: "No major payout anomaly is visible in the current snapshot.",
          tone: "neutral",
        },
      ],
      activities: [
        {
          title: "Revenue spike detected",
          time: "10 min ago",
          detail: "Patna Central crossed a strong short-term spike during the dinner order window.",
          status: "hot",
        },
        {
          title: "Customer sentiment improved",
          time: "24 min ago",
          detail: "Recent review activity suggests stronger satisfaction on combo meals and wrap orders.",
          status: "good",
        },
        {
          title: "Offer expires soon",
          time: "1 hour ago",
          detail: "Weekend Combo campaign is entering its expiry window. Extend or replace to preserve momentum.",
          status: "note",
        },
        {
          title: "Branch activity normalized",
          time: "2 hours ago",
          detail: "Ashok Rajpath branch order flow has returned to a stable operating rhythm.",
          status: "good",
        },
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dashboard API route error:", error);

    return NextResponse.json(
      {
        message: "Route failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}