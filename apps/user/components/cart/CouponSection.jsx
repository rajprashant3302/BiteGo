'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Ticket, Trash2, XCircle, CheckCircle2, Info, Loader2, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

export default function CouponSection() {
  const {
    couponInput,
    setCouponInput,
    appliedCoupon,
    couponError,
    setCouponError,
    handleApplyCoupon,
    removeCoupon,
    cartSubtotal,
  } = useCart();

  const [publicOffers, setPublicOffers] = useState([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);

  const API_GATEWAY = process.env.NEXT_PUBLIC_API_GATEWAY || "http://localhost";

  // FETCH PUBLIC OFFERS
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch(`${API_GATEWAY}/svc/promotion/api/public/offers`);
        if (res.ok) {
          const json = await res.json();
          setPublicOffers(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch offers", err);
      } finally {
        setIsLoadingOffers(false);
      }
    };
    fetchOffers();
  }, [API_GATEWAY]);

  // UI State Helpers
  const freeDeliveryThreshold = 299;
  const amountNeededForFreeDelivery = freeDeliveryThreshold - cartSubtotal;
  
  // Create an array of IDs that are currently applied by the backend engine
  const appliedOfferIds = appliedCoupon?.appliedOffers?.map(o => o.offerId) || [];

  return (
    <div className="pt-6 border-t border-gray-100 space-y-5">
      
      {/* ── 1. DELIVERY INDICATOR ── */}
      {cartSubtotal > 0 && cartSubtotal < freeDeliveryThreshold && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-blue-50 border border-blue-100 p-3 rounded-2xl"
        >
          <Info size={14} className="text-blue-500" />
          <p className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">
            Add ₹{amountNeededForFreeDelivery.toFixed(0)} more for FREE delivery
          </p>
        </motion.div>
      )}
      
      {cartSubtotal >= freeDeliveryThreshold && cartSubtotal > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 bg-green-50 border border-green-100 p-3 rounded-2xl"
        >
          <CheckCircle2 size={14} className="text-green-600" />
          <p className="text-[10px] font-bold text-green-700 uppercase tracking-tight">
            You unlocked FREE delivery!
          </p>
        </motion.div>
      )}

      {/* ── 2. COUPON INPUT & ERROR ── */}
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 mb-3">
          Coupons & Offers
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponError) setCouponError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon(couponInput)}
                placeholder="ENTER PROMO CODE"
                className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500/20 focus:bg-white rounded-2xl py-3.5 pl-12 pr-4 text-xs font-black outline-none transition-all uppercase tracking-widest"
              />
            </div>
            <Button 
              onClick={() => handleApplyCoupon(couponInput)} 
              size="sm" 
              className="h-auto px-6 rounded-2xl shadow-md" 
              disabled={!couponInput}
            >
              Apply
            </Button>
          </div>

          <AnimatePresence>
            {couponError && (
              <motion.p initial={{ y: -5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-2 flex items-center gap-1">
                <XCircle size={12} /> {couponError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 3. STACKED APPLIED DISCOUNTS BANNERS ── */}
      {/* This maps over EVERY offer the backend applied (Auto + Manual) */}
      <AnimatePresence>
        {appliedCoupon?.appliedOffers?.map((offerObj) => {
          // Cross-reference backend ID with our public offers to get the exact Title
          const offerDetails = publicOffers.find(o => o.OfferID === offerObj.offerId);
          
          // Determine if this is the manual code the user typed
          const isManualCode = appliedCoupon.code && (
            (offerDetails && offerDetails.PromoCode === appliedCoupon.code) || 
            (!offerDetails) // If it's a private code not in public list
          );

          const displayTitle = offerDetails?.Title || (isManualCode ? `Code '${appliedCoupon.code}'` : 'Platform Deal');

          return (
            <motion.div
              key={offerObj.offerId}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-3xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-green-200">
                  {isManualCode ? <Tag size={18} /> : <Sparkles size={18} />}
                </div>
                <div>
                  <p className="text-sm font-black text-green-900 tracking-tight">
                    {displayTitle}
                  </p>
                  <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mt-0.5">
                    {offerObj.appliedDiscount > 0 ? `You save ₹${parseFloat(offerObj.appliedDiscount).toFixed(0)}` : 'Applied to Cart'}
                  </p>
                </div>
              </div>
              
              {/* Only show the trash can for the manual code so they can remove it */}
              {isManualCode && (
                <button
                  onClick={removeCoupon}
                  className="p-2.5 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-sm border border-red-100"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ── 4. AVAILABLE PUBLIC OFFERS LIST ── */}
      {isLoadingOffers ? (
        <div className="flex justify-center py-6"><Loader2 className="animate-spin text-orange-500" size={24} /></div>
      ) : publicOffers.length > 0 && (
        <div className="pt-2">
          <p className="text-[11px] font-bold text-gray-800 mb-3 ml-1">Available Deals</p>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x scrollbar-hide">
            
            {publicOffers.map((offer) => {
              const isApplied = appliedOfferIds.includes(offer.OfferID);

              return (
                <div 
                  key={offer.OfferID} 
                  className={`snap-start flex-shrink-0 w-[260px] border rounded-3xl p-4 flex flex-col justify-between transition-colors ${isApplied ? 'bg-green-50 border-green-200' : 'bg-orange-50/30 border-orange-100'}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`font-black text-[10px] px-2.5 py-1 rounded uppercase tracking-widest ${isApplied ? 'bg-green-200 text-green-800' : 'bg-orange-100 text-orange-700'}`}>
                        {offer.PromoCode || "AUTO DEAL"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 truncate">{offer.Title}</h4>
                    <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                      {offer.DiscountType === 'Percentage' ? `${offer.RewardValue}% OFF` : `₹${offer.RewardValue} OFF`} 
                      {offer.MinOrderValue > 0 ? ` on orders above ₹${offer.MinOrderValue}` : ''}
                    </p>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-900/5 pt-3">
                    {isApplied ? (
                      <span className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={16} className="text-green-500" /> Applied
                      </span>
                    ) : offer.PromoCode ? (
                      <button 
                        onClick={() => {
                          setCouponInput(offer.PromoCode);
                          handleApplyCoupon(offer.PromoCode); // Will replace current manual code
                        }}
                        className="text-xs font-black text-orange-600 uppercase tracking-widest hover:text-orange-700 transition-colors"
                      >
                        Tap to Apply
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {cartSubtotal < offer.MinOrderValue ? `Add ₹${(offer.MinOrderValue - cartSubtotal).toFixed(0)} more to apply` : 'Auto-applies at checkout'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}