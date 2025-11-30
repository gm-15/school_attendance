import { Department } from '../models/index.js';
import { createAuditLog } from '../middleware/auditLog.js';

export const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      order: [['code', 'ASC']]
    });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

export const getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // 중복 코드 체크
    const existing = await Department.findOne({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Department code already exists' });
    }

    const department = await Department.create({ name, code });
    
    // 감사 로그 기록
    await createAuditLog(
      req,
      'department_create',
      'Department',
      department.id,
      null,
      { name, code }
    );

    res.status(201).json(department);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Department code already exists' });
    }
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const oldValue = { name: department.name, code: department.code };

    if (name) department.name = name;
    if (code) {
      // 코드 변경 시 중복 체크
      const existing = await Department.findOne({ where: { code } });
      if (existing && existing.id !== parseInt(id)) {
        return res.status(400).json({ error: 'Department code already exists' });
      }
      department.code = code;
    }

    await department.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'department_update',
      'Department',
      department.id,
      oldValue,
      { name: department.name, code: department.code }
    );

    res.json(department);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Department code already exists' });
    }
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    
    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const oldValue = { name: department.name, code: department.code };
    await department.destroy();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'department_delete',
      'Department',
      parseInt(id),
      oldValue,
      null
    );

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Cannot delete department with associated records' });
    }
    next(error);
  }
};

