function categoryKey(subject = '') {
  const value = String(subject).trim().toLowerCase();
  if (value === 'oral comm' || value === 'oral communication' || value === 'pagsasalita') return 'Oral Communication';
  return CATEGORIES.find((category) => category.key.toLowerCase() === value)?.key || String(subject || 'General');
}

function categoryMeta(subject) {
  const key = categoryKey(subject);
  return CATEGORIES.find((category) => category.key === key) || {
    key,
    label: key,
    icon: '📚',
    accent: '#64748B',
    soft: '#F1F5F9',
  };
}

function gameQuestMeta(subject) {
  const key = categoryKey(subject);

  const games = {
    Pagbasa: {
      element: 'Pagbasa',
      title: '📖 Read & Match Game',
      mission: 'Read the clue, tap the right answer, and collect stars for every correct match.',
    },
    Bokabularyo: {
      element: 'Bokabularyo',
      title: '🔤 Word Match Game',
      mission: 'Match words with pictures or meanings to build your Filipino vocabulary.',
    },
    Panitikan: {
      element: 'Panitikan',
      title: '📜 Story Adventure Game',
      mission: 'Explore the story, answer fun challenges, and unlock the next story adventure.',
    },
    'Oral Communication': {
      element: 'Pagsasalita',
      title: '🎙️ Speak Aloud Game',
      mission: 'Say the target words aloud, practice clear speech, and earn stars as you improve.',
    },
    Pagsulat: {
      element: 'Pagsulat',
      title: '✍️ Trace & Write Game',
      mission: 'Practice writing words or short answers, then complete the challenge to earn XP.',
    },
  };

  return games[key] || {
    element: key || 'Filipino',
    title: '🎮 Learning Game',
    mission: 'Read, tap, speak, or write to collect stars and unlock the next game.',
  };
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function lessonDifficulty(lesson = {}, student = {}) {
  const rawDifficulty = String(
    lesson.difficulty ||
    lesson.difficultyLevel ||
    lesson.level ||
    ''
  ).trim().toLowerCase();

  const grade = Number(lesson.gradeLevel || student.gradeLevel || 0);
  const xp = Number(lesson.xpReward || 0);

  if (rawDifficulty.includes('beginner') || rawDifficulty.includes('easy')) {
    return {
      label: rawDifficulty.includes('beginner') ? 'Beginner' : 'Easy',
      icon: rawDifficulty.includes('beginner') ? '🌱' : '😊',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Short, friendly, and easy to finish.',
    };
  }

  if (rawDifficulty.includes('medium') || rawDifficulty.includes('normal')) {
    return {
      label: 'Medium',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'A balanced challenge for steady practice.',
    };
  }

  if (rawDifficulty.includes('hard') || rawDifficulty.includes('advanced')) {
    return {
      label: rawDifficulty.includes('advanced') ? 'Advanced' : 'Hard',
      icon: rawDifficulty.includes('advanced') ? '🏆' : '🔥',
      color: '#DC2626',
      soft: '#FEE2E2',
      helper: 'A stronger challenge with more thinking.',
    };
  }

  if (grade <= 1) {
    return {
      label: 'Beginner',
      icon: '🌱',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Made for first steps: read, tap, and win stars.',
    };
  }

  if (grade === 2) {
    return {
      label: 'Easy Quest',
      icon: '⭐',
      color: '#F59E0B',
      soft: '#FEF3C7',
      helper: 'A playful quest with simple challenges.',
    };
  }

  if (grade <= 4 || xp <= 20) {
    return {
      label: 'Medium',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'A balanced challenge for steady practice.',
    };
  }

  if (grade === 5 || xp <= 30) {
    return {
      label: 'Hard',
      icon: '🔥',
      color: '#EA580C',
      soft: '#FFEDD5',
      helper: 'A stronger challenge with more thinking.',
    };
  }

  return {
    label: 'Advanced',
    icon: '🏆',
    color: '#7C3AED',
    soft: '#EDE9FE',
    helper: 'A boss-level lesson for confident learners.',
  };
}

function questStarCount(lesson = {}) {
  if (lesson.completed) return 3;

  const percent = clampPercent(lesson.progressPercent || lesson.progress?.percent);

  if (percent >= 70) return 2;
  if (percent >= 25) return 1;
  return 0;
}

function isLittleQuestLesson(lesson = {}, student = {}, playful = false) {
  const grade = Number(lesson.gradeLevel || student.gradeLevel || 0);
  return playful && grade > 0 && grade <= 2;
}

function withUnlockStates(lessons = []) {
  const unlockBySubject = new Map();

  return lessons.map((lesson) => {
    const subject = categoryKey(lesson.subject);
    const canStart = unlockBySubject.get(subject) ?? true;
    const completed = Boolean(lesson.completed);
    const unlocked = completed || canStart;

    if (!completed) unlockBySubject.set(subject, false);

    return {
      ...lesson,
      completed,
      unlocked,
      subjectKey: subject,
      progressPercent: completed ? 100 : clampPercent(lesson.progress?.percent),
    };
  });
}

export {
  categoryKey,
  categoryMeta,
  gameQuestMeta,
  clampPercent,
  lessonDifficulty,
  questStarCount,
  isLittleQuestLesson,
  withUnlockStates,
};
