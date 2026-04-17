"use client";

import { motion } from "framer-motion";
import { Package } from "lucide-react";

export default function OrderScanning() {
  return (
    <div className="flex flex-col items-center justify-center mt-20">

      {/* RADAR ANIMATION */}
      <div className="relative w-40 h-40 flex items-center justify-center">

        {/* OUTER PULSE */}
        <motion.div
          className="absolute w-full h-full rounded-full bg-orange-400/20"
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* INNER PULSE */}
        <motion.div
          className="absolute w-28 h-28 rounded-full bg-orange-400/30"
          animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* CENTER ICON */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg">
          <Package className="text-white" size={24} />
        </div>
      </div>

      {/* TEXT */}
      <h2 className="mt-6 text-lg font-black text-gray-800">
        Scanning for orders...
      </h2>

      <p className="text-sm text-gray-400 mt-1">
        Stay online to receive delivery requests 🚀
      </p>
    </div>
  );
}