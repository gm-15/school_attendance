import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.use(adminOnly); // 관리자만 접근

router.get('/', getAuditLogs);

export default router;

