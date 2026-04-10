"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DriverSidebar from "../../components/DriverSidebar";

const DRIVER_PATHS = {
  dashboard: "/dashboard",
  profile: "/profile",
  document: "/document",
  settings: "/settings",
};



export default function DriverDocumentPage() {
  const [vehicleData] = useState({
    vehicleType: "Bike",
    brand: "Hero",
    model: "Splendor Plus",
    vehicleNumber: "UP 13 CB 5212",
    color: "Black",
    fuelType: "Petrol",
  });

  const [documents] = useState([
    {
      title: "Driving License",
      number: "DL-478741481527",
      status: "Verified",
      expiry: "12 Dec 2028",
      note: "Approved and active",
    },
    {
      title: "RC Book",
      number: "RC-UP13CB5212",
      status: "Pending",
      expiry: "20 Aug 2027",
      note: "Waiting for verification",
    },
    {
      title: "Insurance",
      number: "INS-23847192",
      status: "Expiring Soon",
      expiry: "19 Apr 2026",
      note: "Renew before due date",
    },
    {
      title: "Pollution Certificate",
      number: "PUC-928173",
      status: "Verified",
      expiry: "02 Sep 2026",
      note: "Valid certificate uploaded",
    },
  ]);

  const stats = useMemo(() => {
    const verified = documents.filter((d) => d.status === "Verified").length;
    const pending = documents.filter((d) => d.status === "Pending").length;
    const expiring = documents.filter((d) => d.status === "Expiring Soon").length;

    return {
      total: documents.length,
      verified,
      pending,
      expiring,
    };
  }, [documents]);



  return (
    <div className="min-h-screen bg-[#FFF9F4]">
      <div className="flex min-h-screen flex-col xl:flex-row">
        <DriverSidebar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <TopBanner />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Documents"
                value={stats.total}
                subtitle="All uploaded records"
                tone="orange"
              />
              <StatCard
                title="Verified"
                value={stats.verified}
                subtitle="Approved documents"
                tone="green"
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                subtitle="Need review"
                tone="blue"
              />
              <StatCard
                title="Expiring Soon"
                value={stats.expiring}
                subtitle="Renew immediately"
                tone="red"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <section className="rounded-[30px] border border-[#EADFCF] bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                        Vehicle Overview
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        Registered Vehicle Details
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Keep your vehicle information accurate for smooth onboarding and delivery approval.
                      </p>
                    </div>

                    <button className="rounded-2xl bg-[#0B1637] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#101f49]">
                      Edit Vehicle Details
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <InfoCard label="Vehicle Type" value={vehicleData.vehicleType} />
                    <InfoCard label="Brand" value={vehicleData.brand} />
                    <InfoCard label="Model" value={vehicleData.model} />
                    <InfoCard label="Vehicle Number" value={vehicleData.vehicleNumber} />
                    <InfoCard label="Color" value={vehicleData.color} />
                    <InfoCard label="Fuel Type" value={vehicleData.fuelType} />
                  </div>
                </section>

                <section className="rounded-[30px] border border-[#EADFCF] bg-white p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600">
                        Uploaded Documents
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        Vehicle & Compliance Records
                      </h2>
                    </div>

                    <button className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-100">
                      Upload New Document
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4">
                    {documents.map((doc, index) => (
                      <DocumentCard key={index} doc={doc} />
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-[30px] border border-[#EADFCF] bg-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">Quick Actions</h3>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href={DRIVER_PATHS.profile}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open My Profile
                    </Link>

                    <Link
                      href={DRIVER_PATHS.dashboard}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Go to Dashboard
                    </Link>

                    <Link
                      href={DRIVER_PATHS.settings}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                    >
                      Open Settings
                    </Link>
                  </div>
                </section>

                <section className="rounded-[30px] border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    Document Health
                  </h3>

                  <div className="mt-5 space-y-3">
                    <MiniRow label="Verification Rate" value="50%" />
                    <MiniRow label="Pending Reviews" value={stats.pending} />
                    <MiniRow label="Expiring Soon" value={stats.expiring} />
                    <MiniRow label="Vehicle Linked" value="Yes" />
                  </div>
                </section>

                <section className="rounded-[30px] border border-red-100 bg-gradient-to-br from-red-50 to-white p-5 sm:p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    Important Reminders
                  </h3>

                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li>• Insurance expiry should be renewed before due date.</li>
                    <li>• Pending documents may delay delivery assignment approvals.</li>
                    <li>• Upload clear images for faster verification.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TopBanner() {
  return (
    <div className="rounded-[32px] border border-[#EADFCF] bg-gradient-to-br from-white via-[#FFFDFB] to-[#FFF6ED] p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600">
            Vehicle & Documents
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
            Manage Vehicle Details
          </h1>
          <p className="mt-2 max-w-2xl text-sm sm:text-base text-slate-500">
            Review your vehicle information, document verification status, and renewal alerts in one place.
          </p>
        </div>

        <button className="rounded-2xl bg-[#0B1637] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#101f49]">
          Refresh Status
        </button>
      </div>
    </div>
  );
}



function StatCard({ title, value, subtitle, tone }) {
  const toneClass =
    tone === "orange"
      ? "border-orange-100 bg-gradient-to-br from-orange-50 to-white"
      : tone === "green"
        ? "border-green-100 bg-gradient-to-br from-green-50 to-white"
        : tone === "blue"
          ? "border-blue-100 bg-gradient-to-br from-blue-50 to-white"
          : "border-red-100 bg-gradient-to-br from-red-50 to-white";

  return (
    <div className={`rounded-[26px] border p-5 shadow-sm ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </p>
      <h3 className="mt-3 text-3xl font-black text-slate-950">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DocumentCard({ doc }) {
  const badgeClass =
    doc.status === "Verified"
      ? "bg-green-100 text-green-700"
      : doc.status === "Pending"
        ? "bg-blue-100 text-blue-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-black text-slate-950">{doc.title}</h3>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}>
              {doc.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">Document No: {doc.number}</p>
          <p className="mt-1 text-sm text-slate-500">Expiry Date: {doc.expiry}</p>
          <p className="mt-3 text-sm font-medium text-slate-700">{doc.note}</p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            View
          </button>
          <button className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100">
            Update
          </button>
        </div>
      </div>
    </div>
  );
}







function MiniRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <span className="text-base font-black text-slate-950">{value}</span>
    </div>
  );
}