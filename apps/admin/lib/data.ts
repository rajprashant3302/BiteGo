// src/lib/data.ts
import { 
  LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, TrendingUp, 
  Mail, Settings, UserPlus, AlertCircle, CheckCircle2, Clock, Bike, Star, Package, DollarSign
} from "lucide-react";

export function generateMonthData(daysInMonth = 30, monthName = "") {
  return Array.from({ length: daysInMonth }, (_, i) => ({
    label: `${i + 1}`,
    isLabelVisible: i === 0 || i === 4 || i === 9 || i === 14 || i === 19 || i === 24 || i === daysInMonth - 1,
    tooltipLabel: monthName ? `${i + 1} ${monthName}` : `Day ${i + 1}`,
    value: 30 + Math.random() * 70,
    revenue: Math.round((30 + Math.random() * 70) * 1000)
  }));
}

export function generateYearData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map(m => ({
    label: m,
    isLabelVisible: true,
    tooltipLabel: m,
    value: 800 + Math.random() * 1500,
    revenue: Math.round((800 + Math.random() * 1500) * 1000)
  }));
}

export function generateWeekData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map(d => ({
    label: d,
    isLabelVisible: true,
    tooltipLabel: d,
    value: 40 + Math.random() * 60,
    revenue: Math.round((40 + Math.random() * 60) * 1000)
  }));
}

export const CHART_DATA = {
  week: generateWeekData(),
  month: generateMonthData(),
  year: generateYearData(),
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const YEARS  = [2022, 2023, 2024, 2025, 2026];
export const PIE_COLORS = ["#FF651D", "#3B82F6", "#10B981", "#A855F7", "#F59E0B", "#EC4899"];

export const STAT_CARDS = [
  { label: "Total Revenue",     value: "₹4,82,310", change: 12.4,  color: "text-orange-500", bg: "bg-orange-50"  },
  { label: "Total Orders",      value: "12,847",    change: 8.1,   color: "text-blue-500",   bg: "bg-blue-50"    },
  { label: "Active Users",      value: "3,291",     change: 5.3,   color: "text-green-500",  bg: "bg-green-50"   },
  { label: "Restaurants",       value: "148",       change: -2.1,  color:"text-purple-500", bg:"bg-purple-50"  },
  { label: "Avg. Rating",       value: "4.6",       change: 0.3,   color: "text-yellow-500", bg: "bg-yellow-50"  },
  { label: "Delivery Partners", value: "312",       change: 14.7,  color: "text-pink-500",   bg: "bg-pink-50"    },
];

export const TOP_RESTAURANTS = [
  { name: "Spice Garden",    revenue: "₹82,400", orders: 1243, rating: 4.8, trend: "up"   },
  { name: "The Burger Lab",  revenue: "₹71,200", orders: 987,  rating: 4.6, trend: "up"   },
  { name: "Pizza Paradise",  revenue: "₹63,800", orders: 854,  rating: 4.5, trend: "down" },
  { name: "Wok & Roll",      revenue: "₹58,100", orders: 721,  rating: 4.7, trend: "up"   },
  { name: "Desi Dhaba",      revenue: "₹49,600", orders: 698,  rating: 4.4, trend: "down" },
];

export const RECENT_ORDERS = [
  { id:"ORD-7821", customer:"Priya Sharma",  restaurant:"Spice Garden",    amount:"₹485", status:"Delivered", time:"2m ago"  },
  { id:"ORD-7820", customer:"Rahul Verma",   restaurant:"The Burger Lab",  amount:"₹320", status:"Preparing", time:"5m ago"  },
  { id:"ORD-7819", customer:"Ananya Singh",  restaurant:"Pizza Paradise",  amount:"₹670", status:"Placed",    time:"8m ago"  },
  { id:"ORD-7818", customer:"Karan Mehta",   restaurant:"Wok & Roll",      amount:"₹290", status:"Delivered", time:"12m ago" },
  { id:"ORD-7817", customer:"Neha Patel",    restaurant:"Desi Dhaba",      amount:"₹410", status:"Cancelled", time:"15m ago" },
];

export const ORDER_STATS = [
  { label: "Delivered", value: "8,421", pct: 68, dotColor: "bg-green-500", textColor: "text-green-600" },
  { label: "Preparing", value: "342",   pct: 12, dotColor: "bg-blue-500",  textColor: "text-blue-600"  },
  { label: "Placed",    value: "128",   pct: 10, dotColor: "bg-orange-500",textColor: "text-orange-600"},
  { label: "Cancelled", value: "94",    pct: 10, dotColor: "bg-red-400",   textColor: "text-red-500"   },
];

export const NAV_ITEMS = [
  { label: "Dashboard",   href: "/"           },
  { label: "All Users",   href: "/all-users" },
  { label: "Restaurants", href: "/restaurants"},
  { label: "Orders",      href: "/orders"    },
  { label: "Analytics",   href: "/analytics" },
  { label: "Invite",      href: "/invite"    },
  { label: "Support",     href: "/chat"   },
  { label: "Settings",    href: "/settings"  },
];

export function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + n;
}