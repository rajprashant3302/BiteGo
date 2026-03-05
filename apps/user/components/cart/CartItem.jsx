"use client";

import { motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartItem({ item }) {
  const { addToCart, removeFromCart, removeItem } = useCart();

  if (!item) return null;

  const price = Number(item.Price);
  const safePrice = Number.isFinite(price) ? price : 0;

  return (
    <motion.div layout className="flex gap-4 group">
      <img
        src={item.ItemImageURL || "/placeholder-food.png"}
        alt={item.ItemName}
        className="w-24 h-24 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
      />

      <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
        <div className="min-w-0">
          <h4 className="font-black text-gray-900 leading-tight mb-1 line-clamp-1">
            {item.ItemName}
          </h4>

          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-black text-sm">
              ₹{safePrice.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5">
            <button
              type="button"
              onClick={() => removeFromCart(item.ItemID)}
              className="text-gray-400 hover:text-orange-500 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>

            <span className="text-sm font-black w-4 text-center">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={() => addToCart(item)}
              disabled={
                Number.isFinite(Number(item.AvailableQuantity)) &&
                item.quantity >= Number(item.AvailableQuantity)
              }
              className="text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-30"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* ✅ Trash removes item completely */}
          <button
            type="button"
            onClick={() => removeItem(item.ItemID)}
            className="text-gray-300 hover:text-red-500 p-2 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}