'use client';

import { cn } from '@/components/ui/cn';
import { useRouter } from 'next/navigation';

export default function Categories({ activeCategory, setActiveCategory }) {
  const router = useRouter();

  const CATEGORIES = [
    {
      id: 0,
      name: 'All',
      image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=150&q=80',
      color: 'bg-gray-100',
    },
    {
      id: 1,
      name: 'Offers',
      image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=150&q=80',
      color: 'bg-rose-100',
    },
    {
      id: 2,
      name: 'Pizza',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80',
      color: 'bg-orange-100',
    },
    {
      id: 3,
      name: 'Burgers',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80',
      color: 'bg-yellow-100',
    },
    {
      id: 4,
      name: 'Healthy',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&q=80',
      color: 'bg-green-100',
    },
    {
      id: 5,
      name: 'Sushi',
      image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80',
      color: 'bg-red-100',
    },
    {
      id: 6,
      name: 'Desserts',
      image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=150&q=80',
      color: 'bg-pink-100',
    },
    {
      id: 7,
      name: 'Drinks',
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=150&q=80',
      color: 'bg-blue-100',
    },
    {
      id: 8,
      name: 'Indian',
      image: 'https://images.unsplash.com/photo-1604908176997-431c0b5c8c9d?w=150&q=80',
      color: 'bg-amber-100',
    },
    {
      id: 9,
      name: 'Chinese',
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=150&q=80',
      color: 'bg-red-100',
    },
    {
      id: 10,
      name: 'Fast Food',
      image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&q=80',
      color: 'bg-orange-100',
    },
  ];

  const handleClick = (cat) => {
    setActiveCategory(cat.name);

    if (cat.name === 'All') return;

    // 🔥 Redirect to search page
    router.push(`/menu?category=${encodeURIComponent(cat.name)}`);
  };

  return (
    <section>
      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-4 sm:gap-8 hide-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.name;

          return (
            <div
              key={cat.id}
              onClick={() => handleClick(cat)}
              className={cn(
                'flex flex-col items-center gap-3 shrink-0 cursor-pointer group select-none transition-all duration-300',
                isActive
                  ? 'scale-110'
                  : 'hover:scale-105 opacity-80 hover:opacity-100'
              )}
            >
              {/* IMAGE CARD */}
              <div
                className={cn(
                  'w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] overflow-hidden shadow-xl p-1',
                  cat.color,
                  isActive
                    ? 'ring-4 ring-orange-500 ring-offset-4'
                    : 'ring-4 ring-transparent'
                )}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-[28px]"
                />
              </div>

              {/* LABEL */}
              <span
                className={cn(
                  'font-black text-xs uppercase tracking-widest transition-colors',
                  isActive ? 'text-orange-600' : 'text-gray-500'
                )}
              >
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}