"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { FiArrowLeft, FiMapPin, FiSearch, FiLoader, FiBriefcase, FiTag } from "react-icons/fi";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function AddRestaurantMapPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [location, setLocation] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
  });

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [restaurantDetails, setRestaurantDetails] = useState({
    name: "",
    category: "",
    displayAddress: "", 
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [location.longitude, location.latitude],
        zoom: 4, 
      });

      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="#D84A00" stroke="white" stroke-width="1.5" style="width: 44px; height: 44px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: grab;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
      `;
      markerEl.style.marginTop = "-22px";

      markerRef.current = new mapboxgl.Marker({
        element: markerEl,
        draggable: true,
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current.getLngLat();
        setLocation({ longitude: lngLat.lng, latitude: lngLat.lat });
        reverseGeocode(lngLat.lng, lngLat.lat);
      });
    } else {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 16,
        essential: true,
      });
      markerRef.current?.setLngLat([location.longitude, location.latitude]);
    }
  }, [location.latitude, location.longitude]);


  const reverseGeocode = useCallback(async (lng, lat) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        setRestaurantDetails(prev => ({
          ...prev,
          displayAddress: data.features[0].place_name,
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding error", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=IN`);
        const data = await res.json();
        setSearchResults(data.features || []);
      } catch (err) {
        console.error("Search error", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const selectLocation = (feature) => {
    const [lng, lat] = feature.center;
    setLocation({ longitude: lng, latitude: lat });
    setSearchResults([]);
    setSearchQuery("");
    reverseGeocode(lng, lat);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/partner/restaurants/add`
        : "http://localhost:5000/api/partner/restaurants/add";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          name: restaurantDetails.name,
          categoryName: restaurantDetails.category,
          latitude: location.latitude,
          longitude: location.longitude,
        })
      });

      if (!response.ok) throw new Error("Failed to add restaurant");

      router.push("/partner/restaurants");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white font-sans relative">
      
      <div className="absolute top-0 left-0 w-full z-10 p-4 pt-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-xl mx-auto flex items-center space-x-3">
          <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-gray-700 hover:text-[#FF651D] transition-colors shrink-0">
            <FiArrowLeft size={22} />
          </button>
          
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" size={20} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search city or neighborhood..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-lg border-none focus:ring-2 focus:ring-[#FF651D] text-gray-900 font-medium outline-none"
            />
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                {searchResults.map((result) => (
                  <div 
                    key={result.id} 
                    onClick={() => selectLocation(result)}
                    className="p-4 border-b border-gray-50 hover:bg-orange-50 cursor-pointer flex items-start transition-colors"
                  >
                    <FiMapPin className="text-gray-400 mt-1 mr-3 shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{result.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{result.place_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-grow relative bg-gray-100">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative z-20 px-6 pt-8 pb-10 max-w-xl mx-auto w-full -mt-6">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto absolute top-3 left-1/2 transform -translate-x-1/2"></div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">Add Restaurant</h2>
          {isSearching && <FiLoader className="animate-spin text-[#FF651D]" size={20} />}
        </div>

        <div className="space-y-5">
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiBriefcase className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
            </div>
            <input 
              type="text" 
              required
              value={restaurantDetails.name}
              onChange={(e) => setRestaurantDetails({...restaurantDetails, name: e.target.value})}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#FFDBCB] focus:bg-white outline-none transition-all"
              placeholder="Restaurant Name (e.g., Spicy Bites)"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FiTag className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
            </div>
            <input 
              type="text" 
              required
              value={restaurantDetails.category}
              onChange={(e) => setRestaurantDetails({...restaurantDetails, category: e.target.value})}
              className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#FFDBCB] focus:bg-white outline-none transition-all"
              placeholder="Category (e.g., North Indian, Fast Food)"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pinned Location</label>
            <textarea 
              readOnly
              value={restaurantDetails.displayAddress || "Drag the pin to set location..."}
              className="w-full p-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 outline-none resize-none h-20 cursor-not-allowed"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !restaurantDetails.name || !restaurantDetails.category}
            className="w-full bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-4 rounded-xl shadow-md transition-all mt-4 flex items-center justify-center disabled:opacity-50"
          >
            {isSaving ? <FiLoader className="animate-spin" size={22} /> : "Create Restaurant Profile"}
          </button>
        </div>
      </div>

    </div>
  );
}