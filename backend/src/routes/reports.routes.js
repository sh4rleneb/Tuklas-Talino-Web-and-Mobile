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
        ? 'administrator-summary-report.csv'
        : 'teacher-summary-report.csv'
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
    const rows = await loadStudentPerformance(where);
    const summary = buildPerformanceSummary(rows);

    const reportTitle =
      req.role === 'admin'
        ? 'Administrator Summary Report'
        : 'Teacher Summary Report';

    const reportSubtitle =
      req.role === 'admin'
        ? 'System-wide learning analytics and student performance overview'
        : 'Assigned classes, handled students, progress, and review needs';

    const fileName =
      req.role === 'admin'
        ? 'administrator-summary-report.pdf'
        : 'teacher-summary-report.pdf';

    const classMap = new Map();

    for (const row of rows) {
      const key = `Grade ${row.student.gradeLevel} - ${row.student.section || 'N/A'}`;

      if (!classMap.has(key)) {
        classMap.set(key, {
          label: key,
          students: 0,
          xp: 0,
          quizTotal: 0,
          completionTotal: 0,
          pendingWriting: 0,
          speechAttempts: 0
        });
      }

      const item = classMap.get(key);
      item.students += 1;
      item.xp += Number(row.student.xp || 0);
      item.quizTotal += Number(row.averageQuiz || 0);
      item.completionTotal += Number(row.completionPercent || 0);
      item.pendingWriting += Number(row.writingPending || 0);
      item.speechAttempts += Number(row.speechAttempts || 0);
    }

    const classRows = Array.from(classMap.values())
      .sort((a, b) => a.label.localeCompare(b.label));

    const totals = rows.reduce(
      (acc, row) => ({
        pendingWriting: acc.pendingWriting + Number(row.writingPending || 0),
        speechAttempts: acc.speechAttempts + Number(row.speechAttempts || 0)
      }),
      {
        pendingWriting: 0,
        speechAttempts: 0
      }
    );

    const doc = new PDFDocument({
      margin: 44,
      size: 'A4',
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    doc.pipe(res);

    const pageBottom = () =>
      doc.page.height - doc.page.margins.bottom;

    const contentWidth = () =>
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    function ensureSpace(height = 80) {
      if (doc.y + height > pageBottom()) {
        doc.addPage();
      }
    }

    function section(title) {
      ensureSpace(48);

      doc
        .moveDown(0.7)
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#0F172A')
        .text(title, {
          width: contentWidth()
        });

      doc
        .moveTo(doc.page.margins.left, doc.y + 4)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 4)
        .strokeColor('#CBD5E1')
        .lineWidth(1)
        .stroke();

      doc
        .moveDown(0.8)
        .fillColor('black');
    }

    function metric(label, value) {
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#334155')
        .text(`${label}: `, {
          continued: true
        });

      doc
        .font('Helvetica')
        .fillColor('#0F172A')
        .text(String(value ?? '-'));

      doc.fillColor('black');
    }

    function paragraph(value) {
      ensureSpace(42);

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(String(value || ''), {
          width: contentWidth(),
          lineGap: 3
        });

      doc.fillColor('black');
    }

    function studentBlock(row) {
      ensureSpace(112);

      const s = row.student;
      const status =
        row.averageQuiz >= 90
          ? 'Excellent'
          : row.averageQuiz >= 75
            ? 'Good'
            : row.averageQuiz >= 60
              ? 'Fair'
              : 'Needs Support';

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0F172A')
        .text(s.name || 'Unnamed Student', {
          width: contentWidth()
        });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#475569')
        .text(
          `${s.studentCode || 'No ID'} | Grade ${s.gradeLevel} - ${s.section || 'N/A'} | ${s.status || 'active'}`,
          {
            width: contentWidth()
          }
        );

      doc.moveDown(0.25);

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#334155')
        .text(
          `XP: ${s.xp || 0} | Lessons Completed: ${row.completed || 0} | Completion: ${row.completionPercent || 0}% | Average Quiz: ${row.averageQuiz || 0}% | Best Quiz: ${row.bestQuiz || 0}%`,
          {
            width: contentWidth(),
            lineGap: 2
          }
        );

      doc.text(
        `Pending Writing Reviews: ${row.writingPending || 0} | Speech Attempts: ${row.speechAttempts || 0} | Performance Rating: ${status}`,
        {
          width: contentWidth(),
          lineGap: 2
        }
      );

      doc
        .moveDown(0.45)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#E2E8F0')
        .lineWidth(0.8)
        .stroke();

      doc
        .moveDown(0.6)
        .fillColor('black');
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#0F172A')
      .text('TUKLAS TALINO', {
        align: 'center',
        width: contentWidth()
      });

    doc
      .moveDown(0.25)
      .fontSize(16)
      .text(reportTitle, {
        align: 'center',
        width: contentWidth()
      });

    doc
      .moveDown(0.25)
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#475569')
      .text(reportSubtitle, {
        align: 'center',
        width: contentWidth()
      });

    doc
      .moveDown(1)
      .fillColor('black');

    section('Report Overview');

    metric('Generated', new Date().toLocaleString());
    metric('Students Included', summary.students);
    metric('Average Quiz Score', `${summary.averageQuiz}%`);
    metric('Average Lesson Completion', `${summary.averageCompletion}%`);
    metric('Average XP Earned', summary.averageXp);
    metric('Pending Writing Reviews', totals.pendingWriting);
    metric('Speech Attempts', totals.speechAttempts);

    if (summary.highest) {
      metric('Top Performer', summary.highest.student.name);
    }

    metric('Students Requiring Intervention', summary.intervention.length);

    if (req.role !== 'admin') {
      section('Assigned Classes');

      if (!classRows.length) {
        paragraph('No assigned class data is available for this teacher yet.');
      }

      for (const item of classRows) {
        const averageQuiz = item.students
          ? Math.round(item.quizTotal / item.students)
          : 0;

        const averageCompletion = item.students
          ? Math.round(item.completionTotal / item.students)
          : 0;

        ensureSpace(62);

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0F172A')
          .text(item.label);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(
            `Students: ${item.students} | Avg Quiz: ${averageQuiz}% | Avg Completion: ${averageCompletion}% | Pending Reviews: ${item.pendingWriting} | Speech Attempts: ${item.speechAttempts}`,
            {
              width: contentWidth(),
              lineGap: 2
            }
          );

        doc
          .moveDown(0.55)
          .fillColor('black');
      }
    }

    section(
      req.role === 'admin'
        ? 'System Student Performance'
        : 'Handled Student Performance'
    );

    if (!rows.length) {
      paragraph('No student performance data is available yet.');
    }

    for (const row of rows) {
      studentBlock(row);
    }

    section('Students Needing Intervention');

    if (!summary.intervention.length) {
      paragraph('No students currently require intervention based on the report thresholds.');
    } else {
      for (const row of summary.intervention) {
        ensureSpace(28);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#334155')
          .text(
            `- ${row.student.name} | Grade ${row.student.gradeLevel} - ${row.student.section || 'N/A'} | Quiz: ${row.averageQuiz}% | Completion: ${row.completionPercent}%`,
            {
              width: contentWidth(),
              lineGap: 2
            }
          );
      }

      doc.fillColor('black');
    }

    section('Overall Remarks');

    let remarks = 'Intervention is recommended. Provide remediation and individualized support to improve learning outcomes.';

    if (summary.averageQuiz >= 90) {
      remarks = 'Outstanding performance. Learners consistently demonstrate mastery of lessons.';
    } else if (summary.averageQuiz >= 80) {
      remarks = 'Very satisfactory performance. Continue reinforcing higher-order learning activities.';
    } else if (summary.averageQuiz >= 75) {
      remarks = 'Satisfactory performance. Additional practice is recommended for selected learners.';
    }

    paragraph(remarks);

    doc.moveDown(1.6);
    paragraph('Prepared by:');
    doc.moveDown(1.2);

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#0F172A')
      .text('__________________________________');

    doc.text(
      req.role === 'admin'
        ? 'System Administrator'
        : 'Teacher'
    );

    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);

      const footerY =
        doc.page.height -
        doc.page.margins.bottom -
        14;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#64748B');

      doc.text(
        'Tuklas Talino Learning Analytics Report',
        doc.page.margins.left,
        footerY,
        {
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            120,
          lineBreak: false
        }
      );

      doc.text(
        'Page ' + (i + 1) + ' of ' + pages.count,
        doc.page.width - doc.page.margins.right - 100,
        footerY,
        {
          width: 100,
          align: 'right',
          lineBreak: false
        }
      );

      doc.fillColor('black');
    }

    doc.end();
  } catch (err) {
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
