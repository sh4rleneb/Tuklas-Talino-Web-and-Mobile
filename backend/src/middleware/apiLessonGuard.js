import { validateLesson } from '../validators/lesson.validator.js';

function isLessonWriteRequest(req) {
  const url = req.originalUrl || '';
  const method = req.method;

  return (
    url.includes('/lessons') &&
    ['POST', 'PUT', 'PATCH'].includes(method)
  );
}

export function apiLessonGuard(req, res, next) {
  if (!isLessonWriteRequest(req)) {
    return next();
  }

  const text =
    req.body?.passage ||
    req.body?.lesson ||
    '';

  const check = validateLesson(text);

  if (!check.isValid) {
    return res.status(400).json({
      message: 'Lesson rejected by schema lock',
      errors: check.errors,
    });
  }

  next();
}
