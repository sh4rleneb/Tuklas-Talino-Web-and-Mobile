import { SafeAreaView } from 'react-native-safe-area-context';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
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

function buildMissionQuestionSetForAttempt(
  missionId,
  attemptNo = 1,
  sessionSeed = '',
  limit = 3
) {
  const key = normalizeMissionQuestionKey(missionId);
  const pool = MISSION_QUESTION_POOLS[key] || [];

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
  sessionSeed = ''
) {
  const key = normalizeMissionQuestionKey(missionId);
  const attemptQuestions = buildMissionQuestionSetForAttempt(
    key,
    attemptNo,
    sessionSeed,
    3
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
        sessionQuestionSeed
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
    [missionId, missionApiId, routeMission, sessionQuestionSeed, missionAttemptNo]
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
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
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
      ? {
          title: '🏅 Mahusay na Manlalaro',
          message: 'Nasagot nang tama sa unang pagsubok!',
        }
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

  const startSoundAndSayRecording = async () => {
    try {
      await soundRef.current?.unloadAsync?.();
      soundRef.current = null;

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
      setRecordingUri('');
      setSoundStatus('Nagre-record... magsalita nang malinaw.');
    } catch (err) {
      setRecording(false);
      setSoundStatus('');
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi masimulan ang pagre-record.'
      );
    }
  };

  const stopSoundAndSayRecording = async () => {
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
    } catch (err) {
      recordingRef.current = null;
      setRecording(false);
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi matapos ang pagre-record.'
      );
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

          setTimeout(() => {
            setBadgePopup(null);
          }, 5500);
        }

        await persistMissionAttemptUpdate({
          missionApiId,
          missionId,
          gameId: mission.id,
          attemptNo: missionAttemptNo,
          maxAttempts: MAX_MISSION_ATTEMPTS,
        });

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
    paddingBottom: 170,
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
});
