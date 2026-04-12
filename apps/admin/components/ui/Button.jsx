import { cn } from '@/components/ui/cn';

export default function Button({ variant = 'default', size = 'default', className, children, ...props }) {
  const base =
    'inline-flex items-center justify-center font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95';

  const variants = {
    default: 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm',
    ghost:   'hover:bg-gray-100 hover:text-gray-900 text-gray-600',
    outline: 'border border-gray-200 bg-white hover:bg-gray-100 text-gray-900',
    dark:    'bg-gray-900 text-white hover:bg-black',
  };

  const sizes = {
    default: 'h-11 px-6 rounded-2xl',
    icon:    'h-10 w-10 rounded-full',
    sm:      'h-9 rounded-xl px-4 text-sm',
    lg:      'h-14 px-8 rounded-2xl text-lg',
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}