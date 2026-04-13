'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const SEARCH_BASE =
  process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || '/search-api';

export default function MenuItemPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [redirected, setRedirected] = useState(false);

  const rawId = params?.id;
  const id =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
      ? rawId[0]
      : undefined;

  useEffect(() => {
    if (!id || redirected) {
      setLoading(false);
      return;
    }

    const fetchAndRedirect = async () => {
      try {
        const res = await fetch(
          `${SEARCH_BASE}/search?q=${encodeURIComponent(id)}`
        );

        if (!res.ok) throw new Error('API failed');

        const json = await res.json();
        const data = json.data || [];

        console.log("🔍 Search data:", data);
        console.log("🆔 Searching for:", id);

        // ✅ FIX: handle id OR ItemID
        const found = data.find(
          (i) =>
            String(i.id || i.ItemID) === String(id) &&
            i.type !== 'RESTAURANT'
        );

        if (!found) {
          console.error('❌ Item not found in search response');
          setLoading(false);
          return;
        }

        console.log("✅ Found item:", found);

        // ✅ FIX: robust restaurantId extraction
        const restaurantId =
          found.restaurantId ||
          found.restaurant_id ||
          found.restaurantID ||
          found.restaurant?.id;

        if (!restaurantId) {
          console.error('❌ Missing restaurantId in search result');
          setLoading(false);
          return;
        }

        setRedirected(true);

        // ✅ IMPORTANT: use correct route (your project uses /restaurants)
        router.replace(
          `/restaurants/${restaurantId}?highlight=${found.id || found.ItemID}`
        );

      } catch (err) {
        console.error('❌ Failed to load item', err);
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, [id, redirected, router]);

  // 🔄 Loading UI
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-orange-500 font-black text-lg animate-pulse tracking-widest uppercase">
          Redirecting to menu...
        </div>
      </div>
    );
  }

  // ❌ Fallback
  return (
    <div className="h-screen flex items-center justify-center text-center px-4">
      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">
          Item not found
        </h2>
        <p className="text-gray-500 text-sm">
          We couldn't find this menu item.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-bold"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}