"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiArrowLeft, FiPlus, FiMapPin, FiEdit2, FiTrash2, FiStar, FiLoader } from "react-icons/fi";
import { useCart } from '@/context/CartContext';

export default function SavedAddressesPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { setSelectedAddress, selectedAddress, setIsCartOpen } = useCart();
    const [addresses, setAddresses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    useEffect(() => {
        // Fetch addresses from your backend
        const fetchAddresses = async () => {
            if (status === "authenticated" && session?.user?.id) {
                try {
                    const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL
                        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/addresses/${session.user.id}`
                        : `http://localhost:5000/api/auth/addresses/${session.user.id}`;

                    const response = await fetch(apiUrl);
                    if (response.ok) {
                        const data = await response.json();
                        setAddresses(data);
                    }
                } catch (error) {
                    console.error("Failed to fetch addresses", error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchAddresses();
    }, [status, session]);

    if (status === "loading" || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <FiLoader className="animate-spin text-[#FF651D]" size={40} />
            </div>
        );
    }

    const handleDelete = async (addressId) => {
        if (!confirm("Are you sure you want to delete this address?")) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL
                ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/addresses/${addressId}`
                : `http://localhost:5000/api/auth/addresses/${addressId}`;

            const res = await fetch(apiUrl, { method: "DELETE" });

            if (res.ok) {
                // Remove the deleted address from the UI instantly without reloading
                setAddresses(prev => prev.filter(addr => addr.AddressID !== addressId));
            }
        } catch (error) {
            console.error("Failed to delete address", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
            <div className="max-w-2xl mx-auto px-4 sm:px-0">

                {/* Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <div className="px-6 py-5 flex items-center justify-between">
                        <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm">
                            <FiArrowLeft className="mr-2" size={18} /> Back
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">Saved Addresses</h1>
                        <div className="w-16"></div>
                    </div>
                </div>

                {/* Empty State */}
                {addresses.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center text-center">
                        {/* Grab a nice "Location/Map" SVG from Storyset and put it in public folder */}
                        <img src="/address-animate.svg" alt="No Addresses" className="w-64 h-64 mb-6 opacity-90" />
                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Where to?</h2>
                        <p className="text-gray-500 mb-8 max-w-sm">You haven't saved any addresses yet. Add your home or work address for faster checkout.</p>
                        <Link href="/addresses/add" className="bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md flex items-center">
                            <FiPlus className="mr-2" size={20} /> Add New Address
                        </Link>
                    </div>
                ) : (
                    /* Populated List */
                    <div className="space-y-4">
                        {addresses.map((addr) => (
                            <div key={addr.AddressID} 
                            onClick={() => {
                                setSelectedAddress(addr); 
                                setIsCartOpen(true); 
                                router.back();
                            }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 relative overflow-hidden group">
                                {addr.IsDefault && (
                                    <div className="absolute top-0 right-0 bg-[#FFF0E6] text-[#FF651D] text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center">
                                        <FiStar className="mr-1" size={12} /> Default
                                    </div>
                                )}
                                <div className="flex items-start">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#FF651D] shrink-0 mt-1">
                                        <FiMapPin size={20} />
                                    </div>
                                    <div className="ml-4 flex-grow pr-12">
                                        <h3 className="text-base font-bold text-gray-900">{addr.City}</h3>
                                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{addr.AddressLine}</p>
                                        <p className="text-sm text-gray-400 mt-0.5">Pincode: {addr.Pincode}</p>

                                        <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-50">
                                            <Link href={`/addresses/edit/${addr.AddressID}`} className="text-sm font-semibold text-[#FF651D] flex items-center hover:underline">
                                                <FiEdit2 className="mr-1.5" size={14} /> Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(addr.AddressID)}
                                                className="text-sm font-semibold text-red-500 flex items-center hover:underline cursor-pointer"
                                            >
                                                <FiTrash2 className="mr-1.5" size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Link href="/addresses/add" className="w-full bg-white border-2 border-dashed border-[#FFDBCB] text-[#FF651D] hover:bg-[#FFF0E6] font-bold py-5 rounded-2xl transition-all flex items-center justify-center mt-6">
                            <FiPlus className="mr-2" size={22} /> Add Another Address
                        </Link>
                    </div>
                )}

            </div>
        </div>
    );
}