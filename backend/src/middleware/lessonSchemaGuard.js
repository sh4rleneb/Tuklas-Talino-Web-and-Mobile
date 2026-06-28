import { validateLesson } from '../validators/lesson.validator.js';

export function lessonSchemaGuard(req, res, next) {
  const text = req.body?.passage || req.body?.lesson || '';

  const check = validateLesson(text);

  if (!check.isValid) {
    return res.status(400).json({
      message: 'Invalid lesson schema (blocked by schema guard)',
      errors: check.errors,
    });
  }

  next();
}
