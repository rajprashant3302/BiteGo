'use client';

import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  if (!item) return null;

  return (
    <motion.div layout className="flex gap-4 group">
      <img
        src={item.image}
        alt={item.name}
        className="w-24 h-24 rounded-2xl object-cover shadow-sm ring-1 ring-gray-100"
      />
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-black text-gray-900 leading-tight mb-1">{item.name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-black text-sm">${item.price.toFixed(2)}</span>
            {item.offer && (
              <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">
                {item.offer}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5">
            <button
              onClick={() => updateQuantity(item.id, -1)}
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, 1)}
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            className="text-gray-300 hover:text-red-500 p-2 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}