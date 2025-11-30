const sequelize = require('../config/database');
const models = require('../models');

// 데이터베이스 초기화 및 테이블 생성
const initDatabase = async () => {
  try {
    // 데이터베이스 연결 테스트
    await sequelize.authenticate();
    console.log('데이터베이스 연결 성공');

    // 테이블 생성 (force: false - 기존 테이블 유지)
    await sequelize.sync({ force: false, alter: true });
    console.log('데이터베이스 테이블 생성 완료');

    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    process.exit(1);
  }
};

initDatabase();

