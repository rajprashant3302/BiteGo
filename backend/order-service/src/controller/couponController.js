const { prisma } = require("database");

exports.validateCoupon = async (req, res) => {
  try {
    const { code, userId, orderValue } = req.body;

    // 1. Fetch Coupon from DB
    const coupon = await prisma.coupon.findUnique({
      where: { CouponCode: code.toUpperCase() }
    });

    // 2. Validation Checks
    if (!coupon || !coupon.IsActive) {
      return res.status(404).json({ message: "Invalid or inactive coupon code." });
    }

    if (coupon.ExpiryDate && new Date(coupon.ExpiryDate) < new Date()) {
      return res.status(400).json({ message: "This coupon has expired." });
    }

    // 3. Check if user has already used this coupon (Optional based on your rules)
    const usage = await prisma.userCoupon.findFirst({
      where: { 
        UserID: userId,
        CouponID: coupon.CouponID
      }
    });

    if (usage) {
      return res.status(400).json({ message: "You have already used this coupon." });
    }

    // 4. Return Coupon Data for Frontend Calculation
    return res.status(200).json({
      code: coupon.CouponCode,
      DiscountType: coupon.DiscountType,
      DiscountValue: coupon.DiscountValue,
      CouponID: coupon.CouponID
    });

  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};