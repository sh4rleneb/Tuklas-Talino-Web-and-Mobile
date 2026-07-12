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

const materialActivitySchema = activityBaseSchema.extend({
  type: z.literal('material'),
  title: z.string().min(2).default('Lesson Slides'),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.number().optional().nullable()
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
  materialActivitySchema,
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
  password: z.string().min(1)
});

/*
 * ADMIN_ACCOUNT_INPUT_HARDENING
 */

const accountControlOrFormatPattern =
  /[\p{Cc}\p{Cf}]/u;

const accountRepeatedChunkPattern =
  /(.{4,20})\1{2,}/iu;

const accountPersonNamePattern =
  /^[\p{L}\p{M}](?:[\p{L}\p{M} .'\u2019-]*[\p{L}\p{M}.'\u2019])?$/u;

const accountSectionPattern =
  /^[\p{L}\p{M}\p{N}](?:[\p{L}\p{M}\p{N} .'\u2019-]*[\p{L}\p{M}\p{N}])?$/u;

function normalizeAccountText(value = '') {
  return String(value || '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .trim();
}

const accountNameSchema =
  z.string()
    .transform(normalizeAccountText)
    .pipe(
      z.string()
        .min(
          2,
          'Name must contain at least 2 characters.'
        )
        .max(
          120,
          'Name must not exceed 120 characters.'
        )
        .regex(
          accountPersonNamePattern,
          'Name contains unsupported characters.'
        )
        .refine(
          (value) =>
            !accountControlOrFormatPattern.test(value),
          'Name contains invisible or control characters.'
        )
        .refine(
          (value) =>
            !accountRepeatedChunkPattern.test(value),
          'Name contains an invalid repeated pattern.'
        )
    );

const accountSectionSchema =
  z.string()
    .transform(normalizeAccountText)
    .pipe(
      z.string()
        .min(
          1,
          'Section cannot be empty.'
        )
        .max(
          40,
          'Section must not exceed 40 characters.'
        )
        .regex(
          accountSectionPattern,
          'Section contains unsupported characters.'
        )
        .refine(
          (value) =>
            !accountControlOrFormatPattern.test(value),
          'Section contains invisible or control characters.'
        )
        .refine(
          (value) =>
            !accountRepeatedChunkPattern.test(value),
          'Section contains an invalid repeated pattern.'
        )
    );

const accountAvatarSchema =
  z.union([
    z.literal('🧒'),
    z.literal(''),
  ])
    .optional()
    .transform(() => '🧒');

const optionalTeacherEmailSchema =
  z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === null
      ) {
        return null;
      }

      const normalized =
        String(value)
          .trim()
          .toLowerCase();

      return normalized || null;
    },
    z.union([
      z.string()
        .max(
          254,
          'Email must not exceed 254 characters.'
        )
        .email(),

      z.null(),
    ])
  );

export const studentSchema =
  z.object({
    name:
      accountNameSchema,

    gradeLevel:
      z.number()
        .int()
        .min(1)
        .max(6),

    section:
      accountSectionSchema,

    avatar:
      accountAvatarSchema,
  })
    .strict();

export const teacherSchema =
  z.object({
    name:
      accountNameSchema,

    email:
      optionalTeacherEmailSchema
        .optional(),
  })
    .strict();


export const lessonSchema = z.object({
  lessonCode: z.string().min(3).optional().default(makeLessonCode),
  gradeLevel: z.number().int().min(1).max(6),
  subject: z.string().trim().min(2, 'Subject cannot be empty.'),
  title: z.string().trim().min(3, 'Title cannot be empty.'),
  duration: z.string().default('10 minuto'),
  xpReward: z.number().int().min(1).default(20),
  passage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  speechTarget: z.string().optional().nullable(),
  status: z.enum(['published', 'draft', 'archived']).optional().default('published'),
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
