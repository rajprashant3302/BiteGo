"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FiArrowLeft, FiMapPin, FiSearch, FiLoader } from "react-icons/fi";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function EditAddressMapPage() {
  const router = useRouter();
  const params = useParams(); 
  const { data: session, status } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [viewState, setViewState] = useState({
    longitude: 78.9629,
    latitude: 20.5937,
    zoom: 4
  });
  const [marker, setMarker] = useState(null);


  const [addressDetails, setAddressDetails] = useState({
    addressLine: "",
    city: "",
    pincode: "",
    isDefault: false
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchAddress = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/addresses/${session.user.id}`
            : `http://localhost:5000/api/auth/addresses/${session.user.id}`;
            
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            const currentAddress = data.find(addr => addr.AddressID === params.id);
            
            if (currentAddress) {
              setAddressDetails({
                addressLine: currentAddress.AddressLine || "",
                city: currentAddress.City || "",
                pincode: currentAddress.Pincode || "",
                isDefault: currentAddress.IsDefault || false
              });

              if (currentAddress.Longitude && currentAddress.Latitude) {
                const lng = parseFloat(currentAddress.Longitude);
                const lat = parseFloat(currentAddress.Latitude);
                setMarker({ longitude: lng, latitude: lat });
                setViewState({ longitude: lng, latitude: lat, zoom: 15 });
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

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN`);
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
    setViewState({ longitude: lng, latitude: lat, zoom: 15 });
    setMarker({ longitude: lng, latitude: lat });
    setSearchResults([]);
    setSearchQuery("");
    reverseGeocode(lng, lat);
  };

  const reverseGeocode = async (lng, lat) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`);
      const data = await res.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        
        let city = "";
        let pincode = "";
        
        place.context?.forEach(ctx => {
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
  };

  const onMarkerDragEnd = (event) => {
    const { lng, lat } = event.lngLat;
    setMarker({ longitude: lng, latitude: lat });
    reverseGeocode(lng, lat);
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
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
          latitude: marker?.latitude,
          longitude: marker?.longitude,
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
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {marker && (
            <Marker 
              longitude={marker.longitude} 
              latitude={marker.latitude} 
              draggable 
              onDragEnd={onMarkerDragEnd}
            >
              <div className="w-10 h-10 -mt-10 -ml-5 drop-shadow-lg cursor-grab active:cursor-grabbing">
                <svg viewBox="0 0 24 24" fill="#FF651D" stroke="white" strokeWidth="1.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" fill="white" />
                </svg>
              </div>
            </Marker>
          )}
        </Map>
      </div>

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