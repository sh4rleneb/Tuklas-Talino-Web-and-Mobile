export function levelFromXp(xp = 0) {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 25)) + 1;
}

export function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

export const subjects = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Comm', 'Pagsulat'];
export const avatars = ['🦋','🐸','🦊','🐨','🦁','🐼','🐯','🐙','🦉','🐢'];
