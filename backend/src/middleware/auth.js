import jwt from 'jsonwebtoken';
import { User, Role, Student, Teacher, AdminProfile } from '../models/index.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.Role?.name },
    process.env.JWT_SECRET || 'dev_secret_change_me',
    { expiresIn: '12h' }
  );
}

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token || null;
    if (!token) return res.status(401).json({ message: 'Missing token.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_me');
    const user = await User.findByPk(payload.sub, {
      include: [
        Role,
        { model: Student },
        { model: Teacher },
        { model: AdminProfile }
      ]
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Invalid or inactive account.' });
    }

    req.user = user;
    req.role = user.Role?.name;
    req.student = user.Student || null;
    req.teacher = user.Teacher || null;
    req.admin = user.AdminProfile || null;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }
    next();
  };
}
