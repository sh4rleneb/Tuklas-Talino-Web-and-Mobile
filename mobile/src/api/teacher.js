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

export async function addGroupTask(groupId, body) {
  return api(`/groups/${groupId}/tasks`, { method: 'POST', body });
}

export async function addGroupMember(groupId, studentId) {
  return api(`/groups/${groupId}/members`, {
    method: 'POST',
    body: { studentId },
  });
}

export async function setGroupLeader(groupId, studentId) {
  return api(`/groups/${groupId}/members/${studentId}/leader`, {
    method: 'POST',
    body: {},
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

export async function createLesson(body) {
  return api('/lessons', { method: 'POST', body });
}

export async function updateLesson(lessonId, body) {
  return api(`/lessons/${lessonId}`, { method: 'PATCH', body });
}

export async function archiveLesson(lessonId) {
  return api(`/lessons/${lessonId}`, { method: 'DELETE' });
}

export async function uploadLessonMaterial(asset) {
  const body = new FormData();
  body.append('material', {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || 'application/octet-stream',
  });
  return api('/lessons/materials/upload', { method: 'POST', body });
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
