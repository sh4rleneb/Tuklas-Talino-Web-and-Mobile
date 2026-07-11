import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
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

import { awardXp, awardThresholdBadges } from '../services/progress.service.js';
import { audit } from '../services/audit.service.js';
import { emitRealtime } from '../realtime.js';

import { assertSafeContentPayload, assertSafeText } from '../validators/contentSafety.js';
const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const groupTaskUploadDir = path.join(__dirname, '../../uploads/group-tasks');

fs.mkdirSync(groupTaskUploadDir, { recursive: true });

const groupTaskUploadAllowedMimesByExtension = new Map([
  ['.pdf', new Set(['application/pdf'])],
  ['.png', new Set(['image/png'])],
  ['.jpg', new Set(['image/jpeg'])],
  ['.jpeg', new Set(['image/jpeg'])],
  ['.txt', new Set(['text/plain'])],
  ['.doc', new Set(['application/msword'])],
  [
    '.docx',
    new Set([
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ])
  ]
]);

function rejectGroupTaskUpload(cb) {
  const error = new Error(
    'Only PDF, PNG, JPEG, TXT, DOC, or DOCX group outputs are allowed.'
  );

  error.statusCode = 415;
  cb(error);
}

const groupTaskUpload = multer({
  storage: multer.diskStorage({
    destination: groupTaskUploadDir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();

      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mimeType = String(file.mimetype || '').toLowerCase();
    const allowedMimes = groupTaskUploadAllowedMimesByExtension.get(ext);

    if (!allowedMimes || !allowedMimes.has(mimeType)) {
      rejectGroupTaskUpload(cb);
      return;
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 10,
    parts: 11,
    fieldNameSize: 100,
    fieldSize: 256 * 1024,
  },
});

router.use(authenticate);
router.use(requirePasswordChanged);

function teacherOwnsGroup(req, group) {
  return req.role !== 'teacher' || Number(group?.createdByTeacherId) === Number(req.teacher?.id);
}

function validGradeLevel(value) {
  const gradeLevel = Number(value);
  return [1, 2, 3, 4, 5, 6].includes(gradeLevel)
    ? gradeLevel
    : null;
}

function normalizedGroupSection(value = '') {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function existingGroupGradeLevel(groupId) {
  const membership = await GroupMember.findOne({
    where: { groupId },
    include: [Student],
    order: [['id', 'ASC']],
  });

  return validGradeLevel(
    membership?.Student?.gradeLevel
  );
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
    assertSafeText(req.body.name || '', 'group name');
    assertSafeText(req.body.description || '', 'group description');

    const gradeLevel = validGradeLevel(req.body.gradeLevel);
    const section = normalizedGroupSection(
      req.body.section || req.body.description
    );

    if (!gradeLevel) {
      return res.status(422).json({
        message: 'Group grade level must be from Grade 1 to Grade 6.'
      });
    }

    if (!section) {
      return res.status(422).json({
        message: 'Group section is required.'
      });
    }

    assertSafeText(section, 'group section');

    const group = await Group.create({
      name: req.body.name,
      description: req.body.description || section,
      gradeLevel,
      section,
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
    assertSafeContentPayload(req.body, 'group update');
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

    if (req.body.gradeLevel !== undefined) {
      const gradeLevel = validGradeLevel(req.body.gradeLevel);

      if (!gradeLevel) {
        return res.status(422).json({
          message: 'Group grade level must be from Grade 1 to Grade 6.'
        });
      }

      const members = await GroupMember.findAll({
        where: { groupId: group.id },
        include: [Student],
      });

      const mismatchedMember = members.find(
        (member) =>
          Number(member?.Student?.gradeLevel) !== gradeLevel
      );

      if (mismatchedMember) {
        return res.status(422).json({
          message:
            'The group grade cannot be changed while it contains students from another grade.'
        });
      }

      group.gradeLevel = gradeLevel;
    }

    if (req.body.section !== undefined) {
      const section = normalizedGroupSection(req.body.section);

      if (!section) {
        return res.status(422).json({
          message: 'Group section is required.'
        });
      }

      assertSafeText(section, 'group section');
      group.section = section;
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

router.post('/:id/members/bulk', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({
        message: 'Group not found.'
      });
    }

    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({
        message: 'You can only manage your own groups.'
      });
    }

    const rawStudentIds = Array.isArray(req.body.studentIds)
      ? req.body.studentIds
      : [];

    const studentIds = [
      ...new Set(
        rawStudentIds
          .map((value) => Number(value))
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value > 0
          )
      )
    ];

    if (!studentIds.length) {
      return res.status(422).json({
        message: 'Select at least one valid student.'
      });
    }

    if (studentIds.length > 200) {
      return res.status(422).json({
        message: 'A maximum of 200 students can be added at one time.'
      });
    }

    const transactionResult =
      await GroupMember.sequelize.transaction(
        async (transaction) => {
          const lockedGroup = await Group.findByPk(
            group.id,
            {
              transaction,
              lock: transaction.LOCK.UPDATE
            }
          );

          if (!lockedGroup) {
            const error = new Error('Group not found.');
            error.statusCode = 404;
            throw error;
          }

          const students = await Student.findAll({
            where: {
              id: studentIds
            },
            transaction,
            lock: transaction.LOCK.UPDATE
          });

          const studentsById = new Map(
            students.map((student) => [
              Number(student.id),
              student
            ])
          );

          const missingStudentIds = studentIds.filter(
            (studentId) =>
              !studentsById.has(studentId)
          );

          if (missingStudentIds.length) {
            const error = new Error(
              `Student record not found for ID${
                missingStudentIds.length === 1 ? '' : 's'
              }: ${missingStudentIds.join(', ')}.`
            );
            error.statusCode = 404;
            throw error;
          }

          const inactiveStudents = students.filter(
            (student) =>
              student.status &&
              student.status !== 'active'
          );

          if (inactiveStudents.length) {
            const error = new Error(
              'Only active students can be added to a group.'
            );
            error.statusCode = 422;
            throw error;
          }

          const invalidGradeStudents = students.filter(
            (student) =>
              !validGradeLevel(student.gradeLevel)
          );

          if (invalidGradeStudents.length) {
            const error = new Error(
              'Every selected student must have a valid grade level.'
            );
            error.statusCode = 422;
            throw error;
          }

          const existingMembers =
            await GroupMember.findAll({
              where: {
                groupId: lockedGroup.id
              },
              transaction,
              lock: transaction.LOCK.UPDATE
            });

          let groupGrade =
            validGradeLevel(lockedGroup.gradeLevel) ||
            await existingGroupGradeLevel(
              lockedGroup.id
            );

          if (!groupGrade) {
            groupGrade = validGradeLevel(
              students[0].gradeLevel
            );
          }

          const mismatchedStudents =
            students.filter(
              (student) =>
                validGradeLevel(student.gradeLevel) !==
                groupGrade
            );

          if (mismatchedStudents.length) {
            const names = mismatchedStudents
              .map(
                (student) =>
                  student.name ||
                  `Student ${student.id}`
              )
              .join(', ');

            const error = new Error(
              `Only Grade ${groupGrade} students can be added to this group. Mismatched: ${names}.`
            );
            error.statusCode = 422;
            throw error;
          }

          if (!validGradeLevel(lockedGroup.gradeLevel)) {
            lockedGroup.gradeLevel = groupGrade;

            if (
              !normalizedGroupSection(
                lockedGroup.section
              )
            ) {
              lockedGroup.section =
                normalizedGroupSection(
                  students[0]?.section
                ) ||
                normalizedGroupSection(
                  lockedGroup.description
                ) ||
                null;
            }

            await lockedGroup.save({
              transaction
            });
          }

          const selectedExistingMemberships =
            await GroupMember.findAll({
              where: {
                groupId: lockedGroup.id,
                studentId: studentIds
              },
              transaction,
              lock: transaction.LOCK.UPDATE
            });

          const existingStudentIds = new Set(
            selectedExistingMemberships.map(
              (member) =>
                Number(member.studentId)
            )
          );

          const studentIdsToAdd =
            studentIds.filter(
              (studentId) =>
                !existingStudentIds.has(studentId)
            );

          const addedMembers = [];
          const groupWasEmpty =
            existingMembers.length === 0;

          for (
            let index = 0;
            index < studentIdsToAdd.length;
            index += 1
          ) {
            const studentId =
              studentIdsToAdd[index];

            const member =
              await GroupMember.create(
                {
                  groupId: lockedGroup.id,
                  studentId,
                  groupRole:
                    groupWasEmpty && index === 0
                      ? 'leader'
                      : 'member'
                },
                { transaction }
              );

            addedMembers.push(member);
          }

          return {
            groupGrade,
            addedMembers,
            addedStudentIds:
              studentIdsToAdd,
            existingStudentIds: [
              ...existingStudentIds
            ]
          };
        }
      );

    await audit(
      req.user.id,
      'group.add_members_bulk',
      'group',
      Number(group.id),
      {
        requestedStudentIds: studentIds,
        addedStudentIds:
          transactionResult.addedStudentIds,
        existingStudentIds:
          transactionResult.existingStudentIds,
        groupGrade:
          transactionResult.groupGrade
      }
    );

    emitRealtime(
      'teachers',
      'group:members_added',
      {
        groupId: Number(group.id),
        studentIds:
          transactionResult.addedStudentIds,
        addedCount:
          transactionResult.addedStudentIds.length,
        gradeLevel:
          transactionResult.groupGrade,
        message:
          `${transactionResult.addedStudentIds.length} student(s) were added to the group`
      }
    );

    return res.status(201).json({
      members:
        transactionResult.addedMembers,
      addedStudentIds:
        transactionResult.addedStudentIds,
      existingStudentIds:
        transactionResult.existingStudentIds,
      addedCount:
        transactionResult.addedStudentIds.length,
      existingCount:
        transactionResult.existingStudentIds.length,
      requestedCount:
        studentIds.length,
      groupGrade:
        transactionResult.groupGrade,
      message:
        transactionResult.addedStudentIds.length
          ? `${transactionResult.addedStudentIds.length} learner(s) added.`
          : 'All selected learners are already members.'
    });
  } catch (err) {
    if (
      err?.name === 'SequelizeUniqueConstraintError'
    ) {
      return res.status(409).json({
        message:
          'One or more selected students are already members of this group.'
      });
    }

    if (
      err?.statusCode &&
      !err.status
    ) {
      err.status = err.statusCode;
    }

    next(err);
  }
});


async function existingGroupSection(groupId) {
  const membership = await GroupMember.findOne({
    where: { groupId },
    include: [Student],
    order: [['createdAt', 'ASC']],
  });

  return normalizedGroupSection(
    membership?.Student?.section ||
    membership?.student?.section ||
    ''
  );
}

function sameSection(first = '', second = '') {
  return normalizedGroupSection(first).toLowerCase() === normalizedGroupSection(second).toLowerCase();
}

function groupGradeSectionMessage(gradeLevel, section) {
  const sectionText = normalizedGroupSection(section);
  return `Only Grade ${gradeLevel}${sectionText ? ` - Section ${sectionText}` : ''} students can be added to this group.`;
}

router.post('/:id/members', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only manage your own groups.' });
    }

    const studentId = Number(req.body.studentId);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(422).json({
        message: 'A valid student is required.'
      });
    }

    const student = await Student.findByPk(studentId);

    if (!student) {
      return res.status(404).json({
        message: 'Student not found.'
      });
    }

    if (
      student.status &&
      student.status !== 'active'
    ) {
      return res.status(422).json({
        message: 'Only active students can be added to a group.'
      });
    }

    const studentGrade = validGradeLevel(student.gradeLevel);

    if (!studentGrade) {
      return res.status(422).json({
        message: 'The student does not have a valid grade level.'
      });
    }

    const studentSection = normalizedGroupSection(student.section);

    if (!studentSection) {
      return res.status(422).json({
        message: 'The student does not have a valid section.'
      });
    }

    let groupGrade =
      validGradeLevel(group.gradeLevel) ||
      await existingGroupGradeLevel(group.id);

    let groupSection =
      normalizedGroupSection(group.section) ||
      await existingGroupSection(group.id) ||
      normalizedGroupSection(group.description);

    if (!groupGrade) {
      groupGrade = studentGrade;
      group.gradeLevel = studentGrade;
    }

    if (!groupSection) {
      groupSection = studentSection;
    }

    if (!normalizedGroupSection(group.section)) {
      group.section = groupSection || null;
    }

    if (!validGradeLevel(group.gradeLevel)) {
      group.gradeLevel = groupGrade;
    }

    if (group.changed()) {
      await group.save();
    }

    if (studentGrade !== groupGrade) {
      return res.status(422).json({
        message: groupGradeSectionMessage(groupGrade, groupSection)
      });
    }

    if (!sameSection(studentSection, groupSection)) {
      return res.status(422).json({
        message: groupGradeSectionMessage(groupGrade, groupSection)
      });
    }

    const existingMemberCount = await GroupMember.count({
      where: { groupId: req.params.id },
    });

    const [member, created] = await GroupMember.findOrCreate({
      where: {
        groupId: req.params.id,
        studentId,
      },
      defaults: {
        groupRole:
          existingMemberCount === 0
            ? 'leader'
            : 'member',
      },
    });

    if (!created && !member.groupRole) {
      member.groupRole = 'member';
      await member.save();
    }

    await audit(req.user.id, 'group.add_member', 'group', Number(req.params.id), {
      studentId,
      studentGrade,
      studentSection,
      groupGrade,
      groupSection,
      groupRole: member.groupRole,
    });

    emitRealtime('teachers', 'group:member_added', {
      groupId: Number(req.params.id),
      studentId,
      gradeLevel: studentGrade,
      section: studentSection,
      message: 'A student was added to a group',
    });

    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
});


router.post('/:id/members/:studentId/leader', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const group = await Group.findByPk(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found.' });
    }

    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only manage your own groups.' });
    }

    const targetMember = await GroupMember.findOne({
      where: {
        groupId: req.params.id,
        studentId: req.params.studentId,
      },
    });

    if (!targetMember) {
      return res.status(404).json({ message: 'Group member not found.' });
    }

    await GroupMember.update(
      { groupRole: 'member' },
      { where: { groupId: req.params.id } }
    );

    await targetMember.update({ groupRole: 'leader' });

    await audit(req.user.id, 'group.set_leader', 'group', Number(req.params.id), {
      studentId: Number(req.params.studentId),
    });

    emitRealtime('teachers', 'group:leader_updated', {
      groupId: Number(req.params.id),
      studentId: Number(req.params.studentId),
      message: 'Group leader updated',
    });

    const groupTasks = await GroupTask.findAll({
      where: { groupId: group.id },
      attributes: ['id'],
    });

    const groupTaskIds = groupTasks.map(task => task.id);

    if (groupTaskIds.length) {
      await GroupTaskCompletion.update(
        {
          submittedByStudentId: Number(req.params.studentId),
          studentRole: 'Leader',
        },
        {
          where: {
            groupTaskId: groupTaskIds,
            verificationStatus: 'pending',
          },
        }
      );
    }

    res.json({ member: targetMember });
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

const GROUP_TASK_MINIMUM_DEADLINE_MS =
  60 * 60 * 1000;

const GROUP_TASK_ISO_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function makeGroupTaskDeadlineError(
  message,
  status = 400
) {
  const err = new Error(message);
  err.status = status;
  err.code = 'GROUP_TASK_DEADLINE_INVALID';
  return err;
}

function normalizeGroupTaskDueAt(body = {}) {
  const rawValue = String(
    body.dueAt ??
    body.deadline ??
    body.dueDate ??
    body.scheduledAt ??
    ''
  ).trim();

  if (!rawValue) {
    throw makeGroupTaskDeadlineError(
      'Deadline date and time are required.'
    );
  }

  if (
    !GROUP_TASK_ISO_TIMEZONE_PATTERN.test(
      rawValue
    )
  ) {
    throw makeGroupTaskDeadlineError(
      'Deadline must include a valid date, ' +
      'time, and timezone.'
    );
  }

  const deadlineMs = Date.parse(rawValue);

  if (!Number.isFinite(deadlineMs)) {
    throw makeGroupTaskDeadlineError(
      'Deadline date and time are invalid.'
    );
  }

  if (
    deadlineMs <
    Date.now() +
      GROUP_TASK_MINIMUM_DEADLINE_MS
  ) {
    throw makeGroupTaskDeadlineError(
      'Deadline must be at least one hour ' +
      'from the current time.',
      422
    );
  }

  return new Date(deadlineMs).toISOString();
}

router.post('/:id/tasks', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    assertSafeText(req.body.title || '', 'group task title');
    assertSafeText(req.body.description || '', 'group task description');
    const dueAt = normalizeGroupTaskDueAt(req.body);

    const task = await GroupTask.create({
      groupId: req.params.id,
      title: req.body.title,
      description: req.body.description || '',
      xpReward: req.body.xpReward || 10,
      dueAt,
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

router.post('/tasks/:taskId/complete', requireRole('student'), groupTaskUpload.single('submissionFile'), async (req, res, next) => {
  try {
    assertSafeContentPayload(req.body, 'group task submission');
    const task = await GroupTask.findByPk(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const leaderMembership = await GroupMember.findOne({
      where: {
        groupId: task.groupId,
        studentId: req.student.id,
        groupRole: 'leader',
      },
    });

    if (!leaderMembership) {
      return res.status(403).json({
        message: 'Only the assigned group leader can submit this group task.',
      });
    }

    const members = await GroupMember.findAll({
      where: { groupId: task.groupId },
    });

    if (!members.length) {
      return res.status(422).json({ message: 'This group has no members.' });
    }

    const filePayload = {
      studentRole: String(req.body?.studentRole || 'Leader').trim() || 'Leader',
      submittedByStudentId: req.student.id,
      fileName: req.file?.originalname || null,
      filePath: req.file ? `/uploads/group-tasks/${req.file.filename}` : null,
      fileMimeType: req.file?.mimetype || null,
      fileSize: req.file?.size || null,
    };

    const completions = [];

    for (const member of members) {
      const [completion, created] = await GroupTaskCompletion.findOrCreate({
        where: {
          groupTaskId: task.id,
          studentId: member.studentId,
        },
        defaults: {
          verificationStatus: 'pending',
          submittedAt: new Date(),
          xpAwarded: 0,
          ...filePayload,
        },
      });

      if (!created) {
        if (completion.verificationStatus === 'pending') {
          return res.status(409).json({
            message: 'This group task has already been submitted and is waiting for teacher review.'
          });
        }

        if (completion.verificationStatus !== 'approved') {
          await completion.update({
            verificationStatus: 'pending',
            submittedAt: new Date(),
            teacherFeedback: null,
            studentRole: filePayload.studentRole,
            submittedByStudentId: filePayload.submittedByStudentId,
            fileName: filePayload.fileName || completion.fileName || null,
            filePath: filePayload.filePath || completion.filePath || null,
            fileMimeType: filePayload.fileMimeType || completion.fileMimeType || null,
            fileSize: filePayload.fileSize || completion.fileSize || null,
          });
        }
      }

      completions.push(completion);
    }

    notifyTeacherAndLeaderboard({
      type: 'group_task_pending',
      studentId: req.student.id,
      studentName: req.student.name,
      groupTaskId: task.id,
      xp: 0,
      message: `${req.student.name} submitted group task ${task.title} for group teacher check`,
    });

    res.json({
      completion: completions.find(item => Number(item.studentId) === Number(req.student.id)) || completions[0],
      groupSubmission: true,
      submittedByStudentId: req.student.id,
      affectedMembers: members.length,
      xpAwarded: 0,
      pendingTeacherCheck: true,
      message: 'Group task submitted. Waiting for teacher check.',
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
    const seenTaskIds = new Set();

    for (const completion of completions) {
      const item = completion.toJSON ? completion.toJSON() : completion;

      if (seenTaskIds.has(Number(item.groupTaskId))) {
        continue;
      }

      seenTaskIds.add(Number(item.groupTaskId));

      const task = await GroupTask.findByPk(item.groupTaskId);
      const group = task?.groupId ? await Group.findByPk(task.groupId) : null;
      const submitterId = item.submittedByStudentId || item.studentId;
      const student = await Student.findByPk(submitterId);

      rows.push({
        id: item.id,
        studentId: submitterId,
        submittedByStudentId: submitterId,
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
        studentRole: item.studentRole || 'Leader',
        fileName: item.fileName || '',
        fileUrl: item.filePath ? `${req.protocol}://${req.get('host')}${item.filePath}` : '',
        fileMimeType: item.fileMimeType || '',
        fileSize: item.fileSize || null,
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

    const group = await Group.findByPk(task.groupId);
    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only review your own groups.' });
    }

    const submitterId = Number(req.params.studentId);

    const submitterCompletion = await GroupTaskCompletion.findOne({
      where: {
        groupTaskId: task.id,
        submittedByStudentId: submitterId,
      },
    }) || await GroupTaskCompletion.findOne({
      where: {
        groupTaskId: task.id,
        studentId: submitterId,
      },
    });

    if (!submitterCompletion) {
      return res.status(404).json({ message: 'Group task completion not found.' });
    }

    const members = await GroupMember.findAll({
      where: { groupId: task.groupId },
      include: [Student],
    });

    if (!members.length) {
      return res.status(422).json({ message: 'This group has no members to approve.' });
    }

    let totalXpAwarded = 0;
    let approvedCount = 0;
    let newBadges = [];
    const newBadgesByStudent = {};

    for (const member of members) {
      const [completion] = await GroupTaskCompletion.findOrCreate({
        where: {
          groupTaskId: task.id,
          studentId: member.studentId,
        },
        defaults: {
          verificationStatus: 'pending',
          submittedAt: submitterCompletion.submittedAt || new Date(),
          submittedByStudentId: submitterCompletion.submittedByStudentId || submitterId,
          studentRole: submitterCompletion.studentRole || 'Leader',
          fileName: submitterCompletion.fileName || null,
          filePath: submitterCompletion.filePath || null,
          fileMimeType: submitterCompletion.fileMimeType || null,
          fileSize: submitterCompletion.fileSize || null,
          xpAwarded: 0,
        },
      });

      const alreadyApproved = completion.verificationStatus === 'approved';
      let memberXpAwarded = 0;
      let xpResult = null;
      let memberNewBadges = [];

      if (!alreadyApproved && Number(completion.xpAwarded || 0) <= 0) {
        xpResult = await awardXp(
          member.studentId,
          task.xpReward,
          'group_task',
          task.id,
          `Teacher approved group task: ${task.title}`
        );

        memberXpAwarded = task.xpReward;
        totalXpAwarded += memberXpAwarded;
      }

      await completion.update({
        verificationStatus: 'approved',
        reviewedAt: new Date(),
        reviewedByTeacherId: req.teacher?.id || null,
        teacherFeedback: req.body?.teacherFeedback || null,
        submittedByStudentId: submitterCompletion.submittedByStudentId || submitterId,
        studentRole: submitterCompletion.studentRole || completion.studentRole || 'Leader',
        fileName: submitterCompletion.fileName || completion.fileName || null,
        filePath: submitterCompletion.filePath || completion.filePath || null,
        fileMimeType: submitterCompletion.fileMimeType || completion.fileMimeType || null,
        fileSize: submitterCompletion.fileSize || completion.fileSize || null,
        xpAwarded: Number(completion.xpAwarded || 0) || memberXpAwarded,
        completedAt: completion.completedAt || new Date(),
      });

      approvedCount += 1;

      const student = member.Student || await Student.findByPk(member.studentId);

      if (!alreadyApproved && memberXpAwarded > 0 && student) {
        const xpBadges = xpResult?.getDataValue?.('newBadges') || xpResult?.newBadges || [];
        const metricBadges = await awardThresholdBadges(student);
        const seenBadges = new Set();
        const combinedBadges = [...xpBadges, ...metricBadges];

        memberNewBadges = combinedBadges.filter(badge => {
          const key = String(badge?.code || badge?.name || badge?.id || '').toLowerCase();
          if (!key || seenBadges.has(key)) return false;
          seenBadges.add(key);
          return true;
        });

        if (memberNewBadges.length) {
          newBadgesByStudent[member.studentId] = memberNewBadges;
          if (Number(member.studentId) === Number(req.params.studentId)) {
            newBadges = memberNewBadges;
          }
        }
      }

      if (!alreadyApproved && memberXpAwarded > 0 && student?.userId) {
        const group = task.groupId ? await Group.findByPk(task.groupId) : null;

        await Notification.create({
          userId: student.userId,
          role: 'student',
          type: 'group_task_approved',
          title: 'Team Mission Approved',
          message: `Teacher approved ${group?.name || 'your team mission'}! +${memberXpAwarded} XP`,
          metadata: {
            studentId: member.studentId,
            groupTaskCompletionId: completion.id,
            groupTaskId: task.id,
            groupId: task.groupId || null,
            groupName: group?.name || null,
            taskTitle: task.title,
            xpAwarded: memberXpAwarded,
            newBadges: memberNewBadges,
          },
        });
      }
    }

    await audit(req.user.id, 'group_task.approve_group_completion', 'group_task', task.id, {
      submittedByStudentId: submitterCompletion.submittedByStudentId || submitterId,
      approvedCount,
      totalXpAwarded,
    });

    notifyTeacherAndLeaderboard({
      type: 'group_task_approved',
      studentId: submitterCompletion.submittedByStudentId || submitterId,
      groupTaskId: task.id,
      xp: totalXpAwarded,
      message: `Group task approved for ${approvedCount} member(s): ${task.title}`,
    });

    res.json({
      completion: submitterCompletion,
      groupApproval: true,
      approvedCount,
      xpAwarded: totalXpAwarded,
      newBadges,
      newBadgesByStudent,
      message: totalXpAwarded
        ? `Group task approved for ${approvedCount} member(s).`
        : 'Group task was already approved.',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/tasks/:taskId/completions/:studentId/return', requireRole('teacher', 'admin'), async (req, res, next) => {
  try {
    const task = await GroupTask.findByPk(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const group = await Group.findByPk(task.groupId);
    if (!teacherOwnsGroup(req, group)) {
      return res.status(403).json({ message: 'You can only review your own groups.' });
    }

    const submitterId = Number(req.params.studentId);
    const completion = await GroupTaskCompletion.findOne({
      where: {
        groupTaskId: task.id,
        submittedByStudentId: submitterId
      }
    }) || await GroupTaskCompletion.findOne({
      where: {
        groupTaskId: task.id,
        studentId: submitterId
      }
    });

    if (!completion) {
      return res.status(404).json({ message: 'Group task completion not found.' });
    }

    const teacherFeedback = String(req.body?.teacherFeedback || '').trim();
    assertSafeText(teacherFeedback, 'teacher feedback');

    await GroupTaskCompletion.update(
      {
        verificationStatus: 'returned',
        reviewedAt: new Date(),
        reviewedByTeacherId: req.teacher?.id || null,
        teacherFeedback: teacherFeedback || null
      },
      {
        where: {
          groupTaskId: task.id,
          submittedByStudentId: completion.submittedByStudentId || submitterId,
          verificationStatus: 'pending'
        }
      }
    );

    await audit(req.user.id, 'group_task.return_group_completion', 'group_task', task.id, {
      submittedByStudentId: completion.submittedByStudentId || submitterId,
      teacherFeedback
    });

    res.json({
      message: 'Group task returned for revision.',
      verificationStatus: 'returned'
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
