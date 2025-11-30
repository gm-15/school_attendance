const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// 모든 라우트는 인증 필요
router.use(authenticate);

// 사용자 목록 (관리자만)
router.get('/', authorize('Admin'), async (req, res) => {
  try {
    res.json({ message: '사용자 목록 API (구현 예정)' });
  } catch (error) {
    res.status(500).json({ message: '오류가 발생했습니다.' });
  }
});

// 사용자 상세
router.get('/:id', async (req, res) => {
  try {
    res.json({ message: '사용자 상세 API (구현 예정)' });
  } catch (error) {
    res.status(500).json({ message: '오류가 발생했습니다.' });
  }
});

module.exports = router;

