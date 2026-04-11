import { Router } from 'express';
import { getAvailableOffers } from '../controllers/publicOfferController';

const router = Router();
router.get('/offers', getAvailableOffers);

export default router;