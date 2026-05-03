import { Router } from 'express';
import authRoutes from './auth.routes.js';
import studentRoutes from './students.routes.js';
import teacherRoutes from './teachers.routes.js';
import lessonRoutes from './lessons.routes.js';
import groupRoutes from './groups.routes.js';
import adminRoutes from './admin.routes.js';
import reportRoutes from './reports.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ ok: true, service: 'tuklas-talino-api' }));
router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/lessons', lessonRoutes);
router.use('/groups', groupRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportRoutes);

export default router;
