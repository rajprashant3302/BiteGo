"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiArrowLeft, FiMail, FiLock, FiUser, FiPhone, FiLoader } from "react-icons/fi";

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Page States
  const [pageStatus, setPageStatus] = useState<"loading" | "valid" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  // 1. Verify token when page loads
  useEffect(() => {
    if (!token) {
      setPageStatus("error");
      setErrorMessage("No invitation token found in the URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/invite/verify?token=${token}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Invalid or expired link");

        // Token is valid! Set the email and role from the decoded token
        setEmail(data.email);
        setRole(data.role);
        setPageStatus("valid");
      } catch (err: any) {
        setPageStatus("error");
        setErrorMessage(err.message);
      }
    };

    verifyToken();
  }, [token, BACKEND_URL]);

  // 2. Handle final form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name,
          phone,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create account");

      // Replace the form with a success message
      setPageStatus("success" as any);
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── ONLY THE JSX BELOW IS CHANGED ──

  // UI: Loading State
  if (pageStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF651D]" />
      </div>
    );
  }

  // UI: Error State (Expired or Invalid Token)
  if (pageStatus === "error") {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">
        {/* Blob */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[55%] h-[110%] bg-[#FFF0E6]"
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          />
        </div>
        <div className="relative z-10 m-auto text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-500 mb-6 text-sm">{errorMessage}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-[#FF651D] font-semibold hover:underline text-sm"
          >
            Go to Login →
          </button>
        </div>
      </div>
    );
  }

  // UI: Success State
  if (pageStatus === "success" as any) {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[55%] h-[110%] bg-[#FFF0E6]"
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          />
        </div>
        <div className="relative z-10 m-auto text-center p-8 max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  // UI: The Registration Form
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">

      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-gray-600 hover:text-[#FF651D] transition-colors text-sm md:text-base font-semibold z-50"
      >
        <FiArrowLeft className="mr-2" size={20} />
        Back
      </button>

      {/* RIGHT SIDE — Illustration */}
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

        <div className="relative z-10 w-3/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img
            src="/register-animate.svg"
            alt="Join BiteGo"
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* LEFT SIDE — Form */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center px-8 py-8 md:py-0 z-20 bg-white md:bg-transparent">
        <div className="w-full max-w-md mx-auto">

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 text-center">
            Join BiteGo!
          </h1>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 text-center">
            You've been invited as a{" "}
            <span className="font-bold text-[#FF651D]">{role}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email — locked */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiMail className="text-gray-300" size={18} />
              </div>
              <input
                type="email"
                value={email}
                disabled
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-400 bg-gray-50 cursor-not-allowed text-sm font-medium"
              />
            </div>

            {/* Full Name */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiUser className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
              </div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
              />
            </div>

            {/* Phone */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiPhone className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
              </div>
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                pattern="[0-9]{10}"
                value={phone}
                required
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
              </div>
              <input
                type="password"
                placeholder="Create Password"
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FiLock className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
              </div>
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                required
                minLength={6}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
              />
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 text-center">
                ❌ {errorMessage}
              </div>
            )}

            {/* Submit — same style as register */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FFDBCB] hover:bg-[#FF651D] text-[#D84A00] hover:text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm mt-2"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={20} />
                  Creating Account...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

// Wrap in Suspense because useSearchParams causes client-side de-opt in Next.js
export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF651D]" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}