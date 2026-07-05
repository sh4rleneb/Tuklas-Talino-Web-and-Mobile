function shuffle(items = []) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }


function shuffleChoicesForAttempt(items = []) {
  return items.map((item) => ({
    ...item,
    choices: Array.isArray(item.choices) ? shuffle(item.choices) : item.choices,
    options: Array.isArray(item.options) ? shuffle(item.options) : item.options,
  }));
}

  return copy;
}

export function getLetterPopItemsForGrade(gradeLevel = 1) {
  const beginner = [
    {
      id: 'g1-1',
      prompt: 'Ba + ? = Bata',
      answer: 'ta',
      choices: ['ta', 'ka', 'la', 'na'],
    },
    {
      id: 'g1-2',
      prompt: 'Pu + ? = Pusa',
      answer: 'sa',
      choices: ['sa', 'ma', 'ka', 'la'],
    },
    {
      id: 'g2-1',
      prompt: 'La + ? = Lapis',
      answer: 'pis',
      choices: ['pis', 'tas', 'wan', 'bok'],
    },
  ];

  const upper = [
    {
      id: 'g3-1',
      prompt: 'Pamaya + ?',
      answer: 'nan',
      choices: ['nan', 'han', 'tan', 'lan'],
    },
    {
      id: 'g4-1',
      prompt: 'Kalika + ?',
      answer: 'san',
      choices: ['san', 'han', 'wan', 'nan'],
    },
    {
      id: 'g5-1',
      prompt: 'Paniti + ?',
      answer: 'kan',
      choices: ['kan', 'tan', 'han', 'lan'],
    },
  ];

  return Number(gradeLevel) <= 2
    ? beginner
    : upper;
}

export function getLetterPopAttemptItems(gradeLevel = 1) {
  return shuffleChoicesForAttempt(shuffle(getLetterPopItemsForGrade(gradeLevel)));
}
