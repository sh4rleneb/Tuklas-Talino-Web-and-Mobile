
function localShuffleChoicesForAttempt(items = []) {
  const list = Array.isArray(items) ? [...items] : [];

  return list.map((item, itemIndex) => {
    if (!item || !Array.isArray(item.choices)) {
      return item;
    }

    const choices = [...item.choices];

    for (let index = choices.length - 1; index > 0; index -= 1) {
      const seed = (itemIndex + 1) * 9301 + index * 49297 + choices.length * 233280;
      const swapIndex = seed % (index + 1);
      const temp = choices[index];
      choices[index] = choices[swapIndex];
      choices[swapIndex] = temp;
    }

    return {
      ...item,
      choices,
    };
  });
}

function shuffle(items = []) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
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
  return localShuffleChoicesForAttempt(shuffle(getLetterPopItemsForGrade(gradeLevel)));
}
