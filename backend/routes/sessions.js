const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  res.json({ message: '세션 목록 API (구현 예정)' });
});

module.exports = router;

