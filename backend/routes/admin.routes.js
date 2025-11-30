import express from 'express';
import {
  getSystemStatus,
  getSystemErrors,
  getSystemPerformance
} from '../controllers/admin.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(adminOnly);

router.get('/system/status', getSystemStatus);
router.get('/system/errors', getSystemErrors);
router.get('/system/performance', getSystemPerformance);

export default router;

