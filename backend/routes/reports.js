const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/attendance', async (req, res) => {
  res.json({ message: '출석 리포트 API (구현 예정)' });
});

module.exports = router;

