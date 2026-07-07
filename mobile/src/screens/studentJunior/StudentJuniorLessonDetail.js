import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { api } from '../../api/client';
import { uploadSpeechRecording } from '../../api/teacher';
import {
  speakText,
  stopSpeech,
  isSpeechPlaying,
  getSpeechPlaybackState,
} from '../../services/tts.service';

import ReadingPassageCard from '../../components/lesson/ReadingPassageCard';
import AudioPlayerCard from '../../components/lesson/AudioPlayerCard';
import AudioPlayerButton from '../../components/lesson/AudioPlayerButton';
import ActivityVisualCard from '../../components/lesson/ActivityVisualCard';
import PowerUpTray from '../../components/lesson/PowerUpTray';
import ActivityGuideCard from '../../components/lesson/ActivityGuideCard';
import FillInBlankGame from '../../components/lesson/FillInBlankGame';

import {
  getStructuredLessonSectionText,
  getStructuredLessonKnowAudioText,
  getStructuredLessonLessonAudioText,
} from '../../utils/structuredLesson';

const BADGE_IMAGE_SOURCES = {
  'unang-hakbang': require('../../../assets/badges/unang-hakbang.png'),
  'unang hakbang': require('../../../assets/badges/unang-hakbang.png'),
  'first-lesson': require('../../../assets/badges/unang-hakbang.png'),
  first_lesson: require('../../../assets/badges/unang-hakbang.png'),

  'batang-mambabasa': require('../../../assets/badges/batang-mambabasa.png'),
  'batang mambabasa': require('../../../assets/badges/batang-mambabasa.png'),
  reader: require('../../../assets/badges/batang-mambabasa.png'),
  'reader-3': require('../../../assets/badges/batang-mambabasa.png'),
  reader_3: require('../../../assets/badges/batang-mambabasa.png'),

  'henyo-sa-pagsusulit': require('../../../assets/badges/henyo-sa-pagsusulit.png'),
  'henyo sa pagsusulit': require('../../../assets/badges/henyo-sa-pagsusulit.png'),
  'quiz-perfect': require('../../../assets/badges/henyo-sa-pagsusulit.png'),
  quiz_perfect: require('../../../assets/badges/henyo-sa-pagsusulit.png'),

  'bituin-sa-pagsagot': require('../../../assets/badges/bituin-sa-pagsagot.png'),
  'bituin sa pagsagot': require('../../../assets/badges/bituin-sa-pagsagot.png'),
  'writing-3': require('../../../assets/badges/bituin-sa-pagsagot.png'),
  writing_3: require('../../../assets/badges/bituin-sa-pagsagot.png'),

  'boses-bituin': require('../../../assets/badges/boses-bituin.png'),
  'boses bituin': require('../../../assets/badges/boses-bituin.png'),
  'speech-3': require('../../../assets/badges/boses-bituin.png'),
  speech_3: require('../../../assets/badges/boses-bituin.png'),

  'kaagapay-sa-gawain': require('../../../assets/badges/kaagapay-sa-gawain.png'),
  'kaagapay sa gawain': require('../../../assets/badges/kaagapay-sa-gawain.png'),
  'group-1': require('../../../assets/badges/kaagapay-sa-gawain.png'),
  group_1: require('../../../assets/badges/kaagapay-sa-gawain.png'),

  'bituin-ng-kasipagan': require('../../../assets/badges/bituin-ng-kasipagan.png'),
  'bituin ng kasipagan': require('../../../assets/badges/bituin-ng-kasipagan.png'),
  'xp-100': require('../../../assets/badges/bituin-ng-kasipagan.png'),
  xp_100: require('../../../assets/badges/bituin-ng-kasipagan.png'),

  'tuklas-kampeon': require('../../../assets/badges/tuklas-kampeon.png'),
  'tuklas kampeon': require('../../../assets/badges/tuklas-kampeon.png'),
  'level-10': require('../../../assets/badges/tuklas-kampeon.png'),
  level_10: require('../../../assets/badges/tuklas-kampeon.png'),
};

function normalizeBadgeSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBadgeImageUri(value = '') {
  const uri = String(value || '').trim();

  if (!uri) return '';
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith('/')) return `https://tuklastalino.com${uri}`;

  return '';
}

function getBadgeImageSource(badge = {}) {
  const slugCandidates = [
    typeof badge === 'string' ? badge : null,
    badge?.slug,
    badge?.badge_slug,
    badge?.badgeSlug,
    badge?.id,
    badge?.key,
    badge?.code,
    badge?.badge_code,
    badge?.badgeCode,
    badge?.badge_id,
    badge?.badgeId,
    badge?.name,
    badge?.badge_name,
    badge?.badgeName,
    badge?.title,
    badge?.badge?.slug,
    badge?.badge?.badge_slug,
    badge?.badge?.badgeSlug,
    badge?.badge?.id,
    badge?.badge?.key,
    badge?.badge?.code,
    badge?.badge?.badge_code,
    badge?.badge?.badgeCode,
    badge?.badge?.name,
    badge?.badge?.badge_name,
    badge?.badge?.badgeName,
    badge?.badge?.title,
  ].map(normalizeBadgeSlug).filter(Boolean);

  for (const slug of slugCandidates) {
    if (BADGE_IMAGE_SOURCES[slug]) return BADGE_IMAGE_SOURCES[slug];
  }

  const remoteUri = normalizeBadgeImageUri(
    badge?.imageUrl ||
    badge?.iconUrl ||
    badge?.badgeImageUrl ||
    badge?.image ||
    badge?.iconImage ||
    badge?.badge?.imageUrl ||
    badge?.badge?.iconUrl ||
    ''
  );

  if (remoteUri) return { uri: remoteUri };

  return BADGE_IMAGE_SOURCES['tuklas-kampeon'];
}


async function createSpeechRecording() {
  if (Audio?.Recording?.createAsync) {
    const result = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets?.HIGH_QUALITY || Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
    );

    return result?.recording;
  }

  if (typeof Audio?.Recording === 'function') {
    const recording = new Audio.Recording();
    const options =
      Audio.RecordingOptionsPresets?.HIGH_QUALITY ||
      Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY;

    if (!options) {
      throw new Error('Hindi available ang recording options sa device na ito.');
    }

    await recording.prepareToRecordAsync(options);
    await recording.startAsync();

    return recording;
  }

  throw new Error('Hindi available ang microphone recording sa device na ito. I-update ang app o Expo package.');
}


function localizeStudentVisibleMessage(value = '') {
  const original = String(value || '').trim();
  if (!original) return '';

  let message = original
    .replace(/Speech attempt saved\.?/gi, 'Naisave ang pagsubok sa pagbigkas.')
    .replace(/XP already awarded for this activity\.?/gi, 'Naibigay na ang XP para sa gawaing ito.')
    .replace(/Already awarded XP for this activity\.?/gi, 'Naibigay na ang XP para sa gawaing ito.');

  message = message
    .replace(/\s+\./g, '.')
    .replace(/\.\s*\./g, '.')
    .replace(/\s+/g, ' ')
    .trim();

  return message;
}

function optionalProgressRequest(request, fallback) {
  return request.catch((err) => {
    if (err.status === 404 || err.message === 'Route not found.') {
      return fallback;
    }

    throw err;
  });
}


const MAX_MISSION_ATTEMPTS = 2;
const MISSION_QUESTION_POOL_LIMIT = 6;

function appendMissionQuestionRows(rows, value) {
  if (!value) return;

  if (Array.isArray(value)) {
    rows.push(...value);
    return;
  }

  if (typeof value === 'object') {
    Object.values(value).forEach(item => appendMissionQuestionRows(rows, item));
  }
}

function normalizeMissionOption(option = {}, index = 0, questionKey = 'question', question = {}) {
  const isPlainText = typeof option === 'string' || typeof option === 'number';

  const rawText = isPlainText
    ? option
    : (
        option.optionText ??
        option.text ??
        option.label ??
        option.value ??
        option.answer ??
        ''
      );

  const optionText =
    String(rawText || `Sagot ${index + 1}`).trim() || `Sagot ${index + 1}`;

  const correctIndex = Number(question.correct ?? question.correctIndex);
  const correctText = String(
    question.correctAnswer ??
    question.answer ??
    question.answerText ??
    ''
  ).trim().toLowerCase();

  const isCorrect =
    (!isPlainText && Boolean(option.isCorrect || option.correct === true || option.correct === 1)) ||
    (Number.isFinite(correctIndex) && index === correctIndex) ||
    (!!correctText && optionText.trim().toLowerCase() === correctText);

  return {
    ...(isPlainText ? {} : option),
    id: String(
      isPlainText
        ? `${questionKey}-option-${index}`
        : (option.id ?? option.optionId ?? `${questionKey}-option-${index}`)
    ),
    optionText,
    text: optionText,
    isCorrect,
  };
}

function normalizeMissionQuestion(question = {}, index = 0, sourceKey = 'mission') {
  const questionKey = String(
    question.id ??
    question.questionId ??
    `${sourceKey}-question-${index}`
  );

  const questionText =
    String(
      question.question ??
      question.text ??
      question.prompt ??
      question.title ??
      `Tanong ${index + 1}`
    ).trim() || `Tanong ${index + 1}`;

  const rawOptions =
    question.options ??
    question.choices ??
    question.answers ??
    question.dataJson?.options ??
    [];

  const options = Array.isArray(rawOptions)
    ? rawOptions.map((option, optionIndex) =>
        normalizeMissionOption(option, optionIndex, questionKey, question)
      )
    : [];

  return {
    ...question,
    id: questionKey,
    question: questionText,
    text: questionText,
    options,
  };
}

function uniqueMissionQuestions(questions = []) {
  const seen = new Set();

  return questions.filter(question => {
    const key = String(question.id || question.question || question.text || '')
      .trim()
      .toLowerCase();

    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function collectMissionQuestionsFromActivity(activity = {}, rows = []) {
  appendMissionQuestionRows(rows, activity.questions);
  appendMissionQuestionRows(rows, activity.mcqQuestions);
  appendMissionQuestionRows(rows, activity.questionPool);
  appendMissionQuestionRows(rows, activity.questionPools);
  appendMissionQuestionRows(rows, activity.dataJson?.questions);
  appendMissionQuestionRows(rows, activity.dataJson?.mcqQuestions);
  appendMissionQuestionRows(rows, activity.dataJson?.questionPool);
  appendMissionQuestionRows(rows, activity.dataJson?.questionPools);

  return rows;
}

function buildMissionQuestionPool(activity = {}, lesson = {}, limit = MISSION_QUESTION_POOL_LIMIT) {
  const rows = [];

  collectMissionQuestionsFromActivity(activity, rows);

  if (rows.length < limit) {
    (lesson?.activities || [])
      .filter(item => String(item?.type || '').toLowerCase() === 'mcq')
      .forEach(item => collectMissionQuestionsFromActivity(item, rows));
  }

  return uniqueMissionQuestions(
    rows.map((question, index) =>
      normalizeMissionQuestion(
        question,
        index,
        String(activity?.id || activity?.title || lesson?.id || 'mission')
      )
    )
  ).slice(0, limit);
}

function getMissionAttemptStorageKey(lesson = {}, activity = {}) {
  const lessonKey = lesson?.id ?? lesson?.lessonId ?? lesson?.title;
  const activityKey = activity?.id ?? activity?.activityId ?? activity?.title ?? activity?.type;

  if (!lessonKey || !activityKey) return '';

  return `mission-attempts:${lessonKey}:${activityKey}`;
}

function getServerMissionAttemptCount(lesson = {}, activity = {}) {
  const candidates = [
    activity?.attemptCount,
    activity?.attemptNo,
    activity?.missionAttemptCount,
    activity?.quizAttemptCount,
    activity?.latestAttempt?.attemptNo,
    activity?.attempt?.attemptNo,
    activity?.dataJson?.attemptCount,
    activity?.dataJson?.attemptNo,
    lesson?.attemptCount,
    lesson?.quizAttemptCount,
  ];

  const arrays = [
    activity?.attempts,
    activity?.missionAttempts,
    activity?.quizAttempts,
    activity?.dataJson?.attempts,
    lesson?.attempts,
    lesson?.quizAttempts,
  ];

  let count = 0;

  candidates.forEach(value => {
    const numberValue = Number(value || 0);
    if (Number.isFinite(numberValue)) count = Math.max(count, numberValue);
  });

  arrays.forEach(value => {
    if (Array.isArray(value)) count = Math.max(count, value.length);
  });

  (activity?.questions || []).forEach(question => {
    const attemptNo = Number(question?.mcqAttempt?.attemptNo || 0);
    if (Number.isFinite(attemptNo)) count = Math.max(count, attemptNo);
  });

  return Math.max(0, Math.min(MAX_MISSION_ATTEMPTS, count));
}



function getStableShuffleSeed(value = '') {
  return String(value || '')
    .split('')
    .reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
    }, 2166136261);
}

function shuffleChoicesForAttempt(choices = [], attemptKey = '') {
  const list = Array.isArray(choices) ? [...choices] : [];

  if (list.length <= 1) {
    return list;
  }

  let seed = String(attemptKey || list.join('|'))
    .split('')
    .reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) >>> 0;
    }, 2166136261);

  for (let index = list.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    const temp = list[index];
    list[index] = list[swapIndex];
    list[swapIndex] = temp;
  }

  return list;
}

export default function StudentJuniorLessonDetail({ navigation, route }) {
  const lessonId = route?.params?.lessonId;
  const [lesson, setLesson] = useState(null);
  const [student, setStudent] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [step, setStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [mcqPassed, setMcqPassed] = useState({});
  const [mcqChoiceShuffleNonce, setMcqChoiceShuffleNonce] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [writingAnswer, setWritingAnswer] = useState('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [playing, setPlaying] = useState(false);
  const [lessonListening, setLessonListening] = useState(false);
  const [lessonListened, setLessonListened] = useState(false);
  const [knowListened, setKnowListened] = useState(false);
  const [readListened, setReadListened] = useState(false);

const [lessonProgress,setLessonProgress]=useState(0);
const [lessonDuration,setLessonDuration]=useState(0);


  const [speechStatus, setSpeechStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

const [activityNotice, setActivityNotice] = useState(null);
const [mcqToast, setMcqToast] = useState(null);
const [missionAttemptCounts, setMissionAttemptCounts] = useState({});
const [missionAttemptNotice, setMissionAttemptNotice] = useState('');
const [gateToast, setGateToast] = useState('');
const [balloonProgress, setBalloonProgress] = useState({});

const [selectedMatch, setSelectedMatch] = useState(null);
const [matchedPairs, setMatchedPairs] = useState({});

const [selectedWords, setSelectedWords] = useState([]);

const [badgePopup, setBadgePopup] = useState(null);
const activeBadgePopup = badgePopup || {};
const [animatedXp, setAnimatedXp] = useState(0);

const badgeScale = useRef(new Animated.Value(0.6)).current;

const xpCounter = useRef(new Animated.Value(0)).current;
const trophyScale = useRef(new Animated.Value(0.4)).current;
const starBurstScale = useRef(new Animated.Value(0.2)).current;
const continueButtonAnim = useRef(new Animated.Value(0)).current;

const confettiAnim = useRef(new Animated.Value(0)).current;
const correctAnswerScale = useRef(new Animated.Value(1)).current;
const activeMissionAttemptRef = useRef({});


  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const celebrationScale = useRef(new Animated.Value(0.92)).current;

const trackerPulse = useRef(new Animated.Value(1)).current;

useEffect(() => {
  if (!littleLearnerGame) return;

  const loop = Animated.loop(
    Animated.sequence([
      Animated.timing(trackerPulse, {
        toValue: 1.08,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.timing(trackerPulse, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
    ])
  );

  loop.start();

  return () => loop.stop();
}, [littleLearnerGame]);

const celebrationRotate = useRef(new Animated.Value(0)).current;
const stepScrollRef = useRef(null);


  useEffect(() => {
    if (!lessonId) {
      setError('Walang Lesson ID.');
      setLoading(false);
      return undefined;
    }

    let active = true;

    Promise.all([
      api(`/lessons/${lessonId}`),
      optionalProgressRequest(
        api(`/lessons/${lessonId}/progress`),
        { progress: null }
      ),
      api('/dashboard'),
    ])
      .then(([lessonData, progressData, dashboard]) => {
        if (!active) return;
        const loadedLesson = lessonData.lesson || null;
        const restoredAnswers = {};

        for (const activity of loadedLesson?.activities || []) {
          for (const question of activity.questions || []) {
            if (question.mcqAttempt?.selectedOptionId) {
              restoredAnswers[question.id] = {
                selectedOptionId: question.mcqAttempt.selectedOptionId,
                correct: Boolean(question.mcqAttempt.isCorrect),
              };
            }
          }
        }


        setLesson(loadedLesson);
        setMcqAnswers(restoredAnswers);
        setStudent(dashboard.student || null);
        setDashboard(dashboard);
        const lessonCompleted =
          progressData.progress?.status === 'completed';

        setCompleted(lessonCompleted);

        const restoredStep = lessonCompleted
          ? (loadedLesson?.activities?.length || 0) + 4
          : (progressData.progress?.currentStep || 1);

        // Pre-unlock gates for steps the student already passed (mirrors web reachedPast).
        // Step 1 = Layunin, Step 2 = Alamin, Step 3 = Lesson.
        setLessonListened(lessonCompleted || restoredStep > 1);
        setKnowListened(lessonCompleted || restoredStep > 2);
        setReadListened(lessonCompleted || restoredStep > 3);

        setStep(restoredStep);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Hindi ma-load ang aralin.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId]);

  useEffect(() => () => {
    stopSpeech();
    soundRef.current?.unloadAsync();
    recordingRef.current?.stopAndUnloadAsync();
  }, []);

  useEffect(() => {
    if (!completed) return undefined;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(celebrationScale, {
          toValue: 1.04,
          duration: 720,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(celebrationScale, {
          toValue: 0.96,
          duration: 720,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const spin = Animated.loop(
      Animated.timing(celebrationRotate, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse.start();
    spin.start();

    return () => {
      pulse.stop();
      spin.stop();
    };
  }, [completed, celebrationRotate, celebrationScale]);
  useEffect(() => {
    if (!completed) return;

    continueButtonAnim.setValue(1);
  }, [completed]);


  useEffect(() => {
    const id = xpCounter.addListener(({ value }) => {
      setAnimatedXp(Math.round(value));
    });

    return () => {
      xpCounter.removeListener(id);
    };
  }, [xpCounter]);


  const activities = useMemo(() => {
    const source = Array.isArray(lesson?.activities) ? lesson.activities : [];
    const gradeLevel = Number(student?.gradeLevel || lesson?.gradeLevel || 0);

    if (gradeLevel > 0 && gradeLevel <= 3) {
      return source.filter(
        (activity) => String(activity?.type || '').toLowerCase() !== 'material'
      );
    }

    return source;
  }, [lesson?.activities, lesson?.gradeLevel, student?.gradeLevel]);

  const missionSteps = useMemo(() => {
    const materialActivities = activities.filter((activity) => {
      const type = String(activity?.type || '').toLowerCase();
      return type === 'material' || type === 'infographic';
    });

    const learningActivities = activities.filter((activity) => {
      const type = String(activity?.type || '').toLowerCase();
      return type !== 'material' && type !== 'infographic';
    });

    return [
      {
        type: 'listen',
        title: 'Layunin',
      },
      {
        type: 'know',
        title: 'Alamin',
      },
      ...materialActivities.map(activity => ({
        type: 'activity',
        activity,
      })),
      {
        type: 'read',
        title: 'Aralin',
      },
      ...learningActivities.map(activity => ({
        type: 'activity',
        activity,
      })),
      {
        type: 'finish',
        title: 'Tapos',
      },
    ];
  }, [activities]);

  const totalSteps = missionSteps.length;

  const currentStep =
    missionSteps[Math.min(step - 1, missionSteps.length - 1)];

  const currentActivity =
    currentStep?.type === 'activity'
      ? currentStep.activity
      : null;

  const currentMissionAttemptKey = getMissionAttemptStorageKey(lesson, currentActivity);
  const currentMissionAttemptServerCount = getServerMissionAttemptCount(lesson, currentActivity);
  const currentMissionAttemptCount = Math.min(
    MAX_MISSION_ATTEMPTS,
    Math.max(
      currentMissionAttemptServerCount,
      Number(missionAttemptCounts[currentMissionAttemptKey] || 0)
    )
  );
  const currentMissionAttemptLabel = currentActivity
    ? Math.min(MAX_MISSION_ATTEMPTS, Math.max(1, currentMissionAttemptCount || 1))
    : 1;
  const currentMissionAttemptsLeft = Math.max(
    0,
    MAX_MISSION_ATTEMPTS - currentMissionAttemptCount
  );

  const lessonText =
    lesson?.passage ||
    lesson?.content ||
    lesson?.material ||
    lesson?.description ||
    lesson?.instructions ||
    '';

  const layuninText =
    getStructuredLessonSectionText(lessonText, 'layunin');

  const alaminText =
    getStructuredLessonSectionText(lessonText, 'alamin');

  const aralinText =
    getStructuredLessonSectionText(lessonText, 'aralin');

  const knowAudioText =
    getStructuredLessonKnowAudioText(
      lessonText,
      lesson,
    );

  const lessonAudioText =
    getStructuredLessonLessonAudioText(
      lessonText,
    );

  const layuninDisplayText =
    layuninText || lesson?.title || 'Handa ka na bang matuto?';

  const alaminDisplayText =
    alaminText || knowAudioText;

  const aralinDisplayText =
    aralinText || lessonText;

  function missionStepIcon(stepItem) {
    if (stepItem?.type === 'listen') return '👂';
    if (stepItem?.type === 'know') return '💡';
    if (stepItem?.type === 'read') return '📖';
    if (stepItem?.type === 'finish') return '⭐';

    const activityType = String(stepItem?.activity?.type || '').toLowerCase();

    if (activityType === 'material' || activityType === 'infographic') return '🐾';
    if (activityType === 'mcq' || activityType === 'quiz') return '🎮';
    if (activityType === 'writing') return '🧩';
    if (activityType === 'speech') return '🎤';
    if (activityType === 'vocabulary' || activityType === 'matching') return '🧩';

    return '🧩';
  }

  function missionStepLabel(stepItem) {
    if (stepItem?.title) return stepItem.title;

    const activityType = String(stepItem?.activity?.type || '').toLowerCase();

    if (activityType === 'material' || activityType === 'infographic') return 'Materyal';
    if (activityType === 'mcq' || activityType === 'quiz') return 'Pagsusulit';
    if (activityType === 'writing') return 'Gawain';
    if (activityType === 'speech') return 'Bigkas';
    if (activityType === 'vocabulary' || activityType === 'matching') return 'Gawain';

    return 'Gawain';
  }

  const littleLearnerGame = Number(student?.gradeLevel || lesson?.gradeLevel || 0) <= 2;


  useEffect(() => {
    setWritingAnswer('');
    setSpeechTranscript('');
    setRecordingUri('');
    setSpeechStatus('');

    setSelectedWords([]);
    setSelectedMatch(null);
    setMatchedPairs({});
    setBalloonProgress({});

    setCurrentQuestionIndex(0);
    setActivityNotice(null);
  }, [lessonId, currentActivity?.id]);

  useEffect(() => {
    if (!mcqToast) return;

    const id = setTimeout(() => {
      setMcqToast(null);
    }, 900);

    return () => clearTimeout(id);
  }, [mcqToast]);

  useEffect(() => {
    if (!gateToast) return;

    const id = setTimeout(() => {
      setGateToast('');
    }, 1800);

    return () => clearTimeout(id);
  }, [gateToast]);


  useEffect(() => {
    if (!stepScrollRef.current) return;

    const chipWidth = 74;

    stepScrollRef.current.scrollTo({
      x: Math.max(0, (step - 2) * chipWidth),
      animated: true,
    });
  }, [step]);

  useEffect(() => {
  }, [step, totalSteps, currentStep, currentActivity]);

  useEffect(() => {
  }, [activities]);


  function ensureMissionAttemptStarted(activityOverride = currentActivity) {
    const attemptKey = getMissionAttemptStorageKey(lesson, activityOverride);

    if (!attemptKey) return true;

    if (activeMissionAttemptRef.current[attemptKey]) return true;

    const existingCount = Math.max(
      getServerMissionAttemptCount(lesson, activityOverride),
      Number(missionAttemptCounts[attemptKey] || 0)
    );

    if (existingCount >= MAX_MISSION_ATTEMPTS) {
      setMissionAttemptNotice('Nagamit mo na ang 2 pagsubok sa mission na ito.');
      setMcqToast('Nagamit mo na ang 2 pagsubok sa mission na ito.');
      return false;
    }

    const nextCount = Math.min(MAX_MISSION_ATTEMPTS, existingCount + 1);

    activeMissionAttemptRef.current[attemptKey] = true;

    setMissionAttemptCounts(prev => ({
      ...prev,
      [attemptKey]: Math.max(Number(prev[attemptKey] || 0), nextCount),
    }));

    setMissionAttemptNotice(`Pagsubok ${nextCount} sa ${MAX_MISSION_ATTEMPTS}`);

    return true;
  }

  const getGameMeta = activity => {
    const type = String(activity?.type || activity?.activityType || activity?.kind || '').toLowerCase();

    if (type.includes('writing') || type.includes('write') || type.includes('essay') || type.includes('text')) {
      return {
        icon: '✍️',
        title: 'Laro sa Pagbuo ng Sagot',
        mission: 'Buuin ang tamang sagot gamit ang mga power-up at punuin ang kahon ng sagot upang makuha ang iyong bituin.',
        steps: ['Pumili', 'Buuin', 'Kunin ang Bituin'],
        button: '🏁 Kunin ang Bituin',
      };
    }

    if (type.includes('speech') || type.includes('speak') || type.includes('oral') || type.includes('voice') || type.includes('record')) {
      return {
        icon: '🎙️',
        title: 'Laro sa Pagbigkas',
        mission: 'Bigkasin nang malinaw ang mga salita, irekord ang iyong boses, at isave ito upang makakuha ng bituin.',
        steps: ['Makinig', 'Magsalita', 'Kunin ang Bituin'],
        button: '⭐ Isave ang Pagbigkas',
      };
    }

    if (type === 'mcq' || type.includes('quiz') || type.includes('choice') || type.includes('question')) {
      return {
        icon: '👆',
        title: 'Laro sa Pagpili ng Tamang Sagot',
        mission: 'Piliin ang tamang sagot. Ang bawat tamang sagot ay maglalapit sa iyo sa pagtatapos.',
        steps: ['Basahin', 'Tap', 'Manalo'],
        button: ' Magpatuloy',
      };
    }

    return {
      icon: '🎮',
      title: 'Laro sa Pagkatuto',
      mission: 'Tapusin ang hamon, mangolekta ng mga bituin, at buksan ang susunod na gawain.',
      steps: ['Tingnan', 'Patugtugin', 'Manalo'],
      button: ' Magpatuloy',
    };
  };

  const handlePowerUpSelection = (nextWords) => {
    setSelectedWords(nextWords);
    setWritingAnswer(nextWords.join(' '));
  };


  const getOptionEmoji = (text = '') => {
    const value = String(text).trim().toLowerCase();

    const emojiMap = {
      dog: '🐶',
      cat: '🐱',
      bird: '🐦',
      fish: '🐟',
      apple: '🍎',
      banana: '🍌',
      mango: '🥭',
      orange: '🍊',
      grapes: '🍇',
      pineapple: '🍍',
      car: '🚗',
      bus: '🚌',
      bicycle: '🚲',
      bike: '🚲',
      train: '🚂',
      airplane: '✈️',
      boat: '⛵',
      tree: '🌳',
      flower: '🌸',
      sun: '☀️',
      moon: '🌙',
      star: '⭐',
      ball: '⚽',
      book: '',
      pencil: '✏️',
      school: '🏫',
      house: '',
      teacher: '👩‍🏫',
      boy: '👦',
      girl: '👧',
    };

    return emojiMap[value] || '';
  };

  const renderGameHeader = activity => {
    if (!littleLearnerGame || !activity) return null;

    const game = getGameMeta(activity);

    return (
      <View style={{
        backgroundColor: '#ECFDF5',
        borderColor: '#BBF7D0',
        borderWidth: 2,
        borderRadius: 22,
        padding: 12,
        marginBottom: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: '#DCFCE7',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <Text style={{ fontSize: 20 }}>{game.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#0F172A', fontSize: 24, fontWeight: '900' }}>
              {game.title}
            </Text>
          </View>
        </View>


      </View>
    );
  };

  const percent = completed ? 100 : Math.round(((Math.max(1, step) - 1) / totalSteps) * 100);
  const nextLesson = useMemo(() => {
    const lessons = dashboard?.lessons || [];
    const lessonIndex = lessons.findIndex((item) => Number(item.id) === Number(lessonId));
    return lessonIndex >= 0 ? lessons[lessonIndex + 1] : null;
  }, [dashboard, lessonId]);

  useEffect(() => {
    const timer = setInterval(() => {

      const playing = isSpeechPlaying();
      const state = getSpeechPlaybackState();

      setLessonListening(playing);
      setLessonProgress(state.position || 0);
      setLessonDuration(state.duration || 0);

      if (!playing && lessonListening) {
        setLessonListened(true);
      }

    }, 250);

    return () => clearInterval(timer);
  }, [lessonListening]);


  const formatAudioTime = (ms=0)=>{
    const total=Math.floor(ms/1000);
    const m=Math.floor(total/60);
    const s=String(total%60).padStart(2,'0');
    return `${m}:${s}`;
  };

  const homeRoute = route?.params?.homeRoute || 'StudentTabs';
  const lessonsListScreen =
    homeRoute === 'StudentSeniorTabs' ? 'StudentSeniorLessonsHome' : 'LessonsList';

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setSpeechStatus('Kailangan ang pahintulot sa mikropono upang makapagrekord ng iyong pagbigkas.');
        return;
      }

      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      setPlaying(false);
      setRecordingUri('');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const result = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = result.recording;
      setRecording(true);
      setSpeechStatus('Kasalukuyang nagre-record...');
    } catch (err) {
      setSpeechStatus('Hindi masimulan ang pagrekord. Pakisubukan muli.');
    }
  }

  async function stopRecording() {
    const activeRecording = recordingRef.current;
    if (!activeRecording) return;

    try {
      await activeRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = activeRecording.getURI() || '';
      recordingRef.current = null;
      setRecording(false);
      setRecordingUri(uri);
      setSpeechStatus(uri ? 'Handa nang patugtugin ang rekording.' : 'Huminto na ang pagrekord.');
    } catch (err) {
      setSpeechStatus('Hindi maihinto ang pagrekord. Pakisubukan muli.');
    }
  }

  async function playRecording() {
    if (!recordingUri) return;

    try {
      await soundRef.current?.unloadAsync();
      const result = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) setPlaying(false);
        }
      );
      soundRef.current = result.sound;
      setPlaying(true);
      setSpeechStatus('Pinapatugtog ang iyong rekording...');
    } catch (err) {
      Alert.alert('Pagpapatugtog', err.message || 'Hindi maipatugtog ang iyong rekording.');
    }
  }


  async function saveNextStep(activityType) {
    let nextStep = Math.min(step + 1, totalSteps);

    if (
      currentStep?.type === 'activity' &&
      step >= totalSteps - 1
    ) {
      nextStep = totalSteps;
    }
    await optionalProgressRequest(
      api(`/lessons/${lessonId}/progress`, {
        method: 'PATCH',
        body: { currentStep: nextStep, lastActivityType: activityType },
      }),
      { progress: null }
    );
    setStep(nextStep);
  }

  async function advance(activityType) {
    if (currentStep?.type === 'activity' && currentActivity?.type === 'mcq') {
      const quizGateKey = String(currentActivity?.id || currentActivity?.activityId || currentActivity?.title || step);

      if (!mcqPassed[quizGateKey]) {
        setActivityNotice({
          type: 'warning',
          text: 'Sagutan muna nang tama ang pagsusulit bago magpatuloy sa susunod na hakbang.',
        });
        return;
      }
    }


    if (submitting) return;
    setSubmitting(true);
    try {
      await stopSpeech();
      await saveNextStep(activityType);
    } catch (err) {
      Alert.alert('Lesson', err.message || 'Hindi maisave ang progreso ng aralin.');
    } finally {
      setSubmitting(false);
    }
  }

  async function answerQuestion(question, option) {
    const canStartMissionAttempt = ensureMissionAttemptStarted(currentActivity);
    if (!canStartMissionAttempt) return;

    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await api(`/lessons/${lessonId}/mcq`, {
        method: 'POST',
        body: {
          questionId: question.id,
          selectedOptionId: option.id,
        },
      });

      if (data && !data.correct) {
        setMcqChoiceShuffleNonce((prev) => prev + 1);
      }



      if (data?.correct) {
        setMcqPassed((prev) => ({
          ...prev,
          [String(currentActivity?.id || currentActivity?.activityId || currentActivity?.title || step)]: true,
        }));
      }
      setMcqAnswers((answers) => ({
        ...answers,
        [question.id]: {
          selectedOptionId: option.id,
          correct: Boolean(data.correct),
        },
      }));
      if (data.correct) {
        correctAnswerScale.setValue(1);

        Animated.sequence([
          Animated.spring(correctAnswerScale, {
            toValue: 1.18,
            friction: 4,
            useNativeDriver: true,
          }),
          Animated.spring(correctAnswerScale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }

      setActivityNotice({
        type: data.correct ? 'success' : 'warning',
        title: data.correct
          ? (littleLearnerGame ? '🌟 Ang Husay!' : 'Tamang Sagot!')
          : (littleLearnerGame ? '💡 Subukan Muli!' : 'Subukan muli'),
        message: data.correct
          ? (
              littleLearnerGame
                ? '🌟 Ang husay!'
                : 'Tamang sagot!'
            )
          : (
              littleLearnerGame
                ? '🙂 Hindi pa. Subukan muli!'
                : 'Mali ang sagot.'
            ),
      });

      const visibleQuestions = (currentActivity?.questions || []).slice(0, 1);

      if (
        data.correct &&
        currentQuestionIndex < visibleQuestions.length - 1
      ) {
        setTimeout(() => {
          setActivityNotice(null);
          setCurrentQuestionIndex(i => i + 1);
        }, 900);
      }
    } catch (err) {
      setActivityNotice({
        type: 'error',
        title: 'Hindi naisave ang sagot',
        message: err.message || 'Subukan nating muli.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWriting(answerOverride = null) {
    const task = currentActivity?.writingTask;
    if (!task?.id) {
      Alert.alert('Pagsulat', 'Wala pang gawaing pagsulat para sa aktibidad na ito.');
      return;
    }
    const answer = answerOverride ?? writingAnswer;


    if (answer.trim().length < 2) {
      Alert.alert('Pagsulat', 'Isulat muna ang iyong sagot bago magpatuloy.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api(`/lessons/${lessonId}/writing`, {
        method: 'POST',
        body: {
          taskId: task.id,
          content: answer,
          autoChecked: Boolean(task.rubricJson?.autoChecked),
        },
      });

      // Success feedback is already shown in the Fill-in-the-Blank UI.
      if (data.correct === false) {
        return;
      }

      await saveNextStep('writing');
    } catch (err) {
      Alert.alert('Pagsulat', err.message || 'Hindi maisave ang iyong sagot.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSpeech() {
    const task = currentActivity?.speechTask;
    if (!task?.id) {
      Alert.alert('Pagbigkas', localizeStudentVisibleMessage('Wala pang gawaing pagbigkas para sa aktibidad na ito.'));
      return;
    }
    if (!recordingUri) {
      Alert.alert(
        'Laro sa Pagbigkas',
        'Irekord muna ang iyong boses.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const uploadedAudio =
        await uploadSpeechRecording(recordingUri);

      const data = await api(`/lessons/${lessonId}/speech`, {
        method: 'POST',
        body: {
          taskId: task.id,
          transcript:
            speechTranscript ||
            '[VOICE_RECORDING_SUBMITTED]',
          audioUrl:
            uploadedAudio?.audioUrl || null,
        },
      });
      Alert.alert('Pagbigkas', localizeStudentVisibleMessage(data.message || 'Naisave na ang iyong pagbigkas.'));
      setSpeechStatus(
        littleLearnerGame
          ? '⭐ Tapos na ang pagbigkas! Matagumpay na naisave ang iyong rekording.'
          : '🎤 Speech attempt submitted and saved.'
      );
      await saveNextStep('speech');
    } catch (err) {
      Alert.alert('Pagbigkas', localizeStudentVisibleMessage(err.message || 'Hindi maisave ang iyong pagbigkas.'));
    } finally {
      setSubmitting(false);
    }
  }

  function goToPreviousStep() {
    if (submitting || completed) return;
    stopSpeech();
    setActivityNotice(null);
    setStep((current) => Math.max(1, Number(current || 1) - 1));
  }

  async function finishLesson() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await api(`/lessons/${lessonId}/complete`, {
        method: 'POST',
        body: {},
      });
      setCompletionResult(data);

      if (Array.isArray(data?.newBadges) && data.newBadges.length) {
        setBadgePopup(data.newBadges[0]);

        badgeScale.setValue(0.6);

        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }).start();

        setTimeout(() => {
          setBadgePopup(null);
        }, 5500);
      }

      trophyScale.setValue(0.4);
      starBurstScale.setValue(0.2);
      xpCounter.setValue(0);
      continueButtonAnim.setValue(0);
      confettiAnim.setValue(0);

      Animated.sequence([
        Animated.spring(trophyScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),

        Animated.parallel([
          Animated.spring(starBurstScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
          Animated.timing(confettiAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),

        Animated.timing(xpCounter, {
          toValue: Number(data?.xpAwarded || 0),
          duration: 900,
          useNativeDriver: false,
        }),

        Animated.timing(continueButtonAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();

      setCompleted(true);
      setStudent((current) => current
        ? { ...current, xp: Number(current.xp || 0) + Number(data.xpAwarded || 0) }
        : current);
    } catch (err) {
      Alert.alert('Lesson', err.message || 'Hindi makumpleto ang aralin.');
    } finally {
      setSubmitting(false);
    }
  }

  function cleanStoryTopic(value = '') {
    return String(value || '')
      .replace(/^Pagbasa\s*\d+\s*:\s*/i, '')
      .replace(/^Bakit\s+Mahalaga\s+ang\s+/i, '')
      .replace(/\?+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getCustomWritingTaskText(activity = {}) {
    return String(
      activity?.writingTask?.prompt ||
      activity?.prompt ||
      activity?.content ||
      ''
    ).trim();
  }

  function getStoryTopics(activity = {}, lessonData = {}) {
    const raw =
      cleanStoryTopic(lessonData?.title) ||
      cleanStoryTopic(activity?.title) ||
      cleanStoryTopic(lessonData?.subject) ||
      'the lesson';

    const lower = raw.toLowerCase();

    if (lower.includes('pagbabasa') || lower.includes('reading')) {
      return { english: 'reading', tagalog: 'pagbabasa' };
    }

    if (lower.includes('pagsulat') || lower.includes('writing')) {
      return { english: 'writing', tagalog: 'pagsulat' };
    }

    if (lower.includes('talumpati') || lower.includes('speech')) {
      return { english: 'speaking clearly', tagalog: 'malinaw na pagsasalita' };
    }

    if (lower.includes('tula') || lower.includes('poem') || lower.includes('poetry')) {
      return { english: 'poetry', tagalog: 'tula' };
    }

    if (lower.includes('kuwento') || lower.includes('kwento') || lower.includes('story')) {
      return { english: 'storytelling', tagalog: 'pagkukuwento' };
    }

    return { english: raw, tagalog: raw || 'aralin' };
  }

  function buildStudentStory(activity = {}, lessonData = {}) {
    const topic = getStoryTopics(activity, lessonData);
    const gradeLevel = Number(student?.gradeLevel || lessonData?.gradeLevel || 0);
    const isSeniorLearner = gradeLevel >= 4;

    const englishStory = isSeniorLearner
      ? `During group work, Mia noticed that Leo was quiet. Their class was talking about ${topic.english}, and Leo said he did not know how to start. Mia opened the book, pointed to the first sentence, and asked him to read it with her. They underlined the important idea and wrote a short explanation together. When the teacher asked them to share, Leo was ready to answer.`
      : `Mia and Leo were reading together in class. Leo looked worried because the lesson about ${topic.english} felt hard. Mia said, “Let us read one sentence at a time.” They read slowly, found the important idea, and talked about it. Soon, Leo smiled because he understood the lesson better.`;

    const tagalogStory = isSeniorLearner
      ? `Sa pangkatang gawain, napansin ni Mia na tahimik si Leo. Pinag-uusapan ng klase ang ${topic.tagalog}, at sinabi ni Leo na hindi niya alam kung paano magsisimula. Binuksan ni Mia ang libro, itinuro ang unang pangungusap, at niyaya siyang basahin ito kasama niya. Sinalungguhitan nila ang mahalagang ideya at nagsulat ng maikling paliwanag. Nang ipabahagi ng guro ang sagot, handa na si Leo.`
      : `Magkasamang nagbabasa sina Mia at Leo sa klase. Mukhang nag-aalala si Leo dahil nahirapan siya sa aralin tungkol sa ${topic.tagalog}. Sinabi ni Mia, “Basahin natin ito nang paisa-isang pangungusap.” Dahan-dahan silang nagbasa, hinanap ang mahalagang ideya, at pinag-usapan ito. Maya-maya, ngumiti si Leo dahil mas naunawaan niya ang aralin.`;

    const customWritingTask = getCustomWritingTaskText(activity);

    return {
      title: customWritingTask ? 'Iyong Gawain' : 'Basahin ang maikling kuwento',
      story: englishStory,
      storyTranslation: tagalogStory,
      task: customWritingTask || 'Write 2 short sentences about what Mia and Leo did in the story.',
      taskTranslation: customWritingTask ? '' : 'Sumulat ng 2 maikling pangungusap tungkol sa ginawa nina Mia at Leo sa kuwento.',
      hasCustomWritingTask: Boolean(customWritingTask),
    };
  }

  function renderStudentStoryCard(activity = {}, lessonData = {}) {
    const story = buildStudentStory(activity, lessonData);

    if (story.hasCustomWritingTask) {
      return (
        <View style={styles.studentStoryCard}>
          <Text style={styles.studentStoryEyebrow}>✍️ Gawain sa Pagsulat</Text>
          <View style={styles.studentStoryTaskBox}>
            <Text style={styles.studentStoryTaskLabel}>Iyong Gawain</Text>
            <Text style={styles.studentStoryTaskText}>{story.task}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.studentStoryCard}>
        <Text style={styles.studentStoryEyebrow}>📖 Oras ng Kuwento</Text>
        <Text style={styles.studentStoryTitle}>{story.title}</Text>

        <Text style={styles.studentStoryLanguageLabel}>Ingles</Text>
        <Text style={styles.studentStoryBody}>{story.story}</Text>

        <Text style={styles.studentStoryLanguageLabel}>Salin sa Tagalog</Text>
        <Text style={styles.studentStoryBodyTranslation}>{story.storyTranslation}</Text>

        <View style={styles.studentStoryTaskBox}>
          <Text style={styles.studentStoryTaskLabel}>Iyong Gawain</Text>
          <Text style={styles.studentStoryTask}>{story.task}</Text>
          <Text style={styles.studentStoryTaskTranslation}>{story.taskTranslation}</Text>
        </View>
      </View>
    );
  }

  function cleanVisualReadText(value = '') {
    return String(value || '')
      .replace(/\b(Layunin|Panimula|Lesson|Gawain)\s*:/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function shortVisualWords(value = '', maxWords = 7) {
    const words = cleanVisualReadText(value).split(' ').filter(Boolean);
    if (!words.length) return '';
    const shortText = words.slice(0, maxWords).join(' ');
    return words.length > maxWords ? `${shortText}...` : shortText;
  }

  function buildJuniorVisualReadCards(textValue = '', lessonData = {}) {
    const cleanText = cleanVisualReadText(textValue);
    const pieces = cleanText
      .replace(/[!?]+/g, '.')
      .split(/[.\n]+/)
      .map(item => cleanVisualReadText(item))
      .filter(Boolean);

    const topic = cleanVisualReadText(
      lessonData?.title ||
      lessonData?.subject ||
      'Lesson'
    );

    return [
      {
        icon: '👀',
        label: 'Tingnan',
        text: shortVisualWords(topic, 6) || 'Tingnan ang aralin.',
      },
      {
        icon: '💡',
        label: 'Isipin',
        text: shortVisualWords(pieces[0], 7) || 'What is the lesson about?',
      },
      {
        icon: '⭐',
        label: 'Tandaan',
        text: shortVisualWords(pieces[1] || pieces[0], 7) || 'Say the main idea.',
      },
    ];
  }

  function renderJuniorVisualReadCard(textValue = '', lessonData = {}) {
    const cards = buildJuniorVisualReadCards(textValue, lessonData);

    return (
      <View style={styles.juniorVisualReadCard}>
        <Text style={styles.juniorVisualReadEyebrow}>📖 Basahin gamit ang mga larawan</Text>
        <Text style={styles.juniorVisualReadTitle}>Tingnan, isipin, at tandaan.</Text>

        <View style={styles.juniorVisualReadGrid}>
          {cards.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.juniorVisualReadItem}>
              <Text style={styles.juniorVisualReadIcon}>{item.icon}</Text>
              <Text style={styles.juniorVisualReadLabel}>{item.label}</Text>
              <Text style={styles.juniorVisualReadText}>{item.text}</Text>
            </View>
          ))}
        </View>


      </View>
    );
  }

  function renderActivity() {

    if (currentStep?.type === 'listen') {
      return (
        <View style={styles.card}>

          <View
            style={{
              backgroundColor:'#ECFDF5',
              borderRadius:22,
              borderWidth:2,
              borderColor:'#BBF7D0',
              padding:18,
              marginBottom:18,
            }}
          >
            <Text
              style={{
                fontSize:24,
                fontWeight:'900',
                color:'#166534',
              }}
            >
              👂 Layunin
            </Text>

            <Text
              style={{
                marginTop:10,
                fontSize:16,
                lineHeight:24,
                color:'#334155',
              }}
            >
              {layuninDisplayText}
            </Text>


          </View>

          <View
            style={{
              backgroundColor:'#ECFDF5',
              borderRadius:24,
              padding:20,
              marginTop:18,
              borderWidth:2,
              borderColor:'#BBF7D0',
              shadowColor:'#000',
              shadowOpacity:0.08,
              shadowRadius:8,
              elevation:3,
            }}
          >

            <Text
              style={{
                fontSize:16,
                fontWeight:'900',
                color:'#166534',
                textAlign:'center',
                marginBottom:18,
              }}
            >
              🎵 Audio ng Layunin
            </Text>

            <TouchableOpacity
              style={[
                {
                  width:84,
                  height:84,
                  borderRadius:42,
                  alignSelf:'center',
                  alignItems:'center',
                  justifyContent:'center',
                  backgroundColor: lessonListening
                    ? '#FEE2E2'
                    : '#DCFCE7',
                  borderWidth:3,
                  borderColor: lessonListening
                    ? '#EF4444'
                    : '#22C55E',
                }
              ]}
            onPress={async () => {

              if (lessonListening) {
                await stopSpeech();


                return;
              }

              setLessonListened(true);

              await speakText(
                layuninDisplayText,
                {
                  onStart: () => {

                  },

                  onFinish: () => {


                  },
                }
              );

            }}
          >
            <Text style={styles.secondaryText}>
              {
                lessonListening
                  ? '⏹'
                  : lessonListened
                    ? '🔁'
                    : '▶️'
              }
            </Text>
          </TouchableOpacity>

          </View>

          <Text
            style={{
              textAlign:'center',
              marginTop:4,
              color: lessonListening ? '#15803D' : '#64748B',
              fontWeight:'700',
            }}
          >
            {
              lessonListening
                ? '🎧 Pinapatugtog ang aralin...'
                : lessonListened
                  ? '✅ Magaling! Pindutin ang Magpatuloy.'
                  : '👆 Pindutin ang ▶ upang magsimula.'
            }
          </Text>


          {lessonDuration > 0 && (
            <View
              style={{
                marginTop:18,
              }}
            >

              <View
                style={{
                  height:6,
                  backgroundColor:'#DCFCE7',
                  borderRadius:999,
                  overflow:'hidden',
                }}
              >
                <View
                  style={{
                    height:'100%',
                    width:`${Math.min(
                      100,
                      lessonDuration
                        ? (lessonProgress / lessonDuration) * 100
                        : 0
                    )}%`,
                    backgroundColor:'#22C55E',
                  }}
                />
              </View>

              <View
                style={{
                  flexDirection:'row',
                  justifyContent:'space-between',
                  marginTop:4,
                }}
              >
                <Text style={{fontWeight:'700'}}>
                  {formatAudioTime(lessonProgress)}
                </Text>

                <Text style={{fontWeight:'700'}}>
                  {formatAudioTime(lessonDuration)}
                </Text>
              </View>

            </View>
          )}

          {gateToast ? (
            <View style={[styles.feedbackCard, styles.feedbackWarning]}>
              <Text style={styles.feedbackMessage}>{gateToast}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryButton, (lessonListening || !lessonListened) && styles.disabledButton]}
            onPress={() => {
              if (lessonListening) return;
              if (!lessonListened) {
                setGateToast('Pakinggan muna ang layunin.');
                return;
              }
              advance('listen');
            }}
          >
            <Text style={styles.primaryText}>
              {lessonListened ? 'Magpatuloy' : 'Makinig muna'}
            </Text>
          </TouchableOpacity>

        </View>
      );
    }

    if (currentStep?.type === 'know') {
      return (
        <View style={styles.card}>

          <View
            style={{
              backgroundColor:'#EFF6FF',
              borderRadius:22,
              borderWidth:2,
              borderColor:'#BFDBFE',
              padding:18,
              marginBottom:18,
            }}
          >
            <Text
              style={{
                fontSize:24,
                fontWeight:'900',
                color:'#1D4ED8',
              }}
            >
              💡 Alamin
            </Text>

            {!!alaminDisplayText && (
              <Text
                style={{
                  marginTop:10,
                  fontSize:16,
                  lineHeight:24,
                  color:'#334155',
                }}
              >
                {alaminDisplayText}
              </Text>
            )}


          </View>

          <TouchableOpacity
            style={[styles.secondaryButton, styles.equalAlaminActionButton, { alignSelf: 'center' }]}
            onPress={() => {
              setKnowListened(true);
              speakText(knowAudioText);
            }}
          >
            <Text style={[styles.secondaryText, styles.equalAlaminActionText]}>
              {knowListened ? '🔁 Makinig Muli' : '🔊 Makinig'}
            </Text>
          </TouchableOpacity>

          {gateToast ? (
            <View style={[styles.feedbackCard, styles.feedbackWarning]}>
              <Text style={styles.feedbackMessage}>{gateToast}</Text>
            </View>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 14,
            }}
          >
            <TouchableOpacity
              style={[styles.secondaryButton, styles.equalAlaminActionButton]}
              onPress={goToPreviousStep}
            >
              <Text style={[styles.secondaryText, styles.equalAlaminActionText]}>← Bumalik</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, styles.equalAlaminActionButton, !knowListened && styles.disabledButton]}
              onPress={() => {
                if (!knowListened) {
                  setGateToast('Makinig muna sa hakbang na ito.');
                  return;
                }
                advance('know');
              }}
            >
              <Text style={[styles.primaryText, styles.equalAlaminActionText]}>
                {knowListened ? 'Basahin ang Aralin' : 'Makinig muna'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

      if (currentStep?.type === 'read') {
        return (
          <View
            style={[
              styles.card,
              littleLearnerGame && {
                borderWidth: 3,
                borderColor: '#BFDBFE',
                backgroundColor: '#F0FDF4',
              },
            ]}
          >
            {littleLearnerGame ? (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'stretch',
                    marginBottom: 18,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'stretch', flex: 1 }}>

                    <Text
                      style={{
                        fontSize: 30,
                        fontWeight: '900',
                        color: '#0F172A',
                        flexShrink: 1,
                      }}
                    >
                      Basahin ang Aralin
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: 22,
                      backgroundColor: '#ECFDF5',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#BFDBFE',
                    }}
                  >
                    <Text style={{ fontSize: 48 }}>📖</Text>
                  </View>
                </View>

                {!!aralinDisplayText && (
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 24,
                      padding: 22,
                      borderWidth: 2,
                      borderColor: '#BBF7D0',
                      marginBottom: 18,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: '900',
                        color: '#111827',
                        lineHeight: 36,
                      }}
                    >
                      {aralinDisplayText}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.title}>📖 Basahin ang Aralin</Text>

                {!!aralinDisplayText && (
                  Number(student?.gradeLevel || lesson?.gradeLevel || 0) <= 3 ? (
                    renderJuniorVisualReadCard(aralinDisplayText, lesson)
                  ) : (
                    <ReadingPassageCard
                    title={lesson.title}
                    passage={aralinDisplayText}
                  />
                  )
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.secondaryButton, { alignSelf: 'center', minWidth: '60%' }]}
              onPress={() => {
                setReadListened(true);
                speakText(lessonAudioText);
              }}
            >
              <Text style={styles.secondaryText}>
                {readListened ? '🔁 Makinig Muli' : '🔊 Makinig'}
              </Text>
            </TouchableOpacity>

            {gateToast ? (
              <View style={[styles.feedbackCard, styles.feedbackWarning]}>
                <Text style={styles.feedbackMessage}>{gateToast}</Text>
              </View>
            ) : null}

            {missionAttemptNotice ? (
              <View style={[styles.feedbackCard, styles.feedbackWarning]}>
                <Text style={styles.feedbackMessage}>{missionAttemptNotice}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, !readListened && styles.disabledButton]}
              onPress={() => {
                if (!readListened) {
                  setGateToast('Makinig muna sa aralin.');
                  return;
                }
                advance('read');
              }}
            >
              <Text style={styles.primaryText}>
                {!readListened
                  ? 'Makinig muna'
                  : littleLearnerGame ? '⭐ Naiintindihan Ko Na!' : 'Magpatuloy'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }

    if (currentStep?.type === 'activity' && currentActivity?.type === 'mcq')
 {
            const questions = buildMissionQuestionPool(currentActivity, lesson).slice(0, 1);
      const allAnswered = questions.length > 0 && questions.every((question) => mcqAnswers[question.id]);
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 {currentActivity.title}</Text>
          {littleLearnerGame ? null : (
            <ActivityGuideCard
              activity={currentActivity}
              littleLearnerGame={littleLearnerGame}
            />
          )}

          {!littleLearnerGame && (
            <ActivityVisualCard
              activity={currentActivity}
              lesson={lesson}
            />
          )}

          {littleLearnerGame ? null : (
            <ReadingPassageCard
              activity={currentActivity}
              lesson={lesson}
            />
          )}
          {questions[currentQuestionIndex] && (() => {
            const question = questions[currentQuestionIndex];
            return (
            <View key={question.id} style={styles.questionBlock}>
              {littleLearnerGame ? (
                <View
                  style={{
                    backgroundColor:'#EFF6FF',
                    borderWidth:2,
                    borderColor:'#93C5FD',
                    borderRadius:22,
                    padding:18,
                    marginBottom:18,
                    alignItems:'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize:14,
                      fontWeight:'900',
                      color:'#1D4ED8',
                      marginBottom:8,
                      textTransform:'uppercase',
                      letterSpacing:0.5,
                    }}
                  >
                    🤔 Tanong
                  </Text>

                  <Text
                    style={{
                      fontSize:24,
                      fontWeight:'900',
                      textAlign:'center',
                      color:'#0F172A',
                      lineHeight:32,
                    }}
                  >
                    {question.question}
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    backgroundColor:'#EFF6FF',
                    borderWidth:2,
                    borderColor:'#93C5FD',
                    borderRadius:16,
                    padding:16,
                    marginBottom:12,
                  }}
                >
                  <Text style={styles.question}>
                    {question.question}
                  </Text>
                </View>
              )}
              {(question.options || []).map((option, index) => {
                const answer = mcqAnswers[question.id];
                const selected = answer?.selectedOptionId === option.id;
                return (
                  <Animated.View
                    key={option.id}
                    style={
                      selected && answer?.correct
                        ? {
                            transform: [{ scale: correctAnswerScale }],
                          }
                        : null
                    }
                  >
                  <TouchableOpacity
                    style={[
                      styles.option,
                      selected && (answer.correct ? styles.optionCorrect : styles.optionIncorrect),
                    ]}
                    onPress={() => answerQuestion(question, option)}
                    disabled={submitting}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionLetterBadge}>
                        <Text style={styles.optionLetterText}>
                          {String.fromCharCode(65 + index)}
                        </Text>
                      </View>

                      <Text style={styles.optionText}>
                        {option.optionText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          );
          })()}
          {!littleLearnerGame && questions.length > 1 ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              disabled={currentQuestionIndex === 0}
              style={[
                styles.secondaryButton,
                currentQuestionIndex === 0 && { opacity: 0.4 },
              ]}
              onPress={() =>
                setCurrentQuestionIndex(i => Math.max(0, i - 1))
              }
            >
              <Text style={styles.secondaryText}>← Nakaraan</Text>
            </TouchableOpacity>

            <Text
              style={{
                fontWeight: '700',
                color: '#475569',
              }}
            >
              {currentQuestionIndex + 1} / {questions.length}
            </Text>

            <TouchableOpacity
              disabled={
                currentQuestionIndex >= questions.length - 1 ||
                !mcqAnswers[questions[currentQuestionIndex]?.id]
              }
              style={[
                styles.primaryButton,
                (
                  currentQuestionIndex >= questions.length - 1 ||
                  !mcqAnswers[questions[currentQuestionIndex]?.id]
                ) && {
                  opacity: 0.4,
                },
              ]}
              onPress={() => {
                const current = questions[currentQuestionIndex];

                if (!mcqAnswers[current.id]) {
                  setActivityNotice({
                    type: 'warning',
                    title: 'Kailangan ng Sagot',
                    message: 'Pumili muna ng tamang sagot bago magpatuloy.',
                  });
                  return;
                }

                setCurrentQuestionIndex(i =>
                  Math.min(questions.length - 1, i + 1)
                );
              }}
            >
              <Text style={styles.primaryText}>Susunod →</Text>
            </TouchableOpacity>
          </View>
          ) : null}

{activityNotice ? (
            littleLearnerGame ? (
              <View
                style={[
                  styles.feedbackCard,
                  activityNotice.type === 'success'
                    ? styles.feedbackSuccess
                    : styles.feedbackWarning,
                  {
                    alignItems:'center',
                    paddingVertical:14,
                  },
                ]}
              >
                <Text style={{ fontSize:32 }}>
                  {activityNotice.type === 'success' ? '⭐😊' : '❌😅'}
                </Text>

                <Text
                  style={{
                    fontSize:16,
                    fontWeight:'900',
                    marginTop:4,
                  }}
                >
                  {activityNotice.type === 'success'
                    ? 'Ang husay mo!'
                    : 'Subukan muli!'}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.feedbackCard,
                  activityNotice.type === 'success' && styles.feedbackSuccess,
                  activityNotice.type === 'warning' && styles.feedbackWarning,
                  activityNotice.type === 'error' && styles.feedbackError,
                ]}
              >
                <Text style={styles.feedbackTitle}>
                  {activityNotice.title}
                </Text>
                <Text style={styles.feedbackMessage}>
                  {localizeStudentVisibleMessage(activityNotice.message)}
                </Text>
              </View>
            )
          ) : null}
          {!questions.length && <Text style={styles.body}>Wala pang mga tanong na inilathala para sa gawaing ito.</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, !allAnswered && styles.disabledButton]}
            onPress={() => advance('mcq')}
            disabled={!allAnswered || submitting}
          >
            <Text style={styles.primaryText}>Magpatuloy</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStep?.type === 'activity' && currentActivity?.type === 'writing') {
      const suggestions = currentActivity.writingTask?.rubricJson?.choices
        || currentActivity.writingTask?.rubricJson?.wordBank
        || [];
      const game = getGameMeta(currentActivity);


      const isFillInBlank =
        currentActivity?.writingTask?.rubricJson?.gawainType ===
        'complete_sentence';

      return (
        <View style={[
          styles.card,
          littleLearnerGame && {
            borderWidth: 3,
            borderColor: '#A7F3D0',
            backgroundColor: '#F0FDF4',
            shadowColor: '#22C55E',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: 6,
            },
            elevation: 5,
          },
        ]}>
          {renderGameHeader(currentActivity)}
          {littleLearnerGame && (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 22,
                marginBottom: 10,
              }}
            >
              🌈 ⭐ 🎈 ⭐ 🌈
            </Text>
          )}

          {!littleLearnerGame && (
            <Text style={styles.cardTitle}>
              ✍️ {currentActivity.title}
            </Text>
          )}
          {littleLearnerGame ? null : (
              <>
                <ActivityGuideCard
                  activity={currentActivity}
                  littleLearnerGame={littleLearnerGame}
                />
                {renderStudentStoryCard(currentActivity, lesson)}
              </>
            )}
          {<ActivityVisualCard
            activity={currentActivity}
            lesson={lesson}
          />}
          {isFillInBlank ? (
            <FillInBlankGame
              rubric={currentActivity.writingTask?.rubricJson}
              submitting={submitting}
              onSubmit={(answer) => {
                setWritingAnswer(answer);
                submitWriting(answer);
              }}
            />
          ) : (
            <>
              <PowerUpTray
                visible={littleLearnerGame}
                activity={currentActivity}
                selectedWords={selectedWords}
                onSelectionChange={handlePowerUpSelection}
              />
          {!littleLearnerGame && suggestions.length ? (
            <View style={styles.choiceRow}>
              {suggestions.map((suggestion, index) => {
                const label = String(suggestion?.text || suggestion?.word || suggestion);
                return (
                  <TouchableOpacity key={`${label}-${index}`} style={styles.choiceChip} onPress={() => setWritingAnswer(label)}>
                    <Text style={styles.choiceText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
          <View style={littleLearnerGame ? {
            backgroundColor: '#F8FAFC',
            borderColor: '#BBF7D0',
            borderWidth: 2,
            borderRadius: 24,
            padding: 12,
            marginBottom: 16,
          } : null}>
            {littleLearnerGame ? (
              <Text style={{ color: '#15803D', fontWeight: '900', fontSize: 17, marginBottom: 8 }}>
                🧩 Tagabuo ng Sagot
              </Text>
            ) : null}
            <TextInput
              style={[
                styles.input,
                littleLearnerGame && {
                  borderColor: '#86EFAC',
                  backgroundColor: '#FFFFFF',
                  minHeight: 92,
                  fontSize: 18,
                },
              ]}
              multiline
              value={writingAnswer}
              onChangeText={setWritingAnswer}
              placeholder={littleLearnerGame ? 'Pindutin ang mga power-up o isulat ang iyong sagot dito...' : 'Isulat ang iyong sagot dito...'}
            />
          </View>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              submitWriting();
            }}
            disabled={submitting}
          >
            <Text style={styles.primaryText}>
              {submitting
                ? 'Sine-save...'
                : littleLearnerGame
                  ? game.button
                  : 'Save and Magpatuloy'}
            </Text>
          </TouchableOpacity>
            </>
          )}
        </View>
      );
    }


    if (currentStep?.type === 'finish') {
      return (
        <View
          style={[
            styles.card,
            littleLearnerGame && {
              borderWidth: 3,
              borderColor: '#FDE68A',
              backgroundColor: '#F0FDF4',
            },
          ]}
        >
          {littleLearnerGame ? (
            <>
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 22,
                  marginBottom: 10,
                }}
              >
                 ⭐ 🌈 ⭐ 🎈
              </Text>

              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '900',
                  textAlign: 'center',
                  color: '#15803D',
                }}
              >
                Ang Galing!
              </Text>

              <Text
                style={{
                  marginTop: 14,
                  marginBottom: 24,
                  fontSize: 20,
                  lineHeight: 30,
                  textAlign: 'center',
                  color: '#334155',
                }}
              >
                Natapos mo na ang lahat ng gawain sa araling ito!
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.title}>🏁 Tapusin ang Lesson</Text>

              <Text style={styles.body}>
                Magaling! Natapos mo ang lahat ng hamon sa araling ito.
              </Text>
            </>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            disabled={submitting}
            onPress={finishLesson}
          >
            <Text style={styles.primaryText}>
              {littleLearnerGame
                ? '🌟 Kunin ang Iyong Gantimpala!'
                : '⭐ Tapusin ang Lesson'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStep?.type === 'activity' && currentActivity?.type === 'speech') {
      const game = getGameMeta(currentActivity);

      return (
        <View style={[
          styles.card,
          littleLearnerGame && {
            borderWidth: 3,
            borderColor: '#FDE68A',
            backgroundColor: '#F0FDF4',
            shadowColor: '#22C55E',
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: 6,
            },
            elevation: 5,
          },
        ]}>
          {renderGameHeader(currentActivity)}
          {littleLearnerGame && (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 22,
                marginBottom: 10,
              }}
            >
              🌈 ⭐ 🎈 ⭐ 🌈
            </Text>
          )}

          {!littleLearnerGame && (
            <Text style={styles.cardTitle}>
              🎤 {currentActivity.title}
            </Text>
          )}

          {/* Target text — always shown for all grades (matches web SpeechActivity) */}
          {(() => {
            const target =
              currentActivity.speechTask?.targetText ||
              currentActivity.targetText ||
              currentActivity.instructions ||
              '';
            if (!target) return null;
            return littleLearnerGame ? (
              <View
                style={{
                  backgroundColor: '#FFE2EA',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 14,
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 15,
                    color: '#9F1239',
                    marginBottom: 6,
                  }}
                >
                  Bibigkasin:
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    lineHeight: 30,
                    color: '#1E1B4B',
                    fontWeight: '700',
                  }}
                >
                  {target}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: '#FFF7ED',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#FED7AA',
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 13,
                    color: '#92400E',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Target:
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    color: '#1C1917',
                  }}
                >
                  {target}
                </Text>
              </View>
            );
          })()}
          {littleLearnerGame ? null : (
          <ActivityGuideCard
            activity={currentActivity}
            littleLearnerGame={littleLearnerGame}
          />
        )}
          {<ActivityVisualCard
            activity={currentActivity}
            lesson={lesson}
          />}
          <View
            style={[
              styles.speechButtons,
              littleLearnerGame && {
                flexDirection:'row',
                justifyContent:'space-evenly',
                alignItems:'flex-start',
                flexWrap:'wrap',
                marginTop:4,
              },
            ]}
          >
            <AudioPlayerButton
              icon="🔊"
              label="Pakinggan"
              onPress={() =>
                speakText(
                  currentActivity.speechTask?.targetText ||
                  currentActivity.instructions ||
                  ''
                )
              }
            />

            <AudioPlayerButton
              icon={recording ? '⏹' : '🎤'}
              label={
                littleLearnerGame
                  ? (recording ? 'Itigil' : 'Irekord')
                  : (recording ? 'Ihinto ang Pagrekord' : 'Simulan ang Pagrekord')
              }
              danger={recording}
              onPress={recording ? stopRecording : startRecording}
            />

            {recordingUri ? (
              <AudioPlayerButton
                icon="▶️"
                label={
                  littleLearnerGame
                    ? "Patugtugin"
                    : (playing ? "Pinapatugtog..." : "Ulitin")
                }
                disabled={playing}
                onPress={playRecording}
              />
            ) : null}

            <AudioPlayerButton
              icon="⏹"
              label={littleLearnerGame ? "Itigil" : "Itigil ang Audio"}
              danger
              onPress={async () => {
                await stopSpeech();

                if (soundRef.current) {
                  try {
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                  } catch {}

                  soundRef.current = null;
                }

                setPlaying(false);
                setSpeechStatus('Audio stopped.');
              }}
            />
          </View>
          {speechStatus ? <Text style={styles.statusMessage}>{localizeStudentVisibleMessage(speechStatus)}</Text> : null}
          {littleLearnerGame ? null : (
          <TextInput
            style={[
              styles.input,
              littleLearnerGame && {
                borderColor: '#FDE68A',
                backgroundColor: '#FFFBEB',
                minHeight: 82,
                fontSize: 18,
              },
            ]}
            multiline
            value={speechTranscript}
            onChangeText={setSpeechTranscript}
            placeholder="Isulat ang iyong binigkas..."
          />
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={submitSpeech} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Sine-save...' : littleLearnerGame ? game.button : 'Isumite ang Pagbigkas'}</Text>
          </TouchableOpacity>
        </View>
      );
    }


    if (
      currentStep?.type === 'activity' &&
      currentActivity?.type === 'infographic'
    ) {
      return (
        <View
          style={[
            styles.card,
            littleLearnerGame && {
              borderWidth: 3,
              borderColor: '#FDE68A',
              backgroundColor: '#F0FDF4',
            },
          ]}
        >
          {renderGameHeader(currentActivity)}

          {littleLearnerGame && (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 22,
                marginBottom: 10,
              }}
            >
              🌈 ⭐ 🎈 ⭐ 🌈
            </Text>
          )}

          {!littleLearnerGame && (
            <>
              <Text style={styles.cardTitle}>
                📖 {currentActivity.title}
              </Text>

              <Text style={styles.body}>
                {currentActivity.instructions}
              </Text>

              <ActivityGuideCard
                activity={currentActivity}
                littleLearnerGame={littleLearnerGame}
              />
            </>
          )}

          <ActivityVisualCard
            activity={currentActivity}
            lesson={lesson}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            disabled={submitting}
            onPress={() => advance('infographic')}
          >
            <Text style={styles.primaryText}>
              {littleLearnerGame
                ? '⭐ Naiintindihan Ko Na!'
                : 'Magpatuloy'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    const fileUrl = currentActivity.dataJson?.fileUrl;
    const vocabulary = currentActivity.dataJson?.words || [];
    const pairs = currentActivity.dataJson?.pairs || [];

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{currentActivity.title || 'Gawain sa Lesson'}</Text>
        <Text style={styles.body}>{currentActivity.instructions || currentActivity.dataJson?.content || 'Basahin muna ang gawaing ito bago magpatuloy.'}</Text>
        <ActivityGuideCard
            activity={currentActivity}
            littleLearnerGame={littleLearnerGame}
          />
        {littleLearnerGame && vocabulary.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#15803D',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Pindutin ang tamang sagot!
            </Text>

            {vocabulary.map((item, index) => (
              <View
                key={`${item.word}-${index}`}
                style={{
                  backgroundColor:'#F0FDF4',
                  borderRadius:20,
                  padding:12,
                  marginBottom:16,
                }}
              >
                <Text
                  style={{
                    fontSize:24,
                    fontWeight:'900',
                    textAlign:'center',
                    marginBottom:14,
                  }}
                >
                  {item.word}
                </Text>

                <TouchableOpacity
                  style={{
                    backgroundColor:'#FECACA',
                    padding:12,
                    borderRadius:999,
                    marginBottom:8,
                  }}
                  onPress={()=>{
                    Alert.alert('⭐ Magaling!','Tamang sagot!');
                  }}
                >
                  <Text style={{textAlign:'center',fontWeight:'900'}}>
                    {item.meaning}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          vocabulary.map((item, index) => (
            <View key={`${item.word}-${index}`} style={styles.contentRow}>
              <Text style={styles.question}>{item.word}</Text>
              <Text style={styles.body}>{item.meaning}</Text>
            </View>
          ))
        )}
        {littleLearnerGame && pairs.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '900',
                color: '#15803D',
                marginTop: 20,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              🧩 Itugma ang Magkapareho!
            </Text>

            <Text
              style={{
                textAlign: 'center',
                marginBottom: 12,
                color: '#475569',
                fontWeight: '700',
              }}
            >
              {selectedMatch
                ? `🎯 Selected: ${selectedMatch}`
                : 'Pumili muna ng salita sa kaliwa'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                {pairs.map((item, index) => {
                  const key = `${item.left}-${item.right}`;
                  const matched = matchedPairs[key];

                  return (
                    <TouchableOpacity
                      key={`left-${key}`}
                      disabled={matched}
                      style={{
                        backgroundColor: matched
                          ? '#DCFCE7'
                          : selectedMatch === item.left
                          ? '#DBEAFE'
                          : '#EFF6FF',
                        borderRadius: 20,
                        padding: 16,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: matched
                          ? '#22C55E'
                          : selectedMatch === item.left
                          ? '#2563EB'
                          : '#BFDBFE',
                      }}
                      onPress={() => setSelectedMatch(item.left)}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '900',
                          textAlign: 'center',
                        }}
                      >
                        {matched ? '✅ ' : ''}{item.left}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flex: 1 }}>
                {pairs.map((item, index) => {
                  const key = `${item.left}-${item.right}`;
                  const matched = matchedPairs[key];

                  return (
                    <TouchableOpacity
                      key={`right-${key}`}
                      disabled={matched}
                      style={{
                        backgroundColor: matched ? '#DCFCE7' : '#FEF3C7',
                        borderRadius: 20,
                        padding: 16,
                        marginBottom: 10,
                        borderWidth: 2,
                        borderColor: matched ? '#22C55E' : '#F59E0B',
                      }}
                      onPress={() => {
                        if (!selectedMatch) {
                          setActivityNotice({
                            type: 'warning',
                            title: '💡 Pumili Muna',
                            message: 'Pumili muna ng salita sa kaliwa. 😊',
                          });
                          return;
                        }

                        const correct = selectedMatch === item.left;

                        if (correct) {
                          const next = {
                            ...matchedPairs,
                            [key]: true,
                          };

                          setMatchedPairs(next);

                          const complete =
                            Object.keys(next).length === pairs.length;

                          setActivityNotice({
                            type: 'success',
                            title: complete
                              ? '🏆 Tapos na ang Pagtutugma!'
                              : '⭐ Magaling!',
                            message: complete
                              ? 'You finished the matching game!'
                              : `${item.left} = ${item.right}`,
                          });
                        } else {
                          setActivityNotice({
                            type: 'warning',
                            title: '🔄 Subukan Muli',
                            message: 'Hindi ito ang tamang pares. 😊 Subukan nating muli!',
                          });
                        }

                        setSelectedMatch(null);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '800',
                          textAlign: 'center',
                        }}
                      >
                        {item.right}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ) : (
          pairs.map((item, index) => (
            <View key={`${item.left}-${index}`} style={styles.contentRow}>
              <Text style={styles.question}>{item.left}</Text>
              <Text style={styles.body}>{item.right}</Text>
            </View>
          ))
        )}
        {fileUrl ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(fileUrl)}>
            <Text style={styles.secondaryText}>📎 Buksan ang Materyal</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => advance(currentActivity.type || 'activity')}
          disabled={submitting}
        >
          <Text style={styles.primaryText}>Magpatuloy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.body}>Inaayos ang aralin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Hindi nakita ang aralin.'}</Text>
          <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  navigation.popToTop()
                }>
            <Text style={styles.primaryText}>Bumalik</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Bumalik</Text>
          </TouchableOpacity>
          <View style={styles.studentChip}>
            <Text style={styles.avatar}>{student?.avatar || '🧒'}</Text>
            <Text style={styles.xp}>⚡ {student?.xp || 0}</Text>
          </View>
        </View>

        <Text style={styles.title}>📖 {lesson.title}</Text>
        <Text style={styles.stepText}>⚡ +{lesson.xpReward || 0} XP</Text>

        {littleLearnerGame ? (
          <View
            style={{
              backgroundColor:'#FFF7ED',
              borderRadius:24,
              padding:12,
              marginTop:4,
              marginBottom:8,
              borderWidth:2,
              borderColor:'#FED7AA',
            }}
          >
            <Text
              style={{
                fontSize:22,
                fontWeight:'900',
                color:'#15803D',
              }}
            >
              {(currentStep?.type === 'listen'
                ? '👂 Layunin'
                : currentStep?.type === 'know'
                ? '💡 Alamin'
                : currentStep?.type === 'read'
                ? '📖 Basahin ang Aralin'
                : currentStep?.type === 'finish'
                ? 'Tapos na ang Aralin'
                : currentActivity?.type === 'mcq'
                ? '🎮 Oras ng Pagsusulit'
                : currentActivity?.type === 'writing'
                ? '🧩 Fill in the Blank'
                : currentActivity?.type === 'speech'
                ? '🎤 Pagsasanay sa Pagbigkas'
                : currentActivity?.type === 'vocabulary'
                ? ' Words'
                : currentActivity?.type === 'matching'
                ? '🧩 Laro sa Pagtutugma'
                : currentActivity?.type === 'infographic'
                ? '📖 Basahin Muna'
                : ' Mission') + ' ⭐'}
            </Text>

            <Text
              style={{
                marginTop:4,
                color:'#475569',
                fontWeight:'700',
              }}
            >
              Hakbang {Math.min(step, totalSteps)}
            </Text>

            <View
              style={{
                height:6,
                backgroundColor:'#DCFCE7',
                borderRadius:999,
                marginTop:4,
                overflow:'hidden',
              }}
            >
              <View
                style={{
                  height:'100%',
                  width:`${Math.round((Math.min(step,totalSteps)/Math.max(totalSteps,1))*100)}%`,
                  backgroundColor:'#22C55E',
                }}
              />
            </View>

            <ScrollView
              ref={stepScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 4,
                paddingRight: 8,
              }}
              style={{
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flexDirection:'row',
                }}
              >
              {missionSteps.map((stepItem,index)=> {
                const icon = missionStepIcon(stepItem);
                const label = missionStepLabel(stepItem);
                return (
                <View
                  key={`${stepItem?.type || 'step'}-${stepItem?.title || stepItem?.activity?.id || stepItem?.activity?._id || stepItem?.activity?.type || label}-${index}`}
                  style={{
                    width:68,
                    minHeight:66,
                    marginRight:6,
                    paddingVertical:8,
                    borderRadius:12,
                    backgroundColor:
                      step === index + 1
                        ? '#FEF3C7'
                        : step > index + 1
                        ? '#DCFCE7'
                        : '#F1F5F9',
                    borderWidth:1,
                    borderColor:
                      step === index + 1
                        ? '#F59E0B'
                        : '#E2E8F0',
                    alignItems:'center',
                  }}
                >
                  <Text style={{fontSize:18}}>{icon}</Text>
                  <Text
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={{
                      fontSize:10,
                      fontWeight:'800',
                      marginTop:4,
                      textAlign:'center',
                      lineHeight:12,
                      width:'100%',
                    }}
                  >
                    {label}
                  </Text>
                </View>
                );
              })}
              </View>
            </ScrollView>
          </View>
        ) : null}


        {!completed && step > 1 ? (
          <TouchableOpacity
            style={styles.previousStepButton}
            onPress={goToPreviousStep}
            disabled={submitting}
          >
            <Text style={styles.previousStepText}>← Nakaraang Hakbang</Text>
          </TouchableOpacity>
        ) : null}

          {completed ? (
            <View style={styles.card}>
              <View
                style={{
                  backgroundColor:'#FFFBEB',
                  borderRadius:28,
                  padding:24,
                  alignItems:'center',
                  marginBottom:20,
                  borderWidth:2,
                  borderColor:'#FDE68A',
                }}
              >
                <View
                  style={{
                    alignItems:'center',
                    justifyContent:'center',
                  }}
                >

                  <Animated.Text
                    style={{
                      position:'absolute',
                      fontSize:42,
                      opacity: confettiAnim,
                      transform:[
                        {
                          translateY: confettiAnim.interpolate({
                            inputRange:[0,1],
                            outputRange:[30,-20],
                          }),
                        },
                        {
                          scale: confettiAnim.interpolate({
                            inputRange:[0,1],
                            outputRange:[0.6,1.2],
                          }),
                        },
                      ],
                    }}
                  >
                       ⭐ 🌟
                  </Animated.Text>

                  <Animated.Text
                    style={{
                      position:'absolute',
                      fontSize:34,
                      opacity:0.75,
                      transform:[
                        { scale:starBurstScale },
                      ],
                    }}
                  >
                    ⭐ 🌟
                  </Animated.Text>

                  <Animated.View
                    style={{
                      transform:[
                        { scale:trophyScale },
                      ],
                    }}
                  >
                    <Text style={{fontSize:72}}>🏆</Text>
                  </Animated.View>
                </View>

                <Text
                  style={{
                    fontSize:22,
                    fontWeight:'900',
                    color:'#92400E',
                    marginTop:4,
                  }}
                >
                  Tapos na ang Aralin!
                </Text>

                <Text
                  style={{
                    textAlign:'center',
                    color:'#78716C',
                    marginTop:4,
                    marginBottom:18,
                  }}
                >
                  Magaling! Natapos mo ang aralin at nakamit ang iyong mga gantimpala.
                </Text>

                <View
                  style={{
                    width:'100%',
                    backgroundColor:'#ECFDF5',
                    borderRadius:18,
                    padding:12,
                    marginBottom:8,
                    borderWidth:1,
                    borderColor:'#BBF7D0',
                  }}
                >
                  <Text style={{fontSize:16,fontWeight:'900',color:'#166534'}}>
                    ⚡ Nakuhang XP
                  </Text>

                  <Text
                    style={{
                      fontSize:30,
                      fontWeight:'900',
                      color:'#15803D',
                      marginTop:4,
                    }}
                  >
                    +{animatedXp}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection:'row',
                    width:'100%',
                    gap:8,
                    marginTop:4,
                  }}
                >
                  <View
                    style={{
                      flex:1,
                      backgroundColor:'#FEF3C7',
                      borderRadius:16,
                      padding:12,
                      alignItems:'center',
                    }}
                  >
                    <Text style={{fontSize:28}}>⭐</Text>

                    <Text
                      style={{
                        fontWeight:'900',
                        fontSize:18,
                        textAlign:'center',
                        color:'#15803D',
                        marginTop:6,
                      }}
                    >
                      Ang Husay Mo!
                    </Text>

                    <Text
                      style={{
                        fontSize:12,
                        color:'#78716C',
                        textAlign:'center',
                        marginTop:2,
                      }}
                    >
                      Patuloy na matuto!
                    </Text>
                  </View>

                  <View
                    style={{
                      flex:1,
                      backgroundColor:'#DBEAFE',
                      borderRadius:16,
                      padding:12,
                      alignItems:'center',
                    }}
                  >
                    <Image source={getBadgeImageSource(completionResult?.newBadges?.[0] || activeBadgePopup)} style={styles.badgeImage} resizeMode="contain" />
                    <Text
                      style={{
                        fontWeight:'900',
                        fontSize:24,
                        color:'#1D4ED8',
                        marginTop:4,
                      }}
                    >
                      {(completionResult?.newBadges || []).length}
                    </Text>
                    <Text
                      style={{
                        fontSize:11,
                        fontWeight:'700',
                        color:'#475569',
                        marginTop:2,
                      }}
                    >
                      Mga Bagong Badge
                    </Text>
                  </View>
                </View>
              </View>

              {(completionResult?.newBadges || []).map((badge) => (
                <View key={badge.id || badge.code} style={styles.badgeRow}>
                  <Image source={getBadgeImageSource(badge)} style={styles.badgeImage} resizeMode="contain" />
                  <View>
                    <Text
                      style={{
                        fontSize:16,
                        fontWeight:'900',
                        color:'#92400E',
                      }}
                    >
                      Bagong Badge
                    </Text>

                    <Text
                      style={{
                        fontSize:18,
                        fontWeight:'900',
                        marginTop:4,
                      }}
                    >
                      {badge.name}
                    </Text>

                    <Text
                      style={{
                        color:'#78716C',
                        marginTop:2,
                      }}
                    >
                      Nakamit ang Tagumpay
                    </Text>
                  </View>
                </View>
              ))}

              <Animated.View
                style={{
                  opacity: continueButtonAnim,
                  transform: [
                    {
                      translateY: continueButtonAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [24, 0],
                      }),
                    },
                  ],
                }}
              >
                {nextLesson ? (
                  <TouchableOpacity
                    style={styles.finishHeroButton}
                    onPress={() =>
                      navigation.navigate('Lessons', {
                        screen: 'StudentJuniorLessonDetail',
                        params: { lessonId: nextLesson.id, homeRoute },
                      })
                    }
                  >

                    <View style={styles.finishHeroTextWrap}>
                      <Text style={styles.finishHeroTitle}>
                        Susunod na Aralin
                      </Text>

                      <Text style={styles.finishHeroSubtitle}>
                        Magpatuloy sa susunod na aralin.
                      </Text>
                    </View>
                  </TouchableOpacity>
                ) : null}

                  <TouchableOpacity
                    style={styles.finishCardButton}
                    onPress={() =>
                      navigation.navigate('Lessons', {
                        screen: lessonsListScreen,
                      })
                    }
                  >

                    <View style={styles.finishCardTextWrap}>
                      <Text style={styles.finishCardTitle}>
                        Bumalik sa mga Aralin
                      </Text>

                      <Text style={styles.finishCardSubtitle}>
                        Pumili ng ibang aralin
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.finishCardButton}
                    onPress={() =>
                      navigation.navigate(homeRoute, {
                        screen: 'Home',
                      })
                    }
                  >

                    <View style={styles.finishCardTextWrap}>
                      <Text style={styles.finishCardTitle}>
                        Bumalik sa Tahanan
                      </Text>

                      <Text style={styles.finishCardSubtitle}>
                        Return to your dashboard
                      </Text>
                    </View>
                  </TouchableOpacity>
              </Animated.View>
            </View>
          ) : renderActivity()}
      </ScrollView>
      </KeyboardAvoidingView>

      {badgePopup ? (
        <Animated.View
          style={{
            position:'absolute',
            top:70,
            right:16,
            left:16,
            backgroundColor:'#FFFFFF',
            borderRadius:24,
            padding:18,
            borderWidth:2,
            borderColor:'#FDE68A',
            shadowColor:'#000',
            shadowOpacity:0.15,
            shadowRadius:12,
            elevation:6,
            flexDirection:'row',
            alignItems:'center',
            transform:[{ scale: badgeScale }],
          }}
        >
          <Image source={getBadgeImageSource(activeBadgePopup)} style={styles.badgePopupImage} resizeMode="contain" />

          <View style={{ flex:1 }}>
            <Text
              style={{
                color:'#D97706',
                fontWeight:'900',
                fontSize:12,
              }}
            >
              Bagong Badge!
            </Text>

            <Text
              style={{
                fontSize:18,
                fontWeight:'900',
                color:'#92400E',
                marginTop:2,
              }}
            >
              {badgePopup?.name || 'Bagong Tagumpay'}
            </Text>

            <Text
              style={{
                color:'#78716C',
                marginTop:2,
                fontSize:13,
              }}
            >
              Nakamit ang Tagumpay ⭐
            </Text>
          </View>
        </Animated.View>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  completionToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  completionToastIcon: {
    fontSize: 22,
  },
  completionToastCopy: {
    flex: 1,
  },
  completionToastTitle: {
    color: '#064E3B',
    fontSize: 20,
    fontWeight: '900',
  },
  completionToastBody: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  visualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  visualImageWrap: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  visualImage: {
    width: '100%',
    height: '100%',
  },
  visualEmoji: {
    fontSize: 42,
  },
  visualCopy: {
    flex: 1,
  },
  visualTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1D4ED8',
    marginBottom: 5,
  },
  visualBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    fontWeight: '600',
  },

  celebrationHero: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FEF3C7',
    borderWidth: 4,
    borderColor: '#FACC15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  celebrationEmoji: {
    fontSize: 64,
  },
  celebrationSparkles: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F97316',
    marginTop: 4,
  },

  passageCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  passageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 8,
  },
  passageBody: {
    fontSize: 15,
    lineHeight: 23,
    color: '#374151',
  },

  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  page: { padding: 18, paddingBottom: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#16A34A', fontWeight: '900' },
  studentChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  avatar: { fontSize: 20, marginRight: 5 },
  xp: { color: '#F97316', fontWeight: '900' },
  title: { color: '#16A34A', fontSize: 31, fontWeight: '900', marginTop: 20 },
  studentStoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },

  studentStoryEyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 6,
  },

  studentStoryTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 10,
  },

  studentStoryBody: {
    color: '#1F2937',
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },

  studentStoryLanguageLabel: {
    color: '#16A34A',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Nunito_800ExtraBold',
    marginTop: 4,
    marginBottom: 4,
  },

  studentStoryBodyTranslation: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 12,
  },

  studentStoryTaskBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  studentStoryTaskLabel: {
    color: '#15803D',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },

  studentStoryTask: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Nunito_800ExtraBold',
  },

  studentStoryTaskTranslation: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Nunito_700Bold',
    marginTop: 6,
  },

  juniorVisualReadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },

  juniorVisualReadEyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },

  juniorVisualReadTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 12,
  },

  juniorVisualReadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  juniorVisualReadItem: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 92,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  juniorVisualReadIcon: {
    fontSize: 30,
    marginBottom: 4,
  },

  juniorVisualReadLabel: {
    color: '#15803D',
    fontSize: 13,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 4,
  },

  juniorVisualReadText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Nunito_700Bold',
    textAlign: 'center',
  },

  juniorVisualReadHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Nunito_700Bold',
    marginTop: 10,
  },

  stepText: { color: '#64748B', marginTop: 7 },
  progressTrack: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 10,
    alignSelf: 'center',
    minWidth: '75%', marginBottom: 20 },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardTitle: { color: '#0F172A', fontSize: 23, fontWeight: '900' },
  body: { color: '#475569', lineHeight: 22, marginTop: 10 },
  questionBlock: {
    marginTop: 8,
    marginBottom: 4,
  },
  question: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  option: {
    borderWidth: 2,
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 10,
    minHeight: 58,
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  optionLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionIncorrect: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },


  optionText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
    flex: 1,
  },
  feedbackCard: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 10,
    alignSelf: 'center',
    minWidth: '75%',
    borderWidth: 2,
  },
  feedbackSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  feedbackWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  feedbackTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  feedbackMessage: {
    color: '#475569',
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '700',
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  choiceChip: { backgroundColor: '#FEF3C7', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 },
  choiceText: { color: '#92400E', fontWeight: '900' },
  input: { borderWidth: 2, borderColor: '#D1FAE5', borderRadius: 14, minHeight: 110, padding: 12, marginTop: 10,
    alignSelf: 'center',
    minWidth: '75%', textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 18,
  },
  secondaryButton: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 12,
  },

  equalAlaminActionButton: {
    width: '48%',
    height: 60,
    minHeight: 60,
    maxHeight: 60,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    marginTop: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  equalAlaminActionText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
    includeFontPadding: false,
  },
  finishHeroButton: {
    marginTop: 24,
    backgroundColor: '#16A34A',
    borderRadius: 22,
    minHeight: 78,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  finishHeroTextWrap: {
    flex: 1,
    marginHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',},

  finishHeroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
    textAlign: 'center',},

  finishHeroSubtitle: {
    color: '#DCFCE7',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'center',},

  finishCardButton: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#A7F3D0',

    minHeight: 82,
    paddingHorizontal: 20,
    paddingVertical: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',},

  finishCardTextWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',},

  finishCardTitle: {
    color: '#166534',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    textAlign: 'center',},

  finishCardSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
    textAlign: 'center',},
  recordingButton: { backgroundColor: '#FEE2E2' },
  secondaryText: {
    color: '#166534',
    fontWeight: '900',
    fontSize: 20,
    textAlign: 'center',
    width: '100%',},

  kidSpeechButton: {
    width: '100%',
    minHeight: 72,
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#86EFAC',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  kidSpeechIcon: {
    fontSize: 34,
  },
  kidSpeechLabel: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '900',
    color: '#15803D',
  },

  speechButtons: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 12,
  },
  speechPassageWrap: { marginTop: 16 },
  statusMessage: { color: '#0369A1', fontWeight: '800', marginTop: 10 },
  contentRow: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginTop: 10 },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  stepDot: { backgroundColor: '#E2E8F0', borderRadius: 99, padding: 7 },
  stepDotActive: { backgroundColor: '#DCFCE7' },
  stepIcon: { fontSize: 15 },
  previousStepButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  previousStepText: {
    color: '#15803D',
    fontSize: 15,
    fontWeight: '900',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderRadius: 20,
    padding: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeIcon: { fontSize: 32 },
  badgeImage: {
    width: 38,
    height: 38,
  },
  badgePopupImage: {
    width: 96,
    height: 96,
    marginRight: 14,
  },


  disabledButton: { backgroundColor: '#CBD5E1' },
  primaryText: { color: '#FFF', fontWeight: '900',
    textAlign: 'center',
    width: '100%',},
  reward: { color: '#F97316', fontSize: 28, fontWeight: '900', marginTop: 14 },
  error: { color: '#B91C1C', textAlign: 'center' },
});
