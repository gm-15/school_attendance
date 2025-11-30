import express from 'express';
import {
  createAppeal,
  getAppeals,
  getAppealById,
  updateAppeal
} from '../controllers/appeal.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);

router.post('/attendance/:id/appeals', createAppeal);
router.get('/', getAppeals);
router.get('/:id', getAppealById);
router.patch('/:id', instructorOrAdmin, auditMiddleware('appeal_approval', 'Appeal', (req) => req.params.id), updateAppeal);

export default router;

