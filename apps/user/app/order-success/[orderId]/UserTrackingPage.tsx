import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  dummyTrackingState,
  type OrderStatus,
  OTP_VERIFIED_KEY,
  DRIVER_STATUS_KEY,
} from "../dummy-data/trackingData";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? "";

// ── Math helpers ──────────────────────────────────────────
function haversineM(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function buildCumDist(c: [number, number][]): number[] {
  const d = [0];
  for (let i = 1; i < c.length; i++)
    d.push(d[i - 1] + haversineM(c[i - 1][0], c[i - 1][1], c[i][0], c[i][1]));
  return d;
}
function interpolate(coords: [number, number][], cumDist: number[], dist: number): [number, number] {
  const total = cumDist[cumDist.length - 1];
  const d = Math.max(0, Math.min(dist, total));
  let si = 0;
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= d) { si = i - 1; break; }
    if (i === cumDist.length - 1) si = i - 1;
  }
  const segLen = cumDist[si + 1] - cumDist[si];
  const t = segLen > 0 ? (d - cumDist[si]) / segLen : 0;
  const f = coords[si]; const to = coords[si + 1] || f;
  return [f[0] + (to[0] - f[0]) * t, f[1] + (to[1] - f[1]) * t];
}
function getRemainingCoords(coords: [number, number][], cumDist: number[], traveled: number): [number, number][] {
  let si = 0;
  for (let i = 1; i < cumDist.length; i++) {
    if (cumDist[i] >= traveled) { si = i - 1; break; }
    if (i === cumDist.length - 1) si = i - 1;
  }
  const driverPos = interpolate(coords, cumDist, traveled);
  return [driverPos, ...coords.slice(si + 1)];
}
function formatArrival(min: number): string {
  const d = new Date(Date.now() + min * 60000);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function buildStraightRoute(start: [number, number], end: [number, number], steps = 80): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
  });
}
async function fetchRoadRoute(start: [number, number], end: [number, number]): Promise<{ coordinates: [number, number][] } | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes?.length) return null;
    return { coordinates: data.routes[0].geometry.coordinates };
  } catch { return null; }
}

export default function UserTrackingPage() {
  const mapBox = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const driverMk = useRef<mapboxgl.Marker | null>(null);
  const userMk = useRef<mapboxgl.Marker | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    order, userAddress, restaurant, deliveryPartner, orderItems, payment,
    prepTimeMs, driverSpeedKmh, locationUpdateIntervalMs,
  } = dummyTrackingState;

  const [status, setStatus] = useState<OrderStatus>("Placed");
  const [mapReady, setMapReady] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeCumDist, setRouteCumDist] = useState<number[]>([]);
  const [routeTotalDist, setRouteTotalDist] = useState(0);
  const [traveled, setTraveled] = useState(0);
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [etaSec, setEtaSec] = useState(0);
  const [distRemKm, setDistRemKm] = useState(0);
  const [driverArrived, setDriverArrived] = useState(false);
  const [isDelivered, setIsDelivered] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  // OTP countdown shown to user
  const [otpCountdown, setOtpCountdown] = useState(8);

  const speedMs = (driverSpeedKmh * 1000) / 3600;
  const distPerTick = speedMs * (locationUpdateIntervalMs / 1000);
  const progress = routeTotalDist > 0 ? Math.min(1, traveled / routeTotalDist) : 0;

  // ── Inject CSS animations ──
  useEffect(() => {
    if (!document.getElementById("usr-anims")) {
      const s = document.createElement("style");
      s.id = "usr-anims";
      s.textContent = `
        @keyframes dp{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.7);opacity:0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:scale(.85) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes bounceIn{0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes otpDigit{0%{transform:scale(0.8) rotateY(90deg);opacity:0}100%{transform:scale(1) rotateY(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `;
      document.head.appendChild(s);
    }
  }, []);

  // ── Listen for OTP verified event from Driver page ──
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === OTP_VERIFIED_KEY && e.newValue === "true") {
        triggerDelivered();
      }
      if (e.key === DRIVER_STATUS_KEY && e.newValue === "ArrivedAtDoor") {
        setDriverArrived(true);
      }
    };
    window.addEventListener("storage", handleStorage);
    // Also check on mount in case already set
    if (localStorage.getItem(OTP_VERIFIED_KEY) === "true") triggerDelivered();
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const triggerDelivered = useCallback(() => {
    setIsDelivered(true);
    setStatus("Delivered");
    setShowBanner(true);
  }, []);

  // ── Fetch / build route ──
  useEffect(() => {
    const applyRoute = (coords: [number, number][], fallback: boolean) => {
      setRouteCoords(coords);
      const cd = buildCumDist(coords);
      setRouteCumDist(cd);
      const total = cd[cd.length - 1];
      setRouteTotalDist(total);
      const km = total / 1000;
      const eta = (km / driverSpeedKmh) * 60;
      setEtaMin(Math.floor(eta));
      setEtaSec(Math.round((eta % 1) * 60));
      setDistRemKm(km);
      if (fallback) setUsingFallback(true);
    };

    fetchRoadRoute(
      [restaurant.Longitude, restaurant.Latitude],
      [userAddress.Longitude, userAddress.Latitude]
    ).then((r) => {
      if (r) {
        applyRoute(r.coordinates, false);
      } else {
        applyRoute(buildStraightRoute(
          [restaurant.Longitude, restaurant.Latitude],
          [userAddress.Longitude, userAddress.Latitude]
        ), true);
      }
    });
  }, []);

  // ── Init Mapbox ──
  useEffect(() => {
    if (!mapBox.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) { setMapReady(true); return; }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapBox.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [(restaurant.Longitude + userAddress.Longitude) / 2, (restaurant.Latitude + userAddress.Latitude) / 2],
      zoom: 13, pitch: 45, bearing: -15, antialias: true,
    });
    mapRef.current = map;

    map.on("load", () => {
      setMapReady(true);

      // User destination marker
      const ue = document.createElement("div");
      ue.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:46px;height:46px;background:linear-gradient(135deg,#2ecc71,#27ae60);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(46,204,113,0.6);border:3px solid rgba(255,255,255,0.3);">
          <span style="transform:rotate(45deg);font-size:20px;">📍</span>
        </div>
        <div style="background:rgba(0,0,0,0.88);color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:7px;margin-top:5px;white-space:nowrap;border:1px solid rgba(255,255,255,0.08);">Your Location</div>
      </div>`;
      userMk.current = new mapboxgl.Marker({ element: ue, anchor: "bottom" })
        .setLngLat([userAddress.Longitude, userAddress.Latitude]).addTo(map);

      // Driver marker
      const de = document.createElement("div");
      de.innerHTML = `<div style="position:relative;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:60px;height:60px;border-radius:50%;background:rgba(255,183,0,0.18);animation:dp 2s ease-in-out infinite;"></div>
        <div style="position:absolute;width:76px;height:76px;border-radius:50%;background:rgba(255,183,0,0.07);animation:dp 2s ease-in-out 0.4s infinite;"></div>
        <div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 24px rgba(255,183,0,0.7);border:3px solid rgba(255,255,255,0.55);position:relative;z-index:1;font-size:22px;">🛵</div>
      </div>`;
      driverMk.current = new mapboxgl.Marker({ element: de, anchor: "center" })
        .setLngLat([restaurant.Longitude, restaurant.Latitude]).addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── Draw remaining route ──
  useEffect(() => {
    if (!mapReady || routeCoords.length === 0 || !mapRef.current) return;
    const map = mapRef.current;

    if (!map.getSource("remaining")) {
      map.addSource("remaining", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } },
      });
      map.addLayer({
        id: "remaining-glow", type: "line", source: "remaining",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFB700", "line-width": 14, "line-opacity": 0.12, "line-blur": 8 },
      });
      map.addLayer({
        id: "remaining-line", type: "line", source: "remaining",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#FFB700", "line-width": 4.5, "line-opacity": 0.95, "line-dasharray": [2, 1.5] },
      });
    }

    const bounds = routeCoords.reduce(
      (b, c) => b.extend(c as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0])
    );
    map.fitBounds(bounds, { padding: { top: 160, bottom: 270, left: 60, right: 60 }, duration: 1400 });
  }, [mapReady, routeCoords]);

  // ── Order lifecycle ──
  useEffect(() => {
    if (status !== "Placed") return;
    const t = setTimeout(() => setStatus("Preparing"), prepTimeMs);
    return () => clearTimeout(t);
  }, [status, prepTimeMs]);

  useEffect(() => {
    if (status !== "Preparing") return;
    const t = setTimeout(() => setStatus("PickedUp"), 2500);
    return () => clearTimeout(t);
  }, [status]);

  // ── Driver animation ──
  useEffect(() => {
    if (status !== "PickedUp" || routeCoords.length === 0 || driverArrived || isDelivered) return;

    let dist = 0;
    const tick = () => {
      dist += distPerTick;

      if (dist >= routeTotalDist) {
        dist = routeTotalDist;
        const pos = interpolate(routeCoords, routeCumDist, dist);
        if (driverMk.current) driverMk.current.setLngLat(pos);
        updateRemainingRoute(dist);
        setTraveled(dist);
        setDistRemKm(0); setEtaMin(0); setEtaSec(0);
        setDriverArrived(true);
        if (animRef.current) clearInterval(animRef.current);
        return;
      }

      const pos = interpolate(routeCoords, routeCumDist, dist);
      if (driverMk.current) driverMk.current.setLngLat(pos);
      setTraveled(dist);
      updateRemainingRoute(dist);

      const remKm = (routeTotalDist - dist) / 1000;
      const etaTotal = (remKm / driverSpeedKmh) * 60;
      setDistRemKm(remKm);
      setEtaMin(Math.floor(etaTotal));
      setEtaSec(Math.round((etaTotal % 1) * 60));
    };

    animRef.current = setInterval(tick, locationUpdateIntervalMs);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [status, routeCoords, routeCumDist, routeTotalDist, driverArrived, isDelivered]);

  const updateRemainingRoute = useCallback((dist: number) => {
    if (!mapRef.current || routeCoords.length === 0) return;
    const remaining = getRemainingCoords(routeCoords, routeCumDist, dist);
    const src = mapRef.current.getSource("remaining") as mapboxgl.GeoJSONSource | undefined;
    if (src) src.setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: remaining } });
  }, [routeCoords, routeCumDist]);

  // ── ETA countdown ──
  useEffect(() => {
    if (status !== "PickedUp" || driverArrived || isDelivered) return;
    const iv = setInterval(() => {
      setEtaSec((s) => {
        if (s <= 0) { setEtaMin((m) => (m && m > 0 ? m - 1 : 0)); return 59; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [status, driverArrived, isDelivered]);

  // ── OTP countdown (shown to user after driver arrives) ──
  // Auto-simulate delivery after countdown (fallback if no driver page open)
  useEffect(() => {
    if (!driverArrived || isDelivered) return;
    setOtpCountdown(8);
    const cd = setInterval(() => {
      setOtpCountdown((n) => {
        if (n <= 1) {
          clearInterval(cd);
          // Only auto-deliver if the driver page hasn't verified yet
          if (localStorage.getItem(OTP_VERIFIED_KEY) !== "true") {
            triggerDelivered();
            if (mapRef.current) {
              ["remaining-glow", "remaining-line"].forEach((id) => {
                if (mapRef.current!.getLayer(id)) mapRef.current!.removeLayer(id);
              });
              if (mapRef.current!.getSource("remaining")) mapRef.current!.removeSource("remaining");
            }
          }
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(cd);
  }, [driverArrived, isDelivered]);

  const totalItems = orderItems.reduce((s, i) => s + i.Quantity, 0);

  const statusText = (() => {
    if (isDelivered) return "✅ Delivered";
    if (driverArrived) return "📦 Driver at your door";
    switch (status) {
      case "Placed": return "📋 Order Placed";
      case "Preparing": return "👨‍🍳 Preparing your food...";
      case "PickedUp": return "🛵 On the way";
      default: return "";
    }
  })();

  // ── No-token fallback map ──
  const FallbackMap = () => (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 40% 35%, #1a1e2a 0%, #0d0f14 60%)", overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}>
        <defs>
          <pattern id="usr-grid" width="44" height="44" patternUnits="userSpaceOnUse">
            <path d="M 44 0 L 0 0 0 44" fill="none" stroke="#FFB700" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#usr-grid)" />
      </svg>
      {/* Animated route */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB700" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <line x1="75%" y1="25%" x2="25%" y2="72%" stroke="url(#routeGrad)" strokeWidth="2.5" strokeDasharray="10 7" />
        {/* Restaurant dot */}
        <circle cx="75%" cy="25%" r="8" fill="#FF6B35" opacity="0.5" />
        <circle cx="75%" cy="25%" r="14" fill="none" stroke="#FF6B35" strokeWidth="1" opacity="0.2">
          <animate attributeName="r" values="8;18;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        {/* User dot */}
        <circle cx="25%" cy="72%" r="8" fill="#2ecc71" opacity="0.6" />
        {/* Moving driver */}
        <circle
          cx={`${75 - progress * 50}%`}
          cy={`${25 + progress * 47}%`}
          r="7" fill="#FFB700" opacity="0.9"
        >
          <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0d0f14", fontFamily: "'DM Sans','Segoe UI',sans-serif", position: "relative", overflow: "hidden", color: "#fff" }}>

      {/* MAP */}
      {MAPBOX_TOKEN ? (
        <div ref={mapBox} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
      ) : (
        <>
          <div ref={mapBox} style={{ display: "none" }} />
          <FallbackMap />
        </>
      )}

      {/* ── TOP BAR ── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
        <div style={{
          pointerEvents: "auto",
          background: "rgba(0,0,0,0.72)", backdropFilter: "blur(16px)",
          border: `1px solid ${isDelivered || driverArrived ? "rgba(46,204,113,0.4)" : "rgba(255,183,0,0.3)"}`,
          borderRadius: 16, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
        }}>
          {!isDelivered && (
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: driverArrived ? "#2ecc71" : status === "PickedUp" ? "#FFB700" : "#2ecc71", animation: "pulse 1.5s ease-in-out infinite", display: "inline-block", flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 700 }}>{statusText}</span>
        </div>

        <div style={{ pointerEvents: "auto", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "8px 14px", fontSize: 11, color: "#888", fontWeight: 600 }}>
          #{order.OrderID.slice(-8).toUpperCase()}
        </div>
      </div>

      {/* ── ETA OVERLAY ── */}
      {status === "PickedUp" && !driverArrived && !isDelivered && etaMin !== null && (
        <div style={{ position: "absolute", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none", width: "max-content", maxWidth: "90vw" }}>
          <div style={{
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,183,0,0.22)", borderRadius: 20,
            padding: "14px 28px", display: "flex", alignItems: "center", gap: 22,
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Arriving In</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 34, fontWeight: 800, color: "#FFB700", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{etaMin}</span>
                <span style={{ fontSize: 14, color: "#FFB700", fontWeight: 600 }}>:</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "rgba(255,183,0,0.5)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{String(etaSec).padStart(2, "0")}</span>
              </div>
            </div>
            <div style={{ width: 1, height: 44, background: "linear-gradient(180deg,transparent,rgba(255,183,0,0.3),transparent)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Distance</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                {distRemKm >= 1 ? `${distRemKm.toFixed(1)} km` : `${Math.round(distRemKm * 1000)} m`}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>By {formatArrival(etaMin)}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: 8, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress * 100}%`, background: "linear-gradient(90deg,#FFB700,#FF6B35)", borderRadius: 4, transition: "width 0.6s ease", boxShadow: "0 0 8px rgba(255,183,0,0.45)" }} />
          </div>
        </div>
      )}

      {/* ── PREP OVERLAY ── */}
      {(status === "Placed" || status === "Preparing") && (
        <div style={{ position: "absolute", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none" }}>
          <div style={{
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            padding: "20px 30px", textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5)", whiteSpace: "nowrap",
          }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>{status === "Placed" ? "📋" : "👨‍🍳"}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
              {status === "Placed" ? "Order Placed!" : "Preparing your food..."}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {status === "Placed" ? "Restaurant will start shortly" : "Driver will pick up soon"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#FFB700", animation: `pulse 1.2s ${i * 0.28}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DRIVER ARRIVED — OTP DISPLAY ── */}
      {driverArrived && !isDelivered && (
        <div style={{ position: "absolute", top: 76, left: "50%", transform: "translateX(-50%)", zIndex: 50, pointerEvents: "none", width: "max-content", maxWidth: "90vw" }}>
          <div style={{
            background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)",
            border: "1px solid rgba(46,204,113,0.32)", borderRadius: 24,
            padding: "22px 30px", textAlign: "center",
            boxShadow: "0 12px 50px rgba(0,0,0,0.6), 0 0 30px rgba(46,204,113,0.06)",
            animation: "bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2ecc71", marginBottom: 6 }}>Driver has arrived!</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Share this OTP with the delivery partner</div>
            {/* OTP digits */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 14 }}>
              {order.DeliveryOTP.split("").map((d, i) => (
                <div key={i} style={{
                  width: 54, height: 62,
                  background: "rgba(255,183,0,0.08)",
                  border: "2px solid #FFB700", borderRadius: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 800, color: "#FFB700",
                  boxShadow: "0 0 14px rgba(255,183,0,0.2)",
                  animation: `otpDigit 0.4s ${i * 0.1}s cubic-bezier(0.175,0.885,0.32,1.275) both`,
                }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Countdown bar */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(otpCountdown / 8) * 100}%`, background: "linear-gradient(90deg,#2ecc71,#27ae60)", transition: "width 1s linear", borderRadius: 3 }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#555", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ecc71", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }} />
              {otpCountdown > 0 ? `Auto-confirming in ${otpCountdown}s...` : "Confirming..."}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM SHEET ── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100, animation: "slideSheet 0.5s ease" }}>
        <div onClick={() => setBottomOpen((e) => !e)} style={{
          display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 6, cursor: "pointer",
          background: "linear-gradient(180deg, rgba(18,20,28,0), rgba(18,20,28,0.98) 40%)",
        }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: bottomOpen ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.12)", transition: "background 0.2s" }} />
        </div>

        <div style={{
          background: "rgba(18,20,28,0.98)", backdropFilter: "blur(20px)",
          borderTop: `1px solid rgba(${isDelivered ? "46,204,113" : "255,255,255"},0.07)`,
          padding: "4px 20px 30px",
          maxHeight: bottomOpen ? 500 : 148,
          overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {/* Driver / Delivered row */}
          {!isDelivered ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#FFB700,#FF6B35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 16px rgba(255,183,0,0.3)" }}>🛵</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{deliveryPartner.Name}</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>⭐ {deliveryPartner.Rating} · {deliveryPartner.VehicleNumber}</div>
              </div>
              <a href={`tel:${deliveryPartner.Phone}`} style={{ background: "rgba(255,183,0,0.1)", border: "1px solid rgba(255,183,0,0.3)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, textDecoration: "none", flexShrink: 0 }}>📞</a>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14, borderBottom: "1px solid rgba(46,204,113,0.1)" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#2ecc71,#27ae60)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0, boxShadow: "0 4px 20px rgba(46,204,113,0.4)" }}>🎉</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#2ecc71" }}>Order Delivered!</div>
                <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>Enjoy your meal from {restaurant.Name}</div>
              </div>
            </div>
          )}

          {/* Order mini-row */}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#FF6B35,#FF4757)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🍴</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{restaurant.Name}</div>
                <div style={{ color: "#666", fontSize: 11, marginTop: 1 }}>{totalItems} items · ₹{order.TotalAmount.toFixed(0)}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: isDelivered ? "#2ecc71" : "#555", background: isDelivered ? "rgba(46,204,113,0.08)" : "rgba(255,255,255,0.05)", border: `1px solid ${isDelivered ? "rgba(46,204,113,0.2)" : "transparent"}`, padding: "4px 10px", borderRadius: 8, fontWeight: 600 }}>
              {payment.PaymentMethod} ✓
            </div>
          </div>

          {/* Expanded */}
          {bottomOpen && (
            <div style={{ marginTop: 18, animation: "fadeIn 0.2s ease" }}>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Order Items</div>
              {orderItems.map((item) => (
                <div key={item.OrderItemID} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{item.Emoji}</span>
                    <span style={{ fontSize: 13, color: "#ccc" }}>{item.ItemName}</span>
                    <span style={{ background: "rgba(255,183,0,0.1)", color: "#FFB700", borderRadius: 5, fontSize: 10, fontWeight: 700, padding: "1px 5px" }}>×{item.Quantity}</span>
                  </div>
                  <span style={{ fontSize: 13, color: "#888" }}>₹{(item.ItemPrice * item.Quantity).toFixed(0)}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(46,204,113,0.04)", border: "1px solid rgba(46,204,113,0.1)", borderRadius: 12 }}>
                <div style={{ fontSize: 10, color: "#2ecc71", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>📍 Deliver To</div>
                <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.5 }}>{userAddress.AddressLine}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{userAddress.City} — {userAddress.Pincode}</div>
              </div>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>Total Paid</span>
                <span style={{ fontSize: 16, color: "#fff", fontWeight: 800 }}>₹{order.TotalAmount.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DELIVERED BANNER ── */}
      {showBanner && (
        <div onClick={() => setShowBanner(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10001, backdropFilter: "blur(12px)", animation: "fadeIn 0.3s ease" }}>
          <div style={{
            background: "linear-gradient(135deg,#0d1a10,#141620)",
            border: "1px solid rgba(46,204,113,0.35)", borderRadius: 28,
            padding: "44px 36px", textAlign: "center", maxWidth: 380, width: "90%",
            boxShadow: "0 40px 100px rgba(0,0,0,0.85), 0 0 60px rgba(46,204,113,0.08)",
            animation: "slideUp 0.4s cubic-bezier(0.175,0.885,0.32,1.275)",
          }}>
            <div style={{ fontSize: 72, marginBottom: 18 }}>🎉</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#2ecc71", marginBottom: 10 }}>Order Delivered!</div>
            <div style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your order from <strong style={{ color: "#fff" }}>{restaurant.Name}</strong> has been successfully verified & delivered.
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 16px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 11, color: "#888" }}>Order ID</div>
                <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>#{order.OrderID.slice(-8).toUpperCase()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#888" }}>Total</div>
                <div style={{ fontSize: 17, color: "#2ecc71", fontWeight: 800 }}>₹{order.TotalAmount.toFixed(0)}</div>
              </div>
            </div>
            <div style={{ color: "#444", fontSize: 12 }}>Tap anywhere to close</div>
          </div>
        </div>
      )}

      {/* ── Fallback indicator ── */}
      {usingFallback && !isDelivered && (
        <div style={{ position: "absolute", bottom: 160, right: 16, zIndex: 99, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,183,0,0.15)", borderRadius: 10, padding: "5px 10px", fontSize: 10, color: "#666", pointerEvents: "none" }}>
          📡 Demo route
        </div>
      )}
    </div>
  );
}
