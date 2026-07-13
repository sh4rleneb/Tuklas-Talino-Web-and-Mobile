import {
  api,
  apiText,
  apiBinary,
} from './client';
import {
  clearAdminReauthProof,
  getAdminReauthHeaders,
} from './auth';

export async function getAdminStats() {
  return api('/admin/stats');
}

export async function getAdminEnrollments() {
  return api('/admin/enrollments');
}

export async function getAdminAuditLogs(limit = 20) {
  return api(`/admin/audit-logs?limit=${limit}`);
}

export async function getAdminAccounts() {
  return api('/admin/accounts');
}

export async function updateAccountStatus(userId, status, body = {}) { const payload = typeof body === 'string' ? { reason: body } : (body || {}); return api(`/admin/accounts/${userId}/status`, { method: 'PATCH', body: { status, ...payload }, }); }

export async function removeAccountLockdown(userId, body = {}) {
  return api(`/admin/accounts/${userId}/unlock`, {
    method: 'PATCH',
    body,
  });
}

export async function getActiveStudents() {
  return api('/students?status=active');
}

export async function getActiveTeachers() {
  return api('/teachers?status=active');
}

export async function getArchivedStudents() {
  return api('/students?status=archived');
}

export async function getArchivedTeachers() {
  return api('/teachers?status=archived');
}

export async function createStudentAccount(body) {
  try {
    return await api('/students', {
      method: 'POST',
      headers: getAdminReauthHeaders(),
      body,
    });
  } catch (error) {
    clearAdminReauthProof();
    throw error;
  }
}

export async function createTeacherAccount(body) {
  try {
    return await api('/teachers', {
      method: 'POST',
      headers: getAdminReauthHeaders(),
      body,
    });
  } catch (error) {
    clearAdminReauthProof();
    throw error;
  }
}

export async function assignTeacher(teacherId, body) {
  return api(`/admin/teachers/${teacherId}/assignments`, {
    method: 'POST',
    body,
  });
}

export async function updateStudentEnrollment(studentId, body) {
  return api(`/admin/students/${studentId}/enrollment`, {
    method: 'PATCH',
    body,
  });
}

export async function removeTeacherAssignment(assignmentId) {
  return api(`/admin/teacher-assignments/${assignmentId}`, { method: 'DELETE' });
}

export async function resetStudentPassword(studentId, body = {}) { return api(`/students/${studentId}/reset-password`, { method: 'POST', body }); }

export async function resetStudentProgress(studentId, body = {}) {
  return api(`/students/${studentId}/reset-progress`, {
    method: 'POST',
    body,
  });
}

export async function archiveStudent(studentId, body = {}) {
  return api(`/students/${studentId}/archive`, {
    method: 'POST',
    body,
  });
}

export async function reactivateStudent(studentId, body = {}) {
  return api(`/students/${studentId}/reactivate`, {
    method: 'POST',
    body,
  });
}

export async function resetTeacherPassword(teacherId, body = {}) { return api(`/teachers/${teacherId}/reset-password`, { method: 'POST', body }); }

export async function archiveTeacher(teacherId, body = {}) {
  return api(`/teachers/${teacherId}/archive`, {
    method: 'POST',
    body,
  });
}

export async function reactivateTeacher(teacherId, body = {}) {
  return api(`/teachers/${teacherId}/reactivate`, {
    method: 'POST',
    body,
  });
}

export async function getReportSummary() {
  return api('/reports/summary');
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

export async function getAuditTrailReportPdf() {
  return apiBinary('/reports/audit-trail.pdf');
}
