"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FiArrowLeft, FiMail, FiLock, FiUser, FiLoader } from "react-icons/fi";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract the callbackUrl to redirect after successful registration
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const callbackUrl = rawCallbackUrl || "/profile"; 

  // Forward the callbackUrl back to the Login page if they already have an account
  const loginUrl = rawCallbackUrl 
    ? `/login?callbackUrl=${encodeURIComponent(rawCallbackUrl)}` 
    : `/login`;

  // Removed phone from state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role:"User"
  });
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/register`
        : "http://localhost:5000/api/auth/register";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong during registration.");
      }

      // Automatically log them in after successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (loginResult?.error) {
        router.push(loginUrl);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }

    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.message || "Failed to connect to the server.", 
        success: null 
      });
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
      <div className="order-1 md:order-2 w-full md:w-1/2 relative flex items-center justify-center min-h-[30vh] md:min-h-screen pt-16 md:pt-0">
        
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
        <div className="relative z-10 w-3/5 max-w-xs md:max-w-md lg:max-w-lg flex justify-center md:justify-start md:-ml-6 lg:-ml-12">
          <img 
            src="/register-animate.svg" 
            alt="Create Account Illustration" 
            className="w-full h-auto object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {/* LEFT SIDE ON DESKTOP / BOTTOM SIDE ON MOBILE */}
      <div className="order-2 md:order-1 w-full md:w-1/2 flex flex-col justify-center px-8 py-8 md:py-0 z-20 bg-white md:bg-transparent">
        
        <div className="w-full max-w-md mx-auto">
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 text-center">
            Join BiteGo!
          </h1>
          <p className="text-sm md:text-base text-gray-500 leading-relaxed mb-8 text-center">
            Create an account to start ordering from your favorite local restaurants.
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Full Name Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiUser className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
                  placeholder="Full Name"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
                  placeholder="Email Address"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-sm font-medium"
                  placeholder="Create Password"
                />
              </div>
            </div>

            {/* Status Messages */}
            {status.error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 text-center">
                {status.error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status.loading || !formData.email || !formData.password || !formData.name}
              className="w-full bg-[#FFDBCB] hover:bg-[#FF651D] text-[#D84A00] hover:text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-base shadow-sm mt-2"
            >
              {status.loading ? (
                <>
                  <FiLoader className="animate-spin mr-2" size={20} />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center py-5 w-full">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Google Sign-up Button */}
          <button
            onClick={() => signIn("google", { callbackUrl })}
            type="button"
            className="w-full flex items-center justify-center py-3 px-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all font-bold text-gray-700 shadow-sm text-sm"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="mt-6 text-center w-full">
            <p className="text-gray-600 font-medium text-sm">
              Already have an account?{" "}
              <Link 
                href={loginUrl} 
                className="text-[#FF651D] hover:text-[#D84A00] font-bold transition-colors hover:underline underline-offset-4"
              >
                Log in
              </Link>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="animate-spin text-[#FF651D]" size={40} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}