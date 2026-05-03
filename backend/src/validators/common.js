import { z } from 'zod';

export const loginSchema = z.object({
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  identifier: z.string().min(2),
  password: z.string().min(3)
});

export const studentSchema = z.object({
  studentCode: z.string().min(3),
  name: z.string().min(2),
  gradeLevel: z.number().int().min(1).max(6),
  section: z.string().min(1),
  avatar: z.string().default('🦊'),
  password: z.string().min(6).optional()
});

export const teacherSchema = z.object({
  username: z.string().min(3),
  employeeCode: z.string().min(3),
  name: z.string().min(2),
  email: z.string().email().optional().nullable(),
  password: z.string().min(6).optional()
});

export const lessonSchema = z.object({
  lessonCode: z.string().min(3),
  gradeLevel: z.number().int().min(1).max(6),
  subject: z.string().min(2),
  title: z.string().min(3),
  duration: z.string().default('10 minuto'),
  xpReward: z.number().int().min(1).default(20),
  passage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  speechTarget: z.string().optional().nullable(),
  activities: z.array(z.any()).default([])
});

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const err = new Error('Validation failed');
    err.statusCode = 422;
    err.details = result.error.flatten();
    throw err;
  }
  return result.data;
}
