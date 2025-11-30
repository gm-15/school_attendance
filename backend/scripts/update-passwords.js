import sequelize from '../config/database.js';
import { testConnection } from '../config/database.js';
import { User } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

const updatePasswords = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Database connection failed');
      process.exit(1);
    }

    console.log('Updating user passwords...');

    // 관리자 비밀번호 업데이트
    const admin = await User.findOne({ where: { email: 'admin@school.edu' } });
    if (admin) {
      admin.password_hash = await hashPassword('Admin@2024!Secure');
      await admin.save();
      console.log('✓ Admin password updated');
    }

    // 교원 비밀번호 업데이트
    const instructor = await User.findOne({ where: { email: 'instructor@school.edu' } });
    if (instructor) {
      instructor.password_hash = await hashPassword('Instructor@2024!Teach');
      await instructor.save();
      console.log('✓ Instructor password updated');
    }

    // 학생 비밀번호 업데이트
    const student = await User.findOne({ where: { email: 'student@school.edu' } });
    if (student) {
      student.password_hash = await hashPassword('Student@2024!Learn');
      await student.save();
      console.log('✓ Student password updated');
    }

    console.log('\n=== 업데이트된 계정 정보 ===');
    console.log('관리자:');
    console.log('  이메일: admin@school.edu');
    console.log('  비밀번호: Admin@2024!Secure');
    console.log('\n교원:');
    console.log('  이메일: instructor@school.edu');
    console.log('  비밀번호: Instructor@2024!Teach');
    console.log('\n학생:');
    console.log('  이메일: student@school.edu');
    console.log('  비밀번호: Student@2024!Learn');
    console.log('\nPassword update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Password update failed:', error);
    process.exit(1);
  }
};

updatePasswords();

