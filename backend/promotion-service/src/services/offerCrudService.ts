const {prisma} = require('database');

export const offerCrudService = {
  createOffer: async (data: any) => {
    return await prisma.adminOffer.create({ data });
  },

  getAllOffers: async () => {
    return await prisma.adminOffer.findMany({
      orderBy: { CreatedAt: 'desc' }
    });
  },

  getOfferById: async (offerId: string) => {
    return await prisma.adminOffer.findUnique({
      where: { OfferID: offerId }
    });
  },
  updateOffer: async (offerId: string, data: any) => {
    return await prisma.adminOffer.update({
      where: { OfferID: offerId },
      data
    });
  },

  deleteOffer: async (offerId: string) => {
    return await prisma.adminOffer.delete({
      where: { OfferID: offerId }
    });
  },

  getPublicOffers: async () => {
    return await prisma.adminOffer.findMany({
      where: {
        IsActive: true,
        Visibility: 'PUBLIC',
        EndTime: { gt: new Date() }
      }
    });
  },

  getOfferByCode: async (promoCode: string) => {
    return await prisma.adminOffer.findUnique({
      where: { PromoCode: promoCode },
      include: { TargetedUsers: true }
    });
  }
};