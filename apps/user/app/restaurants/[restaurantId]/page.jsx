"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiStar,
  FiClock,
  FiPlus,
  FiAlertCircle,
  FiChevronRight,
} from "react-icons/fi";
import { Loader2, ShoppingCart } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

export default function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const { cartTotal, cartCount, setIsCartOpen } = useCart();

  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/menu/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          setMenuData(data);
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (restaurantId) fetchMenu();
  }, [restaurantId, API_BASE]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );

  const restaurantName =
    menuData.length > 0 ? menuData[0]?.restaurant?.Name : "Restaurant Menu";
  const category =
    menuData.length > 0 ? menuData[0]?.restaurant?.CategoryName : "Cuisine";
  const rating =
    menuData.length > 0
      ? parseFloat(menuData[0]?.restaurant?.Rating).toFixed(1)
      : "4.5";

  return (
    // ✅ CHANGE 1: Add mobile-safe bottom padding so content never hides under BottomNav / cart bar
    <main className="max-w-7xl mx-auto px-4 pt-8 font-sans relative pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-32">
      <button
        onClick={() => router.back()}
        className="flex items-center text-slate-500 hover:text-orange-600 font-bold mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back
      </button>

      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 mb-12">
        <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-black uppercase">
          {category}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">
          {restaurantName}
        </h1>
        <div className="flex items-center gap-6 mt-6 text-sm font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-orange-600">
            <FiStar /> {rating}
          </span>
          <span>
            <FiClock className="inline mr-1" /> 25-35 mins
          </span>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {menuData.map((item) => (
          <MenuCard key={item.ItemID} item={item} />
        ))}
      </div>

      {/* ── FLOATING CART POP-UP ── */}
      {cartCount > 0 && (
        // ✅ CHANGE 2: Move cart bar ABOVE BottomNav on mobile + safe-area support
        <div className="fixed left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-[120] animate-in fade-in slide-in-from-bottom-4 duration-500 bottom-[calc(96px+env(safe-area-inset-bottom))] md:bottom-8">
          <div
            onClick={() => setIsCartOpen(true)}
            className="bg-orange-500 text-white p-4 rounded-3xl shadow-2xl shadow-orange-200 flex items-center justify-between cursor-pointer hover:bg-orange-600 transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase opacity-80 tracking-widest">
                  {cartCount} Items Added
                </p>
                <p className="text-xl font-black">₹{cartTotal.toFixed(0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black">
              VIEW CART <FiChevronRight size={20} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MenuCard({ item }) {
  const { addToCart, removeFromCart, cartItems } = useCart();

  const cartItem = cartItems.find((i) => i.ItemID === item.ItemID);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = item.AvailableQuantity <= 0;

  return (
    <div
      className={`bg-white rounded-[2rem] p-5 border-2 border-slate-50 transition-all duration-300 relative ${
        isOutOfStock
          ? "opacity-75 grayscale-[0.5]"
          : "hover:border-orange-500/20 hover:shadow-2xl"
      }`}
    >
      {/* ✅ CHANGE 3: Use a grid so action controls never overflow on mobile */}
      <div className="grid grid-cols-[auto_1fr] gap-4 sm:gap-6 items-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 flex-shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-inner">
          <img
            src={item.ItemImageURL || "/placeholder-food.png"}
            className="w-full h-full object-cover"
            alt={item.ItemName}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-black text-[10px] uppercase tracking-tighter bg-red-600 px-2 py-1 rounded-md">
                Sold Out
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex flex-col h-full py-1">
          <div className="flex items-center gap-2 mb-1 min-w-0">
            <div
              className={`w-3.5 h-3.5 flex items-center justify-center border-2 rounded-sm ${
                item.IsVeg ? "border-green-600" : "border-red-600"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  item.IsVeg ? "bg-green-600" : "bg-red-600"
                }`}
              />
            </div>
            <h3 className="font-black text-base sm:text-lg text-slate-800 line-clamp-1">
              {item.ItemName}
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-3 sm:mb-4">
            {item.Description || "No description available."}
          </p>

          {/* ✅ Grid inside for price + actions */}
          <div className="mt-auto grid grid-cols-[1fr_auto] items-end gap-3">
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                ₹{parseFloat(item.Price).toFixed(0)}
              </span>
              {item.AvailableQuantity < 10 && item.AvailableQuantity > 0 && (
                <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle /> Only {item.AvailableQuantity} left
                </span>
              )}
            </div>

            {/* Actions: never overflow */}
            <div className="shrink-0 justify-self-end">
              {quantity > 0 ? (
                <div className="flex items-center bg-orange-500 rounded-2xl p-1 shadow-lg shadow-orange-100">
                  <button
                    onClick={() => removeFromCart(item.ItemID)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-orange-600 rounded-xl transition-colors font-black text-xl"
                    type="button"
                  >
                    -
                  </button>
                  <span className="px-3 sm:px-4 font-black text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => addToCart(item)}
                    disabled={quantity >= item.AvailableQuantity}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white hover:bg-orange-600 rounded-xl transition-colors font-black text-xl disabled:opacity-50"
                    type="button"
                  >
                    +
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => addToCart(item)}
                  disabled={isOutOfStock}
                  size="icon"
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-lg transition-all active:scale-90 ${
                    isOutOfStock
                      ? "bg-slate-200 text-slate-400 shadow-none"
                      : "bg-orange-500 text-white shadow-orange-200"
                  }`}
                >
                  <FiPlus size={22} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}