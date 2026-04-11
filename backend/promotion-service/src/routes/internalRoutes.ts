import { Router } from 'express';
import { validateCartOffers } from '../controllers/validationController';

const router = Router();
// Protect this so ONLY your other microservices can hit it
router.post('/validate-cart', validateCartOffers);

export default router;