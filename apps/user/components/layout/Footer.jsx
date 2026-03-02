import BiteGoLogo from '@/components/layout/BiteGoLogo';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-16 hidden md:block">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-4">
            <BiteGoLogo size={160} />
            <div className="flex flex-col -gap-1">
              <span className="font-black text-3xl tracking-tight text-gray-900 italic">BiteGo</span>
              <span className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
                Food & Delivery
              </span>
            </div>
          </div>
          <p className="text-gray-400 font-medium text-lg max-w-sm leading-relaxed">
            Delicious meals from your local favorites, delivered to your door or scheduled for later.
          </p>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 mb-6">Discover</h4>
          <ul className="space-y-4 text-gray-500 font-bold text-sm">
            <li><a href="#" className="hover:text-orange-500">Trending Now</a></li>
            <li><a href="#" className="hover:text-orange-500">BiteGo Points</a></li>
            <li><a href="#" className="hover:text-orange-500">Gift Cards</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-900 mb-6">Support</h4>
          <ul className="space-y-4 text-gray-500 font-bold text-sm">
            <li><a href="#" className="hover:text-orange-500">Help Center</a></li>
            <li><a href="#" className="hover:text-orange-500">Become a Driver</a></li>
            <li><a href="#" className="hover:text-orange-500">Privacy Policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}