'use client';

import { CATEGORIES } from '@/data/categories';
import { cn } from '@/components/ui/cn';

export default function Categories({ activeCategory, setActiveCategory }) {
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