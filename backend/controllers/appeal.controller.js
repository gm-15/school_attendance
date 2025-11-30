import { Appeal, Attendance, User, ClassSession, Course } from '../models/index.js';

// 이의제기 신청
export const createAppeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const studentId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 출석 기록 확인
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance not found' });
    }

    // 본인 출석인지 확인
    if (attendance.student_id !== studentId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 이미 신청했는지 확인
    const existing = await Appeal.findOne({
      where: { attendance_id: id, student_id: studentId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Appeal already exists' });
    }

    const appeal = await Appeal.create({
      attendance_id: id,
      student_id: studentId,
      message,
      status: 'pending'
    });

    const appealWithRelations = await Appeal.findByPk(appeal.id, {
      include: [
        {
          model: Attendance,
          as: 'attendance',
          include: [{
            model: ClassSession,
            as: 'session',
            attributes: ['id', 'week', 'session_number', 'start_at']
          }]
        },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.status(201).json(appealWithRelations);
  } catch (error) {
    next(error);
  }
};

// 이의제기 목록 조회
export const getAppeals = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    // 학생인 경우 본인 것만, 교원은 자신의 과목만, 관리자는 모두
    if (req.user.role === 'Student') {
      where.student_id = req.user.id;
    }

    // 교원인 경우 자신의 과목만
    if (req.user.role === 'Instructor') {
      const appeals = await Appeal.findAll({
        where,
        include: [
          {
            model: Attendance,
            as: 'attendance',
            include: [{
              model: ClassSession,
              as: 'session',
              include: [{
                model: Course,
                as: 'course',
                where: { instructor_id: req.user.id }
              }],
              attributes: ['id', 'week', 'session_number', 'start_at', 'course_id']
            }]
          },
          { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
        ],
        order: [['submitted_at', 'DESC']]
      });
      return res.json(appeals);
    }

    const appeals = await Appeal.findAll({
      where,
      include: [
        {
          model: Attendance,
          as: 'attendance',
          include: [{
            model: ClassSession,
            as: 'session',
            attributes: ['id', 'week', 'session_number', 'start_at', 'course_id']
          }]
        },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ],
      order: [['submitted_at', 'DESC']]
    });

    res.json(appeals);
  } catch (error) {
    next(error);
  }
};

// 이의제기 상세
export const getAppealById = async (req, res, next) => {
  try {
    const appeal = await Appeal.findByPk(req.params.id, {
      include: [
        {
          model: Attendance,
          as: 'attendance',
          include: [{ model: ClassSession, as: 'session' }]
        },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    res.json(appeal);
  } catch (error) {
    next(error);
  }
};

// 이의제기 처리
export const updateAppeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, instructor_comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appeal = await Appeal.findByPk(id, {
      include: [{
        model: Attendance,
        as: 'attendance',
        include: [{
          model: ClassSession,
          as: 'session',
          include: [{ model: Course, as: 'course' }]
        }]
      }]
    });
    
    if (!appeal) {
      return res.status(404).json({ error: 'Appeal not found' });
    }

    // 교원은 자신의 과목만 처리 가능
    if (req.user.role === 'Instructor' && appeal.attendance?.session?.course?.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only process appeals for your own courses' });
    }

    appeal.status = status;
    appeal.instructor_comment = instructor_comment || null;
    appeal.reviewed_at = new Date();

    await appeal.save();

    // 승인 시 출석 정정은 별도 API로 처리 (감사 로그를 위해)

    const appealWithRelations = await Appeal.findByPk(appeal.id, {
      include: [
        {
          model: Attendance,
          as: 'attendance',
          include: [{ model: ClassSession, as: 'session' }]
        },
        { model: User, as: 'student', attributes: ['id', 'name', 'student_id', 'email'] }
      ]
    });

    res.json(appealWithRelations);
  } catch (error) {
    next(error);
  }
};

