import { Notification } from '../models/index.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { is_read } = req.query;
    const where = { user_id: req.user.id };

    if (is_read !== undefined) {
      where.is_read = is_read === 'true';
    }

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // 본인 알림만 읽음 처리 가능
    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    notification.is_read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

