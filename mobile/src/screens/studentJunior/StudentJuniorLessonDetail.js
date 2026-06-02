import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';

import { api } from '../../api/client';

function StepTab({
  title,
  active,
}) {
  return (
    <View
      style={[
        styles.tab,
        active &&
          styles.activeTab,
      ]}
    >
      <Text style={styles.tabText}>
        {title}
      </Text>
    </View>
  );
}

export default function StudentJuniorLessonDetail({
  navigation,
  route,
}) {
  const [step, setStep] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [blankAnswer, setBlankAnswer] = useState('');
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [writingAnswer, setWritingAnswer] = useState('');
  const [completionResult, setCompletionResult] = useState(null);
  const [submittingCompletion, setSubmittingCompletion] = useState(false);

  const lessonId = route?.params?.lessonId;

  useEffect(() => {
    if (!lessonId) return;

    let active = true;

    async function loadLesson() {
      try {
        setLoading(true);
        setError(null);
        const data = await api(`/lessons/${lessonId}`);
        if (active) {
          setLesson(data.lesson || null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load lesson.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadLesson();

    return () => {
      active = false;
    };
  }, [lessonId]);

  const activities = useMemo(() => {
    return Array.isArray(lesson?.activities) ? lesson.activities : [];
  }, [lesson]);

  const lessonTitle = lesson?.title || 'Lesson';
  const xpReward = lesson?.xpReward ?? 0;
  const stepCount = Math.max(activities.length + 1, 2);
  const currentActivity = activities[step - 1];

  const currentLabel = useMemo(() => {
    if (!currentActivity) return 'Finish';

    switch ((currentActivity.type || '').toLowerCase()) {
      case 'mcq':
        return 'Quiz';
      case 'writing':
        return 'Write';
      case 'speech':
        return 'Speak';
      case 'material':
        return 'Material';
      default:
        return currentActivity.title || 'Activity';
    }
  }, [currentActivity]);

  async function handleFinishLesson() {
    if (!lesson || submittingCompletion) return;
    setSubmittingCompletion(true);

    try {
      const result = await api(`/lessons/${lessonId}/complete`, {
        method: 'POST',
        body: {},
      });
      setCompletionResult(result);
      setStep(step + 1);
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to complete lesson.');
    } finally {
      setSubmittingCompletion(false);
    }
  }

  function handleClaimXP() {
    const xp = completionResult?.xpAwarded ?? xpReward;
    Alert.alert('🎉 Congratulations!', `+${xp} XP earned!`, [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  }

  function renderProgressIndicators() {
    return activities.map((activity, index) => {
      const active = index + 1 === step;
      return (
        <View
          key={`${activity.id}-${index}`}
          style={[styles.stepIndicator, active && styles.stepIndicatorActive]}
        />
      );
    });
  }

  function renderActivityContent() {
    if (!currentActivity) {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>🎉 Ready to finish</Text>
          <Text style={styles.passage}>Tap Finish to complete this lesson and claim your XP.</Text>
          <TouchableOpacity style={styles.button} onPress={handleFinishLesson} disabled={submittingCompletion}>
            <Text style={styles.buttonText}>{submittingCompletion ? 'Submitting...' : 'Finish'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const activityType = (currentActivity.type || '').toLowerCase();

    if (activityType === 'mcq') {
      const question = currentActivity.questions?.[0];
      return (
        <View style={styles.card}>
          <Text style={styles.title}>🎮 {currentActivity.title || 'Quiz'}</Text>
          <Text style={styles.question}>{question?.question || currentActivity.instructions || 'Answer the question below.'}</Text>
          {(question?.options || []).map((option) => (
            <TouchableOpacity
              key={option.id || option.optionText || option}
              style={[styles.choice, selectedAnswer === option && styles.choiceSelected]}
              onPress={() => {
                setSelectedAnswer(option);
                if (question?.options) {
                  const isCorrect = option?.id
                    ? question.options.find((opt) => opt.id === option.id)?.isCorrect
                    : option === question.options.find((opt) => opt.isCorrect)?.optionText;
                  Alert.alert(isCorrect ? '✅ Tama!' : '❌ Mali');
                }
              }}
            >
              <Text style={styles.choiceText}>{option.optionText || option}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
            <Text style={styles.buttonText}>Susunod →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activityType === 'writing') {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>✍️ {currentActivity.title || 'Writing'}</Text>
          <Text style={styles.passage}>{currentActivity.writingTask?.prompt || currentActivity.instructions || 'Sumulat ng iyong sagot.'}</Text>
          <TextInput
            style={styles.textInput}
            multiline
            value={writingAnswer}
            onChangeText={setWritingAnswer}
            placeholder="I-type ang sagot dito..."
          />
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
            <Text style={styles.buttonText}>Susunod →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activityType === 'speech') {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>🎤 {currentActivity.title || 'Speech'}</Text>
          <Text style={styles.passage}>{currentActivity.speechTask?.targetText || currentActivity.instructions || 'Sabihin ang pangungusap nang malinaw.'}</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>🎤 Simulan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
            <Text style={styles.buttonText}>Tapusin →</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.title}>{currentActivity.title || 'Activity'}</Text>
        <Text style={styles.passage}>{currentActivity.instructions || JSON.stringify(currentActivity.dataJson || currentActivity)}</Text>
        <TouchableOpacity style={styles.nextButton} onPress={() => setStep(step + 1)}>
          <Text style={styles.buttonText}>Susunod →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Lesson failed to load.</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.reloadButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.lessonHeader}>📖 {lessonTitle}</Text>
            <Text style={styles.stepText}>Hakbang {Math.min(step, stepCount)} of {stepCount}</Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>⚡ +{xpReward} XP</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: `${(Math.min(step, stepCount) / stepCount) * 100}%` }]} />
        </View>

        <View style={styles.stepRow}>{renderProgressIndicators()}</View>

        {step <= activities.length ? (
          <View style={styles.stepHeaderContainer}>
            <Text style={styles.stepHeader}>{currentLabel}</Text>
          </View>
        ) : null}

        {step <= activities.length ? renderActivityContent() : (
          <View style={styles.completeCard}>
            <Text style={styles.complete}>🎉 Mission Complete!</Text>
            <Text style={styles.rewardText}>+{completionResult?.xpAwarded ?? xpReward} XP</Text>
            {completionResult?.message ? (
              <Text style={styles.passage}>{completionResult.message}</Text>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={handleClaimXP}>
              <Text style={styles.buttonText}>Claim XP</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor:
      '#F6FFF5',
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  lessonHeader: {
    fontSize: 38,
    fontWeight: '900',
    color: '#16A34A',
  },

  stepText: {
    color: '#64748B',
  },

  xpBadge: {
    backgroundColor:
      '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  xpText: {
    color: '#F97316',
    fontWeight: 'bold',
  },

  progressContainer: {
    height: 12,
    backgroundColor:
      '#E5E7EB',
    borderRadius: 10,
    marginBottom: 20,
  },

  progressFill: {
    height: '100%',
    backgroundColor:
      '#22C55E',
    borderRadius: 10,
  },

  tabRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    marginBottom: 20,
  },

  tab: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor:
      '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor:
      '#FEF3C7',
    borderWidth: 2,
    borderColor:
      '#FBBF24',
  },

  tabText: {
    fontSize: 24,
  },

  card: {
    backgroundColor:
      '#FFF',
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
    elevation: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 15,
  },

  lessonBox: {
    fontSize: 22,
  },

  passage: {
    fontSize: 22,
    lineHeight: 34,
  },

  question: {
    fontSize: 22,
    marginBottom: 15,
  },

  choice: {
    borderWidth: 2,
    borderColor:
      '#22C55E',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  choiceSelected: {
    backgroundColor:
      '#DCFCE7',
  },

  choiceText: {
    color: '#0F172A',
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  stepIndicator: {
    width: 36,
    height: 8,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },

  stepIndicatorActive: {
    backgroundColor: '#22C55E',
  },

  stepHeaderContainer: {
    marginBottom: 12,
  },

  stepHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    minHeight: 120,
    marginTop: 14,
    textAlignVertical: 'top',
  },

  button: {
    backgroundColor:
      '#22C55E',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  nextButton: {
    backgroundColor:
      '#A855F7',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },

  completeCard: {
    backgroundColor:
      '#FFF',
    borderRadius: 28,
    padding: 30,
    alignItems: 'center',
  },

  complete: {
    fontSize: 28,
    fontWeight: '900',
  },

  rewardText: {
    fontSize: 22,
    marginTop: 10,
    marginBottom: 20,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
    color: '#0F172A',
    textAlign: 'center',
  },

  errorText: {
    color: '#475569',
    textAlign: 'center',
    marginBottom: 22,
    fontSize: 16,
  },

  reloadButton: {
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },

});