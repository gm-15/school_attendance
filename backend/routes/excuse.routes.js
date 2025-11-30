import express from 'express';
import {
  createExcuse,
  getExcuses,
  getExcuseById,
  updateExcuse
} from '../controllers/excuse.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);

// 주차 단위 공결 신청
router.post('/courses/:courseId/weeks/:week/excuses', createExcuse);
// 기존 세션 단위 (하위 호환성을 위해 유지하되 사용 안 함)
// router.post('/sessions/:id/excuses', createExcuse);
router.get('/', getExcuses);
router.get('/:id', getExcuseById);
router.patch('/:id', instructorOrAdmin, auditMiddleware('excuse_approval', 'ExcuseRequest', (req) => req.params.id), updateExcuse);

export default router;

