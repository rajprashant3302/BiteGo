"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Download } from 'lucide-react';
import RevenueOverview from '@/components/dashboard/RevenueOverview';
import { StatCards, TopRestaurants } from '@/components/dashboard/DashboardWidgets';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- Header Section --- */}
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF651D] transition-colors mb-6 w-fit"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                <TrendingUp className="text-orange-500" size={28} />
                Analytics & Reports
              </h1>
              <p className="text-sm text-gray-500 mt-1">Deep dive into your platform's revenue and performance.</p>
            </div>
            
            {/* Optional: A mock export button to make it feel like a real analytics suite */}
            {/* <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export CSV
            </button> */}
          </div>
        </div>

        {/* --- Top Metrics --- */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Platform Overview</h2>
          <StatCards />
        </div>

        {/* --- Charts Area --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart spans 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Financials</h2>
            <div className="h-[500px]"> {/* Forces the chart to be taller on the dedicated page */}
              <RevenueOverview />
            </div>
          </div>

          {/* Top Restaurants spans 1 column */}
          <div className="lg:col-span-1">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Top Performers</h2>
            <TopRestaurants />
          </div>
        </div>

      </div>
    </div>
  );
}