import { api } from './client';

export async function getLeaderboard(params = {}) {
  const gradeLevel = params.gradeLevel ?? params.grade ?? '';
  const query = gradeLevel && gradeLevel !== 'all'
    ? `?gradeLevel=${encodeURIComponent(gradeLevel)}`
    : '';

  return api(`/leaderboard${query}`);
}
