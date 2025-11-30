import sequelize from '../config/database.js';
import { testConnection } from '../config/database.js';
import { User, Department } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

const seed = async () => {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('Database connection failed');
      process.exit(1);
    }

    console.log('Starting database seeding...');

    // 기본 학과 생성
    const [csDept, eeDept] = await Department.findOrCreate({
      where: { code: 'CS' },
      defaults: { name: '컴퓨터공학과', code: 'CS' }
    });

    await Department.findOrCreate({
      where: { code: 'EE' },
      defaults: { name: '전기전자공학과', code: 'EE' }
    });

    // 기본 관리자 계정 생성
    const adminPassword = await hashPassword('Admin@2024!Secure');
    const [admin] = await User.findOrCreate({
      where: { email: 'admin@school.edu' },
      defaults: {
        role: 'Admin',
        name: '관리자',
        email: 'admin@school.edu',
        password_hash: adminPassword,
        department_id: csDept.id
      }
    });

    // 기본 교원 계정 생성
    const instructorPassword = await hashPassword('Instructor@2024!Teach');
    const [instructor] = await User.findOrCreate({
      where: { email: 'instructor@school.edu' },
      defaults: {
        role: 'Instructor',
        name: '교수님',
        email: 'instructor@school.edu',
        password_hash: instructorPassword,
        department_id: csDept.id
      }
    });

    // 기본 학생 계정 생성
    const studentPassword = await hashPassword('Student@2024!Learn');
    const [student] = await User.findOrCreate({
      where: { email: 'student@school.edu' },
      defaults: {
        role: 'Student',
        name: '학생',
        email: 'student@school.edu',
        password_hash: studentPassword,
        student_id: '202321001',
        department_id: csDept.id
      }
    });

    console.log('\n=== 기본 계정 정보 ===');
    console.log('관리자:');
    console.log('  이메일: admin@school.edu');
    console.log('  비밀번호: Admin@2024!Secure');
    console.log('\n교원:');
    console.log('  이메일: instructor@school.edu');
    console.log('  비밀번호: Instructor@2024!Teach');
    console.log('\n학생:');
    console.log('  이메일: student@school.edu');
    console.log('  비밀번호: Student@2024!Learn');
    console.log('  학번: 202321001');
    console.log('\nDatabase seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();

