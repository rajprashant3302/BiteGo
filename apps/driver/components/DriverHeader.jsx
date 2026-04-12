"use client";

export default function DriverHeader({
    title,
    subtitle,
    onRefresh,
    refreshing,
}) {
    return (
        <div className="rounded-[32px] border border-[#EADFCF] bg-gradient-to-br from-white via-[#FFFDFB] to-[#FFF6ED] p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
                        Driver Profile
                    </span>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                        {title}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-500">
                        {subtitle}
                    </p>
                </div>

                <button
                    onClick={onRefresh}
                    disabled={refreshing}
                    className="rounded-2xl bg-[#0B1637] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#101f49] disabled:opacity-60"
                >
                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>
        </div>
    );
}