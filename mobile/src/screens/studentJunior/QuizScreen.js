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
        title: activity.title || `${lesson.title} Quiz`,
        questions: activity.questions || [],
      }))
  );
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
      setError(err.message || 'Unable to load quizzes.');
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
      Alert.alert('Quiz', 'Answer every question before submitting.');
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
      const reviewItems = savedAttempts.length ? (savedAttempts[savedAttempts.length - 1].review || []) : [];
      setResult(quizResult ? { ...quizResult, review: reviewItems } : null);
      await load();
    } catch (err) {
      Alert.alert('Quiz', err.message || 'Unable to submit this quiz.');
    } finally {
      setSubmitting(false);
    }
  }

  function continueQuiz() {
    if (!selectedOptionId) {
      Alert.alert('Quiz', 'Choose an answer before continuing.');
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
        <Text style={styles.muted}>Loading quizzes...</Text>
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

          <View style={styles.quizBackHeader}>
            <TouchableOpacity
              style={styles.quizBackButton}
              onPress={closeQuiz}
              activeOpacity={0.85}
            >
              <Text style={styles.quizBackButtonText}>← Back to Quiz List</Text>
            </TouchableOpacity>
          </View>

        <View style={{ height: 12 }} />
        <Text style={styles.title}>{activeQuiz.title}</Text>
        <Text style={styles.muted}>{activeQuiz.lessonTitle}</Text>

        {result ? (
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>QUIZ COMPLETE</Text>

            <Text style={styles.resultTitle}>
              🎉 Great Job!
            </Text>

            <Text style={styles.resultScore}>
              {result.percent}%
            </Text>

            <Text style={styles.resultMeta}>
              Score: {result.score}/{result.total}
            </Text>

            <Text style={styles.heroStat}>
              {result.masteryLabel}
            </Text>

            <Text style={styles.heroStat}>
              ⭐ +{result.xpAwarded || 0} XP Earned
            </Text>

            {(result.review || []).length > 0 && (
              <View style={{ width: '100%', marginTop: 18 }}>
                <Text style={{ color: '#166534', fontWeight: '900', fontSize: 15, marginBottom: 8 }}>
                  📝 Review Your Answers
                </Text>
                {(result.review || []).map((item, index) => (
                  <View
                    key={item.questionId || index}
                    style={{
                      backgroundColor: item.isCorrect ? '#DCFCE7' : '#FEE2E2',
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: item.isCorrect ? '#22C55E' : '#EF4444',
                    }}
                  >
                    <Text style={{ fontWeight: '900', color: '#0F172A', fontSize: 14 }}>
                      {index + 1}. {item.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {canRetry && (
              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 10, backgroundColor: '#166534' }]}
                onPress={() => {
                  setResult(null);
                  setAnswers({});
                  setQuestionIndex(0);
                }}
              >
                <Text style={styles.primaryButtonText}>🔄 Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={closeQuiz}
            >
              <Text style={styles.primaryButtonText}>
                Back to Quiz List
              </Text>
            </TouchableOpacity>
          </View>
        ) : question ? (
          <>
            <Text style={styles.progress}>
              Question {questionIndex + 1} of {activeQuiz.questions.length}
            </Text>
            <Card>
              <Text style={styles.question}>{question.question}</Text>
              {(question.options || []).map((option) => {
                const selected = selectedOptionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.optionText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {questionIndex > 0 && (
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: '#64748B', marginBottom: 8 }]}
                  onPress={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                >
                  <Text style={styles.primaryButtonText}>← Previous</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.primaryButton, !selectedOptionId && styles.buttonDisabled]}
                onPress={continueQuiz}
                disabled={!selectedOptionId || submitting}
              >
                <Text style={styles.primaryButtonText}>
                  {submitting
                    ? 'Submitting...'
                    : questionIndex === activeQuiz.questions.length - 1
                      ? 'Submit Quiz'
                      : 'Next Question'}
                </Text>
              </TouchableOpacity>
            </Card>
          </>
        ) : (
          <Text style={styles.error}>This quiz has no available questions.</Text>
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

      <View style={styles.header}>
      <View style={styles.headerText}>
        <Text style={styles.title}>🧠 Quizzes</Text>

      </View>
    </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : quizzes.length ? (
        quizzes.map((quiz) => {
          const quizAttempts = attempts[quiz.quizId] || [];
          const limitReached = quizAttempts.length >= MAX_QUIZ_ATTEMPTS;
          const best = quizAttempts.reduce((value, attempt) => Math.max(value, attempt.percent || 0), 0);

          return (
            <Card key={quiz.quizId}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.muted}>{quiz.lessonTitle}</Text>
              <Text style={styles.quizMeta}>{quiz.questions.length} questions • {quizAttempts.length}/{MAX_QUIZ_ATTEMPTS} attempts</Text>
              {quizAttempts.length > 0 && <Text style={styles.quizBest}>Best score: {best}%</Text>}
              <TouchableOpacity
                style={[styles.primaryButton, limitReached && styles.buttonDisabled]}
                onPress={() => startQuiz(quiz)}
                disabled={limitReached}
              >
                <Text style={styles.primaryButtonText}>{limitReached ? '5 Attempts Used' : 'Start Quiz'}</Text>
              </TouchableOpacity>
            </Card>
          );
        })
      ) : (
        <Text style={styles.muted}>No published lesson quizzes are available yet.</Text>
      )}
    </ScrollView>
  </SafeAreaView>

    );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: { flex: 1, backgroundColor: colors.bg },
    content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  headerText: { flex: 1, paddingRight: 12 },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  back: { color: colors.green, fontWeight: '900', marginBottom: 14 },
  quizBackHeader: {
    marginBottom: 4,
    alignItems: 'flex-start',
  },

  quizBackButton: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  quizBackButtonText: {
    color: colors.green,
    fontWeight: '900',
  },


  muted: { color: colors.muted, marginTop: 4 },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 30 },
  quizTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  quizMeta: { color: colors.muted, marginTop: 12 },
  quizBest: { color: colors.green, fontWeight: '800', marginTop: 6 },
  progress: { color: colors.green, fontWeight: '900', marginVertical: 14 },
  question: { color: colors.ink, fontSize: 21, fontWeight: '900', marginBottom: 14 },
  option: { borderWidth: 2, borderColor: '#CBD5E1', borderRadius: 16, padding: 14, marginTop: 10 },
  optionSelected: { borderColor: colors.green, backgroundColor: '#DCFCE7' },
  optionText: { color: colors.ink, fontSize: 16 },
  optionTextSelected: { fontWeight: '900' },
  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 24,
    minWidth: 220,
  },
  primaryButtonText: { color: '#FFF', fontWeight: '900' },
  buttonDisabled: { backgroundColor: '#CBD5E1' },
  hero: {
    backgroundColor: '#ECFDF5',
    borderRadius: 26,
    padding: 24,
    marginTop: 24,
    marginBottom: 20,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,

    elevation: 8,
  },

  eyebrow: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },

  heroStat: {
    color: '#166534',
    fontWeight: '900',
    marginTop: 12,
    fontSize: 18,
  },

  resultCard: {
    backgroundColor: '#ECFDF5',
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 26,
  },
  resultTitle: {
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  resultScore: {
    color: '#22C55E',
    fontSize: 52,
    fontWeight: '900',
    marginTop: 16,
  },
  resultMeta: {
    color: colors.muted,
    marginTop: 10,
    fontSize: 20,
    fontWeight: '700',
  },

});