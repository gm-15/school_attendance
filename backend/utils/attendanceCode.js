// 6자리 인증번호 생성
export const generateAttendanceCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
