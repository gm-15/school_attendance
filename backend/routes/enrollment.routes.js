import express from 'express';
import {
  getMyEnrollments,
  getEnrollmentsByCourse,
  createEnrollment,
  deleteEnrollment,
  importEnrollments,
  uploadMiddleware
} from '../controllers/enrollment.controller.js';
import { authenticate, adminOnly, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// 학생의 수강 과목 조회
router.get('/my', getMyEnrollments);
// 과목별 수강생 목록 조회
router.get('/courses/:courseId/enrollments', getEnrollmentsByCourse);
// 수강신청 생성 (학생 자신 또는 관리자)
router.post('/courses/:courseId/enrollments', authenticate, createEnrollment);
// 수강 취소 (학생 자신 또는 관리자)
router.delete('/:id', authenticate, deleteEnrollment);
// 엑셀 일괄 등록 (관리자만)
router.post('/import', adminOnly, uploadMiddleware, importEnrollments);

export default router;

