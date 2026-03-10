'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Wallet } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function SuccessPage() {
  const router = useRouter();
  const params = useParams();

  const orderId = params.orderId;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full text-center"
      >

        <div className="w-24 h-24 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-green-600 shadow-xl shadow-green-50">
          <CheckCircle2 size={48} strokeWidth={3} />
        </div>

        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">
          Order Confirmed!
        </h1>

        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-10">
          Order ID: #{orderId.slice(-6).toUpperCase()}
        </p>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden text-left shadow-2xl shadow-slate-200"
        >

          <div className="absolute -right-4 -top-4 text-white/5 rotate-12">
            <Wallet size={120} />
          </div>

          <div className="relative z-10">
            <div className="bg-yellow-400 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full inline-block mb-4 uppercase">
              Loyalty Bonus Unlocked
            </div>

            <h3 className="text-2xl font-black text-white leading-tight">
              10% BiteCoins <br/> are on the way!
            </h3>

            <p className="text-slate-400 text-sm mt-2 font-medium">
              We've credited the points to your pending balance.
              They'll be active once your food arrives!
            </p>
          </div>

        </motion.div>

        <div className="grid grid-cols-1 gap-4">

          <Button
            className="h-16 rounded-2xl text-lg shadow-xl shadow-orange-100"
            onClick={() => router.push(`/orders/${orderId}`)}
          >
            Track My Order <ArrowRight className="ml-2" size={20} />
          </Button>

          <Button
            variant="ghost"
            className="text-slate-400 font-bold"
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>

        </div>
      </motion.div>
    </div>
  );
}