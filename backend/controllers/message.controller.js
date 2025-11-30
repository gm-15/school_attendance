import { Message, User, Course } from '../models/index.js';
import { Op } from 'sequelize';

export const getMessages = async (req, res, next) => {
  try {
    const { type } = req.query; // 'sent' or 'received'
    const where = {};

    if (type === 'sent') {
      where.sender_id = req.user.id;
    } else if (type === 'received') {
      where.receiver_id = req.user.id;
    } else {
      // 둘 다
      where[Op.or] = [
        { sender_id: req.user.id },
        { receiver_id: req.user.id }
      ];
    }

    const messages = await Message.findAll({
      where,
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'code'] },
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const getMessageById = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'code'] },
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 수신자인 경우 읽음 처리
    if (message.receiver_id === req.user.id && !message.is_read) {
      message.is_read = true;
      await message.save();
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req, res, next) => {
  try {
    const { course_id, receiver_id, subject, content } = req.body;

    if (!course_id || !receiver_id || !subject || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const message = await Message.create({
      course_id,
      sender_id: req.user.id,
      receiver_id,
      subject,
      content,
      is_read: false
    });

    const messageWithRelations = await Message.findByPk(message.id, {
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'code'] },
        { model: User, as: 'sender', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json(messageWithRelations);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 수신자만 읽음 처리 가능
    if (message.receiver_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    message.is_read = true;
    await message.save();

    res.json(message);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 보낸 사람만 삭제 가능
    if (message.sender_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

