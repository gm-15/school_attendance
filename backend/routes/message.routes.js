import express from 'express';
import {
  getMessages,
  getMessageById,
  createMessage,
  markAsRead,
  deleteMessage
} from '../controllers/message.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getMessages);
router.get('/:id', getMessageById);
router.post('/', createMessage);
router.patch('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

export default router;

