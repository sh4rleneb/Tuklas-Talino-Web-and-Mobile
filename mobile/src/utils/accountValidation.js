export function normalizeSpaces(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidName(value = '') {
  const name = normalizeSpaces(value);

  // Allow letters, spaces, apostrophes, periods and hyphens.
  // Require at least first and last name.
  if (!/^(?=.*[A-Za-zÀ-ÿ])[A-Za-zÀ-ÿ'. -]+$/.test(name)) {
    return false;
  }

  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    parts.length >= 2 &&
    parts.every((part) => /[A-Za-zÀ-ÿ]/.test(part))
  );
}

// STRICT_TEACHER_FULL_NAME
const strictTeacherFullNamePattern =
  /^[A-Za-z]{2,}(?: [A-Za-z]{2,})+$/;

export function isValidTeacherFullName(
  value = ''
) {
  const name = normalizeSpaces(value);

  return (
    name.length <= 100 &&
    strictTeacherFullNamePattern.test(name)
  );
}

// STRICT_SECTION_CLIENT_VALIDATION
const strictSectionPattern =
  /^[A-Za-z]{2,}(?: [A-Za-z]{2,})*$/;

export function isValidSection(
  value = ''
) {
  const section =
    normalizeSpaces(value);

  return (
    section.length <= 40 &&
    strictSectionPattern.test(section)
  );
}

export function isValidGrade(value) {
  const grade = Number(value);
  return Number.isInteger(grade) &&
    grade >= 1 &&
    grade <= 6;
}

export function isValidEmail(value = '') {
  const email = String(value).trim();

  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function studentErrors(form) {
  return {
    name: !isValidName(form.name),
    gradeLevel: !isValidGrade(form.gradeLevel),
    section: !isValidSection(form.section),
  };
}

export function teacherErrors(form) {
  return {
    name: !isValidTeacherFullName(form.name),
    email: !isValidEmail(form.email),
  };
}
