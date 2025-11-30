import express from 'express';
import {
  attendSession,
  getAttendanceBySession,
  getAttendanceSummary,
  updateAttendance,
  getAttendanceByCourse,
  markAttendanceByRollCall
} from '../controllers/attendance.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// 학생 출석 체크
router.post('/sessions/:id/attend', attendSession);
// 세션별 출석 현황 조회
router.get('/sessions/:id/attendance', getAttendanceBySession);
// 세션별 출석 요약
router.get('/sessions/:id/attendance/summary', getAttendanceSummary);
// 출석 정정 (교원)
router.patch('/:id', instructorOrAdmin, updateAttendance);
// 호명 방식 출석 체크 (교원)
router.post('/sessions/:id/roll-call', instructorOrAdmin, markAttendanceByRollCall);
// 과목별 출석 현황
router.get('/courses/:courseId/attendance', getAttendanceByCourse);

export default router;

