import { User, Course, ClassSession, Attendance, Enrollment, AuditLog, Notification, ExcuseRequest, Appeal } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

// 시스템 상태 리포트
export const getSystemStatus = async (req, res, next) => {
  try {
    // 사용자 통계
    const totalUsers = await User.count();
    const adminCount = await User.count({ where: { role: 'Admin' } });
    const instructorCount = await User.count({ where: { role: 'Instructor' } });
    const studentCount = await User.count({ where: { role: 'Student' } });

    // 과목 통계
    const totalCourses = await Course.count();
    const activeCourses = await Course.count({
      include: [{
        model: ClassSession,
        as: 'sessions',
        where: { status: { [Op.in]: ['open', 'scheduled'] } },
        required: false
      }]
    });

    // 출석 통계
    const totalSessions = await ClassSession.count();
    const openSessions = await ClassSession.count({ where: { status: 'open' } });
    const closedSessions = await ClassSession.count({ where: { status: 'closed' } });
    const totalAttendances = await Attendance.count();

    // 수강신청 통계
    const totalEnrollments = await Enrollment.count();

    // 공결/이의제기 통계
    const pendingExcuses = await ExcuseRequest.count({ where: { status: 'pending' } });
    const pendingAppeals = await Appeal.count({ where: { status: 'pending' } });

    // 알림 통계
    const unreadNotifications = await Notification.count({ where: { is_read: false } });

    // 감사 로그 통계 (최근 24시간)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentAuditLogs = await AuditLog.count({
      where: {
        createdAt: { [Op.gte]: oneDayAgo }
      }
    });

    // 데이터베이스 연결 상태 확인
    let dbStatus = 'connected';
    try {
      await sequelize.authenticate();
    } catch (error) {
      dbStatus = 'disconnected';
    }

    res.json({
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus
      },
      users: {
        total: totalUsers,
        admin: adminCount,
        instructor: instructorCount,
        student: studentCount
      },
      courses: {
        total: totalCourses,
        active: activeCourses
      },
      sessions: {
        total: totalSessions,
        open: openSessions,
        closed: closedSessions
      },
      attendance: {
        total_records: totalAttendances
      },
      enrollments: {
        total: totalEnrollments
      },
      pending: {
        excuses: pendingExcuses,
        appeals: pendingAppeals
      },
      notifications: {
        unread: unreadNotifications
      },
      audit_logs: {
        last_24h: recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

// 시스템 오류 리포트
export const getSystemErrors = async (req, res, next) => {
  try {
    const { start_date, end_date, limit = 100 } = req.query;

    const where = {
      action: {
        [Op.or]: [
          { [Op.like]: '%error%' },
          { [Op.like]: '%fail%' },
          { [Op.like]: '%exception%' }
        ]
      }
    };

    if (start_date || end_date) {
      where.createdAt = {};
      if (start_date) {
        where.createdAt[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.createdAt[Op.lte] = new Date(end_date);
      }
    } else {
      // 기본값: 최근 7일
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { [Op.gte]: sevenDaysAgo };
    }

    // 감사 로그에서 오류 관련 이벤트 조회
    const errorLogs = await AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // 통계
    const errorCount = errorLogs.length;
    const errorByType = {};
    errorLogs.forEach(log => {
      const type = log.action.split('_')[0] || 'unknown';
      errorByType[type] = (errorByType[type] || 0) + 1;
    });

    res.json({
      period: {
        start: start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: end_date || new Date().toISOString()
      },
      summary: {
        total_errors: errorCount,
        errors_by_type: errorByType
      },
      errors: errorLogs
    });
  } catch (error) {
    next(error);
  }
};

// 시스템 성능 리포트
export const getSystemPerformance = async (req, res, next) => {
  try {
    // 최근 7일간의 활동 통계
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayStart = date;
      const dayEnd = nextDate;

      const sessionsCreated = await ClassSession.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] }
        }
      });

      const attendancesCreated = await Attendance.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] }
        }
      });

      const auditLogsCreated = await AuditLog.count({
        where: {
          createdAt: { [Op.between]: [dayStart, dayEnd] }
        }
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        sessions: sessionsCreated,
        attendances: attendancesCreated,
        audit_logs: auditLogsCreated
      });
    }

    res.json({
      period: {
        start: sevenDaysAgo.toISOString(),
        end: new Date().toISOString()
      },
      daily_stats: dailyStats
    });
  } catch (error) {
    next(error);
  }
};

