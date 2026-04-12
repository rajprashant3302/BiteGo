'use client';

import { cn } from '@/components/ui/cn';



export default function Categories({ activeCategory, setActiveCategory }) {

  const CATEGORIES = [
  { id: 0, name: 'All',      image: 'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=150&q=80', color: 'bg-gray-100'   },
  { id: 1, name: 'Offers',   image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150&q=80', color: 'bg-rose-100'   },
  { id: 2, name: 'Pizza',    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80', color: 'bg-orange-100' },
  { id: 3, name: 'Healthy',  image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=150&q=80', color: 'bg-green-100'  },
  { id: 4, name: 'Burgers',  image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80', color: 'bg-yellow-100' },
  { id: 5, name: 'Sushi',    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&q=80', color: 'bg-red-100'    },
  { id: 6, name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=150&q=80', color: 'bg-pink-100'   },
];


  return (
    <section>
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
              onClick={() => setActiveCategory(cat.name)}
              className={cn(
                'flex flex-col items-center gap-3 shrink-0 cursor-pointer group select-none',
                isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
              )}
            >
              <div className={cn(
                'w-20 h-20 sm:w-24 sm:h-24 rounded-[32px] overflow-hidden transition-all duration-300 shadow-xl p-1 relative',
                cat.color,
                isActive ? 'ring-4 ring-orange-500 ring-offset-4' : 'ring-4 ring-transparent'
              )}>
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-[28px]" />
              </div>
              <span className={cn(
                'font-black text-xs uppercase tracking-widest transition-colors',
                isActive ? 'text-orange-600' : 'text-gray-500'
              )}>
                {cat.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}