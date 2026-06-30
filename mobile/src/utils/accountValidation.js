export function normalizeSpaces(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidName(value = '') {
  const name = normalizeSpaces(value);

  // Allow letters, spaces, apostrophes, periods and hyphens.
  // Require at least one alphabetic character.
  return (
    name.length >= 2 &&
    /^(?=.*[A-Za-zÀ-ÿ])[A-Za-zÀ-ÿ'. -]+$/.test(name)
  );
}

export function isValidSection(value = '') {
  return normalizeSpaces(value).length > 0;
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
    name: !isValidName(form.name),
    email: !isValidEmail(form.email),
  };
}
