"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMail, FiLoader } from "react-icons/fi";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
     const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
  ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/reset-password`
  : "http://auth-service:5000/api/auth/reset-password";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      setStatus({ 
        loading: false, 
        error: null, 
        success: data.message || "If this email exists, a reset link has been sent." 
      });
      setEmail(""); 

    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.message, 
        success: null 
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">
      
      
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-gray-600 hover:text-[#FF651D] transition-colors text-sm md:text-base font-semibold z-50"
      >
        <FiArrowLeft className="mr-2" size={20} />
        Back
      </button>

      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[40vh] md:min-h-screen pt-16 md:pt-0">
        
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          
          {/* Mobile Shape */}
          <div 
            className="md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[50%] bg-[#FFF0E6]"
            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}
          ></div>
          
          {/* Desktop Shape */}
          <div 
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[60%] h-[90%] bg-[#FFF0E6]"
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          ></div>
          
        </div>

        <div className="relative z-10 w-4/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img 
            src="/forgot-password-animate.svg" 
            alt="Forgot Password Illustration" 
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center px-8  md:py-0 z-20 bg-white md:bg-transparent">
        
        <div className="w-full max-w-md mx-auto md:ml-auto md:mr-12 lg:mr-24">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Forgot Password ?
          </h1>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-10">
            No worries! Enter the email address associated with your account and we'll send you a secure reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Status Messages */}
            {status.error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100">
                {status.error}
              </div>
            )}
            {status.success && (
              <div className="p-4 bg-[#FFF0E6] text-[#D84A00] rounded-xl text-sm font-semibold border border-[#FFDBCB]">
                {status.success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status.loading || !email}
              className="w-full bg-[#FFDBCB] hover:bg-[#FF651D] text-[#D84A00] hover:text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-sm"
            >
              {status.loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={22} />
                  Processing...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center md:text-left">
            <p className="text-gray-600 font-medium text-sm md:text-base">
              Remember your password?{" "}
              <Link 
                href="/login" 
                className="text-[#FF651D] hover:text-[#D84A00] font-bold transition-colors hover:underline underline-offset-4"
              >
                Go to login
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}