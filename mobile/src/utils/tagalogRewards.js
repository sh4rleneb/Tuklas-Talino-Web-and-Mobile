export function tagalogGantimpalaDescription(value = '') {
  const text = String(value || '').trim();

  if (!text) {
    return 'Ipagpatuloy ang pag-aaral upang makakuha ng gantimpala.';
  }

  const normalized = text.toLowerCase();

  const exact = {
    'complete your first lesson.':
      'Tapusin ang iyong unang aralin.',
    'complete your first lesson':
      'Tapusin ang iyong unang aralin.',
    'complete 5 lessons.':
      'Tapusin ang 5 aralin.',
    'complete 5 lessons':
      'Tapusin ang 5 aralin.',
    'complete 10 lessons.':
      'Tapusin ang 10 aralin.',
    'complete 10 lessons':
      'Tapusin ang 10 aralin.',
    'complete 3 punan ang patlang or writing activities.':
      'Tapusin ang 3 gawaing Punan ang Patlang o Pagsulat.',
    'complete 3 punan ang patlang or writing activities':
      'Tapusin ang 3 gawaing Punan ang Patlang o Pagsulat.',
    'earn your first xp.':
      'Makakuha ng iyong unang XP.',
    'earn your first xp':
      'Makakuha ng iyong unang XP.',
    'earn 100 xp.':
      'Makakuha ng 100 XP.',
    'earn 100 xp':
      'Makakuha ng 100 XP.',
    'earn 500 xp.':
      'Makakuha ng 500 XP.',
    'earn 500 xp':
      'Makakuha ng 500 XP.',
    'finish a mission.':
      'Tapusin ang isang misyon.',
    'finish a mission':
      'Tapusin ang isang misyon.',
    'complete a mission.':
      'Tapusin ang isang misyon.',
    'complete a mission':
      'Tapusin ang isang misyon.',
  };

  if (exact[normalized]) {
    return exact[normalized];
  }

  const replacements = [
    [/complete\s+(\d+)\s+lessons?/i, 'Tapusin ang $1 aralin'],
    [/complete\s+your\s+first\s+lesson/i, 'Tapusin ang iyong unang aralin'],
    [/complete\s+(\d+)\s+activities?/i, 'Tapusin ang $1 gawain'],
    [/complete\s+(\d+)\s+missions?/i, 'Tapusin ang $1 misyon'],
    [/complete\s+a\s+mission/i, 'Tapusin ang isang misyon'],
    [/finish\s+a\s+mission/i, 'Tapusin ang isang misyon'],
    [/earn\s+(\d+)\s+xp/i, 'Makakuha ng $1 XP'],
    [/earn\s+your\s+first\s+xp/i, 'Makakuha ng iyong unang XP'],
    [/submit\s+(\d+)\s+writing\s+activities?/i, 'Magpasa ng $1 gawaing pagsulat'],
    [/complete\s+(\d+)\s+writing\s+activities?/i, 'Tapusin ang $1 gawaing pagsulat'],
    [/answer\s+(\d+)\s+quizzes?/i, 'Sagutan ang $1 pagsusulit'],
    [/pass\s+(\d+)\s+quizzes?/i, 'Ipasa ang $1 pagsusulit'],
    [/lesson/gi, 'aralin'],
    [/lessons/gi, 'mga aralin'],
    [/activity/gi, 'gawain'],
    [/activities/gi, 'mga gawain'],
    [/mission/gi, 'misyon'],
    [/missions/gi, 'mga misyon'],
    [/writing/gi, 'pagsulat'],
    [/quiz/gi, 'pagsusulit'],
    [/quizzes/gi, 'mga pagsusulit'],
    [/complete/gi, 'tapusin'],
    [/completed/gi, 'natapos'],
    [/earn/gi, 'makakuha ng'],
    [/earned/gi, 'nakakuha ng'],
    [/finish/gi, 'tapusin'],
    [/award/gi, 'gantimpala'],
    [/badge/gi, 'gantimpala'],
  ];

  let result = text;

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }

  return result;
}
