"use client";

import { cn } from "./utils";

type Props = {
  title: string;
  value: string;
  delta: string;
  deltaType: "up" | "down" | "neutral";
  description: string;
  icon: React.ReactNode;
  tone: "orange" | "green" | "blue" | "purple";
};

export default function MetricCard({
  title,
  value,
  delta,
  deltaType,
  description,
  icon,
  tone,
}: Props) {
  const toneMap = {
    orange: "bg-orange-50 text-[#FF651D]",
    green: "bg-green-50 text-green-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
  };

  const deltaMap = {
    up: "bg-green-100 text-green-700",
    down: "bg-red-100 text-red-700",
    neutral: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="group rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-900">
            {value}
          </h3>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl transition group-hover:scale-105",
            toneMap[tone]
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", deltaMap[deltaType])}>
          {delta}
        </span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
    </div>
  );
}