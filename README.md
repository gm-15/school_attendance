# 학교 출석 프로그램

웹서버프로그래밍 기말 프로젝트 - 학교 출석 관리 시스템

## 📋 프로젝트 개요

학교 출석 프로그램은 관리자, 교원, 학생이 사용하는 통합 출석 관리 시스템입니다.
출석 체크, 공결 신청, 이의제기, 알림, 투표 등 다양한 기능을 제공합니다.

**제출 기한**: 2025년 12월 16일  
**작업 범위**: 백엔드(Node.js), 프론트엔드(React), DB(MySQL) 전 영역

---

## 🛠 기술 스택

### 백엔드
- **언어**: Node.js
- **프레임워크**: Express.js
- **ORM**: Sequelize
- **데이터베이스**: MySQL
- **인증**: JWT + Refresh Token + HttpOnly Cookie
- **파일 업로드**: Multer
- **엑셀 처리**: XLSX
- **보안**: Helmet, CORS, bcrypt

### 프론트엔드
- **프레임워크**: React + Vite
- **상태 관리**: Context API
- **라우팅**: React Router v6
- **HTTP 클라이언트**: Axios
- **UI**: 단색(Gray-scale) 커스텀 CSS 테마
- **디자인**: 모바일 퍼스트 (Mobile First)

### 데이터베이스
- **DBMS**: MySQL
- **ORM**: Sequelize
- **제약조건**: 외래키, unique, CASCADE 처리

---

## 🚀 설치 및 실행

### 사전 요구사항
- Node.js (v18 이상)
- MySQL (v8.0 이상)
- npm 또는 yarn

### 백엔드 설정

1. 백엔드 디렉토리로 이동
```bash
cd backend
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.example`을 참고하여 `.env` 파일 생성:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=attendance_system
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=3000
NODE_ENV=development
```

4. 데이터베이스 생성
MySQL에서 데이터베이스 생성:
```sql
CREATE DATABASE attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. 데이터베이스 테이블 생성
```bash
npm run migrate
```

6. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

서버는 `http://localhost:3000`에서 실행됩니다.  
네트워크 접속을 원하면 `http://0.0.0.0:3000`으로 설정되어 있습니다.

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동
```bash
cd frontend
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.  
네트워크 접속을 원하면 `http://[서버IP]:5173`으로 접속 가능합니다.

4. 프로덕션 빌드
```bash
npm run build
```

---

## 📁 프로젝트 구조

```
.
├── backend/
│   ├── config/              # 데이터베이스 설정
│   ├── controllers/         # 컨트롤러 (21개)
│   │   ├── admin.controller.js
│   │   ├── announcement.controller.js
│   │   ├── appeal.controller.js
│   │   ├── attendance.controller.js
│   │   ├── audit.controller.js
│   │   ├── auth.controller.js
│   │   ├── course.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── department.controller.js
│   │   ├── enrollment.controller.js
│   │   ├── excuse.controller.js
│   │   ├── file.controller.js
│   │   ├── message.controller.js
│   │   ├── notification.controller.js
│   │   ├── policy.controller.js
│   │   ├── poll.controller.js
│   │   ├── report.controller.js
│   │   ├── semester.controller.js
│   │   ├── session.controller.js
│   │   ├── system.controller.js
│   │   └── user.controller.js
│   ├── middleware/          # 미들웨어
│   │   ├── auth.js          # 인증/인가
│   │   ├── auditLog.js      # 감사 로그
│   │   └── errorHandler.js  # 에러 핸들러
│   ├── models/              # Sequelize 모델 (18개)
│   ├── routes/              # API 라우트
│   ├── scripts/              # 스크립트
│   │   ├── migrate.js       # 데이터베이스 마이그레이션
│   │   └── createTestExcelFiles.js  # 테스트 엑셀 파일 생성
│   ├── utils/               # 유틸리티 함수
│   ├── uploads/             # 업로드된 파일 저장소
│   └── server.js            # 서버 진입점
│
└── frontend/
    ├── src/
    │   ├── components/       # 공통 컴포넌트
    │   │   ├── NotificationCenter.jsx
    │   │   └── PrivateRoute.jsx
    │   ├── contexts/        # Context API
    │   │   └── AuthContext.jsx
    │   ├── pages/           # 페이지
    │   │   ├── admin/       # 관리자 페이지 (8개)
    │   │   ├── instructor/  # 교원 페이지 (11개)
    │   │   ├── student/     # 학생 페이지 (9개)
    │   │   ├── Dashboard.jsx
    │   │   └── Login.jsx
    │   ├── App.jsx          # 앱 진입점
    │   └── main.jsx         # React 진입점
    ├── index.html
    └── vite.config.js       # Vite 설정
```

---

## ✨ 주요 기능

### 1. 인증/인가 시스템 ✅
- JWT Access Token + Refresh Token
- HttpOnly Cookie 기반 로그인 유지
- 새로고침 시 자동 토큰 갱신
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해싱 (bcrypt)

### 2. 관리자 기능 ✅
- **학과 관리**: CRUD, 엑셀 일괄 등록
- **학기 관리**: CRUD
- **과목 관리**: CRUD, 엑셀 일괄 등록
- **사용자 관리**: CRUD, 엑셀 일괄 등록
- **수강신청 관리**: CRUD, 엑셀 일괄 등록
- **감사 로그 조회**: 필터링, 상세 보기
- **시스템 리포트**: 시스템 상태, 오류, 성능 리포트
- **시스템 설정**: 파일 업로드, 출석 세션, 알림, 비밀번호 정책 설정

### 3. 교원 기능 ✅
- **수업 세션 관리**: CRUD, 출석 시작/일시정지/종료
- **출석 관리**: 출석 현황 조회, 출석 정정 (호명 방식)
- **수강생 관리**: 수강생 목록 조회
- **공결 관리**: 공결 신청 목록, 승인/반려, 주차별/학생별 그룹화
- **이의제기 관리**: 이의제기 목록, 승인/반려
- **리포트/통계**: 출석률 통계, 위험군 학생 식별, 엑셀 다운로드
- **공지사항**: CRUD, 고정 기능
- **메시지**: 수강생과 1:1 메시지
- **투표**: 투표 생성, 결과 조회, 실시간 업데이트
- **출석 정책 설정**: 지각/결석 기준, 경고 기준, 가중치 설정

### 4. 학생 기능 ✅
- **수강신청**: 수강 가능한 과목 조회, 수강신청, 수강 취소
- **출석 체크**: 인증번호 입력, 자동 지각/결석 판정
- **출석 현황**: 과목별 출석 현황, 출석률 확인
- **공결 신청**: 공결 신청, 증빙 파일 업로드, 결과 확인
- **이의제기**: 이의제기 신청, 결과 확인
- **공지사항**: 공지사항 조회, 고정 공지사항 우선 표시
- **메시지**: 담당교원과 1:1 메시지
- **투표**: 투표 참여, 결과 조회, 실시간 업데이트

### 5. 알림 시스템 ✅
- **알림 타입**:
  - 출석 시작/종료 알림
  - 공결 결과 알림
  - 이의제기 결과 알림
  - 공지사항 알림
  - 투표 알림
  - 결석 경고 알림 (2회/3회 자동 생성)
- **알림 기능**:
  - 읽지 않은 알림 개수 배지 표시
  - 알림 목록 드롭다운
  - 개별/전체 읽음 처리
  - 30초마다 자동 업데이트 (폴링)

### 6. 출석 방식 ✅
- **인증번호 방식**: 6자리 인증번호 입력
- **호명 방식**: 교원이 직접 출석 체크
- **전자출결**: 틀만 구현 (추후 확장 가능)

### 7. 엑셀 기능 ✅
- **일괄 등록**:
  - 과목 엑셀 일괄 등록
  - 사용자 엑셀 일괄 등록
  - 수강신청 엑셀 일괄 등록
- **다운로드**:
  - 출석 리포트 엑셀 다운로드

### 8. 파일 관리 ✅
- 파일 업로드 (Multer)
- 파일 다운로드
- MIME 타입 검증
- 파일 크기 제한

### 9. 감사 로그 ✅
- 모든 민감 이벤트 자동 기록
  - 출석 변경
  - 공결 승인/반려
  - 이의제기 승인/반려
  - 정책 변경
  - 시스템 설정 변경
- 로그 조회 및 필터링
- 로그 보관 (1년)

---

## 🔐 기본 계정 정보

데이터베이스 마이그레이션 후 다음 계정으로 로그인할 수 있습니다:

### 관리자
- **이메일**: `admin@school.edu`
- **비밀번호**: `Admin@2024!Secure`

### 교원
- **이메일**: `instructor@school.edu`
- **비밀번호**: `Instructor@2024!Teach`

### 학생
- **이메일**: `student@school.edu`
- **비밀번호**: `Student@2024!Learn`
- **학번**: `202321001`

---

## 📡 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

### 사용자 관리
- `GET /api/users` - 사용자 목록
- `POST /api/users` - 사용자 생성
- `PUT /api/users/:id` - 사용자 수정
- `DELETE /api/users/:id` - 사용자 삭제
- `POST /api/users/import` - 엑셀 일괄 등록

### 학과 관리
- `GET /api/departments` - 학과 목록
- `POST /api/departments` - 학과 생성
- `PUT /api/departments/:id` - 학과 수정
- `DELETE /api/departments/:id` - 학과 삭제

### 학기 관리
- `GET /api/semesters` - 학기 목록
- `POST /api/semesters` - 학기 생성
- `PUT /api/semesters/:id` - 학기 수정
- `DELETE /api/semesters/:id` - 학기 삭제

### 과목 관리
- `GET /api/courses` - 과목 목록
- `POST /api/courses` - 과목 생성
- `PUT /api/courses/:id` - 과목 수정
- `DELETE /api/courses/:id` - 과목 삭제
- `POST /api/courses/import` - 엑셀 일괄 등록

### 수업 세션 관리
- `GET /api/courses/:courseId/sessions` - 세션 목록
- `POST /api/courses/:courseId/sessions` - 세션 생성
- `PUT /api/sessions/:id` - 세션 수정
- `DELETE /api/sessions/:id` - 세션 삭제
- `POST /api/sessions/:id/open` - 출석 시작
- `POST /api/sessions/:id/pause` - 출석 일시정지
- `POST /api/sessions/:id/close` - 출석 종료
- `GET /api/sessions/:id/attendance-code` - 인증번호 조회

### 출석 관리
- `POST /api/attendance/sessions/:id/attend` - 출석 체크
- `GET /api/attendance/sessions/:id/attendance` - 출석 현황
- `GET /api/attendance/sessions/:id/attendance/summary` - 출석 요약
- `PATCH /api/attendance/:id` - 출석 정정
- `POST /api/attendance/sessions/:id/roll-call` - 호명 출석 체크

### 공결 관리
- `POST /api/excuses` - 공결 신청
- `GET /api/excuses` - 공결 목록
- `GET /api/excuses/:id` - 공결 상세
- `PATCH /api/excuses/:id` - 공결 승인/반려

### 이의제기
- `POST /api/appeals` - 이의제기 신청
- `GET /api/appeals` - 이의제기 목록
- `GET /api/appeals/:id` - 이의제기 상세
- `PATCH /api/appeals/:id` - 이의제기 처리

### 수강신청
- `GET /api/enrollments/my` - 내 수강신청 목록
- `GET /api/enrollments/courses/:courseId/enrollments` - 과목별 수강생 목록
- `POST /api/enrollments` - 수강신청
- `DELETE /api/enrollments/:id` - 수강 취소
- `POST /api/enrollments/import` - 엑셀 일괄 등록

### 공지사항
- `GET /api/announcements/courses/:courseId/announcements` - 공지사항 목록
- `GET /api/announcements/:id` - 공지사항 상세
- `POST /api/announcements/courses/:courseId/announcements` - 공지사항 작성
- `PUT /api/announcements/:id` - 공지사항 수정
- `DELETE /api/announcements/:id` - 공지사항 삭제

### 메시지
- `GET /api/messages` - 메시지 목록
- `GET /api/messages/:id` - 메시지 상세
- `POST /api/messages` - 메시지 전송
- `PATCH /api/messages/:id/read` - 읽음 처리
- `DELETE /api/messages/:id` - 메시지 삭제

### 투표
- `GET /api/polls/courses/:courseId/polls` - 투표 목록
- `GET /api/polls/:id` - 투표 상세
- `POST /api/polls/courses/:courseId/polls` - 투표 생성
- `POST /api/polls/:id/vote` - 투표 참여
- `GET /api/polls/:id/results` - 투표 결과
- `POST /api/polls/:id/close` - 투표 마감

### 출석 정책
- `GET /api/policy/courses/:courseId/policy` - 정책 조회
- `PUT /api/policy/courses/:courseId/policy` - 정책 설정
- `GET /api/policy/courses/:courseId/score/attendance` - 출석 점수 조회

### 리포트/통계
- `GET /api/reports/attendance` - 출석 리포트
- `GET /api/reports/attendance/export` - 출석 리포트 엑셀 다운로드
- `GET /api/reports/risk-students` - 위험군 학생 조회

### 파일 관리
- `POST /api/files` - 파일 업로드
- `GET /api/files/:id` - 파일 다운로드
- `DELETE /api/files/:id` - 파일 삭제

### 감사 로그
- `GET /api/audits` - 감사 로그 조회 (필터링 지원)

### 알림
- `GET /api/notifications` - 알림 목록
- `PATCH /api/notifications/:id/read` - 알림 읽음 처리

### 대시보드
- `GET /api/dashboard` - 역할별 대시보드 데이터

### 관리자 전용
- `GET /api/admin/system/status` - 시스템 상태
- `GET /api/admin/system/errors` - 시스템 오류 리포트
- `GET /api/admin/system/performance` - 시스템 성능 리포트

### 시스템 설정
- `GET /api/system` - 시스템 설정 조회
- `GET /api/system/:key` - 특정 설정 조회
- `PUT /api/system/:key` - 특정 설정 업데이트
- `PUT /api/system` - 여러 설정 일괄 업데이트

---

## 🗄 데이터베이스 스키마

주요 테이블:
- `Users` - 사용자 (관리자, 교원, 학생)
- `Departments` - 학과
- `Semesters` - 학기
- `Courses` - 과목
- `ClassSessions` - 수업 세션
- `Enrollments` - 수강신청
- `Attendances` - 출석 기록
- `ExcuseRequests` - 공결 신청
- `Appeals` - 이의제기
- `Announcements` - 공지사항
- `Messages` - 메시지
- `Polls` - 투표
- `PollVotes` - 투표 참여
- `Notifications` - 알림
- `AttendancePolicies` - 출석 정책
- `AuditLogs` - 감사 로그
- `Files` - 파일
- `SystemSettings` - 시스템 설정

---

## 🌐 네트워크 접속 설정

### 로컬 네트워크 접속 활성화

같은 와이파이에 연결된 다른 기기에서 접속하려면:

1. **백엔드**: 이미 `0.0.0.0`으로 설정되어 있음
2. **프론트엔드**: `vite.config.js`에 `host: '0.0.0.0'` 설정 완료

서버 재시작 후:
- 로컬: `http://localhost:5173`
- 네트워크: `http://[서버IP주소]:5173`

### 방화벽 설정
Windows 방화벽에서 포트 5173과 3000을 허용해야 할 수 있습니다.

---

## 🧪 테스트

테스트 체크리스트는 `테스트_체크리스트.md` 파일을 참고하세요.

---

## 📝 주요 구현 사항

### 필수 요구사항 충족
- ✅ 출석 방식 2가지 이상 (인증번호, 호명)
- ✅ 쿠키 기반 로그인 유지 (Refresh Token + HttpOnly Cookie)
- ✅ 엑셀 수강신청 (20점 중 5점)
- ✅ 감사 로그 (모든 민감 이벤트)
- ✅ 공결·이의제기 워크플로

### 추가 구현 사항
- ✅ 알림 시스템 (폴링 방식)
- ✅ 커뮤니케이션 (공지사항, 메시지)
- ✅ 투표 시스템
- ✅ 리포트/통계
- ✅ 파일 관리
- ✅ 출석 정책 설정
- ✅ 시스템 리포트 및 설정

---

## 🐛 알려진 이슈

현재 알려진 이슈는 없습니다. 발견된 버그는 `테스트_체크리스트.md`에 기록해주세요.

---

## 📚 참고 문서

- `최종_견적서.md` - 프로젝트 요구사항 및 설계 문서
- `테스트_체크리스트.md` - 테스트 체크리스트

---

## 👥 개발자

웹서버프로그래밍 기말 프로젝트 팀

---

## 📄 라이선스

이 프로젝트는 기말 프로젝트용으로 제작되었습니다.

---

## 🔄 업데이트 이력

- **2025-12-01**: 프로젝트 완성
  - 모든 핵심 기능 구현 완료
  - 알림 시스템 구현 완료
  - 투표 시스템 구현 완료
  - 리포트/통계 구현 완료
  - 감사 로그 조회 구현 완료
  - 시스템 리포트 및 설정 구현 완료
  - 결석 경고 알림 자동 생성 구현 완료
