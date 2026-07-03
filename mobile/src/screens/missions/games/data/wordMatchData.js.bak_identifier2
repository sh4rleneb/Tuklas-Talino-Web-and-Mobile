function shuffle(items = []) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function getWordMatchItemsForGrade(gradeLevel = 1) {
  const beginner = [
    { id: 'bahay', word: 'bahay', picture: '🏠', label: 'Bahay' },
    { id: 'aso', word: 'aso', picture: '🐶', label: 'Aso' },
    { id: 'aklat', word: 'aklat', picture: '📚', label: 'Aklat' },
    { id: 'lapis', word: 'lapis', picture: '✏️', label: 'Lapis' },
    { id: 'guro', word: 'guro', picture: '👩‍🏫', label: 'Guro' },
    { id: 'pusa', word: 'pusa', picture: '🐱', label: 'Pusa' },
    { id: 'isda', word: 'isda', picture: '🐟', label: 'Isda' },
    { id: 'puno', word: 'puno', picture: '🌳', label: 'Puno' },
    { id: 'araw', word: 'araw', picture: '☀️', label: 'Araw' },
    { id: 'payong', word: 'payong', picture: '☂️', label: 'Payong' },
  ];

  const grade3 = [
    { id: 'pamayanan', word: 'pamayanan', picture: '🏘️', label: 'Pamayanan' },
    { id: 'paaralan', word: 'paaralan', picture: '🏫', label: 'Paaralan' },
    { id: 'kalikasan', word: 'kalikasan', picture: '🌳', label: 'Kalikasan' },
    { id: 'manggagamot', word: 'manggagamot', picture: '🩺', label: 'Manggagamot' },
    { id: 'aklatan', word: 'aklatan', picture: '📖', label: 'Aklatan' },
    { id: 'kaalaman', word: 'kaalaman', picture: '💡', label: 'Kaalaman' },
  ];

  const grade4 = [
    { id: 'malikhain', word: 'malikhain', picture: '🎨', label: 'Malikhain' },
    { id: 'masipag', word: 'masipag', picture: '💪', label: 'Masipag' },
    { id: 'panitikan', word: 'panitikan', picture: '📜', label: 'Panitikan' },
    { id: 'talasalitaan', word: 'talasalitaan', picture: '🔤', label: 'Talasalitaan' },
    { id: 'pamayanan', word: 'pamayanan', picture: '🏘️', label: 'Pamayanan' },
    { id: 'paaralan', word: 'paaralan', picture: '🏫', label: 'Paaralan' },
  ];

  const grade5 = [
    { id: 'mapagkakatiwalaan', word: 'mapagkakatiwalaan', picture: '🤝', label: 'Mapagkakatiwalaan' },
    { id: 'pakikipagkapwa', word: 'pakikipagkapwa', picture: '👥', label: 'Pakikipagkapwa' },
    { id: 'panitikan', word: 'panitikan', picture: '📜', label: 'Panitikan' },
    { id: 'kaalaman', word: 'kaalaman', picture: '💡', label: 'Kaalaman' },
    { id: 'malikhain', word: 'malikhain', picture: '🎨', label: 'Malikhain' },
    { id: 'masipag', word: 'masipag', picture: '💪', label: 'Masipag' },
  ];

  const grade6 = [
    { id: 'mapagkakatiwalaan', word: 'mapagkakatiwalaan', picture: '🤝', label: 'Mapagkakatiwalaan' },
    { id: 'pakikipagkapwa', word: 'pakikipagkapwa', picture: '👥', label: 'Pakikipagkapwa' },
    { id: 'talasalitaan', word: 'talasalitaan', picture: '🔤', label: 'Talasalitaan' },
    { id: 'panitikan', word: 'panitikan', picture: '📜', label: 'Panitikan' },
    { id: 'kaalaman', word: 'kaalaman', picture: '💡', label: 'Kaalaman' },
    { id: 'manggagamot', word: 'manggagamot', picture: '🩺', label: 'Manggagamot' },
  ];

  switch (Number(gradeLevel)) {
    case 1:
    case 2:
      return beginner;

    case 3:
      return grade3;

    case 4:
      return grade4;

    case 5:
      return grade5;

    case 6:
      return grade6;

    default:
      return grade3;
  }
}

export function getWordMatchAttemptItems(gradeLevel = 1) {
  const pool = getWordMatchItemsForGrade(gradeLevel);

  const pairCounts = {
    1: 5,
    2: 5,
    3: 6,
    4: 6,
    5: 6,
    6: 6,
  };

  const count =
    pairCounts[Number(gradeLevel)] ?? 6;

  return shuffle(pool).slice(0, count);
}

export function shuffleWordMatchItems(items = []) {
  return shuffle(items);
}
