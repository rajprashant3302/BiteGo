"use client";

import { useState, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, UtensilsCrossed, ShoppingBag, TrendingUp,
  Mail, Settings, LogOut, Bell, Search, ChevronUp, ChevronDown,
  ArrowUpRight, DollarSign, Star, Package, UserPlus, AlertCircle,
  CheckCircle2, Clock, Bike, Menu, X, BarChart2, LineChart, PieChart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = "week" | "month" | "year" | "custom";
type ChartType = "bar" | "line" | "pie";

// ─── Data per period ──────────────────────────────────────────────────────────
const CHART_DATA: Record<Period, { label: string; value: number; revenue: number }[]> = {
  week: [
    { label: "Mon", value: 65, revenue: 130000 },
    { label: "Tue", value: 82, revenue: 164000 },
    { label: "Wed", value: 74, revenue: 148000 },
    { label: "Thu", value: 91, revenue: 182000 },
    { label: "Fri", value: 88, revenue: 176000 },
    { label: "Sat", value: 100, revenue: 200000 },
    { label: "Sun", value: 78, revenue: 156000 },
  ],
  month: [
    { label: "W1",  value: 60, revenue: 480000 },
    { label: "W2",  value: 75, revenue: 600000 },
    { label: "W3",  value: 85, revenue: 680000 },
    { label: "W4",  value: 100, revenue: 800000 },
  ],
  year: [
    { label: "Jan", value: 55, revenue: 1200000 },
    { label: "Feb", value: 62, revenue: 1350000 },
    { label: "Mar", value: 70, revenue: 1530000 },
    { label: "Apr", value: 68, revenue: 1480000 },
    { label: "May", value: 78, revenue: 1700000 },
    { label: "Jun", value: 85, revenue: 1850000 },
    { label: "Jul", value: 90, revenue: 1960000 },
    { label: "Aug", value: 88, revenue: 1920000 },
    { label: "Sep", value: 82, revenue: 1790000 },
    { label: "Oct", value: 95, revenue: 2070000 },
    { label: "Nov", value: 100, revenue: 2180000 },
    { label: "Dec", value: 92, revenue: 2010000 },
  ],
  custom: [],
};

// Months / years for custom picker
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = [2022, 2023, 2024, 2025, 2026];

// Pie chart colours
const PIE_COLORS = ["#FF651D", "#3B82F6", "#10B981", "#A855F7", "#F59E0B", "#EC4899"];

// ─── Static mock data ─────────────────────────────────────────────────────────
const STAT_CARDS = [
  { label: "Total Revenue",     value: "₹4,82,310", change: 12.4,  icon: <DollarSign size={20}/>,    color: "text-orange-500", bg: "bg-orange-50"  },
  { label: "Total Orders",      value: "12,847",    change: 8.1,   icon: <ShoppingBag size={20}/>,   color: "text-blue-500",   bg: "bg-blue-50"    },
  { label: "Active Users",      value: "3,291",     change: 5.3,   icon: <Users size={20}/>,         color: "text-green-500",  bg: "bg-green-50"   },
  { label: "Restaurants",       value: "148",       change: -2.1,  icon: <UtensilsCrossed size={20}/>, color:"text-purple-500", bg:"bg-purple-50"  },
  { label: "Avg. Rating",       value: "4.6",       change: 0.3,   icon: <Star size={20}/>,          color: "text-yellow-500", bg: "bg-yellow-50"  },
  { label: "Delivery Partners", value: "312",       change: 14.7,  icon: <Bike size={20}/>,          color: "text-pink-500",   bg: "bg-pink-50"    },
];

const TOP_RESTAURANTS = [
  { name: "Spice Garden",    revenue: "₹82,400", orders: 1243, rating: 4.8, trend: "up"   as const },
  { name: "The Burger Lab",  revenue: "₹71,200", orders: 987,  rating: 4.6, trend: "up"   as const },
  { name: "Pizza Paradise",  revenue: "₹63,800", orders: 854,  rating: 4.5, trend: "down" as const },
  { name: "Wok & Roll",      revenue: "₹58,100", orders: 721,  rating: 4.7, trend: "up"   as const },
  { name: "Desi Dhaba",      revenue: "₹49,600", orders: 698,  rating: 4.4, trend: "down" as const },
];

const RECENT_ORDERS = [
  { id:"ORD-7821", customer:"Priya Sharma",  restaurant:"Spice Garden",    amount:"₹485", status:"Delivered" as const, time:"2m ago"  },
  { id:"ORD-7820", customer:"Rahul Verma",   restaurant:"The Burger Lab",  amount:"₹320", status:"Preparing" as const, time:"5m ago"  },
  { id:"ORD-7819", customer:"Ananya Singh",  restaurant:"Pizza Paradise",  amount:"₹670", status:"Placed"    as const, time:"8m ago"  },
  { id:"ORD-7818", customer:"Karan Mehta",   restaurant:"Wok & Roll",      amount:"₹290", status:"Delivered" as const, time:"12m ago" },
  { id:"ORD-7817", customer:"Neha Patel",    restaurant:"Desi Dhaba",      amount:"₹410", status:"Cancelled" as const, time:"15m ago" },
  { id:"ORD-7816", customer:"Arjun Kumar",   restaurant:"Spice Garden",    amount:"₹530", status:"Delivered" as const, time:"18m ago" },
];

const ORDER_STATS = [
  { label: "Delivered", value: "8,421", pct: 68, dotColor: "bg-green-500", textColor: "text-green-600" },
  { label: "Preparing", value: "342",   pct: 12, dotColor: "bg-blue-500",  textColor: "text-blue-600"  },
  { label: "Placed",    value: "128",   pct: 10, dotColor: "bg-orange-500",textColor: "text-orange-600"},
  { label: "Cancelled", value: "94",    pct: 10, dotColor: "bg-red-400",   textColor: "text-red-500"   },
];

const STATUS_CONFIG = {
  Delivered: { color: "bg-green-100 text-green-700",  icon: <CheckCircle2 size={11}/> },
  Preparing: { color: "bg-blue-100 text-blue-700",    icon: <Clock size={11}/>        },
  Placed:    { color: "bg-orange-100 text-orange-700",icon: <Package size={11}/>      },
  Cancelled: { color: "bg-red-100 text-red-700",      icon: <AlertCircle size={11}/> },
};

const NAV_ITEMS = [
  { icon: <LayoutDashboard size={17}/>, label: "Dashboard",   href: "/"          },
  { icon: <Users size={17}/>,           label: "All Users",   href: "/all-users" },
  { icon: <UtensilsCrossed size={17}/>, label: "Restaurants", href: "/restaurants"},
  { icon: <ShoppingBag size={17}/>,     label: "Orders",      href: "/orders"    },
  { icon: <TrendingUp size={17}/>,      label: "Analytics",   href: "/analytics" },
  { icon: <UserPlus size={17}/>,        label: "Invite",      href: "/invite"    },
  { icon: <Mail size={17}/>,            label: "Support",     href: "/support"   },
  { icon: <Settings size={17}/>,        label: "Settings",    href: "/settings"  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + n;
}

// ─── Sub-charts ───────────────────────────────────────────────────────────────

/** Rounded-top bar chart — pure CSS, matches Image 2 */
function BarChartView({ data }: { data: { label: string; value: number; revenue: number }[] }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 md:gap-3 h-32 px-1">
      {data.map((d) => {
        const h = Math.round((d.value / max) * 100);
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: 100 }}>
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
                {fmt(d.revenue)}
              </div>
              <div
                className="w-full max-w-[44px] transition-all duration-500"
                style={{
                  height: `${h}%`,
                  background: "linear-gradient(to top, #FF651D, #ffb347)",
                  borderRadius: "10px 10px 4px 4px",
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Pure SVG line chart */
function LineChartView({ data }: { data: { label: string; value: number; revenue: number }[] }) {
  const W = 500, H = 120, pad = 20;
  const max = Math.max(...data.map(d => d.value));
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: H - pad - ((d.value / max) * (H - pad * 2)),
    d,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 128 }}>
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF651D" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#FF651D" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#lineGrad)" />
        <path d={pathD} fill="none" stroke="#FF651D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#FF651D" />
            <circle cx={p.x} cy={p.y} r={7} fill="#FF651D" fillOpacity="0.15" />
            <text x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF" fontWeight="600">
              {p.d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/** Pure SVG pie/donut chart */
function PieChartView({ data }: { data: { label: string; value: number; revenue: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumAngle = -Math.PI / 2;
  const CX = 80, CY = 80, R = 60, r = 35;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle);
    const y1 = CY + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle);
    const y2 = CY + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const xi1 = CX + r * Math.cos(cumAngle);
    const yi1 = CY + r * Math.sin(cumAngle);
    const xi2 = CX + r * Math.cos(cumAngle - angle);
    const yi2 = CY + r * Math.sin(cumAngle - angle);
    return {
      path: `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi1},${yi1} A${r},${r},0,${large},0,${xi2},${yi2} Z`,
      color: PIE_COLORS[i % PIE_COLORS.length],
      label: d.label,
      pct: Math.round((d.value / total) * 100),
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
        ))}
        <text x={CX} y={CY - 4} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#111">
          {data.length}
        </text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="#9CA3AF">
          periods
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 font-semibold flex-1 truncate">{s.label}</span>
            <span className="text-xs font-black text-gray-900">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [activeNav, setActiveNav]       = useState("Dashboard");

  // Chart controls
  const [period, setPeriod]             = useState<Period>("week");
  const [chartType, setChartType]       = useState<ChartType>("bar");
  const [customMonth, setCustomMonth]   = useState(0);          // index into MONTHS
  const [customYear, setCustomYear]     = useState(2025);

  const adminName  = (session?.user as any)?.name  || "Admin";
  const adminEmail = (session?.user as any)?.email || "";

  // Build chart data — for "custom" we generate fake month data
  const chartData = useMemo(() => {
    if (period !== "custom") return CHART_DATA[period];
    // fake weekly breakdown for selected month
    return [
      { label: "W1", value: 55 + customMonth * 2,  revenue: (440 + customMonth * 16) * 1000 },
      { label: "W2", value: 70 + customMonth * 2,  revenue: (560 + customMonth * 16) * 1000 },
      { label: "W3", value: 80 + customMonth * 2,  revenue: (640 + customMonth * 16) * 1000 },
      { label: "W4", value: 100,                    revenue: (800 + customMonth * 16) * 1000 },
    ];
  }, [period, customMonth, customYear]);

  const periodLabel =
    period === "week"   ? "This week vs last week" :
    period === "month"  ? "This month vs last month" :
    period === "year"   ? "This year vs last year" :
    `${MONTHS[customMonth]} ${customYear}`;

  const PERIOD_TABS: { key: Period; label: string }[] = [
    { key: "week",   label: "Week"  },
    { key: "month",  label: "Month" },
    { key: "year",   label: "Year"  },
    { key: "custom", label: "Custom"},
  ];

  const CHART_TABS: { key: ChartType; icon: React.ReactNode; label: string }[] = [
    { key: "bar",  icon: <BarChart2 size={14}/>,  label: "Bar"  },
    { key: "line", icon: <LineChart size={14}/>,  label: "Line" },
    { key: "pie",  icon: <PieChart size={14}/>,   label: "Pie"  },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <>
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 z-40 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex
        `}>
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FF651D] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">B</span>
              </div>
              <div>
                <p className="font-black text-gray-900 text-sm leading-none">BiteGo</p>
                <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Admin</p>
              </div>
            </div>
            <button className="md:hidden text-gray-400" onClick={() => setSidebarOpen(false)}><X size={18}/></button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => { setActiveNav(item.label); router.push(item.href); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeNav === item.label
                    ? "bg-[#FF651D] text-white shadow-sm shadow-orange-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </nav>

          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{adminName}</p>
                <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-gray-300 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={15}/>
              </button>
            </div>
          </div>
        </aside>
      </>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-500" onClick={() => setSidebarOpen(true)}><Menu size={22}/></button>
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input placeholder="Search orders, users..." className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-orange-300 focus:bg-white transition-all w-56"/>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-50 text-gray-500">
              <Bell size={18}/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF651D] rounded-full"/>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-xs">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 px-4 md:px-8 py-6 space-y-6 overflow-auto">

          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">Welcome back, {adminName.split(" ")[0]} 👋</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Clock size={13}/> Last updated: just now
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {STAT_CARDS.map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>{card.icon}</div>
                <p className="text-xs text-gray-400 font-semibold mb-1">{card.label}</p>
                <p className="text-xl font-black text-gray-900 leading-none">{card.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${card.change >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {card.change >= 0 ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                  {Math.abs(card.change)}% this month
                </div>
              </div>
            ))}
          </div>

          {/* ── Revenue Chart ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">

              {/* Chart header */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-black text-gray-900 text-base">Revenue Overview</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
                  <ArrowUpRight size={13}/> +12.4%
                </div>
              </div>

              {/* ── Period slide tabs ── */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl mb-4 w-fit">
                {PERIOD_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setPeriod(t.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      period === t.key
                        ? "bg-[#FF651D] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Custom month/year picker */}
              {period === "custom" && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <select
                    value={customMonth}
                    onChange={(e) => setCustomMonth(Number(e.target.value))}
                    className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 bg-white"
                  >
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select
                    value={customYear}
                    onChange={(e) => setCustomYear(Number(e.target.value))}
                    className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 bg-white"
                  >
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}

              {/* ── Chart type toggle ── */}
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl mb-5 w-fit">
                {CHART_TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setChartType(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      chartType === t.key
                        ? "bg-white text-gray-900 shadow-sm border border-gray-100"
                        : "text-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {t.icon}{t.label}
                  </button>
                ))}
              </div>

              {/* ── Chart area ── */}
              <div className="min-h-[130px]">
                {chartType === "bar"  && <BarChartView  data={chartData} />}
                {chartType === "line" && <LineChartView data={chartData} />}
                {chartType === "pie"  && <PieChartView  data={chartData} />}
              </div>

              {/* Order status summary */}
              <div className="mt-6 pt-5 border-t border-gray-50 grid grid-cols-4 gap-3">
                {ORDER_STATS.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className={`w-2 h-2 ${s.dotColor} rounded-full mx-auto mb-1.5`}/>
                    <p className="text-sm font-black text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Restaurants */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-gray-900 text-base">Top Restaurants</h2>
                <button onClick={() => router.push("/restaurants")} className="text-xs font-bold text-[#FF651D] hover:underline">See all</button>
              </div>
              <div className="space-y-4">
                {TOP_RESTAURANTS.map((r, i) => (
                  <div key={r.name} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 shrink-0">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star size={10} className="text-yellow-400 fill-yellow-400"/>
                        <span className="text-[10px] text-gray-400">{r.rating} · {r.orders} orders</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-900">{r.revenue}</p>
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] font-bold ${r.trend === "up" ? "text-green-500" : "text-red-400"}`}>
                        {r.trend === "up" ? <ChevronUp size={11}/> : <ChevronDown size={11}/>}
                        {r.trend === "up" ? "Up" : "Down"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Recent Orders + Actions ────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-gray-900 text-base">Recent Orders</h2>
                <button onClick={() => router.push("/orders")} className="text-xs font-bold text-[#FF651D] hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-50">
                {RECENT_ORDERS.map((order) => {
                  const s = STATUS_CONFIG[order.status];
                  return (
                    <div key={order.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <ShoppingBag size={14} className="text-orange-500"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">{order.customer}</p>
                          <span className="text-[10px] text-gray-400">{order.id}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{order.restaurant}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-gray-900">{order.amount}</p>
                        <p className="text-[10px] text-gray-400">{order.time}</p>
                      </div>
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${s.color}`}>
                        {s.icon}{order.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-black text-gray-900 text-base mb-4">Quick Actions</h2>
                <div className="space-y-2.5">
                  {[
                    { label:"Invite New Member", icon:<UserPlus size={15}/>,  href:"/invite",     color:"bg-orange-50 text-orange-600 hover:bg-orange-100" },
                    { label:"View All Users",    icon:<Users size={15}/>,     href:"/all-users",  color:"bg-blue-50 text-blue-600 hover:bg-blue-100"       },
                    { label:"Support Tickets",   icon:<Mail size={15}/>,      href:"/support",    color:"bg-purple-50 text-purple-600 hover:bg-purple-100" },
                    { label:"Platform Settings", icon:<Settings size={15}/>,  href:"/settings",   color:"bg-gray-50 text-gray-600 hover:bg-gray-100"       },
                  ].map((a) => (
                    <button key={a.label} onClick={() => router.push(a.href)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${a.color}`}>
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h2 className="font-black text-gray-900 text-base mb-4">Platform Health</h2>
                <div className="space-y-3">
                  {[
                    { label:"Auth Service",     status: true  },
                    { label:"Order Service",    status: true  },
                    { label:"Mailer Service",   status: true  },
                    { label:"Delivery Service", status: false },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-semibold">{s.label}</span>
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.status ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status ? "bg-green-500" : "bg-red-500"}`}/>
                        {s.status ? "Online" : "Down"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}