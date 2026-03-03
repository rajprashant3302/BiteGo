// src/app/partner/menu/[restaurantId]/add/page.jsx
"use client";
import MenuForm from "@/components/MenuForm";
import { useParams } from "next/navigation";

export default function AddMenuPage() {
  const { restaurantId } = useParams();
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <MenuForm restaurantId={restaurantId} mode="add" />
      </div>
    </div>
  );
}