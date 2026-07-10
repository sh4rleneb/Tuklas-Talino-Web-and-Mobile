import { Router } from 'express';
import { assertSafeText } from '../validators/contentSafety.js';
import {
  authenticate,
  requireRole,
  requirePasswordChanged
} from '../middleware/auth.js';

import {
  User,
  Role,
  Student,
  Teacher,
  TeacherAssignment,
  Lesson,
  CompletedLesson,
  AuditLog
} from '../models/index.js';
import { audit } from '../services/audit.service.js';

const router = Router();

function loginSecurityForUser(user = {}, now = new Date()) {
  const lockedUntilValue = user?.lockedUntil || null;
  const lockedUntil = lockedUntilValue
    ? new Date(lockedUntilValue)
    : null;

  const validLockedUntil =
    lockedUntil && Number.isFinite(lockedUntil.getTime());

  const permanent =
    validLockedUntil && lockedUntil.getFullYear() >= 9999;

  const temporary =
    validLockedUntil && !permanent && lockedUntil > now;

  const remainingLockMinutes = temporary
    ? Math.max(
        1,
        Math.ceil(
          (lockedUntil.getTime() - now.getTime()) /
          (60 * 1000)
        )
      )
    : 0;

  return {
    status: permanent
      ? 'permanent'
      : temporary
        ? 'temporary'
        : 'unlocked',
    failedLoginAttempts:
      Number(user?.failedLoginAttempts || 0),
    totalFailedLoginAttempts:
      Number(user?.totalFailedLoginAttempts || 0),
    failedLoginWindowStartedAt:
      user?.failedLoginWindowStartedAt || null,
    lockedUntil: validLockedUntil
      ? lockedUntil.toISOString()
      : null,
    remainingLockMinutes,
  };
}

function adminUserPayload(user = {}) {
  const plain =
    typeof user?.toJSON === 'function'
      ? user.toJSON()
      : { ...user };

  return {
    ...plain,
    loginSecurity: loginSecurityForUser(plain),
  };
}

router.use(authenticate, requireRole('admin'));
router.use(requirePasswordChanged);

router.get('/stats', async (req, res, next) => {
  try {
    const [
      users,
      students,
      teachers,
      lessons,
      completions
    ] = await Promise.all([
      User.count(),
      Student.count(),
      Teacher.count(),
      Lesson.count(),
      CompletedLesson.count()
    ]);

    res.json({
      stats: {
        users,
        students,
        teachers,
        lessons,
        completions
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/accounts', async (req, res, next) => {
  try {
    const users = await User.findAll({
      include: [Role],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: users.map(adminUserPayload)
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/accounts/:id/unlock', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    const previousSecurityState = loginSecurityForUser(user);

    user.failedLoginAttempts = 0;
    user.totalFailedLoginAttempts = 0;
    user.failedLoginWindowStartedAt = null;
    user.lockedUntil = null;

    await user.save();

    await audit(
      req.user.id,
      'account.login_lock.removed',
      'user',
      user.id,
      {
        reason: String(req.body.reason || '').trim() || null,
        previousSecurityState
      }
    );

    res.json({
      message: 'Account lockdown removed.',
      user: adminUserPayload(user)
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/accounts/:id/status', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'Account not found.'
      });
    }

    if (Number(user.id) === Number(req.user.id) && req.body.status === 'archived') {
      return res.status(422).json({
        message: 'You cannot archive your own signed-in admin account.'
      });
    }

    user.status =
      req.body.status === 'archived'
        ? 'archived'
        : 'active';

    await user.save();

    const [student, teacher] = await Promise.all([
      Student.findOne({ where: { userId: user.id } }),
      Teacher.findOne({ where: { userId: user.id } })
    ]);

    if (student) await student.update({ status: user.status });
    if (teacher) await teacher.update({ status: user.status });

    await audit(req.user.id, 'account.status', 'user', user.id, {
      status: user.status
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/*
  ADMIN ENROLLMENT ASSIGNMENT
  Purpose:
  - View students and teachers
  - Update student grade level and section
*/

router.get('/enrollments', async (req, res, next) => {
  try {
    const students = await Student.findAll({
      include: [User],
      order: [
        ['gradeLevel', 'ASC'],
        ['section', 'ASC'],
        ['name', 'ASC']
      ]
    });

    const teachers = await Teacher.findAll({
      include: [User],
      where: {
        status: 'active'
      },
      order: [['name', 'ASC']]
    });

    const teacherAssignments = await TeacherAssignment.findAll({
      include: [Teacher],
      order: [
        ['gradeLevel', 'ASC'],
        ['section', 'ASC']
      ]
    });

    const classMap = new Map();

    for (const student of students) {
      const key = `${student.gradeLevel}||${student.section}`;
      if (!classMap.has(key)) {
        classMap.set(key, {
          gradeLevel: student.gradeLevel,
          section: student.section
        });
      }
    }

    res.json({
      students: students.map((student) => {
        const plain = student.toJSON();
        return {
          ...plain,
          User: plain.User
            ? adminUserPayload(plain.User)
            : plain.User
        };
      }),
      teachers: teachers.map((teacher) => {
        const plain = teacher.toJSON();
        return {
          ...plain,
          User: plain.User
            ? adminUserPayload(plain.User)
            : plain.User
        };
      }),
      teacherAssignments,
      classOptions: Array.from(classMap.values())
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/students/:id/enrollment', async (req, res, next) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [User]
    });

    if (!student) {
      return res.status(404).json({
        message: 'Student not found.'
      });
    }

    const gradeLevel = Number(req.body.gradeLevel);
    const section = String(req.body.section || '').trim();
    assertSafeText(section, 'section');

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      return res.status(422).json({
        message: 'Grade level must be from Grade 1 to Grade 6 only.'
      });
    }

    if (!section) {
      return res.status(422).json({
        message: 'Section is required.'
      });
    }

    if (gradeLevel != Number(student.gradeLevel)) {

      const promotionReason = String(
        req.body.promotionReason || ''
      ).trim();

      if (!promotionReason) {
        return res.status(422).json({
          message: 'Promotion reason is required.'
        });
      }

      const currentGrade = Number(student.gradeLevel);

      if (gradeLevel !== currentGrade + 1) {
        return res.status(422).json({
          message: 'Students may only advance one grade level at a time.'
        });
      }

      const completed = await CompletedLesson.count({
        where: { studentId: student.id }
      });

      const total = await Lesson.count({
        where: {
          gradeLevel: currentGrade,
          status: 'published'
        }
      });

      if (total > 0 && completed < total) {
        return res.status(422).json({
          message: 'Student must complete all lessons before promotion.'
        });
      }
    }

    const previousGrade = Number(student.gradeLevel);

    student.gradeLevel = gradeLevel;
    student.section = section;

    await student.save();

    if (previousGrade !== gradeLevel) {

      await audit(
        req.user.id,
        'student.promote',
        'student',
        student.id,
        {
          studentName: student.name,
          studentCode: student.studentCode,
          oldGrade: previousGrade,
          newGrade: gradeLevel,
          section,
          reason: req.body.promotionReason
        }
      );

    }

    res.json({
      message: 'Student enrollment updated successfully.',
      student
    });
  } catch (err) {
    next(err);
  }
});

router.post('/teachers/:id/assignments', async (req, res, next) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found.'
      });
    }

    const gradeLevel = Number(req.body.gradeLevel);
    const section = String(req.body.section || '').trim();
    assertSafeText(section, 'section');

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      return res.status(422).json({
        message: 'Grade level must be from Grade 1 to Grade 6 only.'
      });
    }

    if (!section) {
      return res.status(422).json({
        message: 'Section is required.'
      });
    }

    const [assignment, created] = await TeacherAssignment.findOrCreate({
      where: {
        teacherId: teacher.id,
        gradeLevel,
        section
      },
      defaults: {
        status: 'active'
      }
    });

    if (!created && assignment.status !== 'active') {
      await assignment.update({ status: 'active' });
    }

    res.status(created ? 201 : 200).json({
      message: 'Teacher assignment saved successfully.',
      assignment
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/teacher-assignments/:id', async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: 'Teacher assignment not found.'
      });
    }

    await assignment.destroy();

    res.json({
      message: 'Teacher assignment removed successfully.'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: Number(req.query.limit || 100)
    });

    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
