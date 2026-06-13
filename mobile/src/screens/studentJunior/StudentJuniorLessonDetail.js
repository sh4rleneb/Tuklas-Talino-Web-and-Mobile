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

function optionalProgressRequest(request, fallback) {
  return request.catch((err) => {
    if (err.status === 404 || err.message === 'Route not found.') {
      return fallback;
    }

    throw err;
  });
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
  const [writingAnswer, setWritingAnswer] = useState('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [playing, setPlaying] = useState(false);
  const [speechStatus, setSpeechStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activityNotice, setActivityNotice] = useState(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const celebrationScale = useRef(new Animated.Value(0.92)).current;
  const celebrationRotate = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (!lessonId) {
      setError('Lesson ID is missing.');
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
        setStep(progressData.progress?.currentStep || 1);
        setCompleted(progressData.progress?.status === 'completed');
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load lesson.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId]);

  useEffect(() => () => {
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

  const activities = useMemo(
    () => Array.isArray(lesson?.activities) ? lesson.activities : [],
    [lesson]
  );
  const totalSteps = Math.max(1, activities.length + 1);
  const currentActivity = activities[step - 1];
  const littleLearnerGame = Number(student?.gradeLevel || lesson?.gradeLevel || 0) <= 2;

  const getGameMeta = activity => {
    const type = String(activity?.type || activity?.activityType || activity?.kind || '').toLowerCase();

    if (type.includes('writing') || type.includes('write') || type.includes('essay') || type.includes('text')) {
      return {
        icon: '✍️',
        title: 'Word Builder Game',
        mission: 'Build an answer using word power-ups. Fill the answer box to claim your star.',
        steps: ['Pick', 'Build', 'Claim Star'],
        button: '🏁 Claim Star & Continue',
      };
    }

    if (type.includes('speech') || type.includes('speak') || type.includes('oral') || type.includes('voice') || type.includes('record')) {
      return {
        icon: '🎙️',
        title: 'Voice Quest Game',
        mission: 'Say the target words clearly, record your voice, then save your attempt to earn a star.',
        steps: ['Listen', 'Speak', 'Claim Star'],
        button: '⭐ Save Voice Quest',
      };
    }

    if (type === 'mcq' || type.includes('quiz') || type.includes('choice') || type.includes('question')) {
      return {
        icon: '👆',
        title: 'Tap the Answer Game',
        mission: 'Choose the correct answer tile. Correct answers move you closer to the finish flag.',
        steps: ['Read', 'Tap', 'Win'],
        button: '🚀 Continue Game',
      };
    }

    return {
      icon: '🎮',
      title: 'Learning Game',
      mission: 'Complete the challenge, collect stars, and unlock the next activity.',
      steps: ['Look', 'Play', 'Win'],
      button: '🚀 Continue Game',
    };
  };

  const buildWordPowerUps = activity => {
    const rawSuggestions = activity?.writingTask?.rubricJson?.choices
      || activity?.writingTask?.rubricJson?.wordBank
      || activity?.dataJson?.choices
      || activity?.dataJson?.wordBank
      || [];

    const normalized = rawSuggestions
      .map(item => String(item?.text || item?.word || item || '').trim())
      .filter(Boolean);

    if (normalized.length) return normalized.slice(0, 8);

    const text = [
      activity?.writingTask?.prompt,
      activity?.prompt,
      activity?.instructions,
      lesson?.title,
      lesson?.passage,
    ].filter(Boolean).join(' ');

    const blocked = new Set([
      'ang', 'ng', 'sa', 'at', 'ay', 'mga', 'na', 'ka', 'ko', 'mo', 'niya',
      'ito', 'iyon', 'kung', 'para', 'with', 'your', 'answer', 'here',
      'type', 'write', 'sumulat', 'isulat', 'gamitin', 'maikling', 'sagot',
    ]);

    const words = String(text)
      .replace(/[^A-Za-zÀ-ÿñÑ\s]/g, ' ')
      .split(/\s+/)
      .map(word => word.trim())
      .filter(word => word.length > 2 && !blocked.has(word.toLowerCase()));

    return Array.from(new Set(words)).slice(0, 8);
  };

  const renderGameHeader = activity => {
    if (!littleLearnerGame || !activity) return null;

    const game = getGameMeta(activity);

    return (
      <View style={{
        backgroundColor: '#ECFDF5',
        borderColor: '#BBF7D0',
        borderWidth: 2,
        borderRadius: 28,
        padding: 18,
        marginBottom: 18,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#DCFCE7',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <Text style={{ fontSize: 30 }}>{game.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
              MINI GAME
            </Text>
            <Text style={{ color: '#0F172A', fontSize: 24, fontWeight: '900' }}>
              {game.title}
            </Text>
          </View>
        </View>

        <Text style={{ color: '#334155', fontSize: 17, lineHeight: 25, marginBottom: 14 }}>
          {game.mission}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {game.steps.map((item, index) => (
            <View
              key={`${item}-${index}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderColor: '#BBF7D0',
                borderWidth: 1,
                borderRadius: 999,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
            >
              <Text style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                width: 24,
                height: 24,
                borderRadius: 12,
                textAlign: 'center',
                fontWeight: '900',
                marginRight: 8,
              }}>
                {index + 1}
              </Text>
              <Text style={{ color: '#15803D', fontWeight: '900' }}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPowerUpTray = activity => {
    if (!littleLearnerGame || !activity) return null;

    const words = buildWordPowerUps(activity);
    if (!words.length) return null;

    return (
      <View style={{
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
        borderWidth: 2,
        borderRadius: 24,
        padding: 16,
        marginBottom: 18,
      }}>
        <Text style={{ color: '#92400E', fontSize: 18, fontWeight: '900', marginBottom: 8 }}>
          ⭐ Word Power-Ups
        </Text>
        <Text style={{ color: '#475569', fontSize: 15, lineHeight: 22, marginBottom: 12 }}>
          Tap a word to drop it into your answer.
        </Text>
        <View style={styles.choiceRow}>
          {words.map((word, index) => (
            <TouchableOpacity
              key={`${word}-${index}`}
              style={styles.choiceChip}
              onPress={() => setWritingAnswer(current => [current.trim(), word].filter(Boolean).join(' '))}
            >
              <Text style={styles.choiceText}>✨ {word}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const getActivityGuide = activity => {
    const type = String(
      activity?.type ||
      activity?.activityType ||
      activity?.category ||
      activity?.kind ||
      ''
    ).toLowerCase();

    const hasQuestionsWithOptions =
      Array.isArray(activity?.questions) &&
      activity.questions.some(question =>
        Array.isArray(question?.options) ||
        Array.isArray(question?.choices)
      );

    const hasChoices =
      Array.isArray(activity?.choices) ||
      Array.isArray(activity?.options) ||
      Array.isArray(activity?.answers) ||
      hasQuestionsWithOptions;

    const hasAudio =
      Boolean(activity?.audioUrl) ||
      Boolean(activity?.audio) ||
      Boolean(activity?.soundUrl);

    if (
      hasAudio ||
      type.includes('listen') ||
      type.includes('audio') ||
      type.includes('hearing')
    ) {
      return {
        icon: '👂',
        title: 'Makinig muna',
        body: 'Pindutin ang audio kung mayroon, pakinggan nang mabuti, pagkatapos sagutin ang gawain.',
        steps: ['Makinig', 'Sagutin', 'Continue'],
      };
    }

    if (
      type.includes('write') ||
      type.includes('writing') ||
      type.includes('essay') ||
      type.includes('text')
    ) {
      return {
        icon: '✍️',
        title: 'Isulat ang maikling sagot',
        body: 'Gamitin ang kahon sa ibaba. Lalabas ang green button kapag may naisulat ka na.',
        steps: ['Basahin', 'Magsulat', 'Save'],
      };
    }

    if (
      type.includes('speak') ||
      type.includes('record') ||
      type.includes('voice') ||
      type.includes('oral')
    ) {
      return {
        icon: '🎙️',
        title: 'I-record ang iyong sagot',
        body: 'Basahin ang speech target, pindutin ang record, magsalita nang malinaw, at i-save ang sagot.',
        steps: ['Target', 'Record', 'Save'],
      };
    }

    if (
      type === 'mcq' ||
      type.includes('mcq') ||
      hasChoices ||
      type.includes('quiz') ||
      type.includes('choice') ||
      type.includes('question') ||
      type.includes('multiple')
    ) {
      return {
        icon: '👆',
        title: littleLearnerGame ? 'Tap the Answer Game' : 'Pumili ng tamang sagot',
        body: littleLearnerGame
          ? 'Tap the correct answer tile to move closer to the finish flag.'
          : 'I-tap ang isang kahon. Kapag napili mo na ang sagot, maaari ka nang magpatuloy.',
        steps: littleLearnerGame ? ['Read', 'Tap', 'Win'] : ['Basahin', 'Piliin', 'Continue'],
      };
    }

    return {
      icon: '🧭',
      title: 'Sundin ang gawain',
      body: 'Basahin muna ang panuto, gawin ang activity, pagkatapos pindutin ang button para magpatuloy.',
      steps: ['Basahin', 'Gawin', 'Continue'],
    };
  };

  const renderActivityGuide = activity => {
    if (!activity) return null;

    const guide = getActivityGuide(activity);

    return (
      <View style={styles.guideCard}>
        <View style={styles.guideIconBubble}>
          <Text style={styles.guideIcon}>{guide.icon}</Text>
        </View>

        <View style={styles.guideContent}>
          <Text style={styles.guideTitle}>{guide.title}</Text>
          <Text style={styles.guideBody}>{guide.body}</Text>

          <View style={styles.guideSteps}>
            {guide.steps.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.guideStepPill}>
                <Text style={styles.guideStepNumber}>{index + 1}</Text>
                <Text style={styles.guideStepText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const getActivityVisual = activity => {
    const imageUri =
      activity?.imageUrl ||
      activity?.illustrationUrl ||
      activity?.visualUrl ||
      activity?.dataJson?.imageUrl ||
      activity?.dataJson?.illustrationUrl ||
      activity?.dataJson?.visualUrl ||
      activity?.dataJson?.coverImage ||
      lesson?.imageUrl ||
      lesson?.illustrationUrl ||
      lesson?.dataJson?.imageUrl ||
      lesson?.dataJson?.illustrationUrl;

    if (!imageUri) return null;

    return {
      imageUri,
      emoji: '🖼️',
      title: 'Tingnan ang larawan',
      body: 'Gamitin ang larawan bilang gabay bago sagutin ang gawain.',
    };
  };

  const renderActivityVisual = activity => {
    if (!activity) return null;

    const visual = getActivityVisual(activity);

    if (!visual) return null;

    return (
      <View style={styles.visualCard}>
        <View style={styles.visualImageWrap}>
          {visual.imageUri ? (
            <Image
              source={{ uri: visual.imageUri }}
              style={styles.visualImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.visualEmoji}>{visual.emoji}</Text>
          )}
        </View>

        <View style={styles.visualCopy}>
          <Text style={styles.visualTitle}>{visual.title}</Text>
          <Text style={styles.visualBody}>{visual.body}</Text>
        </View>
      </View>
    );
  };

  const getActivityPassage = activity => {
    const candidates = [
      activity?.passage,
      activity?.readingPassage,
      activity?.story,
      activity?.content,
      activity?.instructions,
      activity?.dataJson?.passage,
      activity?.dataJson?.readingPassage,
      activity?.dataJson?.story,
      activity?.dataJson?.content,
      activity?.dataJson?.text,
      activity?.dataJson?.body,
      activity?.dataJson?.context,
      activity?.dataJson?.lessonText,
      activity?.questions?.[0]?.passage,
      activity?.questions?.[0]?.context,
      activity?.questions?.[0]?.readingText,
      lesson?.passage,
      lesson?.readingPassage,
      lesson?.story,
      lesson?.content,
      lesson?.description,
      lesson?.dataJson?.passage,
      lesson?.dataJson?.readingPassage,
      lesson?.dataJson?.story,
      lesson?.dataJson?.content,
      lesson?.dataJson?.text,
      lesson?.dataJson?.body,
      lesson?.dataJson?.context,
    ];

    const passage = candidates.find(value =>
      typeof value === 'string' && value.trim().length >= 20
    );

    return passage?.trim() || '';
  };

  const renderActivityPassage = activity => {
    const passage = getActivityPassage(activity);

    if (!passage) return null;

    const passageTitle =
      activity.type === 'writing'
        ? '✍️ Gabay sa pagsulat'
        : activity.type === 'speech'
          ? '🎤 Basahin at bigkasin'
          : '📖 Basahin ang teksto';

    return (
      <View style={styles.passageCard}>
        <Text style={styles.passageTitle}>{passageTitle}</Text>
        <Text style={styles.passageBody}>{passage}</Text>
      </View>
    );
  };

  const percent = completed ? 100 : Math.round(((Math.max(1, step) - 1) / totalSteps) * 100);
  const nextLesson = useMemo(() => {
    const lessons = dashboard?.lessons || [];
    const lessonIndex = lessons.findIndex((item) => Number(item.id) === Number(lessonId));
    return lessonIndex >= 0 ? lessons[lessonIndex + 1] : null;
  }, [dashboard, lessonId]);
  const homeRoute = route?.params?.homeRoute || 'Home';

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone', 'Microphone permission is needed to record your speech practice.');
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
      setSpeechStatus('Recording in progress...');
    } catch (err) {
      Alert.alert('Microphone', err.message || 'Unable to start recording.');
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
      setSpeechStatus(uri ? 'Recording ready for playback.' : 'Recording stopped.');
    } catch (err) {
      Alert.alert('Microphone', err.message || 'Unable to stop recording.');
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
      setSpeechStatus('Playing your recording...');
    } catch (err) {
      Alert.alert('Playback', err.message || 'Unable to play your recording.');
    }
  }


  async function saveNextStep(activityType) {
    const nextStep = Math.min(step + 1, totalSteps);
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
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveNextStep(activityType);
    } catch (err) {
      Alert.alert('Lesson', err.message || 'Unable to save lesson progress.');
    } finally {
      setSubmitting(false);
    }
  }

  async function answerQuestion(question, option) {
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
      setMcqAnswers((answers) => ({
        ...answers,
        [question.id]: {
          selectedOptionId: option.id,
          correct: Boolean(data.correct),
        },
      }));
      setActivityNotice({
        type: data.correct ? 'success' : 'warning',
        title: data.correct ? 'Correct!' : 'Try again',
        message: data.message || (
          data.correct
            ? 'Correct answer. XP is saved once for this question.'
            : 'Your answer was saved. Choose another answer if needed.'
        ),
      });
    } catch (err) {
      setActivityNotice({
        type: 'error',
        title: 'Unable to save answer',
        message: err.message || 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitWriting() {
    const task = currentActivity?.writingTask;
    if (!task?.id) {
      Alert.alert('Writing', 'This activity has no writing task yet.');
      return;
    }
    if (writingAnswer.trim().length < 2) {
      Alert.alert('Writing', 'Please write your answer before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api(`/lessons/${lessonId}/writing`, {
        method: 'POST',
        body: {
          taskId: task.id,
          content: writingAnswer,
          autoChecked: Boolean(task.rubricJson?.autoChecked),
        },
      });
      Alert.alert('Writing', data.message || 'Writing answer saved.');
      if (data.correct === false) return;
      await saveNextStep('writing');
    } catch (err) {
      Alert.alert('Writing', err.message || 'Unable to save your writing answer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitSpeech() {
    const task = currentActivity?.speechTask;
    if (!task?.id) {
      Alert.alert('Speech', 'This activity has no speech task yet.');
      return;
    }
    if (speechTranscript.trim().length < 2) {
      Alert.alert('Speech', 'Type what you practiced before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api(`/lessons/${lessonId}/speech`, {
        method: 'POST',
        body: {
          taskId: task.id,
          transcript: speechTranscript,
        },
      });
      Alert.alert('Speech', data.message || 'Speech attempt saved.');
      setSpeechStatus('Speech attempt submitted and saved.');
      await saveNextStep('speech');
    } catch (err) {
      Alert.alert('Speech', err.message || 'Unable to save your speech attempt.');
    } finally {
      setSubmitting(false);
    }
  }

  function goToPreviousStep() {
    if (submitting || completed) return;
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
      setCompleted(true);
      setStudent((current) => current
        ? { ...current, xp: Number(current.xp || 0) + Number(data.xpAwarded || 0) }
        : current);
    } catch (err) {
      Alert.alert('Lesson', err.message || 'Unable to complete this lesson.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderActivity() {
    if (!currentActivity) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎉 Ready to finish</Text>
          <Text style={styles.body}>You completed every activity in this lesson.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={finishLesson} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Saving...' : 'Finish Lesson'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentActivity.type === 'mcq') {
      const questions = currentActivity.questions || [];
      const allAnswered = questions.length > 0 && questions.every((question) => mcqAnswers[question.id]);
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 {currentActivity.title}</Text>
          {renderActivityGuide(currentActivity)}
          {renderActivityVisual(currentActivity)}
          {renderActivityPassage(currentActivity)}
          {questions.map((question) => (
            <View key={question.id} style={styles.questionBlock}>
              <Text style={styles.question}>{question.question}</Text>
              {(question.options || []).map((option) => {
                const answer = mcqAnswers[question.id];
                const selected = answer?.selectedOptionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.option,
                      selected && (answer.correct ? styles.optionCorrect : styles.optionIncorrect),
                    ]}
                    onPress={() => answerQuestion(question, option)}
                    disabled={submitting}
                  >
                    <Text style={styles.optionText}>{option.optionText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
          {activityNotice ? (
            <View
              style={[
                styles.feedbackCard,
                activityNotice.type === 'success' && styles.feedbackSuccess,
                activityNotice.type === 'warning' && styles.feedbackWarning,
                activityNotice.type === 'error' && styles.feedbackError,
              ]}
            >
              <Text style={styles.feedbackTitle}>{activityNotice.title}</Text>
              <Text style={styles.feedbackMessage}>{activityNotice.message}</Text>
            </View>
          ) : null}
          {!questions.length && <Text style={styles.body}>No quiz questions are published for this activity yet.</Text>}
          <TouchableOpacity
            style={[styles.primaryButton, !allAnswered && styles.disabledButton]}
            onPress={() => advance('mcq')}
            disabled={!allAnswered || submitting}
          >
            <Text style={styles.primaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentActivity.type === 'writing') {
      const suggestions = currentActivity.writingTask?.rubricJson?.choices
        || currentActivity.writingTask?.rubricJson?.wordBank
        || [];
      const game = getGameMeta(currentActivity);

      return (
        <View style={[
          styles.card,
          littleLearnerGame && {
            borderWidth: 2,
            borderColor: '#BBF7D0',
            backgroundColor: '#FFFFFF',
          },
        ]}>
          {renderGameHeader(currentActivity)}
          <Text style={styles.cardTitle}>
            {littleLearnerGame ? `${game.icon} ${game.title}` : `✍️ ${currentActivity.title}`}
          </Text>
          <Text style={styles.body}>
            {littleLearnerGame
              ? 'Your mission: build a short answer and claim the finish star.'
              : currentActivity.writingTask?.prompt || currentActivity.instructions}
          </Text>
          {littleLearnerGame ? null : renderActivityGuide(currentActivity)}
          {renderActivityVisual(currentActivity)}
          {littleLearnerGame ? renderPowerUpTray(currentActivity) : null}
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
          {littleLearnerGame ? null : renderActivityPassage(currentActivity)}
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
                🧩 Answer Builder
              </Text>
            ) : null}
            <TextInput
              style={[
                styles.input,
                littleLearnerGame && {
                  borderColor: '#86EFAC',
                  backgroundColor: '#FFFFFF',
                  minHeight: 130,
                  fontSize: 18,
                },
              ]}
              multiline
              value={writingAnswer}
              onChangeText={setWritingAnswer}
              placeholder={littleLearnerGame ? 'Tap power-ups or type your answer here...' : 'Type your answer here...'}
            />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={submitWriting} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Saving...' : littleLearnerGame ? game.button : 'Save and Continue'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentActivity.type === 'speech') {
      const game = getGameMeta(currentActivity);

      return (
        <View style={[
          styles.card,
          littleLearnerGame && {
            borderWidth: 2,
            borderColor: '#FDE68A',
            backgroundColor: '#FFFFFF',
          },
        ]}>
          {renderGameHeader(currentActivity)}
          <Text style={styles.cardTitle}>
            {littleLearnerGame ? `${game.icon} ${game.title}` : `🎤 ${currentActivity.title}`}
          </Text>
          <Text style={styles.body}>{currentActivity.speechTask?.targetText || currentActivity.instructions}</Text>
          {littleLearnerGame ? null : renderActivityGuide(currentActivity)}
          {renderActivityVisual(currentActivity)}
          <View style={styles.speechButtons}>
            <TouchableOpacity style={[styles.secondaryButton, recording && styles.recordingButton]} onPress={recording ? stopRecording : startRecording}>
              <Text style={styles.secondaryText}>{recording ? '⏹ Stop Recording' : littleLearnerGame ? '🎮 Start Voice Quest' : '🎙 Start Recording'}</Text>
            </TouchableOpacity>
            {recordingUri ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={playRecording} disabled={playing}>
                <Text style={styles.secondaryText}>{playing ? '▶ Playing...' : '▶ Play Recording'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {speechStatus ? <Text style={styles.statusMessage}>{speechStatus}</Text> : null}
          <TextInput
            style={[
              styles.input,
              littleLearnerGame && {
                borderColor: '#FDE68A',
                backgroundColor: '#FFFBEB',
                minHeight: 110,
                fontSize: 18,
              },
            ]}
            multiline
            value={speechTranscript}
            onChangeText={setSpeechTranscript}
            placeholder={littleLearnerGame ? 'Type the words you said to claim your star...' : 'Type what you practiced saying...'}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={submitSpeech} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Saving...' : littleLearnerGame ? game.button : 'Save Speech Attempt'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const fileUrl = currentActivity.dataJson?.fileUrl;
    const vocabulary = currentActivity.dataJson?.words || [];
    const pairs = currentActivity.dataJson?.pairs || [];

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{currentActivity.title || 'Lesson Activity'}</Text>
        <Text style={styles.body}>{currentActivity.instructions || currentActivity.dataJson?.content || 'Review this activity before continuing.'}</Text>
        {renderActivityGuide(currentActivity)}
        {vocabulary.map((item, index) => (
          <View key={`${item.word}-${index}`} style={styles.contentRow}>
            <Text style={styles.question}>{item.word}</Text>
            <Text style={styles.body}>{item.meaning}</Text>
          </View>
        ))}
        {pairs.map((item, index) => (
          <View key={`${item.left}-${index}`} style={styles.contentRow}>
            <Text style={styles.question}>{item.left}</Text>
            <Text style={styles.body}>{item.right}</Text>
          </View>
        ))}
        {fileUrl ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openURL(fileUrl)}>
            <Text style={styles.secondaryText}>📎 Open Lesson Material</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => advance(currentActivity.type || 'activity')}
          disabled={submitting}
        >
          <Text style={styles.primaryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.body}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error || 'Lesson was not found.'}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryText}>Go Back</Text>
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
            <Text style={styles.back}>← Lesson Library</Text>
          </TouchableOpacity>
          <View style={styles.studentChip}>
            <Text style={styles.avatar}>{student?.avatar || '🧒'}</Text>
            <Text style={styles.xp}>⚡ {student?.xp || 0}</Text>
          </View>
        </View>

        <Text style={styles.title}>📖 {lesson.title}</Text>
        <Text style={styles.stepText}>Step {Math.min(step, totalSteps)} of {totalSteps} • +{lesson.xpReward || 0} XP</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <View style={styles.stepRow}>
          {activities.map((activity, index) => (
            <View key={activity.id || `${activity.type}-${index}`} style={[styles.stepDot, step > index && styles.stepDotActive]}>
              <Text style={styles.stepIcon}>{activity.type === 'mcq' ? '🧠' : activity.type === 'writing' ? '✍️' : activity.type === 'speech' ? '🎤' : '📖'}</Text>
            </View>
          ))}
          <View style={[styles.stepDot, completed && styles.stepDotActive]}>
            <Text style={styles.stepIcon}>🏁</Text>
          </View>
        </View>

        {!completed && step > 1 ? (
          <TouchableOpacity
            style={styles.previousStepButton}
            onPress={goToPreviousStep}
            disabled={submitting}
          >
            <Text style={styles.previousStepText}>← Previous Step</Text>
          </TouchableOpacity>
        ) : null}

          {completed ? (
            <View style={styles.card}>
              <View style={styles.completionToast}>
                <Text style={styles.completionToastIcon}>✅</Text>

                <View style={styles.completionToastCopy}>
                  <Text style={styles.completionToastTitle}>Lesson complete</Text>
                  <Text style={styles.completionToastBody}>
                    {completionResult?.xpAwarded
                      ? `+${completionResult?.xpAwarded || 0} XP earned. Your progress is saved.`
                      : 'Your lesson progress is already saved.'}
                  </Text>
                </View>
              </View>

              {(completionResult?.newBadges || []).map((badge) => (
                <View key={badge.id || badge.code} style={styles.badgeRow}>
                  <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
                  <View>
                    <Text style={styles.question}>New badge unlocked</Text>
                    <Text style={styles.body}>{badge.name}</Text>
                  </View>
                </View>
              ))}

              {nextLesson ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.replace('StudentJuniorLessonDetail', { lessonId: nextLesson.id })}
                >
                  <Text style={styles.primaryText}>Next Lesson →</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.primaryText}>Back to Library</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate(homeRoute)}>
                <Text style={styles.secondaryText}>🏠 Return Home</Text>
              </TouchableOpacity>
            </View>
          ) : renderActivity()}
      </ScrollView>
      </KeyboardAvoidingView>
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
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
  },
  completionToastIcon: {
    fontSize: 26,
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
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 22,
    padding: 14,
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
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
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

  guideCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  guideIconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  guideIcon: {
    fontSize: 24,
  },
  guideContent: {
    flex: 1,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 4,
  },
  guideBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  guideSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  guideStepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  guideStepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#16A34A',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 6,
  },
  guideStepText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
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
  stepText: { color: '#64748B', marginTop: 7 },
  progressTrack: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 16, marginBottom: 20 },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardTitle: { color: '#0F172A', fontSize: 23, fontWeight: '900' },
  body: { color: '#475569', lineHeight: 22, marginTop: 10 },
  questionBlock: { marginTop: 16 },
  question: { color: '#0F172A', fontWeight: '900', fontSize: 17 },
  option: { borderWidth: 2, borderColor: '#D1FAE5', borderRadius: 14, padding: 12, marginTop: 9 },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionIncorrect: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { color: '#0F172A' },
  feedbackCard: {
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
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
  input: { borderWidth: 2, borderColor: '#D1FAE5', borderRadius: 14, minHeight: 110, padding: 12, marginTop: 16, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#16A34A', borderRadius: 16, alignItems: 'center', paddingVertical: 14, marginTop: 18 },
  secondaryButton: { backgroundColor: '#E0F2FE', borderRadius: 16, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, marginTop: 12 },
  recordingButton: { backgroundColor: '#FEE2E2' },
  secondaryText: { color: '#0F172A', fontWeight: '900' },
  speechButtons: { marginTop: 4 },
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', borderRadius: 16, padding: 12, marginTop: 14 },
  badgeIcon: { fontSize: 32 },
  disabledButton: { backgroundColor: '#CBD5E1' },
  primaryText: { color: '#FFF', fontWeight: '900' },
  reward: { color: '#F97316', fontSize: 28, fontWeight: '900', marginTop: 14 },
  error: { color: '#B91C1C', textAlign: 'center' },
});
