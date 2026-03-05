'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User } from 'lucide-react';
import { cn } from '@/components/ui/cn';
import { useCart } from '@/context/CartContext';

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { cartCount, setIsCartOpen } = useCart();

  const navItems = [
    { icon: Home,        label: 'Home',    href: '/'        },
    { icon: Search,      label: 'Search',  href: '/search'  },
    { icon: ShoppingBag, label: 'Order',   onClick: () => setIsCartOpen(true), badge: cartCount },
    { icon: Heart,       label: 'Saved',   href: '/saved'   },
    { icon: User,        label: 'Account', href: '/settings' },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-[32px] p-2 flex items-center justify-around shadow-2xl shadow-black/20 border border-white/10">
        {navItems.map((item, idx) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => (item.onClick ? item.onClick() : router.push(item.href))}
              className={cn(
                'relative flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300',
                isActive ? 'text-orange-500 scale-110' : 'text-gray-400 hover:text-white'
              )}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                {Number(item.badge || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-gray-900">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}