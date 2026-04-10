"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
const DRIVER_PATHS = {
    login: "/driver/login",
    dashboard: "/dashboard",
    profile: "/profile",
    document: "/document",
    settings: "/settings",
    history: "/driver/history",
    earnings: "/driver/earnings",
    wallet: "/driver/wallet",
};


export default function DriverSidebar() {
    const pathname = usePathname();

    const items = [
        { label: "Dashboard", href: DRIVER_PATHS.dashboard, emoji: "🏠" },
        { label: "Profile", href: DRIVER_PATHS.profile, emoji: "👤" },
        { label: "Vehicle & Docs", href: DRIVER_PATHS.document, emoji: "🪪" },
        { label: "Settings", href: DRIVER_PATHS.settings, emoji: "⚙️" },
    ];

    return (
        <>
            <aside className="hidden xl:flex xl:w-[290px] shrink-0">
                <div className="sticky top-0 h-screen w-full border-r border-[#EADFCF] bg-[#FFF9F4] px-5 py-6">
                    <div className="rounded-[28px] border border-orange-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-2xl">
                                🛵
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">BiteGo Driver</h2>
                                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                                    Partner Panel
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="mt-8 space-y-2">
                        {items.map((item) => {
                            const active = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${active
                                            ? "bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.22)]"
                                            : "bg-white text-slate-700 hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-100"
                                        }`}
                                >
                                    <span className="text-lg">{item.emoji}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-8 rounded-[24px] border border-orange-100 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                            Driver Tips
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            <li>• Go online to start receiving orders</li>
                            <li>• Keep documents updated</li>
                            <li>• Refresh profile for latest stats</li>
                        </ul>
                    </div>
                </div>
            </aside>

            <div className="xl:hidden border-b border-[#EADFCF] bg-[#FFF9F4] px-4 py-3">
                <div className="flex gap-2 overflow-x-auto">
                    {items.map((item) => {
                        const active = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${active
                                        ? "bg-orange-500 text-white"
                                        : "bg-white text-slate-700 border border-orange-100"
                                    }`}
                            >
                                {item.emoji} {item.label}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
}