import { Enrollment, User, Course, Department, Semester } from '../models/index.js';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 학생의 수강 과목 조회
export const getMyEnrollments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const enrollments = await Enrollment.findAll({
      where: { user_id: userId },
      include: [{
        model: Course,
        as: 'course',
        include: [
          {
            model: User,
            as: 'instructor',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Semester,
            as: 'semester',
            attributes: ['id', 'year', 'term']
          }
        ]
      }]
    });
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
};

// 수강생 목록 조회
export const getEnrollmentsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    
    // 과목 확인
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 조회 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view enrollments for your own courses' });
    }

    const enrollments = await Enrollment.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'student_id', 'role']
      }]
    });
    res.json(enrollments);
  } catch (error) {
    next(error);
  }
};

// 수강신청 생성
export const createEnrollment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { user_id, role } = req.body;

    // 과목 확인
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 사용자 ID 결정: 학생은 자신의 ID, 관리자/교원은 body의 user_id 사용
    let targetUserId;
    if (req.user.role === 'Student') {
      // 학생은 자신만 등록 가능
      targetUserId = req.user.id;
    } else if (req.user.role === 'Admin') {
      // 관리자는 user_id 필수
      if (!user_id) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      targetUserId = user_id;
    } else if (req.user.role === 'Instructor') {
      // 교원은 자신의 과목에만 등록 가능하지만, 이제는 학생이 직접 등록하므로 제거
      return res.status(403).json({ error: 'Instructors cannot enroll students. Students must enroll themselves.' });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // 학생인지 확인
    const student = await User.findByPk(targetUserId);
    if (!student || student.role !== 'Student') {
      return res.status(400).json({ error: 'User must be a student' });
    }

    // 중복 확인
    const existing = await Enrollment.findOne({
      where: { course_id: courseId, user_id: targetUserId }
    });

    if (existing) {
      return res.status(409).json({ error: 'Already enrolled' });
    }

    const enrollment = await Enrollment.create({
      course_id: courseId,
      user_id: targetUserId,
      role: role || 'student'
    });

    const enrollmentWithUser = await Enrollment.findByPk(enrollment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'student_id']
      }]
    });

    res.status(201).json(enrollmentWithUser);
  } catch (error) {
    next(error);
  }
};

// 수강 취소
export const deleteEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const enrollment = await Enrollment.findByPk(id, {
      include: [{
        model: Course,
        as: 'course'
      }]
    });
    
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // 학생은 자신의 수강신청만 취소 가능
    if (req.user.role === 'Student' && enrollment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own enrollment' });
    }

    // 관리자는 모든 수강신청 취소 가능
    // 교원은 이제 수강신청 취소 불가 (학생이 직접 해야 함)
    if (req.user.role === 'Instructor') {
      return res.status(403).json({ error: 'Instructors cannot cancel enrollments. Students must cancel themselves.' });
    }

    await enrollment.destroy();
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 엑셀 일괄 등록 (20점 중 5점)
export const importEnrollments = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    for (const row of data) {
      try {
        // 엑셀 컬럼명: course_id, user_id (또는 student_id, email 등)
        const courseId = row.course_id || row.courseId;
        const userId = row.user_id || row.userId;
        const studentId = row.student_id || row.studentId;
        const email = row.email;

        if (!courseId) {
          results.errors.push({ row, error: 'Course ID is required' });
          continue;
        }

        let userIdToUse = userId;

        // student_id나 email로 사용자 찾기
        if (!userIdToUse) {
          if (studentId) {
            const user = await User.findOne({ where: { student_id: studentId } });
            if (user) userIdToUse = user.id;
          } else if (email) {
            const user = await User.findOne({ where: { email } });
            if (user) userIdToUse = user.id;
          }
        }

        if (!userIdToUse) {
          results.errors.push({ row, error: 'User not found' });
          continue;
        }

        // 중복 확인
        const existing = await Enrollment.findOne({
          where: { course_id: courseId, user_id: userIdToUse }
        });

        if (existing) {
          results.errors.push({ row, error: 'Already enrolled' });
          continue;
        }

        await Enrollment.create({
          course_id: courseId,
          user_id: userIdToUse,
          role: row.role || 'student'
        });

        results.success.push({ course_id: courseId, user_id: userIdToUse });
      } catch (error) {
        results.errors.push({ row, error: error.message });
      }
    }

    res.json({
      message: 'Import completed',
      success_count: results.success.length,
      error_count: results.errors.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

// Multer 미들웨어 export
export const uploadMiddleware = upload.single('file');

