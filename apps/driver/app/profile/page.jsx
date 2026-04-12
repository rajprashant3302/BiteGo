"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import DriverHeader from "../../components/DriverHeader";
import DriverSidebar from "../../components/DriverSidebar";
import DriverWidgets from "../../components/DriverWidgets";
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


export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState("");

    const BACKEND_URL =
        process.env.NEXT_PUBLIC_DELIVERY_SERVICE_URL || "http://localhost:5004";

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(DRIVER_PATHS.login);
        }
    }, [status, router]);

    const fetchProfile = async (refreshOnly = false) => {
        try {
            setError("");

            if (!session?.user?.accessToken) {
                setLoading(false);
                return;
            }

            if (refreshOnly) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await fetch(`${BACKEND_URL}/driver/profile-summary`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.user.accessToken}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to load profile");
            }

            setProfile(data.profile || null);
            setStats(data.stats || null);
        } catch (err) {
            console.error(err);
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchProfile();
        }
    }, [status, session]);

    const handleToggleAvailability = async () => {
        if (!profile || !session?.user?.accessToken) return;

        try {
            setToggleLoading(true);
            setError("");

            const response = await fetch(`${BACKEND_URL}/driver/availability`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.user.accessToken}`,
                },
                body: JSON.stringify({
                    isAvailable: !profile.isAvailable,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update availability");
            }

            setProfile((prev) => {
                if (!prev) return prev;
                return { ...prev, isAvailable: data.isAvailable };
            });
        } catch (err) {
            console.error(err);
            setError(err.message || "Could not update availability");
        } finally {
            setToggleLoading(false);
        }
    };

    const widgets = useMemo(() => {
        return [
            {
                title: "Today's Earnings",
                value: `₹${stats?.todayEarnings ?? 0}`,
                subtitle: "Income earned today",
                tone: "orange",
            },
            {
                title: "Deliveries Today",
                value: stats?.todayDeliveries ?? 0,
                subtitle: "Completed today",
                tone: "green",
            },
            {
                title: "Active Orders",
                value: stats?.activeOrders ?? 0,
                subtitle: "Currently in progress",
                tone: "blue",
            },
            {
                title: "Total Earnings",
                value: `₹${stats?.totalEarnings ?? 0}`,
                subtitle: "Overall earnings",
                tone: "purple",
            },
        ];
    }, [stats]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-[#FFF9F4]">
                <DriverSidebar />
                <div className="p-6">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <div className="h-36 animate-pulse rounded-[32px] bg-slate-200" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                            <div className="h-36 animate-pulse rounded-[26px] bg-slate-200" />
                            <div className="h-36 animate-pulse rounded-[26px] bg-slate-200" />
                            <div className="h-36 animate-pulse rounded-[26px] bg-slate-200" />
                            <div className="h-36 animate-pulse rounded-[26px] bg-slate-200" />
                        </div>
                        <div className="h-96 animate-pulse rounded-[32px] bg-slate-200" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF9F4]">
            <div className="flex min-h-screen flex-col xl:flex-row">
                <DriverSidebar />

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl space-y-6">
                        <DriverHeader
                            title={profile?.name || session?.user?.name || "Driver Profile"}
                            subtitle="Manage your partner profile, live availability, and delivery performance in one place."
                            onRefresh={() => fetchProfile(true)}
                            refreshing={refreshing}
                        />

                        {error ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                {error}
                            </div>
                        ) : null}

                        <DriverWidgets items={widgets} />

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                            <div className="rounded-[32px] border border-[#EADFCF] bg-white p-5 sm:p-6 shadow-sm">
                                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 text-4xl font-black text-orange-600">
                                            {profile?.profilePic ? (
                                                <img
                                                    src={profile.profilePic}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                (profile?.name || "D").charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        <div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
                                                {profile?.name || "BiteGo Partner"}
                                            </h2>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {profile?.email || "No email available"}
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                    {profile?.role || "DeliveryPartner"}
                                                </span>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-bold ${profile?.isAvailable
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {profile?.isAvailable ? "Online" : "Offline"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleToggleAvailability}
                                        disabled={toggleLoading}
                                        className={`rounded-2xl px-5 py-3 text-sm font-bold text-white transition disabled:opacity-60 ${profile?.isAvailable
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-[#0B1637] hover:bg-[#101f49]"
                                            }`}
                                    >
                                        {toggleLoading
                                            ? "Updating..."
                                            : profile?.isAvailable
                                                ? "Set Offline"
                                                : "Set Online"}
                                    </button>
                                </div>

                                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <InfoCard label="Email" value={profile?.email || "Not available"} />
                                    <InfoCard label="Phone" value={profile?.phone || "Not available"} />
                                    <InfoCard label="Vehicle Number" value={profile?.vehicleNumber || "Not added"} />
                                    <InfoCard label="License Number" value={profile?.licenseNumber || "Not added"} />
                                    <InfoCard
                                        label="Current Latitude"
                                        value={
                                            profile?.currentLatitude !== null &&
                                                profile?.currentLatitude !== undefined
                                                ? String(profile.currentLatitude)
                                                : "Not available"
                                        }
                                    />
                                    <InfoCard
                                        label="Current Longitude"
                                        value={
                                            profile?.currentLongitude !== null &&
                                                profile?.currentLongitude !== undefined
                                                ? String(profile.currentLongitude)
                                                : "Not available"
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="rounded-[32px] border border-[#EADFCF] bg-white p-5 sm:p-6 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-950">
                                        Performance Summary
                                    </h3>

                                    <div className="mt-5 space-y-3">
                                        <MiniRow label="Deliveries Today" value={stats?.todayDeliveries ?? 0} />
                                        <MiniRow label="Active Orders" value={stats?.activeOrders ?? 0} />
                                        <MiniRow label="Completed Deliveries" value={stats?.totalDeliveries ?? 0} />
                                        <MiniRow label="Today's Earnings" value={`₹${stats?.todayEarnings ?? 0}`} />
                                        <MiniRow label="Total Earnings" value={`₹${stats?.totalEarnings ?? 0}`} />
                                    </div>
                                </div>

                                <div className="rounded-[32px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-6 shadow-sm">
                                    <h3 className="text-lg font-black text-slate-950">Quick Actions</h3>

                                    <div className="mt-5 grid gap-3">
                                        <Link
                                            href={DRIVER_PATHS.document}
                                            className="rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-orange-50"
                                        >
                                            Manage Vehicle & Documents
                                        </Link>

                                        <Link
                                            href={DRIVER_PATHS.settings}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Open Settings
                                        </Link>

                                        <Link
                                            href={DRIVER_PATHS.dashboard}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                        >
                                            Go to Dashboard
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}




function InfoCard({ label, value }) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                {label}
            </p>
            <p className="mt-2 break-all text-base font-semibold text-slate-950">
                {value}
            </p>
        </div>
    );
}






function MiniRow({ label, value }) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span className="text-sm font-medium text-slate-500">{label}</span>
            <span className="text-base font-black text-slate-950">{value}</span>
        </div>
    );
}