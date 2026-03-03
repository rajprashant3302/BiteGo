// src/app/menu/[restaurantId]/edit/[menuId]/page.jsx
"use client";
import React, { useEffect, useState } from "react";
import MenuForm from "@/components/MenuForm";
import { useParams } from "next/navigation";
import { FiLoader } from "react-icons/fi";

export default function EditMenuPage() {
  const { restaurantId, menuId } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";
      // Assuming you have a GET by ID route, or you filter from the list
      const res = await fetch(`${API_BASE}/api/menu/${restaurantId}`);
      const data = await res.json();
      const item = data.find(i => i.ItemID === menuId);
      setInitialData(item);
    };
    fetchItem();
  }, [menuId, restaurantId]);

  if (!initialData) return <div className="flex justify-center pt-20"><FiLoader className="animate-spin text-[#FF651D]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <MenuForm restaurantId={restaurantId} menuId={menuId} mode="edit" initialData={initialData} />
      </div>
    </div>
  );
}