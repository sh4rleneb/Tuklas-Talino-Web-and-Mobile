import { api } from './client';

export async function getTeacherDashboard() {
  return api('/teachers/dashboard');
}

export async function getTeacherMonitoringStats() {
  return api('/teachers/monitoring/stats');
}

export async function getTeacherQuizPerformance() {
  return api('/teachers/quiz-performance');
}

export async function getPendingGroupChecks() {
  return api('/groups/task-completions/pending');
}

export async function getTeacherGroups() {
  return api('/groups');
}
