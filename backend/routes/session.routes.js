import express from 'express';
import {
  getSessionsByCourse,
  createSession,
  updateSession,
  deleteSession,
  openSession,
  pauseSession,
  closeSession,
  getAttendanceCode
} from '../controllers/session.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId/sessions', getSessionsByCourse);
router.post('/courses/:courseId/sessions', instructorOrAdmin, createSession);
router.put('/sessions/:id', instructorOrAdmin, updateSession);
router.delete('/sessions/:id', instructorOrAdmin, deleteSession);
router.post('/sessions/:id/open', instructorOrAdmin, openSession);
router.post('/sessions/:id/pause', instructorOrAdmin, pauseSession);
router.post('/sessions/:id/close', instructorOrAdmin, closeSession);
router.get('/sessions/:id/attendance-code', instructorOrAdmin, getAttendanceCode);

export default router;

