'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import RecommendationCard from './Recommendationcard';

const AI_SERVICE_BASE =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "/ai-api";

export default function CravingsShelf({ userId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecs() {
      if (!userId) {
        if (isMounted) {
          setRecommendations([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${AI_SERVICE_BASE}/recommendations/${encodeURIComponent(userId)}`,
          { cache: 'no-store' }
        );

        if (!res.ok) {
          throw new Error(`Recommendations request failed with status ${res.status}`);
        }

        const data = await res.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        // Filter to only show Menu Items as we discussed
        const filtered = results.filter(item => item.type === 'MENU_ITEM');

        if (isMounted) {
          setRecommendations(filtered);
        }
      } catch (error) {
        console.error("Failed to fetch cravings:", error);
        if (isMounted) {
          setRecommendations([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading || recommendations.length === 0) return null;

  return (
    <section className="py-8">
      <div className="px-6 mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-orange-500 w-5 h-5" />
            <span className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em]">
              AI Personalized
            </span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            Your Current Cravings
          </h2>
          <p className="text-gray-400 text-sm font-medium">
            Items you might love based on your recent activity
          </p>
        </div>
        
        <button className="text-orange-500 font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-8">
          View All
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div className="flex overflow-x-auto gap-6 px-6 pb-8 no-scrollbar scroll-smooth">
          {recommendations.map((item, idx) => (
            <RecommendationCard key={item.id || idx} item={item} />
          ))}
          {/* Spacer for ending padding */}
          <div className="flex-shrink-0 w-2" />
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
