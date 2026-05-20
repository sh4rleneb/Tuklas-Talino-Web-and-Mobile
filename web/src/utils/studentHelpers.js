export function levelForXp(xp = 0) {
  return Math.max(1, Math.floor(Number(xp || 0) / 100) + 1);
}

export function xpPercent(xp = 0) {
  return Number(xp || 0) % 100;
}

export function fmtDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(); } catch { return '—'; }
}

export function subjectTheme(subject) {
  const map = {
    'Pagbasa': { icon: '📖', bg: '#DFF7E8', accent: '#2ECC71', tag: 'Kwento' },
    'Bokabularyo': { icon: '🔤', bg: '#DFF2FF', accent: '#3498DB', tag: 'Salita' },
    'Panitikan': { icon: '📜', bg: '#FFF0DD', accent: '#F39C12', tag: 'Tula' },
    'Oral Comm': { icon: '🎙️', bg: '#FFE2EA', accent: '#E67EA2', tag: 'Bigkas' },
    'Pagsulat': { icon: '✍️', bg: '#FFF8CF', accent: '#F1C40F', tag: 'Sulatin' },
    'Grupo': { icon: '👥', bg: '#EFE5FF', accent: '#9B59B6', tag: 'Sama-sama' }
  };
  return map[subject] || { icon: '📚', bg: '#F6F6F6', accent: '#95A5A6', tag: 'Aralin' };
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function masteryFromPercent(percent = 0) {
  const value = Number(percent || 0);
  if (value >= 90) return { label: 'Advanced', icon: '🏆', tone: 'green', note: 'Excellent mastery. Keep challenging yourself.' };
  if (value >= 75) return { label: 'Proficient', icon: '🌟', tone: 'blue', note: 'Good understanding. A short review can make it stronger.' };
  if (value >= 50) return { label: 'Developing', icon: '🌱', tone: 'yellow', note: 'You are getting there. Review the missed questions.' };
  return { label: 'Needs Practice', icon: '🧭', tone: 'pink', note: 'Try again after reviewing the lesson.' };
}
