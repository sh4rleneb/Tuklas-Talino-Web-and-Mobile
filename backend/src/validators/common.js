import { z } from 'zod';

function makeLessonCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LESSON-${stamp}-${random}`;
}

const activityBaseSchema = z.object({
  title: z.string().min(2).optional(),
  instructions: z.string().optional().nullable()
});

const mcqActivitySchema = activityBaseSchema.extend({
  type: z.literal('mcq'),
  title: z.string().min(2).default('Multiple Choice Quiz'),
  questions: z.array(
    z.object({
      question: z.string().min(2),
      options: z.array(
        z.object({
          text: z.string().min(1),
          isCorrect: z.boolean().default(false)
        })
      ).min(2, 'Multiple choice questions need at least 2 options.')
    })
  ).min(1, 'MCQ activity needs at least 1 question.')
});

const writingActivitySchema = activityBaseSchema.extend({
  type: z.literal('writing'),
  title: z.string().min(2).default('Writing Activity'),
  prompt: z.string().min(3, 'Writing activity needs a prompt.'),
  rubric: z.any().optional().nullable()
});

const speechActivitySchema = activityBaseSchema.extend({
  type: z.literal('speech'),
  title: z.string().min(2).default('Speech Practice'),
  targetText: z.string().min(2, 'Speech activity needs target text.'),
  prompts: z.array(z.any()).optional().default([])
});

const matchingActivitySchema = activityBaseSchema.extend({
  type: z.literal('matching'),
  title: z.string().min(2).default('Matching Game'),
  pairs: z.array(
    z.object({
      left: z.string().min(1),
      right: z.string().min(1)
    })
  ).min(2, 'Matching activity needs at least 2 pairs.')
});

const vocabularyActivitySchema = activityBaseSchema.extend({
  type: z.literal('vocabulary'),
  title: z.string().min(2).default('Vocabulary Cards'),
  words: z.array(
    z.object({
      word: z.string().min(1),
      meaning: z.string().min(1),
      example: z.string().optional().nullable()
    })
  ).min(1, 'Vocabulary activity needs at least 1 word.')
});

const infographicActivitySchema = activityBaseSchema.extend({
  type: z.literal('infographic'),
  title: z.string().min(2).default('Info Card'),
  content: z.string().min(3, 'Infographic activity needs content.')
});

const lessonActivitySchema = z.discriminatedUnion('type', [
  mcqActivitySchema,
  writingActivitySchema,
  speechActivitySchema,
  matchingActivitySchema,
  vocabularyActivitySchema,
  infographicActivitySchema
]);

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
  avatar: z.string().default(''),
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
  lessonCode: z.string().min(3).optional().default(makeLessonCode),
  gradeLevel: z.number().int().min(1).max(6),
  subject: z.string().min(2),
  title: z.string().min(3),
  duration: z.string().default('10 minuto'),
  xpReward: z.number().int().min(1).default(20),
  passage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  speechTarget: z.string().optional().nullable(),
  activities: z.array(lessonActivitySchema).default([])
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