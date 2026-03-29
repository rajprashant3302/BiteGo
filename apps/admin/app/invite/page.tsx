"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FiArrowLeft, FiMail, FiLoader, FiChevronDown } from "react-icons/fi";
import toast from "react-hot-toast";

// ── nothing changed below this line except the return/JSX ──

// Roles extracted directly from your Prisma schema
const VALID_ROLES = [
  "RestaurantOwner",
  "DeliveryPartner",
  "User",
  "SuperAdmin",
  "Ops",
  "Support",
];

export default function InviteUser() {
  const router = useRouter();
  const { data: session } = useSession(); // ✅ Grab the NextAuth session

  const [email, setEmail] = useState("");
  const [role, setRole] = useState(VALID_ROLES[0]); // Default to first role
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // ✅ Grab the accessToken from the NextAuth session
    const token = (session?.user as any)?.accessToken;

    console.log("Token : ", token);

    if (!token) {
      toast.error("❌ You must be logged in to send invites.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/invite/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // ✅ Securely passing the session token
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send invitation");
      }

      setMessage("✅ Invitation sent successfully!");
      setEmail(""); // Reset form on success
    } catch (error: any) {
      setMessage("❌ " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ── ONLY THE JSX/UI IS CHANGED BELOW ──

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">

      {/* Top Left Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-gray-600 hover:text-[#FF651D] transition-colors text-sm md:text-base font-semibold z-50"
      >
        <FiArrowLeft className="mr-2" size={20} />
        Back
      </button>

      {/* RIGHT SIDE — Illustration (same as register) */}
      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[30vh] md:min-h-screen pt-16 md:pt-0">

        {/* Organic Background Shape */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div
            className="md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[50%] bg-[#FFF0E6]"
            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}
          />
          <div
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[80%] h-[110%] bg-[#FFF0E6]"
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          />
        </div>

        {/* Same SVG as register page */}
        <div className="relative z-10 w-3/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img
            src="/register-animate.svg"
            alt="Invite Illustration"
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* LEFT SIDE — Form */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center px-8 py-8 md:py-0 z-20 bg-white md:bg-transparent">
        <div className="w-full max-w-md mx-auto">

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 text-center">
            Invite New Member
          </h1>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 text-center">
            Send a secure link to create an account.
          </p>

          <form onSubmit={handleInvite} className="space-y-4">

            {/* Email — same input style as register */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail
                  className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors"
                  size={18}
                />
              </div>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
              />
            </div>

            {/* Role dropdown — same input style as register */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors"
                  width={18} height={18} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full pl-11 pr-10 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium appearance-none"
              >
                {VALID_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/([A-Z])/g, " $1").trim()} {/* Adds spacing e.g. "Super Admin" */}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                <FiChevronDown size={18} />
              </div>
            </div>

            {/* Status message — same style as register */}
            {message && (
              <div className={`p-3 rounded-xl text-sm font-semibold border text-center ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-700 border-green-100"
                  : "bg-red-50 text-red-700 border-red-100"
              }`}>
                {message}
              </div>
            )}

            {/* Submit button — identical to register */}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#FFDBCB] hover:bg-[#FF651D] text-[#D84A00] hover:text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm mt-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={20} />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}