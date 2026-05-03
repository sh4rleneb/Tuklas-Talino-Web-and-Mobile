import bcrypt from 'bcryptjs';
import {
  Role, User, Student, Teacher, AdminProfile, Lesson, LessonActivity,
  MCQQuestion, MCQOption, WritingTask, SpeechTask, Badge, StudentBadge,
  Group, GroupMember, GroupTask, AuditLog
} from '../models/index.js';

const subjects = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Comm', 'Pagsulat'];

function lessonBody(subject, grade) {
  const early = grade <= 2;
  const defs = {
    'Pagbasa': {
      title: `Pagbasa ${grade}: Maikling Kuwento`,
      duration: '10 minuto',
      passage: early
        ? 'Si Ana ay may bola. Pula ang bola. Masaya si Ana kapag naglalaro siya sa labas.'
        : 'Sa aming barangay, mahalaga ang pagtutulungan. Kapag may proyekto, sama-sama ang mga tao upang matapos ito nang maayos.',
      instructions: 'Basahin ang teksto. Sagutin ang tanong.',
      question: early ? 'Ano ang kulay ng bola?' : 'Ano ang pangunahing ideya ng teksto?',
      options: early ? ['Pula','Asul','Dilaw','Itim'] : ['Pagkain sa barangay','Pagtutulungan sa komunidad','Pag-alis sa lugar','Pagbili ng bagong gamit'],
      correct: early ? 0 : 1,
      speechTarget: early ? 'Si Ana ay may bola.' : 'Mahalaga ang pagtutulungan.'
    },
    'Bokabularyo': {
      title: `Bokabularyo ${grade}: Bahagi ng Pananalita`,
      duration: '10 minuto',
      passage: early
        ? 'Ang pangngalan ay pangalan ng tao, bagay, hayop, at lugar. Halimbawa: bata, lapis, aso, Maynila.'
        : 'Ang pangatnig ay salitang nag-uugnay ng mga salita o pangungusap. Halimbawa: at, ngunit, dahil, kaya.',
      instructions: 'Piliin ang tamang sagot.',
      question: early ? 'Alin ang pangngalan?' : 'Alin ang pangatnig?',
      options: early ? ['Tumakbo','Bahay','Masaya','Mabilis'] : ['Maganda','Dahil','Tahimik','Bilog'],
      correct: 1,
      speechTarget: early ? 'Ang pangngalan ay pangalan ng tao, bagay, hayop, at lugar.' : 'Ang pangatnig ay salitang nag-uugnay.'
    },
    'Panitikan': {
      title: `Panitikan ${grade}: Tula at Aral`,
      duration: '12 minuto',
      passage: "Sa umaga'y liwanag, sa gabi'y bituin,\nSa puso'y pag-asa, sa isip ay giting.\nKapag may pagsubok, huwag bibitiw,\nPagpupunyagi ang susi sa tagumpay.",
      instructions: 'Basahin ang tula. Sagutin ang tanong.',
      question: 'Ano ang mensahe ng tula?',
      options: ['Huwag nang mag-aral','Sumuko sa pagsubok','Magpursige at huwag bibitiw','Umiwas sa tao'],
      correct: 2,
      speechTarget: 'Pagpupunyagi ang susi sa tagumpay.'
    },
    'Oral Comm': {
      title: `Oral Comm ${grade}: Malinaw na Pagpapahayag`,
      duration: '10 minuto',
      passage: early ? 'Sabihin: "Magandang araw po! Ako si _____."' : 'Magbigay ng maikling opinyon tungkol sa: "Bakit mahalaga ang disiplina?"',
      instructions: 'Pindutin ang Pakinggan, pagkatapos ay Magsalita. Ulitin nang malinaw.',
      question: early ? 'Ano ang dapat unang sabihin?' : 'Ano ang paksa ng opinyon?',
      options: early ? ['Magandang araw po','Paalam','Hindi ko alam','Bukas na lang'] : ['Disiplina','Pagkain','Damit','Laruan'],
      correct: 0,
      speechTarget: early ? 'Magandang araw po! Ako si _____.' : 'Mahalaga ang disiplina dahil nakatutulong ito sa pag-abot ng mga layunin.'
    },
    'Pagsulat': {
      title: `Pagsulat ${grade}: Talatang Sanaysay`,
      duration: '15 minuto',
      passage: early ? 'Sumulat ng 3 pangungusap tungkol sa iyong paboritong pagkain.' : 'Sumulat ng 5–6 pangungusap na sumasagot: "Paano mo maipapakita ang pagtutulungan sa bahay o paaralan?"',
      instructions: 'Sumulat nang malinaw. Gumamit ng halimbawa.',
      question: early ? 'Ilang pangungusap ang isusulat?' : 'Ano ang paksa ng talata?',
      options: early ? ['Isa','Dalawa','Tatlo','Sampu'] : ['Pagtutulungan','Paglalakbay','Panahon','Palakasan'],
      correct: early ? 2 : 0,
      speechTarget: early ? 'Gusto ko ang ____ dahil ____.' : 'Pagtutulungan sa bahay o paaralan.'
    }
  };
  return defs[subject];
}

function codeFor(subject) {
  return subject === 'Pagbasa' ? 'PAG'
    : subject === 'Bokabularyo' ? 'WIK'
    : subject === 'Panitikan' ? 'PAN'
    : subject === 'Oral Comm' ? 'ORA'
    : 'SUL';
}

async function createUser(roleName, username, password, displayName, email = null) {
  const role = await Role.findOne({ where: { name: roleName } });
  return User.create({
    roleId: role.id,
    username,
    email,
    displayName,
    passwordHash: await bcrypt.hash(password, 12),
    status: 'active'
  });
}

export async function seedData() {
  await Role.bulkCreate([{ name: 'admin' }, { name: 'teacher' }, { name: 'student' }], { ignoreDuplicates: true });

  const adminUser = await createUser('admin', 'admin', process.env.DEMO_ADMIN_PASSWORD || 'admin123', 'System Admin');
  await AdminProfile.create({ userId: adminUser.id, name: 'System Admin' });

  const teacherUser = await createUser('teacher', 'teacher1', process.env.DEMO_TEACHER_PASSWORD || 'teach123', 'Teacher 1');
  const teacher = await Teacher.create({ userId: teacherUser.id, employeeCode: 'TCH-2025-001', name: 'Teacher 1' });

  const demoStudents = [
    ['STU-2025-001','Lia',1,'Bulaklak','🦋'],
    ['STU-2025-002','Noah',2,'Bituin','🐸'],
    ['STU-2025-003','Juan',3,'Bulaklak','🦊'],
    ['STU-2025-004','Maya',4,'Matalino','🐨'],
    ['STU-2025-005','Paolo',5,'Masigasig','🦁'],
    ['STU-2025-006','Aira',6,'Mapanuri','🐼']
  ];
  const createdStudents = [];
  for (const [studentCode, name, gradeLevel, section, avatar] of demoStudents) {
    const user = await createUser('student', studentCode, process.env.DEMO_STUDENT_PASSWORD || 'student123', name);
    const student = await Student.create({ userId: user.id, studentCode, name, gradeLevel, section, avatar, xp: 0, status: 'active' });
    createdStudents.push(student);
  }

  await Badge.bulkCreate([
    { code: 'FIRST_LESSON', name: 'Unang Hakbang', icon: '🌱', description: 'Nakumpleto ang unang aralin.', xpThreshold: 20 },
    { code: 'READER', name: 'Batang Mambabasa', icon: '📖', description: 'Masipag sa pagbabasa.', xpThreshold: 75 },
    { code: 'WRITER', name: 'Manunulat', icon: '✍️', description: 'Nakapagsumite ng gawaing pagsulat.', xpThreshold: 120 },
    { code: 'SPEAKER', name: 'Mahusay Magsalita', icon: '🎙️', description: 'Nagsanay sa oral communication.', xpThreshold: 160 },
    { code: 'TEAMWORK', name: 'Kasama sa Pangkat', icon: '🤝', description: 'Nakilahok sa pangkatang gawain.', xpThreshold: 200 }
  ], { ignoreDuplicates: true });

  for (let grade = 1; grade <= 6; grade++) {
    for (const subject of subjects) {
      const body = lessonBody(subject, grade);
      const xpReward = 18 + grade * 4 + (subject === 'Pagsulat' ? 6 : subject === 'Oral Comm' ? 4 : 0);
      const lesson = await Lesson.create({
        lessonCode: `G${grade}-${codeFor(subject)}-01`,
        gradeLevel: grade,
        subject,
        title: body.title,
        duration: body.duration,
        xpReward,
        passage: body.passage,
        instructions: body.instructions,
        speechTarget: body.speechTarget,
        status: 'published'
      });

      const mcqActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'mcq', title: 'Pagsusulit', sortOrder: 1 });
      const q = await MCQQuestion.create({ activityId: mcqActivity.id, question: body.question, sortOrder: 1 });
      for (let i = 0; i < body.options.length; i++) {
        await MCQOption.create({ questionId: q.id, optionText: body.options[i], isCorrect: i === body.correct, sortOrder: i + 1 });
      }

      const writingActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'writing', title: 'Gawaing Pagsulat', sortOrder: 2 });
      await WritingTask.create({ activityId: writingActivity.id, prompt: subject === 'Pagsulat' ? body.passage : 'Sumulat ng maikling sagot tungkol sa aralin.', rubricJson: { clarity: 5, grammar: 5, effort: 5 } });

      const speechActivity = await LessonActivity.create({ lessonId: lesson.id, type: 'speech', title: 'Pagsasanay sa Pagbigkas', sortOrder: 3 });
      await SpeechTask.create({ activityId: speechActivity.id, targetText: body.speechTarget, promptJson: ['Basahin nang malinaw.', 'Ulitin kung kailangan.', 'I-save ang transcript.'] });
    }
  }

  const group = await Group.create({ name: 'Pangkat Bituin', description: 'Demo group task para sa pagbasa at pagsulat.', createdByTeacherId: teacher.id });
  for (const s of createdStudents.slice(0, 3)) await GroupMember.create({ groupId: group.id, studentId: s.id });
  await GroupTask.create({ groupId: group.id, title: 'Magbasa at Magbahagi', description: 'Basahin ang kuwento at magbahagi ng aral sa grupo.', xpReward: 12 });

  const firstBadge = await Badge.findOne({ where: { code: 'FIRST_LESSON' } });
  if (firstBadge) await StudentBadge.create({ studentId: createdStudents[0].id, badgeId: firstBadge.id });

  await AuditLog.create({ actorUserId: adminUser.id, action: 'system.seed', entityType: 'database', metadata: { note: 'Initial Tuklas Talino demo data loaded.' } });
}
