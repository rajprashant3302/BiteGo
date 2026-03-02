'use client';

import { ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { setIsCartOpen } = useCart();
  const router = useRouter();

  return (
    <div className="py-40 flex flex-col items-center justify-center text-center px-6">
      <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 border-2 border-gray-100">
        <ShoppingBag className="text-gray-200" size={40} />
      </div>
      <h2 className="text-3xl font-black mb-4">View Your Cart</h2>
      <p className="text-gray-400 font-medium max-w-sm">
        Your cart slides in from the side. Click below to open it.
      </p>
      <Button className="mt-10 h-14 px-10" onClick={() => { router.push('/'); setIsCartOpen(true); }}>
        Open Cart
      </Button>
    </div>
  );
}