import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 샘플 데이터 생성
const sampleData = [
  // course_id, student_id, role 형식
  { course_id: 1, student_id: '202321001', role: 'student' },
  { course_id: 1, student_id: '202321002', role: 'student' },
  { course_id: 1, student_id: '202321003', role: 'student' },
  { course_id: 1, student_id: '202321004', role: 'student' },
  { course_id: 1, student_id: '202321005', role: 'student' },
  { course_id: 2, student_id: '202321001', role: 'student' },
  { course_id: 2, student_id: '202321002', role: 'student' },
  { course_id: 2, student_id: '202321003', role: 'student' },
  { course_id: 3, student_id: '202321004', role: 'student' },
  { course_id: 3, student_id: '202321005', role: 'student' },
];

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

// 파일 저장
const outputPath = path.join(__dirname, '../sample_enrollments.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ 샘플 엑셀 파일이 생성되었습니다:');
console.log(`   ${outputPath}`);
console.log('\n📋 파일 내용:');
console.log('   - course_id: 과목 ID (1, 2, 3 등)');
console.log('   - student_id: 학번 (202321001, 202321002 등)');
console.log('   - role: 역할 (student)');
console.log('\n💡 사용 방법:');
console.log('   1. 관리자 페이지의 "수강신청 관리"로 이동');
console.log('   2. "엑셀 일괄 등록" 버튼 클릭');
console.log('   3. 생성된 sample_enrollments.xlsx 파일 업로드');
console.log('\n⚠️  주의사항:');
console.log('   - course_id는 실제 데이터베이스에 존재하는 과목 ID여야 합니다');
console.log('   - student_id는 실제 데이터베이스에 존재하는 학번이어야 합니다');
console.log('   - 이미 수강신청된 경우 오류가 발생합니다');

