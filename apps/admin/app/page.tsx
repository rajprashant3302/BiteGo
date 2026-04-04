<<<<<<< HEAD
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRegister() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role: "SuperAdmin", // 🔒 force admin role
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage("✅ Admin registered successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: any) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Registration
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Register Admin"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
=======
"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Clock } from "lucide-react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import RevenueOverview from "@/components/dashboard/RevenueOverview";
import { StatCards, TopRestaurants, RecentOrders, QuickActions, PlatformHealth } from "@/components/dashboard/DashboardWidgets";

export default function AdminDashboard() {
  const { data: session } = useSession();
  
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeNav, setActiveNav] = useState<string>("Dashboard");

  const adminName: string = session?.user?.name || "Admin";
  const adminEmail: string = session?.user?.email || "";

  return (
    /* h-screen prevents the whole page from scrolling; overflow-hidden keeps it contained */
    <div className="h-screen bg-gray-50 font-sans flex text-gray-900 overflow-hidden">
      
      {/* SIDEBAR: 
          Now passes sidebarOpen/setSidebarOpen to handle mobile hamburger logic.
          In your Sidebar.tsx, ensure the aside has 'h-full overflow-y-auto'.
      */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activeNav={activeNav} 
        setActiveNav={setActiveNav} 
        adminName={adminName} 
        adminEmail={adminEmail} 
      />

      {/* MAIN CONTENT AREA: flex-col ensures header stays top, main takes rest */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* HEADER: Contains the hamburger button for mobile (md:hidden) */}
        <Header setSidebarOpen={setSidebarOpen} adminName={adminName} />

        {/* MAIN SCROLL AREA: 
            'flex-1' fills the height, 'overflow-y-auto' allows this section 
            to scroll independently of the sidebar.
        */}
        <main className="flex-1 px-4 md:px-8 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard</h1>
              <p className="text-sm text-gray-400 mt-0.5">Welcome back, {adminName.split(" ")[0]} 👋</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Clock size={13}/> Last updated: just now
            </div>
          </div>

          {/* Widgets Grid */}
          <StatCards />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <RevenueOverview />
            <TopRestaurants />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <RecentOrders />
            <div className="space-y-3">
              <QuickActions />
              <PlatformHealth />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
>>>>>>> origin/main
