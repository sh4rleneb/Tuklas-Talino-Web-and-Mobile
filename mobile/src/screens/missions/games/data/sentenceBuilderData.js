function shuffle(items = []) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function getSentenceBuilderItemsForGrade(gradeLevel = 1) {
  const beginner = [
    {
      id: 'g1-1',
      words: ['Ako', 'ay', 'bata'],
      answer: 'Ako ay bata.',
    },
    {
      id: 'g1-2',
      words: ['Siya', 'ay', 'guro'],
      answer: 'Siya ay guro.',
    },
    {
      id: 'g1-3',
      words: ['May', 'aso', 'ako'],
      answer: 'May aso ako.',
    },
    {
      id: 'g1-4',
      words: ['Masaya', 'ako', 'ngayon'],
      answer: 'Masaya ako ngayon.',
    },
    {
      id: 'g1-5',
      words: ['Kumakain', 'ang', 'bata'],
      answer: 'Kumakain ang bata.',
    },
  ];

  const grade3 = [
    {
      id: 'g3-1',
      words: ['Nagbabasa', 'ng', 'aklat', 'ang', 'bata'],
      answer: 'Nagbabasa ng aklat ang bata.',
    },
    {
      id: 'g3-2',
      words: ['Masipag', 'mag-aral', 'si', 'Ana'],
      answer: 'Masipag mag-aral si Ana.',
    },
    {
      id: 'g3-3',
      words: ['Mahalaga', 'ang', 'kalikasan'],
      answer: 'Mahalaga ang kalikasan.',
    },
    {
      id: 'g3-4',
      words: ['Naglilinis', 'kami', 'ng', 'silid'],
      answer: 'Naglilinis kami ng silid.',
    },
    {
      id: 'g3-5',
      words: ['Mahusay', 'ang', 'aming', 'guro'],
      answer: 'Mahusay ang aming guro.',
    },
    {
      id: 'g3-6',
      words: ['Masaya', 'ang', 'pamayanan'],
      answer: 'Masaya ang pamayanan.',
    },
  ];

  switch (Number(gradeLevel)) {
    case 1:
    case 2:
      return beginner;

    default:
      return grade3;
  }
}

export function getSentenceBuilderAttemptItems(
  gradeLevel = 1
) {
  return shuffle(
    getSentenceBuilderItemsForGrade(
      gradeLevel
    )
  );
}
