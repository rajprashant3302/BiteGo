import { Request, Response } from 'express';
import { targetingEngine } from '../services/targetingEngine';
import { stackingCalculator } from '../services/stackingCalculator';
const { prisma } = require('database');

export const validateCartOffers = async (req: Request, res: Response) => {
  const { subtotal, promoCode, userContext } = req.body;

  try {
    const currentDate = new Date();

    // 1. Fetch ALL valid offers: Automatic ones + The specific code requested
    const potentialOffers = await prisma.adminOffer.findMany({
      where: {
        IsActive: true,
        StartTime: { lte: currentDate },
        EndTime: { gte: currentDate },
        OR: [
          { Type: 'AUTOMATIC' },
          ...(promoCode ? [{ PromoCode: promoCode.toUpperCase() }] : [])
        ]
      }
    });

    if (potentialOffers.length === 0) {
      return res.status(200).json({
        success: true,
        data: { subtotal, finalTotal: subtotal, totalDiscount: 0, appliedOffers: [] }
      });
    }

    // 2. Filter by Targeting Rules (User Role, Premium, Zone)
    const eligibleOffers = potentialOffers.filter((offer: any) => 
      targetingEngine.isEligible(userContext, offer)
    );

    // 3. Pass to the Stacking Calculator to figure out the math
    const validationResult = stackingCalculator.calculate(subtotal, eligibleOffers);

    // 4. If the user explicitly typed a code, but it didn't get applied (due to constraints)
    if (promoCode) {
      const wasRequestedCodeApplied = validationResult.appliedOffers.some(
        (o: any) => o.promoCode === promoCode.toUpperCase()
      );
      if (!wasRequestedCodeApplied && validationResult.appliedOffers.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "This coupon is not valid for your current cart or account." 
        });
      }
    }

    res.status(200).json({ success: true, data: validationResult });

  } catch (error: any) {
    console.error("Validation Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};