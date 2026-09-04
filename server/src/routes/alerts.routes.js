import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getStalledAlerts, dismissAlert } from '../controllers/alerts.controller.js';
const router = Router();
router.use(requireAuth, requireRole('recruiter'));
router.get('/stalled', getStalledAlerts);
router.post('/:applicationId/dismiss', dismissAlert);
export default router;
