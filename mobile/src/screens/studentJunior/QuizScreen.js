import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StudentScreenHeader from '../../components/StudentScreenHeader';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { api } from '../../api/client';
import Card from '../../components/Card';
import { colors } from '../../styles/theme';

const MAX_QUIZ_ATTEMPTS = 2;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeQuizOption(option = {}, index = 0) {
  const rawText =
    option?.text ??
    option?.optionText ??
    option?.label ??
    option?.value ??
    `Choice ${index + 1}`;

  const text = String(rawText || `Choice ${index + 1}`).trim() || `Choice ${index + 1}`;

  return {
    id: String(option?.id ?? option?.value ?? `opt-${index}-${text}`),
    text,
    optionText: text,
    isCorrect: Boolean(option?.isCorrect || option?.correct),
  };
}

function stableShuffleOptions(options = [], seed = '') {
  const rows = [...options];
  let hash = String(seed || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

  for (let i = rows.length - 1; i > 0; i -= 1) {
    hash = (hash * 9301 + 49297) % 233280;
    const j = hash % (i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }

  return rows;
}


function randomizeQuizChoicesForAttempt(quiz = {}, attemptNo = 1) {
  const seed = [
    quiz.quizId || quiz.id || quiz.legacyQuizId || 'quiz',
    attemptNo,
    Date.now(),
    Math.random(),
  ].join('-');

  return {
    ...quiz,
    questions: asArray(quiz.questions).map((question, questionIndex) => ({
      ...question,
      options: stableShuffleOptions(
        asArray(question.options),
        `${seed}-${question.id || questionIndex}`
      ),
    })),
  };
}

function buildFallbackOptions(correctText, alternates = []) {
  const correct = String(correctText || 'Filipino');
  const choices = [
    correct,
    ...alternates
      .filter(Boolean)
      .filter((item) => String(item) !== correct),
  ];

  const fillers = [
    'Pagbasa',
    'Bokabularyo',
    'Panitikan',
    'Komunikasyong Pagsasalita',
    'Pagsulat',
    'Hindi nabanggit',
  ];

  fillers.forEach((item) => {
    if (choices.length < 4 && !choices.includes(item)) choices.push(item);
  });

  const options = choices.slice(0, 4).map((text, index) => ({
    id: `fallback-${index}-${String(text).replace(/\s+/g, '-').toLowerCase()}`,
    text,
    optionText: text,
    isCorrect: String(text) === correct,
  }));

  return stableShuffleOptions(options, correct);
}

function buildQuizQuestionsFromLesson(lesson = {}) {
  const activities = asArray(lesson?.activities);
  const questions = [];

  activities.forEach((activity, activityIndex) => {
    if (activity?.type !== 'mcq') return;

    asArray(activity.questions).forEach((question, questionIndex) => {
      const normalizedOptions = asArray(question.options || question.choices).map(normalizeQuizOption);
      if (!normalizedOptions.length) return;

      const hasCorrect = normalizedOptions.some((option) => option.isCorrect);
      const options = hasCorrect
        ? normalizedOptions
        : normalizedOptions.map((option, idx) => ({
            ...option,
            isCorrect: idx === 0,
          }));

      const prompt =
        question.question ||
        question.prompt ||
        question.text ||
        'Piliin ang tamang sagot.';

      questions.push({
        id: String(question.id || `${lesson.id || 'lesson'}-${activityIndex}-${questionIndex}`),
        type: 'mcq',
        source: formatTuklasQuizPreviewTitle({ lessonTitle: activity?.lessonTitle || activity?.lesson?.title || activity?.title, quizTitle: activity?.title, gradeLevel: activity?.gradeLevel || activity?.lesson?.gradeLevel || activity?.lessonGradeLevel }),
        question: prompt,
        prompt,
        options,
        points: Number(question.points || 1),
      });
    });
  });

  return questions.slice(0, 25);
}

function cleanQuizTitle(title, fallback = 'Pagsusulit') {
  const value = String(title || '').trim();
  return value || fallback;
}

function quizCatalog(dashboard) {
  return asArray(dashboard?.lessons)
    .map((lesson) => {
      const questions = buildQuizQuestionsFromLesson(lesson);
      const lessonTitle = cleanQuizTitle(lesson.title, 'Aralin');
      const quizId = `lesson-${lesson.id || lesson.title}-quiz`;

      return {
        id: quizId,
        quizId,
        legacyQuizId: `lesson-${lesson.id}`,
        lessonId: lesson.id,
        lessonTitle,
        title: formatTuklasQuizPreviewTitle({ lessonTitle, gradeLevel: lesson.gradeLevel || lesson.grade || lesson.level, studentGradeLevel: dashboard?.student?.gradeLevel }),
        subject: lesson.subject || 'Filipino',
        gradeLevel: lesson.gradeLevel || dashboard?.student?.gradeLevel || '—',
        xpReward: Math.max(5, Math.round(Number(lesson.xpReward || 20) / 2)),
        type: lesson.completed ? 'Pagsusulit Pagkatapos ng Aralin' : 'Pagsasanay na Pagsusulit',
        unlocked: true,
        questions,
      };
    })
    .filter((quiz) => quiz.questions.length);
}

function getQuizAttempts(attempts = {}, quiz = {}) {
  return attempts[quiz.quizId] || attempts[quiz.id] || attempts[quiz.legacyQuizId] || [];
}

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}



function quizQuestionText(question = {}) {
  return (
    question.question ||
    question.prompt ||
    question.text ||
    question.title ||
    ''
  );
}

function quizOptionText(option = {}) {
  return (
    option.optionText ||
    option.text ||
    option.label ||
    option.value ||
    ''
  );
}

function titleCasePagsusulitText(value = '') {
  const smallWords = new Set(['ang', 'ng', 'sa', 'si', 'ni', 'kay', 'at', 'ay', 'mga', 'na', 'po']);

  return String(value || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && smallWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function cleanPagsusulitTitleSeed(value = '') {
  let seed = String(value || '')
    .replace(/[“”"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  seed = seed
    .replace(/^mission\s*:\s*/i, '')
    .replace(/^tanong\s*\d+\s*[:.-]?\s*/i, '')
    .replace(/^question\s*\d+\s*[:.-]?\s*/i, '')
    .replace(/\s*quiz\s*$/i, '')
    .trim();

  [
    /^ano ang\s+/i,
    /^alin ang\s+/i,
    /^sino ang\s+/i,
    /^saan\s+/i,
    /^kailan\s+/i,
    /^bakit\s+/i,
    /^paano\s+/i,
    /^piliin ang\s+/i,
    /^hanapin ang\s+/i,
    /^tukuyin ang\s+/i,
    /^isulat ang\s+/i,
    /^bigkasin\s*:?\s*/i,
    /^basahin\s*:?\s*/i,
    /^ayusin ang\s+/i,
    /^buuin ang\s+/i,
    /^kumpletuhin ang\s+/i,
    /^sagutin ang\s+/i,
  ].forEach((pattern) => {
    seed = seed.replace(pattern, '');
  });

  seed = seed
    .replace(/[?.!]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return titleCasePagsusulitText(seed.split(/\s+/).filter(Boolean).slice(0, 6).join(' '));
}

function specificQuizCardTitle(quiz = {}) {
  const lessonTitle =
    quiz.lessonTitle ||
    quiz.lesson?.title ||
    quiz.lesson?.name ||
    quiz.moduleTitle ||
    quiz.title ||
    'Lessons';

  return formatTuklasQuizPreviewTitle({
    lessonTitle,
    quizTitle: quiz.title,
    gradeLevel: quiz.gradeLevel || quiz.lessonGradeLevel || quiz.lesson?.gradeLevel || quiz.grade || quiz.moduleGradeLevel,
    studentGradeLevel: quiz.studentGradeLevel,
  });
}


function extractTuklasGradeNumber(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    const match = text.match(/\b(?:grade|baitang|level)?\s*([1-6])\b/i);
    if (match) return match[1];
  }
  return '';
}

function cleanTuklasQuizLessonTitle(value, fallback = 'Lessons') {
  return String(value ?? fallback)
    .trim()
    .replace(/^\s*(?:quizzes?|pagsusulit)\s+sa\s+/i, '')
    .replace(/^\s*sa\s+/i, '')
    .replace(/^\s*bokabularyo\s*[1-6]\s*:\s*/i, '')
    .replace(/\s*quiz\s*$/i, '')
    .trim() || fallback;
}

function formatTuklasQuizPreviewTitle({ lessonTitle, quizTitle, gradeLevel, studentGradeLevel, fallback = 'Lessons' } = {}) {
  const lesson = cleanTuklasQuizLessonTitle(lessonTitle || quizTitle, fallback);
  return `Pagsusulit sa ${lesson}`;
}

export default function QuizScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);

 const [previewQuiz, setPreviewQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setDashboard(await api('/dashboard'));
    } catch (err) {
      setError(err.message || 'Hindi ma-load ang mga pagsusulit.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const quizzes = useMemo(() => quizCatalog(dashboard), [dashboard]);
  const student = dashboard?.student;
  const attempts = dashboard?.quizAttempts || {};

 const previewQuizAttempts = previewQuiz ? (attempts[previewQuiz.quizId] || []) : [];

 const previewBest = previewQuizAttempts.reduce(
  (value, attempt) => Math.max(value, attempt.percent || 0),
  0
 );
  const activeQuizAttempts = activeQuiz ? getQuizAttempts(attempts, activeQuiz) : [];
  const canRetry = activeQuizAttempts.length < MAX_QUIZ_ATTEMPTS;
  const question = activeQuiz?.questions?.[questionIndex];
  const selectedOptionId = question ? answers[question.id] : null;
  const progressPercent = activeQuiz?.questions?.length
    ? Math.round(((questionIndex + 1) / activeQuiz.questions.length) * 100)
    : 0;

  function openQuizPreview(quiz) {
    setPreviewQuiz(null);
    setActiveQuiz(randomizeQuizChoicesForAttempt(quiz, getQuizAttempts(quizAttempts, quiz).length + 1));
    setQuestionIndex(-1);
    setAnswers({});
    setResult(null);
  }

const closeQuizPreview = useCallback(() => {
  setPreviewQuiz(null);
 }, []);

 function startQuiz(quiz) {
    setPreviewQuiz(null);
    setActiveQuiz(quiz);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  }

  const closeQuiz = useCallback(() => {
  setActiveQuiz(null);
  setPreviewQuiz(null);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!activeQuiz && !previewQuiz) return undefined;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
  if (activeQuiz) {
    closeQuiz();
  } else {
    closeQuizPreview();
  }

  return true;
 });

      return () => subscription.remove();
    }, [activeQuiz, closeQuiz, closeQuizPreview, previewQuiz])
  );
  async function submitQuiz() {
    if (!activeQuiz || submitting) return;

    if (activeQuizAttempts.length >= MAX_QUIZ_ATTEMPTS) {
      Alert.alert('Pagsusulit', 'Naubos na ang 2 pagsubok para sa pagsusulit na ito.');
      return;
    }

    const review = activeQuiz.questions.map((item, index) => {
      const selectedOptionId = answers[item.id];
      const selectedOption = (item.options || []).find(
        (candidate) => String(candidate.id) === String(selectedOptionId)
      );
      const correctOption =
        (item.options || []).find((candidate) => candidate.isCorrect || candidate.correct) ||
        (item.options || [])[0];

      const points = Number(item.points || 1);
      const correct = Boolean(
        selectedOption &&
          correctOption &&
          String(selectedOption.id) === String(correctOption.id)
      );

      return {
        index: index + 1,
        questionId: item.id,
        prompt: item.prompt || item.question,
        selectedOptionId,
        correctOptionId: correctOption?.id || null,
        selectedText: selectedOption?.text || selectedOption?.optionText || 'Walang sagot',
        correctText: correctOption?.text || correctOption?.optionText || '—',
        isCorrect: correct,
        correct,
        pointsEarned: correct ? points : 0,
        points,
      };
    });

    if (review.some((item) => !item.selectedOptionId)) {
      Alert.alert('Pagsusulit', 'Sagutin muna ang lahat ng tanong bago ipasa ang pagsusulit.');
      return;
    }

    const score = review.reduce((total, item) => total + Number(item.pointsEarned || 0), 0);
    const total = review.reduce((sum, item) => sum + Number(item.points || 1), 0);
    const percent = total ? Math.round((score / total) * 100) : 0;

    setSubmitting(true);

    try {
      const data = await api(`/lessons/${activeQuiz.lessonId}/quiz-result`, {
        method: 'POST',
        body: {
          quizId: activeQuiz.quizId,
          quizTitle: activeQuiz.title,
          lessonTitle: activeQuiz.lessonTitle,
          subject: activeQuiz.subject,
          gradeLevel: activeQuiz.gradeLevel,
          xpReward: activeQuiz.xpReward,
          type: activeQuiz.type,
          score,
          total,
          percent,
          review,
        },
      });

      const quizResult = data.quizResult || null;
      const savedAttempts = data.quizAttempts || [];
      const reviewItems = savedAttempts.length
        ? (savedAttempts[savedAttempts.length - 1].review || [])
        : review;

      setResult(
        quizResult
          ? {
              ...quizResult,
              review: reviewItems,
            }
          : {
              quizId: activeQuiz.quizId,
              quizTitle: activeQuiz.title,
              lessonTitle: activeQuiz.lessonTitle,
              score,
              total,
              percent,
              xpAwarded: Math.round((Number(activeQuiz.xpReward || 10) * percent) / 100),
              masteryLabel: percent >= 75 ? 'Mahusay' : 'Subukan muli',
              review,
            }
      );

      await load();
    } catch (err) {
      Alert.alert('Pagsusulit', err.message || 'Hindi maipasa ang pagsusulit.');
    } finally {
      setSubmitting(false);
    }
  }

  function continueQuiz() {
    if (!selectedOptionId) {
      Alert.alert('Pagsusulit', 'Pumili muna ng sagot bago magpatuloy.');
      return;
    }

    if (questionIndex < activeQuiz.questions.length - 1) {
      setQuestionIndex((index) => index + 1);
      return;
    }

    submitQuiz();
  }

  if (loading && !dashboard) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingTitle}>Kinukuha ang mga pagsusulit...</Text>
        <Text style={styles.loadingText}>Sandali lang, inihahanda namin ang iyong mga tanong.</Text>
      </View>
    );
  }

  if (activeQuiz) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={[styles.quizBackButton, { marginBottom: 18 }]}
            onPress={closeQuiz}
            activeOpacity={0.85}
          >
            <Text style={styles.quizBackButtonText}>← Bumalik sa mga Pagsusulit</Text>
          </TouchableOpacity>

          <View style={styles.activeHero}>
            <Text style={styles.activeEyebrow}>🧠 PAGSUSULIT</Text>
            <Text style={styles.activeTitle}>{specificQuizCardTitle(activeQuiz)}</Text>
            <Text style={styles.activeSubtitle}>{activeQuiz.lessonTitle}</Text>
          <Text style={styles.attemptPill}>
            Pagsubok {Math.min(activeQuizAttempts.length, MAX_QUIZ_ATTEMPTS)}/{MAX_QUIZ_ATTEMPTS}
          </Text>
          </View>

          {!result && questionIndex < 0 ? (
            <Card style={styles.previewCard}>
              <Text style={styles.previewEmoji}>📝</Text>
              <Text style={styles.previewTitle}>Handa ka na ba?</Text>
              <Text style={styles.previewText}>
                Basahin muna ang detalye ng pagsusulit bago magsimula. Kapag pinindot mo ang simulan, lalabas agad ang unang tanong.
              </Text>

              <View style={styles.previewStatsRow}>
                <View style={styles.previewStat}>
                  <Text style={styles.previewStatValue}>{activeQuiz.questions.length}</Text>
                  <Text style={styles.previewStatLabel}>Tanong</Text>
                </View>

                <View style={styles.previewStat}>
                  <Text style={styles.previewStatValue}>
                    {activeQuizAttempts.length}/{MAX_QUIZ_ATTEMPTS}
                  </Text>
                  <Text style={styles.previewStatLabel}>Pagsubok</Text>
                </View>

                <View style={styles.previewStat}>
                  <Text style={styles.previewStatValue}>
                    {activeQuizAttempts.reduce((value, attempt) => Math.max(value, attempt.percent || 0), 0)}%
                  </Text>
                  <Text style={styles.previewStatLabel}>Best</Text>
                </View>
              </View>

              <View style={styles.previewRules}>
                <Text style={styles.previewRuleTitle}>Bago magsimula</Text>
                <Text style={styles.previewRule}>• Basahin nang mabuti ang bawat tanong.</Text>
                <Text style={styles.previewRule}>• Pumili ng isang sagot bago magpatuloy.</Text>
                <Text style={styles.previewRule}>• Maaari kang bumalik sa nakaraang tanong habang hindi pa naipapasa.</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 18 }]}
                onPress={() => startQuiz(activeQuiz)}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Simulan Ngayon</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, styles.secondaryButton]}
                onPress={closeQuiz}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Hindi Muna</Text>
              </TouchableOpacity>
            </Card>
          ) : result ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>🎉</Text>
              <Text style={styles.resultTitle}>Magaling!</Text>

              <View style={styles.resultScoreCircle}>
                <Text style={styles.resultScore}>{result.percent}%</Text>
              </View>

              <Text style={styles.resultMeta}>
                Iskor: {result.score}/{result.total}
              </Text>

              <Text style={styles.masteryText}>
                {result.masteryLabel}
              </Text>

              <Text style={styles.xpAward}>
                ⭐ +{result.xpAwarded || 0} XP ang nakuha
              </Text>

              {(result.review || []).length > 0 && (
                <View style={styles.reviewWrap}>
                  <Text style={styles.reviewTitle}>
                    📝 Balikan ang Iyong mga Sagot
                  </Text>

                  {(result.review || []).map((item, index) => (
                    <View
                      key={item.questionId || index}
                      style={[
                        styles.reviewItem,
                        item.isCorrect ? styles.reviewCorrect : styles.reviewWrong,
                      ]}
                    >
                      <Text style={styles.reviewItemText}>
                        {index + 1}. {item.isCorrect || item.correct ? '✅ Tama' : '❌ Mali'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {canRetry && (
                <TouchableOpacity
                  style={[styles.primaryButton, styles.retryButton, styles.resultActionButton, styles.resultRetryButtonSpacing]}
                  onPress={() => {
                    setActiveQuiz((currentQuiz) =>
                      randomizeQuizChoicesForAttempt(
                        currentQuiz,
                        activeQuizAttempts.length + 1
                      )
                    );
                    setResult(null);
                    setAnswers({});
                    setQuestionIndex(0);
                  }}
                >
                  <Text style={[styles.primaryButtonText, styles.resultActionButtonText]}>🔄 Subukan Muli</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, styles.resultActionButton, styles.resultBackButtonSpacing]}
                onPress={closeQuiz}
              >
                <Text style={styles.primaryButtonText}>
                  Bumalik sa mga Pagsusulit
                </Text>
              </TouchableOpacity>
            </View>
          ) : question ? (
            <>
              <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <Text style={styles.progressText}>
                    Tanong {questionIndex + 1} sa {activeQuiz.questions.length}
                  </Text>

                  <Text style={styles.progressPercent}>
                    {progressPercent}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                </View>
              </View>

              <Card style={styles.questionCard}>
                {!!question.source && (
                  <Text style={styles.questionSource}>{question.source}</Text>
                )}
                <Text style={styles.question}>{question.prompt || question.question}</Text>

                {(question.options || []).map((option, index) => {
                  const selected = selectedOptionId === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.option, selected && styles.optionSelected]}
                      onPress={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                      activeOpacity={0.85}
                    >
                      <View style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                        <Text style={[styles.optionLetterText, selected && styles.optionLetterTextSelected]}>
                          {optionLetter(index)}
                        </Text>
                      </View>

                      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                        {option.text || option.optionText}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {questionIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.primaryButton, styles.secondaryButton]}
                    onPress={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                  >
                    <Text style={styles.secondaryButtonText}>← Nakaraan</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.quizNextButtonSpacing, styles.primaryButton, !selectedOptionId && styles.buttonDisabled]}
                  onPress={continueQuiz}
                  disabled={!selectedOptionId || submitting}
                >
                  <Text style={styles.primaryButtonText}>
                    {submitting
                      ? 'Ipinapasa...'
                      : questionIndex === activeQuiz.questions.length - 1
                        ? 'Ipasa ang Pagsusulit'
                        : 'Susunod na Tanong'}
                  </Text>
                </TouchableOpacity>
              </Card>
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>Walang tanong sa pagsusulit na ito.</Text>
              <Text style={styles.emptyText}>Bumalik muna at pumili ng ibang pagsusulit.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <StudentScreenHeader
          navigation={navigation}
          avatar={student?.avatar}
          gradeLevel={student?.gradeLevel}
        />

        <View style={styles.listHero}>
          <Text style={styles.listEmoji}>🧠</Text>
          <View style={styles.listHeroText}>
            <Text style={styles.title}>Mga Pagsusulit</Text>
            <Text style={styles.subtitle}>
              Subukan ang iyong natutuhan at mangolekta ng XP.
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryValue}>{quizzes.length}</Text>
            <Text style={styles.summaryLabel}>Pagsusulit</Text>
          </View>

          <View style={styles.summaryChip}>
            <Text style={styles.summaryValue}>{MAX_QUIZ_ATTEMPTS}</Text>
            <Text style={styles.summaryLabel}>Pagsubok</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>May problema</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : quizzes.length ? (
          <View style={styles.quizList}>
            {quizzes.map((quiz, index) => {
              const quizAttempts = getQuizAttempts(attempts, quiz);
              const limitReached = quizAttempts.length >= MAX_QUIZ_ATTEMPTS;
              const best = quizAttempts.reduce(
                (value, attempt) => Math.max(value, attempt.percent || 0),
                0
              );

              return (
                <Card key={quiz.quizId} style={styles.quizListCard}>
                  <View style={styles.quizCardTop}>
                    <View style={styles.quizIconWrap}>
                      <Text style={styles.quizIcon}>{index % 2 === 0 ? '📝' : '⭐'}</Text>
                    </View>

                    <View style={styles.quizCardText}>
                      <Text style={styles.quizTitle}>{specificQuizCardTitle(quiz)}</Text>
                      <Text style={styles.muted}>{quiz.subject} • Grade {quiz.gradeLevel}</Text>
                    <Text style={styles.muted}>{quiz.type}</Text>
                    </View>
                  </View>

                  <View style={styles.quizInfoRow}>
                    <Text style={styles.quizInfoPill}>
                      {quiz.questions.length} tanong
                    </Text>

                    <Text style={styles.quizInfoPill}>
                      {quizAttempts.length}/{MAX_QUIZ_ATTEMPTS} pagsubok
                    </Text>
                  </View>

                  {quizAttempts.length > 0 ? (
                    <Text style={styles.quizBest}>
                      🏆 Pinakamataas na Iskor: {best}%
                    </Text>
                  ) : (
                    <Text style={styles.quizReady}>
                      Handa ka na bang sumagot?
                    </Text>
                  )}

                  <TouchableOpacity
                    style={[styles.primaryButton, styles.quizStartButton, limitReached && styles.buttonDisabled]}
                    onPress={() => openQuizPreview(quiz)}
                    disabled={limitReached}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      {limitReached ? 'Naubos na ang 2 Pagsubok' : 'Simulan ang Pagsusulit'}
                    </Text>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Wala pang pagsusulit</Text>
            <Text style={styles.emptyText}>
              Tapusin muna ang mga aralin para magkaroon ng pagsusulit.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 100,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 24,
  },

  loadingTitle: {
    marginTop: 14,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  loadingText: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },

  listHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    marginTop: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  listEmoji: {
    fontSize: 42,
    width: 62,
    height: 62,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 14,
  },

  listHeroText: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginTop: 4,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  summaryChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  summaryValue: {
    color: '#16A34A',
    fontSize: 24,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 14,
  },

  quizList: {
    gap: 12,
  },

  quizListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
  },

  quizCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  quizIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },

  quizIcon: {
    fontSize: 32,
  },

  quizCardText: {
    flex: 1,
    minWidth: 0,
  },

  quizTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 25,
  },

  muted: {
    color: '#64748B',
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },

  quizInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  quizInfoPill: {
    backgroundColor: '#ECFDF5',
    color: '#166534',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
  },

  quizBest: {
    color: '#16A34A',
    fontWeight: '900',
    marginTop: 14,
    fontSize: 15,
  },

  quizReady: {
    marginBottom: 12,
    color: '#EA580C',
    fontWeight: '900',
    marginTop: 20,
    fontSize: 15,
  },


  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  previewEmoji: {
    fontSize: 46,
    textAlign: 'center',
  },

  previewTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },

  previewText: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },

  previewStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  previewStat: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  previewStatValue: {
    color: '#16A34A',
    fontSize: 20,
    fontWeight: '900',
  },

  previewStatLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },

  previewRules: {
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  previewRuleTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },

  previewRule: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 4,
  },

  activeHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 16,
    marginTop: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  activeEyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  activeTitle: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '900',
    lineHeight: 34,
    marginTop: 8,
  },

  resultActionButtonText: {
    textAlign: 'center',
    flexShrink: 1,
    width: '100%',
  },

  resultActionButton: {
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
    paddingHorizontal: 18,
  },

  resultRetryButtonSpacing: {
    marginTop: 34,
    marginBottom: 10,
  },

  resultBackButtonSpacing: {
    marginTop: 0,
  },

  attemptPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    color: '#166534',
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 12,
  },
  quizNextButtonSpacing: {
    marginTop: 14,
  },

  activeSubtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 6,
  },

  quizBackButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  quizBackButtonText: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 14,
  },

  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressText: {
    color: '#166534',
    fontSize: 15,
    fontWeight: '900',
  },

  progressPercent: {
    color: '#EA580C',
    fontSize: 15,
    fontWeight: '900',
  },

  progressTrack: {
    height: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  questionSource: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  question: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 27,
    marginBottom: 10,
  },

  option: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 22,
    padding: 14,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5',
  },

  optionLetter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  optionLetterSelected: {
    backgroundColor: '#22C55E',
  },

  optionLetterText: {
    color: '#475569',
    fontWeight: '900',
  },

  optionLetterTextSelected: {
    color: '#FFFFFF',
  },

  optionText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },

  optionTextSelected: {
    color: '#166534',
    fontWeight: '900',
  },

  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 56,
    shadowColor: '#16A34A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  secondaryButton: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
    marginTop: 18,
  },

  secondaryButtonText: {
    color: '#475569',
    fontWeight: '900',
    fontSize: 16,
  },

  retryButton: {
    backgroundColor: '#166534',
  },

  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },

  resultEmoji: {
    fontSize: 54,
  },

  resultTitle: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },

  resultScoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  resultScore: {
    color: '#16A34A',
    fontSize: 46,
    fontWeight: '900',
  },

  resultMeta: {
    color: '#64748B',
    marginTop: 14,
    fontSize: 19,
    fontWeight: '800',
  },

  masteryText: {
    color: '#166534',
    fontWeight: '900',
    marginTop: 12,
    fontSize: 17,
    textAlign: 'center',
  },

  xpAward: {
    color: '#EA580C',
    fontWeight: '900',
    marginTop: 10,
    fontSize: 17,
    textAlign: 'center',
  },

  reviewWrap: {
    width: '100%',
    marginTop: 20,
  },

  reviewTitle: {
    color: '#166534',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10,
  },

  reviewItem: {
    borderRadius: 16,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
  },

  reviewCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  reviewWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  reviewItemText: {
    fontWeight: '900',
    color: '#0F172A',
    fontSize: 14,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 10,
  },

  emptyEmoji: {
    fontSize: 46,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },

  // [MODERN_STUDENT_UI_OVERRIDES_START]
  safe: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  screen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 120,
  },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    marginBottom: 18,
  },

  title: {
    color: '#0F172A',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: 8,
  },

  summaryRow: {
    marginBottom: 28,
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  summaryCard: {
    minHeight: 96,
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  quizCard: {
    paddingBottom: 24,
    paddingTop: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 26,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.09,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  activeHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    marginBottom: 16,
  },

  activeTitle: {
    color: '#0F172A',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },

  activeSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 8,
  },

  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  question: {
    color: '#0F172A',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
  },

  optionButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 13,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },

  selectedOption: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  // [MODERN_STUDENT_UI_OVERRIDES_END]


  quizStartButton: {
    marginTop: 14,
    marginBottom: 2,
  },

});
