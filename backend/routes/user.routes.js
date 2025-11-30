import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  importUsers,
  uploadMiddleware
} from '../controllers/user.controller.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLog.js';

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticate);

// 관리자만 접근 가능
router.get('/', adminOnly, getUsers);
router.get('/:id', adminOnly, getUserById);
router.post('/', adminOnly, createUser);
router.post('/import', adminOnly, uploadMiddleware, importUsers);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, auditMiddleware('user_delete', 'User', (req) => req.params.id), deleteUser);
router.put('/:id/role', adminOnly, auditMiddleware('role_change', 'User', (req) => req.params.id), updateUserRole);

export default router;

