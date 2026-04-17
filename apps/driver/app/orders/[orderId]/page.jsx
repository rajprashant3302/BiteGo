'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle, XCircle, Phone, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const DriverMap = dynamic(() => import('@/components/DriverMap'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-[#0d0f14] flex items-center justify-center text-slate-500 font-bold">Initializing Map...</div> 
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost";
const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

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

// ── Main Order Detail Page ──
export default function OrderDetailPage() {
  const { orderId } = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const driverId = session?.user?.id;

  const [socket, setSocket] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderStatus, setOrderStatus] = useState('Loading');
  
  // Tracking
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distRemKm, setDistRemKm] = useState(0);
  const [etaMin, setEtaMin] = useState(0);
  
  // UI States
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const locationWatchId = useRef(null);

  // ── 1. FETCH ORDER DATA ──
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}`);
        const data = await res.json();
        
        if (res.ok) {
          setOrderDetails(data);
          setOrderStatus(data.OrderStatus);
        } else {
          toast.error("Order not found");
          router.push('/orders');
        }
      } catch (err) { 
        console.error("Fetch error:", err);
        toast.error("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  // ── 2. START GPS TRACKING ──
  useEffect(() => {
    if ("geolocation" in navigator) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast.error("Allow GPS for navigation!"),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, []);

  // ── 3. SOCKET CONNECTION (For Location Broadcasting) ──
  useEffect(() => {
    if (!driverId || orderStatus === 'Delivered') return;

    const newSocket = io(BACKEND_URL, { 
      path: '/svc/delivery/socket.io',
      auth: { token: session?.user?.accessToken || driverId }, 
      transports: ['websocket', 'polling']
    });

    newSocket.on("connect", () => console.log(`🟢 Connected to socket for Order ${orderId}`));
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [driverId, session?.user?.accessToken, orderId, orderStatus]);

  // ── 4. BROADCAST LOCATION ──
  useEffect(() => {
    if (currentLocation && socket && orderStatus !== 'Delivered') {
      socket.emit("driver_location_update", {
        orderId: orderId,
        driverId: driverId, 
        lat: currentLocation.lat,
        lng: currentLocation.lng
      });
    }
  }, [currentLocation, socket, driverId, orderId, orderStatus]);

  // ── 5. UPDATE STATUS ACTION ──
  const updateStatus = async (newStatus) => {
    try {
        const token = session?.user?.accessToken;
        const response = await fetch(`${BACKEND_URL}/svc/delivery/driver/${driverId}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update status');
        
        setOrderStatus(newStatus);
        
        // Sync with dashboard localStorage so if they back out, it's updated
        const savedOrder = JSON.parse(localStorage.getItem("bitego_active_order") || "{}");
        if (savedOrder.orderId === orderId) {
            localStorage.setItem("bitego_active_order", JSON.stringify({ ...savedOrder, status: newStatus }));
        }
        
    } catch (error) {
        toast.error("Failed to update status.");
        throw error;
    }
  };

  const handleOtpVerified = async () => {
    try {
        await updateStatus('Delivered');
        setIsDelivered(true);
        setShowOtpPanel(false);
        toast.success("Successfully Delivered!");
        
        // Cleanup local storage for active order if this was it
        const savedOrder = JSON.parse(localStorage.getItem("bitego_active_order") || "{}");
        if (savedOrder.orderId === orderId) {
            localStorage.removeItem("bitego_active_order");
        }
        
        // Return to list after delay
        setTimeout(() => router.push('/orders'), 4000);
    } catch (error) {
        toast.error("Network error! Please try again.");
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>;
  }

  if (!orderDetails) return null;

  return (
    <main className="min-h-screen bg-[#0d0f14] font-sans relative overflow-hidden text-slate-100">
      
      {/* ── MAP CONTAINER ── */}
      <div className="absolute inset-0 z-0">
        {orderDetails?.restaurant?.Longitude && orderDetails?.address?.Longitude ? (
          <DriverMap 
            restaurantLoc={{ lat: parseFloat(orderDetails.restaurant.Latitude), lng: parseFloat(orderDetails.restaurant.Longitude) }}
            userLoc={{ lat: parseFloat(orderDetails.address.Latitude), lng: parseFloat(orderDetails.address.Longitude) }}
            currentDriverLoc={currentLocation}
            orderStatus={orderStatus}
            onDistanceUpdate={(km, min) => { setDistRemKm(km); setEtaMin(min); }}
          />
        ) : (
          <div className="w-full h-full bg-[#12141c] flex items-center justify-center opacity-20" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        )}
      </div>

      {/* ── HEADER ── */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center pointer-events-none">
        <button onClick={() => router.back()} className="pointer-events-auto bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-2 hover:bg-black/80 transition text-sm font-bold">
            <ArrowLeft size={18} /> Back
        </button>
        <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/10 flex flex-col items-end">
            <span className="font-black text-white">Order #{orderId.slice(-6)}</span>
            <span className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">Live Tracking</span>
        </div>
      </div>

      {/* ── ACTIVE ORDER BOTTOM SHEET ── */}
      <AnimatePresence>
        {!isDelivered && (
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-[#12141c]/95 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
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
                    <h3 className="font-bold text-lg">{orderDetails.restaurant?.Name || "Restaurant"}</h3>
                    <p className="text-xs text-slate-400">{orderDetails.items?.length || 0} items • ₹{orderDetails.TotalAmount}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${orderStatus === 'Preparing' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {orderStatus === 'Preparing' ? 'Navigating to Restaurant' : 'Out for Delivery'}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6">
                <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={12}/> Drop Address</p>
                <p className="text-sm text-slate-200">{orderDetails.address?.AddressLine || "Loading address..."}</p>
              </div>

              {/* Expanded details */}
              {detailsOpen && (
                <div className="mb-6 space-y-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Order Items</p>
                  {orderDetails.items?.map(item => (
                     <div key={item.OrderItemID} className="flex justify-between text-sm">
                       <span className="text-slate-300"><span className="text-orange-400 font-bold">x{item.Quantity}</span> {item.item?.ItemName || "Item"}</span>
                     </div>
                  ))}
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl mt-4 border border-white/5">
                     <span className="text-sm font-bold">{orderDetails.user?.Name || 'Customer'}</span>
                     <a href={`tel:${orderDetails.user?.Phone}`} className="text-green-400 bg-green-400/10 p-2 rounded-full"><Phone size={16}/></a>
                  </div>
                </div>
              )}

              {/* ── PHASE 1: PREPARING (Navigating to Restaurant) ── */}
              {orderStatus === 'Preparing' && (
                <div className="flex gap-3">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 flex flex-col justify-center items-center w-1/3">
                    <span className="text-[10px] text-blue-400 uppercase font-bold tracking-widest text-center">ETA to Rest.</span>
                    <span className="font-black text-blue-400 text-xl">{etaMin}m</span>
                  </div>
                  <button onClick={() => updateStatus('PickedUp')} className="flex-1 bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)] transition active:scale-95">
                    Confirm Pickup
                  </button>
                </div>
              )}

              {/* ── PHASE 2: PICKED UP (Navigating to User) ── */}
              {orderStatus === 'PickedUp' && (
                <div className="flex gap-3">
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 flex flex-col justify-center items-center w-1/3">
                    <span className="text-[10px] text-orange-400 uppercase font-bold tracking-widest text-center">ETA to User</span>
                    <span className="font-black text-orange-500 text-xl">{etaMin}m</span>
                  </div>
                  <button onClick={() => setShowOtpPanel(true)} className="flex-1 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(255,183,0,0.4)] transition active:scale-95">
                    I've Arrived (Enter OTP)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OTP MODAL ── */}
      {showOtpPanel && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#12141c] border border-white/10 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black">Verify Delivery</h3>
                 <button onClick={() => setShowOtpPanel(false)}><XCircle className="text-slate-500 hover:text-white transition"/></button>
             </div>
             <p className="text-sm text-slate-400 mb-6 text-center">Ask <strong className="text-white">{orderDetails.user?.Name || 'the customer'}</strong> for their 4-digit OTP.</p>
             <OtpInput onVerify={handleOtpVerified} correctOtp={orderDetails.DeliveryOTP || "1234"} />
          </motion.div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {isDelivered && (
          <div className="fixed inset-0 z-[70] bg-green-500/20 backdrop-blur-xl flex items-center justify-center p-6">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(46,204,113,0.6)]">
                      <CheckCircle size={48} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-white mb-2">Delivered!</h2>
                  <p className="text-green-100 font-bold mb-8">Earnings added to your wallet.</p>
                  <Loader2 className="animate-spin text-white/50 mx-auto" size={24} />
              </motion.div>
          </div>
      )}
    </main>
  );
}