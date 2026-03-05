"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DEALS } from "@/data/deals";
import { cn } from "@/components/ui/cn";

export default function DealsBanner() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1200);
    } catch (e) {
      console.error("Clipboard copy failed:", e);

      // fallback (older browsers)
      try {
        const ta = document.createElement("textarea");
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 1200);
      } catch (err) {
        console.error("Fallback copy failed:", err);
      }
    }
  };

  return (
    <section>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        {DEALS.map((deal) => {
          const Icon = deal.icon;
          const isCopied = copiedCode === deal.code;

          return (
            <motion.div
              whileHover={{ y: -4 }}
              key={deal.id}
              className="relative flex-shrink-0 w-[280px] sm:w-[320px] rounded-[32px] overflow-hidden cursor-pointer select-none group shadow-lg"
              onClick={() => copyCode(deal.code)}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", deal.gradient)} />
              <div className="absolute inset-0 bg-black/5" />

              <div className="relative p-7 h-full flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                    <Icon size={24} className="text-white" />
                  </div>

                  <span className="text-[10px] font-black text-white/80 bg-black/10 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">
                    {deal.expiry}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-black text-2xl leading-tight mb-1">
                    {deal.title}
                  </h3>
                  <p className="text-white/80 text-sm font-bold">
                    {deal.subtitle}
                  </p>
                </div>

                <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20 group-hover:bg-white/25 transition-all">
                  <span className="text-white font-black tracking-[0.2em] text-sm uppercase">
                    {deal.code}
                  </span>

                  <span className="text-[10px] font-black text-white/90 uppercase bg-black/20 px-3 py-1.5 rounded-xl">
                    {isCopied ? "Copied!" : "Copy"}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}