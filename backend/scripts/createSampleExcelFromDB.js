import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sequelize from '../config/database.js';
import { Course, User } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 데이터베이스에서 실제 데이터 가져오기
const createSampleExcel = async () => {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 실제 과목 목록 가져오기
    const courses = await Course.findAll({
      attributes: ['id', 'title', 'code', 'section'],
      order: [['id', 'ASC']]
    });

    // 실제 학생 목록 가져오기
    const students = await User.findAll({
      where: { role: 'Student' },
      attributes: ['id', 'student_id', 'name', 'email'],
      order: [['student_id', 'ASC']]
    });

    console.log('📚 실제 과목 목록:');
    courses.forEach(course => {
      console.log(`   - ID: ${course.id}, ${course.title} (${course.code}-${course.section})`);
    });

    console.log('\n👥 실제 학생 목록:');
    students.forEach(student => {
      console.log(`   - 학번: ${student.student_id}, 이름: ${student.name}`);
    });

    if (courses.length === 0) {
      console.log('\n⚠️  경고: 등록된 과목이 없습니다. 과목을 먼저 등록해주세요.');
      process.exit(1);
    }

    if (students.length === 0) {
      console.log('\n⚠️  경고: 등록된 학생이 없습니다. 학생을 먼저 등록해주세요.');
      process.exit(1);
    }

    // 샘플 데이터 생성 (실제 데이터베이스의 ID 사용)
    const sampleData = [];
    
    // 각 과목에 대해 학생들을 배정
    courses.forEach((course, courseIndex) => {
      // 각 과목당 최대 5명의 학생 배정
      const studentsForCourse = students.slice(0, Math.min(5, students.length));
      
      studentsForCourse.forEach((student, studentIndex) => {
        sampleData.push({
          course_id: course.id,
          student_id: student.student_id,
          role: 'student'
        });
      });
    });

    console.log(`\n📝 생성할 샘플 데이터: ${sampleData.length}건\n`);

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // 컬럼 너비 설정
    worksheet['!cols'] = [
      { wch: 12 }, // course_id
      { wch: 15 }, // student_id
      { wch: 10 }  // role
    ];

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, '수강신청');

    // 파일 저장 (다른 이름으로 저장하여 기존 파일과 충돌 방지)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outputPath = path.join(__dirname, `../sample_enrollments_${timestamp}.xlsx`);
    XLSX.writeFile(workbook, outputPath);

    console.log('✅ 샘플 엑셀 파일이 생성되었습니다:');
    console.log(`   ${outputPath}`);
    console.log('\n📋 파일 내용:');
    console.log('   - course_id: 실제 데이터베이스의 과목 ID');
    console.log('   - student_id: 실제 데이터베이스의 학번');
    console.log('   - role: 역할 (student)');
    console.log('\n💡 사용 방법:');
    console.log('   1. 관리자 페이지의 "수강신청 관리"로 이동');
    console.log('   2. "엑셀 일괄 등록" 버튼 클릭');
    console.log('   3. 생성된 sample_enrollments.xlsx 파일 업로드');
    console.log('\n⚠️  주의사항:');
    console.log('   - 이미 수강신청된 경우 오류가 발생합니다');
    console.log('   - 같은 학생이 같은 과목에 중복 등록될 수 없습니다');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createSampleExcel();

