"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiArrowLeft, FiMail, FiLock, FiLoader } from "react-icons/fi";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 1. Extract the callbackUrl from the browser's address bar
  const rawCallbackUrl = searchParams.get("callbackUrl");
  // Default to /profile if no callbackUrl is provided
  const callbackUrl = rawCallbackUrl || "/profile"; 

  // Construct links to pass the callbackUrl forward
  const forgotPasswordUrl = rawCallbackUrl 
    ? `/driver/reset-password?callbackUrl=${encodeURIComponent(rawCallbackUrl)}` 
    : `/driver/reset-password`;
    
  const registerUrl = rawCallbackUrl 
    ? `/driver/register?callbackUrl=${encodeURIComponent(rawCallbackUrl)}` 
    : `/driver/register`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ loading: false, error: null });

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null });

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setStatus({ loading: false, error: "Invalid email or password." });
      } else {
        // 2. Redirect to the callbackUrl (or /profile) on success
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setStatus({ loading: false, error: "Something went wrong. Please try again." });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white font-sans relative overflow-hidden">
      
      {/* Top Left Navigation (Back Button) */}
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center text-gray-600 hover:text-[#FF651D] transition-colors text-sm md:text-base font-semibold z-50"
      >
        <FiArrowLeft className="mr-2" size={20} />
        Back
      </button>

      {/* RIGHT SIDE ON DESKTOP / TOP SIDE ON MOBILE */}
      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[40vh] md:min-h-screen pt-16 md:pt-0">
        
        {/* Organic Background Shape */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div 
            className="md:hidden absolute top-[-5%] left-[-10%] w-[120%] h-[50%] bg-[#FFF0E6]"
            style={{ borderRadius: "0 0 50% 50% / 0 0 30% 30%" }}
          ></div>
          <div 
            className="hidden md:block absolute top-[-10%] right-[-5%] w-[80%] h-[110%] bg-[#FFF0E6]"
            style={{ borderRadius: "70% 0% 0% 40% / 60% 0% 0% 50%" }}
          ></div>
        </div>

        {/* The Animated SVG Illustration */}
        <div className="relative z-10 w-4/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img 
            src="/login-animate.svg" 
            alt="Login Illustration" 
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* LEFT SIDE ON DESKTOP / BOTTOM SIDE ON MOBILE */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:py-0 z-20 bg-white md:bg-transparent">
        
        {/* Changed from right-aligned (md:mr-12) to strictly centered (mx-auto) */}
        <div className="w-full max-w-md mx-auto">
          
          {/* Added text-center to heading and paragraph */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4 text-center">
            Welcome Back! , Driver
          </h1>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed mb-8 text-center">
            Log in to your BiteGo account to explore top restaurants and track your orders.
          </p>

          <form onSubmit={handleCredentialsLogin} className="space-y-5">
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

            {/* Password Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="Password"
                />
              </div>
              
              {/* 3. Forward the callbackUrl to Forgot Password */}
              <div className="flex justify-end mt-2">
                <Link 
                  href={forgotPasswordUrl} 
                  className="text-sm font-semibold text-[#FF651D] hover:text-[#D84A00] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Status Messages */}
            {status.error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 text-center">
                {status.error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={status.loading || !email || !password}
              className="w-full bg-[#FFDBCB] hover:bg-[#FF651D] text-[#D84A00] hover:text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-sm"
            >
              {status.loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={22} />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* 5. Forward the callbackUrl to the Register page (Forced text-center) */}
          <div className="mt-8 text-center w-full">
            <p className="text-gray-600 font-medium text-sm md:text-base">
              Don't have an account?{" "}
              <Link 
                href={registerUrl} 
                className="text-[#FF651D] hover:text-[#D84A00] font-bold transition-colors hover:underline underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// 6. Wrap the component in <Suspense> to satisfy Next.js build requirements
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}