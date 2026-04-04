"use client";

import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";

export default function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-red-100 bg-red-50 p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-red-500 shadow-sm">
        <FiAlertTriangle size={24} />
      </div>
      <h2 className="mt-4 text-lg font-black text-red-700">Something went wrong</h2>
      <p className="mt-2 text-sm text-red-600">{message}</p>

      {onRetry ? (
        <button
          onClick={onRetry}
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-red-600 shadow-sm hover:bg-red-100"
        >
          <FiRefreshCw size={16} />
          Retry
        </button>
      ) : null}
    </div>
  );
}