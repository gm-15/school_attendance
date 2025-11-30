import { Announcement, Course, User, Enrollment } from '../models/index.js';

export const getAnnouncementsByCourse = async (req, res, next) => {
  try {
    const courseId = parseInt(req.params.courseId);
    
    if (isNaN(courseId)) {
      return res.status(400).json({ error: 'Invalid course ID' });
    }
    
    // 과목 존재 확인
    const course = await Course.findByPk(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // 학생인 경우 수강 신청 확인
    if (req.user.role === 'Student') {
      const enrollment = await Enrollment.findOne({
        where: { 
          course_id: courseId, 
          user_id: req.user.id 
        }
      });
      if (!enrollment) {
        return res.status(403).json({ error: 'You are not enrolled in this course' });
      }
    }

    // 교원인 경우 자신의 과목만 조회 가능
    if (req.user.role === 'Instructor' && course.instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only view announcements for your own courses' });
    }

    const announcements = await Announcement.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['is_pinned', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(announcements);
  } catch (error) {
    console.error('Error in getAnnouncementsByCourse:', error);
    next(error);
  }
};

export const getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, content, is_pinned } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const announcement = await Announcement.create({
      course_id: courseId,
      instructor_id: req.user.id,
      title,
      content,
      is_pinned: is_pinned || false
    });

    const announcementWithInstructor = await Announcement.findByPk(announcement.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json(announcementWithInstructor);
  } catch (error) {
    next(error);
  }
};

export const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // 작성자 또는 관리자만 수정 가능
    if (announcement.instructor_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, content, is_pinned } = req.body;

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (is_pinned !== undefined) announcement.is_pinned = is_pinned;

    await announcement.save();

    const announcementWithInstructor = await Announcement.findByPk(announcement.id, {
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json(announcementWithInstructor);
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByPk(id);
    
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // 작성자 또는 관리자만 삭제 가능
    if (announcement.instructor_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await announcement.destroy();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

