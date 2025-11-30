import express from 'express';
import { login, refresh, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// 로그인
router.post('/login', login);

// 토큰 갱신 (HttpOnly Cookie에서 refresh_token 읽기)
router.post('/refresh', refresh);

// 로그아웃
router.post('/logout', authenticate, logout);

export default router;

