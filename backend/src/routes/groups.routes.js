import { Router } from 'express';
import { authenticate, requireRole, requirePasswordChanged } from '../middleware/auth.js';
import { Group, GroupMember, GroupTask, GroupTaskCompletion, Student } from '../models/index.js';
import { awardXp } from '../services/progress.service.js';
import { audit } from '../services/audit.service.js';

const router = Router();
router.use(authenticate);
router.use(requirePasswordChanged);

router.get('/', async (req, res, next) => {
  try {
    if (req.role === 'student') {
      const memberships = await GroupMember.findAll({
        where: { studentId: req.student.id },
        include: [{ model: Group, include: [{ model: GroupTask, as: 'tasks', include: [{ model: GroupTaskCompletion, as: 'completions' }] }] }]
      });
      return res.json({ groups: memberships.map(m => m.Group) });
    }
    const groups = await Group.findAll({
      include: [{ model: GroupMember, as: 'members', include: [Student] }, { model: GroupTask, as: 'tasks' }],
      order: [['createdAt','DESC']]
    });
    return res.json({ groups });
  } catch (err) { next(err); }
});

router.post('/', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.create({
      name: req.body.name,
      description: req.body.description || '',
      createdByTeacherId: req.teacher?.id || null
    });
    await audit(req.user.id, 'group.create', 'group', group.id);
    res.status(201).json({ group });
  } catch (err) { next(err); }
});

router.patch('/:id', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    for (const key of ['name','description','status']) if (req.body[key] !== undefined) group[key] = req.body[key];
    await group.save();
    await audit(req.user.id, 'group.update', 'group', group.id, req.body);
    res.json({ group });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    group.status = 'archived';
    await group.save();
    await audit(req.user.id, 'group.archive', 'group', group.id);
    res.json({ group });
  } catch (err) { next(err); }
});

router.post('/:id/members', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const member = await GroupMember.findOrCreate({ where: { groupId: req.params.id, studentId: req.body.studentId } });
    await audit(req.user.id, 'group.add_member', 'group', Number(req.params.id), { studentId: req.body.studentId });
    res.status(201).json({ member: member[0] });
  } catch (err) { next(err); }
});

router.delete('/:id/members/:studentId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    await GroupMember.destroy({ where: { groupId: req.params.id, studentId: req.params.studentId } });
    await audit(req.user.id, 'group.remove_member', 'group', Number(req.params.id), { studentId: req.params.studentId });
    res.json({ message: 'Member removed.' });
  } catch (err) { next(err); }
});

router.post('/:id/tasks', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.create({
      groupId: req.params.id,
      title: req.body.title,
      description: req.body.description || '',
      xpReward: req.body.xpReward || 10,
      dueAt: req.body.dueAt || null
    });
    await audit(req.user.id, 'group_task.create', 'group_task', task.id);
    res.status(201).json({ task });
  } catch (err) { next(err); }
});

router.delete('/tasks/:taskId', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    task.status = 'archived';
    await task.save();
    await audit(req.user.id, 'group_task.archive', 'group_task', task.id);
    res.json({ task });
  } catch (err) { next(err); }
});

router.post('/tasks/:taskId/complete', requireRole('student'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    const [completion, created] = await GroupTaskCompletion.findOrCreate({
      where: { groupTaskId: task.id, studentId: req.student.id }
    });
    if (created) await awardXp(req.student.id, task.xpReward, 'group_task', task.id, `Completed ${task.title}`);
    res.json({ completion, xpAwarded: created ? task.xpReward : 0 });
  } catch (err) { next(err); }
});

router.get('/:id/progress', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const members = await GroupMember.findAll({ where: { groupId: req.params.id }, include: [Student] });
    const tasks = await GroupTask.findAll({ where: { groupId: req.params.id } });
    const rows = [];
    for (const m of members) {
      const completed = await GroupTaskCompletion.count({ where: { studentId: m.studentId, groupTaskId: tasks.map(t => t.id) } });
      rows.push({ student: m.Student, completed, total: tasks.length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 });
    }
    res.json({ rows });
  } catch (err) { next(err); }
});

export default router;
