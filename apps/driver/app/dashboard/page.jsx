'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Package, CheckCircle, XCircle, Clock, Power, Loader2, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

import dynamic from 'next/dynamic';

const DriverMap = dynamic(() => import('@/components/DriverMap'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-[#0d0f14] flex items-center justify-center text-slate-500 font-bold">Initializing Map...</div> 
});

const DELIVERY_SOCKET_URL = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || "http://localhost:5004";
const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost";

// ── OTP Component ──
function OtpInput({ onVerify, correctOtp }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError(false);
    if (val && idx < 3) refs[idx + 1].current?.focus();
  };

  const handleVerify = () => {
    if (digits.join("") === correctOtp) {
      onVerify();
    } else {
      setError(true);
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    }
  };

  return (
    <div className="text-center">
      <div className="flex gap-3 justify-center mb-4">
        {digits.map((d, i) => (
          <input
            key={i} ref={refs[i]} type="tel" maxLength={1} value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            className={`w-14 h-16 rounded-2xl border-2 bg-white/5 text-white text-2xl font-bold text-center outline-none transition-all ${
              error ? 'border-red-500' : d ? 'border-orange-500' : 'border-white/10'
            }`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 text-xs font-bold mb-3">❌ Incorrect OTP</p>}
      <button onClick={handleVerify} disabled={digits.join("").length < 4} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold disabled:opacity-50">
        Verify OTP
      </button>
    </div>
  );
}

// ── Main Dashboard ──
export default function DriverDashboard() {
  const { data: session, status } = useSession();
  const driverId = session?.user?.id;

  const [socket, setSocket] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingOrder, setIncomingOrder] = useState(null);
  
  const [activeOrder, setActiveOrder] = useState(null); 
  const [orderDetails, setOrderDetails] = useState(null); 
  
  // Tracking
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distRemKm, setDistRemKm] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  
  // UI
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);

  const activeOrderRef = useRef(null);
  const locationWatchId = useRef(null);

  useEffect(() => { activeOrderRef.current = activeOrder; }, [activeOrder]);

  // ── GPS HELPERS (Wrapped in useCallback to prevent stale closures) ──
  const startLocationTracking = useCallback(() => {
    if ("geolocation" in navigator) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast.error("Allow GPS!"),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
  }, []);

  // ── 🔥 1. HYDRATE STATE FROM LOCAL STORAGE ON MOUNT ──
  useEffect(() => {
    if (!driverId) return;

    // Check if they accidentally refreshed while online or on an order
    const savedOnline = localStorage.getItem("bitego_driver_online") === "true";
    const savedOrder = localStorage.getItem("bitego_active_order");

    if (savedOrder) {
      setActiveOrder(JSON.parse(savedOrder));
    }

    if (savedOnline) {
      setIsOnline(true);
      startLocationTracking();
    }
  }, [driverId, startLocationTracking]);


  // ── 2. INITIALIZE SOCKETS ──
  useEffect(() => {
    if (!driverId) return;

    const savedOnline = localStorage.getItem("bitego_driver_online") === "true";
    
    // Auto-connect if they were already online before refreshing!
    const newSocket = io(BACKEND_URL, { 
      autoConnect: savedOnline, 
      transports: ['websocket', 'polling'],
      
      // 🚀 Added Connection Resilience Settings
      path: '/svc/delivery/socket.io', // Ensure backend is configured to use this path!
      auth: { token: session?.accessToken || driverId }, 
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    newSocket.on("connect", () => {
      console.log("🟢 Connected to Delivery Socket");
      if (savedOnline) {
         newSocket.emit("driver_online", { driverId });
      }
    });

    newSocket.on("new_delivery_request", (data) => { if (!activeOrderRef.current) setIncomingOrder(data); });
    newSocket.on("order_taken", ({ orderId }) => setIncomingOrder(prev => prev?.orderId === orderId ? null : prev));
    
    // Accept Order (Save to LocalStorage!)
    newSocket.on("assignment_success", ({ orderId }) => {
      toast.success("Order Assigned!");
      setIncomingOrder(null);
      const newActiveOrder = { orderId, status: 'Preparing' };
      setActiveOrder(newActiveOrder);
      localStorage.setItem("bitego_active_order", JSON.stringify(newActiveOrder)); // 🔥 PERSIST
      setIsDelivered(false);
    });

    // Auto-Assign (Save to LocalStorage!)
    newSocket.on("forced_assignment", ({ orderId }) => {
      const newActiveOrder = { orderId, status: 'Preparing' };
      setActiveOrder(newActiveOrder);
      localStorage.setItem("bitego_active_order", JSON.stringify(newActiveOrder)); // 🔥 PERSIST
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [driverId]);

  // ── 3. FETCH ORDER DATA (Triggered automatically when activeOrder is set/restored) ──
  useEffect(() => {
    if (!activeOrder?.orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${ORDER_SERVICE_URL}/api/orders/${activeOrder.orderId}`);
        const data = await res.json();
        if (res.ok) setOrderDetails(data);
      } catch (err) { console.error(err); }
    };
    fetchOrder();
  }, [activeOrder?.orderId]);

  // ── 4. ONLINE/GPS TOGGLE ──
  const toggleOnlineStatus = () => {
    if (!driverId) return;

    if (!isOnline && socket) {
      socket.connect(); 
      socket.emit("driver_online", { driverId });
      setIsOnline(true);
      localStorage.setItem("bitego_driver_online", "true"); // 🔥 PERSIST
      startLocationTracking();
    } else if (isOnline && socket) {
      socket.emit("driver_offline", { driverId });
      socket.disconnect(); 
      setIsOnline(false);
      localStorage.removeItem("bitego_driver_online"); // 🔥 REMOVE
      setIncomingOrder(null);
      stopLocationTracking();
    }
  };

  // ── 5. WEBSOCKET LOCATION BROADCAST ──
  useEffect(() => {
    if (activeOrder && currentLocation && socket) {
      socket.emit("driver_location_update", {
        orderId: activeOrder.orderId,
        driverId: driverId, 
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
    }
  }, [activeOrder, currentLocation, socket, driverId]);

  // ── 6. ACTIONS ──
  const handleAcceptOrder = () => {
    if (!incomingOrder || !socket) return;
    socket.emit("accept_order", { orderId: incomingOrder.orderId, driverId });
  };

  const updateStatus = async (newStatus) => {
    try {
        // 🔥 Grab the token from the session
        const token = session?.user?.accessToken;
        console.log(`Updating status to ${newStatus} for Order ${activeOrder.orderId} with token:`, token);

        const response = await fetch(`${BACKEND_URL}/svc/delivery/driver/${driverId}/orders/${activeOrder.orderId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
        }
        
        const updated = { ...activeOrder, status: newStatus };
        setActiveOrder(updated);
        localStorage.setItem("bitego_active_order", JSON.stringify(updated));
        
    } catch (error) {
        console.error("Status update failed:", error);
        toast.error("Failed to update status. Check console.");
        throw error;
    }
  };

const handleOtpVerified = async () => {
    try {
        // 1. Await the backend update to ensure network connection is alive
        await updateStatus('Delivered');
        
        // 2. Update UI
        setIsDelivered(true);
        setShowOtpPanel(false);
        toast.success("Successfully Delivered!");
        
        // 3. WIPE LOCAL STORAGE & COOKIES
        localStorage.removeItem("bitego_active_order"); 
        document.cookie = "bitego_active_order=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        
        // 4. Reset UI after a delay
        setTimeout(() => {
            setActiveOrder(null);
            setOrderDetails(null);
            setIsDelivered(false);
        }, 5000);

    } catch (error) {
        toast.error("Network error! Please try again.");
    }
  };

  if (status === "loading") return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;

  return (
    <main className="min-h-screen bg-[#0d0f14] font-sans relative overflow-hidden text-slate-100">
      
      {/* ── MAP CONTAINER ── */}
      <div className="absolute inset-0 z-0">
        {activeOrder && orderDetails?.restaurant?.Longitude && orderDetails?.address?.Longitude ? (
          <DriverMap 
            restaurantLoc={{ lat: parseFloat(orderDetails.restaurant.Latitude), lng: parseFloat(orderDetails.restaurant.Longitude) }}
            userLoc={{ lat: parseFloat(orderDetails.address.Latitude), lng: parseFloat(orderDetails.address.Longitude) }}
            currentDriverLoc={currentLocation}
            orderStatus={activeOrder.status}
            onDistanceUpdate={(km, min) => { setDistRemKm(km); setEtaMin(min); }}
          />
        ) : (
          <div className="w-full h-full bg-[#12141c] flex items-center justify-center opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        )}
      </div>

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 flex flex-col">
            <span className="font-black text-white">BiteGo</span>
            <span className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Partner Mode</span>
        </div>
        <button onClick={toggleOnlineStatus} className={`pointer-events-auto px-5 py-3 rounded-full font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg ${isOnline ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <Power size={16} /> {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* ── OFFLINE / FINDING ORDERS UI ── */}
      {!activeOrder && (
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
          {!isOnline ? (
             <div className="text-center bg-black/50 p-8 rounded-3xl backdrop-blur-md border border-white/5">
               <Power size={40} className="text-slate-500 mx-auto mb-4" />
               <h2 className="text-2xl font-black">You're Offline</h2>
             </div>
          ) : (
             <div className="text-center bg-black/50 p-8 rounded-3xl backdrop-blur-md border border-white/5">
               <Loader2 size={40} className="animate-spin text-green-500 mx-auto mb-4" />
               <h2 className="text-2xl font-black">Finding Orders...</h2>
             </div>
          )}
        </div>
      )}

      {/* ── ACTIVE ORDER BOTTOM SHEET ── */}
      <AnimatePresence>
        {activeOrder && orderDetails && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-[#12141c]/95 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-white/10"
          >
            <div onClick={() => setDetailsOpen(!detailsOpen)} className="w-full flex justify-center py-4 cursor-pointer">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            <div className={`px-6 pb-8 transition-all duration-300 overflow-hidden ${detailsOpen ? 'max-h-[600px]' : 'max-h-[250px]'}`}>
              {/* Order summary header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-xl">🍴</div>
                  <div>
                    <h3 className="font-bold text-lg">{orderDetails.restaurant.Name}</h3>
                    <p className="text-xs text-slate-400">{orderDetails.items.length} items • ₹{orderDetails.TotalAmount}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${activeOrder.status === 'Preparing' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {activeOrder.status === 'Preparing' ? 'Navigating to Restaurant' : 'Out for Delivery'}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6">
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">📍 Drop Address</p>
                <p className="text-sm text-slate-200">{orderDetails.address.AddressLine}</p>
              </div>

              {/* Expanded details */}
              {detailsOpen && (
                <div className="mb-6 space-y-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Order Items</p>
                  {orderDetails.items.map(item => (
                     <div key={item.OrderItemID} className="flex justify-between text-sm">
                       <span className="text-slate-300"><span className="text-orange-400 font-bold">x{item.Quantity}</span> {item.item.ItemName}</span>
                     </div>
                  ))}
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl mt-4 border border-white/5">
                     <span className="text-sm font-bold">{orderDetails.user?.Name || 'Customer'}</span>
                     <a href={`tel:${orderDetails.user?.Phone}`} className="text-green-400 bg-green-400/10 p-2 rounded-full"><Phone size={16}/></a>
                  </div>
                </div>
              )}

              {/* ── PHASE 1: PREPARING (Navigating to Restaurant) ── */}
              {activeOrder.status === 'Preparing' && (
                <div className="flex gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 flex flex-col justify-center items-center w-1/3">
                    <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">ETA to Rest.</span>
                    <span className="font-black text-blue-400 text-xl">{etaMin}m</span>
                  </div>
                  <button onClick={() => updateStatus('PickedUp')} className="flex-1 bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)]">
                    Confirm Pickup
                  </button>
                </div>
              )}

              {/* ── PHASE 2: PICKED UP (Navigating to User) ── */}
              {activeOrder.status === 'PickedUp' && !isDelivered && (
                <div className="flex gap-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex flex-col justify-center items-center w-1/3">
                    <span className="text-[10px] text-orange-400 uppercase font-bold tracking-widest">ETA to User</span>
                    <span className="font-black text-orange-500 text-xl">{etaMin}m</span>
                  </div>
                  <button onClick={() => setShowOtpPanel(true)} className="flex-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(255,183,0,0.4)]">
                    I've Arrived (Enter OTP)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INCOMING ORDER & OTP MODALS ── */}
      {incomingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-b from-[#1a1c23] to-[#12141c] border border-orange-500/30 w-full max-w-sm rounded-[2rem] p-6 text-center shadow-2xl">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-black text-white mb-2">New Delivery Request!</h2>
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                <p className="text-sm text-slate-300">Order #{incomingOrder.orderId.slice(-6)}</p>
                <p className="text-2xl font-black text-green-400 mt-2">₹45 <span className="text-xs text-slate-500 uppercase">Est. Pay</span></p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIncomingOrder(null)} className="flex-1 py-3 rounded-xl bg-white/10 font-bold text-slate-300">Decline</button>
              <button onClick={handleAcceptOrder} className="flex-1 py-3 rounded-xl bg-orange-500 font-black shadow-lg shadow-orange-500/30">Accept</button>
            </div>
          </motion.div>
        </div>
      )}

      {showOtpPanel && orderDetails && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#12141c] border border-white/10 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black">Verify Delivery</h3>
                 <button onClick={() => setShowOtpPanel(false)}><XCircle className="text-slate-500"/></button>
             </div>
             <p className="text-sm text-slate-400 mb-6 text-center">Ask <strong className="text-white">{orderDetails.user?.Name || 'the customer'}</strong> for their 4-digit OTP.</p>
             <OtpInput onVerify={handleOtpVerified} correctOtp={orderDetails.DeliveryOTP || "1234"} />
          </motion.div>
        </div>
      )}

      {isDelivered && (
          <div className="fixed inset-0 z-[70] bg-green-500/20 backdrop-blur-xl flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(46,204,113,0.6)]">
                      <CheckCircle size={48} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2">Delivered!</h2>
                  <p className="text-green-100 font-bold">Earnings added to your wallet.</p>
              </motion.div>
          </div>
      )}
    </main>
  );
}