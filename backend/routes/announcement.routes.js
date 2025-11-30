import express from 'express';
import {
  getAnnouncementsByCourse,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcement.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId/announcements', getAnnouncementsByCourse);
router.get('/:id', getAnnouncementById);
router.post('/courses/:courseId/announcements', instructorOrAdmin, createAnnouncement);
router.put('/:id', instructorOrAdmin, updateAnnouncement);
router.delete('/:id', instructorOrAdmin, deleteAnnouncement);

export default router;

