import { Request, Response } from 'express';
const { prisma } = require('database');

export const getAvailableOffers = async (req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    
    const publicOffers = await prisma.adminOffer.findMany({
      where: {
        IsActive: true,
        Visibility: 'PUBLIC',
        StartTime: { lte: currentDate },
        EndTime: { gte: currentDate }
      },
      orderBy: { Priority: 'desc' }
    });

    res.status(200).json({ success: true, data: publicOffers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};