import { Router } from 'express';
import { 
  createOffer, 
  listAdminOffers, 
  getAdminOffer, 
  updateAdminOffer, 
  deleteAdminOffer 
} from '../controllers/adminOfferController';
// import { requireSuperAdmin } from '../middlewares/authMiddleware';

const router = Router();
// router.use(requireSuperAdmin);

// Create and List
router.post('/offers', createOffer);
router.get('/offers', listAdminOffers);

// === NEW ROUTES FOR EDIT/DELETE ===
router.get('/offers/:id', getAdminOffer);
router.put('/offers/:id', updateAdminOffer);
router.delete('/offers/:id', deleteAdminOffer);

export default router;