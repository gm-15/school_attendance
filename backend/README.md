# 학교 출석 프로그램 백엔드

## 설치 및 실행

### 1. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 데이터베이스 정보를 입력하세요.

```bash
cp .env.example .env
```

### 2. 데이터베이스 생성
MySQL에서 데이터베이스를 생성하세요:
```sql
CREATE DATABASE attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. 데이터베이스 테이블 생성
```bash
npm run init-db
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 프로젝트 구조

```
backend/
├── config/
│   └── database.js          # Sequelize 설정
├── models/                  # 데이터베이스 모델
├── routes/                  # API 라우트
├── middleware/              # 미들웨어 (인증 등)
├── utils/                   # 유틸리티 함수
├── scripts/                 # 스크립트
├── uploads/                 # 파일 업로드 디렉토리
├── server.js                # 서버 진입점
└── package.json
```

## 주요 기능

- JWT + Refresh Token + HttpOnly Cookie 인증
- Sequelize ORM을 사용한 데이터베이스 관리
- 역할 기반 접근 제어 (Admin, Instructor, Student)
- 감사 로그 시스템
- 파일 업로드 (Multer)

