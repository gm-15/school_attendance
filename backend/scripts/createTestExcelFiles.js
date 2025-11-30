import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sequelize from '../config/database.js';
import { Course, User, Department, Semester } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const createTestExcelFiles = async () => {
  try {
    // 데이터베이스 연결 확인
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 실제 데이터 가져오기
    const [departments, semesters, instructors] = await Promise.all([
      Department.findAll({ order: [['id', 'ASC']] }),
      Semester.findAll({ order: [['id', 'ASC']] }),
      User.findAll({ where: { role: 'Instructor' }, order: [['id', 'ASC']] })
    ]);

    console.log('📚 데이터베이스 정보:');
    console.log(`   - 학과: ${departments.length}개`);
    departments.forEach(dept => {
      console.log(`     * ${dept.name} (${dept.code}) - ID: ${dept.id}`);
    });
    console.log(`   - 학기: ${semesters.length}개`);
    semesters.forEach(sem => {
      console.log(`     * ${sem.year}년 ${sem.term} - ID: ${sem.id}`);
    });
    console.log(`   - 교원: ${instructors.length}명`);
    instructors.forEach(inst => {
      console.log(`     * ${inst.name} (${inst.email}) - ID: ${inst.id}`);
    });

    if (departments.length === 0 || semesters.length === 0 || instructors.length === 0) {
      console.log('\n⚠️  경고: 학과, 학기, 또는 교원이 없습니다. 먼저 데이터를 등록해주세요.');
      process.exit(1);
    }

    // 테스트용 과목 데이터 생성 (3개)
    const courseData = [
      {
        title: '웹서버프로그래밍',
        code: 'HBJ00052',
        section: 1,
        instructor_email: instructors[0].email,
        semester_id: semesters[0].id,
        department_code: departments[0].code,
        room: '101',
        duration_hours: 3,
        duration_minutes: 0
      },
      {
        title: '데이터베이스시스템',
        code: 'CS20001',
        section: 1,
        instructor_email: instructors[0].email,
        semester_id: semesters[0].id,
        department_code: departments[0].code,
        room: '102',
        duration_hours: 3,
        duration_minutes: 0
      },
      {
        title: '알고리즘',
        code: 'CS20002',
        section: 1,
        instructor_email: instructors[0].email,
        semester_id: semesters[0].id,
        department_code: departments[0].code,
        room: '103',
        duration_hours: 2,
        duration_minutes: 30
      }
    ];

    // 테스트용 학생 데이터 생성 (10명)
    const studentData = [
      {
        role: 'Student',
        name: '홍길동',
        email: 'hong@school.edu',
        password: 'Student123!',
        student_id: '202321002',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '김철수',
        email: 'kim@school.edu',
        password: 'Student123!',
        student_id: '202321003',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '이영희',
        email: 'lee@school.edu',
        password: 'Student123!',
        student_id: '202321004',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '박민수',
        email: 'park@school.edu',
        password: 'Student123!',
        student_id: '202321005',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '정수진',
        email: 'jung@school.edu',
        password: 'Student123!',
        student_id: '202321006',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '최동현',
        email: 'choi@school.edu',
        password: 'Student123!',
        student_id: '202321007',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '강미영',
        email: 'kang@school.edu',
        password: 'Student123!',
        student_id: '202321008',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '윤성호',
        email: 'yoon@school.edu',
        password: 'Student123!',
        student_id: '202321009',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '임지은',
        email: 'lim@school.edu',
        password: 'Student123!',
        student_id: '202321010',
        department_code: departments[0].code
      },
      {
        role: 'Student',
        name: '한소영',
        email: 'han@school.edu',
        password: 'Student123!',
        student_id: '202321011',
        department_code: departments[0].code
      }
    ];

    // 과목 엑셀 파일 생성
    const courseWorkbook = XLSX.utils.book_new();
    const courseWorksheet = XLSX.utils.json_to_sheet(courseData);
    courseWorksheet['!cols'] = [
      { wch: 20 }, // title
      { wch: 12 }, // code
      { wch: 8 },  // section
      { wch: 25 }, // instructor_email
      { wch: 12 }, // semester_id
      { wch: 15 }, // department_code
      { wch: 8 },  // room
      { wch: 15 }, // duration_hours
      { wch: 15 }  // duration_minutes
    ];
    XLSX.utils.book_append_sheet(courseWorkbook, courseWorksheet, '과목');
    const coursePath = path.join(__dirname, '../test_courses.xlsx');
    XLSX.writeFile(courseWorkbook, coursePath);

    // 학생 엑셀 파일 생성
    const studentWorkbook = XLSX.utils.book_new();
    const studentWorksheet = XLSX.utils.json_to_sheet(studentData);
    studentWorksheet['!cols'] = [
      { wch: 10 }, // role
      { wch: 12 }, // name
      { wch: 20 }, // email
      { wch: 15 }, // password
      { wch: 12 }, // student_id
      { wch: 15 }  // department_code
    ];
    XLSX.utils.book_append_sheet(studentWorkbook, studentWorksheet, '학생');
    const studentPath = path.join(__dirname, '../test_students.xlsx');
    XLSX.writeFile(studentWorkbook, studentPath);

    console.log('\n✅ 테스트용 엑셀 파일이 생성되었습니다:');
    console.log(`   📄 과목 파일: ${coursePath}`);
    console.log(`   👥 학생 파일: ${studentPath}`);
    console.log('\n📋 파일 내용:');
    console.log('   과목 파일:');
    courseData.forEach((course, idx) => {
      console.log(`     ${idx + 1}. ${course.title} (${course.code}-${course.section})`);
    });
    console.log('   학생 파일:');
    studentData.forEach((student, idx) => {
      console.log(`     ${idx + 1}. ${student.name} (${student.student_id}) - ${student.email}`);
    });
    console.log('\n💡 사용 방법:');
    console.log('   1. 관리자 페이지의 "과목 관리" 탭에서 "엑셀 일괄 등록" 클릭');
    console.log('   2. test_courses.xlsx 파일 업로드');
    console.log('   3. 관리자 페이지의 "사용자 관리" 탭에서 "엑셀 일괄 등록" 클릭');
    console.log('   4. test_students.xlsx 파일 업로드');
    console.log('\n⚠️  주의사항:');
    console.log('   - 이미 존재하는 이메일이나 학번은 오류가 발생합니다');
    console.log('   - 모든 학생의 비밀번호는 "Student123!" 입니다');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await sequelize.close();
    process.exit(1);
  }
};

createTestExcelFiles();

