import { User, Department } from '../models/index.js';
import { hashPassword, validatePassword } from '../utils/password.js';
import XLSX from 'xlsx';
import multer from 'multer';

// Multer 설정 (메모리 저장)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 사용자 목록 조회
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// 사용자 상세 조회
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code']
      }],
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// 사용자 생성
export const createUser = async (req, res, next) => {
  try {
    const { role, name, email, password, student_id, department_id } = req.body;

    // 필수 필드 검증
    if (!role || !name || !email || !password) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 비밀번호 해싱
    const password_hash = await hashPassword(password);

    // 사용자 생성
    const user = await User.create({
      role,
      name,
      email,
      password_hash,
      student_id: student_id || null,
      department_id: department_id || null
    });

    // 비밀번호 제외하고 반환
    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.status(201).json(userData);
  } catch (error) {
    next(error);
  }
};

// 사용자 수정
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, student_id, department_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 비밀번호 변경이 있는 경우
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.message });
      }
      user.password_hash = await hashPassword(password);
    }

    // 다른 필드 업데이트
    if (name) user.name = name;
    if (email) {
      // 이메일 중복 확인 (자기 자신 제외)
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser && existingUser.id !== parseInt(id)) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      user.email = email;
    }
    if (student_id !== undefined) user.student_id = student_id;
    if (department_id !== undefined) user.department_id = department_id;

    await user.save();

    // 비밀번호 제외하고 반환
    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

// 엑셀 일괄 등록
export const importUsers = async (req, res, next) => {
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
        // 엑셀 컬럼명: role, name, email, password, student_id, department_id (또는 department_code)
        const role = row.role || 'Student';
        const name = row.name;
        const email = row.email;
        const password = row.password;
        const studentId = row.student_id || row.studentId || null;
        const departmentId = row.department_id;
        const departmentCode = row.department_code;

        // 필수 필드 검증
        if (!name || !email || !password) {
          results.errors.push({ row, error: 'Required fields are missing (name, email, password)' });
          continue;
        }

        // 역할 검증
        if (!['Admin', 'Instructor', 'Student'].includes(role)) {
          results.errors.push({ row, error: 'Invalid role. Must be Admin, Instructor, or Student' });
          continue;
        }

        // 학생인 경우 학번 필수
        if (role === 'Student' && !studentId) {
          results.errors.push({ row, error: 'Student ID is required for Student role' });
          continue;
        }

        // 비밀번호 검증
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          results.errors.push({ row, error: passwordValidation.message });
          continue;
        }

        // 이메일 중복 확인
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          results.errors.push({ row, error: 'Email already exists' });
          continue;
        }

        // 학생인 경우 학번 중복 확인
        if (role === 'Student' && studentId) {
          const existingStudent = await User.findOne({ where: { student_id: studentId } });
          if (existingStudent) {
            results.errors.push({ row, error: 'Student ID already exists' });
            continue;
          }
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

        // 비밀번호 해싱
        const password_hash = await hashPassword(password);

        // 사용자 생성
        const user = await User.create({
          role,
          name,
          email,
          password_hash,
          student_id: studentId,
          department_id: departmentIdToUse || null
        });

        results.success.push({ user_id: user.id, name, email, student_id: studentId });
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

// 사용자 삭제
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// 사용자 권한 변경
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['Admin', 'Instructor', 'Student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;

    res.json(userData);
  } catch (error) {
    next(error);
  }
};

