// src/components/DashboardWidgets.tsx
"use client";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Star, ShoppingBag, CheckCircle2, Clock, Package, AlertCircle, UserPlus, Users, Mail, Settings, DollarSign, Bike, UtensilsCrossed } from "lucide-react";
import { STAT_CARDS, TOP_RESTAURANTS, RECENT_ORDERS } from "../../lib/data";

const STATUS_CONFIG = {
  Delivered: { color: "bg-green-100 text-green-700",  icon: <CheckCircle2 size={11}/> },
  Preparing: { color: "bg-blue-100 text-blue-700",    icon: <Clock size={11}/>        },
  Placed:    { color: "bg-orange-100 text-orange-700",icon: <Package size={11}/>      },
  Cancelled: { color: "bg-red-100 text-red-700",      icon: <AlertCircle size={11}/> },
};

const ICONS_MAP = {
  DollarSign: <DollarSign size={20}/>, ShoppingBag: <ShoppingBag size={20}/>, Users: <Users size={20}/>,
  UtensilsCrossed: <UtensilsCrossed size={20}/>, Star: <Star size={20}/>, Bike: <Bike size={20}/>
};

export function StatCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {STAT_CARDS.map((card, i) => (
        <div key={card.label} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
          <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3`}>
            {Object.values(ICONS_MAP)[i]}
          </div>
          <p className="text-xs text-gray-400 font-semibold mb-1">{card.label}</p>
          <p className="text-xl font-black text-gray-900 leading-none">{card.value}</p>
          <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${card.change >= 0 ? "text-green-600" : "text-red-500"}`}>
            {card.change >= 0 ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            {Math.abs(card.change)}% this month
          </div>
        </div>
      ))}
    </div>
  );
}

export function TopRestaurants() {
  const router = useRouter();
  return (
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
  );
}

export function RecentOrders() {
  const router = useRouter();
  return (
    <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 className="font-black text-gray-900 text-base">Recent Orders</h2>
        <button onClick={() => router.push("/orders")} className="text-xs font-bold text-[#FF651D] hover:underline">View all</button>
      </div>
      <div className="divide-y divide-gray-50">
        {RECENT_ORDERS.map((order) => {
          const s = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
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
  );
}

export function QuickActions() {
  const router = useRouter();
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <h2 className="font-black text-gray-900 text-base mb-4">Quick Actions</h2>
      <div className="space-y-2.5">
        {[
          { label:"Invite New Member", icon:<UserPlus size={15}/>,  href:"/invite",     color:"bg-orange-50 text-orange-600 hover:bg-orange-100" },
          { label:"View All Users",    icon:<Users size={15}/>,     href:"/all-users",  color:"bg-blue-50 text-blue-600 hover:bg-blue-100"       },
          { label:"Support Tickets",   icon:<Mail size={15}/>,      href:"/support",    color:"bg-purple-50 text-purple-600 hover:bg-purple-100" },
          { label:"Platform Settings", icon:<Settings size={15}/>,  href:"/settings",   color:"bg-gray-50 text-gray-600 hover:bg-gray-100"       },
        ].map((a) => (
          <button key={a.label} onClick={() => router.push(a.href)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${a.color}`}>
            {a.icon}{a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PlatformHealth() {
  return (
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
  );
}