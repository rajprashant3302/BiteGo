"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { FiArrowLeft, FiMapPin, FiSearch, FiLoader } from "react-icons/fi";

// Set token outside component to avoid re-initialization
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function EditAddressMapPage() {
  const router = useRouter();
  const params = useParams(); 
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Core Location State (Centered on India by default, overwritten by fetch)
  const [location, setLocation] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
  });

  // Mapbox Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  // Form & UI State
  const [addressDetails, setAddressDetails] = useState({
    addressLine: "",
    city: "",
    pincode: "",
    isDefault: false
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // --- 1. Fetch Existing Address ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchAddress = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          // Adjust this URL to match whether you used Option 1 or 2 from earlier!
          const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/addresses/${session.user.id}`
            : `http://localhost:5000/api/auth/addresses/${session.user.id}`;
            
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            const currentAddress = data.find((addr: any) => addr.AddressID === params.id);
            
            if (currentAddress) {
              setAddressDetails({
                addressLine: currentAddress.AddressLine || "",
                city: currentAddress.City || "",
                pincode: currentAddress.Pincode || "",
                isDefault: currentAddress.IsDefault || false
              });

              if (currentAddress.Longitude && currentAddress.Latitude) {
                setLocation({ 
                  longitude: parseFloat(currentAddress.Longitude), 
                  latitude: parseFloat(currentAddress.Latitude) 
                });
              }
            } else {
              router.push("/addresses");
            }
          }
        } catch (error) {
          console.error("Failed to fetch address", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchAddress();
  }, [status, session, params.id, router]);

  // --- 2. Map Initialization & Marker Updates ---
  useEffect(() => {
    // Prevent map initialization until data is fetched and container is rendered
    if (isLoading || !mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [location.longitude, location.latitude],
        zoom: 15, // Closer zoom since we usually have an exact location for edits
      });

      const markerEl = document.createElement("div");
      markerEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="#FF651D" stroke="white" stroke-width="1.5" style="width: 40px; height: 40px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); cursor: grab;">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" fill="white" />
        </svg>
      `;
      markerEl.style.marginTop = "-20px";

      markerRef.current = new mapboxgl.Marker({
        element: markerEl,
        draggable: true,
      })
        .setLngLat([location.longitude, location.latitude])
        .addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        const lngLat = markerRef.current!.getLngLat();
        setLocation({ longitude: lngLat.lng, latitude: lngLat.lat });
        reverseGeocode(lngLat.lng, lngLat.lat);
      });
    } else {
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        essential: true,
      });
      markerRef.current?.setLngLat([location.longitude, location.latitude]);
    }
  }, [location.latitude, location.longitude, isLoading]); 

  // --- 3. Reverse Geocode ---
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        let city = "";
        let pincode = "";
        
        place.context?.forEach((ctx: any) => {
          if (ctx.id.includes("place") || ctx.id.includes("locality")) city = ctx.text;
          if (ctx.id.includes("postcode")) pincode = ctx.text;
        });

        setAddressDetails(prev => ({
          ...prev,
          addressLine: place.place_name,
          city: city || place.text,
          pincode: pincode
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding error", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // --- 4. Search Places ---
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // --- 5. Select Search Result ---
  const selectLocation = (feature: any) => {
    const [lng, lat] = feature.center;
    setLocation({ longitude: lng, latitude: lat });
    setSearchResults([]);
    setSearchQuery("");
    reverseGeocode(lng, lat);
  };

  // --- 6. Update Database ---
  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      // Adjust this URL to match whether you used Option 1 or 2 from earlier!
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/addresses/${params.id}`
        : `http://localhost:5000/api/auth/addresses/${params.id}`;

      await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          addressLine: addressDetails.addressLine,
          city: addressDetails.city,
          pincode: addressDetails.pincode,
          latitude: location.latitude,
          longitude: location.longitude,
          isDefault: addressDetails.isDefault
        })
      });

      router.push("/addresses");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white font-sans relative">
      
      {/* Search Bar Overlay */}
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
              placeholder="Search to change location..." 
              className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl shadow-lg border-none focus:ring-2 focus:ring-[#FF651D] text-gray-900 font-medium outline-none"
            />
            
            {/* Search Dropdown Results */}
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

      {/* Native Mapbox Container */}
      <div className="flex-grow relative bg-gray-100">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
      </div>

      {/* Bottom Form Sheet */}
      <div className="bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] relative z-20 px-6 pt-8 pb-10 max-w-xl mx-auto w-full -mt-6">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto absolute top-3 left-1/2 transform -translate-x-1/2"></div>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-gray-900">Update Address</h2>
          {isSearching && <FiLoader className="animate-spin text-[#FF651D]" size={20} />}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Complete Address</label>
            <textarea 
              value={addressDetails.addressLine}
              onChange={(e) => setAddressDetails({...addressDetails, addressLine: e.target.value})}
              className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#FFDBCB] focus:bg-white outline-none transition-all resize-none h-20"
              placeholder="House/Flat No., Building Name, Landmark"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">City</label>
              <input 
                type="text" 
                value={addressDetails.city}
                onChange={(e) => setAddressDetails({...addressDetails, city: e.target.value})}
                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Pincode</label>
              <input 
                type="text" 
                value={addressDetails.pincode}
                onChange={(e) => setAddressDetails({...addressDetails, pincode: e.target.value})}
                className="w-full p-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium text-gray-900 outline-none"
              />
            </div>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer mt-2 pt-2">
            <input 
              type="checkbox" 
              checked={addressDetails.isDefault}
              onChange={(e) => setAddressDetails({...addressDetails, isDefault: e.target.checked})}
              className="w-5 h-5 text-[#FF651D] rounded border-gray-300 focus:ring-[#FF651D]" 
            />
            <span className="text-sm font-bold text-gray-700">Set as default address</span>
          </label>

          <button 
            onClick={handleUpdate}
            disabled={isSaving || !addressDetails.addressLine}
            className="w-full bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-4 rounded-xl shadow-md transition-all mt-4 flex items-center justify-center disabled:opacity-50"
          >
            {isSaving ? <FiLoader className="animate-spin" size={22} /> : "Update Address"}
          </button>
        </div>
      </div>
    </div>
  );
}