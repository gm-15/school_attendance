const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('Admin')); // 관리자만 접근

router.get('/', async (req, res) => {
  res.json({ message: '감사 로그 조회 API (구현 예정)' });
});

module.exports = router;

