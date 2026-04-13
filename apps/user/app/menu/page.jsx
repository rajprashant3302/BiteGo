'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { useCart } from '@/context/CartContext';
import { resolveImageUrl, withFallbackSrc } from '@/lib/image';

export default function CategorySearchPage() {
  const params = useSearchParams();
  const router = useRouter();

  const category = params.get('category');

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const SEARCH_API =
    process.env.NEXT_PUBLIC_SEARCH_SERVICE_URL || '/search-api';

  useEffect(() => {
    if (!category) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${SEARCH_API}/search?q=${encodeURIComponent(category)}`
        );
        const json = await res.json();
        setResults(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category]);

  if (loading)
    return <p className="p-6 text-center font-bold">Loading...</p>;

  if (results.length === 0)
    return <p className="p-6 text-center font-bold">No items found</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-6">
      {results.map((item) => (
        <UnifiedCard key={item.id} item={item} router={router} />
      ))}
    </div>
  );
}

function UnifiedCard({ item, router }) {
  const { addToCart, cartItems } = useCart();

  const isRestaurant = item.type === 'RESTAURANT';

  const ORDER_SERVICE_BASE =
    process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || '/order-api';

  const fallbackImage = '/no-image.png';

  const imageUrl = resolveImageUrl(
    isRestaurant ? item.imageUrl : item.imageUrl,
    {
      fallback: fallbackImage,
      baseUrl: ORDER_SERVICE_BASE,
    }
  );

  const handleImageError = withFallbackSrc(fallbackImage);

  const handleClick = () => {
    if (isRestaurant) {
      router.push(`/restaurants/${item.id}`);
    } else {
      router.push(
        `/restaurants/${item.restaurantId}?highlight=${item.id}`
      );
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-[2rem] p-5 border-2 flex items-center gap-6 transition-all duration-300 hover:shadow-2xl cursor-pointer"
    >
      {/* IMAGE */}
      <div className="w-32 h-32 rounded-[1.5rem] overflow-hidden bg-slate-100">
        <img
          src={imageUrl}
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      </div>

      {/* CONTENT */}
      <div className="flex flex-col flex-1">
        {/* TITLE */}
        <h3 className="font-black text-lg text-slate-800">
          {item.name}
        </h3>

        {/* SUBTITLE */}
        <p className="text-sm text-gray-400 mt-1">
          {isRestaurant
            ? item.category || 'Restaurant'
            : item.restaurant_name}
        </p>

        {/* RESTAURANT EXTRA */}
        {isRestaurant && (
          <div className="flex items-center gap-2 text-orange-500 text-xs font-bold mt-2">
            <FiStar className="fill-orange-500" />
            {item.rating || 'New'}
          </div>
        )}

        {/* PRICE (ONLY FOR MENU ITEM) */}
        {!isRestaurant && item.price && (
          <p className="text-lg font-black text-slate-900 mt-2">
            ₹{item.price}
          </p>
        )}

        {/* BUTTON */}
        {!isRestaurant && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart({
                ItemID: item.id,
                ItemName: item.name,
                Price: item.price,
              });
            }}
            className="mt-3 bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold w-fit"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}