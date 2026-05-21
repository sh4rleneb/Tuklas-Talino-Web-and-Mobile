import { Router } from 'express';
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

const router = Router();

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

    res.json({ users });
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

    user.status =
      req.body.status === 'archived'
        ? 'archived'
        : 'active';

    await user.save();

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
      students,
      teachers,
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

    student.gradeLevel = gradeLevel;
    student.section = section;

    await student.save();

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