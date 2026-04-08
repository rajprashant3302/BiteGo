"use client";

import { FiLoader } from "react-icons/fi";

export default function DashboardPageSkeleton({
  title = "Loading dashboard...",
}: {
  title?: string;
}) {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-[#FF651D]">
            <FiLoader className="animate-spin" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-6 w-40 rounded-xl bg-gray-200" />
            <div className="mt-3 h-4 w-72 rounded-xl bg-gray-100" />
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-gray-500">{title}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-28 rounded bg-gray-100" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="h-6 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-60 rounded bg-gray-100" />
          <div className="mt-6 flex h-72 items-end gap-3 rounded-[24px] border border-dashed border-gray-200 p-5">
            {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
              <div key={bar} className="flex flex-1 flex-col items-center gap-3">
                <div
                  className="w-10 rounded-t-[18px] bg-gray-200"
                  style={{ height: `${25 + bar * 8}%` }}
                />
                <div className="h-3 w-8 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {[1, 2].map((box) => (
            <div
              key={box}
              className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="h-6 w-32 rounded bg-gray-200" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((row) => (
                  <div key={row} className="rounded-2xl bg-gray-50 p-4">
                    <div className="h-4 w-32 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-full rounded bg-gray-100" />
                    <div className="mt-2 h-3 w-3/4 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}