'use client';

import { Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function SearchPage() {
  const router = useRouter();

  return (
    <div className="py-40 flex flex-col items-center justify-center text-center px-6">
      <div className="w-24 h-24 bg-gray-50 rounded-[32px] flex items-center justify-center mb-8 border-2 border-gray-100">
        <Search className="text-gray-200" size={40} />
      </div>
      <h2 className="text-3xl font-black mb-4">Under Construction</h2>
      <p className="text-gray-400 font-medium max-w-sm">
        We&apos;re cooking up something great for /search. Check back soon!
      </p>
      <Button className="mt-10 h-14 px-10" onClick={() => router.push('/')}>Return Home</Button>
    </div>
  );
}