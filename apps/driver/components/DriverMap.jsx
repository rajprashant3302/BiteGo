'use client';

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// --- Fix Leaflet Default Icon Bug ---
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Helper: Road Path Engine ---
function RoutingEngine({ start, end, orderStatus, onDistanceUpdate }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    // Cleanup old route if it exists
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start.lat, start.lng), L.latLng(end.lat, end.lng)],
      lineOptions: {
        styles: [{ 
          color: orderStatus === 'Preparing' ? '#3b82f6' : '#FFB700', 
          weight: 6, 
          opacity: 0.7 
        }]
      },
      createMarker: () => null, // We use our own markers
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Hide the text instructions box
    }).addTo(map);

    routingControl.on('routesfound', (e) => {
      const routes = e.routes;
      const summary = routes[0].summary;
      // Convert meters to km and seconds to minutes
      onDistanceUpdate(summary.totalDistance / 1000, Math.round(summary.totalTime / 60));
    });

    routingControlRef.current = routingControl;

    return () => {
      if (map && routingControlRef.current) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, start.lat, start.lng, end.lat, end.lng, orderStatus]);

  return null;
}

export default function DriverMap({ restaurantLoc, userLoc, currentDriverLoc, orderStatus, onDistanceUpdate }) {
  const targetLoc = orderStatus === 'Preparing' ? restaurantLoc : userLoc;
  const startLoc = currentDriverLoc || restaurantLoc;

  // Custom Scooter Icon
  const scooterIcon = L.divIcon({
    className: "custom-scooter",
    html: `<div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);
           border-radius:50%;display:flex;align-items:center;justify-content:center;
           box-shadow:0 4px 20px rgba(255,183,0,0.4);border:3px solid white;font-size:22px;">🛵</div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });

  return (
    <div className="h-full w-full bg-[#0d0f14]">
      <MapContainer
        center={[restaurantLoc.lat, restaurantLoc.lng]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        {/* Premium Dark Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        <RoutingEngine 
          start={startLoc} 
          end={targetLoc} 
          orderStatus={orderStatus} 
          onDistanceUpdate={onDistanceUpdate} 
        />

        {/* Restaurant Marker */}
        <Marker position={[restaurantLoc.lat, restaurantLoc.lng]}>
          <div className="text-2xl">🏪</div>
        </Marker>

        {/* User Marker */}
        <Marker position={[userLoc.lat, userLoc.lng]}>
          <div className="text-2xl">🏠</div>
        </Marker>

        {/* Moving Driver Marker */}
        {currentDriverLoc && (
          <Marker position={[currentDriverLoc.lat, currentDriverLoc.lng]} icon={scooterIcon} />
        )}
      </MapContainer>
    </div>
  );
}


// 'use client';

// import React, { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";

// mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// // Helper to calculate straight-line distance
// function calculateDistance(lat1, lon1, lat2, lon2) {
//   const R = 6371; 
//   const dLat = (lat2 - lat1) * (Math.PI / 180);
//   const dLon = (lon2 - lon1) * (Math.PI / 180);
//   const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//             Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//   return R * c;
// }

// export default function DriverMap({ restaurantLoc, userLoc, currentDriverLoc, orderStatus, onDistanceUpdate }) {
//   const mapContainerRef = useRef(null);
//   const mapRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const [mapReady, setMapReady] = useState(false);
  
//   // Track which route we've already fetched so we don't spam the Mapbox API
//   const [routePhase, setRoutePhase] = useState(null);

//   // 1. INITIALIZE MAP (Runs Once)
//   useEffect(() => {
//     if (!mapContainerRef.current || !mapboxgl.accessToken || mapRef.current) return;

//     const centerLng = (restaurantLoc.lng + userLoc.lng) / 2;
//     const centerLat = (restaurantLoc.lat + userLoc.lat) / 2;

//     mapRef.current = new mapboxgl.Map({
//       container: mapContainerRef.current,
//       style: "mapbox://styles/mapbox/dark-v11",
//       center: [centerLng, centerLat],
//       zoom: 14,
//       pitch: 50,
//       bearing: 0,
//       antialias: true,
//     });

//     const map = mapRef.current;

//     map.on("load", () => {
//       setMapReady(true);

//       // User Marker
//       const userEl = document.createElement("div");
//       userEl.innerHTML = `<div style="font-size:26px; filter: drop-shadow(0 0 10px rgba(46,204,113,0.8));">🏠</div>`;
//       new mapboxgl.Marker({ element: userEl, anchor: "bottom" }).setLngLat([userLoc.lng, userLoc.lat]).addTo(map);

//       // Restaurant Marker
//       const restEl = document.createElement("div");
//       restEl.innerHTML = `<div style="font-size:26px; filter: drop-shadow(0 0 10px rgba(255,183,0,0.8));">🏪</div>`;
//       new mapboxgl.Marker({ element: restEl, anchor: "bottom" }).setLngLat([restaurantLoc.lng, restaurantLoc.lat]).addTo(map);

//       // Driver Marker
//       const driverEl = document.createElement("div");
//       driverEl.innerHTML = `
//         <div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);
//         border-radius:50%;display:flex;align-items:center;justify-content:center;
//         box-shadow:0 4px 24px rgba(255,183,0,0.8);border:3px solid rgba(255,255,255,0.6);font-size:22px;z-index:50;">🛵</div>`;
      
//       const initialLng = currentDriverLoc?.lng || restaurantLoc.lng;
//       const initialLat = currentDriverLoc?.lat || restaurantLoc.lat;
//       driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl, anchor: "center" })
//         .setLngLat([initialLng, initialLat])
//         .addTo(map);
//     });

//     return () => map.remove();
//   }, []); 

//   // 2. DYNAMIC ROUTING (Zomato/Uber style)
//   useEffect(() => {
//     if (!mapReady || !mapRef.current) return;

//     // Determine target based on the current phase
//     const startLoc = currentDriverLoc || restaurantLoc; 
//     const targetLoc = orderStatus === 'Preparing' ? restaurantLoc : userLoc;

//     // Only fetch new route from API if the phase just changed
//     if (routePhase !== orderStatus) {
//       const fetchRoute = async () => {
//         try {
//           const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLoc.lng},${startLoc.lat};${targetLoc.lng},${targetLoc.lat}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
//           const res = await fetch(url);
//           const data = await res.json();
          
//           if (data.routes?.length) {
//             const coords = data.routes[0].geometry.coordinates;
//             const map = mapRef.current;

//             if (map.getSource("route")) {
//               map.getSource("route").setData({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } });
//             } else {
//               map.addSource("route", { type: "geojson", data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } } });
//               map.addLayer({ id: "route-glow", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": orderStatus === 'Preparing' ? "#3b82f6" : "#FFB700", "line-width": 14, "line-opacity": 0.15, "line-blur": 8 } });
//               map.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": orderStatus === 'Preparing' ? "#3b82f6" : "#FFB700", "line-width": 5, "line-opacity": 1 } });
//             }

//             // Smoothly pan camera to fit the new route
//             const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
//             map.fitBounds(bounds, { padding: { top: 100, bottom: 350, left: 60, right: 60 }, duration: 1200 });
//             setRoutePhase(orderStatus);
//           }
//         } catch (err) {
//           console.error("Route fetch failed", err);
//         }
//       };
//       fetchRoute();
//     }
//   }, [mapReady, orderStatus, currentDriverLoc, routePhase]);

//   // 3. LIVE GPS SNAP & ETA CALCULATION
//   useEffect(() => {
//     if (driverMarkerRef.current && currentDriverLoc) {
//       driverMarkerRef.current.setLngLat([currentDriverLoc.lng, currentDriverLoc.lat]);
      
//       // Target depends on current status
//       const targetLoc = orderStatus === 'Preparing' ? restaurantLoc : userLoc;
      
//       const distKm = calculateDistance(currentDriverLoc.lat, currentDriverLoc.lng, targetLoc.lat, targetLoc.lng);
//       const etaMinutes = Math.max(1, Math.round((distKm / 30) * 60)); // 30km/h avg speed
      
//       if (onDistanceUpdate) onDistanceUpdate(distKm, etaMinutes);
//     }
//   }, [currentDriverLoc, orderStatus]);

//   return (
//     <div className="grow relative bg-[#0d0f14] w-full h-full">
//       <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
//     </div>
//   );
// }