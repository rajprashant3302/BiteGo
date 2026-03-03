'use client';

import { ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

export default function CartPage() {
  const { setIsCartOpen } = useCart();

  return (
    <div className="py-40 flex flex-col items-center justify-center text-center px-6">
       <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 border-2 border-gray-100">
         <ShoppingBag className="text-gray-200" size={40} />
       </div>
       <h2 className="text-3xl font-black mb-4">View Your Cart</h2>
       <p className="text-gray-400 font-medium max-w-sm">
         Your basket items will appear here. Click to open the slider.
       </p>
       <Button className="mt-10 h-14 px-10" onClick={() => setIsCartOpen(true)}>
         Open Side Cart
       </Button>
    </div>
  );
}