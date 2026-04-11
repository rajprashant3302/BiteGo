export const stackingCalculator = {
  calculate: (subtotal: number, offers: any[]) => {
    let finalTotal = subtotal;
    let totalDiscount = 0;
    const appliedOffers: any[] = [];

    // Sort by Priority (Highest number gets applied first)
    const sortedOffers = offers.sort((a, b) => b.Priority - a.Priority);

    let stackingBlocked = false;

    for (const offer of sortedOffers) {
      if (stackingBlocked) break;

      // Check MinOrderValue constraint against the BASE subtotal
      if (offer.MinOrderValue && subtotal < Number(offer.MinOrderValue)) continue;

      // Global Redemption Limits Check
      if (offer.TotalRedemptionLimit && offer.CurrentRedemptionCount >= offer.TotalRedemptionLimit) continue;

      let discountForThisOffer = 0;

      // Handle Free Delivery (Doesn't reduce cart total, but gets tracked)
      if (offer.RewardType === 'FreeDelivery') {
        appliedOffers.push({ 
          offerId: offer.OfferID, 
          promoCode: offer.PromoCode,
          appliedDiscount: 0, 
          RewardType: 'FreeDelivery' 
        });
        if (!offer.IsStackable) stackingBlocked = true;
        continue;
      }

      // Handle standard discounts
      if (offer.RewardType === 'DiscountOnOrder') {
        if (offer.DiscountType === 'Flat') {
          discountForThisOffer = Number(offer.RewardValue);
        } else if (offer.DiscountType === 'Percentage') {
          // Percentage off the remaining final total (standard retail logic)
          discountForThisOffer = finalTotal * (Number(offer.RewardValue) / 100);
          if (offer.MaxDiscount && discountForThisOffer > Number(offer.MaxDiscount)) {
            discountForThisOffer = Number(offer.MaxDiscount);
          }
        }
      }

      // Prevent negative carts
      if (finalTotal - discountForThisOffer < 0) {
        discountForThisOffer = finalTotal;
      }

      if (discountForThisOffer > 0) {
        finalTotal -= discountForThisOffer;
        totalDiscount += discountForThisOffer;
        appliedOffers.push({ 
          offerId: offer.OfferID, 
          promoCode: offer.PromoCode,
          appliedDiscount: discountForThisOffer,
          RewardType: offer.RewardType
        });

        // If THIS offer prohibits stacking, stop checking the rest
        if (!offer.IsStackable) stackingBlocked = true;
      }
    }

    return { subtotal, finalTotal, totalDiscount, appliedOffers };
  }
};