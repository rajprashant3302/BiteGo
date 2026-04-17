"use client";

import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import DriverSidebar from "@/components/DriverSidebar";
import DriverNavbar from "@/components/DriverNavbar";
import IncomingOrderModal from "@/components/IncomingOrderModal";
import OrderScanning from "@/components/OrderScanning";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost";

export default function DriverDashboard() {

  const { data: session } = useSession();
  const driverId = session?.user?.id;

  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  const [isOnline, setIsOnline] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState(null);

  const activeOrderRef = useRef(null);

  // ✅ SOCKET
  useEffect(() => {
    if (!driverId) return;

    const s = io(BACKEND_URL, {
      autoConnect: false,
      path: "/svc/delivery/socket.io"
    });

    s.on("connect", () => {
      s.emit("driver_online", { driverId });
    });

    s.on("new_delivery_request", (data) => {
      if (!activeOrderRef.current) {
        setIncomingOrder(data);
      }
    });

    s.on("assignment_success", ({ orderId }) => {
      router.push(`/order/${orderId}`);
    });

    setSocket(s);
    return () => s.disconnect();

  }, [driverId]);

  // ✅ ONLINE TOGGLE
  const toggleOnline = () => {
    if (!socket) return;

    if (!isOnline) {
      socket.connect();
      setIsOnline(true);
    } else {
      socket.disconnect();
      setIsOnline(false);
      setIncomingOrder(null);
    }
  };

  // ✅ ACCEPT ORDER
  const handleAccept = () => {
    socket.emit("accept_order", {
      orderId: incomingOrder.orderId,
      driverId
    });
  };

  return (
    <div className="h-screen flex flex-col">

      {/* NAVBAR */}
      <DriverNavbar
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
  isOnline={isOnline}
  toggleOnline={toggleOnline}
  isSearching={isOnline && !incomingOrder}
/>

      <div className="flex flex-1">

        <DriverSidebar
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
/>

        {/* BODY */}
        <main className="flex-1 p-6 bg-gray-50">

          {!isOnline && (
            <div className="text-center mt-20">
              <h2 className="text-xl font-bold">You are offline</h2>
            </div>
          )}

          {/* {isOnline && !incomingOrder && (
            <div className="text-center mt-20">
              <h2 className="text-xl font-bold">
                Searching for orders...
              </h2>
            </div>
          )} */}

          {isOnline && !incomingOrder && <OrderScanning />}

        </main>

      </div>

      {/* MODAL */}
      <IncomingOrderModal
        order={incomingOrder}
        onAccept={handleAccept}
        onDecline={() => setIncomingOrder(null)}
      />

    </div>
  );
}