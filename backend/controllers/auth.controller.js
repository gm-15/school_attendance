import { User } from '../models/index.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { comparePassword, validatePassword, hashPassword } from '../utils/password.js';

// 로그인
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 사용자 찾기
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 비밀번호 검증
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 토큰 생성
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id, user.role);

    // Refresh Token을 DB에 저장
    user.refresh_token = refreshToken;
    await user.save();

    // Refresh Token을 HttpOnly Cookie에 저장
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    // 사용자 정보 반환 (비밀번호 제외)
    const userData = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      student_id: user.student_id,
      department_id: user.department_id
    };

    res.json({
      message: 'Login successful',
      accessToken,
      user: userData
    });
  } catch (error) {
    next(error);
  }
};

// 토큰 갱신
export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Refresh Token 검증
    const decoded = verifyRefreshToken(refreshToken);

    // 사용자 찾기 및 Refresh Token 확인
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // 새로운 Access Token 생성
    const accessToken = generateAccessToken(user.id, user.role);

    res.json({
      message: 'Token refreshed',
      accessToken
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(error);
  }
};

// 로그아웃
export const logout = async (req, res, next) => {
  try {
    // DB에서 Refresh Token 제거
    if (req.user) {
      req.user.refresh_token = null;
      await req.user.save();
    }

    // Cookie 삭제
    res.clearCookie('refresh_token');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

