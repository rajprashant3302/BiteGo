"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiImage, FiArrowLeft, FiLoader, FiCheck } from "react-icons/fi";

export default function MenuForm({ restaurantId, menuId, mode, initialData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.ItemName || "",
    description: initialData?.Description || "",
    price: initialData?.Price || "",
    isVeg: initialData?.IsVeg ?? true,
    isAvailable: initialData?.IsAvailable ?? true,
  });

  const [imagePreview, setImagePreview] = useState(initialData?.ItemImageURL || null);
  const [selectedFile, setSelectedFile] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: data }
    );

    const result = await res.json();
    return result.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = imagePreview;
      if (selectedFile) imageUrl = await uploadToCloudinary(selectedFile);

      const url =
        mode === "edit"
          ? `${API_BASE}/api/menu/edit/${menuId}`
          : `${API_BASE}/api/menu/add`;

      const method = mode === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, restaurantId, imageUrl }),
      });

      if (res.ok) {
        router.push(`/partner/menu/${restaurantId}`);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to save item"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please check your connection and backend.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen flex justify-center items-start px-4 py-12 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 md:p-10">
        
        {/* Navigation */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-slate-600 hover:text-orange-600 font-bold transition group"
        >
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Menu
        </button>

        <header className="mb-10">
          <h2 className="text-3xl font-black text-slate-900">
            {mode === "edit" ? "Edit Dish" : "Create New Dish"}
          </h2>
          <p className="text-slate-500 mt-1">Configure your dish details and availability.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload Area */}
          <div className="group flex flex-col items-center p-8 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50 hover:bg-white hover:border-orange-500 transition-all relative cursor-pointer overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                className="h-48 w-full object-contain rounded-2xl mb-4"
                alt="Dish preview"
              />
            ) : (
              <div className="bg-orange-100 p-5 rounded-full mb-4">
                <FiImage size={40} className="text-orange-600" />
              </div>
            )}
            <p className="text-sm font-bold text-slate-700">
              {selectedFile ? selectedFile.name : "Click or drag to upload image"}
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          {/* Toggle Switches Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diet Toggle */}
            <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dietary Type</span>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isVeg: true })}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${
                    formData.isVeg ? "bg-green-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Pure Veg
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isVeg: false })}
                  className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all ${
                    !formData.isVeg ? "bg-red-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  Non-Veg
                </button>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Availability</span>
                <span className={`text-sm font-bold ${formData.isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
                  {formData.isAvailable ? 'Currently Listed' : 'Hidden from Menu'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors outline-none ring-offset-2 focus:ring-2 ring-orange-500 ${
                  formData.isAvailable ? "bg-orange-500" : "bg-slate-400"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    formData.isAvailable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Text Inputs */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Dish Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Paneer Butter Masala"
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-800 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase ml-1">Price (₹)</label>
                <input
                  required
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="299"
                  className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase ml-1">Dish Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe the ingredients, taste, or spice level..."
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl h-32 outline-none focus:border-orange-500 focus:bg-white transition-all text-slate-800 font-medium resize-none"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-5 rounded-2xl flex justify-center items-center transition-all transform active:scale-95 shadow-xl shadow-orange-100 disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <FiLoader className="animate-spin mr-3" size={20} />
                  Saving Changes...
                </>
              ) : (
                mode === "edit" ? "Update Menu Item" : "Confirm & Create Dish"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}