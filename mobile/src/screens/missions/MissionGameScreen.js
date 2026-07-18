import { SafeAreaView } from 'react-native-safe-area-context';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Image,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../../api/client';
import { getBadgeImageSource } from '../../utils/badgeAssets';

import MissionHeader from './components/MissionHeader';
import MissionCompleteModal from './components/MissionCompleteModal';
import WordMatchGame from './games/WordMatchGame';
import LetterPopGame from './games/LetterPopGame';
import PictureGuessGame from './games/PictureGuessGame';
import SentenceBuilderGame from './games/SentenceBuilderGame';
import StoryQuestGame from './games/StoryQuestGame';
import FillInTheBlankGame from './games/FillInTheBlankGame';


const MAX_MISSION_ATTEMPTS = 5;
const MISSION_ATTEMPT_STORAGE_KEY = 'tuklas_mobile_misyon_attempts_v1';

const TAGALOG_MISSION_TITLES = Object.freeze({
  'word-match': 'Pagtutugma ng Salita',
  'letter-pop': 'Pagpili ng Titik',
  'picture-guess': 'Hulaan ang Larawan',
  'sentence-builder': 'Pagbuo ng Pangungusap',
  'story-quest': 'Pag-unawa sa Kuwento',
  'sound-and-say': 'Pakikinig at Pagbigkas',
  'fill-in-the-blank': 'Punan ang Patlang',
});

const TAGALOG_MISSION_TITLES_BY_ENGLISH = Object.freeze({
  'word match': 'Pagtutugma ng Salita',
  'letter pop': 'Pagpili ng Titik',
  'picture guess': 'Hulaan ang Larawan',
  'sentence builder': 'Pagbuo ng Pangungusap',
  'story quest': 'Pag-unawa sa Kuwento',
  'sound and say': 'Pakikinig at Pagbigkas',
  'fill in the blank': 'Punan ang Patlang',
  'fill-in-the-blank': 'Punan ang Patlang',
});

function missionAttemptStorageKeys({
  missionApiId,
  missionId,
  gameId,
} = {}) {
  return [
    missionApiId,
    missionId,
    gameId,
  ]
    .filter(Boolean)
    .map(String);
}

async function persistMissionAttemptUpdate(update = {}) {
  try {
    const raw = await AsyncStorage.getItem(MISSION_ATTEMPT_STORAGE_KEY);
    const previous = raw ? JSON.parse(raw) : {};
    const keys = missionAttemptStorageKeys(update);
    const next = {
      ...previous,
    };

    keys.forEach((key) => {
      const previousAttempt = Number(next[key]?.attemptNo || 0);

      next[key] = {
        attemptNo: Math.max(
          previousAttempt,
          Number(update.attemptNo || 0)
        ),
        maxAttempts: Math.max(
          MAX_MISSION_ATTEMPTS,
          Number(update.maxAttempts || MAX_MISSION_ATTEMPTS)
        ),
      };
    });

    await AsyncStorage.setItem(
      MISSION_ATTEMPT_STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch (error) {
    // Best-effort only. Route params still update the visible screen.
  }
}

function getTagalogMissionTitle(
  missionId,
  fallbackTitle = ''
) {
  const id = String(missionId || '')
    .trim()
    .toLowerCase();

  const fallback = String(fallbackTitle || '')
    .trim();

  const normalizedFallback = fallback
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  return (
    TAGALOG_MISSION_TITLES[id] ||
    TAGALOG_MISSION_TITLES_BY_ENGLISH[
      normalizedFallback
    ] ||
    fallback ||
    'Misyon'
  );
}

const SOUND_AND_SAY_LEVELS = {
  1: {
    difficulty: 'Junior • Baitang 1',
    prompt: 'Magandang umaga po.',
    guide: 'Bigkasin nang malinaw ang isang magalang na pangungusap.',
  },
  2: {
    difficulty: 'Junior • Baitang 2',
    prompt: 'Ako ay batang masipag magbasa.',
    guide: 'Bigkasin nang malinaw ang isang buong pangungusap.',
  },
  3: {
    difficulty: 'Junior • Baitang 3',
    prompt: 'Malinaw kong binibigkas ang mga salita sa Filipino.',
    guide: 'Bigkasin nang maayos ang isang mas mahabang pangungusap.',
  },
  4: {
    difficulty: 'Senior • Baitang 4',
    prompt: 'Ang pagbabasa ay susi sa mas malawak na kaalaman.',
    guide: 'Bigkasin ang pangungusap nang may tamang bilis at kumpiyansa.',
  },
  5: {
    difficulty: 'Senior • Baitang 5',
    prompt: 'Ipinapahayag ko nang malinaw ang aking opinyon at dahilan.',
    guide: 'Bigkasin nang malinaw ang pangungusap at bigyang-diin ang pangunahing diwa.',
  },
  6: {
    difficulty: 'Senior • Baitang 6',
    prompt: 'Mahusay akong makinig, magsalita, at magpaliwanag nang may tiwala sa sarili.',
    guide: 'Bigkasin ang pangungusap nang may kumpiyansa, tamang damdamin, at maayos na bilis.',
  },
};

function friendlyMissionErrorMessage(message = '') {
  const text = String(message || '').toLowerCase();

  if (text.includes('already used all') && text.includes('attempt')) {
    return 'Naubos mo na ang 2 pagsubok para sa misyong ito. Magaling! Subukan ang ibang misyon o balikan ang iyong natutuhan.';
  }

  if (text.includes('mission not found')) {
    return 'Hindi pa handa ang misyong ito. Bumalik at pumili ng ibang misyon.';
  }

  return 'Hindi namin maisave ang iyong misyon sa ngayon. Subukan muli.';
}

function soundAndSayLevelForGrade(gradeLevel) {
  const grade = Number(gradeLevel || 1);

  if (grade <= 1) return SOUND_AND_SAY_LEVELS[1];
  if (grade >= 6) return SOUND_AND_SAY_LEVELS[6];

  return SOUND_AND_SAY_LEVELS[grade] || SOUND_AND_SAY_LEVELS[1];
}

const MISSION_QUESTION_POOLS = Object.freeze({
  'word-match': [
    {
      sample: 'araw ↔ sun',
      prompt: 'Itugma ang salita: araw',
      options: ['sun', 'moon', 'rain'],
      correct: 'sun',
    },
    {
      sample: 'bahay ↔ house',
      prompt: 'Itugma ang salita: bahay',
      options: ['tree', 'house', 'river'],
      correct: 'house',
    },
    {
      sample: 'isda ↔ fish',
      prompt: 'Itugma ang salita: isda',
      options: ['bird', 'fish', 'cat'],
      correct: 'fish',
    },
  ],

  'letter-pop': [
    {
      sample: 'pu + ___ = 🌳',
      prompt: 'pu + ___ = 🌳',
      prefix: 'pu',
      resultEmoji: '🌳',
      resultWord: 'puno',
      clue: 'Halamang may katawan, sanga, at dahon.',
      options: ['no', 'la', 'sa'],
      correct: 'no',
      instruction: 'Tap the balloon na bubuo sa salita. Kapag tama, pop!',
    },
    {
      sample: 'ba + ___ = 👧',
      prompt: 'ba + ___ = 👧',
      prefix: 'ba',
      resultEmoji: '👧',
      resultWord: 'bata',
      clue: 'Munting tao na nag-aaral at naglalaro.',
      options: ['ta', 'ka', 'ma'],
      correct: 'ta',
      instruction: 'Tap the balloon na bubuo sa salita. Kapag tama, pop!',
    },
    {
      sample: 'a + ___ = 🐶',
      prompt: 'a + ___ = 🐶',
      prefix: 'a',
      resultEmoji: '🐶',
      resultWord: 'aso',
      clue: 'Hayop na tumatahol at karaniwang alaga sa bahay.',
      options: ['so', 'no', 'to'],
      correct: 'so',
      instruction: 'Tap the balloon na bubuo sa salita. Kapag tama, pop!',
    },
  ],

  'picture-guess': [
    {
      sample: '🐱 → pusa',
      prompt: 'Ano ang nasa larawan? 🐱',
      imageEmoji: '🐱',
      options: ['pusa', 'aso', 'ibon'],
      correct: 'pusa',
    },
    {
      sample: '🐶 → aso',
      prompt: 'Ano ang nasa larawan? 🐶',
      imageEmoji: '🐶',
      options: ['isda', 'aso', 'pusa'],
      correct: 'aso',
    },
    {
      sample: '🐟 → isda',
      prompt: 'Ano ang nasa larawan? 🐟',
      imageEmoji: '🐟',
      options: ['ibon', 'isda', 'baka'],
      correct: 'isda',
    },
  ],

  'sentence-builder': [
    {
      sample: 'Ako ay bata.',
      prompt: 'Buuin ang pangungusap: Ako ay bata.',
      options: ['Ako', 'ay', 'bata'],
      choices: ['Ako', 'ay', 'bata'],
      correct: 'Ako ay bata',
      answer: 'Ako ay bata',
    },
    {
      sample: 'Si Ana ay masaya.',
      prompt: 'Buuin ang pangungusap: Si Ana ay masaya.',
      options: ['Si', 'Ana', 'ay', 'masaya'],
      choices: ['Si', 'Ana', 'ay', 'masaya'],
      correct: 'Si Ana ay masaya',
      answer: 'Si Ana ay masaya',
    },
    {
      sample: 'May bola si Ben.',
      prompt: 'Buuin ang pangungusap: May bola si Ben.',
      options: ['May', 'bola', 'si', 'Ben'],
      choices: ['May', 'bola', 'si', 'Ben'],
      correct: 'May bola si Ben',
      answer: 'May bola si Ben',
    },
  ],

  'story-quest': [
    {
      sample: 'Si Lito ay nagbasa ng aklat.',
      prompt: 'Ano ang ginawa ni Lito?',
      story: 'Si Lito ay nagbasa ng aklat sa silid.',
      options: ['Naglaro', 'Nagbasa', 'Kumain'],
      correct: 'Nagbasa',
    },
    {
      sample: 'Si Maya ay nagtanim ng puno.',
      prompt: 'Ano ang itinanim ni Maya?',
      story: 'Si Maya ay nagtanim ng puno sa bakuran.',
      options: ['Bulaklak', 'Puno', 'Gulay'],
      correct: 'Puno',
    },
    {
      sample: 'Uminom ng tubig si Nena.',
      prompt: 'Ano ang ininom ni Nena?',
      story: 'Pagkatapos maglaro, uminom ng tubig si Nena.',
      options: ['Gatas', 'Tubig', 'Katas'],
      correct: 'Tubig',
    },
  ],

  'sound-and-say': [
    {
      sample: 'Bahay',
      prompt: 'Pakinggan at bigkasin: Bahay',
      targetText: 'Bahay',
      phrase: 'Bahay',
      correct: 'Bahay',
    },
    {
      sample: 'Paaralan',
      prompt: 'Pakinggan at bigkasin: Paaralan',
      targetText: 'Paaralan',
      phrase: 'Paaralan',
      correct: 'Paaralan',
    },
    {
      sample: 'Magandang umaga',
      prompt: 'Pakinggan at bigkasin: Magandang umaga',
      targetText: 'Magandang umaga',
      phrase: 'Magandang umaga',
      correct: 'Magandang umaga',
    },
  ],

  'fill-in-the-blank': [
    {
      sample: 'Ang kulay ng araw ay dilaw.',
      prompt: 'Ang kulay ng araw ay ___.',
      options: ['dilaw', 'itim', 'asul'],
      correct: 'dilaw',
      answer: 'dilaw',
    },
    {
      sample: 'Ang dahon ay berde.',
      prompt: 'Ang dahon ay ___.',
      options: ['pula', 'berde', 'puti'],
      correct: 'berde',
      answer: 'berde',
    },
    {
      sample: 'Ang tubig ay malinaw.',
      prompt: 'Ang tubig ay ___.',
      options: ['malinaw', 'maingay', 'mainit'],
      correct: 'malinaw',
      answer: 'malinaw',
    },
  ],
});

function normalizeMissionQuestionKey(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

function seededMissionRandom(value = '') {
  const text = String(value || '');
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(index);
    hash |= 0;
  }

  const raw = Math.sin(hash || 1) * 10000;
  return raw - Math.floor(raw);
}

function getMissionAttemptNoForQuestion(source = {}) {
  const current = Number(
    source?.currentAttemptNo ??
    source?.currentAttempt ??
    source?.nextAttemptNo ??
    0
  );

  if (Number.isFinite(current) && current > 0) {
    return Math.max(
      1,
      Math.min(MAX_MISSION_ATTEMPTS, current)
    );
  }

  const used = Number(
    source?.attemptCount ??
    source?.attemptsUsed ??
    source?.attemptNo ??
    source?.missionAttemptCount ??
    source?.latestAttempt?.attemptNo ??
    0
  );

  return Math.max(
    1,
    Math.min(
      MAX_MISSION_ATTEMPTS,
      Number.isFinite(used) ? used + 1 : 1
    )
  );
}


const GRADE_MISSION_QUESTION_POOLS = Object.freeze({
  1: {
    'word-match': [
      { sample: 'aso ↔ dog', prompt: 'Itugma ang salita: aso', options: ['dog', 'cat', 'fish'], correct: 'dog' },
      { sample: 'bahay ↔ house', prompt: 'Itugma ang salita: bahay', options: ['tree', 'house', 'river'], correct: 'house' },
      { sample: 'araw ↔ sun', prompt: 'Itugma ang salita: araw', options: ['moon', 'sun', 'rain'], correct: 'sun' },
    ],
    'letter-pop': [
      { sample: 'pu + ___ = puno', prompt: 'pu + ___ = 🌳', prefix: 'pu', resultEmoji: '🌳', resultWord: 'puno', clue: 'Halamang may katawan, sanga, at dahon.', options: ['no', 'la', 'sa'], correct: 'no', instruction: 'Piliin ang pantig na bubuo sa salita.' },
      { sample: 'ba + ___ = bata', prompt: 'ba + ___ = 👧', prefix: 'ba', resultEmoji: '👧', resultWord: 'bata', clue: 'Munting tao na nag-aaral at naglalaro.', options: ['ta', 'ka', 'ma'], correct: 'ta', instruction: 'Piliin ang pantig na bubuo sa salita.' },
      { sample: 'a + ___ = aso', prompt: 'a + ___ = 🐶', prefix: 'a', resultEmoji: '🐶', resultWord: 'aso', clue: 'Hayop na tumatahol.', options: ['so', 'no', 'to'], correct: 'so', instruction: 'Piliin ang pantig na bubuo sa salita.' },
    ],
    'picture-guess': [
      { sample: '🐱 → pusa', prompt: 'Ano ang nasa larawan? 🐱', imageEmoji: '🐱', options: ['pusa', 'aso', 'ibon'], correct: 'pusa' },
      { sample: '🐶 → aso', prompt: 'Ano ang nasa larawan? 🐶', imageEmoji: '🐶', options: ['isda', 'aso', 'pusa'], correct: 'aso' },
      { sample: '🐟 → isda', prompt: 'Ano ang nasa larawan? 🐟', imageEmoji: '🐟', options: ['ibon', 'isda', 'baka'], correct: 'isda' },
    ],
    'sentence-builder': [
      { sample: 'Ako ay bata.', prompt: 'Buuin ang pangungusap: Ako ay bata.', options: ['Ako', 'ay', 'bata'], choices: ['Ako', 'ay', 'bata'], correct: 'Ako ay bata', answer: 'Ako ay bata' },
      { sample: 'Si Ana ay masaya.', prompt: 'Buuin ang pangungusap: Si Ana ay masaya.', options: ['Si', 'Ana', 'ay', 'masaya'], choices: ['Si', 'Ana', 'ay', 'masaya'], correct: 'Si Ana ay masaya', answer: 'Si Ana ay masaya' },
      { sample: 'May bola si Ben.', prompt: 'Buuin ang pangungusap: May bola si Ben.', options: ['May', 'bola', 'si', 'Ben'], choices: ['May', 'bola', 'si', 'Ben'], correct: 'May bola si Ben', answer: 'May bola si Ben' },
    ],
    'story-quest': [
      { sample: 'Si Lito ay nagbasa.', prompt: 'Ano ang ginawa ni Lito?', story: 'Si Lito ay nagbasa ng aklat sa silid.', options: ['Naglaro', 'Nagbasa', 'Kumain'], correct: 'Nagbasa' },
      { sample: 'Si Maya ay nagtanim.', prompt: 'Ano ang itinanim ni Maya?', story: 'Si Maya ay nagtanim ng puno sa bakuran.', options: ['Bulaklak', 'Puno', 'Gulay'], correct: 'Puno' },
      { sample: 'Uminom si Nena.', prompt: 'Ano ang ininom ni Nena?', story: 'Pagkatapos maglaro, uminom ng tubig si Nena.', options: ['Gatas', 'Tubig', 'Katas'], correct: 'Tubig' },
    ],
  },

  2: {
    'word-match': [
      { sample: 'masaya ↔ happy', prompt: 'Itugma ang salita: masaya', options: ['sad', 'happy', 'angry'], correct: 'happy' },
      { sample: 'mabilis ↔ fast', prompt: 'Itugma ang salita: mabilis', options: ['slow', 'fast', 'quiet'], correct: 'fast' },
      { sample: 'malinis ↔ clean', prompt: 'Itugma ang salita: malinis', options: ['clean', 'dirty', 'small'], correct: 'clean' },
    ],
    'letter-pop': [
      { sample: 'ma + ___ = malaki', prompt: 'ma + ___ = 📏', prefix: 'ma', resultEmoji: '📏', resultWord: 'malaki', clue: 'Hindi maliit.', options: ['laki', 'saya', 'linis'], correct: 'laki', instruction: 'Piliin ang pantig na bubuo sa salita.' },
      { sample: 'ma + ___ = masaya', prompt: 'ma + ___ = 😊', prefix: 'ma', resultEmoji: '😊', resultWord: 'masaya', clue: 'Nakakaramdam ng tuwa.', options: ['saya', 'laki', 'ganda'], correct: 'saya', instruction: 'Piliin ang pantig na bubuo sa salita.' },
      { sample: 'ma + ___ = mabait', prompt: 'ma + ___ = 🤝', prefix: 'ma', resultEmoji: '🤝', resultWord: 'mabait', clue: 'Magalang at tumutulong.', options: ['bait', 'bilis', 'tamis'], correct: 'bait', instruction: 'Piliin ang pantig na bubuo sa salita.' },
    ],
    'picture-guess': [
      { sample: '📚 → aklat', prompt: 'Ano ang nasa larawan? 📚', imageEmoji: '📚', options: ['aklat', 'lapis', 'bag'], correct: 'aklat' },
      { sample: '✏️ → lapis', prompt: 'Ano ang nasa larawan? ✏️', imageEmoji: '✏️', options: ['papel', 'lapis', 'aklat'], correct: 'lapis' },
      { sample: '🎒 → bag', prompt: 'Ano ang nasa larawan? 🎒', imageEmoji: '🎒', options: ['mesa', 'bag', 'upuan'], correct: 'bag' },
    ],
    'sentence-builder': [
      { sample: 'Ang bata ay nagbabasa.', prompt: 'Buuin ang pangungusap: Ang bata ay nagbabasa.', options: ['Ang', 'bata', 'ay', 'nagbabasa'], choices: ['Ang', 'bata', 'ay', 'nagbabasa'], correct: 'Ang bata ay nagbabasa', answer: 'Ang bata ay nagbabasa' },
      { sample: 'Masaya ang aking pamilya.', prompt: 'Buuin ang pangungusap: Masaya ang aking pamilya.', options: ['Masaya', 'ang', 'aking', 'pamilya'], choices: ['Masaya', 'ang', 'aking', 'pamilya'], correct: 'Masaya ang aking pamilya', answer: 'Masaya ang aking pamilya' },
      { sample: 'Naglalaro kami sa parke.', prompt: 'Buuin ang pangungusap: Naglalaro kami sa parke.', options: ['Naglalaro', 'kami', 'sa', 'parke'], choices: ['Naglalaro', 'kami', 'sa', 'parke'], correct: 'Naglalaro kami sa parke', answer: 'Naglalaro kami sa parke' },
    ],
    'story-quest': [
      { sample: 'Naglinis si Rosa.', prompt: 'Bakit naglinis si Rosa?', story: 'Naglinis si Rosa ng silid upang maging maayos ito.', options: ['Para maging maayos', 'Para maglaro', 'Para matulog'], correct: 'Para maging maayos' },
      { sample: 'Nagtanim ang magkaklase.', prompt: 'Ano ang itinanim nila?', story: 'Nagtanim ng gulay ang magkaklase sa hardin.', options: ['Gulay', 'Laruan', 'Bato'], correct: 'Gulay' },
      { sample: 'Maaga pumasok si Leo.', prompt: 'Kailan pumasok si Leo?', story: 'Maagang pumasok si Leo upang hindi mahuli sa klase.', options: ['Maaga', 'Gabi', 'Tanghali'], correct: 'Maaga' },
    ],
  },

  3: {
    'word-match': [
      { sample: 'masipag ↔ diligent', prompt: 'Itugma ang salita: masipag', options: ['diligent', 'lazy', 'noisy'], correct: 'diligent' },
      { sample: 'matapat ↔ honest', prompt: 'Itugma ang salita: matapat', options: ['honest', 'afraid', 'wide'], correct: 'honest' },
      { sample: 'maingat ↔ careful', prompt: 'Itugma ang salita: maingat', options: ['careful', 'careless', 'fast'], correct: 'careful' },
    ],
    'picture-guess': [
      { sample: '🌾 → palayan', prompt: 'Ano ang ipinapakita ng larawan? 🌾', imageEmoji: '🌾', options: ['palayan', 'dagat', 'bundok'], correct: 'palayan' },
      { sample: '🏞️ → ilog', prompt: 'Ano ang anyong tubig na ito? 🏞️', imageEmoji: '🏞️', options: ['ilog', 'kalsada', 'paaralan'], correct: 'ilog' },
      { sample: '🏫 → paaralan', prompt: 'Ano ang gusaling ito? 🏫', imageEmoji: '🏫', options: ['paaralan', 'palengke', 'ospital'], correct: 'paaralan' },
    ],
    'sentence-builder': [
      { sample: 'Nag-aaral nang mabuti ang mga bata.', prompt: 'Buuin ang pangungusap.', options: ['Nag-aaral', 'nang', 'mabuti', 'ang', 'mga', 'bata'], choices: ['Nag-aaral', 'nang', 'mabuti', 'ang', 'mga', 'bata'], correct: 'Nag-aaral nang mabuti ang mga bata', answer: 'Nag-aaral nang mabuti ang mga bata' },
      { sample: 'Tumutulong kami sa paglilinis ng silid.', prompt: 'Buuin ang pangungusap.', options: ['Tumutulong', 'kami', 'sa', 'paglilinis', 'ng', 'silid'], choices: ['Tumutulong', 'kami', 'sa', 'paglilinis', 'ng', 'silid'], correct: 'Tumutulong kami sa paglilinis ng silid', answer: 'Tumutulong kami sa paglilinis ng silid' },
      { sample: 'Binasa ni Lara ang maikling kuwento.', prompt: 'Buuin ang pangungusap.', options: ['Binasa', 'ni', 'Lara', 'ang', 'maikling', 'kuwento'], choices: ['Binasa', 'ni', 'Lara', 'ang', 'maikling', 'kuwento'], correct: 'Binasa ni Lara ang maikling kuwento', answer: 'Binasa ni Lara ang maikling kuwento' },
    ],
    'story-quest': [
      { sample: 'Nagtipid ng tubig.', prompt: 'Ano ang aral ng kuwento?', story: 'Isinara ni Mila ang gripo matapos gamitin upang hindi masayang ang tubig.', options: ['Magtipid ng tubig', 'Maglaro sa ulan', 'Iwanang bukas ang gripo'], correct: 'Magtipid ng tubig' },
      { sample: 'Tumulong sa kaklase.', prompt: 'Ano ang ginawa ni Jun?', story: 'Tinulungan ni Jun ang kaklase niyang nahulog ang mga aklat.', options: ['Tumulong', 'Tumakbo', 'Nagtago'], correct: 'Tumulong' },
      { sample: 'Nagbasa bago matulog.', prompt: 'Kailan nagbasa si Ana?', story: 'Bago matulog, nagbasa si Ana ng alamat.', options: ['Bago matulog', 'Habang kumakain', 'Pagkatapos maligo'], correct: 'Bago matulog' },
    ],
  },

  4: {
    'word-match': [
      { sample: 'pagkakaisa ↔ unity', prompt: 'Itugma ang salita: pagkakaisa', options: ['unity', 'argument', 'silence'], correct: 'unity' },
      { sample: 'pananagutan ↔ responsibility', prompt: 'Itugma ang salita: pananagutan', options: ['responsibility', 'reward', 'mistake'], correct: 'responsibility' },
      { sample: 'paggalang ↔ respect', prompt: 'Itugma ang salita: paggalang', options: ['respect', 'fear', 'noise'], correct: 'respect' },
    ],
    'picture-guess': [
      { sample: '♻️ → pagre-recycle', prompt: 'Anong gawain ang ipinapakita? ♻️', imageEmoji: '♻️', options: ['pagre-recycle', 'pagtatapon', 'pagputol'], correct: 'pagre-recycle' },
      { sample: '🧹 → paglilinis', prompt: 'Anong gawain ang ipinapakita? 🧹', imageEmoji: '🧹', options: ['pagluluto', 'paglilinis', 'pagsasayaw'], correct: 'paglilinis' },
      { sample: '🤝 → pagtutulungan', prompt: 'Anong pagpapahalaga ang ipinapakita? 🤝', imageEmoji: '🤝', options: ['pagtutulungan', 'pag-iisa', 'pag-aaway'], correct: 'pagtutulungan' },
    ],
    'sentence-builder': [
      { sample: 'Ang bawat mamamayan ay may pananagutan sa komunidad.', prompt: 'Buuin ang pangungusap.', options: ['Ang', 'bawat', 'mamamayan', 'ay', 'may', 'pananagutan', 'sa', 'komunidad'], choices: ['Ang', 'bawat', 'mamamayan', 'ay', 'may', 'pananagutan', 'sa', 'komunidad'], correct: 'Ang bawat mamamayan ay may pananagutan sa komunidad', answer: 'Ang bawat mamamayan ay may pananagutan sa komunidad' },
      { sample: 'Mahalaga ang pagkakaisa sa panahon ng sakuna.', prompt: 'Buuin ang pangungusap.', options: ['Mahalaga', 'ang', 'pagkakaisa', 'sa', 'panahon', 'ng', 'sakuna'], choices: ['Mahalaga', 'ang', 'pagkakaisa', 'sa', 'panahon', 'ng', 'sakuna'], correct: 'Mahalaga ang pagkakaisa sa panahon ng sakuna', answer: 'Mahalaga ang pagkakaisa sa panahon ng sakuna' },
      { sample: 'Iginagalang natin ang karapatan ng kapwa.', prompt: 'Buuin ang pangungusap.', options: ['Iginagalang', 'natin', 'ang', 'karapatan', 'ng', 'kapwa'], choices: ['Iginagalang', 'natin', 'ang', 'karapatan', 'ng', 'kapwa'], correct: 'Iginagalang natin ang karapatan ng kapwa', answer: 'Iginagalang natin ang karapatan ng kapwa' },
    ],
    'story-quest': [
      { sample: 'Bayanihan sa barangay.', prompt: 'Ano ang ipinakita ng mga tao?', story: 'Nagtulungan ang mga tao sa barangay upang linisin ang kanal bago dumating ang malakas na ulan.', options: ['Bayanihan', 'Katamaran', 'Pag-iwas'], correct: 'Bayanihan' },
      { sample: 'Paggalang sa matanda.', prompt: 'Anong pagpapahalaga ang ipinakita?', story: 'Tumayo si Carlo upang paupuin ang matandang pasahero sa jeep.', options: ['Paggalang', 'Pagmamataas', 'Pagkalimot'], correct: 'Paggalang' },
      { sample: 'Pananagutan sa gawain.', prompt: 'Bakit bumalik si Lea?', story: 'Bumalik si Lea sa silid upang ayusin ang mga ginamit niyang kagamitan.', options: ['May pananagutan siya', 'Nagalit siya', 'Naglaro siya'], correct: 'May pananagutan siya' },
    ],
  },

  5: {
    'word-match': [
      { sample: 'paninindigan ↔ conviction', prompt: 'Itugma ang salita: paninindigan', options: ['conviction', 'confusion', 'celebration'], correct: 'conviction' },
      { sample: 'mapanuri ↔ critical', prompt: 'Itugma ang salita: mapanuri', options: ['critical', 'careless', 'ordinary'], correct: 'critical' },
      { sample: 'makabuluhan ↔ meaningful', prompt: 'Itugma ang salita: makabuluhan', options: ['meaningful', 'temporary', 'silent'], correct: 'meaningful' },
    ],
    'picture-guess': [
      { sample: '📰 → balita', prompt: 'Anong uri ng teksto ang ipinapakita? 📰', imageEmoji: '📰', options: ['balita', 'alamat', 'tula'], correct: 'balita' },
      { sample: '📢 → patalastas', prompt: 'Ano ang ipinapakita ng larawan? 📢', imageEmoji: '📢', options: ['patalastas', 'liham', 'talaarawan'], correct: 'patalastas' },
      { sample: '📊 → datos', prompt: 'Ano ang ipinapakita ng larawan? 📊', imageEmoji: '📊', options: ['datos', 'laruan', 'awit'], correct: 'datos' },
    ],
    'sentence-builder': [
      { sample: 'Sinuri ng mag-aaral ang mahahalagang detalye sa balita.', prompt: 'Buuin ang pangungusap.', options: ['Sinuri', 'ng', 'mag-aaral', 'ang', 'mahahalagang', 'detalye', 'sa', 'balita'], choices: ['Sinuri', 'ng', 'mag-aaral', 'ang', 'mahahalagang', 'detalye', 'sa', 'balita'], correct: 'Sinuri ng mag-aaral ang mahahalagang detalye sa balita', answer: 'Sinuri ng mag-aaral ang mahahalagang detalye sa balita' },
      { sample: 'May paninindigan ang batang marunong mangatwiran.', prompt: 'Buuin ang pangungusap.', options: ['May', 'paninindigan', 'ang', 'batang', 'marunong', 'mangatwiran'], choices: ['May', 'paninindigan', 'ang', 'batang', 'marunong', 'mangatwiran'], correct: 'May paninindigan ang batang marunong mangatwiran', answer: 'May paninindigan ang batang marunong mangatwiran' },
      { sample: 'Makabuluhan ang tekstong nagbibigay ng wastong impormasyon.', prompt: 'Buuin ang pangungusap.', options: ['Makabuluhan', 'ang', 'tekstong', 'nagbibigay', 'ng', 'wastong', 'impormasyon'], choices: ['Makabuluhan', 'ang', 'tekstong', 'nagbibigay', 'ng', 'wastong', 'impormasyon'], correct: 'Makabuluhan ang tekstong nagbibigay ng wastong impormasyon', answer: 'Makabuluhan ang tekstong nagbibigay ng wastong impormasyon' },
    ],
    'story-quest': [
      { sample: 'Pagsusuri ng balita.', prompt: 'Ano ang dapat gawin bago maniwala sa balita?', story: 'Binasa ni Marco ang balita at inalam muna kung mapagkakatiwalaan ang pinagmulan nito.', options: ['Suriin ang pinagmulan', 'Ibahagi agad', 'Balewalain lahat'], correct: 'Suriin ang pinagmulan' },
      { sample: 'Patalastas.', prompt: 'Ano ang layunin ng patalastas?', story: 'Gumamit ang patalastas ng makukulay na larawan upang hikayatin ang mga mamimili.', options: ['Manghikayat', 'Magtago ng impormasyon', 'Magbigay ng pagsusulit'], correct: 'Manghikayat' },
      { sample: 'Opinyon at katotohanan.', prompt: 'Alin ang dapat paghiwalayin sa pagbasa?', story: 'Ipinaliwanag ng guro na mahalagang pag-iba-ibahin ang katotohanan at opinyon sa teksto.', options: ['Katotohanan at opinyon', 'Pamagat at kulay', 'Papel at lapis'], correct: 'Katotohanan at opinyon' },
    ],
  },

  6: {
    'word-match': [
      { sample: 'pananaw ↔ perspective', prompt: 'Itugma ang salita: pananaw', options: ['perspective', 'prediction', 'permission'], correct: 'perspective' },
      { sample: 'implikasyon ↔ implication', prompt: 'Itugma ang salita: implikasyon', options: ['implication', 'instruction', 'imitation'], correct: 'implication' },
      { sample: 'pangangatwiran ↔ reasoning', prompt: 'Itugma ang salita: pangangatwiran', options: ['reasoning', 'guessing', 'drawing'], correct: 'reasoning' },
    ],
    'picture-guess': [
      { sample: '⚖️ → katarungan', prompt: 'Anong konsepto ang ipinapakita? ⚖️', imageEmoji: '⚖️', options: ['katarungan', 'kasiyahan', 'katahimikan'], correct: 'katarungan' },
      { sample: '🗣️ → talakayan', prompt: 'Anong gawain ang ipinapakita? 🗣️', imageEmoji: '🗣️', options: ['talakayan', 'pagtulog', 'pagpipinta'], correct: 'talakayan' },
      { sample: '🧠 → pagsusuri', prompt: 'Anong kasanayan ang ipinapakita? 🧠', imageEmoji: '🧠', options: ['pagsusuri', 'paghula', 'pagtakbo'], correct: 'pagsusuri' },
    ],
    'sentence-builder': [
      { sample: 'Mahusay na ipinahayag ng pangkat ang kanilang pananaw.', prompt: 'Buuin ang pangungusap.', options: ['Mahusay', 'na', 'ipinahayag', 'ng', 'pangkat', 'ang', 'kanilang', 'pananaw'], choices: ['Mahusay', 'na', 'ipinahayag', 'ng', 'pangkat', 'ang', 'kanilang', 'pananaw'], correct: 'Mahusay na ipinahayag ng pangkat ang kanilang pananaw', answer: 'Mahusay na ipinahayag ng pangkat ang kanilang pananaw' },
      { sample: 'Mahalagang ipaliwanag ang ebidensiya sa bawat pangangatwiran.', prompt: 'Buuin ang pangungusap.', options: ['Mahalagang', 'ipaliwanag', 'ang', 'ebidensiya', 'sa', 'bawat', 'pangangatwiran'], choices: ['Mahalagang', 'ipaliwanag', 'ang', 'ebidensiya', 'sa', 'bawat', 'pangangatwiran'], correct: 'Mahalagang ipaliwanag ang ebidensiya sa bawat pangangatwiran', answer: 'Mahalagang ipaliwanag ang ebidensiya sa bawat pangangatwiran' },
      { sample: 'May implikasyon sa lipunan ang maling impormasyon.', prompt: 'Buuin ang pangungusap.', options: ['May', 'implikasyon', 'sa', 'lipunan', 'ang', 'maling', 'impormasyon'], choices: ['May', 'implikasyon', 'sa', 'lipunan', 'ang', 'maling', 'impormasyon'], correct: 'May implikasyon sa lipunan ang maling impormasyon', answer: 'May implikasyon sa lipunan ang maling impormasyon' },
    ],
    'story-quest': [
      { sample: 'Pananaw ng tauhan.', prompt: 'Ano ang kailangang unawain sa teksto?', story: 'Sa talakayan, inihambing ng mga mag-aaral ang magkaibang pananaw ng dalawang tauhan.', options: ['Pananaw ng tauhan', 'Kulay ng papel', 'Bilang ng pahina'], correct: 'Pananaw ng tauhan' },
      { sample: 'Ebidensiya sa argumento.', prompt: 'Ano ang nagpapalakas sa pangangatwiran?', story: 'Gumamit si Nia ng datos at halimbawa upang patunayan ang kaniyang sagot.', options: ['Ebidensiya', 'Hula', 'Palakasan ng boses'], correct: 'Ebidensiya' },
      { sample: 'Implikasyon ng impormasyon.', prompt: 'Ano ang dapat isipin matapos basahin?', story: 'Matapos basahin ang artikulo, tinalakay ng klase ang maaaring epekto nito sa komunidad.', options: ['Implikasyon', 'Petsa lamang', 'Larawan lamang'], correct: 'Implikasyon' },
    ],
  },
});

function getMissionQuestionPoolForGrade(missionId, gradeLevel = 1) {
  const key = normalizeMissionQuestionKey(missionId);
  const grade = Math.max(1, Math.min(6, Number(String(gradeLevel).match(/\d+/)?.[0] || 1)));
  const gradePool = GRADE_MISSION_QUESTION_POOLS[grade]?.[key];

  if (Array.isArray(gradePool) && gradePool.length) {
    return gradePool;
  }

  return MISSION_QUESTION_POOLS[key] || [];
}


function buildMissionQuestionSetForAttempt(
  missionId,
  attemptNo = 1,
  sessionSeed = '',
  limit = 3,
  gradeLevel = 1
) {
  const key = normalizeMissionQuestionKey(missionId);
  const pool = getMissionQuestionPoolForGrade(key, gradeLevel);

  if (!pool.length) {
    return [];
  }

  const safeAttempt = Math.max(
    1,
    Math.min(MAX_MISSION_ATTEMPTS, Number(attemptNo) || 1)
  );

  const shuffled = pool
    .map((question, index) => ({
      question,
      sort: seededMissionRandom(
        `${key}:${sessionSeed}:pool-order:${index}`
      ),
    }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.question);

  const offset = (safeAttempt - 1) % shuffled.length;
  const rotated = [
    ...shuffled.slice(offset),
    ...shuffled.slice(0, offset),
  ];

  return rotated
    .slice(0, Math.min(limit, rotated.length))
    .map((question, index) => ({
      ...question,
      id:
        question.id ||
        `${key}-attempt-${safeAttempt}-question-${index + 1}`,
      questionNo: index + 1,
      questionSetAttemptNo: safeAttempt,
    }));
}

function pickMissionQuestionForAttempt(
  missionId,
  attemptNo = 1,
  sessionSeed = '',
  gradeLevel = 1
) {
  const key = normalizeMissionQuestionKey(missionId);
  const attemptQuestions = buildMissionQuestionSetForAttempt(
    key,
    attemptNo,
    sessionSeed,
    3,
    gradeLevel
  );

  if (!attemptQuestions.length) {
    return {};
  }

  const safeAttempt = Math.max(
    1,
    Math.min(MAX_MISSION_ATTEMPTS, Number(attemptNo) || 1)
  );

  const firstQuestion = attemptQuestions[0];

  return {
    ...firstQuestion,
    questionPool: attemptQuestions,
    questions: attemptQuestions,
    attemptQuestions,
    questionPoolSize: attemptQuestions.length,
    questionPoolAttemptNo: safeAttempt,
  };
}

const DEMOS = {
  'word-match': {
    id: 'word-match',
    module: 'Bokabularyo',
    title: 'Pagtutugma ng Salita',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    prompt: 'Piliin ang tamang pares: aso → ?',
    options: [
      'larawan ng aso',
      'larawan ng bahay',
      'larawan ng pusa',
    ],
    correct: 'larawan ng aso',
    xp: 15,
    icon: '🧩',
  },

  'letter-pop': {
    id: 'letter-pop',
    module: 'Pagbasa',
    title: 'Pagpili ng Titik',
    sample: 'pu + ___ = 🌳',
    prompt: 'pu + ___ = 🌳',
    options: ['no', 'la', 'sa'],
    correct: 'no',
    xp: 12,
    icon: '🎈',
    baseStatus: 'Handa na',
    short: 'Piliin ang pantig na bubuo sa salita!',
    missionLabel: 'Misyong Pantig',
    prefix: 'pu',
    resultEmoji: '🌳',
    resultWord: 'puno',
    clue: 'Halamang may katawan, sanga, at dahon.',
    instruction: 'Tap the balloon na bubuo sa salita. Kapag tama, pop!',
},

  'picture-guess': {
    id: 'picture-guess',
    module: 'Bokabularyo',
    title: 'Hulaan ang Larawan',
    sample: 'larawan ng pusa → pusa',
    prompt: 'larawan ng pusa → pusa',
    options: ['pusa', 'aso', 'ibon'],
    correct: 'pusa',
    xp: 12,
    icon: '🖼️',
  },

  'sentence-builder': {
    id: 'sentence-builder',
    module: 'Pagsulat',
    title: 'Pagbuo ng Pangungusap',
    sample: 'Ako / ay / bata.',
    prompt: 'Ako / ay / bata.',
    options: [
      'Ako ay bata.',
      'Ay bata ako.',
      'Bata ako ay.',
    ],
    correct: 'Ako ay bata.',
    xp: 18,
    icon: '🧱',
  },

  'story-quest': {
    id: 'story-quest',
    module: 'Panitikan',
    title: 'Pag-unawa sa Kuwento',
    sample: 'Sino ang pangunahing tauhan?',
    prompt: 'Si Milo ay isang mabait na pusa. Mahilig siyang matulog sa tabi ng bintana. Sino ang pangunahing tauhan?',
    options: ['Milo', 'Ana', 'Payong'],
    correct: 'Milo',
    xp: 20,
    icon: '📖',
  },

  'sound-and-say': {
    id: 'sound-and-say',
    module: 'Oral Comm',
    title: 'Pakikinig at Pagbigkas',
    sample: 'Magandang umaga po.',
    prompt: 'Magandang umaga po.',
    options: ['Nasabi ko na!', 'Ulitin ko muna'],
    correct: 'Nasabi ko na!',
    xp: 15,
    icon: '🎙️',
  },
};

export default function MissionGameScreen({ navigation, route }) {
  const missionId = route?.params?.missionId;
  const missionApiId = route?.params?.missionApiId || missionId;

  const exitWhenMissionAttemptsRunOut = (completionData = {}) => {
    const attemptsUsed = Number(
      completionData.attemptsUsed ??
      completionData.attemptNo ??
      missionAttemptNo
    );

    const attemptLimit = Number(
      completionData.maxAttempts ??
      MAX_MISSION_ATTEMPTS ??
      5
    );

    if (
      Number.isFinite(attemptsUsed) &&
      Number.isFinite(attemptLimit) &&
      attemptsUsed >= attemptLimit
    ) {
      navigation.goBack();
      return true;
    }

    return false;
  };
  const routeMission = route?.params?.mission || {};
  const gradeLevel = Number(route?.params?.gradeLevel ?? 1);
  const sessionQuestionSeed = useMemo(
    () => `${Date.now()}-${Math.random()}`,
    [missionId, missionApiId]
  );

  const initialMissionAttemptNo = useMemo(
    () => getMissionAttemptNoForQuestion(routeMission),
    [routeMission]
  );

  const [missionAttemptNo, setMissionAttemptNo] = useState(initialMissionAttemptNo);

  useEffect(() => {
    setMissionAttemptNo(initialMissionAttemptNo);
  }, [initialMissionAttemptNo, missionId, missionApiId]);

  const baseMission = useMemo(
    () => {
      const fallback = DEMOS[missionId] || DEMOS['word-match'];
      const attemptNo = Math.max(
        1,
        Math.min(MAX_MISSION_ATTEMPTS, missionAttemptNo)
      );
      const randomQuestion = pickMissionQuestionForAttempt(
        missionId || fallback.id,
        attemptNo,
        sessionQuestionSeed,
        gradeLevel
      );

      return {
        ...fallback,
        ...routeMission,
        ...randomQuestion,
        id: missionId || fallback.id,
        missionId: missionApiId,
        xp: Number(routeMission.xpReward ?? routeMission.xp ?? fallback.xp ?? 0),
        title: getTagalogMissionTitle(missionId, fallback.title || routeMission.title),
        module: routeMission.module || fallback.module,
        icon: routeMission.icon || fallback.icon,
        sample: randomQuestion.sample || routeMission.sample || fallback.sample,
        prompt: randomQuestion.prompt || routeMission.prompt || fallback.prompt,
        options: randomQuestion.options || routeMission.options || fallback.options,
        correct: randomQuestion.correct || routeMission.correct || fallback.correct,
        answer:
          randomQuestion.answer ??
          routeMission.answer ??
          fallback.answer ??
          randomQuestion.correct ??
          routeMission.correct ??
          fallback.correct,
        choices:
          randomQuestion.choices ||
          routeMission.choices ||
          fallback.choices ||
          randomQuestion.options ||
          routeMission.options ||
          fallback.options,
        prefix: randomQuestion.prefix || routeMission.prefix || fallback.prefix,
        resultEmoji:
          randomQuestion.resultEmoji ||
          routeMission.resultEmoji ||
          fallback.resultEmoji,
        resultWord:
          randomQuestion.resultWord ||
          routeMission.resultWord ||
          fallback.resultWord,
        clue: randomQuestion.clue || routeMission.clue || fallback.clue,
        story: randomQuestion.story || routeMission.story || fallback.story,
        imageEmoji:
          randomQuestion.imageEmoji ||
          routeMission.imageEmoji ||
          fallback.imageEmoji,
        targetText:
          randomQuestion.targetText ||
          routeMission.targetText ||
          fallback.targetText,
        phrase: randomQuestion.phrase || routeMission.phrase || fallback.phrase,
        instruction:
          randomQuestion.instruction ||
          routeMission.instruction ||
          fallback.instruction,
        questionPool:
          randomQuestion.questionPool ||
          randomQuestion.questions ||
          [],
        questions:
          randomQuestion.questions ||
          randomQuestion.questionPool ||
          [],
        attemptQuestions:
          randomQuestion.attemptQuestions ||
          randomQuestion.questions ||
          randomQuestion.questionPool ||
          [],
        questionPoolSize:
          randomQuestion.questionPoolSize ||
          randomQuestion.questionPool?.length ||
          randomQuestion.questions?.length ||
          0,
        questionPoolAttemptNo: randomQuestion.questionPoolAttemptNo || attemptNo,
      };
    },
    [missionId, missionApiId, routeMission, sessionQuestionSeed, missionAttemptNo, gradeLevel]
  );

  const mission = useMemo(() => {
    if (missionId !== 'sound-and-say') {
      return {
        ...baseMission,
        gradeLevel,
      };
    }

    const level = soundAndSayLevelForGrade(gradeLevel);

    return {
      ...baseMission,
      prompt: level.prompt,
      difficulty: level.difficulty,
      guide: level.guide,
      gradeLevel,
    };
  }, [baseMission, gradeLevel, missionId]);

  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [attempts, setAttempts] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [badgePopup, setBadgePopup] = useState(null);
  const badgeScale = useRef(new Animated.Value(0.6)).current;
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const recordingBusyRef = useRef(false);
  const [recording, setRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [soundStatus, setSoundStatus] = useState('');
  const [missionNotice, setMissionNotice] = useState(null);

  const stars =
    attempts <= 1 ? '⭐⭐⭐' :
    attempts === 2 ? '⭐⭐' :
    '⭐';

  const achievement =
    attempts <= 1
      ? null
      : attempts === 2
      ? {
          title: '🌟 Bituin sa Pag-aaral',
          message: 'Natuto ka sa iyong pagkakamali at nagtagumpay!',
        }
      : {
          title: '💪 Hindi Sumusuko',
          message: 'Ang pagtitiyaga ay susi sa tagumpay.',
        };

  useEffect(() => () => {
    soundRef.current?.unloadAsync?.();
    recordingRef.current?.stopAndUnloadAsync?.();
  }, []);

  useEffect(() => {
    if (!badgePopup) return undefined;

    Animated.spring(badgeScale, {
      toValue: 1,
      friction: 7,
      tension: 60,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(badgeScale, {
        toValue: 0.9,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setBadgePopup(null);
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, [badgePopup, badgeScale]);

  useEffect(() => {
    if (!missionNotice) return undefined;

    const timer = setTimeout(() => {
      setMissionNotice(null);
    }, 4200);

    return () => clearTimeout(timer);
  }, [missionNotice]);

  const showMissionNotice = (message, emoji = '🌈') => {
    setMissionNotice({
      title: 'Magaling!',
      message,
      emoji,
    });
  };

  const cleanupSoundAndSayRecording = async () => {
    const activeRecording = recordingRef.current;

    recordingRef.current = null;
    setRecording(false);

    if (!activeRecording) {
      return;
    }

    try {
      await activeRecording.stopAndUnloadAsync();
    } catch (err) {
      try {
        await activeRecording._cleanupForUnloadedRecorder?.();
      } catch (cleanupErr) {
        // Best-effort cleanup only.
      }
    }
  };

  const startSoundAndSayRecording = async () => {
    if (recordingBusyRef.current) {
      return;
    }

    recordingBusyRef.current = true;

    try {
      await soundRef.current?.unloadAsync?.();
      soundRef.current = null;

      await cleanupSoundAndSayRecording();
      setRecordingUri('');
      setSoundStatus('');

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Mikropono',
          'Kailangan ang pahintulot sa mikropono upang maitala ang iyong pagbigkas.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const result = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = result.recording;
      setRecording(true);
      setSoundStatus('Nagre-record... magsalita nang malinaw.');
    } catch (err) {
      await cleanupSoundAndSayRecording();
      setSoundStatus('');
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi masimulan ang pagre-record.'
      );
    } finally {
      recordingBusyRef.current = false;
    }
  };

  const stopSoundAndSayRecording = async () => {
    if (recordingBusyRef.current) {
      return;
    }

    recordingBusyRef.current = true;

    try {
      const activeRecording = recordingRef.current;

      if (!activeRecording) {
        setRecording(false);
        return;
      }

      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();

      recordingRef.current = null;
      setRecording(false);
      setRecordingUri(uri || '');
      setSoundStatus(uri ? 'Naitala na ang iyong boses. Maaari mo itong pakinggan o tapusin ang misyon.' : '');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      recordingRef.current = null;
      setRecording(false);
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi matapos ang pagre-record.'
      );
    } finally {
      recordingBusyRef.current = false;
    }
  };

  const playSoundAndSayRecording = async () => {
    if (!recordingUri) {
      Alert.alert('Sound and Say', 'I-record muna ang iyong boses.');
      return;
    }

    try {
      await soundRef.current?.unloadAsync?.();

      const result = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      soundRef.current = result.sound;
      setSoundStatus('Pinapatugtog ang iyong naitalang boses...');
    } catch (err) {
      Alert.alert(
        'May Problema sa Pagpapatugtog',
        err.message || 'Hindi mapatugtog ang iyong naitalang boses.'
      );
    }
  };

  const clearSoundAndSayRecording = async () => {
    await cleanupSoundAndSayRecording();
    await soundRef.current?.unloadAsync?.();
    soundRef.current = null;
    setRecordingUri('');
    setSoundStatus('');
  };

  const completeSoundAndSayMission = () => {
    if (!recordingUri) {
      Alert.alert(
        'Sound and Say',
        'I-record muna ang iyong boses bago tapusin ang misyong ito.'
      );
      return;
    }

    handleSubmit({ forceComplete: true });
  };

  const handleSubmit = async ({ forceComplete = false } = {}) => {
    const success =
      forceComplete || selected === mission.correct;

    if (success) {
      try {
        setSubmitting(true);

        void 0;

        const data = await api(`/missions/${missionApiId}/complete`, {
          method: 'POST',
          body: {
            challengeId: `attempt-${missionAttemptNo}-${Date.now()}`,
            challengeTitle: `Pagsubok ${missionAttemptNo} sa ${MAX_MISSION_ATTEMPTS}`,
            attemptNo: missionAttemptNo,
            claimBituin: missionAttemptNo >= MAX_MISSION_ATTEMPTS,
          },
        });

        void 0;

        setCompletionResult(data);

        if (Array.isArray(data?.newBadges) && data.newBadges.length) {
          setBadgePopup(data.newBadges[0]);
        }

        await persistMissionAttemptUpdate({
          missionApiId,
          missionId,
          gameId: mission.id,
          attemptNo: missionAttemptNo,
          maxAttempts: MAX_MISSION_ATTEMPTS,
        });

        if (exitWhenMissionAttemptsRunOut(data)) {
          return;
        }

        setCompleted(true);
      } catch (err) {
        showMissionNotice(
          friendlyMissionErrorMessage(err.message),
          '🌟'
        );
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setAttempts((a) => a + 1);

    Alert.alert(
      'Maling Sagot',
      `❌ Mali ang sagot.\n\n✅ Tamang sagot: ${mission.correct}`
    );
  };

  const missionNoticePopup = missionNotice ? (
    <View style={styles.missionNoticeOverlay}>
      <View style={styles.missionNoticeCard}>
        <Text style={styles.missionNoticeEmoji}>
          {missionNotice.emoji}
        </Text>

        <View style={styles.missionNoticeBody}>
          <Text style={styles.missionNoticeTitle}>
            {missionNotice.title}
          </Text>

          <Text style={styles.missionNoticeMessage}>
            {missionNotice.message}
          </Text>

          <TouchableOpacity
            style={styles.missionNoticeButton}
            onPress={() => setMissionNotice(null)}
            activeOpacity={0.85}
          >
            <Text style={styles.missionNoticeButtonText}>
              Nauunawaan Ko!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : null;

  if (completed) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissionCompleteModal
          title="🎉 Natapos ang Gawain!"
          xp={mission.xp}
          stars={stars}
          attempts={attempts}
          achievement={achievement}
          badge={completionResult?.bituinBadge || completionResult?.newBadges?.[0] || badgePopup}
          primaryLabel={
            missionAttemptNo >= MAX_MISSION_ATTEMPTS
              ? '⭐ Kunin ang Bituin'
              : '↻ Maglaro Muli'
          }
          primaryAction={
            missionAttemptNo >= MAX_MISSION_ATTEMPTS
              ? 'back'
              : 'replay'
          }
          onReplay={() => {
            if (missionAttemptNo >= MAX_MISSION_ATTEMPTS) {
              showMissionNotice(
                `Naubos mo na ang lahat ng ${MAX_MISSION_ATTEMPTS} pagsubok para sa misyong ito. Magaling! Subukan ang ibang misyon o balikan ang iyong mga natutuhan.`,
                '🎉'
              );
              return;
            }

            setSelected(null);
            setCompletionResult(null);
            setCompleted(false);
            setAttempts(1);
            setMissionAttemptNo((value) => Math.min(value + 1, MAX_MISSION_ATTEMPTS));
            setRecordingUri('');
            setSoundStatus('');
          }}
          onBack={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: 'MissionHome',
                  params: {
                    missionAttemptUpdate: {
                      missionApiId,
                      missionId,
                      gameId: mission.id,
                      attemptNo: missionAttemptNo,
                      maxAttempts: MAX_MISSION_ATTEMPTS,
                    },
                  },
                },
              ],
            });
          }}
        />

        {badgePopup ? (
          <Animated.View
            style={{
              position: 'absolute',
              top: 70,
              right: 16,
              left: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 18,
              borderWidth: 2,
              borderColor: '#FDE68A',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
              flexDirection: 'row',
              alignItems: 'center',
              transform: [{ scale: badgeScale }],
            }}
          >
            <Image
              source={getBadgeImageSource(badgePopup)}
              style={styles.badgePopupImage}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              <Text style={{ color: '#D97706', fontWeight: '900', fontSize: 12 }}>
                Bagong Gantimpala!
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#92400E', marginTop: 2 }}>
                {badgePopup?.name || 'Bagong Tagumpay'}
              </Text>
              <Text style={{ color: '#78716C', marginTop: 2, fontSize: 13 }}>
                Nakamit ang Tagumpay ⭐
              </Text>
            </View>
          </Animated.View>
        ) : null}

        {missionNoticePopup}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <TouchableOpacity
          style={styles.missionBackButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.missionBackButtonText}>← Bumalik</Text>
        </TouchableOpacity>

        <MissionHeader
          title={getTagalogMissionTitle(missionId, mission.title)}
          subtitle={
            missionId === 'letter-pop'
              ? `${mission.module} misyon • Pagsubok ${missionAttemptNo} sa ${MAX_MISSION_ATTEMPTS} • +${mission.xp} preview ng XP • ${mission.baseStatus || 'Handa na'}`
              : `${mission.module} • Pagsubok ${missionAttemptNo} sa ${MAX_MISSION_ATTEMPTS} • +${mission.xp} XP`
          }
          icon={mission.icon}
        />

        {missionId === 'word-match' && (
          <WordMatchGame
            key={`word-match-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'letter-pop' && (
          <LetterPopGame
            key={`letter-pop-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'picture-guess' && (
          <PictureGuessGame
            key={`picture-guess-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'sentence-builder' && (
          <SentenceBuilderGame
            key={`sentence-builder-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'story-quest' && (
          <StoryQuestGame
            key={`story-quest-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'fill-in-the-blank' && (
          <FillInTheBlankGame
            key={`fill-in-the-blank-${missionAttemptNo}`}
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'sound-and-say' && (
          <View style={styles.soundCard}>
            <Text style={styles.soundEyebrow}>
              🔊 Pakikinig at Pagbigkas
            </Text>

            <Text style={styles.soundDifficulty}>
              {mission.difficulty}
            </Text>

            <Text style={styles.soundInstruction}>
              Basahin, bigkasin, at i-record:
            </Text>

            <View style={styles.soundPromptBox}>
              <Text style={styles.soundPrompt}>
                “{mission.prompt}”
              </Text>
            </View>

            <Text style={styles.soundHint}>
              {mission.guide}
            </Text>

            <View style={styles.recordPanel}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recording && styles.recordingButton,
                ]}
                disabled={submitting}
                onPress={recording ? stopSoundAndSayRecording : startSoundAndSayRecording}
                activeOpacity={0.85}
              >
                <Text style={styles.recordButtonText}>
                  {recording ? '⏹ Ihinto' : '🎤 Simulan'}
                </Text>
              </TouchableOpacity>

              {recordingUri ? (
                <View style={styles.recordActions}>
                  <TouchableOpacity
                    style={styles.secondarySoundButton}
                    disabled={submitting}
                    onPress={playSoundAndSayRecording}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondarySoundButtonText}>
                      ▶ Pakinggan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondarySoundButton}
                    disabled={submitting}
                    onPress={clearSoundAndSayRecording}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondarySoundButtonText}>
                      ↺ Mag-record Muli
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {soundStatus ? (
                <Text style={styles.soundStatus}>
                  {soundStatus}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.soundButton,
                (!recordingUri || submitting) && styles.soundButtonDisabled,
              ]}
              disabled={!recordingUri || submitting}
              onPress={completeSoundAndSayMission}
              activeOpacity={0.85}
            >
              <Text style={styles.soundButtonText}>
                {submitting ? 'Sine-save...' : '⭐ Kunin ang Bituin'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {missionNoticePopup}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
    content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 220,
  },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  soundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soundEyebrow: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  soundDifficulty: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },
  soundInstruction: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  soundPromptBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 14,
  },
  soundPrompt: {
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  soundHint: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  recordPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  recordButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondarySoundButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondarySoundButtonText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
  },
  soundStatus: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    lineHeight: 18,
  },
  soundButton: {
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  soundButtonDisabled: {
    opacity: 0.65,
  },
  soundButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  missionNoticeOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  missionNoticeCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FDBA74',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#9A3412',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  missionNoticeEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FED7AA',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 34,
    marginBottom: 12,
    overflow: 'hidden',
  },
  missionNoticeBody: {
    width: '100%',
    alignItems: 'center',
  },
  missionNoticeTitle: {
    color: '#7C2D12',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  missionNoticeMessage: {
    color: '#9A3412',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  missionNoticeButton: {
    backgroundColor: '#FB923C',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 18,
  },
  missionNoticeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  secondaryButton: {
    width: '100%',
    marginTop: 14,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  secondaryButtonText: {
    color: '#22C55E',
    fontWeight: '900',
    fontSize: 16,
  },
  missionBackButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#4ADE80',
    shadowColor: '#22C55E',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignSelf: 'flex-start',
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.12)',
  },
  missionBackButtonText: {
    color: '#1F2937',
    fontWeight: '800',
    fontSize: 15,
  },
  badgePopupImage: {
    width: 64,
    height: 64,
    marginRight: 12,
  },

  disabledActionButton: {
    backgroundColor: '#D1D5DB',
    borderColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledActionButtonText: {
    color: '#F9FAFB',
  },

});
