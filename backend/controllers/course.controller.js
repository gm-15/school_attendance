import { Course, User, Department, Semester } from '../models/index.js';
import { createAuditLog } from '../middleware/auditLog.js';
import { Op } from 'sequelize';
import XLSX from 'xlsx';
import multer from 'multer';

// Multer 설정 (메모리 저장)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const getCourses = async (req, res, next) => {
  try {
    const { semester_id, department_id, instructor_id } = req.query;
    const where = {};

    // 필터링 옵션
    if (semester_id) where.semester_id = semester_id;
    if (department_id) where.department_id = department_id;
    if (instructor_id) where.instructor_id = instructor_id;

    // 교원은 자신의 과목만 볼 수 있음
    if (req.user.role === 'Instructor' && !instructor_id) {
      where.instructor_id = req.user.id;
    }

    const courses = await Course.findAll({
      where,
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
      ],
      order: [['code', 'ASC'], ['section', 'ASC']]
    });
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
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
          attributes: ['id', 'year', 'term', 'start_date', 'end_date']
        }
      ]
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, code, section, instructor_id, semester_id, department_id, room, duration_hours, duration_minutes } = req.body;
    
    if (!title || !code || !section || !instructor_id || !semester_id || !department_id) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (section < 1 || section > 4) {
      return res.status(400).json({ error: 'Section must be between 1 and 4' });
    }

    // 수업 시간 검증
    const hours = duration_hours || 3;
    const minutes = duration_minutes || 0;
    if (hours < 1 || hours > 6) {
      return res.status(400).json({ error: 'Duration hours must be between 1 and 6' });
    }
    if (minutes !== 0 && minutes !== 30) {
      return res.status(400).json({ error: 'Duration minutes must be 0 or 30' });
    }

    // 교원이 Instructor인지 확인
    const instructor = await User.findByPk(instructor_id);
    if (!instructor || instructor.role !== 'Instructor') {
      return res.status(400).json({ error: 'Instructor must be a user with Instructor role' });
    }

    // 학기 존재 확인
    const semester = await Semester.findByPk(semester_id);
    if (!semester) {
      return res.status(400).json({ error: 'Semester not found' });
    }

    // 학과 존재 확인
    const department = await Department.findByPk(department_id);
    if (!department) {
      return res.status(400).json({ error: 'Department not found' });
    }

    // 동일한 과목 코드와 분반이 이미 존재하는지 확인
    const existing = await Course.findOne({
      where: {
        code,
        section,
        semester_id
      }
    });
    if (existing) {
      return res.status(400).json({ error: 'Course with same code and section already exists in this semester' });
    }

    const course = await Course.create({
      title,
      code,
      section,
      instructor_id,
      semester_id,
      department_id,
      room: room || null,
      duration_hours: hours,
      duration_minutes: minutes
    });

    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'year', 'term'] }
      ]
    });

    // 감사 로그 기록
    await createAuditLog(
      req,
      'course_create',
      'Course',
      course.id,
      null,
      { title, code, section, instructor_id, semester_id, department_id, room, duration_hours: hours, duration_minutes: minutes }
    );

    res.status(201).json(courseWithRelations);
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid foreign key reference' });
    }
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, code, section, instructor_id, semester_id, department_id, room, duration_hours, duration_minutes } = req.body;

    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 수정 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own courses' });
    }

    const oldValue = {
      title: course.title,
      code: course.code,
      section: course.section,
      instructor_id: course.instructor_id,
      semester_id: course.semester_id,
      department_id: course.department_id,
      room: course.room
    };

    if (title) course.title = title;
    if (code) course.code = code;
    if (section !== undefined) {
      if (section < 1 || section > 4) {
        return res.status(400).json({ error: 'Section must be between 1 and 4' });
      }
      course.section = section;
    }
    if (instructor_id) {
      const instructor = await User.findByPk(instructor_id);
      if (!instructor || instructor.role !== 'Instructor') {
        return res.status(400).json({ error: 'Instructor must be a user with Instructor role' });
      }
      course.instructor_id = instructor_id;
    }
    if (semester_id) {
      const semester = await Semester.findByPk(semester_id);
      if (!semester) {
        return res.status(400).json({ error: 'Semester not found' });
      }
      course.semester_id = semester_id;
    }
    if (department_id) {
      const department = await Department.findByPk(department_id);
      if (!department) {
        return res.status(400).json({ error: 'Department not found' });
      }
      course.department_id = department_id;
    }
    if (room !== undefined) course.room = room;
    if (duration_hours !== undefined) {
      if (duration_hours < 1 || duration_hours > 6) {
        return res.status(400).json({ error: 'Duration hours must be between 1 and 6' });
      }
      course.duration_hours = duration_hours;
    }
    if (duration_minutes !== undefined) {
      if (duration_minutes !== 0 && duration_minutes !== 30) {
        return res.status(400).json({ error: 'Duration minutes must be 0 or 30' });
      }
      course.duration_minutes = duration_minutes;
    }

    // 중복 체크 (코드와 분반이 같은 경우)
    if (code || section !== undefined || semester_id) {
      const existing = await Course.findOne({
        where: {
          code: code || course.code,
          section: section !== undefined ? section : course.section,
          semester_id: semester_id || course.semester_id,
          id: { [Op.ne]: id }
        }
      });
      if (existing) {
        return res.status(400).json({ error: 'Course with same code and section already exists in this semester' });
      }
    }

    await course.save();

    const courseWithRelations = await Course.findByPk(course.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Semester, as: 'semester', attributes: ['id', 'year', 'term'] }
      ]
    });

    // 감사 로그 기록
    await createAuditLog(
      req,
      'course_update',
      'Course',
      course.id,
      oldValue,
      {
        title: course.title,
        code: course.code,
        section: course.section,
        instructor_id: course.instructor_id,
        semester_id: course.semester_id,
        department_id: course.department_id,
        room: course.room,
        duration_hours: course.duration_hours,
        duration_minutes: course.duration_minutes
      }
    );

    res.json(courseWithRelations);
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Invalid foreign key reference' });
    }
    next(error);
  }
};

// 엑셀 일괄 등록
export const importCourses = async (req, res, next) => {
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
        // 엑셀 컬럼명: title, code, section, instructor_id (또는 instructor_email), semester_id, department_id (또는 department_code), room, duration_hours, duration_minutes
        const title = row.title;
        const code = row.code || row.course_code;
        const section = row.section;
        const instructorId = row.instructor_id;
        const instructorEmail = row.instructor_email;
        const semesterId = row.semester_id;
        const departmentId = row.department_id;
        const departmentCode = row.department_code;
        const room = row.room || null;
        const durationHours = row.duration_hours || row.durationHours || 3;
        const durationMinutes = row.duration_minutes || row.durationMinutes || 0;

        // 필수 필드 검증
        if (!title || !code || !section || !semesterId) {
          results.errors.push({ row, error: 'Required fields are missing (title, code, section, semester_id)' });
          continue;
        }

        // 분반 검증
        if (section < 1 || section > 4) {
          results.errors.push({ row, error: 'Section must be between 1 and 4' });
          continue;
        }

        // 수업 시간 검증
        if (durationHours < 1 || durationHours > 6) {
          results.errors.push({ row, error: 'Duration hours must be between 1 and 6' });
          continue;
        }
        if (durationMinutes !== 0 && durationMinutes !== 30) {
          results.errors.push({ row, error: 'Duration minutes must be 0 or 30' });
          continue;
        }

        // 교원 찾기
        let instructorIdToUse = instructorId;
        if (!instructorIdToUse && instructorEmail) {
          const instructor = await User.findOne({ where: { email: instructorEmail, role: 'Instructor' } });
          if (!instructor) {
            results.errors.push({ row, error: `Instructor not found: ${instructorEmail}` });
            continue;
          }
          instructorIdToUse = instructor.id;
        }
        if (!instructorIdToUse) {
          results.errors.push({ row, error: 'Instructor ID or email is required' });
          continue;
        }

        // 교원 역할 확인
        const instructor = await User.findByPk(instructorIdToUse);
        if (!instructor || instructor.role !== 'Instructor') {
          results.errors.push({ row, error: 'Instructor must be a user with Instructor role' });
          continue;
        }

        // 학과 찾기
        let departmentIdToUse = departmentId;
        if (!departmentIdToUse && departmentCode) {
          const department = await Department.findOne({ where: { code: departmentCode } });
          if (!department) {
            results.errors.push({ row, error: `Department not found: ${departmentCode}` });
            continue;
          }
          departmentIdToUse = department.id;
        }
        if (!departmentIdToUse) {
          results.errors.push({ row, error: 'Department ID or code is required' });
          continue;
        }

        // 학기 존재 확인
        const semester = await Semester.findByPk(semesterId);
        if (!semester) {
          results.errors.push({ row, error: `Semester not found: ${semesterId}` });
          continue;
        }

        // 학과 존재 확인
        const department = await Department.findByPk(departmentIdToUse);
        if (!department) {
          results.errors.push({ row, error: `Department not found: ${departmentIdToUse}` });
          continue;
        }

        // 동일한 과목 코드와 분반이 이미 존재하는지 확인
        const existing = await Course.findOne({
          where: {
            code,
            section,
            semester_id: semesterId
          }
        });
        if (existing) {
          results.errors.push({ row, error: 'Course with same code and section already exists in this semester' });
          continue;
        }

        const course = await Course.create({
          title,
          code,
          section,
          instructor_id: instructorIdToUse,
          semester_id: semesterId,
          department_id: departmentIdToUse,
          room,
          duration_hours: durationHours,
          duration_minutes: durationMinutes
        });

        // 감사 로그 기록
        await createAuditLog(
          req,
          'course_create',
          'Course',
          course.id,
          null,
          { title, code, section, instructor_id: instructorIdToUse, semester_id: semesterId, department_id: departmentIdToUse, room, duration_hours: durationHours, duration_minutes: durationMinutes }
        );

        results.success.push({ course_id: course.id, title, code, section });
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

export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 교원은 자신의 과목만 삭제 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own courses' });
    }

    const oldValue = {
      title: course.title,
      code: course.code,
      section: course.section,
      instructor_id: course.instructor_id,
      semester_id: course.semester_id,
      department_id: course.department_id,
      room: course.room
    };

    await course.destroy();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'course_delete',
      'Course',
      parseInt(id),
      oldValue,
      null
    );

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Cannot delete course with associated records' });
    }
    next(error);
  }
};

