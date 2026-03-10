'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Clock, MapPin, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function OrdersPage() {
  const router = useRouter();
  const { user, status } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      fetch(`${process.env.NEXT_PUBLIC_ORDER_SERVICE_URL}/api/orders/user/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setOrders(data);
          setLoading(false);
        });
    }
  }, [user?.id, status]);

  if (loading) return <div className="min-h-screen bg-slate-50 p-12 animate-pulse" />;

  return (
    <main className="min-h-screen bg-slate-50 pt-12 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        <header className="flex items-center gap-6 mb-12">
          <button onClick={() => router.push('/')} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:text-orange-500 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Orders</h1>
        </header>

        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
              <ShoppingBag className="mx-auto text-slate-200 mb-4" size={48} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders yet</p>
            </div>
          ) : (
            orders.map((order, idx) => (
              <motion.div
                key={order.OrderID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => router.push(`/orders/${order.OrderID}`)}
                className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 cursor-pointer hover:border-orange-200 transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl">
                      {order.restaurant?.Name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-orange-500 transition-colors">
                        {order.restaurant?.Name}
                      </h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {order.items.length} Items • ₹{parseFloat(order.TotalAmount).toFixed(0)}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-black px-3 py-1 bg-slate-50 text-slate-500 rounded-full uppercase">
                        <Clock size={12} /> {new Date(order.OrderDateTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                    order.OrderStatus === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {order.OrderStatus}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}