import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  importCourses,
  uploadMiddleware
} from '../controllers/course.controller.js';
import { authenticate, adminOnly, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getCourses);
router.get('/:id', getCourseById);
router.post('/', adminOnly, createCourse);
router.post('/import', adminOnly, uploadMiddleware, importCourses);
router.put('/:id', adminOnly, updateCourse);
router.delete('/:id', adminOnly, deleteCourse);

export default router;

