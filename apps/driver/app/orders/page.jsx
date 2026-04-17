"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost";

export default function DriverOrdersPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const userId = session?.user?.id;
  const token = session?.user?.accessToken;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/svc/delivery/driver/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, token]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] text-white p-4">

      {/* HEADER */}
      <h1 className="text-2xl font-black mb-6">
        Active Orders 🚚
      </h1>

      {orders.length === 0 && (
        <p className="text-gray-400 text-center mt-20">
          No active orders
        </p>
      )}

      {/* ORDER LIST */}
      <div className="space-y-4">

        {orders.map((order) => (
          <div
            key={order.OrderID}
            onClick={() => router.push(`/orders/${order.OrderID}`)}
            className="bg-[#1a1c23] p-4 rounded-2xl border border-white/10 cursor-pointer hover:bg-[#22242c] transition"
          >
            {/* TOP */}
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold">
                Order #{order.OrderID.slice(-6)}
              </p>

              <span className={`text-xs px-2 py-1 rounded-lg ${
                order.OrderStatus === "Preparing"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}>
                {order.OrderStatus}
              </span>
            </div>

            {/* ADDRESS */}
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <MapPin size={14} />
              {order.address?.AddressLine || "No address"}
            </div>

            {/* BOTTOM */}
            <div className="flex justify-between mt-3 text-sm">
              <span>₹ {order.TotalAmount}</span>
              <span className="text-orange-400 font-bold">
                Open →
              </span>
            </div>
          </div>
        ))}

      </div>
    </main>
  );
}