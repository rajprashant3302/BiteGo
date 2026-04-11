export const targetingEngine = {
  isEligible: (userContext: any, offer: any): boolean => {
    if (!offer.IsActive) return false;
    
    const now = new Date();
    if (now < new Date(offer.StartTime) || now > new Date(offer.EndTime)) return false;

    // JSON Rules Check
    if (offer.TargetSegment) {
      const rules = typeof offer.TargetSegment === 'string' ? JSON.parse(offer.TargetSegment) : offer.TargetSegment;
      
      if (rules.is_premium && !userContext.IsPremium) return false;
      if (rules.role && rules.role !== userContext.Role) return false;
      if (rules.zoneId && rules.zoneId !== userContext.ZoneID) return false;
      if (rules.min_orders && userContext.orderCount < rules.min_orders) return false;
    }

    // PRIVATE Visibility Check
    if (offer.Visibility === 'PRIVATE') {
      if (!userContext.UserID) return false;
      
      const isWhitelisted = offer.TargetedUsers?.some(
        (tu: any) => tu.UserID === userContext.UserID
      );
      if (!isWhitelisted) return false;
    }

    return true;
  }
};