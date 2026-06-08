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
import StudentScreenHeader from './StudentScreenHeader';
import { api } from '../api/client';

const CATEGORIES = [
  { key: 'ALL', label: 'All', icon: '🌎', accent: '#22C55E', soft: '#ECFDF5' },
  { key: 'Pagbasa', label: 'Pagbasa', icon: '📖', accent: '#22C55E', soft: '#DCFCE7' },
  { key: 'Bokabularyo', label: 'Bokabularyo', icon: '🔤', accent: '#3B82F6', soft: '#DBEAFE' },
  { key: 'Panitikan', label: 'Panitikan', icon: '📜', accent: '#A855F7', soft: '#F3E8FF' },
  { key: 'Oral Communication', label: 'Oral Communication', icon: '🎙️', accent: '#F59E0B', soft: '#FEF3C7' },
  { key: 'Pagsulat', label: 'Pagsulat', icon: '✍️', accent: '#EC4899', soft: '#FCE7F3' },
];

function categoryKey(subject = '') {
  const value = String(subject).trim().toLowerCase();
  if (value === 'oral comm' || value === 'oral communication') return 'Oral Communication';
  return CATEGORIES.find((category) => category.key.toLowerCase() === value)?.key || String(subject || 'General');
}

function categoryMeta(subject) {
  const key = categoryKey(subject);
  return CATEGORIES.find((category) => category.key === key) || {
    key,
    label: key,
    icon: '📚',
    accent: '#64748B',
    soft: '#F1F5F9',
  };
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function withUnlockStates(lessons = []) {
  const unlockBySubject = new Map();

  return lessons.map((lesson) => {
    const subject = categoryKey(lesson.subject);
    const canStart = unlockBySubject.get(subject) ?? true;
    const completed = Boolean(lesson.completed);
    const unlocked = completed || canStart;

    if (!completed) unlockBySubject.set(subject, false);

    return {
      ...lesson,
      completed,
      unlocked,
      subjectKey: subject,
      progressPercent: completed ? 100 : clampPercent(lesson.progress?.percent),
    };
  });
}

export default function LessonLibrary({ navigation, variant = 'junior' }) {
  const [dashboard, setDashboard] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playful = variant === 'junior';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await api('/dashboard'));
    } catch (err) {
      setError(err.message || 'Unable to load the lesson library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const lessons = useMemo(
    () => withUnlockStates(dashboard?.lessons || []),
    [dashboard]
  );
  const filteredLessons = useMemo(
    () => selectedCategory === 'ALL'
      ? lessons
      : lessons.filter((lesson) => lesson.subjectKey === selectedCategory),
    [lessons, selectedCategory]
  );

  const student = dashboard?.student || {};
  const progress = dashboard?.progress || {};

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
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.muted}>Loading your lesson library...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        
        <StudentScreenHeader
          navigation={navigation}
          avatar={student.avatar}
          gradeLevel={student.gradeLevel}
        />

        <View style={[styles.hero, playful && styles.heroPlayful]}>
          <Text style={styles.eyebrow}>{playful ? 'MGA ARALIN' : 'FILIPINO LEARNING HUB'}</Text>
          <Text style={styles.title}>📚 Lesson Library</Text>
          <Text style={styles.subtitle}>Choose a category, earn XP, and continue where you stopped.</Text>
          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>⚡ {student.xp || 0} XP</Text>
            <Text style={styles.heroStat}>{progress.percent || 0}% complete</Text>
          </View>
          <View style={styles.overallTrack}>
            <View style={[styles.overallFill, { width: `${clampPercent(progress.percent)}%` }]} />
          </View>
          <Text style={styles.progressCount}>{progress.completedLessons || 0}/{progress.totalLessons || lessons.length} lessons completed</Text>
        </View>

        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {CATEGORIES.map((category) => {
            const active = category.key === selectedCategory;
            return (
              <TouchableOpacity
                key={category.key}
                style={[styles.filter, active && { backgroundColor: category.soft, borderColor: category.accent }]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text>{category.icon}</Text>
                <Text style={[styles.filterText, active && { color: category.accent }]}>{category.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredLessons.length ? (
          filteredLessons.map((lesson) => {
            const meta = categoryMeta(lesson.subject);
            const action = lesson.completed
              ? '✅ Done'
              : lesson.unlocked
                ? lesson.progressPercent > 0 ? '▶ Resume' : '▶ Start'
                : '🔒 Locked';

            return (
              <TouchableOpacity
                key={lesson.id}
                activeOpacity={lesson.unlocked ? 0.84 : 1}
                disabled={!lesson.unlocked}
                style={[styles.lessonCard, !lesson.unlocked && styles.lockedCard]}
                onPress={() => openLesson(lesson)}
              >
                <View style={styles.lessonTop}>
                  <View style={[styles.thumbnail, { backgroundColor: meta.soft }]}>
                    <Text style={styles.thumbnailIcon}>{meta.icon}</Text>
                  </View>
                  <Text style={[styles.status, { color: lesson.unlocked ? meta.accent : '#94A3B8' }]}>{action}</Text>
                </View>
                <Text style={[styles.subject, { color: meta.accent }]}>{meta.label}</Text>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.muted}>⏱ {lesson.duration || '10 minuto'}</Text>
                  <Text style={styles.xpChip}>⭐ +{lesson.xpReward || 0} XP</Text>
                </View>
                <View style={styles.lessonProgressRow}>
                  <Text style={styles.muted}>Lesson progress</Text>
                  <Text style={styles.progressValue}>{lesson.progressPercent}%</Text>
                </View>
                <View style={styles.lessonTrack}>
                  <View style={[styles.lessonFill, { backgroundColor: meta.accent, width: `${lesson.progressPercent}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.messageCard}>
            <Text style={styles.muted}>No published lessons are available in this category yet.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  page: { padding: 16, paddingBottom: 44 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6FFF5' },
  hero: { backgroundColor: '#FFF', borderRadius: 26, padding: 20, marginBottom: 20 },
  heroPlayful: { backgroundColor: '#ECFDF5' },
  eyebrow: { color: '#16A34A', fontWeight: '900', fontSize: 12 },
  title: { color: '#0F172A', fontSize: 31, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#64748B', marginTop: 7, lineHeight: 21 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  heroStat: { color: '#166534', fontWeight: '900' },
  overallTrack: { height: 10, backgroundColor: '#D1FAE5', borderRadius: 99, overflow: 'hidden', marginTop: 12 },
  overallFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  progressCount: { color: '#64748B', marginTop: 8, fontSize: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '900' },
  filters: { paddingVertical: 12, gap: 8 },
  filter: { flexDirection: 'row', gap: 5, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { color: '#64748B', fontWeight: '800' },
  lessonCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, marginBottom: 14, elevation: 3 },
  lockedCard: { opacity: 0.55 },
  lessonTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  thumbnail: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  thumbnailIcon: { fontSize: 28 },
  status: { fontWeight: '900' },
  subject: { marginTop: 12, fontWeight: '900' },
  lessonTitle: { color: '#0F172A', fontSize: 21, fontWeight: '900', marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  muted: { color: '#64748B', marginTop: 4 },
  xpChip: { color: '#F97316', fontWeight: '900' },
  lessonProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  progressValue: { color: '#334155', fontWeight: '900' },
  lessonTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  lessonFill: { height: '100%', borderRadius: 99 },
  messageCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 18, marginTop: 8 },
  error: { color: '#B91C1C' },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#16A34A', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginTop: 12 },
  retryText: { color: '#FFF', fontWeight: '900' },
});
