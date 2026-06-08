import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';

const SUBJECTS = [
  { key: 'ALL', label: 'All', icon: '🌎', accent: '#22C55E', soft: '#ECFDF5' },
  { key: 'Pagbasa', label: 'Pagbasa', icon: '📖', accent: '#22C55E', soft: '#DCFCE7' },
  { key: 'Bokabularyo', label: 'Bokabularyo', icon: '🔤', accent: '#3B82F6', soft: '#DBEAFE' },
  { key: 'Panitikan', label: 'Panitikan', icon: '📜', accent: '#A855F7', soft: '#F3E8FF' },
  { key: 'Oral Comm', label: 'Oral Communication', icon: '🎙️', accent: '#F59E0B', soft: '#FEF3C7' },
  { key: 'Pagsulat', label: 'Pagsulat', icon: '✍️', accent: '#EC4899', soft: '#FCE7F3' },
];

function subjectMeta(subject = '') {
  return SUBJECTS.find((item) => item.key === subject) || {
    key: String(subject || 'General'),
    label: String(subject || 'General'),
    icon: '📚',
    accent: '#64748B',
    soft: '#F1F5F9',
  };
}

function withUnlockStates(lessons = []) {
  const unlockBySubject = new Map();

  return lessons.map((lesson) => {
    const subject = String(lesson.subject || 'General');
    const canStartNext = unlockBySubject.get(subject) ?? true;
    const completed = Boolean(lesson.completed);
    const unlocked = completed || canStartNext;

    if (!completed) {
      unlockBySubject.set(subject, false);
    }

    return {
      ...lesson,
      completed,
      unlocked,
    };
  });
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

export default function LessonLibrary({ navigation, variant = 'junior' }) {
  const [dashboard, setDashboard] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playful = variant === 'junior';

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api('/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err.message || 'Unable to load the lesson library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const lessons = useMemo(
    () => withUnlockStates(Array.isArray(dashboard?.lessons) ? dashboard.lessons : []),
    [dashboard]
  );

  const filteredLessons = useMemo(() => {
    if (selectedSubject === 'ALL') return lessons;
    return lessons.filter((lesson) => lesson.subject === selectedSubject);
  }, [lessons, selectedSubject]);

  const student = dashboard?.student || {};
  const completedLessons = Number(dashboard?.progress?.completedLessons || 0);
  const totalLessons = Number(dashboard?.progress?.totalLessons || lessons.length || 0);
  const progressPercent = clampPercent(
    dashboard?.progress?.percent ?? (totalLessons ? (completedLessons / totalLessons) * 100 : 0)
  );

  function openLesson(lesson) {
    if (!lesson.unlocked) return;

    navigation.navigate(
      'Lessons',
      {
        screen: 'StudentJuniorLessonDetail',
        params: {
          lessonId: lesson.id
        }
      }
    );
  }

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading your lesson library...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, playful && styles.playfulSafe]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.gradePill}>
            <Text style={styles.gradeText}>Grade {student.gradeLevel || '—'}</Text>
          </View>
        </View>

        <View style={[styles.hero, playful && styles.playfulHero]}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{playful ? 'MGA ARALIN' : 'FILIPINO LEARNING HUB'}</Text>
            <Text style={styles.title}>📚 Lesson Library</Text>
            <Text style={styles.subtitle}>
              {playful
                ? 'Pumili ng lesson, kumita ng XP, at ipagpatuloy ang iyong learning adventure.'
                : 'Choose a lesson by category and keep building your Filipino skills.'}
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>⚡ {student.xp || 0}</Text>
              <Text style={styles.statLabel}>Earned XP</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>

          <View style={styles.overallProgress}>
            <View style={styles.progressHeading}>
              <Text style={styles.progressTitle}>Lesson progress</Text>
              <Text style={styles.progressCount}>{completedLessons}/{totalLessons} complete</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredLessons.length} lesson{filteredLessons.length === 1 ? '' : 's'} available
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {SUBJECTS.map((subject) => {
            const active = selectedSubject === subject.key;

            return (
              <TouchableOpacity
                key={subject.key}
                style={[styles.filterChip, active && { backgroundColor: subject.soft, borderColor: subject.accent }]}
                onPress={() => setSelectedSubject(subject.key)}
              >
                <Text style={styles.filterIcon}>{subject.icon}</Text>
                <Text style={[styles.filterText, active && { color: subject.accent }]}>{subject.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load lessons</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDashboard}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && filteredLessons.length ? (
          <View style={styles.lessonGrid}>
            {filteredLessons.map((lesson) => {
              const meta = subjectMeta(lesson.subject);
              const lessonProgress = lesson.completed ? 100 : 0;

              return (
                <TouchableOpacity
                  key={lesson.id}
                  activeOpacity={lesson.unlocked ? 0.86 : 1}
                  disabled={!lesson.unlocked}
                  style={[
                    styles.lessonCard,
                    playful && styles.playfulLessonCard,
                    !lesson.unlocked && styles.lockedCard,
                  ]}
                  onPress={() => openLesson(lesson)}
                >
                  <View style={styles.lessonTop}>
                    <View style={[styles.thumbnail, { backgroundColor: meta.soft }]}>
                      <Text style={styles.thumbnailIcon}>{meta.icon}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        lesson.completed
                          ? styles.donePill
                          : lesson.unlocked
                            ? styles.startPill
                            : styles.lockedPill,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          lesson.completed
                            ? styles.doneText
                            : lesson.unlocked
                              ? styles.startText
                              : styles.lockedText,
                        ]}
                      >
                        {lesson.completed ? '✅ Done' : lesson.unlocked ? '▶ Start' : '🔒 Locked'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.subject, { color: meta.accent }]}>{meta.label}</Text>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>Grade {lesson.gradeLevel || '—'}</Text>
                    {lesson.duration ? <Text style={styles.metaText}>⏱ {lesson.duration}</Text> : null}
                  </View>

                  <View style={styles.lessonProgressHeading}>
                    <Text style={styles.lessonProgressLabel}>{lesson.completed ? 'Completed' : 'Lesson progress'}</Text>
                    <Text style={styles.lessonProgressValue}>{lessonProgress}%</Text>
                  </View>
                  <View style={styles.lessonProgressTrack}>
                    <View
                      style={[
                        styles.lessonProgressFill,
                        { backgroundColor: meta.accent, width: `${lessonProgress}%` },
                      ]}
                    />
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.xpChip}>
                      <Text style={styles.xpText}>⭐ +{lesson.xpReward || 0} XP</Text>
                    </View>
                    <Text style={[styles.openText, !lesson.unlocked && styles.lockedOpenText]}>
                      {lesson.completed ? 'Summary' : lesson.unlocked ? 'Open lesson ›' : 'Complete previous lesson'}
                    </Text>
                  </View>

                  {!lesson.unlocked ? (
                    <Text style={styles.lockReason}>
                      Complete the previous {meta.label} lesson to unlock this activity.
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {!loading && !error && !filteredLessons.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📖</Text>
            <Text style={styles.emptyTitle}>No lessons found</Text>
            <Text style={styles.emptyText}>There are no published lessons for this category yet.</Text>
          </View>
        ) : null}

        {loading && dashboard ? (
          <View style={styles.refreshRow}>
            <ActivityIndicator color="#22C55E" />
            <Text style={styles.refreshText}>Refreshing lessons...</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  playfulSafe: {
    backgroundColor: '#F6FFF5',
  },
  page: {
    paddingBottom: 42,
    paddingHorizontal: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingTop: 8,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backText: {
    color: '#15803D',
    fontFamily: 'Poppins_700Bold',
  },
  gradePill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DCFCE7',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  gradeText: {
    color: '#166534',
    fontFamily: 'Poppins_700Bold',
  },
  hero: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  playfulHero: {
    backgroundColor: '#FFFEF6',
    borderColor: '#FEF3C7',
  },
  heroCopy: {
    marginBottom: 16,
  },
  eyebrow: {
    color: '#16A34A',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  title: {
    color: '#0F172A',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 28,
    marginTop: 4,
  },
  subtitle: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    flex: 1,
    padding: 13,
  },
  statValue: {
    color: '#0F172A',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 18,
  },
  statLabel: {
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginTop: 2,
  },
  overallProgress: {
    marginTop: 16,
  },
  progressHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  progressTitle: {
    color: '#334155',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  progressCount: {
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  progressTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#22C55E',
    borderRadius: 999,
    height: '100%',
  },
  sectionHeader: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#0F172A',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 21,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    marginTop: 3,
  },
  filterRow: {
    paddingBottom: 16,
    paddingTop: 14,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  filterIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  filterText: {
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  lessonGrid: {
    paddingTop: 2,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 17,
    shadowColor: '#0F172A',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  playfulLessonCard: {
    borderRadius: 28,
  },
  lockedCard: {
    backgroundColor: '#F8FAFC',
    opacity: 0.7,
  },
  lessonTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  thumbnail: {
    alignItems: 'center',
    borderRadius: 20,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  donePill: {
    backgroundColor: '#DCFCE7',
  },
  startPill: {
    backgroundColor: '#DBEAFE',
  },
  lockedPill: {
    backgroundColor: '#E2E8F0',
  },
  statusText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  doneText: {
    color: '#166534',
  },
  startText: {
    color: '#1D4ED8',
  },
  lockedText: {
    color: '#64748B',
  },
  subject: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  lessonTitle: {
    color: '#0F172A',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 25,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaText: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    marginRight: 12,
  },
  lessonProgressHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    marginTop: 15,
  },
  lessonProgressLabel: {
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  lessonProgressValue: {
    color: '#475569',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  lessonProgressTrack: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    borderRadius: 999,
    height: '100%',
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  xpChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  xpText: {
    color: '#92400E',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },
  openText: {
    color: '#15803D',
    flexShrink: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    marginLeft: 8,
    textAlign: 'right',
  },
  lockedOpenText: {
    color: '#64748B',
  },
  lockReason: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 11,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 12,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 22,
    padding: 22,
  },
  errorTitle: {
    color: '#991B1B',
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
  },
  errorText: {
    color: '#B91C1C',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#B91C1C',
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 17,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
  },
  emptyIcon: {
    fontSize: 42,
  },
  emptyTitle: {
    color: '#0F172A',
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginTop: 10,
  },
  emptyText: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  refreshRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  refreshText: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    marginLeft: 8,
  },
});
