import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listInterviewers } from '../controllers/users.controller.js';
const router = Router();
router.use(requireAuth, requireRole('recruiter'));
router.get('/interviewers', listInterviewers);
export default router;
