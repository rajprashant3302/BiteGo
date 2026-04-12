"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowUpRight, BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";

export interface ChartDataPoint {
  label: string;
  isLabelVisible: boolean;
  tooltipLabel?: string;
  value: number;
  revenue: number;
}

export function fmt(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000)   return "₹" + (n / 1000).toFixed(0) + "K";
  return "₹" + n;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const YEARS  = [2021,2022, 2023, 2024, 2025, 2026];
const PIE_COLORS = ["#FF651D", "#3B82F6", "#10B981", "#A855F7", "#F59E0B", "#EC4899"];

type Period = "week" | "month" | "year" | "custom";

interface ChartViewProps {
  data: ChartDataPoint[];
}

interface PieChartViewProps extends ChartViewProps {
  period: Period; 
}

// --- Chart Visual Components (Unchanged, they were perfect) ---
function BarChartView({ data }: ChartViewProps) {
  const max = Math.max(...data.map(d => d.value), 1);
  const isDense = data.length > 10;
  const isSuperDense = data.length > 50;
  const gapClass = isSuperDense ? "gap-0" : isDense ? "gap-[2px] md:gap-1" : "gap-2 md:gap-3";
  const borderRadius = isSuperDense ? "1px 1px 0 0" : "10px 10px 4px 4px";

  return (
    <div className={`flex items-end ${gapClass} h-32 px-1`}>
      {data.map((d, i) => {
        const h = Math.max(Math.round((d.value / max) * 100), 2);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 md:gap-2 group">
            <div className="relative w-full flex items-end justify-center" style={{ height: 100 }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
                <span className="text-gray-300 font-medium text-[8px] leading-none mb-0.5">{d.tooltipLabel || d.label}</span>
                <span>{fmt(d.revenue)}</span>
              </div>
              <div className="w-full max-w-[44px] transition-all duration-500 hover:brightness-110" style={{ height: `${h}%`, background: "linear-gradient(to top, #FF651D, #ffb347)", borderRadius }} />
            </div>
            <div className="h-4 flex items-center justify-center">
              {d.isLabelVisible && <span className="text-[10px] text-gray-400 font-semibold">{d.label}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineChartView({ data }: ChartViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const W = 500, H = 120, pad = 20;
  const max = Math.max(...data.map(d => d.value), 1);
  const isSuperDense = data.length > 50;
  const isDense = data.length > 10;

  const pts = data.map((d, i) => ({ x: pad + (i / (data.length - 1 || 1)) * (W - pad * 2), y: H - pad - ((d.value / max) * (H - pad * 2)), d }));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const fillD = `${pathD} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;

  return (
    <div className="relative w-full overflow-visible" style={{ height: 128 }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF651D" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#FF651D" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#lineGrad)" />
        <path d={pathD} fill="none" stroke="#FF651D" strokeWidth={isSuperDense ? "1.5" : "2.5"} strokeLinecap="round" strokeLinejoin="round"/>
        {pts.map((p, i) => (
          <g key={i}>
            {!isSuperDense && <circle cx={p.x} cy={p.y} r={isDense ? 2 : 4} fill="#FF651D" />}
            {p.d.isLabelVisible && <text x={p.x} y={H - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF" fontWeight="600">{p.d.label}</text>}
          </g>
        ))}
      </svg>
      {pts.map((p, i) => (
        <div key={i} className="absolute top-0 bottom-0 z-10 cursor-crosshair" style={{ left: `${(p.x / W) * 100}%`, width: `${100 / pts.length}%`, transform: 'translateX(-50%)' }} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
          {hoveredIdx === i && (
            <>
              <div className="absolute w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm pointer-events-none" style={{ top: `${(p.y / H) * 100}%`, left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div className="absolute bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-20 flex flex-col items-center pointer-events-none shadow-lg" style={{ bottom: `${100 - (p.y / H) * 100}%`, left: '50%', transform: 'translate(-50%, -10px)' }}>
                <span className="text-gray-300 font-medium text-[8px] leading-none mb-0.5">{p.d.tooltipLabel || p.d.label}</span>
                <span>{fmt(p.d.revenue)}</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function PieChartView({ data, period }: PieChartViewProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  let pieData: ChartDataPoint[] = [];
  
  if (period === 'month' || period === 'custom') {
    pieData = [
      { label: "Week 1", value: 0, revenue: 0, isLabelVisible: true }, 
      { label: "Week 2", value: 0, revenue: 0, isLabelVisible: true }, 
      { label: "Week 3", value: 0, revenue: 0, isLabelVisible: true }, 
      { label: "Week 4", value: 0, revenue: 0, isLabelVisible: true }
    ];
    data.forEach((d, i) => { 
      const w = Math.min(Math.floor(i / (data.length / 4)), 3); 
      pieData[w].value += d.value; 
      pieData[w].revenue += d.revenue; 
    });
  } else {
    pieData = data.map(d => ({ ...d }));
  }

  const total = pieData.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -Math.PI / 2;
  const CX = 80, CY = 80, R = 60, r = 35;

  const slices = pieData.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = CX + R * Math.cos(cumAngle), y1 = CY + R * Math.sin(cumAngle);
    const midAngle = cumAngle + angle / 2;
    const tipX = CX + (R + 15) * Math.cos(midAngle), tipY = CY + (R + 15) * Math.sin(midAngle);
    cumAngle += angle;
    const x2 = CX + R * Math.cos(cumAngle), y2 = CY + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const xi1 = CX + r * Math.cos(cumAngle - angle), yi1 = CY + r * Math.sin(cumAngle - angle);
    const xi2 = CX + r * Math.cos(cumAngle), yi2 = CY + r * Math.sin(cumAngle);
    return { path: `M${x1},${y1} A${R},${R},0,${large},1,${x2},${y2} L${xi2},${yi2} A${r},${r},0,${large},0,${xi1},${yi1} Z`, color: PIE_COLORS[i % PIE_COLORS.length], label: d.label, pct: Math.round((d.value / total) * 100), tipX, tipY };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center">
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full relative z-0">
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} className="transition-all duration-300 cursor-pointer hover:opacity-80" onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)} />)}
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#111">{pieData.length}</text>
          <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="#9CA3AF">segments</text>
        </svg>
        {hoveredIdx !== null && (
          <div className="absolute bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-20 flex flex-col items-center pointer-events-none shadow-lg transition-all duration-200" style={{ left: `${(slices[hoveredIdx].tipX / 160) * 100}%`, top: `${(slices[hoveredIdx].tipY / 160) * 100}%`, transform: 'translate(-50%, -50%)' }}>
            <span className="text-gray-300 font-medium text-[8px] leading-none mb-0.5">{slices[hoveredIdx].label}</span>
            <span>{fmt(pieData[hoveredIdx].revenue)}</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 flex-1 w-full mt-4 sm:mt-0">
        {slices.map((s, i) => (
          <div key={i} className={`flex items-center gap-1.5 transition-opacity duration-200 ${hoveredIdx !== null && hoveredIdx !== i ? 'opacity-40' : 'opacity-100'}`}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 font-semibold truncate">{s.label}</span>
            <span className="text-[10px] sm:text-xs font-black text-gray-900 ml-auto">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 5. Main Component ---
export default function RevenueOverview() {
  const [period, setPeriod] = useState<Period>("month");
  const [chartType, setChartType] = useState("bar");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth()); 
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  
  // LIVE API STATE
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [orderCounts, setOrderCounts] = useState({ Delivered: 0, Preparing: 0, Placed: 0, Cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  // --- FETCH REAL DATA WHEN PERIOD CHANGES ---
  useEffect(() => {
    const fetchStats = async () => {
      const token = (session?.user as any)?.accessToken;
      if (!token) return;

      setLoading(true);
      try {
        const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/users/dashboard/stats?period=${period}&month=${customMonth}&year=${customYear}`;
        
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        
        if (json.success) {
          // The backend now formats the data perfectly, so we just set it directly!
          setChartData(json.data.chartData);
          setOrderCounts(json.data.orderCounts);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period, customMonth, customYear, session]);

  // --- DYNAMIC ORDER STATS ---
  const liveOrderStats = [
    { label: "Delivered", value: orderCounts.Delivered, dotColor: "bg-emerald-500" },
    { label: "Preparing", value: orderCounts.Preparing, dotColor: "bg-blue-500" },
    { label: "Placed", value: orderCounts.Placed, dotColor: "bg-orange-500" },
    { label: "Cancelled", value: orderCounts.Cancelled, dotColor: "bg-red-500" },
  ];

  const periodLabel = period === "week" ? "Daily breakdown (This week)" : period === "month" ? "Daily breakdown (This month)" : period === "year" ? "Month-wise breakdown (This year)" : `Daily breakdown for ${MONTHS[customMonth]} ${customYear}`;

  return (
    <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="font-black text-gray-900 text-base">Revenue Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl">
          <ArrowUpRight size={13}/> Active
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-fit">
          {(["week", "month", "year", "custom"] as Period[]).map((p) => (
            <button 
              key={p} 
              onClick={() => setPeriod(p)} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${period === p ? "bg-[#FF651D] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-fit">
          {[{ key: "bar", icon: <BarChart2 size={14}/>, label: "Bar"}, { key: "line", icon: <LineChartIcon size={14}/>, label: "Line"}, { key: "pie", icon: <PieChartIcon size={14}/>, label: "Pie"}].map((t) => (
            <button key={t.key} onClick={() => setChartType(t.key)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartType === t.key ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-700"}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {period === "custom" && (
        <div className="flex items-center text-black gap-2 mb-4 flex-wrap">
          <select value={customMonth} onChange={(e) => setCustomMonth(Number(e.target.value))} className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 bg-white">
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select value={customYear} onChange={(e) => setCustomYear(Number(e.target.value))} className="text-xs font-semibold border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-400 bg-white">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Dynamic Chart Rendering */}
      <div className="flex-1 min-h-[160px] flex flex-col justify-end mt-4">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-medium animate-pulse">Loading live data...</div>
        ) : (
          <>
            {chartType === "bar"  && <BarChartView  data={chartData} />}
            {chartType === "line" && <LineChartView data={chartData} />}
            {chartType === "pie"  && <PieChartView  data={chartData} period={period} />}
          </>
        )}
      </div>

      {/* Live Status Dots */}
      <div className="mt-auto pt-6 border-t border-gray-50 grid grid-cols-4 gap-3">
        {liveOrderStats.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`w-2 h-2 ${s.dotColor} rounded-full mx-auto mb-1.5`}/>
            <p className="text-sm md:text-lg font-black text-gray-900">{loading ? "-" : s.value}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


