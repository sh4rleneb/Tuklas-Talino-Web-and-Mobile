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

const MAX_QUIZ_ATTEMPTS = 5;

function quizCatalog(dashboard) {
  return (dashboard?.lessons || []).flatMap((lesson) =>
    (lesson.activities || [])
      .filter((activity) => activity.type === 'mcq' && (activity.questions || []).length)
      .map((activity) => ({
        quizId: `lesson-${lesson.id}`,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        title: activity.title || `Pagsusulit sa ${lesson.title}`,
        questions: activity.questions || [],
      }))
  );
}

function optionLetter(index) {
  return String.fromCharCode(65 + index);
}

export default function QuizScreen({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
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
  const activeQuizAttempts = activeQuiz ? (attempts[activeQuiz.quizId] || []) : [];
  const canRetry = activeQuizAttempts.length < MAX_QUIZ_ATTEMPTS;
  const question = activeQuiz?.questions?.[questionIndex];
  const selectedOptionId = question ? answers[question.id] : null;
  const progressPercent = activeQuiz?.questions?.length
    ? Math.round(((questionIndex + 1) / activeQuiz.questions.length) * 100)
    : 0;

  function startQuiz(quiz) {
    setActiveQuiz(quiz);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  }

  const closeQuiz = useCallback(() => {
    setActiveQuiz(null);
    setQuestionIndex(0);
    setAnswers({});
    setResult(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!activeQuiz) return undefined;

      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        closeQuiz();
        return true;
      });

      return () => subscription.remove();
    }, [activeQuiz, closeQuiz])
  );

  async function submitQuiz() {
    if (!activeQuiz || submitting) return;

    const review = activeQuiz.questions.map((item) => ({
      questionId: item.id,
      selectedOptionId: answers[item.id],
    }));

    if (review.some((item) => !item.selectedOptionId)) {
      Alert.alert('Pagsusulit', 'Sagutin muna ang lahat ng tanong bago ipasa ang pagsusulit.');
      return;
    }

    const score = activeQuiz.questions.reduce((total, item) => {
      const option = (item.options || []).find((candidate) => candidate.id === answers[item.id]);
      return total + (option?.isCorrect ? 1 : 0);
    }, 0);

    const total = activeQuiz.questions.length;
    const percent = total ? Math.round((score / total) * 100) : 0;

    setSubmitting(true);

    try {
      const data = await api(`/lessons/${activeQuiz.lessonId}/quiz-result`, {
        method: 'POST',
        body: {
          quizId: activeQuiz.quizId,
          quizTitle: activeQuiz.title,
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
        : [];

      setResult(quizResult ? { ...quizResult, review: reviewItems } : null);
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
            style={styles.quizBackButton}
            onPress={closeQuiz}
            activeOpacity={0.85}
          >
            <Text style={styles.quizBackButtonText}>← Bumalik sa mga Pagsusulit</Text>
          </TouchableOpacity>

          <View style={styles.activeHero}>
            <Text style={styles.activeEyebrow}>🧠 PAGSUSULIT</Text>
            <Text style={styles.activeTitle}>{activeQuiz.title}</Text>
            <Text style={styles.activeSubtitle}>{activeQuiz.lessonTitle}</Text>
          </View>

          {result ? (
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
                        {index + 1}. {item.isCorrect ? '✅ Tama' : '❌ Mali'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {canRetry && (
                <TouchableOpacity
                  style={[styles.primaryButton, styles.retryButton]}
                  onPress={() => {
                    setResult(null);
                    setAnswers({});
                    setQuestionIndex(0);
                  }}
                >
                  <Text style={styles.primaryButtonText}>🔄 Subukan Muli</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
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
                <Text style={styles.question}>{question.question}</Text>

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
                        {option.optionText}
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
                  style={[styles.primaryButton, !selectedOptionId && styles.buttonDisabled]}
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
            <Text style={styles.summaryValue}>5</Text>
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
              const quizAttempts = attempts[quiz.quizId] || [];
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
                      <Text style={styles.quizTitle}>{quiz.title}</Text>
                      <Text style={styles.muted}>{quiz.lessonTitle}</Text>
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
                    style={[styles.primaryButton, limitReached && styles.buttonDisabled]}
                    onPress={() => startQuiz(quiz)}
                    disabled={limitReached}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      {limitReached ? 'Naubos na ang 5 Pagsubok' : 'Simulan ang Pagsusulit'}
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
    paddingBottom: 130,
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
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
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
    marginTop: 3,
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
    color: '#EA580C',
    fontWeight: '900',
    marginTop: 14,
    fontSize: 15,
  },

  activeHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    marginTop: 14,
    marginBottom: 14,
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
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  question: {
    color: '#0F172A',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 31,
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
    paddingVertical: 16,
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
});
