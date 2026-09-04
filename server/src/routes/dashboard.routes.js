import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getDashboard } from '../controllers/dashboard.controller.js';
const router = Router();
router.get('/', requireAuth, requireRole('recruiter'), getDashboard);
export default router;
