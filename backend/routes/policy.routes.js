import express from 'express';
import {
  getPolicy,
  updatePolicy,
  getAttendanceScore
} from '../controllers/policy.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId/policy', getPolicy);
router.put('/courses/:courseId/policy', instructorOrAdmin, auditMiddleware('policy_change', 'AttendancePolicy', (req) => req.params.courseId), updatePolicy);
router.get('/courses/:courseId/score/attendance', getAttendanceScore);

export default router;

