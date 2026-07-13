import { Router } from 'express';
import rateLimit from 'express-rate-limit';
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


// ADMIN_ASSIGNMENT_SECURITY_HARDENING
const ADMIN_ASSIGNMENT_RATE_LIMIT_WINDOW_MS =
  Math.max(
    60 * 1000,
    Number(
      process.env.ADMIN_ASSIGNMENT_RATE_LIMIT_WINDOW_MS ||
      15 * 60 * 1000
    )
  );

const ADMIN_ASSIGNMENT_RATE_LIMIT_MAX =
  Math.max(
    1,
    Number(
      process.env.ADMIN_ASSIGNMENT_RATE_LIMIT_MAX ||
      20
    )
  );

const assignmentMutationLimiter = rateLimit({
  windowMs: ADMIN_ASSIGNMENT_RATE_LIMIT_WINDOW_MS,
  limit: ADMIN_ASSIGNMENT_RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) =>
    ['GET', 'HEAD', 'OPTIONS'].includes(req.method),
  message: {
    error: 'Too Many Assignment Changes',
    message:
      'Too many teacher-assignment changes were requested. Please wait before trying again.',
  },
});

const SECTION_MAX_LENGTH = 40;

// STRICT_ADMIN_SECTION_VALIDATION
const SECTION_NAME_PATTERN =
  /^[A-Za-z]{2,}(?: [A-Za-z]{2,})*$/;
function normalizeSectionName(value = '') {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSuspiciousRepeatedSectionPattern(value = '') {
  const compact = String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]/gu, '');

  const maximumChunkLength = Math.min(
    16,
    Math.floor(compact.length / 3)
  );

  for (
    let chunkLength = 4;
    chunkLength <= maximumChunkLength;
    chunkLength += 1
  ) {
    for (
      let start = 0;
      start + chunkLength * 3 <= compact.length;
      start += 1
    ) {
      const chunk = compact.slice(
        start,
        start + chunkLength
      );

      if (
        compact.slice(
          start,
          start + chunkLength * 3
        ) === chunk.repeat(3)
      ) {
        return true;
      }
    }
  }

  return false;
}

function getSectionValidationError(section = '') {
  if (!section) {
    return 'Section is required.';
  }

  if (section.length > SECTION_MAX_LENGTH) {
    return (
      `Section must not exceed ` +
      `${SECTION_MAX_LENGTH} characters.`
    );
  }

  if (!SECTION_NAME_PATTERN.test(section)) {
    return (
      'Section must use A-Z letters and spaces only. ' +
      'Each word must contain at least 2 letters.'
    );
  }

  if (hasSuspiciousRepeatedSectionPattern(section)) {
    return (
      'Section contains an invalid repeated pattern.'
    );
  }

  return null;
}

function adminRequestAuditMetadata(req, metadata = {}) {
  return {
    ...metadata,
    sourceIp: String(req.ip || '').slice(0, 80),
    userAgent: String(
      req.get('user-agent') || ''
    ).slice(0, 300),
    requestId: String(
      req.get('x-request-id') || ''
    ).slice(0, 120),
  };
}

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

  const loginSecurity =
    loginSecurityForUser(plain);

  const {
    passwordHash,
    failedLoginAttempts,
    totalFailedLoginAttempts,
    failedLoginWindowStartedAt,
    lockedUntil,
    ...safeUser
  } = plain;

  return {
    ...safeUser,
    loginSecurity,
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

    res.json({ user: adminUserPayload(user) });
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
    const section = normalizeSectionName(
      req.body.section
    );

    const sectionValidationError =
      getSectionValidationError(section);

    if (sectionValidationError) {
      return res.status(422).json({
        message: sectionValidationError
      });
    }

    assertSafeText(section, 'section');

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      return res.status(422).json({
        message: 'Grade level must be from Grade 1 to Grade 6 only.'
      });
    }

    if (gradeLevel != Number(student.gradeLevel)) {

      const promotionReason = String(
        req.body.promotionReason || ''
      )
        .normalize('NFKC')
        .replace(/\s+/g, ' ')
        .trim();

      if (!promotionReason) {
        return res.status(422).json({
          message: 'Promotion reason is required.'
        });
      }

      if (promotionReason.length > 500) {
        return res.status(422).json({
          message: 'Promotion reason must not exceed 500 characters.'
        });
      }

      assertSafeText(
        promotionReason,
        'promotion reason'
      );

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
          reason: promotionReason
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

router.post('/teachers/:teacherUuid/assignments', assignmentMutationLimiter, async (req, res, next) => {
  try {
    const teacherUuid = String(
      req.params.teacherUuid || ''
    ).trim().toLowerCase();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teacherUuid)
    ) {
      return res.status(400).json({
        message: 'A valid teacher UUID is required.'
      });
    }

    const teacher = await Teacher.findOne({
      where: {
        uuid: teacherUuid
      }
    });

    if (!teacher) {
      return res.status(404).json({
        message: 'Teacher not found.'
      });
    }

    const gradeLevel = Number(req.body.gradeLevel);
    const section = normalizeSectionName(
      req.body.section
    );

    const sectionValidationError =
      getSectionValidationError(section);

    if (sectionValidationError) {
      return res.status(422).json({
        message: sectionValidationError
      });
    }

    assertSafeText(section, 'section');

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      return res.status(422).json({
        message: 'Grade level must be from Grade 1 to Grade 6 only.'
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

    const reactivated =
      !created && assignment.status !== 'active';

    if (reactivated) {
      await assignment.update({
        status: 'active'
      });
    }

    await audit(
      req.user.id,
      created
        ? 'teacher_assignment.create'
        : reactivated
          ? 'teacher_assignment.reactivate'
          : 'teacher_assignment.confirm',
      'teacher_assignment',
      assignment.id,
      adminRequestAuditMetadata(req, {
        teacherId: teacher.id,
        gradeLevel,
        section,
        created,
        reactivated
      })
    );

    res.status(created ? 201 : 200).json({
      message: 'Teacher assignment saved successfully.',
      assignment
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/teacher-assignments/:id', assignmentMutationLimiter, async (req, res, next) => {
  try {
    const assignment = await TeacherAssignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({
        message: 'Teacher assignment not found.'
      });
    }

    const deletedAssignment = {
      teacherId: assignment.teacherId,
      gradeLevel: assignment.gradeLevel,
      section: assignment.section,
      previousStatus: assignment.status
    };

    await assignment.destroy();

    await audit(
      req.user.id,
      'teacher_assignment.delete',
      'teacher_assignment',
      assignment.id,
      adminRequestAuditMetadata(
        req,
        deletedAssignment
      )
    );

    res.json({
      message: 'Teacher assignment removed successfully.'
    });
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(
      String(req.query.limit || '100'),
      10
    );

    const limit = Number.isInteger(requestedLimit)
      ? Math.min(500, Math.max(1, requestedLimit))
      : 100;

    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit
    });

    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

export default router;
