const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  res.json({ message: '학과 목록 API (구현 예정)' });
});

module.exports = router;

