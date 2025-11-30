import { AttendancePolicy, Course, Attendance, ClassSession } from '../models/index.js';
import { Op } from 'sequelize';

export const getPolicy = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    let policy = await AttendancePolicy.findOne({
      where: { course_id: courseId }
    });

    // 정책이 없으면 기본값으로 생성
    if (!policy) {
      policy = await AttendancePolicy.create({
        course_id: courseId,
        late_threshold: 10,
        late_to_absent_threshold: 30,
        absence_warning_threshold: 2,
        absence_danger_threshold: 3,
        absence_fail_threshold: 0.25,
        attendance_weight: 1.0,
        late_weight: 0.5
      });
    }

    res.json(policy);
  } catch (error) {
    next(error);
  }
};

export const updatePolicy = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const {
      late_threshold,
      late_to_absent_threshold,
      max_absences,
      absence_warning_threshold,
      absence_danger_threshold,
      absence_fail_threshold,
      attendance_weight,
      late_weight
    } = req.body;

    let policy = await AttendancePolicy.findOne({
      where: { course_id: courseId }
    });

    if (!policy) {
      policy = await AttendancePolicy.create({
        course_id: courseId,
        late_threshold: late_threshold || 10,
        late_to_absent_threshold: late_to_absent_threshold || 30,
        max_absences: max_absences || null,
        absence_warning_threshold: absence_warning_threshold || 2,
        absence_danger_threshold: absence_danger_threshold || 3,
        absence_fail_threshold: absence_fail_threshold || 0.25,
        attendance_weight: attendance_weight || 1.0,
        late_weight: late_weight || 0.5
      });
    } else {
      if (late_threshold !== undefined) policy.late_threshold = late_threshold;
      if (late_to_absent_threshold !== undefined) policy.late_to_absent_threshold = late_to_absent_threshold;
      if (max_absences !== undefined) policy.max_absences = max_absences;
      if (absence_warning_threshold !== undefined) policy.absence_warning_threshold = absence_warning_threshold;
      if (absence_danger_threshold !== undefined) policy.absence_danger_threshold = absence_danger_threshold;
      if (absence_fail_threshold !== undefined) policy.absence_fail_threshold = absence_fail_threshold;
      if (attendance_weight !== undefined) policy.attendance_weight = attendance_weight;
      if (late_weight !== undefined) policy.late_weight = late_weight;

      await policy.save();
    }

    res.json(policy);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceScore = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const policy = await AttendancePolicy.findOne({
      where: { course_id: courseId }
    });

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    // 모든 세션의 출석 데이터 가져오기
    const sessions = await ClassSession.findAll({
      where: { course_id: courseId }
    });

    const sessionIds = sessions.map(s => s.id);
    const attendances = await Attendance.findAll({
      where: {
        session_id: { [Op.in]: sessionIds }
      }
    });

    // 학생별 점수 계산
    const studentScores = {};
    
    attendances.forEach(attendance => {
      if (!studentScores[attendance.student_id]) {
        studentScores[attendance.student_id] = {
          student_id: attendance.student_id,
          total: 0,
          score: 0,
          present: 0,
          late: 0,
          absent: 0,
          excuse: 0
        };
      }

      studentScores[attendance.student_id].total++;
      
      if (attendance.status === 1) {
        studentScores[attendance.student_id].present++;
        studentScores[attendance.student_id].score += policy.attendance_weight;
      } else if (attendance.status === 2) {
        studentScores[attendance.student_id].late++;
        studentScores[attendance.student_id].score += policy.late_weight;
      } else if (attendance.status === 3) {
        studentScores[attendance.student_id].absent++;
      } else if (attendance.status === 4) {
        studentScores[attendance.student_id].excuse++;
      }
    });

    res.json(Object.values(studentScores));
  } catch (error) {
    next(error);
  }
};

