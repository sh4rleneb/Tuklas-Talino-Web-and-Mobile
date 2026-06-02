import { api } from './client';

export async function getAdminStats() {
  return api('/admin/stats');
}

export async function getAdminEnrollments() {
  return api('/admin/enrollments');
}

export async function getAdminAuditLogs(limit = 20) {
  return api(`/admin/audit-logs?limit=${limit}`);
}

export async function getActiveStudents() {
  return api('/students?status=active');
}

export async function getActiveTeachers() {
  return api('/teachers?status=active');
}
