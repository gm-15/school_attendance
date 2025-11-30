import { Semester } from '../models/index.js';
import { createAuditLog } from '../middleware/auditLog.js';

export const getSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.findAll({
      order: [['year', 'DESC'], ['term', 'ASC']]
    });
    res.json(semesters);
  } catch (error) {
    next(error);
  }
};

export const getSemesterById = async (req, res, next) => {
  try {
    const semester = await Semester.findByPk(req.params.id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }
    res.json(semester);
  } catch (error) {
    next(error);
  }
};

export const createSemester = async (req, res, next) => {
  try {
    const { year, term, start_date, end_date } = req.body;
    
    if (!year || !term || !start_date || !end_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // 날짜 유효성 검증
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (start >= end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }

    // 중복 학기 체크
    const existing = await Semester.findOne({ where: { year, term } });
    if (existing) {
      return res.status(400).json({ error: 'Semester already exists for this year and term' });
    }

    const semester = await Semester.create({ year, term, start_date, end_date });
    
    // 감사 로그 기록
    await createAuditLog(
      req,
      'semester_create',
      'Semester',
      semester.id,
      null,
      { year, term, start_date, end_date }
    );

    res.status(201).json(semester);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Semester already exists for this year and term' });
    }
    next(error);
  }
};

export const updateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { year, term, start_date, end_date } = req.body;

    const semester = await Semester.findByPk(id);
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }

    const oldValue = {
      year: semester.year,
      term: semester.term,
      start_date: semester.start_date,
      end_date: semester.end_date
    };

    if (year) semester.year = year;
    if (term) semester.term = term;
    if (start_date) semester.start_date = start_date;
    if (end_date) semester.end_date = end_date;

    // 날짜 유효성 검증
    if (semester.start_date && semester.end_date) {
      const start = new Date(semester.start_date);
      const end = new Date(semester.end_date);
      if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }
    }

    await semester.save();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'semester_update',
      'Semester',
      semester.id,
      oldValue,
      { year: semester.year, term: semester.term, start_date: semester.start_date, end_date: semester.end_date }
    );

    res.json(semester);
  } catch (error) {
    next(error);
  }
};

export const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByPk(id);
    
    if (!semester) {
      return res.status(404).json({ error: 'Semester not found' });
    }

    const oldValue = {
      year: semester.year,
      term: semester.term,
      start_date: semester.start_date,
      end_date: semester.end_date
    };

    await semester.destroy();

    // 감사 로그 기록
    await createAuditLog(
      req,
      'semester_delete',
      'Semester',
      parseInt(id),
      oldValue,
      null
    );

    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ error: 'Cannot delete semester with associated courses' });
    }
    next(error);
  }
};

