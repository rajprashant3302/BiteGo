"use client";

import { cn } from "./utils";

type Props = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export default function FilterChip({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl px-4 py-2 text-sm font-bold transition",
        active
          ? "bg-[#FF651D] text-white shadow-sm"
          : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-orange-50 hover:text-[#FF651D]"
      )}
    >
      {label}
    </button>
  );
}