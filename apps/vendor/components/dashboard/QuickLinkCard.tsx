"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function QuickLinkCard({ href, title, description, icon }: Props) {
  return (
    <Link
      href={href}
      className="group rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E6] text-[#FF651D]">
          {icon}
        </div>
        <FiArrowRight className="mt-1 text-gray-400 transition group-hover:text-[#FF651D]" />
      </div>

      <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-gray-500">{description}</p>
    </Link>
  );
}