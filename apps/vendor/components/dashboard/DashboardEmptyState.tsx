"use client";

import { FiInbox } from "react-icons/fi";

export default function DashboardEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[#FF651D]">
        <FiInbox size={26} />
      </div>
      <h2 className="mt-4 text-xl font-black text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}