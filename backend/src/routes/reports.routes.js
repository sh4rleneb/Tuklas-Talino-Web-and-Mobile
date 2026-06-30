import PDFDocument from 'pdfkit';
import { Router } from 'express';
import { Op } from 'sequelize';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  User,
  Student,
  Teacher,
  TeacherAssignment,
  Lesson,
  CompletedLesson,
  LessonProgress,
  QuizAttempt,
  WritingSubmission,
  SpeechAttempt,
  AuditLog
} from '../models/index.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'teacher'));


async function getTeacherAssignments(req) {
  if (req.role === 'admin') return null;
  if (req.role !== 'teacher') return null;
  if (!req.teacher?.id) return [];

  return TeacherAssignment.findAll({
    where: {
      teacherId: req.teacher.id,
      status: 'active'
    }
  });
}

function assignedStudentWhere(assignments) {
  if (assignments === null) return {};
  if (!assignments.length) return { id: [] };

  return {
    [Op.or]: assignments.map((assignment) => ({
      gradeLevel: assignment.gradeLevel,
      section: assignment.section
    }))
  };
}



async function buildStudentPerformance(where) {

  const students = await Student.findAll({
    where,
    order: [
      ['gradeLevel','ASC'],
      ['section','ASC'],
      ['name','ASC']
    ]
  });

  const rows = [];

  for (const student of students) {

    const completedLessons =
      await CompletedLesson.count({
        where:{
          studentId:student.id
        }
      });

    const quizAttempts =
      await QuizAttempt.findAll({
        where:{
          studentId:student.id
        }
      });

    const writing =
      await WritingSubmission.findAll({
        where:{
          studentId:student.id
        }
      });

    const speech =
      await SpeechAttempt.findAll({
        where:{
          studentId:student.id
        }
      });

    const quizAverage =
      quizAttempts.length
      ? Math.round(
          quizAttempts.reduce(
            (t,q)=>t+(q.percent||0),
            0
          )/quizAttempts.length
        )
      :0;

    const writingAverage =
      writing.length
      ? Math.round(
          writing.reduce(
            (t,w)=>t+(w.score||0),
            0
          )/writing.length
        )
      :0;

    const speechAverage =
      speech.length
      ? Math.round(
          speech.reduce(
            (t,s)=>t+(s.score||0),
            0
          )/speech.length
        )
      :0;

    let status = "Needs Support";

    if(quizAverage>=90)
      status="Excellent";
    else if(quizAverage>=75)
      status="Good";
    else if(quizAverage>=60)
      status="Fair";

    rows.push({

      student,

      completedLessons,

      quizAverage,

      writingAverage,

      speechAverage,

      status

    });

  }

  return rows;
}




async function loadStudentPerformance(where) {

  const students = await Student.findAll({
    where,
    order: [
      ['gradeLevel','ASC'],
      ['section','ASC'],
      ['name','ASC']
    ]
  });

  const lessonCount = await Lesson.count({
    where:{
      status:'published'
    }
  });

  const rows = [];

  for (const student of students) {

    const completed =
      await CompletedLesson.count({
        where:{
          studentId:student.id
        }
      });

    const attempts =
      await QuizAttempt.findAll({
        where:{
          studentId:student.id
        }
      });

    const writingPending =
      await WritingSubmission.count({
        where:{
          studentId:student.id,
          reviewStatus:'pending'
        }
      });

    const speechPending =
      await SpeechAttempt.count({
        where:{
          studentId:student.id
        }
      });

    const averageQuiz =
      attempts.length
        ? Math.round(
            attempts.reduce(
              (a,b)=>a+(b.percent||0),
              0
            ) / attempts.length
          )
        : 0;

    const bestQuiz =
      attempts.length
        ? Math.max(
            ...attempts.map(a=>a.percent||0)
          )
        : 0;

    rows.push({

      student,

      completed,

      lessonCount,

      completionPercent:
        lessonCount
          ? Math.round(
              completed*100/lessonCount
            )
          : 0,

      averageQuiz,

      bestQuiz,

      writingPending,

      speechAttempts:speechPending

    });

  }

  return rows;

}


function buildPerformanceSummary(rows){

  if(!rows.length){

    return {

      students:0,

      averageQuiz:0,

      averageCompletion:0,

      averageXp:0,

      highest:null,

      lowest:null,

      intervention:[]

    };

  }

  const averageQuiz =
    Math.round(
      rows.reduce(
        (t,r)=>t+r.averageQuiz,
        0
      )/rows.length
    );

  const averageCompletion =
    Math.round(
      rows.reduce(
        (t,r)=>t+r.completionPercent,
        0
      )/rows.length
    );

  const averageXp =
    Math.round(
      rows.reduce(
        (t,r)=>t+r.student.xp,
        0
      )/rows.length
    );

  const sorted =
    [...rows].sort(
      (a,b)=>
        b.averageQuiz-a.averageQuiz
    );

  return{

    students:rows.length,

    averageQuiz,

    averageCompletion,

    averageXp,

    highest:sorted[0],

    lowest:sorted[sorted.length-1],

    intervention:rows.filter(
      r=>
        r.averageQuiz<75 ||
        r.completionPercent<60
    )

  };

}




function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value);
  return `"${v.replace(/"/g, '""')}"`;
}


router.get('/students', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const students = await Student.findAll({
      where,
      order: [['gradeLevel', 'ASC'], ['name', 'ASC']]
    });

    res.json(
      students.map((student) => ({
        id: student.id,
        studentCode: student.studentCode,
        name: student.name,
        gradeLevel: student.gradeLevel,
        section: student.section,
        avatar: student.avatar,
        xp: student.xp,
        status: student.status,
        lastActiveAt: student.lastActiveAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/activity-logs', requireRole('admin'), async (req, res, next) => {
  try {
    const where = {};

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    res.json(
      logs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        actorUserId: log.actorUserId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/students.csv', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const students = await Student.findAll({
      where,
      order: [['gradeLevel','ASC'], ['name','ASC']]
    });

    const lines = [['Student ID','Name','Grade','Section','XP','Status','Last Active'].map(csvEscape).join(',')];
    for (const s of students) lines.push([s.studentCode, s.name, s.gradeLevel, s.section, s.xp, s.status, s.lastActiveAt || ''].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-students.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/activity-logs.csv', requireRole('admin'), async (req, res, next) => {
  try {
    const where = req.role === 'teacher' ? { actorUserId: req.user.id } : {};

    const logs = await AuditLog.findAll({
      where,
      order: [['createdAt','DESC']],
      limit: 1000
    });

    const lines = [['Date','Actor','Action','Entity','Entity ID','Metadata'].map(csvEscape).join(',')];
    for (const log of logs) lines.push([log.createdAt, log.actorUserId, log.action, log.entityType, log.entityId, JSON.stringify(log.metadata || {})].map(csvEscape).join(','));
    res.header('Content-Type', 'text/csv');
    res.attachment('tuklas-talino-activity-logs.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/summary', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const [students, active, xp, lessons, completions] = await Promise.all([
      Student.count({ where }),
      Student.count({ where: { ...where, status: 'active' } }),
      Student.sum('xp', { where }),
      Lesson.count({ where: { status: 'published' } }),
      CompletedLesson.count({
        where: assignments === null
          ? {}
          : { studentId: (await Student.findAll({ where, attributes: ['id'] })).map(student => student.id) }
      })
    ]);
    const teacherAssignments = await TeacherAssignment.count();
    const totalUsers = req.role === 'admin' ? await User.count() : undefined;
    const teachers = req.role === 'admin' ? await Teacher.count() : undefined;
    const archivedAccounts = req.role === 'admin'
      ? await User.count({ where: { status: 'archived' } })
      : undefined;

    res.json({
      generatedAt: new Date(),
      students,
      activeStudents: active,
      totalXp: xp || 0,
      lessons,
      completions,
      averageProgress: students && lessons
        ? Math.round((completions / (students * lessons)) * 100)
        : 0,
      teacherAssignments,
      totalUsers,
      teachers,
      archivedAccounts
    });
  } catch (err) { next(err); }
});




router.get('/summary.csv', async (req, res, next) => {

  try {

    const assignments =
      await getTeacherAssignments(req);

    const where =
      assignedStudentWhere(assignments);

    const rows =
      await loadStudentPerformance(where);

    const summary =
      buildPerformanceSummary(rows);

    const csv = [];

    csv.push([
      'Student ID',
      'Student Name',
      'Grade',
      'Section',
      'XP',
      'Lessons Completed',
      'Completion %',
      'Average Quiz',
      'Best Quiz',
      'Pending Writing',
      'Speech Attempts',
      'Status',
      'Last Active'
    ].map(csvEscape).join(','));

    for(const row of rows){

      csv.push([

        row.student.studentCode,

        row.student.name,

        row.student.gradeLevel,

        row.student.section,

        row.student.xp,

        row.completed,

        row.completionPercent + '%',

        row.averageQuiz + '%',

        row.bestQuiz + '%',

        row.writingPending,

        row.speechAttempts,

        row.student.status,

        row.student.lastActiveAt || ''

      ].map(csvEscape).join(','));

    }

    csv.push('');

    csv.push(
      ['CLASS SUMMARY'].map(csvEscape).join(',')
    );

    csv.push(
      ['Students',summary.students]
      .map(csvEscape).join(',')
    );

    csv.push(
      ['Average Quiz',summary.averageQuiz + '%']
      .map(csvEscape).join(',')
    );

    csv.push(
      ['Average Completion',summary.averageCompletion + '%']
      .map(csvEscape).join(',')
    );

    csv.push(
      ['Average XP',summary.averageXp]
      .map(csvEscape).join(',')
    );

    csv.push(
      ['Highest Performer',
       summary.highest
         ? summary.highest.student.name
         : ''
      ].map(csvEscape).join(',')
    );

    csv.push(
      ['Needs Intervention',
       summary.intervention.length
      ].map(csvEscape).join(',')
    );

    res.header(
      'Content-Type',
      'text/csv'
    );

    res.attachment(
      req.role === 'admin'
        ? 'admin-performance-report.csv'
        : 'teacher-performance-report.csv'
    );

    res.send(csv.join('\\n'));

  } catch(err){

    next(err);

  }

});

router.get('/summary.pdf', async (req, res, next) => {
  try {

    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const rows =
      await loadStudentPerformance(where);

    const summary =
      buildPerformanceSummary(rows);

    const doc = new PDFDocument({
      margin:40,
      size:'A4'
    });

    res.setHeader(
      'Content-Type',
      'application/pdf'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' +
      (
        req.role === 'admin'
          ? 'admin-summary-report.pdf'
          : 'teacher-summary-report.pdf'
      )
    );

    doc.pipe(res);

    doc
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('TUKLAS TALINO', {
        align: 'center'
      });

    doc
      .fontSize(16)
      .text(
        req.role === 'admin'
          ? 'Administrator Student Performance Report'
          : 'Teacher Student Performance Report',
        {
          align: 'center'
        }
      );

    doc.moveDown();

    doc
      .font('Helvetica')
      .fontSize(10);

    doc.text(
      'Generated: ' +
      new Date().toLocaleString()
    );

    doc.text(
      'Students Included: ' +
      summary.students
    );

    doc.text(
      'Average Quiz: ' +
      summary.averageQuiz +
      '%'
    );

    doc.text(
      'Average Completion: ' +
      summary.averageCompletion +
      '%'
    );

    doc.text(
      'Average XP: ' +
      summary.averageXp
    );

    if (summary.highest) {
      doc.text(
        'Highest Performer: ' +
        summary.highest.student.name
      );
    }

    doc.text(
      'Students Requiring Intervention: ' +
      summary.intervention.length
    );

    doc.moveDown(2);

    doc.font('Helvetica-Bold');

    doc.text(
      'Student Code',
      40,
      doc.y,
      {continued:true}
    );

    doc.text(
      'Name',
      130,
      doc.y,
      {continued:true}
    );

    doc.text(
      'Grade',
      300,
      doc.y,
      {continued:true}
    );

    doc.text(
      'Section',
      350,
      doc.y,
      {continued:true}
    );

    doc.text(
      'XP',
      450,
      doc.y,
      {continued:true}
    );

    doc.text(
      'Status',
      500
    );

    doc.moveDown();

    doc.font('Helvetica');



for (const row of rows) {

  const s = row.student;

  if (doc.y > 690) {
    doc.addPage();
  }

  doc
    .roundedRect(40, doc.y, 520, 110, 6)
    .stroke();

  const top = doc.y + 10;

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .text(
      s.name,
      55,
      top
    );

  doc
    .font('Helvetica')
    .fontSize(10);

  doc.text(
    `Student ID: ${s.studentCode}`,
    55
  );

  doc.text(
    `Grade ${s.gradeLevel} • ${s.section}`
  );

  doc.text(
    `XP: ${s.xp}`
  );

  doc.moveDown(0.3);

  doc.text(
    `Lessons Completed: ${row.completed}`
  );

  doc.text(
    `Completion Rate: ${row.completionPercent}%`
  );

  doc.text(
    `Average Quiz: ${row.averageQuiz}%`
  );

  doc.text(
    `Best Quiz: ${row.bestQuiz}%`
  );

  doc.text(
    `Pending Writing Reviews: ${row.writingPending}`
  );

  doc.text(
    `Speech Attempts: ${row.speechAttempts}`
  );

  let label = 'Needs Support';

  if (row.averageQuiz >= 90)
    label = 'Excellent';
  else if (row.averageQuiz >= 75)
    label = 'Good';
  else if (row.averageQuiz >= 60)
    label = 'Fair';

  doc.moveDown(0.2);

  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(
      `Performance Rating: ${label}`
    );

  //
  // Quiz Performance Bar
  //

  doc.moveDown(0.3);

  const quizWidth = Math.max(
    0,
    Math.min(100, row.averageQuiz)
  ) * 3;

  doc
    .rect(55, doc.y, 300, 10)
    .stroke();

  doc
    .rect(55, doc.y, quizWidth, 10)
    .fillAndStroke('#4F46E5', '#4F46E5');

  doc.moveDown();

  doc
    .fillColor('black')
    .font('Helvetica')
    .text(
      `Quiz Performance: ${row.averageQuiz}%`
    );

  //
  // Completion Bar
  //

  const completionWidth = Math.max(
    0,
    Math.min(100, row.completionPercent)
  ) * 3;

  doc
    .rect(55, doc.y, 300, 10)
    .stroke();

  doc
    .rect(55, doc.y, completionWidth, 10)
    .fillAndStroke('#22C55E', '#22C55E');

  doc.moveDown();

  doc
    .fillColor('black')
    .text(
      `Lesson Completion: ${row.completionPercent}%`
    );

  doc.moveDown(2);

}

doc.addPage();

doc
  .font('Helvetica-Bold')
  .fontSize(18)
  .text('CLASS PERFORMANCE SUMMARY');

doc.moveDown();

doc.font('Helvetica');

doc.text('Total Students: ' + summary.students);
doc.text('Average Quiz Score: ' + summary.averageQuiz + '%');
doc.text('Average Lesson Completion: ' + summary.averageCompletion + '%');
doc.text('Average XP Earned: ' + summary.averageXp);

doc.moveDown();

doc
  .font('Helvetica-Bold')
  .fontSize(14)
  .text('TOP PERFORMER');

doc.font('Helvetica');

if(summary.highest){
  doc.text(
    summary.highest.student.name
  );

  doc.text(
    'Quiz Average: ' +
    summary.highest.averageQuiz +
    '%'
  );

  doc.text(
    'Completion: ' +
    summary.highest.completionPercent +
    '%'
  );

  doc.text(
    'XP: ' +
    summary.highest.student.xp
  );
}

doc.moveDown();

doc
  .font('Helvetica-Bold')
  .fontSize(14)
  .text('STUDENTS NEEDING INTERVENTION');

doc.font('Helvetica');

if(summary.intervention.length===0){

  doc.text('No students currently require intervention.');

}else{

  for(const row of summary.intervention){

    doc.text(
      '• ' +
      row.student.name +
      ' — Quiz: ' +
      row.averageQuiz +
      '% | Completion: ' +
      row.completionPercent +
      '%'
    );

  }

}

//
// OVERALL REMARKS
//

doc.addPage();

doc
  .font('Helvetica-Bold')
  .fontSize(18)
  .text('OVERALL CLASS REMARKS');

doc.moveDown();

doc.font('Helvetica');

let remarks = 'Needs Improvement';

if (summary.averageQuiz >= 90) {
  remarks = 'Outstanding class performance. Students consistently demonstrate mastery of lessons.';
} else if (summary.averageQuiz >= 80) {
  remarks = 'Very satisfactory class performance. Continue reinforcing higher-order learning activities.';
} else if (summary.averageQuiz >= 75) {
  remarks = 'Satisfactory performance. Additional practice is recommended for some learners.';
} else {
  remarks = 'Intervention is recommended. Provide remediation and individualized support to improve learning outcomes.';
}

doc.text(remarks);

doc.moveDown(2);

doc.text('Prepared by:');

doc.moveDown(2);

doc.text('__________________________________');

doc.text(
  req.role === 'admin'
    ? 'System Administrator'
    : 'Teacher'
);

//
// FOOTER
//

const pages = doc.bufferedPageRange();

for (let i = 0; i < pages.count; i++) {

  doc.switchToPage(i);

  doc.fontSize(8);

  doc.text(
    'Tuklas Talino Learning Analytics Report',
    40,
    805
  );

  doc.text(
    'Page ' + (i + 1) + ' of ' + pages.count,
    470,
    805
  );

}

doc.end();


  } catch(err){
    next(err);
  }
});


router.get('/summary.txt', async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req);
    const where = assignedStudentWhere(assignments);

    const [students, active, xp, lessons, completions] = await Promise.all([
      Student.count({ where }),
      Student.count({ where: { ...where, status: 'active' } }),
      Student.sum('xp', { where }),
      Lesson.count({ where: { status: 'published' } }),
      CompletedLesson.count({
        where: assignments === null
          ? {}
          : { studentId: (await Student.findAll({ where, attributes: ['id'] })).map(student => student.id) }
      })
    ]);
    const assignmentsCount = await TeacherAssignment.count();
    const averageProgress = students && lessons
      ? Math.round((completions / (students * lessons)) * 100)
      : 0;

    const lines = [
      'Tuklas Talino Summary Report',
      `Generated At: ${new Date().toISOString()}`,
      `Total Students: ${students}`,
      `Active Students: ${active}`,
      `Total XP: ${xp || 0}`,
      `Total Lessons: ${lessons}`,
      `Lesson Completions: ${completions}`,
      `Average Progress: ${averageProgress}%`
    ];

    if (req.role === 'admin') {
      lines.push(
        `Total Users: ${await User.count()}`,
        `Teachers: ${await Teacher.count()}`,
        `Teacher Assignments: ${assignmentsCount}`,
        `Archived Accounts: ${await User.count({ where: { status: 'archived' } })}`
      );
    }

    res.header('Content-Type', 'text/plain');
    res.attachment('tuklas-talino-summary-report.txt');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

export default router;
