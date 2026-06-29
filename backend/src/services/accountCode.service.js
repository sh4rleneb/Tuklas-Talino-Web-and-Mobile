import { Op } from 'sequelize';
import { Student, Teacher } from '../models/index.js';

function nextCode(previousCode, prefix, year) {
  if (!previousCode) {
    return `${prefix}-${year}-001`;
  }

  const match = previousCode.match(/-(\d{3})$/);
  const sequence = match ? Number(match[1]) + 1 : 1;

  return `${prefix}-${year}-${String(sequence).padStart(3, '0')}`;
}

export async function generateStudentCode() {
  const year = new Date().getFullYear();

  const latest = await Student.findOne({
    where: {
      studentCode: {
        [Op.like]: `STU-${year}-%`,
      },
    },
    order: [['studentCode', 'DESC']],
  });

  return nextCode(latest?.studentCode, 'STU', year);
}

export async function generateTeacherCode() {
  const year = new Date().getFullYear();

  const latest = await Teacher.findOne({
    where: {
      employeeCode: {
        [Op.like]: `TCH-${year}-%`,
      },
    },
    order: [['employeeCode', 'DESC']],
  });

  return nextCode(latest?.employeeCode, 'TCH', year);
}
