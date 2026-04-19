"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, ArrowLeft, MessageSquare, Loader2, Calendar, Store } from "lucide-react";

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    const fetchMyReviews = async () => {
      if (!session?.user?.id) return;
      
      try {
        const gatewayUrl = process.env.NEXT_PUBLIC_GRAPHQL_GATEWAY_URL || "/svc/graphql";
        
        // 🔥 FIX 1: Use lowercase 'name' and 'id' to match GraphQL schema conventions
        const query = `
          query GetUserReviews($userId: ID!) {
            getUserReviews(userId: $userId) {
              id
              ratingRestaurant
              ratingDelivery
              reviewTextRestaurant
              reviewTextDeliveryPartner
              createdAt
              restaurant {
                name
              }
              order {
                id
              }
            }
          }
        `;

        const response = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.accessToken || ""}`
          },
          body: JSON.stringify({ 
            query, 
            variables: { userId: session.user.id } 
          })
        });

        const result = await response.json();

        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        // Sort reviews by newest first
        const sortedReviews = (result.data.getUserReviews || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setReviews(sortedReviews);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setError("Could not load your reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchMyReviews();
    }
  }, [session, status, router]);

  // ── LOADING STATE ──
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-8 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* ── HEADER ── */}
        <header className="flex items-center gap-6 mb-12">
          <button 
            onClick={() => router.back()} 
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 hover:text-orange-500 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">My Reviews</h1>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
              {reviews.length} Past Contributions
            </p>
          </div>
        </header>

        {/* ── ERROR STATE ── */}
        {error && (
          <div className="bg-red-50 text-red-600 p-5 rounded-2xl border border-red-100 font-bold text-sm mb-8 flex items-center gap-3">
            <MessageSquare size={18} />
            {error}
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!loading && reviews.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[3rem] p-16 text-center border border-slate-100 shadow-xl shadow-slate-200/40"
          >
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star size={40} className="text-orange-400 fill-orange-400/20" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 italic">No reviews yet!</h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto font-medium">
              You haven't reviewed any of your past orders yet. Head over to your past orders to share your food and delivery experience!
            </p>
            <button 
              onClick={() => router.push('/orders')}
              className="bg-orange-500 text-white font-black text-lg py-4 px-10 rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 active:scale-95"
            >
              View Past Orders
            </button>
          </motion.div>
        )}

        {/* ── REVIEWS FEED ── */}
        <div className="space-y-8">
          {reviews.map((review, index) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100"
            >
              {/* Review Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                    <Store size={24} />
                  </div>
                  <div>
                    {/* 🔥 FIX 2: Use lowercase 'name' and 'id' in the UI mapping */}
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">
                      {review.restaurant?.name || "Unknown Restaurant"}
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Order #{review.order?.id?.slice(-6).toUpperCase() || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 uppercase tracking-widest w-fit">
                  <Calendar size={14} />
                  {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {/* Ratings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Food/Restaurant Rating */}
                <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100/50">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Food & Restaurant</p>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={`rest-${star}`}
                        size={18}
                        className={star <= review.ratingRestaurant ? "fill-orange-500 text-orange-500" : "fill-slate-200 text-slate-200"}
                      />
                    ))}
                  </div>
                  {review.reviewTextRestaurant ? (
                    <p className="text-sm font-medium text-slate-700 italic">"{review.reviewTextRestaurant}"</p>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">No comment provided.</p>
                  )}
                </div>

                {/* Delivery Rating */}
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Delivery Partner</p>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={`del-${star}`}
                        size={18}
                        className={star <= review.ratingDelivery ? "fill-orange-500 text-orange-500" : "fill-slate-200 text-slate-200"}
                      />
                    ))}
                  </div>
                  {review.reviewTextDeliveryPartner ? (
                    <p className="text-sm font-medium text-slate-700 italic">"{review.reviewTextDeliveryPartner}"</p>
                  ) : (
                    <p className="text-sm font-medium text-slate-400 italic">No comment provided.</p>
                  )}
                </div>

              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}