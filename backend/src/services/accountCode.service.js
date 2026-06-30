import { Student, Teacher, User } from '../models/index.js';

export async function generateStudentCode() {
  const year = new Date().getFullYear();

  let sequence = 1;

  while (true) {
    const candidate =
      `STU-${year}-${String(sequence).padStart(3, '0')}`;

    const exists = await User.findOne({
      where: { username: candidate },
      attributes: ['id'],
    });

    if (!exists) {
      return candidate;
    }

    sequence++;
  }
}
export async function generateTeacherCode() {
  const year = new Date().getFullYear();

  let sequence = 1;

  while (true) {
    const candidate =
      `TCH-${year}-${String(sequence).padStart(3, '0')}`;

    const exists = await User.findOne({
      where: { username: candidate },
      attributes: ['id'],
    });

    if (!exists) {
      return candidate;
    }

    sequence++;
  }
}
