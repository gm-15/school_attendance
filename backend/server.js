import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ⭐ 추가: Sequelize 인스턴스 import
import sequelize from './models/index.js';

// 환경 변수 로드
dotenv.config();

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 라우터 import
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import semesterRoutes from './routes/semester.routes.js';
import courseRoutes from './routes/course.routes.js';
import sessionRoutes from './routes/session.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import excuseRoutes from './routes/excuse.routes.js';
import appealRoutes from './routes/appeal.routes.js';
import enrollmentRoutes from './routes/enrollment.routes.js';
import announcementRoutes from './routes/announcement.routes.js';
import messageRoutes from './routes/message.routes.js';
import pollRoutes from './routes/poll.routes.js';
import policyRoutes from './routes/policy.routes.js';
import reportRoutes from './routes/report.routes.js';
import fileRoutes from './routes/file.routes.js';
import auditRoutes from './routes/audit.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import adminRoutes from './routes/admin.routes.js';
import systemRoutes from './routes/system.routes.js';

// 에러 핸들러
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 정적 파일 서빙 (업로드된 파일)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/excuses', excuseRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system', systemRoutes);

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 에러 핸들러
app.use(errorHandler);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ⭐⭐ DB Sync 추가 ⭐⭐
sequelize.sync({ alter: true })
  .then(() => {
    console.log("✅ Database synced successfully!");
  })
  .catch(err => {
    console.error("❌ DB Sync error:", err);
  });

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://[your-ip]:${PORT}`);
});

export default app;
