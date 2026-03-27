"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiBell,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiPercent,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  match: (pathname: string) => boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SidebarLink({
  href,
  label,
  icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
        active
          ? "bg-[#FF651D] text-white shadow-sm"
          : "text-gray-600 hover:bg-orange-50 hover:text-[#FF651D]"
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
          active
            ? "bg-white/15 text-white"
            : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-[#FF651D]"
        )}
      >
        {icon}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function StatPill({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <p className="mt-1 text-sm font-black text-gray-900">{value}</p>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const userName = useMemo(() => session?.user?.name || "Vendor", [session]);
  const userRole = useMemo(
    () => (session?.user as { role?: string } | undefined)?.role || "Partner",
    [session]
  );

  const pageTitle = useMemo(() => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/dashboard/restaurants")) return "Restaurants";
    if (pathname.startsWith("/dashboard/orders")) return "Orders";
    if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
    if (pathname.startsWith("/dashboard/offers")) return "Offers";
    if (pathname.startsWith("/dashboard/payouts")) return "Payouts";
    return "Dashboard";
  }, [pathname]);

  const navItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <FiGrid size={18} />,
      match: (p) => p === "/dashboard",
    },
    {
      label: "Restaurants",
      href: "/dashboard/restaurants",
      icon: <FiPackage size={18} />,
      match: (p) => p.startsWith("/dashboard/restaurants"),
    },
    {
      label: "Orders",
      href: "/dashboard/orders",
      icon: <FiShoppingBag size={18} />,
      match: (p) => p.startsWith("/dashboard/orders"),
    },
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <FiBarChart2 size={18} />,
      match: (p) => p.startsWith("/dashboard/analytics"),
    },
    {
      label: "Offers",
      href: "/dashboard/offers",
      icon: <FiPercent size={18} />,
      match: (p) => p.startsWith("/dashboard/offers"),
    },
    {
      label: "Payouts",
      href: "/dashboard/payouts",
      icon: <FiCreditCard size={18} />,
      match: (p) => p.startsWith("/dashboard/payouts"),
    },
  ];

  const notifications = [
    {
      title: "Revenue spike detected",
      text: "Patna Central crossed expected dinner-hour performance.",
      icon: <FiTrendingUp size={16} className="text-green-600" />,
    },
    {
      title: "Offer expires soon",
      text: "Weekend Combo campaign is close to expiry.",
      icon: <FiClock size={16} className="text-amber-600" />,
    },
    {
      title: "Payout pending review",
      text: "One branch settlement needs attention.",
      icon: <FiAlertCircle size={16} className="text-red-600" />,
    },
  ];

  const searchSuggestions = [
    "Search branches",
    "Search orders",
    "Search offers",
    "Search payouts",
  ];

  useEffect(() => {
    setMobileOpen(false);
    setShowNotifications(false);
    setShowProfileMenu(false);
    setSearchValue("");
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-white to-orange-50 shadow-sm ring-1 ring-gray-200 transition-transform hover:scale-105">
              <Image
                src="/bitego-logo-complete (2).svg"
                alt="BiteGo Logo"
                width={40}
                height={40}
                className="object-contain scale-300"
                priority
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-black tracking-tight text-gray-900">
                BiteGo Vendor
              </h1>
              <p className="text-sm font-medium text-gray-500">Control panel</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 pb-2 pt-5">
        <p className="px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Navigation
        </p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-6 pt-2">
        {navItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={item.match(pathname)}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-700 shadow-sm">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <aside className="hidden w-[290px] shrink-0 lg:block">{sidebar}</aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                <span className="text-sm font-bold text-gray-700">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700"
                  aria-label="Close menu"
                >
                  <FiX size={18} />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="flex items-center gap-3 px-4 py-4 md:px-6">
              <button
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 lg:hidden"
                aria-label="Open menu"
              >
                <FiMenu size={20} />
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                  Vendor Dashboard
                </p>
                <h2 className="truncate text-2xl font-black tracking-tight text-gray-900">
                  {pageTitle}
                </h2>
              </div>

              <div className="hidden items-center gap-3 xl:flex">
                <div className="relative">
                  <FiSearch
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search branches, orders, offers..."
                    className="h-12 w-96 rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                  />
                  {searchValue && (
                    <div className="absolute left-0 top-14 z-40 w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                      <div className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                        Search for “{searchValue}”
                      </div>
                      <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                        Suggestions
                      </div>
                      {searchSuggestions.map((item) => (
                        <button
                          key={item}
                          onClick={() => setSearchValue(item)}
                          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => {
                      setShowNotifications((prev) => !prev);
                      setShowProfileMenu(false);
                    }}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
                    aria-label="Open notifications"
                  >
                    <FiBell size={18} />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#FF651D]" />
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900">
                          Notifications
                        </h3>
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          Close
                        </button>
                      </div>

                      <div className="space-y-3">
                        {notifications.map((item, index) => (
                          <div
                            key={`${item.title}-${index}`}
                            className="rounded-xl bg-gray-50 p-3"
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5">{item.icon}</div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.title}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  {item.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => {
                      setShowProfileMenu((prev) => !prev);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition hover:bg-gray-50"
                    aria-label="Open profile menu"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF651D]">
                      <FiUser size={18} />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {userName}
                      </p>
                      <p className="text-xs font-medium text-gray-500">
                        {userRole}
                      </p>
                    </div>
                    <FiChevronDown className="text-gray-400" size={16} />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                      <Link
                        href="/dashboard/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                          <FiSettings size={16} />
                        </span>
                        Settings
                      </Link>

                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500">
                          <FiLogOut size={16} />
                        </span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="space-y-5 px-4 py-5 md:px-6">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatPill title="Business Mode" value="Operational" />
                <StatPill title="Access Level" value={userRole} />
                <StatPill title="Current Route" value={pathname} />
                <StatPill title="System Health" value="Stable" />
              </section>

              <div>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}