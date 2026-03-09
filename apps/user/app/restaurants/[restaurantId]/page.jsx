'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  FiArrowLeft, FiStar, FiClock, FiPlus, 
  FiAlertCircle, FiChevronRight, FiTag, FiPercent 
} from 'react-icons/fi';
import { Loader2, ShoppingCart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';

export default function RestaurantDetailsPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const { cartTotal, cartCount, setIsCartOpen } = useCart();
  const [menuData, setMenuData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || "http://localhost:5001";

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/menu/${restaurantId}`);
        if (res.ok) {
          const data = await res.json();
          setMenuData(data);
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (restaurantId) fetchMenu();
  }, [restaurantId, API_BASE]);

  // Extract unique active offers to show at the top
  const uniqueOffers = useMemo(() => {
    return menuData
      .map(item => item.ActiveOffer)
      .filter((offer, index, self) => 
        offer && self.findIndex(t => t.title === offer.title) === index
      );
  }, [menuData]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-orange-500" size={48} />
    </div>
  );

  // FIX: Robust check for Restaurant Data
  const restaurantInfo = menuData.length > 0 ? (menuData[0].restaurant || menuData[0].Restaurant) : null;
  const restaurantName = restaurantInfo?.Name || "Restaurant Menu";
  const category = restaurantInfo?.CategoryName || "Cuisine";
  const rating = restaurantInfo?.Rating ? parseFloat(restaurantInfo.Rating).toFixed(1) : "4.5";

  return (
    <main className="max-w-7xl mx-auto px-4 pt-8 pb-32 font-sans relative">
      <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-orange-600 font-bold mb-6">
        <FiArrowLeft className="mr-2" /> Back
      </button>

      {/* Restaurant Header */}
      <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 mb-8">
        <span className="bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-black uppercase">
          {category}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">
          {restaurantName}
        </h1>
        <div className="flex items-center gap-6 mt-6 text-sm font-bold text-slate-500">
          <span className="flex items-center gap-1.5 text-orange-600">
            <FiStar className="fill-orange-500" /> {rating}
          </span>
          <span><FiClock className="inline mr-1" /> 25-35 mins</span>
        </div>
      </section>

      {/* Offers Carousel */}
      {uniqueOffers.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <FiPercent className="text-orange-500" /> Offers For You
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {uniqueOffers.map((offer, idx) => (
              <div 
                key={idx} 
                className="min-w-[280px] bg-gradient-to-br from-orange-500 to-orange-600 p-5 rounded-[2rem] text-white shadow-lg flex items-center gap-4 shrink-0 transition-transform hover:scale-[1.02]"
              >
                <div className="bg-white/20 p-3 rounded-2xl"><FiTag size={24} /></div>
                <div>
                  <p className="text-xl font-black leading-tight">{offer.title}</p>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest mt-1">Automatically Applied</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {menuData.map((item) => (
          <MenuCard key={item.ItemID} item={item} />
        ))}
      </div>

      {/* Floating Cart (Same as before) */}
      {cartCount > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl z-50">
          <div 
            onClick={() => setIsCartOpen(true)}
            className="bg-orange-500 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl"><ShoppingCart size={24} /></div>
              <div>
                <p className="text-xs font-bold uppercase opacity-80 tracking-widest">{cartCount} Items Added</p>
                <p className="text-xl font-black">₹{cartTotal.toFixed(0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-black">VIEW CART <FiChevronRight size={20} /></div>
          </div>
        </div>
      )}
    </main>
  );
}

function MenuCard({ item }) {
  const { addToCart, removeFromCart, cartItems } = useCart();
  const cartItem = cartItems.find(i => i.ItemID === item.ItemID);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = item.AvailableQuantity <= 0;

  // FIX: Specific item discount check
  const hasOffer = item.DiscountedPrice < item.Price;
  const discountLabel = item.ActiveOffer 
    ? `${item.ActiveOffer.discountValue}${item.ActiveOffer.discountType === 'Percentage' ? '%' : '₹'} OFF`
    : null;

  return (
    <div className={`bg-white rounded-[2rem] p-5 border-2 border-slate-50 flex items-center gap-6 transition-all duration-300 relative ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : 'hover:border-orange-500/20 hover:shadow-2xl'}`}>
      
      <div className="relative w-32 h-32 md:w-36 md:h-36 flex-shrink-0 overflow-hidden rounded-[1.5rem] bg-slate-100 shadow-inner">
        <img src={item.ItemImageURL || "/placeholder-food.png"} className="w-full h-full object-cover" />
        
        {/* --- DYNAMIC OFFER TAG --- */}
        {hasOffer && !isOutOfStock && discountLabel && (
          <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-md flex items-center gap-1 z-10">
             <FiTag className="text-[12px]" /> {discountLabel}
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-black text-[10px] uppercase bg-red-600 px-2 py-1 rounded-md">Sold Out</span>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex flex-col h-full py-1">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-3.5 h-3.5 flex items-center justify-center border-2 rounded-sm ${item.IsVeg ? 'border-green-600' : 'border-red-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${item.IsVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </div>
          <h3 className="font-black text-lg text-slate-800 line-clamp-1">{item.ItemName}</h3>
        </div>

        <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">
          {item.Description || "No description available."}
        </p>
        
        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* DISPLAYED PRICE */}
              <span className="text-2xl font-black text-slate-900">
                ₹{parseFloat(item.DiscountedPrice || item.Price).toFixed(0)}
              </span>
              {/* STRIKETHROUGH ORIGINAL PRICE */}
              {hasOffer && (
                <span className="text-sm font-bold text-slate-400 line-through">
                  ₹{parseFloat(item.Price).toFixed(0)}
                </span>
              )}
            </div>

            {item.AvailableQuantity < 10 && item.AvailableQuantity > 0 && (
              <span className="text-[10px] font-bold text-orange-600 flex items-center gap-1 mt-1">
                <FiAlertCircle /> Only {item.AvailableQuantity} left
              </span>
            )}
          </div>
          
          <div className="flex items-center">
            {quantity > 0 ? (
              <div className="flex items-center bg-orange-500 rounded-2xl p-1 shadow-lg">
                <button onClick={() => removeFromCart(item.ItemID)} className="w-10 h-10 flex items-center justify-center text-white rounded-xl font-black text-xl">-</button>
                <span className="px-4 font-black text-white">{quantity}</span>
                <button 
                  onClick={() => addToCart(item)}
                  disabled={quantity >= item.AvailableQuantity}
                  className="w-10 h-10 flex items-center justify-center text-white rounded-xl font-black text-xl disabled:opacity-50"
                >+</button>
              </div>
            ) : (
              <Button 
                onClick={() => addToCart(item)}
                disabled={isOutOfStock}
                size="icon" 
                className={`w-12 h-12 rounded-2xl shadow-lg transition-all active:scale-90 ${isOutOfStock ? 'bg-slate-200 text-slate-400' : 'bg-orange-500 text-white shadow-orange-200'}`}
              >
                <FiPlus size={22} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}