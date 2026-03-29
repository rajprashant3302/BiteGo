export type FilterKey = "today" | "7d" | "30d" | "month";

export type SummaryData = {
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

export type BranchData = {
  id: string;
  name: string;
  revenue: number;
  orders: number;
  rating: number;
  status: string;
  contribution: number;
};

export type TopItemData = {
  id: string;
  name: string;
  sales: number;
  revenue: number;
};

export type AlertData = {
  title: string;
  text: string;
  tone: "warning" | "success" | "neutral";
};

export type ActivityData = {
  title: string;
  time: string;
  detail: string;
  status: "hot" | "good" | "note";
};

export type DashboardResponse = {
  vendorId: string;
  range: FilterKey;
  lastUpdated: string;
  summary: SummaryData;
  trend: number[];
  branches: BranchData[];
  topItems: TopItemData[];
  alerts: AlertData[];
  activities: ActivityData[];
};