import { api } from './client';

export async function getLeaderboard() {
  return api('/leaderboard');
}
