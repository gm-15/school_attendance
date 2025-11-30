import { ExcuseRequest, ClassSession, User, Course, Attendance, Enrollment } from '../models/index.js';
import { Op } from 'sequelize';

// 공결 신청 (주차 단위)
export const createExcuse = async (req, res, next) => {
  try {
    const { courseId, week } = req.params;
    const { reason_code, reason_text, files } = req.body;
    const studentId = req.user.id;

    if (!reason_code) {
      return res.status(400).json({ error: 'Reason code is required' });
    }

    if (!['병가', '경조사', '기타'].includes(reason_code)) {
      return res.status(400).json({ error: 'Invalid reason code' });
    }

    // 과목 확인
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 수강 신청 확인
    const enrollment = await Enrollment.findOne({
      where: { course_id: courseId, user_id: studentId }
    });
    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this course' });
    }

    // 해당 주차의 모든 세션 조회
    const weekSessions = await ClassSession.findAll({
      where: {
        course_id: courseId,
        week: parseInt(week)
      },
      order: [['session_number', 'ASC']]
    });

    if (weekSessions.length === 0) {
      return res.status(404).json({ error: 'No sessions found for this week' });
    }

    // 이미 해당 주차에 공결 신청이 있는지 확인
    const sessionIds = weekSessions.map(s => s.id);
    const existing = await ExcuseRequest.findOne({
      where: {
        session_id: { [Op.in]: sessionIds },
        student_id: studentId
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Excuse request for this week already exists' });
    }

    // 해당 주차의 모든 세션에 대해 공결 신청 생성
    const createdExcuses = [];
    for (const session of weekSessions) {
      const excuse = await ExcuseRequest.create({
        session_id: session.id,
        student_id: studentId,
        reason_code,
        reason_text: reason_text || null,
        files: files || [],
        status: 'pending'
      });

      const excuseWithRelations = await ExcuseRequest.findByPk(excuse.id, {
        include: [
          { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number', 'start_at'] },
          { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
        ]
      });

      createdExcuses.push(excuseWithRelations);
    }

    res.status(201).json({
      week: parseInt(week),
      course_id: courseId,
      excuses: createdExcuses
    });
  } catch (error) {
    next(error);
  }
};

// 공결 신청 목록 조회
export const getExcuses = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // 교원인 경우 자신의 과목만, 관리자는 모두
    if (req.user.role === 'Instructor') {
      // 교원의 과목에 대한 공결만 조회
      const excuses = await ExcuseRequest.findAll({
        where,
        include: [
          {
            model: ClassSession,
            as: 'session',
            include: [{
              model: Course,
              as: 'course',
              where: { instructor_id: req.user.id }
            }]
          },
          { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
        ]
      });
      return res.json(excuses);
    }

    const excuses = await ExcuseRequest.findAll({
      where,
      include: [
        { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number', 'start_at'] },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.json(excuses);
  } catch (error) {
    next(error);
  }
};

// 공결 신청 상세
export const getExcuseById = async (req, res, next) => {
  try {
    const excuse = await ExcuseRequest.findByPk(req.params.id, {
      include: [
        { model: ClassSession, as: 'session' },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    if (!excuse) {
      return res.status(404).json({ error: 'Excuse request not found' });
    }

    res.json(excuse);
  } catch (error) {
    next(error);
  }
};

// 공결 승인/반려 (주차 단위 - 같은 주차의 모든 공결을 한 번에 처리)
export const updateExcuse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, instructor_comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const excuse = await ExcuseRequest.findByPk(id, {
      include: [{ model: ClassSession, as: 'session' }]
    });
    if (!excuse) {
      return res.status(404).json({ error: 'Excuse request not found' });
    }

    // 같은 주차, 같은 학생의 모든 공결 찾기
    const weekSessions = await ClassSession.findAll({
      where: {
        course_id: excuse.session.course_id,
        week: excuse.session.week
      }
    });

    const weekSessionIds = weekSessions.map(s => s.id);
    const weekExcuses = await ExcuseRequest.findAll({
      where: {
        session_id: { [Op.in]: weekSessionIds },
        student_id: excuse.student_id
      },
      include: [
        { model: ClassSession, as: 'session' },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    // 모든 공결을 한 번에 업데이트
    const updatedExcuses = [];
    for (const weekExcuse of weekExcuses) {
      const oldValue = { status: weekExcuse.status, instructor_comment: weekExcuse.instructor_comment };

      weekExcuse.status = status;
      weekExcuse.instructor_comment = instructor_comment || null;
      weekExcuse.reviewed_at = new Date();

      await weekExcuse.save();

      // 공결 승인 시 출석 상태 업데이트
      if (status === 'approved') {
        const attendance = await Attendance.findOne({
          where: { session_id: weekExcuse.session_id, student_id: weekExcuse.student_id }
        });

        if (attendance) {
          attendance.status = 4; // 공결
          await attendance.save();
        } else {
          // 출석 기록이 없으면 생성
          await Attendance.create({
            session_id: weekExcuse.session_id,
            student_id: weekExcuse.student_id,
            status: 4, // 공결
            checked_at: null
          });
        }
      }

      updatedExcuses.push(weekExcuse);
    }

    res.json({
      week: excuse.session.week,
      student_id: excuse.student_id,
      excuses: updatedExcuses
    });
  } catch (error) {
    next(error);
  }
};

