"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { useCart } from "@/context/CartContext";

const TIMES = [
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "12:00 - 12:30",
  "13:00 - 13:30",
  "18:00 - 18:30",
  "19:00 - 19:30",
  "20:00 - 20:30",
];

export default function ScheduleModal() {
  const { isScheduleOpen, setIsScheduleOpen, setDeliveryMode, setScheduledTime } =
    useCart();

  const days = useMemo(() => ["Today", "Tomorrow", "Wed", "Thu", "Fri"], []);
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTime, setSelectedTime] = useState("");

  const close = () => setIsScheduleOpen(false);

  return (
    <AnimatePresence>
      {isScheduleOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed bottom-0 left-0 right-0 z-[410] bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  Schedule Delivery
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Get it right when you need it
                </p>
              </div>
              <button
                onClick={close}
                className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                type="button"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">
              Select Day
            </p>
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "flex-shrink-0 px-6 py-3 rounded-2xl text-sm font-black transition-all border-2",
                    selectedDate === d
                      ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-200"
                      : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                  )}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">
              Select Time Window
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={cn(
                    "py-4 rounded-2xl text-sm font-black transition-all border-2",
                    selectedTime === t
                      ? "border-orange-500 bg-orange-50 text-orange-600"
                      : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200 hover:bg-white"
                  )}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>

            <Button
              onClick={() => {
                if (!selectedTime) return;
                setScheduledTime(`${selectedDate} • ${selectedTime}`);
                setDeliveryMode("scheduled");
                close();
              }}
              disabled={!selectedTime}
              className="w-full h-16 rounded-[24px] text-lg"
            >
              {selectedTime
                ? `Deliver ${selectedDate} at ${selectedTime}`
                : "Pick a time"}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}