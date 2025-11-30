import express from 'express';
import {
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester
} from '../controllers/semester.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getSemesters);
router.get('/:id', getSemesterById);
router.post('/', adminOnly, createSemester);
router.put('/:id', adminOnly, updateSemester);
router.delete('/:id', adminOnly, deleteSemester);

export default router;

