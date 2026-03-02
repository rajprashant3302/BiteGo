'use client';

import { cn } from '@/components/ui/cn';

export default function BiteGoLogo({ size = 100, className }) {
  return (
    <div style={{ width: size, height: size }} className={cn('relative overflow-hidden shrink-0', className)}>
      <img
        src="/bitego-logo-complete (2).svg"
        alt="BiteGo Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentNode.className += ' bg-orange-500 rounded-xl flex items-center justify-center';
          e.target.parentNode.innerHTML = '<span class="text-white font-black text-xl">B</span>';
        }}
      />
    </div>
  );
}