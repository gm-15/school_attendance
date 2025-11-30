const express = require('express');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 로그인
router.post('/login', [
  body('email').isEmail().withMessage('유효한 이메일을 입력하세요.'),
  body('password').notEmpty().withMessage('비밀번호를 입력하세요.')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Access Token 생성
    const accessToken = generateAccessToken(user.id);

    // Refresh Token 생성 및 DB 저장
    const refreshToken = generateRefreshToken(user.id);
    await user.update({ refresh_token: refreshToken });

    // Refresh Token을 HttpOnly Cookie에 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    res.json({
      message: '로그인 성공',
      accessToken,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
  }
});

// 토큰 갱신 (쿠키에서 refresh_token 읽기)
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh Token이 없습니다.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(decoded.userId);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ message: '유효하지 않은 Refresh Token입니다.' });
    }

    // 새로운 Access Token 생성
    const accessToken = generateAccessToken(user.id);

    res.json({
      message: '토큰 갱신 성공',
      accessToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '유효하지 않은 Refresh Token입니다.' });
    }
    console.error('토큰 갱신 오류:', error);
    res.status(500).json({ message: '토큰 갱신 중 오류가 발생했습니다.' });
  }
});

// 로그아웃
router.post('/logout', authenticate, async (req, res) => {
  try {
    // DB에서 refresh_token 제거
    await req.user.update({ refresh_token: null });

    // Cookie 삭제
    res.clearCookie('refreshToken');

    res.json({ message: '로그아웃 성공' });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
  }
});

module.exports = router;

