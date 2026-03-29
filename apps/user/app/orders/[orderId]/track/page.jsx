'use client';

import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Phone } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

// Mapbox Imports
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const DELIVERY_SOCKET_URL = process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || "http://localhost:5004";
const ORDER_SERVICE_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function UserTrackingPage() {
    const router = useRouter();
    const params = useParams();
    const orderId = params?.orderId;

    const [order, setOrder] = useState(null);
    const [orderStatus, setOrderStatus] = useState("Loading...");
    const [driverLocation, setDriverLocation] = useState(null);

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const driverMarkerRef = useRef(null);

    // 1. Fetch Order Data
    useEffect(() => {
        if (!orderId) return;
        const fetchOrder = async () => {
            try {
                const res = await fetch(`${ORDER_SERVICE_URL}/api/orders/${orderId}`);
                const data = await res.json();
                if (res.ok) {
                    setOrder(data);
                    setOrderStatus(data.tracking?.currentStatus || data.OrderStatus);
                }
            } catch (err) {
                console.error("Failed to fetch order", err);
            }
        };
        fetchOrder();
    }, [orderId]);

    // 2. Live WebSockets
    useEffect(() => {
        if (!orderId) return;
        const socket = io(DELIVERY_SOCKET_URL, { transports: ['websocket', 'polling'] });

        socket.on("connect", () => {
            console.log("🟢 Connected to live tracking server");
            socket.emit("join_tracking_room", { orderId });
        });

        socket.on("status_update", (data) => setOrderStatus(data.status));
        socket.on("location_update", (data) => setDriverLocation(data));

        return () => socket.disconnect();
    }, [orderId]);

    // 3. Mapbox Initialization
    useEffect(() => {
        if (!mapContainerRef.current || !order || !mapboxgl.accessToken) return;
        if (mapRef.current) return;

        const restLng = parseFloat(order.restaurant.Longitude);
        const restLat = parseFloat(order.restaurant.Latitude);
        const userLng = parseFloat(order.address.Longitude);
        const userLat = parseFloat(order.address.Latitude);

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [restLng, restLat],
            zoom: 15,
            pitch: 60,
            antialias: true,
        });

        const map = mapRef.current;

        map.on("load", async () => {
            // User Marker
            const userEl = document.createElement("div");
            userEl.innerHTML = `<div style="font-size:24px; filter: drop-shadow(0 0 10px rgba(46,204,113,0.8));">🏠</div>`;
            new mapboxgl.Marker({ element: userEl, anchor: "bottom" }).setLngLat([userLng, userLat]).addTo(map);

            // Restaurant Marker
            const restEl = document.createElement("div");
            restEl.innerHTML = `<div style="font-size:24px; filter: drop-shadow(0 0 10px rgba(255,183,0,0.8));">🏪</div>`;
            new mapboxgl.Marker({ element: restEl, anchor: "bottom" }).setLngLat([restLng, restLat]).addTo(map);

            // Driver Marker
            const driverEl = document.createElement("div");
            driverEl.innerHTML = `<div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(255,183,0,0.8);border:3px solid white;font-size:22px;">🛵</div>`;
            
            driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl, anchor: "center" })
                .setLngLat([restLng, restLat])
                .addTo(map);

            // Fetch Route
            try {
                const routeRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${restLng},${restLat};${userLng},${userLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`);
                const routeData = await routeRes.json();
                if (routeData.routes?.length) {
                    map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: routeData.routes[0].geometry } });
                    map.addLayer({ id: "route-line", type: "line", source: "route", paint: { "line-color": "#FFB700", "line-width": 5 } });
                }
            } catch (e) { console.error(e); }
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [order]);

    // 4. Smooth Follow (Fly To) + Marker Snap
    useEffect(() => {
        if (driverMarkerRef.current && driverLocation?.lat && driverLocation?.lng) {
            const newPos = [parseFloat(driverLocation.lng), parseFloat(driverLocation.lat)];
            
            // Move Marker
            driverMarkerRef.current.setLngLat(newPos);

            // Fly To Effect
            mapRef.current?.flyTo({
                center: newPos,
                speed: 0.8,
                curve: 1,
                essential: true,
                offset: [0, -100] // Offsets camera so driver isn't hidden by bottom sheet
            });
        }
    }, [driverLocation]);

    return (
        <main className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
                {!order && (
                    <motion.div 
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-4"
                    >
                        <Loader2 className="animate-spin text-orange-500" size={48} />
                        <p className="font-medium animate-pulse">Establishing secure link...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map Container - Always in DOM */}
            <div className="flex-grow relative bg-[#0d0f14]">
                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
            </div>

            {/* UI Overlays */}
            <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center pointer-events-none">
                <button onClick={() => router.back()} className="pointer-events-auto w-12 h-12 bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                    <ArrowLeft size={20} />
                </button>
                <div className="pointer-events-auto bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-2 border border-white/10 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest text-slate-300">Live</span>
                </div>
            </div>

            {order && (
                <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }}
                    className="absolute bottom-0 left-0 right-0 bg-[#12141c]/95 backdrop-blur-xl rounded-t-[2.5rem] border-t border-white/10 z-20 p-8 shadow-2xl"
                >
                    <div className="max-w-md mx-auto space-y-6">
                        <div>
                            <h2 className="text-2xl font-black">{orderStatus === "Delivered" ? "Enjoy your meal!" : orderStatus}</h2>
                            <p className="text-slate-400 text-sm">Order #{order.OrderID.slice(-8).toUpperCase()}</p>
                        </div>

                        {order.deliveryPartner && orderStatus !== "Delivered" && (
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xl">🛵</div>
                                    <div>
                                        <h3 className="font-bold">{order.deliveryPartner.user?.Name}</h3>
                                        <p className="text-slate-400 text-xs">{order.deliveryPartner.VehicleNumber}</p>
                                    </div>
                                </div>
                                <a href={`tel:${order.deliveryPartner.user?.Phone}`} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-orange-500 transition-colors">
                                    <Phone size={18} />
                                </a>
                            </div>
                        )}

                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Delivering to</p>
                            <p className="text-sm font-bold">{order.address?.AddressLine}</p>
                        </div>
                    </div>
                </motion.div>
            )}
        </main>
    );
}