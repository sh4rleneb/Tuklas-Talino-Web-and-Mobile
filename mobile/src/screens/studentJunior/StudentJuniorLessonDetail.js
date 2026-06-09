import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  const recordingRef = useRef(null);
  const soundRef = useRef(null);

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

  const activities = useMemo(
    () => Array.isArray(lesson?.activities) ? lesson.activities : [],
    [lesson]
  );
  const totalSteps = Math.max(1, activities.length + 1);
  const currentActivity = activities[step - 1];
  const percent = completed ? 100 : Math.round(((Math.max(1, step) - 1) / totalSteps) * 100);
  const nextLesson = useMemo(() => {
    const lessons = dashboard?.lessons || [];
    const lessonIndex = lessons.findIndex((item) => Number(item.id) === Number(lessonId));
    return lessonIndex >= 0 ? lessons[lessonIndex + 1] : null;
  }, [dashboard, lessonId]);
  const homeRoute = 'Home';

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
      Alert.alert(data.correct ? 'Correct!' : 'Try Again', data.message || 'Answer saved.');
    } catch (err) {
      Alert.alert('Quiz', err.message || 'Unable to save your answer.');
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
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✍️ {currentActivity.title}</Text>
          <Text style={styles.body}>{currentActivity.writingTask?.prompt || currentActivity.instructions}</Text>
          {suggestions.length ? (
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
          <TextInput
            style={styles.input}
            multiline
            value={writingAnswer}
            onChangeText={setWritingAnswer}
            placeholder="Type your answer here..."
          />
          <TouchableOpacity style={styles.primaryButton} onPress={submitWriting} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Saving...' : 'Save and Continue'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentActivity.type === 'speech') {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎤 {currentActivity.title}</Text>
          <Text style={styles.body}>{currentActivity.speechTask?.targetText || currentActivity.instructions}</Text>
          <View style={styles.speechButtons}>
            <TouchableOpacity style={[styles.secondaryButton, recording && styles.recordingButton]} onPress={recording ? stopRecording : startRecording}>
              <Text style={styles.secondaryText}>{recording ? '⏹ Stop Recording' : '🎙 Start Recording'}</Text>
            </TouchableOpacity>
            {recordingUri ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={playRecording} disabled={playing}>
                <Text style={styles.secondaryText}>{playing ? '▶ Playing...' : '▶ Play Recording'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {speechStatus ? <Text style={styles.statusMessage}>{speechStatus}</Text> : null}
          <TextInput
            style={styles.input}
            multiline
            value={speechTranscript}
            onChangeText={setSpeechTranscript}
            placeholder="Type what you practiced saying..."
          />
          <TouchableOpacity style={styles.primaryButton} onPress={submitSpeech} disabled={submitting}>
            <Text style={styles.primaryText}>{submitting ? 'Saving...' : 'Save Speech Attempt'}</Text>
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

        {completed ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎉 Lesson complete</Text>
            <Text style={styles.reward}>+{completionResult?.xpAwarded || 0} XP earned now</Text>
            <Text style={styles.body}>
              {completionResult?.xpAwarded
                ? 'Your XP and progress are saved.'
                : 'This lesson was already completed. Your progress remains saved.'}
            </Text>
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
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('StudentJuniorLessonDetail', { lessonId: nextLesson.id })}>
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
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 18, elevation: 4 },
  cardTitle: { color: '#0F172A', fontSize: 23, fontWeight: '900' },
  body: { color: '#475569', lineHeight: 22, marginTop: 10 },
  questionBlock: { marginTop: 16 },
  question: { color: '#0F172A', fontWeight: '900', fontSize: 17 },
  option: { borderWidth: 2, borderColor: '#D1FAE5', borderRadius: 14, padding: 12, marginTop: 9 },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionIncorrect: { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionText: { color: '#0F172A' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  choiceChip: { backgroundColor: '#FEF3C7', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 9 },
  choiceText: { color: '#92400E', fontWeight: '900' },
  input: { borderWidth: 2, borderColor: '#D1FAE5', borderRadius: 14, minHeight: 110, padding: 12, marginTop: 16, textAlignVertical: 'top' },
  primaryButton: { backgroundColor: '#16A34A', borderRadius: 16, alignItems: 'center', paddingVertical: 14, marginTop: 18 },
  secondaryButton: { backgroundColor: '#E0F2FE', borderRadius: 16, alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, marginTop: 12 },
  recordingButton: { backgroundColor: '#FEE2E2' },
  secondaryText: { color: '#0F172A', fontWeight: '900' },
  speechButtons: { marginTop: 4 },
  statusMessage: { color: '#0369A1', fontWeight: '800', marginTop: 10 },
  contentRow: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginTop: 10 },
  stepRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  stepDot: { backgroundColor: '#E2E8F0', borderRadius: 99, padding: 7 },
  stepDotActive: { backgroundColor: '#DCFCE7' },
  stepIcon: { fontSize: 15 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FEF3C7', borderRadius: 16, padding: 12, marginTop: 14 },
  badgeIcon: { fontSize: 32 },
  disabledButton: { backgroundColor: '#CBD5E1' },
  primaryText: { color: '#FFF', fontWeight: '900' },
  reward: { color: '#F97316', fontSize: 28, fontWeight: '900', marginTop: 14 },
  error: { color: '#B91C1C', textAlign: 'center' },
});
