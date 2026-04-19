"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Star, TrendingUp, ThumbsUp, Loader2, MessageSquare, AlertCircle } from "lucide-react";

export default function DriverPerformancePage() {
  const { data: session } = useSession();
  const driverId = session?.user?.id;
  const token = session?.accessToken || session?.user?.accessToken;

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalDeliveries: 0,
    fiveStarCount: 0
  });

  useEffect(() => {
    if (!driverId) return;

    // Simulate API fetch (Replace with actual backend call later)
    const fetchPerformanceData = () => {
      setLoading(true);
      
      setTimeout(() => {
        const mockReviews = [
          { id: "1", rating: 5, text: "Super fast delivery! Driver was very polite.", date: new Date().toISOString() },
          { id: "2", rating: 5, text: "Followed delivery instructions perfectly. Left it at the door as requested.", date: new Date(Date.now() - 86400000).toISOString() },
          { id: "3", rating: 4, text: "", date: new Date(Date.now() - 172800000).toISOString() },
          { id: "4", rating: 5, text: "Food was handled with care, no spills.", date: new Date(Date.now() - 259200000).toISOString() },
        ];
        
        setReviews(mockReviews);
        setStats({
          averageRating: 4.8,
          totalDeliveries: 142,
          fiveStarCount: mockReviews.filter(r => r.rating === 5).length
        });
        setLoading(false);
      }, 800);

      // REAL API IMPLEMENTATION (Uncomment when backend is ready):
      /*
      try {
         const gatewayUrl = process.env.NEXT_PUBLIC_GRAPHQL_GATEWAY_URL || "/graphql";
         const query = `
           query GetDriverReviews($driverId: ID!) {
             getDeliveryPartnerReviews(deliveryPartnerId: $driverId) {
               id
               ratingDelivery
               reviewTextDeliveryPartner
               createdAt
             }
           }
         `;
         const res = await fetch(gatewayUrl, {
           method: "POST",
           headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
           body: JSON.stringify({ query, variables: { driverId } })
         });
         const data = await res.json();
         // Process data...
      } catch (err) {
         console.error(err);
      }
      */
    };

    fetchPerformanceData();
  }, [driverId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={48} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0f14] font-sans text-slate-100 p-6 md:p-8 lg:p-12 overflow-y-auto">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Performance</h1>
        <p className="text-sm text-slate-400 mt-1">Track your ratings and customer feedback.</p>
      </div>

      {/* Hero Metric Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-[2.5rem] p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <Star size={160} className="fill-orange-500 text-orange-500" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Overall Rating</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-black text-white">{stats.averageRating}</h2>
              <span className="text-xl text-orange-400 font-bold">/ 5.0</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)]">
            <Star size={32} className="fill-white text-white" />
          </div>
        </div>
      </motion.div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-3xl font-black text-white">{stats.totalDeliveries}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Total Trips</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center"
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 mb-4">
            <ThumbsUp size={20} />
          </div>
          <h3 className="text-3xl font-black text-white">{stats.fiveStarCount}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">5-Star Ratings</p>
        </motion.div>
      </div>

      {/* Customer Compliments Section */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <MessageSquare size={20} className="text-orange-500" /> Recent Compliments
        </h3>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-3xl p-8 text-center">
            <AlertCircle size={32} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">No written reviews yet. Keep delivering to get feedback!</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div 
              key={review.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * index }}
              className="bg-[#12141c] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden"
            >
              {/* Highlight bar for 5-star reviews */}
              {review.rating === 5 && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />}
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={star <= review.rating ? "fill-orange-500 text-orange-500" : "fill-white/10 text-white/10"}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              {review.text ? (
                <p className="text-slate-300 text-sm leading-relaxed italic">"{review.text}"</p>
              ) : (
                <p className="text-slate-500 text-sm italic">Rated without comment.</p>
              )}
            </motion.div>
          ))
        )}
      </div>

    </main>
  );
}