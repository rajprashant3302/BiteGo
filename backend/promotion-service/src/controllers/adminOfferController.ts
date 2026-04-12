import { Request, Response } from 'express';
import { offerCrudService } from '../services/offerCrudService';

export const createOffer = async (req: Request, res: Response) => {
  try {
    const offer = await offerCrudService.createOffer(req.body);
    res.status(201).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listAdminOffers = async (req: Request, res: Response) => {
  try {
    const offers = await offerCrudService.getAllOffers();
    res.status(200).json({ success: true, data: offers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// === NEW CONTROLLERS FOR EDIT/DELETE ===
export const getAdminOffer = async (req: Request, res: Response) => {
  try {
    const offer = await offerCrudService.getOfferById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    res.status(200).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAdminOffer = async (req: Request, res: Response) => {
  try {
    const offer = await offerCrudService.updateOffer(req.params.id, req.body);
    res.status(200).json({ success: true, data: offer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAdminOffer = async (req: Request, res: Response) => {
  try {
    await offerCrudService.deleteOffer(req.params.id);
    res.status(200).json({ success: true, message: "Offer deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};