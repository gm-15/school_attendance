import express from 'express';
import {
  getPollsByCourse,
  getPollById,
  createPoll,
  votePoll,
  getPollResults,
  closePoll
} from '../controllers/poll.controller.js';
import { authenticate, instructorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/courses/:courseId/polls', getPollsByCourse);
router.get('/:id', getPollById);
router.post('/courses/:courseId/polls', instructorOrAdmin, createPoll);
router.post('/:id/vote', votePoll);
router.get('/:id/results', getPollResults);
router.post('/:id/close', instructorOrAdmin, closePoll);

export default router;

