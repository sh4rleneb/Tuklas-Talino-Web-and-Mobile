import { Router } from 'express';
import {
  authenticate,
  requireRole,
  requirePasswordChanged,
} from '../middleware/auth.js';

import {
  Group,
  GroupMember,
  GroupTask,
  GroupTaskCompletion,
  Student,
  Notification,
} from '../models/index.js';

import { awardXp } from '../services/progress.service.js';
import { audit } from '../services/audit.service.js';
import { emitRealtime } from '../realtime.js';

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

function teacherOwnsGroup(req, group) {
  return req.role !== 'teacher' || Number(group?.createdByTeacherId) === Number(req.teacher?.id);
}

function notifyTeacherAndLeaderboard(payload) {
  emitRealtime('teachers', 'student:activity', payload);
  emitRealtime('leaderboard', 'leaderboard:update', {});
  emitRealtime('teachers', 'teacher:monitoring:update', {});
}

router.get('/', async (req, res, next) => {
  try {
    if (req.role === 'student') {
      const memberships = await GroupMember.findAll({
        where: {
          studentId: req.student.id,
        },
        include: [
          {
            model: Group,
            include: [
              {
                model: GroupTask,
                as: 'tasks',
                include: [
                  {
                    model: GroupTaskCompletion,
                    as: 'completions',
                  },
                ],
              },
            ],
          },
        ],
      });

      return res.json({
        groups: memberships.map((m) => m.Group),
      });
    }

    const groupWhere = {};

    if (req.role === 'teacher') {
      groupWhere.createdByTeacherId = req.teacher?.id || 0;
    }

    const groups = await Group.findAll({
      where: groupWhere,
      include: [
        {
          model: GroupMember,
          as: 'members',
          include: [Student],
        },
        {
          model: GroupTask,
          as: 'tasks',
          include: [
            {
              model: GroupTaskCompletion,
              as: 'completions',
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ groups });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.create({
      name: req.body.name,
      description: req.body.description || '',
      createdByTeacherId: req.teacher?.id || null,
    });

    await audit(req.user.id, 'group.create', 'group', group.id);

    emitRealtime('teachers', 'group:created', {
      groupId: group.id,
      name: group.name,
      message: `New group created: ${group.name}`,
    });

    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only manage your own groups.' });
    }

    for (const key of ['name', 'description', 'status']) {
      if (req.body[key] !== undefined) {
        group[key] = req.body[key];
      }
    }

    await group.save();
    await audit(req.user.id, 'group.update', 'group', group.id, req.body);

    emitRealtime('teachers', 'group:updated', {
      groupId: group.id,
      name: group.name,
      message: `Group updated: ${group.name}`,
    });

    res.json({ group });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only manage your own groups.' });
    }

    group.status = 'archived';
    await group.save();

    await audit(req.user.id, 'group.archive', 'group', group.id);

    emitRealtime('teachers', 'group:archived', {
      groupId: group.id,
      name: group.name,
      message: `Group archived: ${group.name}`,
    });

    res.json({ group });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/members', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const [member] = await GroupMember.findOrCreate({
      where: {
        groupId: req.params.id,
        studentId: req.body.studentId,
      },
    });

    await audit(req.user.id, 'group.add_member', 'group', Number(req.params.id), {
      studentId: req.body.studentId,
    });

    emitRealtime('teachers', 'group:member_added', {
      groupId: Number(req.params.id),
      studentId: req.body.studentId,
      message: 'A student was added to a group',
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:id/members/:studentId',
  requireRole('teacher', 'admin'),
  async (req, res, next) => {
    try {
      await GroupMember.destroy({
        where: {
          groupId: req.params.id,
          studentId: req.params.studentId,
        },
      });

      await audit(
        req.user.id,
        'group.remove_member',
        'group',
        Number(req.params.id),
        {
          studentId: req.params.studentId,
        }
      );

      emitRealtime('teachers', 'group:member_removed', {
        groupId: Number(req.params.id),
        studentId: Number(req.params.studentId),
        message: 'A student was removed from a group',
      });

      res.json({ message: 'Member removed.' });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/:id/tasks', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.create({
      groupId: req.params.id,
      title: req.body.title,
      description: req.body.description || '',
      xpReward: req.body.xpReward || 10,
      dueAt: req.body.dueAt || null,
    });

    await audit(req.user.id, 'group_task.create', 'group_task', task.id);

    emitRealtime('teachers', 'group_task:created', {
      groupId: Number(req.params.id),
      taskId: task.id,
      title: task.title,
      message: `New group task created: ${task.title}`,
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

router.delete('/tasks/:taskId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    task.status = 'archived';
    await task.save();

    await audit(req.user.id, 'group_task.archive', 'group_task', task.id);

    emitRealtime('teachers', 'group_task:archived', {
      taskId: task.id,
      title: task.title,
      message: `Group task archived: ${task.title}`,
    });

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:taskId/complete', requireRole('student'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const [completion, created] = await GroupTaskCompletion.findOrCreate({
      where: {
        groupTaskId: task.id,
        studentId: req.student.id,
      },
      defaults: {
        verificationStatus: 'pending',
        submittedAt: new Date(),
        xpAwarded: 0,
      },
    });

    if (!created && completion.verificationStatus === 'returned') {
      await completion.update({
        verificationStatus: 'pending',
        submittedAt: new Date(),
        teacherFeedback: null,
      });
    }

    if (created || completion.verificationStatus === 'pending') {
      notifyTeacherAndLeaderboard({
        type: 'group_task_pending',
        studentId: req.student.id,
        studentName: req.student.name,
        groupTaskId: task.id,
        xp: 0,
        message: `${req.student.name} submitted group task ${task.title} for teacher check`,
      });
    }

    res.json({
      completion,
      xpAwarded: 0,
      pendingTeacherCheck: completion.verificationStatus === 'pending',
      message: completion.verificationStatus === 'approved'
        ? 'This group task was already approved.'
        : 'Group task submitted. Waiting for teacher check.',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/task-completions/pending', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const completions = await GroupTaskCompletion.findAll({
      where: { verificationStatus: 'pending' },
      order: [['submittedAt', 'ASC'], ['createdAt', 'ASC']],
    });

    const rows = [];

    for (const completion of completions) {
      const item = completion.toJSON ? completion.toJSON() : completion;
      const student = await Student.findByPk(item.studentId);
      const task = await GroupTask.findByPk(item.groupTaskId);
      const group = task?.groupId ? await Group.findByPk(task.groupId) : null;

      rows.push({
        id: item.id,
        studentId: item.studentId,
        studentName: student?.name || 'Student',
        studentCode: student?.studentCode || '',
        gradeLevel: student?.gradeLevel || null,
        section: student?.section || '',
        groupTaskId: item.groupTaskId,
        taskTitle: task?.title || 'Group Task',
        taskXp: task?.xpReward || 0,
        groupId: task?.groupId || null,
        groupName: group?.name || 'Group',
        verificationStatus: item.verificationStatus,
        submittedAt: item.submittedAt || item.createdAt,
      });
    }

    res.json({
      rows,
      summary: {
        pending: rows.length,
      },
    });
  } catch (err) {
    next(err);
  }
});


router.post('/tasks/:taskId/completions/:studentId/approve', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const completion = await GroupTaskCompletion.findOne({
      where: {
        groupTaskId: task.id,
        studentId: req.params.studentId,
      },
    });

    if (!completion) {
      return res.status(404).json({ message: 'Group task completion not found.' });
    }

    const alreadyApproved = completion.verificationStatus === 'approved';
    let xpAwarded = 0;

    if (!alreadyApproved && Number(completion.xpAwarded || 0) <= 0) {
      await awardXp(
        completion.studentId,
        task.xpReward,
        'group_task',
        task.id,
        `Teacher approved ${task.title}`
      );

      xpAwarded = task.xpReward;
    }

    await completion.update({
      verificationStatus: 'approved',
      reviewedAt: new Date(),
      reviewedByTeacherId: req.teacher?.id || null,
      teacherFeedback: req.body?.teacherFeedback || null,
      xpAwarded: Number(completion.xpAwarded || 0) || xpAwarded,
      completedAt: completion.completedAt || new Date(),
    });

    await audit(req.user.id, 'group_task.approve_completion', 'group_task', task.id, {
      studentId: completion.studentId,
      groupTaskCompletionId: completion.id,
      xpAwarded,
    });

    if (!alreadyApproved && xpAwarded > 0) {
      const student = await Student.findByPk(completion.studentId);
      const group = task.groupId ? await Group.findByPk(task.groupId) : null;

      if (student?.userId) {
        await Notification.create({
          userId: student.userId,
          role: 'student',
          type: 'group_task_approved',
          title: 'Team Mission Approved',
          message: `Teacher approved ${group?.name || 'your team mission'}! +${xpAwarded} XP`,
          metadata: {
            studentId: completion.studentId,
            groupTaskCompletionId: completion.id,
            groupTaskId: task.id,
            groupId: task.groupId || null,
            groupName: group?.name || null,
            taskTitle: task.title,
            xpAwarded,
          },
        });
      }
    }

    notifyTeacherAndLeaderboard({
      type: 'group_task_approved',
      studentId: completion.studentId,
      groupTaskId: task.id,
      xp: xpAwarded,
      message: `Group task approved: ${task.title}`,
    });

    res.json({
      completion,
      xpAwarded,
      message: alreadyApproved
        ? 'Group task was already approved.'
        : 'Group task approved and XP awarded.',
    });
  } catch (err) {
    next(err);
  }
});


router.get('/:id/progress', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const members = await GroupMember.findAll({
      where: {
        groupId: req.params.id,
      },
      include: [Student],
    });

    const tasks = await GroupTask.findAll({
      where: {
        groupId: req.params.id,
      },
    });

    const rows = [];

    for (const m of members) {
      const completed = await GroupTaskCompletion.count({
        where: {
          studentId: m.studentId,
          groupTaskId: tasks.map((t) => t.id),
        },
      });

      rows.push({
        student: m.Student,
        completed,
        total: tasks.length,
        percent: tasks.length
          ? Math.round((completed / tasks.length) * 100)
          : 0,
      });
    }

    res.json({ rows });
  } catch (err) {
    next(err);
  }
});

export default router;