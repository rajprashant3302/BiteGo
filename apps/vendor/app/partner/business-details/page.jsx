"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  FiArrowLeft, FiFileText, FiCreditCard, 
  FiHash, FiLoader, FiCheckCircle, FiAlertCircle 
} from "react-icons/fi";

export default function BusinessDetailsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    panNumber: "",
    bankAccountNo: "",
    ifsc: "",
  });

  const [isFetching, setIsFetching] = useState(true);
  const [reqStatus, setReqStatus] = useState({ loading: false, error: null, success: null });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
            ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/partner/business-details/${session.user.id}` 
            : `http://localhost:5000/api/auth/partner/business-details/${session.user.id}`;
          
          const response = await fetch(apiUrl);
          
          if (response.ok) {
            const data = await response.json();
            if (data) {
              setFormData({
                panNumber: data.PANNumber || "",
                bankAccountNo: data.BankAccountNo || "",
                ifsc: data.IFSC || "",
              });
            }
          }
        } catch (error) {
          console.error("Error fetching business details:", error);
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchBusinessDetails();
  }, [status, session]);

  const handleChange = (e) => {
    const value = e.target.id === 'bankAccountNo' ? e.target.value : e.target.value.toUpperCase();
    setFormData({ ...formData, [e.target.id]: value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setReqStatus({ loading: true, error: null, success: null });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL 
        ? `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/partner/business-details` 
        : "http://localhost:5000/api/auth/partner/business-details"; 

      const response = await fetch(apiUrl, {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          panNumber: formData.panNumber,
          bankAccountNo: formData.bankAccountNo,
          ifsc: formData.ifsc,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save business details.");
      }

      setReqStatus({ loading: false, error: null, success: "Business details securely saved!" });

      setTimeout(() => {
        router.push("/vendor/settings");
        router.refresh();
      }, 1500);

    } catch (error) {
      setReqStatus({ 
        loading: false, 
        error: error.message || "Something went wrong.", 
        success: null 
      });
    }
  };

  const isPageLoading = status === "loading" || status === "unauthenticated" || isFetching;

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-12 font-sans">
      <div className="max-w-xl mx-auto px-4 sm:px-0">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-50 bg-white">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-[#FF651D] transition-colors font-semibold text-sm"
            >
              <FiArrowLeft className="mr-2" size={18} />
              Back
            </button>
            <h1 className="text-lg font-bold text-gray-900">Business Details</h1>
            <div className="w-16"></div> 
          </div>

          <div className="px-6 py-8 sm:px-10">
            
            <div className="mb-8">
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">Legal & Financial Info</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                We need your PAN and Bank details to process your restaurant payouts securely. This information is encrypted.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">PAN Number</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiFileText className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                    </div>
                    <input
                      id="panNumber"
                      type="text"
                      required
                      maxLength={10}
                      value={formData.panNumber}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium uppercase tracking-wider"
                      placeholder="ABCDE1234F"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bank Account Number</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiCreditCard className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                    </div>
                    <input
                      id="bankAccountNo"
                      type="text"
                      required
                      value={formData.bankAccountNo}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium"
                      placeholder="Enter account number"
                    />
                  </div>
                )}
              </div>


              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Bank IFSC Code</label>
                {isPageLoading ? (
                  <div className="h-[52px] w-full bg-gray-200 animate-pulse rounded-xl"></div>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FiHash className="text-gray-400 group-focus-within:text-[#FF651D] transition-colors" size={20} />
                    </div>
                    <input
                      id="ifsc"
                      type="text"
                      required
                      maxLength={11}
                      value={formData.ifsc}
                      onChange={handleChange}
                      className="block w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-xl text-gray-900 focus:ring-0 focus:border-[#FF651D] transition-colors outline-none bg-gray-50 focus:bg-white text-base font-medium uppercase tracking-wider"
                      placeholder="SBIN0001234"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-start bg-green-50 p-4 rounded-xl border border-green-100 mt-2">
                <FiCheckCircle className="text-green-600 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-green-800 ml-3 font-medium leading-relaxed">
                  Your details are encrypted and securely stored. We only use this information to send your restaurant earnings directly to your bank account.
                </p>
              </div>

              {reqStatus.error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-100 flex items-center">
                  <FiAlertCircle className="mr-2 shrink-0" size={18} />
                  {reqStatus.error}
                </div>
              )}
              {reqStatus.success && (
                <div className="p-4 bg-[#FFF0E6] text-[#D84A00] rounded-xl text-sm font-semibold border border-[#FFDBCB] flex items-center justify-center">
                  <FiCheckCircle className="mr-2 shrink-0" size={18} />
                  {reqStatus.success}
                </div>
              )}

              {isPageLoading ? (
                <div className="h-14 w-full bg-gray-200 animate-pulse rounded-xl mt-6"></div>
              ) : (
                <button
                  type="submit"
                  disabled={reqStatus.loading}
                  className="w-full bg-[#FF651D] hover:bg-[#D84A00] text-white font-bold py-4 px-4 rounded-xl transition-all duration-300 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed text-lg shadow-md hover:shadow-lg mt-6"
                >
                  {reqStatus.loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" size={22} />
                      Verifying Details...
                    </>
                  ) : (
                    "Save Business Details"
                  )}
                </button>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}