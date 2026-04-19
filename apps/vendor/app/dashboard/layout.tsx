"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
  FiLoader,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
  FiVolume2,
  FiVolumeX,
  FiX,
  FiStar
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

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  type?: "warning" | "success" | "time" | "info";
  isRead?: boolean;
  createdAt?: string;
  orderId?: string | null;
  actionUrl?: string | null;
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioReady, setAudioReady] = useState(false);

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const previousIdsRef = useRef<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const userName = useMemo(() => session?.user?.name || "Vendor", [session]);
  const userRole = useMemo(
    () => (session?.user as { role?: string } | undefined)?.role || "Partner",
    [session]
  );

const pageTitle = useMemo(() => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.startsWith("/partner/restaurants")) return "Restaurants";
    if (pathname.startsWith("/dashboard/orders")) return "Orders";
    if (pathname.startsWith("/dashboard/reviews")) return "Feedback"; // <--- ADD THIS LINE
    if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
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
      href: "/partner/restaurants",
      icon: <FiPackage size={18} />,
      match: (p) => p.startsWith("/partner/restaurants"),
    },
    {
      label: "Orders",
      href: "/dashboard/orders",
      icon: <FiShoppingBag size={18} />,
      match: (p) => p.startsWith("/dashboard/orders"),
    },
    {
      label: "Reviews",
      href: "/dashboard/reviews",
      icon: <FiStar size={18} />,
      match: (p) => p.startsWith("/dashboard/reviews"),
    },    
    {
      label: "Analytics",
      href: "/dashboard/analytics",
      icon: <FiBarChart2 size={18} />,
      match: (p) => p.startsWith("/dashboard/analytics"),
    },
    {
      label: "Payouts",
      href: "/dashboard/payouts",
      icon: <FiCreditCard size={18} />,
      match: (p) => p.startsWith("/dashboard/payouts"),
    },
  ];

  const searchSuggestions = [
    "Search branches",
    "Search preparing orders",
    "Search payouts",
  ];

  const setupAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.7;
    }
  }, []);

  const unlockAudio = useCallback(async () => {
    try {
      setupAudio();
      if (!audioRef.current) return;

      audioRef.current.volume = 0;
      audioRef.current.currentTime = 0;

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;

      setAudioReady(true);
    } catch (err) {
      console.warn("Audio unlock blocked:", err);
    }
  }, [setupAudio]);

  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled) return;

    try {
      setupAudio();

      if (!audioRef.current) return;

      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
    } catch (err) {
      console.warn("Notification sound blocked:", err);
    }
  }, [setupAudio, soundEnabled]);

  async function loadNotifications(showSpinner = false) {
    try {
      if (showSpinner) setLoadingNotifications(true);

      const base =
        process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

      const res = await fetch(`${base}/api/notifications`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Notification API failed with ${res.status}`);
      }

      const data = await res.json();
      const rows = Array.isArray(data) ? data : data.notifications || [];

      const currentIds = rows.map((item: NotificationItem) => item.id);
      const previousIds = previousIdsRef.current;

      const hasNewUnread = rows.some(
        (item: NotificationItem) =>
          !item.isRead && !previousIds.includes(item.id)
      );

      if (hasNewUnread && soundEnabled && audioReady) {
        playNotificationSound();
      }

      previousIdsRef.current = currentIds;
      setNotifications(rows);
    } catch (error) {
      console.error("Notification fetch failed", error);
      setNotifications([]);
    } finally {
      if (showSpinner) setLoadingNotifications(false);
    }
  }

  async function markNotificationAsRead(item: NotificationItem) {
    try {
      const base =
        process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

      await fetch(`${base}/api/notifications/${item.id}/read`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === item.id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  }

  useEffect(() => {
    setupAudio();
  }, [setupAudio]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    window.addEventListener("keydown", handleFirstInteraction);
    window.addEventListener("touchstart", handleFirstInteraction);

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, [unlockAudio]);

  useEffect(() => {
    loadNotifications(true);

    const interval = setInterval(() => {
      loadNotifications(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [soundEnabled, audioReady]);

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

  const unreadCount = notifications.filter((item) => !item.isRead).length;

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
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-gray-700 shadow-sm">
          <FiLoader className="animate-spin text-[#FF651D]" size={18} />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(255,101,29,0.08),_transparent_30%),linear-gradient(to_bottom,#f9fafb,#f3f4f6)]">
      <div className="flex min-h-screen">
        <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[290px] lg:shrink-0">
          {sidebar}
        </aside>

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
                    placeholder="Search branches, orders, payouts..."
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

                <button
                  onClick={() => {
                    setSoundEnabled((prev) => !prev);
                    if (!audioReady) unlockAudio();
                  }}
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition",
                    soundEnabled
                      ? "border-orange-200 bg-orange-50 text-[#FF651D]"
                      : "border-gray-200 bg-white text-gray-500"
                  )}
                  title="Toggle notification sound"
                >
                  {soundEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
                </button>

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
                    {unreadCount > 0 ? (
                      <span className="absolute right-2 top-2 min-w-[18px] rounded-full bg-[#FF651D] px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 top-14 z-50 w-[360px] rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900">
                          Notifications
                        </h3>
                        <button
                          onClick={() => loadNotifications(true)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="mb-3 rounded-xl bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                        Sound: {audioReady ? "ready" : "click anywhere once to enable"}
                      </div>

                      <div className="max-h-[420px] space-y-3 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
                            Loading notifications...
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-xl border p-3 transition",
                                item.isRead
                                  ? "border-gray-100 bg-gray-50"
                                  : "border-orange-100 bg-orange-50/50"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5">
                                  {item.type === "warning" ? (
                                    <FiAlertCircle size={16} className="text-amber-600" />
                                  ) : item.type === "success" ? (
                                    <FiTrendingUp size={16} className="text-green-600" />
                                  ) : item.type === "time" ? (
                                    <FiClock size={16} className="text-blue-600" />
                                  ) : (
                                    <FiBell size={16} className="text-[#FF651D]" />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {item.title}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {item.text}
                                  </p>

                                  <div className="mt-3 flex items-center gap-2">
                                    {!item.isRead ? (
                                      <button
                                        onClick={() => markNotificationAsRead(item)}
                                        className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm hover:bg-gray-100"
                                      >
                                        Mark read
                                      </button>
                                    ) : null}

                                    {item.actionUrl ? (
                                      <Link
                                        href={item.actionUrl}
                                        onClick={() => markNotificationAsRead(item)}
                                        className="rounded-xl bg-[#FF651D] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#e75a18]"
                                      >
                                        Open
                                      </Link>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
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
            <div className="px-4 py-6 md:px-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}