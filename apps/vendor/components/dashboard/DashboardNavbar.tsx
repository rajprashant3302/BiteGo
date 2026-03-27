"use client";

type Props = {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export default function DashboardNavbar({
  title = "Vendor Overview",
  subtitle = "Track branch performance, revenue movement, sales momentum, offer efficiency, and payout health.",
  children,
}: Props) {
  return (
    <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#3b2a20] p-6 text-white shadow-xl md:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" />

      <div className="relative">
        <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-200 md:text-base">
          {subtitle}
        </p>
        {children}
      </div>
    </section>
  );
}