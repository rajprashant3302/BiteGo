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
  const callbackUrl = rawCallbackUrl || "/"; 

  // Construct links to pass the callbackUrl forward
  const forgotPasswordUrl = rawCallbackUrl 
    ? `/reset-password?callbackUrl=${encodeURIComponent(rawCallbackUrl)}` 
    : `/reset-password`;
    
  const registerUrl = rawCallbackUrl 
    ? `/register?callbackUrl=${encodeURIComponent(rawCallbackUrl)}` 
    : `/register`;

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
            Welcome Back!
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

          {/* Divider */}
          <div className="relative flex items-center py-6 w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">Or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* 4. Pass the callbackUrl directly to NextAuth's Google provider */}
          <button
            onClick={() => signIn("google", { callbackUrl })}
            type="button"
            className="w-full flex items-center justify-center py-3.5 px-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all font-bold text-gray-700 shadow-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

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