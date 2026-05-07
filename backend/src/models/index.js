import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Role = sequelize.define('Role', {
  name: { type: DataTypes.ENUM('admin', 'teacher', 'student'), allowNull: false, unique: true }
}, { tableName: 'roles' });

export const User = sequelize.define('User', {
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(160), allowNull: true, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false },
  displayName: { type: DataTypes.STRING(160), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
  lastLoginAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'users' });

export const Student = sequelize.define('Student', {
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  studentCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  gradeLevel: { type: DataTypes.INTEGER, allowNull: false },
  section: { type: DataTypes.STRING(80), allowNull: false },
  avatar: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '🦊' },
  xp: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
  lastActiveAt: { type: DataTypes.DATE, allowNull: true }
}, { tableName: 'students' });

export const Teacher = sequelize.define('Teacher', {
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  employeeCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' }
}, { tableName: 'teachers' });

export const AdminProfile = sequelize.define('AdminProfile', {
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false }
}, { tableName: 'admins' });

export const Lesson = sequelize.define('Lesson', {
  lessonCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  gradeLevel: { type: DataTypes.INTEGER, allowNull: false },
  subject: { type: DataTypes.STRING(80), allowNull: false },
  title: { type: DataTypes.STRING(220), allowNull: false },
  duration: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '10 minuto' },
  xpReward: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
  passage: { type: DataTypes.TEXT, allowNull: true },
  instructions: { type: DataTypes.TEXT, allowNull: true },
  speechTarget: { type: DataTypes.TEXT, allowNull: true },
  createdByUserId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('published', 'draft', 'archived'), allowNull: false, defaultValue: 'published' }
}, { tableName: 'lessons' });

export const LessonActivity = sequelize.define('LessonActivity', {
  lessonId: { type: DataTypes.INTEGER, allowNull: false },

  type: {
    type: DataTypes.STRING(40),
    allowNull: false
  },

  title: {
    type: DataTypes.STRING(220),
    allowNull: false
  },

  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  dataJson: {
    type: DataTypes.JSON,
    allowNull: true
  },

  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, { tableName: 'lesson_activities' });

export const MCQQuestion = sequelize.define('MCQQuestion', {
  activityId: { type: DataTypes.INTEGER, allowNull: false },
  question: { type: DataTypes.TEXT, allowNull: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, { tableName: 'mcq_questions' });

export const MCQOption = sequelize.define('MCQOption', {
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  optionText: { type: DataTypes.TEXT, allowNull: false },
  isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, { tableName: 'mcq_options' });

export const WritingTask = sequelize.define('WritingTask', {
  activityId: { type: DataTypes.INTEGER, allowNull: false },
  prompt: { type: DataTypes.TEXT, allowNull: false },
  rubricJson: { type: DataTypes.JSON, allowNull: true }
}, { tableName: 'writing_tasks' });

export const SpeechTask = sequelize.define('SpeechTask', {
  activityId: { type: DataTypes.INTEGER, allowNull: false },
  promptJson: { type: DataTypes.JSON, allowNull: true },
  targetText: { type: DataTypes.TEXT, allowNull: false }
}, { tableName: 'speech_tasks' });

export const CompletedLesson = sequelize.define('CompletedLesson', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: true },
  completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'completed_lessons' });

export const QuizHistory = sequelize.define('QuizHistory', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  selectedOptionId: { type: DataTypes.INTEGER, allowNull: false },
  isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
  answeredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'quiz_history' });

export const WritingSubmission = sequelize.define('WritingSubmission', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  feedback: { type: DataTypes.TEXT, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'writing_submissions' });

export const SpeechAttempt = sequelize.define('SpeechAttempt', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  taskId: { type: DataTypes.INTEGER, allowNull: false },
  transcript: { type: DataTypes.TEXT, allowNull: true },
  score: { type: DataTypes.INTEGER, allowNull: true },
  submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'speech_attempts' });

export const Group = sequelize.define('Group', {
  name: { type: DataTypes.STRING(160), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  createdByTeacherId: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' }
}, { tableName: 'groups' });

export const GroupMember = sequelize.define('GroupMember', {
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'group_members' });

export const GroupTask = sequelize.define('GroupTask', {
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(220), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  xpReward: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  dueAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' }
}, { tableName: 'group_tasks' });

export const GroupTaskCompletion = sequelize.define('GroupTaskCompletion', {
  groupTaskId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'group_task_completions' });

export const Badge = sequelize.define('Badge', {
  code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  icon: { type: DataTypes.STRING(16), allowNull: false, defaultValue: '🏅' },
  xpThreshold: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'badges' });

export const StudentBadge = sequelize.define('StudentBadge', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  badgeId: { type: DataTypes.INTEGER, allowNull: false },
  awardedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, { tableName: 'student_badges' });

export const XpLog = sequelize.define('XpLog', {
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  sourceType: { type: DataTypes.STRING(80), allowNull: false },
  sourceId: { type: DataTypes.INTEGER, allowNull: true },
  points: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.STRING(255), allowNull: true }
}, { tableName: 'xp_logs' });

export const AuditLog = sequelize.define('AuditLog', {
  actorUserId: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING(120), allowNull: false },
  entityType: { type: DataTypes.STRING(80), allowNull: true },
  entityId: { type: DataTypes.INTEGER, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true }
}, { tableName: 'audit_logs' });

export const PasskeyCredential = sequelize.define('PasskeyCredential', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  credentialId: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  publicKey: { type: DataTypes.TEXT, allowNull: false },
  counter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  transportsJson: { type: DataTypes.JSON, allowNull: true }
}, { tableName: 'passkey_credentials' });

Role.hasMany(User, { foreignKey: 'roleId' });
User.belongsTo(Role, { foreignKey: 'roleId' });

User.hasOne(Student, { foreignKey: 'userId' });
Student.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(Teacher, { foreignKey: 'userId' });
Teacher.belongsTo(User, { foreignKey: 'userId' });
User.hasOne(AdminProfile, { foreignKey: 'userId' });
AdminProfile.belongsTo(User, { foreignKey: 'userId' });

Lesson.hasMany(LessonActivity, { foreignKey: 'lessonId', as: 'activities' });
LessonActivity.belongsTo(Lesson, { foreignKey: 'lessonId' });
LessonActivity.hasMany(MCQQuestion, { foreignKey: 'activityId', as: 'questions' });
MCQQuestion.belongsTo(LessonActivity, { foreignKey: 'activityId' });
MCQQuestion.hasMany(MCQOption, { foreignKey: 'questionId', as: 'options' });
MCQOption.belongsTo(MCQQuestion, { foreignKey: 'questionId' });
LessonActivity.hasOne(WritingTask, { foreignKey: 'activityId', as: 'writingTask' });
WritingTask.belongsTo(LessonActivity, { foreignKey: 'activityId' });
LessonActivity.hasOne(SpeechTask, { foreignKey: 'activityId', as: 'speechTask' });
SpeechTask.belongsTo(LessonActivity, { foreignKey: 'activityId' });

Student.hasMany(CompletedLesson, { foreignKey: 'studentId' });
CompletedLesson.belongsTo(Student, { foreignKey: 'studentId' });
Lesson.hasMany(CompletedLesson, { foreignKey: 'lessonId' });
CompletedLesson.belongsTo(Lesson, { foreignKey: 'lessonId' });

Group.hasMany(GroupMember, { foreignKey: 'groupId', as: 'members' });
GroupMember.belongsTo(Group, { foreignKey: 'groupId' });
Student.hasMany(GroupMember, { foreignKey: 'studentId' });
GroupMember.belongsTo(Student, { foreignKey: 'studentId' });
Group.hasMany(GroupTask, { foreignKey: 'groupId', as: 'tasks' });
GroupTask.belongsTo(Group, { foreignKey: 'groupId' });
GroupTask.hasMany(GroupTaskCompletion, { foreignKey: 'groupTaskId', as: 'completions' });
GroupTaskCompletion.belongsTo(GroupTask, { foreignKey: 'groupTaskId' });

Student.hasMany(StudentBadge, { foreignKey: 'studentId' });
StudentBadge.belongsTo(Student, { foreignKey: 'studentId' });
Badge.hasMany(StudentBadge, { foreignKey: 'badgeId' });
StudentBadge.belongsTo(Badge, { foreignKey: 'badgeId' });

export const models = {
  Role, User, Student, Teacher, AdminProfile, Lesson, LessonActivity,
  MCQQuestion, MCQOption, WritingTask, SpeechTask, CompletedLesson, QuizHistory,
  WritingSubmission, SpeechAttempt, Group, GroupMember, GroupTask,
  GroupTaskCompletion, Badge, StudentBadge, XpLog, AuditLog, PasskeyCredential
};

export async function syncModels({ force = false } = {}) {
  await sequelize.sync({ force });
}
