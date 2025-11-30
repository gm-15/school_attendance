import { Attendance, ClassSession, Course, User, AttendancePolicy, Enrollment } from '../models/index.js';
import { Op } from 'sequelize';
import * as XLSX from 'xlsx';

export const getAttendanceReport = async (req, res, next) => {
  try {
    const { course_id, week } = req.query;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const where = { course_id };
    if (week) {
      where.week = week;
    }

    const sessions = await ClassSession.findAll({
      where,
      order: [['week', 'ASC'], ['session_number', 'ASC']]
    });

    const sessionIds = sessions.map(s => s.id);
    const attendances = await Attendance.findAll({
      where: { session_id: { [Op.in]: sessionIds } },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id']
      }]
    });

    // 통계 계산
    const totalSessions = sessions.length;
    const studentStats = {};

    attendances.forEach(attendance => {
      const studentId = attendance.student_id;
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          student: attendance.student,
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          excuse: 0,
          attendance_rate: 0
        };
      }

      studentStats[studentId].total++;
      if (attendance.status === 1) studentStats[studentId].present++;
      else if (attendance.status === 2) studentStats[studentId].late++;
      else if (attendance.status === 3) studentStats[studentId].absent++;
      else if (attendance.status === 4) studentStats[studentId].excuse++;
    });

    // 출석률 계산
    Object.values(studentStats).forEach(stat => {
      stat.attendance_rate = totalSessions > 0 
        ? ((stat.present + stat.excuse) / totalSessions * 100).toFixed(2)
        : 0;
    });

    // 지각→결석 전환 건수
    const lateToAbsentCount = attendances.filter(a => a.late_minutes >= 30).length;

    // 공결 승인율
    const totalExcuses = attendances.filter(a => a.status === 4).length;
    const excuseApprovalRate = totalExcuses > 0 ? 100 : 0;

    res.json({
      course_id,
      week,
      total_sessions: totalSessions,
      student_stats: Object.values(studentStats),
      late_to_absent_count: lateToAbsentCount,
      excuse_approval_rate: excuseApprovalRate
    });
  } catch (error) {
    next(error);
  }
};

export const exportAttendanceReport = async (req, res, next) => {
  try {
    const { course_id, week } = req.query;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    // 리포트 데이터 가져오기
    const reportData = await getAttendanceReportData(course_id, week);

    // 엑셀 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(reportData.student_stats.map(stat => ({
      '학번': stat.student.student_id,
      '이름': stat.student.name,
      '총 수업': stat.total,
      '출석': stat.present,
      '지각': stat.late,
      '결석': stat.absent,
      '공결': stat.excuse,
      '출석률(%)': stat.attendance_rate
    })));

    XLSX.utils.book_append_sheet(workbook, worksheet, '출석 현황');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${course_id}_${week || 'all'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

const getAttendanceReportData = async (course_id, week) => {
  const where = { course_id };
  if (week) {
    where.week = week;
  }

  const sessions = await ClassSession.findAll({
    where,
    order: [['week', 'ASC'], ['session_number', 'ASC']]
  });

  const sessionIds = sessions.map(s => s.id);
  const attendances = await Attendance.findAll({
    where: { session_id: { [Op.in]: sessionIds } },
    include: [{
      model: User,
      as: 'student',
      attributes: ['id', 'name', 'student_id']
    }]
  });

  const totalSessions = sessions.length;
  const studentStats = {};

  attendances.forEach(attendance => {
    const studentId = attendance.student_id;
    if (!studentStats[studentId]) {
      studentStats[studentId] = {
        student: attendance.student,
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        excuse: 0,
        attendance_rate: 0
      };
    }

    studentStats[studentId].total++;
    if (attendance.status === 1) studentStats[studentId].present++;
    else if (attendance.status === 2) studentStats[studentId].late++;
    else if (attendance.status === 3) studentStats[studentId].absent++;
    else if (attendance.status === 4) studentStats[studentId].excuse++;
  });

  Object.values(studentStats).forEach(stat => {
    stat.attendance_rate = totalSessions > 0 
      ? ((stat.present + stat.excuse) / totalSessions * 100).toFixed(2)
      : 0;
  });

  return {
    course_id,
    week,
    total_sessions: totalSessions,
    student_stats: Object.values(studentStats)
  };
};

export const getRiskStudents = async (req, res, next) => {
  try {
    const { course_id } = req.query;

    if (!course_id) {
      return res.status(400).json({ error: 'Course ID is required' });
    }

    const course = await Course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const sessions = await ClassSession.findAll({
      where: { course_id }
    });
    const sessionIds = sessions.map(s => s.id);
    const totalSessions = sessions.length;

    const enrollments = await Enrollment.findAll({
      where: { course_id },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'student_id']
      }]
    });

    const riskStudents = [];

    for (const enrollment of enrollments) {
      const attendances = await Attendance.findAll({
        where: {
          session_id: { [Op.in]: sessionIds },
          student_id: enrollment.user_id
        }
      });

      const absentCount = attendances.filter(a => a.status === 3).length;
      const absenceRate = totalSessions > 0 ? (absentCount / totalSessions) : 0;

      // 15% 이상 결석인 경우 위험군
      if (absenceRate >= 0.15) {
        riskStudents.push({
          student: enrollment.user,
          absent_count: absentCount,
          total_sessions: totalSessions,
          absence_rate: (absenceRate * 100).toFixed(2) + '%'
        });
      }
    }

    res.json({
      course_id,
      risk_students: riskStudents,
      count: riskStudents.length
    });
  } catch (error) {
    next(error);
  }
};

