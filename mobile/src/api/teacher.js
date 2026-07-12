import { api, apiText, apiBinary } from './client';

export async function getTeacherDashboard() {
  return api('/teachers/dashboard');
}

export async function getTeacherMonitoringStats() {
  return api('/teachers/monitoring/stats');
}

export async function getTeacherQuizPerformance() {
  return api('/teachers/quiz-performance');
}

export async function getTeacherReviews() {
  return api('/teachers/reviews/writing-speech');
}

export async function gradeWritingSubmission(submissionId, body) {
  return api(`/teachers/reviews/writing/${submissionId}`, {
    method: 'PATCH',
    body,
  });
}

export async function reviewSpeechAttempt(attemptId, body) {
  return api(`/teachers/reviews/speech/${attemptId}`, {
    method: 'PATCH',
    body,
  });
}

export async function getPendingGroupChecks() {
  return api('/groups/task-completions/pending');
}

export async function approveGroupTask(taskId, studentId, teacherFeedback = '') {
  return api(`/groups/tasks/${taskId}/completions/${studentId}/approve`, {
    method: 'POST',
    body: { teacherFeedback },
  });
}

export async function returnGroupTask(taskId, studentId, teacherFeedback = '') {
  return api(`/groups/tasks/${taskId}/completions/${studentId}/return`, {
    method: 'POST',
    body: { teacherFeedback },
  });
}

export async function getTeacherGroups() {
  return api('/groups');
}

export async function createGroup(body) {
  return api('/groups', { method: 'POST', body });
}


const GROUP_TASK_MINIMUM_DEADLINE_MS =
  60 * 60 * 1000;

const GROUP_TASK_ISO_TIMEZONE_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

function normalizeTeacherApiDate(value = '') {
  return String(value || '').trim();
}

function validateGroupTaskCalendarDate(
  body = {}
) {
  const rawDate = normalizeTeacherApiDate(
    body.dueAt ??
    body.deadline ??
    body.dueDate ??
    body.scheduledAt ??
    ''
  );

  if (!rawDate) {
    throw new Error(
      'Select a deadline date and time ' +
      'before adding the task.'
    );
  }

  if (
    !GROUP_TASK_ISO_TIMEZONE_PATTERN.test(
      rawDate
    )
  ) {
    throw new Error(
      'Deadline must include a valid date, ' +
      'time, and timezone.'
    );
  }

  const deadlineMs = Date.parse(rawDate);

  if (!Number.isFinite(deadlineMs)) {
    throw new Error(
      'Select a valid deadline date and time.'
    );
  }

  if (
    deadlineMs <
    Date.now() +
      GROUP_TASK_MINIMUM_DEADLINE_MS
  ) {
    throw new Error(
      'Deadline must be at least one hour ' +
      'from the current time.'
    );
  }

  return new Date(deadlineMs).toISOString();
}

export async function addGroupTask(groupId, body = {}) {
  const payload = { ...(body || {}) };
  const validCalendarDate = validateGroupTaskCalendarDate(payload);

  if ('dueDate' in payload || !('deadline' in payload) && !('dueAt' in payload)) {
    payload.dueDate = validCalendarDate;
  }

  if ('deadline' in payload) payload.deadline = validCalendarDate;
  if ('dueAt' in payload) payload.dueAt = validCalendarDate;

  return api(`/groups/${groupId}/tasks`, { method: 'POST', body: payload });
}

export async function addGroupMember(groupId, studentId) {
  return api(`/groups/${groupId}/members`, {
    method: 'POST',
    body: { studentId },
  });
}

export async function addGroupMembers(groupId, studentIds = []) {
  return api(`/groups/${groupId}/members/bulk`, {
    method: 'POST',
    body: { studentIds },
  });
}

export async function setGroupLeader(groupId, studentId) {
  return api(`/groups/${groupId}/members/${studentId}/leader`, {
    method: 'POST',
    body: {},
  });
}

export async function removeGroupMember(groupId, studentId) {
  return api(`/groups/${groupId}/members/${studentId}`, {
    method: 'DELETE',
  });
}

export async function deleteGroup(groupId) {
  return api(`/groups/${groupId}`, {
    method: 'DELETE',
  });
}


export async function getTeacherLessons() {
  return api('/lessons/mine');
}


export async function getActiveStudents(query = '') {
  const search = String(query || '').trim();
  const searchParameter = search
    ? `&q=${encodeURIComponent(search)}`
    : '';

  return api(
    `/students?status=active${searchParameter}`
  );
}

export async function createTeacherSection(
  gradeLevel,
  section
) {
  return api('/students/teacher-sections', {
    method: 'POST',
    body: {
      gradeLevel,
      section,
    },
  });
}


export async function updateStudentSection(
  studentId,
  section
) {
  return api(`/students/${studentId}/section`, {
    method: 'PATCH',
    body: {
      section,
    },
  });
}


export async function createLesson(body) {
  return api('/lessons', { method: 'POST', body });
}

export async function updateLesson(lessonId, body) {
  return api(`/lessons/${lessonId}`, { method: 'PATCH', body });
}

export async function archiveLesson(lessonId) {
  return api(`/lessons/${lessonId}`, { method: 'DELETE' });
}

function lessonMaterialUploadErrorText(error = {}) {
  return String(
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    ''
  ).trim();
}

async function uploadLessonMaterialWithField(fileFieldName, fileAsset = {}, uploadFile = {}) {
  const formData = new FormData();

  formData.append(fileFieldName, uploadFile);

  if (fileAsset.size) formData.append('size', String(fileAsset.size));
  formData.append('fileName', uploadFile.name);
  formData.append('fileType', uploadFile.type);

  return api('/lessons/materials/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadLessonMaterial(asset = {}) {
  const fileAsset = Array.isArray(asset?.assets) ? asset.assets[0] : asset;

  if (!fileAsset || !fileAsset.uri) {
    throw new Error('No lesson material file was selected.');
  }

  const rawName = fileAsset.name || fileAsset.fileName || fileAsset.uri.split('/').pop() || 'lesson-material.pdf';
  const lowerName = String(rawName).toLowerCase();

  const inferredType =
    fileAsset.mimeType ||
    fileAsset.type ||
    (lowerName.endsWith('.pdf')
      ? 'application/pdf'
      : lowerName.endsWith('.pptx')
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : lowerName.endsWith('.ppt')
      ? 'application/vnd.ms-powerpoint'
      : 'application/octet-stream');

  const uploadFile = {
    uri: fileAsset.uri,
    name: rawName,
    type: inferredType,
  };

  const fieldCandidates = ['file', 'material', 'lessonMaterial'];
  let lastError = null;

  for (const fieldName of fieldCandidates) {
    try {
      return await uploadLessonMaterialWithField(fieldName, fileAsset, uploadFile);
    } catch (error) {
      lastError = error;
      const message = lessonMaterialUploadErrorText(error).toLowerCase();

      if (!message.includes('unexpected field')) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Unable to upload lesson material.');
}

export async function uploadSpeechRecording(uri) {
  const body = new FormData();

  body.append('audio', {
    uri,
    name: 'speech-recording.m4a',
    type: 'audio/m4a',
  });

  return api('/lessons/speech/upload', {
    method: 'POST',
    body,
  });
}

export async function getReportSummary() {
  return api('/reports/summary');
}


export async function getStudentReport() {
  return api('/reports/students');
}

export async function getActivityLogs() {
  return api('/reports/activity-logs');
}


export async function getStudentReportCsv() {
  return apiText('/reports/students.csv');
}

export async function getActivityLogsCsv() {
  return apiText('/reports/activity-logs.csv');
}

export async function getSummaryReportCsv() {
  return apiText('/reports/summary.csv');
}

export async function getSummaryReportPdf() {
  return apiBinary('/reports/summary.pdf');
}
