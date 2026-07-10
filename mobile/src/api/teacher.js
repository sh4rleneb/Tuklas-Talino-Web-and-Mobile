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


function normalizeTeacherApiDate(value = '') {
  return String(value || '').trim();
}

function validateGroupTaskCalendarDate(body = {}) {
  const rawDate = normalizeTeacherApiDate(
    body.dueDate ?? body.deadline ?? body.dueAt ?? body.scheduledAt ?? ''
  );

  if (!rawDate) {
    throw new Error('Pumili ng date at oras bago gumawa ng group task.');
  }

  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Hindi valid ang deadline ng group task. Pumili muli ng date at oras.');
  }

  const now = new Date();

  if (parsedDate.getTime() <= now.getTime()) {
    throw new Error('Hindi maaaring nasa nakaraan ang deadline ng group task.');
  }

  return parsedDate.toISOString();
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

export async function createStudentAccount(body) {
  return api('/students', { method: 'POST', body });
}

export async function getActiveStudents() {
  return api('/students?status=active');
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
