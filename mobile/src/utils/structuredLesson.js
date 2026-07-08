const sectionLabels = {
  layunin: { title: 'Layunin', icon: '🎯' },
  alamin: { title: 'Alamin', icon: '💡' },
  panimula: { title: 'Panimula', icon: '🌟' },
  aralin: { title: 'Aralin', icon: '📖' },
  gawain: { title: 'Gawain', icon: '📝' }
};

function normalizeKey(label = '') {
  const key = String(label || '')
    .toLowerCase()
    .replace(/[^a-zñ]/g, '')
    .trim();

  if (['aralin', 'lesson', 'lessons', 'mgaaralin'].includes(key)) return 'aralin';
  return key;
}

function splitLessonText(text = '') {
  const raw = String(text || '').replace(/\r\n/g, '\n').trim();

  if (!raw) return [];

  const pattern = /(Layunin|Alamin|Panimula|Aralin|Lesson|Lessons|Mga Aralin|Gawain)\s*:/gi;
  const matches = [...raw.matchAll(pattern)];

  if (!matches.length) {
    return [{ key: 'aralin', title: 'Aralin', content: raw }];
  }

  return matches
    .map((match, index) => {
      const label = match[1];
      const start = match.index + match[0].length;
      const end = index + 1 < matches.length ? matches[index + 1].index : raw.length;
      const content = raw.slice(start, end).trim();
      const key = normalizeKey(label);

      return {
        key,
        title: sectionLabels[key]?.title || label,
        content
      };
    })
    .filter((section) => section.content);
}

function sectionContent(sections, key) {
  return sections.find((section) => section.key === key)?.content || '';
}

export function getStructuredLessonSectionText(text, targetKey) {
  const sections = splitLessonText(text);
  return sectionContent(sections, targetKey);
}

function escapeRegex(value = '') {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(text = '', word = '') {
  if (!word) return false;
  const escaped = escapeRegex(word);
  return new RegExp(`(^|[^a-zñ])${escaped}([^a-zñ]|$)`, 'i').test(String(text || ''));
}

function hasAnyWord(text = '', words = []) {
  return words.some((word) => hasWord(text, word));
}

function lessonTextParts(lesson, aralinText = '') {
  const title = String(lesson?.title || '').toLowerCase();
  const subject = String(lesson?.subject || '').toLowerCase();
  const body = String(aralinText || '').toLowerCase();

  return {
    title,
    subject,
    body,
    titleSubject: `${title} ${subject}`,
    all: `${title} ${subject} ${body}`
  };
}

function letterFromText(text = '') {
  const match = String(text || '').match(/letrang\s+([a-zñ])/i);
  return match ? match[1].toUpperCase() : '';
}

function isLetterLesson(text = '') {
  return /letrang\s+[a-zñ]/i.test(String(text || '')) ||
    /nagsisimula\s+sa\s+letra/i.test(String(text || '')) ||
    hasWord(text, 'titik');
}

function aralinGuideFor(lesson, aralinText = '') {
  const parts = lessonTextParts(lesson, aralinText);

  if (isLetterLesson(parts.all)) {
    const letter = letterFromText(parts.all);
    return {
      label: letter ? `Mga Salitang may Letrang ${letter}` : 'Mga Salitang may Titik',
      helper: 'Tingnan ang titik. Basahin ang mga salita.'
    };
  }

  if (hasWord(parts.all, 'bugtong')) {
    return {
      label: 'Halimbawa ng Bugtong',
      helper: 'Basahin ang clue. Hulaan ang sagot.'
    };
  }

  if (hasWord(parts.titleSubject, 'panuto')) {
    return {
      label: 'Pagsunod sa Panuto',
      helper: 'Basahin ang panuto at sundin ito.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['oral', 'bigkas', 'talumpati', 'pakikipanayam', 'pagbati', 'pagpapakilala'])) {
    return {
      label: 'Pagsasanay sa Pagsasalita',
      helper: 'Basahin muna, pagkatapos bigkasin nang malinaw.'
    };
  }

  if (hasWord(parts.all, 'pangungusap')) {
    return {
      label: 'Halimbawa ng Pangungusap',
      helper: 'Basahin ang halimbawa bago sumagot.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['pagsulat', 'talata', 'liham', 'sanaysay'])) {
    return {
      label: 'Gabay sa Pagsulat',
      helper: 'Basahin muna ang halimbawa bago magsulat.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['bokabularyo', 'salita', 'sawikain', 'kasingkahulugan', 'kasalungat', 'pang-ugnay'])) {
    return {
      label: 'Salita at Halimbawa',
      helper: 'Tingnan ang salita at kung paano ito ginagamit.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['kuwento', 'kwento'])) {
    return {
      label: 'Maikling Kuwento',
      helper: 'Basahin ang nangyari sa kuwento.'
    };
  }

  if (hasWord(parts.titleSubject, 'tula')) {
    return {
      label: 'Tula',
      helper: 'Basahin ang mga linya ng tula.'
    };
  }

  if (hasWord(parts.titleSubject, 'panitikan')) {
    return {
      label: 'Akdang Pampanitikan',
      helper: 'Basahin ang akda at alamin ang mensahe.'
    };
  }

  if (hasWord(parts.subject, 'pagbasa')) {
    return {
      label: 'Pagbabasa',
      helper: 'Basahin ang teksto at unawain ang mensahe.'
    };
  }

  return {
    label: 'Basahin ang Aralin',
    helper: 'Basahin muna ito bago sagutan ang gawain.'
  };
}

function visualForLesson(lesson, aralinText = '') {
  const parts = lessonTextParts(lesson, aralinText);

  if (isLetterLesson(parts.all)) {
    const letter = letterFromText(parts.all);
    return { icon: '🔤', label: letter ? `Letrang ${letter}` : 'Titik' };
  }

  if (hasWord(parts.all, 'bugtong')) return { icon: '❓', label: 'Hulaan' };

  if (hasWord(parts.titleSubject, 'pagbati') || hasWord(parts.titleSubject, 'pagpapakilala')) {
    return { icon: '👋', label: 'Pagbati' };
  }

  if (hasWord(parts.titleSubject, 'panuto')) return { icon: '✅', label: 'Panuto' };

  if (hasAnyWord(parts.titleSubject, ['oral', 'bigkas', 'talumpati', 'pakikipanayam'])) {
    return { icon: '🎙️', label: 'Bigkas' };
  }

  if (hasWord(parts.titleSubject, 'liham')) return { icon: '✉️', label: 'Liham' };

  if (hasAnyWord(parts.titleSubject, ['pagsulat', 'talata', 'sanaysay'])) {
    return { icon: '✍️', label: 'Sulat' };
  }

  if (hasWord(parts.titleSubject, 'pangungusap')) return { icon: '📝', label: 'Pangungusap' };
  if (hasWord(parts.titleSubject, 'bola')) return { icon: '⚽', label: 'Bola' };
  if (hasWord(parts.titleSubject, 'mangga')) return { icon: '🥭', label: 'Mangga' };
  if (hasWord(parts.titleSubject, 'pamilya')) return { icon: '👨‍👩‍👧', label: 'Pamilya' };
  if (hasWord(parts.titleSubject, 'tubig')) return { icon: '💧', label: 'Tubig' };

  if (hasAnyWord(parts.titleSubject, ['maya', 'uwak'])) {
    return { icon: '🐦', label: 'Ibon' };
  }

  if (hasAnyWord(parts.titleSubject, ['bayanihan', 'clean-up', 'clean'])) {
    return { icon: '🤝', label: 'Bayanihan' };
  }

  if (hasWord(parts.titleSubject, 'pagbabasa')) return { icon: '📚', label: 'Pagbasa' };

  if (hasAnyWord(parts.titleSubject, ['bokabularyo', 'salita', 'sawikain', 'kasingkahulugan', 'kasalungat', 'pang-ugnay'])) {
    return { icon: '🔤', label: 'Salita' };
  }

  if (hasWord(parts.titleSubject, 'tula')) return { icon: '📜', label: 'Tula' };

  if (hasAnyWord(parts.titleSubject, ['kuwento', 'kwento'])) {
    return { icon: '📖', label: 'Kuwento' };
  }

  if (hasWord(parts.titleSubject, 'panitikan')) return { icon: '📜', label: 'Akda' };
  if (hasWord(parts.subject, 'pagbasa')) return { icon: '📖', label: 'Pagbasa' };
  if (hasWord(parts.subject, 'bokabularyo')) return { icon: '🔤', label: 'Salita' };
  if (hasWord(parts.subject, 'panitikan')) return { icon: '📜', label: 'Akda' };
  if (hasWord(parts.subject, 'oral')) return { icon: '🎙️', label: 'Bigkas' };
  if (hasWord(parts.subject, 'pagsulat')) return { icon: '✍️', label: 'Sulat' };

  return { icon: '📚', label: 'Aralin' };
}

function topicInfoForLesson(lesson, aralinText = '') {
  const parts = lessonTextParts(lesson, aralinText);
  const visual = visualForLesson(lesson, aralinText);

  if (isLetterLesson(parts.all)) {
    const letter = letterFromText(parts.all);
    return {
      label: letter ? `Ano ang Letrang ${letter}?` : 'Ano ang Titik?',
      visual,
      info: letter
        ? `Ang letrang ${letter} ay may tunog na /${letter.toLowerCase()}/. May mga salita na nagsisimula sa ${letter}.`
        : 'Ang titik ay ginagamit para makabuo ng mga salita.',
      reminder: 'Pagkatapos alamin ang titik, babasahin mo ang mga halimbawa.'
    };
  }

  if (hasWord(parts.all, 'bugtong')) {
    return {
      label: 'Ano ang Bugtong?',
      visual,
      info: 'Ang bugtong ay larong hulaan gamit ang mga clue.',
      reminder: 'Pagkatapos alamin ang ibig sabihin, babasahin mo ang halimbawa ng bugtong.'
    };
  }

  if (hasWord(parts.titleSubject, 'panuto')) {
    return {
      label: 'Ano ang Panuto?',
      visual,
      info: 'Ang panuto ay nagsasabi kung ano ang dapat gawin.',
      reminder: 'Pagkatapos alamin ang panuto, babasahin mo ang halimbawa.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['pagbati', 'pagpapakilala'])) {
    return {
      label: 'Ano ang Pagbati at Pagpapakilala?',
      visual,
      info: 'Ang pagbati at pagpapakilala ay ginagamit kapag kinakausap natin ang ibang tao.',
      reminder: 'Pagkatapos alamin ito, susubukan mong magsalita nang malinaw at magalang.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['oral', 'bigkas', 'talumpati', 'pakikipanayam'])) {
    return {
      label: 'Ano ang Pagsasalita?',
      visual,
      info: 'Sa pagsasalita, mahalaga ang malinaw na bigkas at magalang na salita.',
      reminder: 'Pagkatapos alamin ito, babasahin at bibigkasin mo ang halimbawa.'
    };
  }

  if (hasWord(parts.all, 'pangungusap')) {
    return {
      label: 'Ano ang Pangungusap?',
      visual,
      info: 'Ang pangungusap ay grupo ng mga salita na may buong diwa.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang halimbawa ng pangungusap.'
    };
  }

  if (hasWord(parts.titleSubject, 'liham')) {
    return {
      label: 'Ano ang Liham?',
      visual,
      info: 'Ang liham ay sulat na may mensahe para sa isang tao o pangkat.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang gabay sa pagsulat.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['pagsulat', 'talata', 'sanaysay'])) {
    return {
      label: 'Ano ang Pagsulat?',
      visual,
      info: 'Sa pagsulat, inilalagay natin sa salita ang ating ideya.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang halimbawa o gabay.'
    };
  }

  if (hasWord(parts.titleSubject, 'sawikain')) {
    return {
      label: 'Ano ang Sawikain?',
      visual,
      info: 'Ang sawikain ay pahayag na may espesyal o hindi direktang kahulugan.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang halimbawa.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['kasingkahulugan', 'kasalungat'])) {
    return {
      label: 'Ano ang Kahulugan ng Salita?',
      visual,
      info: 'May mga salitang magkapareho ang kahulugan at may mga salitang magkasalungat ang kahulugan.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang mga halimbawa.'
    };
  }

  if (hasWord(parts.titleSubject, 'pang-ugnay')) {
    return {
      label: 'Ano ang Pang-ugnay?',
      visual,
      info: 'Ang pang-ugnay ay salitang nagdurugtong ng mga ideya sa pangungusap.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang halimbawa.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['bokabularyo', 'salita'])) {
    return {
      label: 'Ano ang Bokabularyo?',
      visual,
      info: 'Ang bokabularyo ay mga salitang ginagamit natin sa pagbasa, pagsulat, at pagsasalita.',
      reminder: 'Pagkatapos alamin ang salita, babasahin mo ang halimbawa.'
    };
  }

  if (hasAnyWord(parts.titleSubject, ['kuwento', 'kwento'])) {
    return {
      label: 'Ano ang Kuwento?',
      visual,
      info: 'Ang kuwento ay may tauhan, pangyayari, at aral.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang kuwento.'
    };
  }

  if (hasWord(parts.titleSubject, 'tula')) {
    return {
      label: 'Ano ang Tula?',
      visual,
      info: 'Ang tula ay akdang may mga linya, damdamin, at mensahe.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang mga linya ng tula.'
    };
  }

  if (hasWord(parts.titleSubject, 'panitikan')) {
    return {
      label: 'Ano ang Panitikan?',
      visual,
      info: 'Ang panitikan ay mga akdang may kuwento, tula, aral, o mensahe.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang akda.'
    };
  }

  if (hasWord(parts.subject, 'pagbasa')) {
    return {
      label: 'Ano ang Pagbasa?',
      visual,
      info: 'Sa pagbasa, inuunawa natin ang mga salita at mensahe ng teksto.',
      reminder: 'Pagkatapos alamin ito, babasahin mo ang nilalaman.'
    };
  }

  return {
    label: 'Ano ang Paksa?',
    visual,
    info: 'Alamin muna ang paksa bago pumunta sa aralin.',
    reminder: 'Pagkatapos nito, babasahin mo ang halimbawa o nilalaman.'
  };
}

export function getStructuredLessonKnowAudioText(text, lesson) {
  const sections = splitLessonText(text);
  const manualAlamin = sectionContent(sections, 'alamin');
  const aralinText = sectionContent(sections, 'aralin') || String(text || '').trim();

  if (manualAlamin) {
    return manualAlamin;
  }

  const info = topicInfoForLesson(lesson, aralinText);

  return [info.label, info.info, info.reminder].filter(Boolean).join('\n\n');
}

export function getStructuredLessonLessonAudioText(text) {
  const sections = splitLessonText(text);
  const aralinText = sectionContent(sections, 'aralin') || String(text || '').trim();

  return aralinText;
}

function earlyGradeLines(content = '') {
  const clean = String(content || '').replace(/\s+/g, ' ').trim();

  if (!clean) return [];

  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];

  return sentences
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .flatMap((sentence) => {
      if (sentence.length <= 44) return [sentence];

      const commaParts = sentence.split(',').map((part) => part.trim()).filter(Boolean);

      if (commaParts.length > 1) {
        return commaParts.map((part, index) => {
          const endMark = index === commaParts.length - 1 && /[.!?]$/.test(sentence) ? sentence.slice(-1) : '';
          return `${part}${endMark}`;
        });
      }

      return [sentence];
    });
}

function upperGradeLines(content = '') {
  const clean = String(content || '').replace(/\s+/g, ' ').trim();
  return clean ? [clean] : [];
}

