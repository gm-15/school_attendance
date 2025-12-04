import sequelize from '../config/database.js';
import User from './User.js';
import Department from './Department.js';
import Semester from './Semester.js';
import Course from './Course.js';
import ClassSession from './ClassSession.js';
import Enrollment from './Enrollment.js';
import Attendance from './Attendance.js';
import ExcuseRequest from './ExcuseRequest.js';
import Appeal from './Appeal.js';
import Announcement from './Announcement.js';
import Message from './Message.js';
import Poll from './Poll.js';
import PollVote from './PollVote.js';
import AttendancePolicy from './AttendancePolicy.js';
import AuditLog from './AuditLog.js';
import File from './File.js';
import Notification from './Notification.js';
import SystemSetting from './SystemSetting.js';

// 모델 간 관계 설정
const models = {
  User,
  Department,
  Semester,
  Course,
  ClassSession,
  Enrollment,
  Attendance,
  ExcuseRequest,
  Appeal,
  Announcement,
  Message,
  Poll,
  PollVote,
  AttendancePolicy,
  AuditLog,
  File,
  Notification,
  SystemSetting
};

// 관계 설정
// User - Department
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });

// User - Course (담당 교원)
Course.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
User.hasMany(Course, { foreignKey: 'instructor_id', as: 'courses' });

// Course - Department
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(Course, { foreignKey: 'department_id', as: 'courses' });

// Course - Semester
Course.belongsTo(Semester, { foreignKey: 'semester_id', as: 'semester' });
Semester.hasMany(Course, { foreignKey: 'semester_id', as: 'courses' });

// ClassSession - Course
ClassSession.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasMany(ClassSession, { foreignKey: 'course_id', as: 'sessions' });

// Enrollment - User, Course
Enrollment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
User.hasMany(Enrollment, { foreignKey: 'user_id', as: 'enrollments' });
Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });

// Attendance - ClassSession, User
Attendance.belongsTo(ClassSession, { foreignKey: 'session_id', as: 'session' });
Attendance.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ClassSession.hasMany(Attendance, { foreignKey: 'session_id', as: 'attendances' });
User.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendances' });

// ExcuseRequest - ClassSession, User
ExcuseRequest.belongsTo(ClassSession, { foreignKey: 'session_id', as: 'session' });
ExcuseRequest.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
ClassSession.hasMany(ExcuseRequest, { foreignKey: 'session_id', as: 'excuseRequests' });
User.hasMany(ExcuseRequest, { foreignKey: 'student_id', as: 'excuseRequests' });

// Appeal - Attendance, User
Appeal.belongsTo(Attendance, { foreignKey: 'attendance_id', as: 'attendance' });
Appeal.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Attendance.hasMany(Appeal, { foreignKey: 'attendance_id', as: 'appeals' });
User.hasMany(Appeal, { foreignKey: 'student_id', as: 'appeals' });

// Announcement - Course, User
Announcement.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Announcement.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
Course.hasMany(Announcement, { foreignKey: 'course_id', as: 'announcements' });
User.hasMany(Announcement, { foreignKey: 'instructor_id', as: 'announcements' });

// Message - Course, User (sender, receiver)
Message.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiver_id', as: 'receiver' });
Course.hasMany(Message, { foreignKey: 'course_id', as: 'messages' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'sentMessages' });
User.hasMany(Message, { foreignKey: 'receiver_id', as: 'receivedMessages' });

// Poll - Course, User, ClassSession
Poll.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Poll.belongsTo(User, { foreignKey: 'instructor_id', as: 'instructor' });
Poll.belongsTo(ClassSession, { foreignKey: 'session_id', as: 'session' });
Course.hasMany(Poll, { foreignKey: 'course_id', as: 'polls' });
User.hasMany(Poll, { foreignKey: 'instructor_id', as: 'polls' });
ClassSession.hasOne(Poll, { foreignKey: 'session_id', as: 'poll' });

// PollVote - Poll, User
PollVote.belongsTo(Poll, { foreignKey: 'poll_id', as: 'poll' });
PollVote.belongsTo(User, { foreignKey: 'student_id', as: 'student' });
Poll.hasMany(PollVote, { foreignKey: 'poll_id', as: 'votes' });
User.hasMany(PollVote, { foreignKey: 'student_id', as: 'pollVotes' });

// AttendancePolicy - Course
AttendancePolicy.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
Course.hasOne(AttendancePolicy, { foreignKey: 'course_id', as: 'policy' });

// AuditLog - User
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });

// File - User
File.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });
User.hasMany(File, { foreignKey: 'uploader_id', as: 'files' });

// Notification - User
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

export {
  sequelize,
  User,
  Department,
  Semester,
  Course,
  ClassSession,
  Enrollment,
  Attendance,
  ExcuseRequest,
  Appeal,
  Announcement,
  Message,
  Poll,
  PollVote,
  AttendancePolicy,
  AuditLog,
  File,
  Notification,
  SystemSetting
};

// ⭐ default export 를 models → sequelize로 변경
export default sequelize;
