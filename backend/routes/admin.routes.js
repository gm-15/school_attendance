import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

import {
  getSystemStatus,
  getSystemErrors,
  getSystemPerformance
} from '../controllers/admin.controller.js';

import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

/**
 * 관리자 초기화 API
 * 프론트에서 로그인 실패 시 자동 호출됨
 */
router.post('/bootstrap', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const hashed = await bcrypt.hash(password || 'admin1234', 10);

    await User.upsert({
      email,
      name: name || 'System Admin',
      password_hash: hashed,
      role: 'admin',
      department_id: 1
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Admin bootstrap failed:', err);
    return res.status(500).json({ error: 'Admin bootstrap failed' });
  }
})

// ---- 아래부터 기존 기능 유지 ----

router.use(authenticate);
router.use(adminOnly);

router.get('/system/status', getSystemStatus);
router.get('/system/errors', getSystemErrors);
router.get('/system/performance', getSystemPerformance);

export default router;
