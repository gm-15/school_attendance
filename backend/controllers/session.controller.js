import { ClassSession, Course, Enrollment, Attendance, Notification, AttendancePolicy } from '../models/index.js';
import { generateAttendanceCode } from '../utils/attendanceCode.js';
import { createAuditLog } from '../middleware/auditLog.js';
import { Op } from 'sequelize';

export const getSessionsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // 과목 존재 확인 및 권한 검증
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 조회 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view sessions for your own courses' });
    }

    const sessions = await ClassSession.findAll({
      where: { course_id: courseId },
      order: [['week', 'ASC'], ['session_number', 'ASC']]
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export const createSession = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { week, start_at, room, attendance_method, attendance_duration, is_holiday, is_makeup } = req.body;

    if (!week || !start_at) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 과목 존재 확인 및 권한 검증
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 세션 생성 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only create sessions for your own courses' });
    }

    // 이미 해당 주차에 세션이 있는지 확인
    const existingSessions = await ClassSession.findAll({
      where: {
        course_id: courseId,
        week: week
      }
    });

    if (existingSessions.length > 0) {
      return res.status(400).json({ error: 'Sessions for this week already exist' });
    }

    // 수업 시간에 따라 자동으로 세션 생성
    const totalMinutes = (course.duration_hours || 3) * 60 + (course.duration_minutes || 0);
    const sessionDuration = 60; // 1교시 = 60분
    const totalSessions = Math.ceil(totalMinutes / sessionDuration);

    const start = new Date(start_at);
    const createdSessions = [];

    for (let i = 1; i <= totalSessions; i++) {
      const sessionStart = new Date(start.getTime() + (i - 1) * 60 * 60000); // (i-1) * 60분
      const sessionEnd = new Date(sessionStart.getTime() + 60 * 60000); // 60분 후

      const session = await ClassSession.create({
        course_id: courseId,
        week,
        session_number: i,
        start_at: sessionStart,
        end_at: sessionEnd,
        room: room || course.room || null,
        attendance_method: attendance_method || 'code',
        attendance_duration: attendance_duration || 10,
        is_holiday: is_holiday || false,
        is_makeup: is_makeup || false,
        status: 'scheduled'
      });

      createdSessions.push(session);
    }

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_create',
      'ClassSession',
      createdSessions[0].id,
      null,
      { week, total_sessions: totalSessions, start_at, attendance_method: attendance_method || 'code' }
    );

    res.status(201).json(createdSessions);
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 수정 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update sessions for your own courses' });
    }

    const oldValue = {
      week: session.week,
      session_number: session.session_number,
      start_at: session.start_at,
      end_at: session.end_at,
      room: session.room,
      attendance_method: session.attendance_method,
      attendance_duration: session.attendance_duration,
      status: session.status
    };

    const { week, session_number, start_at, end_at, room, attendance_method, attendance_duration, is_holiday, is_makeup } = req.body;

    if (week !== undefined) session.week = week;
    if (session_number !== undefined) session.session_number = session_number;
    if (start_at) session.start_at = start_at;
    if (end_at) session.end_at = end_at;
    if (room !== undefined) session.room = room;
    if (attendance_method) session.attendance_method = attendance_method;
    if (attendance_duration !== undefined) {
      if (attendance_duration < 3 || attendance_duration > 15) {
        return res.status(400).json({ error: 'Attendance duration must be between 3 and 15 minutes' });
      }
      session.attendance_duration = attendance_duration;
    }
    if (is_holiday !== undefined) session.is_holiday = is_holiday;
    if (is_makeup !== undefined) session.is_makeup = is_makeup;

    // 날짜 유효성 검증
    if (session.start_at && session.end_at) {
      const start = new Date(session.start_at);
      const end = new Date(session.end_at);
      if (start >= end) {
        return res.status(400).json({ error: 'Start time must be before end time' });
      }
    }

    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_update',
      'ClassSession',
      session.id,
      oldValue,
      {
        week: session.week,
        session_number: session.session_number,
        start_at: session.start_at,
        end_at: session.end_at,
        attendance_method: session.attendance_method,
        attendance_duration: session.attendance_duration,
        status: session.status
      }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 삭제 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete sessions for your own courses' });
    }

    const oldValue = {
      week: session.week,
      session_number: session.session_number,
      start_at: session.start_at,
      end_at: session.end_at,
      course_id: session.course_id
    };

    await session.destroy();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_delete',
      'ClassSession',
      parseInt(id),
      oldValue,
      null
    );

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Cannot delete session with associated attendance records' });
    }
    next(error);
  }
};

export const openSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 열 수 있음
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only open sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'open';
    
    // 인증번호 방식인 경우 인증번호 생성
    if (session.attendance_method === 'code' && !session.attendance_code) {
      session.attendance_code = generateAttendanceCode();
    }

    await session.save();

    // 기본 시간만큼 세션 자동 생성 (1교시만 있는 경우)
    const course = session.course;
    const totalMinutes = (course.duration_hours || 3) * 60 + (course.duration_minutes || 0);
    const sessionDuration = 60; // 1교시 = 60분
    const totalSessions = Math.ceil(totalMinutes / sessionDuration);

    // 같은 주차의 세션이 1개만 있고, 총 세션 수가 1개보다 많은 경우 자동 생성
    const existingSessions = await ClassSession.findAll({
      where: {
        course_id: session.course_id,
        week: session.week
      },
      order: [['session_number', 'ASC']]
    });

    if (existingSessions.length === 1 && totalSessions > 1) {
      // 나머지 세션들 자동 생성
      const sessionStart = new Date(session.start_at);
      const sessionEnd = new Date(session.end_at);
      const sessionInterval = sessionEnd.getTime() - sessionStart.getTime(); // 1교시 간격

      for (let i = 2; i <= totalSessions; i++) {
        const newSessionStart = new Date(sessionStart.getTime() + (i - 1) * sessionInterval);
        const newSessionEnd = new Date(newSessionStart.getTime() + sessionInterval);

        await ClassSession.create({
          course_id: session.course_id,
          week: session.week,
          session_number: i,
          start_at: newSessionStart,
          end_at: newSessionEnd,
          room: session.room,
          attendance_method: session.attendance_method,
          attendance_duration: session.attendance_duration,
          is_holiday: session.is_holiday,
          is_makeup: session.is_makeup,
          status: 'scheduled'
        });
      }
    }

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_open',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'open', attendance_code: session.attendance_code }
    );

    // 수강생들에게 출석 시작 알림 생성
    const enrollments = await Enrollment.findAll({
      where: { course_id: session.course_id }
    });

    const notificationPromises = enrollments.map(enrollment => 
      Notification.create({
        user_id: enrollment.user_id,
        type: 'attendance_open',
        title: `출석 체크가 시작되었습니다`,
        content: `${session.course.title} ${session.week}주차 ${session.session_number}회차 출석 체크가 시작되었습니다.`,
        related_type: 'ClassSession',
        related_id: session.id
      })
    );

    await Promise.all(notificationPromises);

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const pauseSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 일시정지 가능
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only pause sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'paused';
    await session.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_pause',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'paused' }
    );

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 교원은 자신의 과목 세션만 닫을 수 있음
    if (req.user.role === 'Instructor' && session.course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only close sessions for your own courses' });
    }

    const oldStatus = session.status;
    session.status = 'closed';
    await session.save();

    // 출석한 학생 목록 가져오기
    const enrollments = await Enrollment.findAll({
      where: { course_id: session.course_id }
    });
    const enrolledStudentIds = enrollments.map(e => e.user_id);

    const attendedStudents = await Attendance.findAll({
      where: { session_id: id }
    });
    const attendedStudentIds = attendedStudents.map(a => a.student_id);

    // 출석하지 않은 학생들 자동 결석 처리
    const absentStudentIds = enrolledStudentIds.filter(sid => !attendedStudentIds.includes(sid));
    
    // 출석 정책 가져오기
    const policy = await AttendancePolicy.findOne({
      where: { course_id: session.course_id }
    });

    const warningThreshold = policy?.absence_warning_threshold || 2;
    const dangerThreshold = policy?.absence_danger_threshold || 3;

    // 해당 과목의 모든 세션 ID 가져오기
    const allSessions = await ClassSession.findAll({
      where: { course_id: session.course_id }
    });
    const allSessionIds = allSessions.map(s => s.id);

    for (const studentId of absentStudentIds) {
      // 이미 출석 기록이 있는지 확인 (중복 방지)
      const existing = await Attendance.findOne({
        where: { session_id: id, student_id: studentId }
      });

      if (!existing) {
        await Attendance.create({
          session_id: id,
          student_id: studentId,
          status: 3, // 결석
          checked_at: new Date(),
          late_minutes: 0
        });

        // 결석 경고 알림 생성
        const allAttendances = await Attendance.findAll({
          where: {
            session_id: { [Op.in]: allSessionIds },
            student_id: studentId,
            status: 3 // 결석만 카운트
          }
        });

        const absentCount = allAttendances.length;

        // 정확히 경고 횟수일 때만 알림 생성 (중복 방지)
        if (absentCount === warningThreshold) {
          await Notification.create({
            user_id: studentId,
            type: 'absence_warning',
            title: `결석 경고 (${absentCount}회)`,
            content: `${session.course.title}에서 결석이 ${absentCount}회 누적되었습니다. 출석에 주의해주세요.`,
            related_type: 'Course',
            related_id: session.course_id
          });
        } else if (absentCount === dangerThreshold) {
          await Notification.create({
            user_id: studentId,
            type: 'absence_warning',
            title: `결석 위험 (${absentCount}회)`,
            content: `${session.course.title}에서 결석이 ${absentCount}회 누적되었습니다. 계속 결석 시 성적에 불이익이 있을 수 있습니다.`,
            related_type: 'Course',
            related_id: session.course_id
          });
        }
      }
    }

    // 감사 로그 기록
    await createAuditLog(
      req,
      'session_close',
      'ClassSession',
      session.id,
      { status: oldStatus },
      { status: 'closed', auto_absent_count: absentStudentIds.length }
    );

    // 수강생들에게 출석 종료 알림 생성
    const notificationPromises = enrollments.map(enrollment => 
      Notification.create({
        user_id: enrollment.user_id,
        type: 'attendance_close',
        title: `출석 체크가 종료되었습니다`,
        content: `${session.course.title} ${session.week}주차 ${session.session_number}회차 출석 체크가 종료되었습니다.`,
        related_type: 'ClassSession',
        related_id: session.id
      })
    );

    await Promise.all(notificationPromises);

    res.json(session);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceCode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await ClassSession.findByPk(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // 인증번호가 없으면 생성
    if (!session.attendance_code) {
      session.attendance_code = generateAttendanceCode();
      await session.save();
    }

    res.json({ attendance_code: session.attendance_code });
  } catch (error) {
    next(error);
  }
};

