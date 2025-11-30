const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', async (req, res) => {
  res.json({ message: '출석 체크 API (구현 예정)' });
});

module.exports = router;

