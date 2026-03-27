'use client';

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function TrackingMap({ restaurantLoc, userLoc, currentDriverLoc }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    // Center map between restaurant and user initially
    const centerLng = (restaurantLoc.lng + userLoc.lng) / 2;
    const centerLat = (restaurantLoc.lat + userLoc.lat) / 2;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [centerLng, centerLat],
      zoom: 13,
      pitch: 45,
      bearing: -15,
      antialias: true,
    });
    
    mapRef.current = map;

    map.on("load", async () => {
      setMapReady(true);

      // --- USER MARKER (Destination) ---
      const userEl = document.createElement("div");
      userEl.innerHTML = `<div style="font-size:30px; filter: drop-shadow(0 0 10px rgba(46,204,113,0.8));">📍</div>`;
      new mapboxgl.Marker({ element: userEl, anchor: "bottom" })
        .setLngLat([userLoc.lng, userLoc.lat])
        .addTo(map);

      // --- RESTAURANT MARKER (Origin) ---
      const restEl = document.createElement("div");
      restEl.innerHTML = `<div style="font-size:30px; filter: drop-shadow(0 0 10px rgba(255,107,53,0.8));">🏪</div>`;
      new mapboxgl.Marker({ element: restEl, anchor: "bottom" })
        .setLngLat([restaurantLoc.lng, restaurantLoc.lat])
        .addTo(map);

      // --- DRIVER MARKER (Moving) ---
      const driverEl = document.createElement("div");
      driverEl.innerHTML = `
        <div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        box-shadow:0 4px 24px rgba(255,183,0,0.7);border:3px solid rgba(255,255,255,0.55);
        font-size:22px;">🛵</div>`;
      
      // Start driver at restaurant or their current real location
      const initialDriverLng = currentDriverLoc?.lng || restaurantLoc.lng;
      const initialDriverLat = currentDriverLoc?.lat || restaurantLoc.lat;

      driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl, anchor: "center" })
        .setLngLat([initialDriverLng, initialDriverLat])
        .addTo(map);

      // --- DRAW ROUTE (Optional: Directions API) ---
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${restaurantLoc.lng},${restaurantLoc.lat};${userLoc.lng},${userLoc.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes?.length) {
          const routeCoords = data.routes[0].geometry.coordinates;
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } }
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#FFB700", "line-width": 4, "line-dasharray": [2, 1.5] }
          });

          // Fit bounds
          const bounds = routeCoords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]));
          map.fitBounds(bounds, { padding: 80, duration: 1000 });
        }
      } catch (err) {
        console.error("Failed to fetch route line", err);
      }
    });

    return () => map.remove();
  }, [restaurantLoc, userLoc]);

  // 2. LIVE TRACKING: Update Marker when socket sends new data
  useEffect(() => {
    if (mapReady && driverMarkerRef.current && currentDriverLoc) {
      // Instantly snap the marker to the new real-time coordinates!
      driverMarkerRef.current.setLngLat([currentDriverLoc.lng, currentDriverLoc.lat]);
    }
  }, [currentDriverLoc, mapReady]);

  if (!MAPBOX_TOKEN) {
    return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-400">Missing MAPBOX_TOKEN</div>;
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
}



// 'use client';

// import { useEffect, useRef, useState } from "react";
// import mapboxgl from "mapbox-gl";
// import "mapbox-gl/dist/mapbox-gl.css";

// const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// export default function TrackingMap({ restaurantLoc, userLoc, currentDriverLoc }) {
//   const mapContainer = useRef(null);
//   const mapRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const [mapReady, setMapReady] = useState(false);

//   // 1. Initialize Map
//   useEffect(() => {
//     if (!mapContainer.current || mapRef.current || !MAPBOX_TOKEN) return;

//     mapboxgl.accessToken = MAPBOX_TOKEN;
    
//     // Center map between restaurant and user initially
//     const centerLng = (restaurantLoc.lng + userLoc.lng) / 2;
//     const centerLat = (restaurantLoc.lat + userLoc.lat) / 2;

//     const map = new mapboxgl.Map({
//       container: mapContainer.current,
//       style: "mapbox://styles/mapbox/streets-v12",
//       center: [centerLng, centerLat],
//       zoom: 13,
//       pitch: 45,
//       bearing: -15,
//       antialias: true,
//     });
    
//     mapRef.current = map;

//     map.on("load", async () => {
//       setMapReady(true);

//       // --- USER MARKER (Destination) ---
//       const userEl = document.createElement("div");
//       userEl.innerHTML = `<div style="font-size:30px; filter: drop-shadow(0 0 10px rgba(46,204,113,0.8));">📍</div>`;
//       new mapboxgl.Marker({ element: userEl, anchor: "bottom" })
//         .setLngLat([userLoc.lng, userLoc.lat])
//         .addTo(map);

//       // --- RESTAURANT MARKER (Origin) ---
//       const restEl = document.createElement("div");
//       restEl.innerHTML = `<div style="font-size:30px; filter: drop-shadow(0 0 10px rgba(255,107,53,0.8));">🏪</div>`;
//       new mapboxgl.Marker({ element: restEl, anchor: "bottom" })
//         .setLngLat([restaurantLoc.lng, restaurantLoc.lat])
//         .addTo(map);

//       // --- DRIVER MARKER (Moving) ---
//       const driverEl = document.createElement("div");
//       driverEl.innerHTML = `
//         <div style="width:46px;height:46px;background:linear-gradient(135deg,#FFB700,#FF6B35);
//         border-radius:50%;display:flex;align-items:center;justify-content:center;
//         box-shadow:0 4px 24px rgba(255,183,0,0.7);border:3px solid rgba(255,255,255,0.55);
//         font-size:22px;">🛵</div>`;
      
//       // Start driver at restaurant or their current real location
//       const initialDriverLng = currentDriverLoc?.lng || restaurantLoc.lng;
//       const initialDriverLat = currentDriverLoc?.lat || restaurantLoc.lat;

//       driverMarkerRef.current = new mapboxgl.Marker({ element: driverEl, anchor: "center" })
//         .setLngLat([initialDriverLng, initialDriverLat])
//         .addTo(map);

//       // --- DRAW ROUTE (Optional: Directions API) ---
//       try {
//         const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${restaurantLoc.lng},${restaurantLoc.lat};${userLoc.lng},${userLoc.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
//         const res = await fetch(url);
//         const data = await res.json();
        
//         if (data.routes?.length) {
//           const routeCoords = data.routes[0].geometry.coordinates;
//           map.addSource("route", {
//             type: "geojson",
//             data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: routeCoords } }
//           });
//           map.addLayer({
//             id: "route-line",
//             type: "line",
//             source: "route",
//             layout: { "line-join": "round", "line-cap": "round" },
//             paint: { "line-color": "#FFB700", "line-width": 4, "line-dasharray": [2, 1.5] }
//           });

//           // Fit bounds
//           const bounds = routeCoords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(routeCoords[0], routeCoords[0]));
//           map.fitBounds(bounds, { padding: 80, duration: 1000 });
//         }
//       } catch (err) {
//         console.error("Failed to fetch route line", err);
//       }
//     });

//     return () => map.remove();
//   }, [restaurantLoc, userLoc]);

//   // 2. LIVE TRACKING: Update Marker when socket sends new data
//   useEffect(() => {
//     if (mapReady && driverMarkerRef.current && currentDriverLoc) {
//       // Instantly snap the marker to the new real-time coordinates!
//       driverMarkerRef.current.setLngLat([currentDriverLoc.lng, currentDriverLoc.lat]);
//     }
//   }, [currentDriverLoc, mapReady]);

//   if (!MAPBOX_TOKEN) {
//     return <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-slate-400">Missing MAPBOX_TOKEN</div>;
//   }

//   return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
// }