import PDFDocument from 'pdfkit';
import { PERMISSIONS } from '../constants/permissions.js';
import { Router } from 'express';
import { Op } from 'sequelize';
import {
  authenticate,
  requireAnyPermission,
  requireRole
} from '../middleware/auth.js';
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
router.use(
  authenticate,
  requireAnyPermission(
    PERMISSIONS.REPORTS_ALL_VIEW,
    PERMISSIONS.REPORTS_ASSIGNED_VIEW
  )
);


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
    res.attachment(req.role === 'admin' ? 'tuklas-talino-admin-student-report.csv' : 'tuklas-talino-teacher-monitoring-report.csv');
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
    res.attachment('tuklas-talino-admin-audit-trail-report.csv');
    res.send(lines.join('\n'));
  } catch (err) { next(err); }
});

router.get('/audit-trail.pdf', requireRole('admin'), async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 1000
    });

    const totalEvents = logs.length;

    const actionCounts = logs.reduce((acc, log) => {
      const action = String(log.action || 'unknown');
      acc[action] = (acc[action] || 0) + 1;
      return acc;
    }, {});

    const entityCounts = logs.reduce((acc, log) => {
      const entity = String(log.entityType || 'system');
      acc[entity] = (acc[entity] || 0) + 1;
      return acc;
    }, {});

    const topActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topEntities = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const recentLogs = logs.slice(0, 8);

    const doc = new PDFDocument({
      margin: 30,
      size: 'A4',
      layout: 'landscape',
      bufferPages: false
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tuklas-talino-admin-audit-trail-report.pdf"'
    );

    doc.pipe(res);

    const left = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    function clean(value, max = 42) {
      const output = String(value ?? '')
        .replace(/\s+/g, ' ')
        .trim();

      return output.length > max ? output.slice(0, max - 1) + '…' : output;
    }

    function metadataSummary(metadata) {
      if (!metadata) return '';

      try {
        const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

        return Object.entries(parsed)
          .slice(0, 2)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('; ');
      } catch {
        return String(metadata);
      }
    }

    function drawCell(value, x, y, w, h, options = {}) {
      doc
        .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(options.size || 7)
        .fillColor(options.color || '#111827')
        .text(clean(value, options.max || 40), x + 4, y + 4, {
          width: w - 8,
          height: h - 8,
          align: options.align || 'left',
          ellipsis: true,
          lineBreak: false
        });
    }

    function drawTable(x, y, columns, rows, options = {}) {
      const headerHeight = options.headerHeight || 18;
      const rowHeight = options.rowHeight || 18;

      if (options.title) {
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#111827')
          .text(options.title, x, y, {
            width: columns.reduce((sum, col) => sum + col.width, 0),
            lineBreak: false
          });

        y += 14;
      }

      let colX = x;

      for (const col of columns) {
        doc
          .rect(colX, y, col.width, headerHeight)
          .fillAndStroke('#F3F4F6', '#111827');

        drawCell(col.label, colX, y, col.width, headerHeight, {
          bold: true,
          size: options.headerSize || 6.8,
          align: col.align,
          max: col.max || 32
        });

        colX += col.width;
      }

      y += headerHeight;

      for (const row of rows) {
        colX = x;

        for (let i = 0; i < columns.length; i += 1) {
          const col = columns[i];

          doc
            .rect(colX, y, col.width, rowHeight)
            .fillAndStroke('#FFFFFF', '#111827');

          drawCell(row[i], colX, y, col.width, rowHeight, {
            size: options.bodySize || 6.8,
            align: col.align,
            max: col.max || 36
          });

          colX += col.width;
        }

        y += rowHeight;
      }

      return y + 8;
    }

    function drawMetric(label, value, x, y, w) {
      doc
        .rect(x, y, w, 42)
        .fillAndStroke('#FFFFFF', '#111827');

      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor('#64748B')
        .text(label, x + 6, y + 7, {
          width: w - 12,
          align: 'center',
          lineBreak: false
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#111827')
        .text(clean(value, 18), x + 6, y + 22, {
          width: w - 12,
          align: 'center',
          lineBreak: false
        });
    }

    function pct(count) {
      return totalEvents ? Math.round((Number(count || 0) * 100) / totalEvents) + '%' : '0%';
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#111827')
      .text('TUKLAS TALINO', left, 26, {
        width: pageWidth,
        align: 'center',
        lineBreak: false
      });

    doc
      .fontSize(13)
      .text('ADMIN AUDIT TRAIL REPORT', left, 46, {
        width: pageWidth,
        align: 'center',
        lineBreak: false
      });

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#374151')
      .text(`Generated By: System Administrator    Date Generated: ${new Date().toLocaleString()}`, left, 66, {
        width: pageWidth,
        align: 'center',
        lineBreak: false
      });

    const metricY = 92;
    const metricW = pageWidth / 5;

    drawMetric('TOTAL AUDIT EVENTS', totalEvents, left, metricY, metricW);
    drawMetric('ACTION TYPES', Object.keys(actionCounts).length, left + metricW, metricY, metricW);
    drawMetric('ENTITY TYPES', Object.keys(entityCounts).length, left + metricW * 2, metricY, metricW);
    drawMetric('LATEST EVENT', logs[0]?.createdAt ? new Date(logs[0].createdAt).toLocaleDateString() : 'No logs', left + metricW * 3, metricY, metricW);
    drawMetric('REPORT SCOPE', 'Admin Audit', left + metricW * 4, metricY, metricW);

    let y = 154;

    y = drawTable(
      left,
      y,
      [
        { label: 'ACTION', width: 205, max: 28 },
        { label: 'COUNT', width: 55, align: 'center' },
        { label: '%', width: 55, align: 'center' },
        { label: 'ENTITY / TARGET', width: 205, max: 28 },
        { label: 'COUNT', width: 55, align: 'center' },
        { label: '%', width: 55, align: 'center' }
      ],
      Array.from({ length: 5 }).map((_, index) => {
        const action = topActions[index] || ['—', 0];
        const entity = topEntities[index] || ['—', 0];

        return [
          action[0],
          action[1],
          pct(action[1]),
          entity[0],
          entity[1],
          pct(entity[1])
        ];
      }),
      {
        title: 'AUDIT SUMMARY DISTRIBUTION',
        rowHeight: 20,
        bodySize: 7,
        headerSize: 6.8
      }
    );

    drawTable(
      left,
      y + 4,
      [
        { label: 'DATE / TIME', width: 118, max: 25 },
        { label: 'ACTOR', width: 58, align: 'center', max: 12 },
        { label: 'ACTION', width: 135, max: 25 },
        { label: 'ENTITY', width: 82, max: 18 },
        { label: 'ID', width: 45, align: 'center', max: 10 },
        { label: 'DETAILS / METADATA', width: 344, max: 72 }
      ],
      recentLogs.map((log) => [
        log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
        log.actorUserId || 'System',
        log.action || '',
        log.entityType || '',
        log.entityId || '',
        metadataSummary(log.metadata)
      ]),
      {
        title: 'RECENT AUDIT TRAIL ENTRIES',
        rowHeight: 18,
        bodySize: 6.3,
        headerSize: 6.5
      }
    );

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#6B7280')
      .text(
        'Note: This one-page PDF shows a concise audit trail summary. Download the CSV audit trail report for the complete activity log.',
        left,
        548,
        {
          width: pageWidth - 110,
          lineBreak: false
        }
      );

    doc.text('Page 1 of 1', left + pageWidth - 90, 548, {
      width: 90,
      align: 'right',
      lineBreak: false
    });

    doc.end();
  } catch (err) {
    next(err);
  }
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
        ? 'tuklas-talino-admin-audit-trail-report.csv'
        : 'tuklas-talino-teacher-monitoring-report.csv'
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

    const generatedAt = new Date();
    const teacherName =
      req.role === 'admin'
        ? 'System Administrator'
        : (req.teacher?.name || req.user?.name || 'Teacher');

    const fileName =
      req.role === 'admin'
        ? 'tuklas-talino-admin-monitoring-summary-report.pdf'
        : 'tuklas-talino-teacher-monitoring-summary-report.pdf';

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

    function pct(count, total) {
      return total ? Math.round((count * 100) / total) : 0;
    }

    function performanceStatus(row) {
      if (Number(row.completionPercent || 0) < 60) return 'Missing Activities';
      if (Number(row.averageQuiz || 0) >= 90) return 'Outstanding';
      if (Number(row.averageQuiz || 0) >= 75) return 'Good Standing';
      if (Number(row.averageQuiz || 0) >= 60) return 'Needs Improvement';
      return 'Needs Support';
    }

    function performanceRemark(row) {
      const status = performanceStatus(row);

      if (status === 'Outstanding') return 'Excellent performance';
      if (status === 'Good Standing') return 'Continue progress';
      if (status === 'Needs Improvement') return 'Needs guided practice';
      if (status === 'Missing Activities') return 'Follow up missing work';
      return 'Needs intervention';
    }

    const distribution = [
      {
        label: 'Outstanding',
        short: 'Outstanding',
        count: rows.filter(row => performanceStatus(row) === 'Outstanding').length
      },
      {
        label: 'Good Standing',
        short: 'Good',
        count: rows.filter(row => performanceStatus(row) === 'Good Standing').length
      },
      {
        label: 'Needs Improvement',
        short: 'Improve',
        count: rows.filter(row => performanceStatus(row) === 'Needs Improvement').length
      },
      {
        label: 'Missing Activities',
        short: 'Missing',
        count: rows.filter(row => performanceStatus(row) === 'Missing Activities').length
      },
      {
        label: 'Needs Support',
        short: 'Support',
        count: rows.filter(row => performanceStatus(row) === 'Needs Support').length
      }
    ];

    const passingCount = rows.filter(row => Number(row.averageQuiz || 0) >= 75).length;

    const doc = new PDFDocument({
      margin: 32,
      size: 'A4',
      layout: 'landscape',
      bufferPages: true
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    doc.pipe(res);

    const left = () => doc.page.margins.left;
    const right = () => doc.page.width - doc.page.margins.right;
    const bottom = () => doc.page.height - doc.page.margins.bottom;
    const contentWidth = () => right() - left();

    function ensureSpace(height = 80) {
      if (doc.y + height > bottom()) {
        doc.addPage();
      }
    }

    function cellText(value, x, y, w, h, options = {}) {
      doc
        .font(options.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(options.size || 8)
        .fillColor(options.color || '#111827')
        .text(String(value ?? ''), x + 4, y + 4, {
          width: Math.max(8, w - 8),
          height: Math.max(8, h - 8),
          align: options.align || 'left',
          ellipsis: true
        });
    }

    function drawTable(x, y, columns, tableRows, options = {}) {
      const headerHeight = options.headerHeight || 22;
      const rowHeight = options.rowHeight || 22;
      const title = options.title;
      const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

      if (title) {
        ensureSpace(28);
        doc
          .font('Helvetica-Bold')
          .fontSize(options.titleSize || 11)
          .fillColor('#111827')
          .text(title, x, y, {
            width: totalWidth
          });

        y += 18;
      }

      ensureSpace(headerHeight + rowHeight);

      let colX = x;

      for (const col of columns) {
        doc
          .rect(colX, y, col.width, headerHeight)
          .fillAndStroke('#F3F4F6', '#111827');

        cellText(col.label, colX, y, col.width, headerHeight, {
          bold: true,
          size: options.headerSize || 8,
          align: col.align || 'left'
        });

        colX += col.width;
      }

      y += headerHeight;

      for (const row of tableRows) {
        if (y + rowHeight > bottom()) {
          doc.addPage();
          y = doc.y;

          colX = x;
          for (const col of columns) {
            doc
              .rect(colX, y, col.width, headerHeight)
              .fillAndStroke('#F3F4F6', '#111827');

            cellText(col.label, colX, y, col.width, headerHeight, {
              bold: true,
              size: options.headerSize || 8,
              align: col.align || 'left'
            });

            colX += col.width;
          }

          y += headerHeight;
        }

        colX = x;

        for (let i = 0; i < columns.length; i += 1) {
          const col = columns[i];

          doc
            .rect(colX, y, col.width, rowHeight)
            .fillAndStroke('#FFFFFF', '#111827');

          cellText(row[i], colX, y, col.width, rowHeight, {
            size: options.bodySize || 8,
            align: col.align || 'left'
          });

          colX += col.width;
        }

        y += rowHeight;
      }

      doc.fillColor('#111827');
      return y + 8;
    }

    function drawHeader() {
      const x = left();
      const w = contentWidth();
      let y = 28;

      doc.rect(x, y, w, 70).strokeColor('#111827').lineWidth(1).stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor('#111827')
        .text('TUKLAS TALINO', x, y + 8, {
          width: w,
          align: 'center'
        });

      doc
        .fontSize(13)
        .text('STUDENT MONITORING SUMMARY REPORT', x, y + 28, {
          width: w,
          align: 'center'
        });

      doc
        .font('Helvetica')
        .fontSize(9)
        .text(
          `${req.role === 'admin' ? 'Administrator' : 'Teacher'}: ${teacherName}    Date Generated: ${generatedAt.toLocaleString()}`,
          x,
          y + 50,
          {
            width: w,
            align: 'center'
          }
        );

      doc.y = y + 84;
    }

    function drawVerticalBarChart(title, data, x, y, w, h, color = '#4F81BD') {
      doc.rect(x, y, w, h).strokeColor('#9CA3AF').lineWidth(1).stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor('#111827')
        .text(title, x, y + 14, {
          width: w,
          align: 'center'
        });

      const max = Math.max(1, ...data.map(item => Number(item.count || 0)));
      const chartLeft = x + 52;
      const chartRight = x + w - 32;
      const chartTop = y + 58;
      const chartBottom = y + h - 42;
      const chartHeight = chartBottom - chartTop;
      const slot = (chartRight - chartLeft) / Math.max(1, data.length);
      const barWidth = Math.min(42, slot * 0.48);

      doc
        .strokeColor('#D1D5DB')
        .lineWidth(0.8);

      for (let i = 0; i <= 4; i += 1) {
        const gridY = chartBottom - (chartHeight * i / 4);
        doc.moveTo(chartLeft - 10, gridY).lineTo(chartRight, gridY).stroke();

        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#374151')
          .text(String(Math.round(max * i / 4)), x + 10, gridY - 4, {
            width: 32,
            align: 'right'
          });
      }

      data.forEach((item, index) => {
        const value = Number(item.count || 0);
        const barHeight = Math.round((value / max) * chartHeight);
        const barX = chartLeft + (slot * index) + ((slot - barWidth) / 2);
        const barY = chartBottom - barHeight;

        doc.rect(barX, barY, barWidth, barHeight).fillColor(color).fill();
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor('#111827')
          .text(String(value), barX, barY - 12, {
            width: barWidth,
            align: 'center'
          });

        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#111827')
          .text(item.short || item.label, barX - 14, chartBottom + 6, {
            width: barWidth + 28,
            align: 'center'
          });
      });

      doc.fillColor('#111827');
      return y + h + 14;
    }

    drawHeader();

    let y = doc.y;

    y = drawTable(
      left(),
      y,
      [
        { label: 'TOTAL STUDENTS', width: 110, align: 'center' },
        { label: 'AVG QUIZ %', width: 100, align: 'center' },
        { label: 'AVG PROGRESS %', width: 120, align: 'center' },
        { label: 'AVG XP', width: 80, align: 'center' },
        { label: 'TOTAL PASS', width: 100, align: 'center' },
        { label: 'NEEDS SUPPORT', width: 120, align: 'center' },
        { label: 'PENDING REVIEWS', width: 130, align: 'center' }
      ],
      [
        [
          summary.students,
          summary.averageQuiz + '%',
          summary.averageCompletion + '%',
          summary.averageXp,
          passingCount + ' / ' + pct(passingCount, summary.students) + '%',
          summary.intervention.length,
          totals.pendingWriting
        ]
      ],
      {
        rowHeight: 28,
        bodySize: 10,
        headerSize: 8
      }
    );

    const leftTableWidth = 260;

    drawTable(
      left(),
      y + 10,
      [
        { label: 'PERFORMANCE', width: 145 },
        { label: 'No', width: 50, align: 'center' },
        { label: '%', width: 50, align: 'center' }
      ],
      distribution.map(item => [
        item.label,
        item.count,
        pct(item.count, summary.students) + '%'
      ]).concat([
        ['Total', summary.students, '100%']
      ]),
      {
        title: 'PERFORMANCE DISTRIBUTION',
        rowHeight: 24,
        bodySize: 8
      }
    );

    const chartX = left() + leftTableWidth + 40;
    drawVerticalBarChart(
      'No of students',
      distribution,
      chartX,
      y,
      right() - chartX,
      205,
      '#4F81BD'
    );

    doc.y = y + 232;

    const classTableRows = classRows.slice(0, 8).map(item => {
      const averageQuiz = item.students
        ? Math.round(item.quizTotal / item.students)
        : 0;

      const averageCompletion = item.students
        ? Math.round(item.completionTotal / item.students)
        : 0;

      return [
        item.label,
        item.students,
        averageQuiz + '%',
        averageCompletion + '%',
        item.xp,
        item.pendingWriting
      ];
    });

    y = doc.y;

    drawTable(
      left(),
      y,
      [
        { label: 'CLASS / SECTION', width: 170 },
        { label: 'Students', width: 70, align: 'center' },
        { label: 'Avg Quiz', width: 70, align: 'center' },
        { label: 'Progress', width: 70, align: 'center' },
        { label: 'XP', width: 60, align: 'center' },
        { label: 'Pending', width: 70, align: 'center' }
      ],
      classTableRows.length ? classTableRows : [['No class data', 0, '0%', '0%', 0, 0]],
      {
        title: 'CLASS SUMMARY',
        rowHeight: 22
      }
    );

    if (classRows.length) {
      const classChartData = classRows.slice(0, 6).map(item => ({
        label: item.label,
        short: item.label.replace('Grade ', 'G').replace(' - ', '-'),
        count: item.students
      }));

      drawVerticalBarChart(
        'Class count',
        classChartData,
        chartX,
        y,
        right() - chartX,
        190,
        '#C0504D'
      );
    }

    doc.addPage();
    drawHeader();

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#111827')
      .text('STUDENT MONITORING TABLE', left(), doc.y, {
        width: contentWidth()
      });

    doc.moveDown(0.5);

    drawTable(
      left(),
      doc.y,
      [
        { label: 'Student Name', width: 130 },
        { label: 'Student ID / LRN', width: 86 },
        { label: 'Grade / Section', width: 80 },
        { label: 'XP', width: 42, align: 'center' },
        { label: 'Lessons', width: 58, align: 'center' },
        { label: 'Quiz %', width: 50, align: 'center' },
        { label: 'Best %', width: 50, align: 'center' },
        { label: 'Progress', width: 60, align: 'center' },
        { label: 'Status', width: 100 },
        { label: 'Remarks', width: 116 }
      ],
      rows.map(row => {
        const s = row.student;

        return [
          s.name || 'Unnamed Student',
          s.studentCode || s.lrn || s.id || '—',
          `G${s.gradeLevel || '—'} - ${s.section || 'N/A'}`,
          s.xp || 0,
          `${row.completed || 0}/${row.lessonCount || 0}`,
          (row.averageQuiz || 0) + '%',
          (row.bestQuiz || 0) + '%',
          (row.completionPercent || 0) + '%',
          performanceStatus(row),
          performanceRemark(row)
        ];
      }),
      {
        rowHeight: 24,
        bodySize: 7.2,
        headerSize: 7.4
      }
    );

    ensureSpace(110);

    doc.moveDown(1);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#111827')
      .text('OVERALL REMARKS', left(), doc.y, {
        width: contentWidth()
      });

    doc.moveDown(0.35);

    let remarks = 'Intervention is recommended. Provide remediation, guided practice, and follow-up for students with low scores or incomplete activities.';

    if (summary.averageQuiz >= 90) {
      remarks = 'Outstanding overall performance. Students are showing strong mastery of lessons.';
    } else if (summary.averageQuiz >= 80) {
      remarks = 'Very satisfactory performance. Continue enrichment and maintain regular monitoring.';
    } else if (summary.averageQuiz >= 75) {
      remarks = 'Satisfactory performance. Continue monitoring students who need additional practice.';
    }

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#374151')
      .text(remarks, left(), doc.y, {
        width: contentWidth(),
        lineGap: 3
      });

    doc.moveDown(1.4);

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#111827')
      .text('Prepared by:', left(), doc.y);

    doc.moveDown(1.2);

    doc
      .font('Helvetica')
      .fontSize(9)
      .text('__________________________________');

    doc.text(
      req.role === 'admin'
        ? 'System Administrator'
        : 'Teacher'
    );

    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);

      const footerY = doc.page.height - doc.page.margins.bottom - 12;

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor('#6B7280');

      doc.text(
        'Tuklas Talino Student Monitoring Summary Report',
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

      doc.fillColor('#111827');
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
