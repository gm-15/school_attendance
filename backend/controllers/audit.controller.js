import { AuditLog, User } from '../models/index.js';
import { Op } from 'sequelize';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { target_type, target_id, user_id, start_date, end_date } = req.query;
    const where = {};

    if (target_type) {
      where.target_type = target_type;
    }

    if (target_id) {
      where.target_id = target_id;
    }

    if (user_id) {
      where.user_id = user_id;
    }

    // 1년 이내 데이터만 조회
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    where.createdAt = {
      [Op.gte]: oneYearAgo
    };

    if (start_date || end_date) {
      if (start_date) {
        where.createdAt[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        where.createdAt[Op.lte] = new Date(end_date);
      }
    }

    const logs = await AuditLog.findAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

