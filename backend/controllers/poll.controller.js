import { Poll, PollVote, User, Course, ClassSession } from '../models/index.js';
import { Op } from 'sequelize';

export const getPollsByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const polls = await Poll.findAll({
      where: { course_id: courseId },
      include: [{
        model: User,
        as: 'instructor',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json(polls);
  } catch (error) {
    next(error);
  }
};

export const getPollById = async (req, res, next) => {
  try {
    const poll = await Poll.findByPk(req.params.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number'] }
      ]
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json(poll);
  } catch (error) {
    next(error);
  }
};

export const createPoll = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, session_id, deadline, show_results_realtime, allow_revote } = req.body;

    if (!title || !deadline) {
      return res.status(400).json({ error: 'Title and deadline are required' });
    }

    const poll = await Poll.create({
      course_id: courseId,
      instructor_id: req.user.id,
      title,
      description: description || null,
      session_id: session_id || null,
      deadline,
      status: 'open',
      show_results_realtime: show_results_realtime !== undefined ? show_results_realtime : true,
      allow_revote: allow_revote || false
    });

    const pollWithRelations = await Poll.findByPk(poll.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] },
        { model: ClassSession, as: 'session', attributes: ['id', 'week', 'session_number'] }
      ]
    });

    res.status(201).json(pollWithRelations);
  } catch (error) {
    next(error);
  }
};

export const votePoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote } = req.body;
    const studentId = req.user.id;

    if (!vote || !['agree', 'disagree'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote' });
    }

    const poll = await Poll.findByPk(id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (poll.status !== 'open') {
      return res.status(400).json({ error: 'Poll is closed' });
    }

    if (new Date() > new Date(poll.deadline)) {
      return res.status(400).json({ error: 'Poll deadline has passed' });
    }

    // 기존 투표 확인
    const existingVote = await PollVote.findOne({
      where: { poll_id: id, student_id: studentId }
    });

    if (existingVote) {
      if (!poll.allow_revote) {
        return res.status(400).json({ error: 'Already voted' });
      }
      // 재투표 허용인 경우 업데이트
      existingVote.vote = vote;
      await existingVote.save();
      return res.json(existingVote);
    }

    const pollVote = await PollVote.create({
      poll_id: id,
      student_id: studentId,
      vote
    });

    res.status(201).json(pollVote);
  } catch (error) {
    next(error);
  }
};

export const getPollResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findByPk(id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // 결과 공개 여부 확인
    if (!poll.show_results_realtime && poll.status === 'open') {
      return res.status(403).json({ error: 'Results are not available yet' });
    }

    const votes = await PollVote.findAll({
      where: { poll_id: id },
      include: [{
        model: User,
        as: 'student',
        attributes: ['id', 'name', 'student_id']
      }]
    });

    const agreeCount = votes.filter(v => v.vote === 'agree').length;
    const disagreeCount = votes.filter(v => v.vote === 'disagree').length;

    // 현재 사용자의 투표 확인 (학생인 경우만)
    const myVote = req.user.role === 'Student' 
      ? votes.find(v => v.student_id === req.user.id || v.student?.id === req.user.id)
      : null;

    res.json({
      poll: {
        id: poll.id,
        title: poll.title,
        status: poll.status,
        deadline: poll.deadline
      },
      total: votes.length,
      agree: agreeCount,
      disagree: disagreeCount,
      myVote: myVote ? { vote: myVote.vote } : null,
      votes
    });
  } catch (error) {
    next(error);
  }
};

export const closePoll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findByPk(id);
    
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    poll.status = 'closed';
    await poll.save();

    res.json(poll);
  } catch (error) {
    next(error);
  }
};

