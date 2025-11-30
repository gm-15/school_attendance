import bcrypt from 'bcrypt';

// 비밀번호 해싱
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// 비밀번호 검증
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// 비밀번호 정책 검증
export const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return { valid: false, message: '비밀번호는 대소문자를 포함해야 합니다.' };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '비밀번호는 숫자를 포함해야 합니다.' };
  }

  // 허용된 특수문자: !@#$%^&*()_+-=[]{}|;:,.<>?
  const allowedSpecialChars = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/;
  if (!allowedSpecialChars.test(password)) {
    return { valid: false, message: '비밀번호는 특수문자를 포함해야 합니다.' };
  }

  return { valid: true };
};

