import express from 'express';
import {
  getAttendanceReport,
  exportAttendanceReport,
  getRiskStudents
} from '../controllers/report.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/attendance', instructorOrAdmin, getAttendanceReport);
router.get('/attendance/export', instructorOrAdmin, exportAttendanceReport);
router.get('/risk-students', instructorOrAdmin, getRiskStudents);

export default router;

