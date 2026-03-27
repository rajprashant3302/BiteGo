import { prisma } from "../../../../../packages/database";
import { redisClient } from "../../../../../packages/redis";

type BranchStatus = "Open" | "Busy" | "Closed";

type BranchData = {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  rating: number;
  status: BranchStatus;
  contribution: number;
};

type TopItemData = {
  id: string;
  name: string;
  sales: number;
  revenue: number;
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
  branches: BranchData[];
  topItems: TopItemData[];
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

type RestaurantRow = {
  RestaurantID: string;
  Name: string;
  Rating: number | null;
  IsOpen: boolean;
};

type OrderItemRow = {
  ItemID: string;
  Quantity: number;
  ItemPrice: number | null;
  name: string;
};

type OrderRow = {
  RestaurantID: string;
  OrderDateTime: Date;
  RestaurantEarning: number | null;
  TotalAmount: number | null;
  items: OrderItemRow[];
};

type RawOrderItem = {
  ItemID: string;
  Quantity: number;
  ItemPrice: unknown;
  item?: {
    ItemName: string | null;
  } | null;
};

type RawOrder = {
  RestaurantID: string;
  OrderDateTime: Date;
  RestaurantEarning: unknown;
  TotalAmount: unknown;
  items: RawOrderItem[];
};

export async function getDashboardData(
  vendorId: string,
  range: string
): Promise<DashboardResponse> {
  const cacheKey = `dashboard:${vendorId}:${range}`;

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    console.log("⚡ Dashboard cache hit");
    return JSON.parse(cached) as DashboardResponse;
  }

  console.log("📦 Dashboard cache miss");

  const now = new Date();
  let startDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (range === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else if (range === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const restaurantsRaw = await prisma.restaurant.findMany({
    where: {
      owner: {
        UserID: vendorId,
      },
    },
    select: {
      RestaurantID: true,
      Name: true,
      Rating: true,
      IsOpen: true,
    },
  });

  const restaurants: RestaurantRow[] = restaurantsRaw.map((r: any): RestaurantRow => ({
    RestaurantID: r.RestaurantID,
    Name: r.Name,
    Rating: r.Rating ? Number(r.Rating) : null,
    IsOpen: r.IsOpen,
  }));

  const restaurantIds: string[] = restaurants.map(
    (r: RestaurantRow): string => r.RestaurantID
  );

  const ordersRaw = await prisma.orders.findMany({
    where: {
      RestaurantID: {
        in: restaurantIds,
      },
      OrderDateTime: {
        gte: startDate,
      },
    },
    select: {
      RestaurantID: true,
      OrderDateTime: true,
      RestaurantEarning: true,
      TotalAmount: true,
      items: {
        select: {
          ItemID: true,
          Quantity: true,
          ItemPrice: true,
          item: {
            select: {
              ItemName: true,
            },
          },
        },
      },
    },
  });

  const orders: OrderRow[] = (ordersRaw as RawOrder[]).map(
    (o: RawOrder): OrderRow => ({
      RestaurantID: o.RestaurantID,
      OrderDateTime: o.OrderDateTime,
      RestaurantEarning: o.RestaurantEarning ? Number(o.RestaurantEarning) : 0,
      TotalAmount: o.TotalAmount ? Number(o.TotalAmount) : 0,
      items: o.items.map(
        (item: RawOrderItem): OrderItemRow => ({
          ItemID: item.ItemID,
          Quantity: item.Quantity,
          ItemPrice: item.ItemPrice ? Number(item.ItemPrice) : 0,
          name: item.item?.ItemName ?? "Item",
        })
      ),
    })
  );

  const revenue: number = orders.reduce(
    (sum: number, o: OrderRow): number => sum + Number(o.RestaurantEarning || 0),
    0
  );

  const sales: number = orders.reduce(
    (sum: number, o: OrderRow): number => sum + Number(o.TotalAmount || 0),
    0
  );

  const orderCount: number = orders.length;
  const avgOrderValue: number = orderCount > 0 ? sales / orderCount : 0;

  const branches: BranchData[] = restaurants.map((r: RestaurantRow): BranchData => {
    const branchOrders: OrderRow[] = orders.filter(
      (o: OrderRow): boolean => o.RestaurantID === r.RestaurantID
    );

    const branchRevenue: number = branchOrders.reduce(
      (sum: number, o: OrderRow): number => sum + Number(o.RestaurantEarning || 0),
      0
    );

    return {
      id: r.RestaurantID,
      name: r.Name,
      revenue: branchRevenue,
      orders: branchOrders.length,
      rating: Number(r.Rating || 0),
      status: r.IsOpen ? "Open" : "Closed",
      contribution: revenue > 0 ? Math.round((branchRevenue / revenue) * 100) : 0,
    };
  });

  const itemMap: Record<string, TopItemData> = {};

  orders.forEach((order: OrderRow): void => {
    order.items.forEach((item: OrderItemRow): void => {
      if (!itemMap[item.ItemID]) {
        itemMap[item.ItemID] = {
          id: item.ItemID,
          name: item.name,
          sales: 0,
          revenue: 0,
        };
      }

      itemMap[item.ItemID].sales += item.Quantity;
      itemMap[item.ItemID].revenue += Number(item.ItemPrice || 0) * item.Quantity;
    });
  });

  const topItems: TopItemData[] = Object.values(itemMap)
    .sort((a: TopItemData, b: TopItemData): number => b.sales - a.sales)
    .slice(0, 5);

  const trend: number[] = [0, 0, 0, 0, 0, 0, 0];

  orders.forEach((order: OrderRow): void => {
    const day = new Date(order.OrderDateTime).getDay();
    trend[day] += Number(order.RestaurantEarning || 0);
  });

  const response: DashboardResponse = {
    vendorId,
    range,
    lastUpdated: new Date().toISOString(),
    summary: {
      revenue,
      sales,
      orders: orderCount,
      avgOrderValue,
      branches: restaurants.length,
      repeatCustomers: 65,
      conversionRate: 74,
      fulfilmentRate: 91,
      payoutHealth: 88,
      menuCoverage: 79,
    },
    trend,
    branches,
    topItems,
    alerts: [],
    activities: [],
  };

  await redisClient.set(cacheKey, JSON.stringify(response), {
    EX: 60,
  });

  return response;
}