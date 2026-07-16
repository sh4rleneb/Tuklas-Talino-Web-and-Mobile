import fs from 'node:fs';
import path from 'node:path';
import { randomInt, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { sequelize } from '../src/config/database.js';
import {
  Role, User, Student, Teacher, TeacherAssignment, Lesson, LessonActivity,
  MCQQuestion, MCQOption, WritingTask, SpeechTask, Group, GroupMember, GroupTask
} from '../src/models/index.js';

const ROOT = process.cwd();
const EVIDENCE = path.join(ROOT, 'defense-security-evidence', 'zap');
const BACKUPS = path.join(ROOT, 'defense-security-evidence', 'database-backups');
const CREDENTIALS = path.join(EVIDENCE, 'zap-test-credentials.txt');
const GRADE = 3;
const SECTION = 'ZAPTEST';

const plans = [
  ['teacher', 'ZAPTEA01', 'ZAP Test Teacher', '🧑‍🏫'],
  ['student', 'ZAPSTU01', 'ZAP Test Leader', '🦊'],
  ['student', 'ZAPSTU02', 'ZAP Test Member One', '🐼'],
  ['student', 'ZAPSTU03', 'ZAP Test Member Two', '🐸'],
];

const pin = () => Array.from({ length: 4 }, () => '23456789'[randomInt(8)]).join('');
const stop = (message) => { throw new Error(message); };

function verifySafety() {
  if (process.env.ZAP_SEED_CONFIRM !== 'YES') stop('Use ZAP_SEED_CONFIRM=YES to authorize this production test seed.');
  if (!fs.existsSync(path.join(EVIDENCE, 'test-scope.txt'))) stop('Missing ZAP scope file.');
  const backups = fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS) : [];
  if (!backups.some((name) => /^tuklas_before_zap_.*\.sql$/.test(name))) stop('Missing pre-ZAP SQL backup.');
}

async function account(roleName, username, name, avatar, temporaryPin, transaction) {
  const role = await Role.findOne({ where: { name: roleName }, transaction });
  if (!role) stop(`Missing role: ${roleName}`);

  const passwordHash = await bcrypt.hash(temporaryPin, 12);
  let user = await User.findOne({ where: { username }, transaction });

  if (user && Number(user.roleId) !== Number(role.id)) stop(`${username} belongs to another role.`);

  const userValues = {
    roleId: role.id, username, displayName: name, passwordHash,
    status: 'active', mustChangePassword: true, failedLoginAttempts: 0,
    failedLoginWindowStartedAt: null, lockedUntil: null
  };

  user ? await user.update(userValues, { transaction }) :
    user = await User.create(userValues, { transaction });

  if (roleName === 'teacher') {
    let profile = await Teacher.findOne({
      where: { [Op.or]: [{ userId: user.id }, { employeeCode: username }] },
      transaction
    });
    if (profile && Number(profile.userId) !== Number(user.id)) stop(`${username} teacher profile collision.`);
    const values = { userId: user.id, employeeCode: username, name, status: 'active' };
    profile ? await profile.update(values, { transaction }) :
      profile = await Teacher.create({ uuid: randomUUID(), ...values }, { transaction });
    return { user, profile };
  }

  let profile = await Student.findOne({
    where: { [Op.or]: [{ userId: user.id }, { studentCode: username }] },
    transaction
  });
  if (profile && Number(profile.userId) !== Number(user.id)) stop(`${username} student profile collision.`);
  const values = {
    userId: user.id, studentCode: username, name, gradeLevel: GRADE,
    section: SECTION, avatar, status: 'active'
  };
  profile ? await profile.update(values, { transaction }) :
    profile = await Student.create({ ...values, xp: 0 }, { transaction });
  return { user, profile };
}

async function activity(lessonId, type, title, instructions, dataJson, sortOrder, transaction) {
  let row = await LessonActivity.findOne({ where: { lessonId, type, title }, transaction });
  const values = { lessonId, type, title, instructions, dataJson, sortOrder };
  row ? await row.update(values, { transaction }) :
    row = await LessonActivity.create(values, { transaction });
  return row;
}

async function replaceQuiz(activityId, questions, transaction) {
  const old = await MCQQuestion.findAll({ where: { activityId }, attributes: ['id'], transaction });
  const ids = old.map((row) => row.id);
  if (ids.length) {
    await MCQOption.destroy({ where: { questionId: { [Op.in]: ids } }, transaction });
    await MCQQuestion.destroy({ where: { id: { [Op.in]: ids } }, transaction });
  }

  for (const [index, item] of questions.entries()) {
    const question = await MCQQuestion.create(
      { activityId, question: item[0], sortOrder: index + 1 },
      { transaction }
    );
    for (const [optionIndex, text] of item[1].entries()) {
      await MCQOption.create({
        questionId: question.id, optionText: text,
        isCorrect: optionIndex === item[2], sortOrder: optionIndex + 1
      }, { transaction });
    }
  }
}

async function main() {
  verifySafety();
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const pins = Object.fromEntries(plans.map((plan) => [plan[1], pin()]));
  await sequelize.authenticate();

  const ids = await sequelize.transaction(async (transaction) => {
    const records = {};
    for (const plan of plans) {
      records[plan[1]] = await account(...plan, pins[plan[1]], transaction);
    }

    const teacher = records.ZAPTEA01.profile;
    const teacherUser = records.ZAPTEA01.user;
    const students = ['ZAPSTU01', 'ZAPSTU02', 'ZAPSTU03'].map((key) => records[key].profile);

    const [assignment] = await TeacherAssignment.findOrCreate({
      where: { teacherId: teacher.id, gradeLevel: GRADE, section: SECTION },
      defaults: { status: 'active' }, transaction
    });
    await assignment.update({ status: 'active' }, { transaction });

    const lessonValues = {
      lessonCode: 'ZAP-G3-001', gradeLevel: GRADE, subject: 'Filipino',
      title: 'ZAP Test Lesson: Ligtas na Paggamit ng Internet',
      duration: '20 minuto', xpReward: 20,
      passage: 'Layunin: Natutukoy ang ligtas na gawain sa internet.\n\nAlamin: Hindi basta ibinabahagi online ang personal na impormasyon.\n\nAralin: Gumamit ng matibay na password, humingi ng tulong sa guro o magulang, at iwasan ang kahina-hinalang link.',
      instructions: 'Basahin ang aralin at sagutan ang mga gawaing ZAPTEST.',
      speechTarget: 'Ligtas akong gumagamit ng internet.',
      createdByUserId: teacherUser.id, status: 'published'
    };

    let lesson = await Lesson.findOne({ where: { lessonCode: lessonValues.lessonCode }, transaction });
    if (lesson && !String(lesson.title).startsWith('ZAP Test')) stop('Lesson code collision.');
    lesson ? await lesson.update(lessonValues, { transaction }) :
      lesson = await Lesson.create(lessonValues, { transaction });

    const quiz = await activity(
      lesson.id, 'mcq', 'ZAP Test Quiz',
      'Piliin ang tamang sagot. Tatlong pagtatangka lamang.',
      { maxAttempts: 3 }, 1, transaction
    );

    await replaceQuiz(quiz.id, [
      ['Ano ang dapat gawin bago magbahagi ng personal na impormasyon online?', ['Humingi ng pahintulot sa magulang o guro', 'I-post agad', 'Ipadala sa hindi kilala', 'Isulat sa pampublikong chat'], 0],
      ['Alin ang halimbawa ng mas matibay na password?', ['1234', 'password', 'Aklat!Bituin7', 'abcd'], 2],
      ['Ano ang gagawin sa kahina-hinalang link?', ['Pindutin agad', 'Iwasan at ipaalam sa guro o magulang', 'Ipadala sa lahat', 'Ilagay ang password'], 1],
      ['Sino ang maaaring lapitan kapag may nakitang nakakatakot online?', ['Walang sinuman', 'Isang pinagkakatiwalaang guro o magulang', 'Hindi kilalang account', 'Lahat ng nasa chat'], 1],
      ['Ano ang tamang gawain pagkatapos gumamit ng pampublikong computer?', ['Iwanang naka-login', 'I-save ang password', 'Mag-log out sa account', 'Ibahagi ang account'], 2],
    ], transaction);

    const writing = await activity(
      lesson.id, 'writing', 'ZAP Test Writing Activity',
      'Sumulat ng dalawang pangungusap.', { maxAttempts: 2 }, 2, transaction
    );
    const writingValues = {
      activityId: writing.id,
      prompt: 'Sumulat ng dalawang paraan upang manatiling ligtas sa internet.',
      rubricJson: { clarity: 5, relevance: 5, total: 10 }
    };
    const writingTask = await WritingTask.findOne({ where: { activityId: writing.id }, transaction });
    writingTask ? await writingTask.update(writingValues, { transaction }) :
      await WritingTask.create(writingValues, { transaction });

    const speech = await activity(
      lesson.id, 'speech', 'ZAP Test Speech Activity',
      'Basahin nang malinaw ang pangungusap.',
      { maxAttempts: 3, contentSafetyContext: 'speech_target', allowTeacherSpeechTarget: true },
      3, transaction
    );
    const speechValues = {
      activityId: speech.id, targetText: 'Ligtas akong gumagamit ng internet.',
      promptJson: ['Basahin nang malinaw.', 'Ulitin kung kailangan.', 'Isumite ang pinakamalinaw na pagbigkas.']
    };
    const speechTask = await SpeechTask.findOne({ where: { activityId: speech.id }, transaction });
    speechTask ? await speechTask.update(speechValues, { transaction }) :
      await SpeechTask.create(speechValues, { transaction });

    const groupValues = {
      name: 'ZAP Test Group',
      description: 'Dummy Grade 3 group for authorized passive ZAP testing.',
      gradeLevel: GRADE, section: SECTION,
      createdByTeacherId: teacher.id, status: 'active'
    };
    let group = await Group.findOne({
      where: { name: groupValues.name, createdByTeacherId: teacher.id }, transaction
    });
    group ? await group.update(groupValues, { transaction }) :
      group = await Group.create(groupValues, { transaction });

    const existing = await GroupMember.findAll({ where: { groupId: group.id }, transaction });
    const allowed = new Set(students.map((student) => Number(student.id)));
    if (existing.some((member) => !allowed.has(Number(member.studentId)))) {
      stop('ZAP Test Group contains a non-ZAP student.');
    }

    await GroupMember.update({ groupRole: 'member' }, { where: { groupId: group.id }, transaction });
    for (const [index, student] of students.entries()) {
      const [member] = await GroupMember.findOrCreate({
        where: { groupId: group.id, studentId: student.id },
        defaults: { groupRole: index === 0 ? 'leader' : 'member' },
        transaction
      });
      await member.update({ groupRole: index === 0 ? 'leader' : 'member' }, { transaction });
    }

    const taskValues = {
      groupId: group.id, title: 'ZAP Test Group Task',
      description: 'Maghanda ng tatlong tuntunin para sa ligtas na paggamit ng internet.',
      xpReward: 10, dueAt: new Date(Date.now() + 7 * 86400000), status: 'active'
    };
    let task = await GroupTask.findOne({
      where: { groupId: group.id, title: taskValues.title }, transaction
    });
    task ? await task.update(taskValues, { transaction }) :
      task = await GroupTask.create(taskValues, { transaction });

    return { teacher: teacher.id, lesson: lesson.id, group: group.id, task: task.id };
  });

  const lines = [
    'TUKLAS TALINO ZAP TEST CREDENTIALS',
    `Generated: ${new Date().toISOString()}`, '',
    ...plans.flatMap((plan) => [
      plan[2], `Username: ${plan[1]}`, `Temporary PIN: ${pins[plan[1]]}`, ''
    ]),
    'Test class: Grade 3 - ZAPTEST',
    'Lesson code: ZAP-G3-001',
    `Teacher ID: ${ids.teacher}`, `Lesson ID: ${ids.lesson}`,
    `Group ID: ${ids.group}`, `Group task ID: ${ids.task}`
  ];
  fs.writeFileSync(CREDENTIALS, `${lines.join('\n')}\n`, { mode: 0o600 });
  fs.chmodSync(CREDENTIALS, 0o600);

  console.log('[OK] ZAP test accounts and content are ready.');
  console.log(`[OK] Credentials saved to ${CREDENTIALS}`);
  console.log('[OK] No administrator account was created.');
}

main()
  .catch((error) => {
    console.error('[ERROR]', error.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close().catch(() => null));
