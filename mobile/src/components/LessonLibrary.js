import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Animated,
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
  if (value === 'oral comm' || value === 'oral communication' || value === 'pagsasalita') return 'Oral Communication';
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

function gameQuestMeta(subject) {
  const key = categoryKey(subject);

  const games = {
    Pagbasa: {
      element: 'Pagbasa',
      title: '📖 Read & Match Game',
      mission: 'Read the clue, tap the right answer, and collect stars for every correct match.',
    },
    Bokabularyo: {
      element: 'Bokabularyo',
      title: '🔤 Word Match Game',
      mission: 'Match words with pictures or meanings to build your Filipino vocabulary.',
    },
    Panitikan: {
      element: 'Panitikan',
      title: '📜 Story Adventure Game',
      mission: 'Explore the story, answer fun challenges, and unlock the next story adventure.',
    },
    'Oral Communication': {
      element: 'Pagsasalita',
      title: '🎙️ Speak Aloud Game',
      mission: 'Say the target words aloud, practice clear speech, and earn stars as you improve.',
    },
    Pagsulat: {
      element: 'Pagsulat',
      title: '✍️ Trace & Write Game',
      mission: 'Practice writing words or short answers, then complete the challenge to earn XP.',
    },
  };

  return games[key] || {
    element: key || 'Filipino',
    title: '🎮 Learning Game',
    mission: 'Read, tap, speak, or write to collect stars and unlock the next game.',
  };
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function lessonDifficulty(lesson = {}, student = {}) {
  const rawDifficulty = String(
    lesson.difficulty ||
    lesson.difficultyLevel ||
    lesson.level ||
    ''
  ).trim().toLowerCase();

  const grade = Number(lesson.gradeLevel || student.gradeLevel || 0);
  const xp = Number(lesson.xpReward || 0);

  if (rawDifficulty.includes('beginner') || rawDifficulty.includes('easy')) {
    return {
      label: rawDifficulty.includes('beginner') ? 'Beginner' : 'Easy',
      icon: rawDifficulty.includes('beginner') ? '🌱' : '😊',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Short, friendly, and easy to finish.',
    };
  }

  if (rawDifficulty.includes('medium') || rawDifficulty.includes('normal')) {
    return {
      label: 'Medium',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'A balanced challenge for steady practice.',
    };
  }

  if (rawDifficulty.includes('hard') || rawDifficulty.includes('advanced')) {
    return {
      label: rawDifficulty.includes('advanced') ? 'Advanced' : 'Hard',
      icon: rawDifficulty.includes('advanced') ? '🏆' : '🔥',
      color: '#DC2626',
      soft: '#FEE2E2',
      helper: 'A stronger challenge with more thinking.',
    };
  }

  if (grade <= 1) {
    return {
      label: 'Beginner',
      icon: '🌱',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Made for first steps: read, tap, and win stars.',
    };
  }

  if (grade === 2) {
    return {
      label: 'Easy Quest',
      icon: '⭐',
      color: '#F59E0B',
      soft: '#FEF3C7',
      helper: 'A playful quest with simple challenges.',
    };
  }

  if (grade <= 4 || xp <= 20) {
    return {
      label: 'Medium',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'A balanced challenge for steady practice.',
    };
  }

  if (grade === 5 || xp <= 30) {
    return {
      label: 'Hard',
      icon: '🔥',
      color: '#EA580C',
      soft: '#FFEDD5',
      helper: 'A stronger challenge with more thinking.',
    };
  }

  return {
    label: 'Advanced',
    icon: '🏆',
    color: '#7C3AED',
    soft: '#EDE9FE',
    helper: 'A boss-level lesson for confident learners.',
  };
}

function questStarCount(lesson = {}) {
  if (lesson.completed) return 3;

  const percent = clampPercent(lesson.progressPercent || lesson.progress?.percent);

  if (percent >= 70) return 2;
  if (percent >= 25) return 1;
  return 0;
}

function isLittleQuestLesson(lesson = {}, student = {}, playful = false) {
  const grade = Number(lesson.gradeLevel || student.gradeLevel || 0);
  return playful && grade > 0 && grade <= 2;
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

  const cardScale = React.useRef(
    new Animated.Value(1)
  ).current;

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
    
    console.log("[OPEN LESSON]", {
      variant,
      lessonId: lesson.id,
      unlocked: lesson.unlocked,
    });

console.log(
      "[LessonLibrary]",
      "variant=", variant,
      "lesson=", lesson.id,
      "unlocked=", lesson.unlocked
    );

    if (!lesson.unlocked) {
      console.log("[LessonLibrary] BLOCKED: lesson is locked");
      return;
    }

    if (variant === 'senior') {
      navigation.navigate('StudentJuniorLessonDetail', {
        lessonId: lesson.id,
        homeRoute: 'StudentSeniorTabs',
      });
      return;
    }

    navigation.navigate('Lessons', {
      screen: 'StudentJuniorLessonDetail',
      params: {
        lessonId: lesson.id,
        homeRoute: 'StudentTabs',
      },
    });
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
          <Text style={styles.eyebrow}>
            {playful ? 'GAME QUEST MAP' : 'FILIPINO LEARNING HUB'}
          </Text>
          <Text style={styles.title}>
            📚 Lesson Library
          </Text>
          <Text style={styles.subtitle}>
            {playful
              ? 'Play Filipino learning games, collect stars, earn XP, and unlock the next challenge.'
              : 'Choose a category, earn XP, and continue where you stopped.'}
          </Text>

          <View style={styles.heroStats}>
            <Text style={styles.heroStat}>⚡ {student.xp || 0} XP</Text>
            <Text style={styles.heroStat}>{progress.percent || 0}% complete</Text>
          </View>

          <View style={styles.overallTrack}>
            <View style={[styles.overallFill, { width: `${clampPercent(progress.percent)}%` }]} />
          </View>

          <Text style={styles.progressCount}>
            {progress.completedLessons || 0}/{progress.totalLessons || lessons.length} lessons completed
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {CATEGORIES.map((category) => {
            const active = category.key === selectedCategory;

            return (
              <Animated.View
                key={category.key}
                style={{
                  transform: [
                    {
                      scale: cardScale,
                    },
                  ],
                }}
              >
              <TouchableOpacity
                style={[
                  styles.filter,
                  active && {
                    backgroundColor: category.soft,
                    borderColor: category.accent,
                  },
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text>{category.icon}</Text>

                <Text
                  style={[
                    styles.filterText,
                    active && { color: category.accent },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
              </Animated.View>
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
            const game = gameQuestMeta(lesson.subject);
            const difficulty = lessonDifficulty(lesson, student);
            const littleQuest = isLittleQuestLesson(lesson, student, playful);
            const stars = questStarCount(lesson);

            let action = lesson.completed
              ? '✅ Done'
              : lesson.unlocked
                ? lesson.progressPercent > 0 ? '▶ Resume' : '▶ Start'
                : '🔒 Locked';

            if (littleQuest) {
              action = lesson.completed
                ? '🏆 Game Done'
                : lesson.unlocked
                  ? lesson.progressPercent > 0 ? '🎮 Continue Game' : '🕹️ Play Game'
                  : '🔒 Unlock Game';
            }

            return (
              <TouchableOpacity
                key={lesson.id}
                activeOpacity={1}

                onPressIn={() => {
                  Animated.spring(cardScale,{
                    toValue:0.97,
                    useNativeDriver:true,
                  }).start();
                }}

                onPressOut={() => {
                  Animated.spring(cardScale,{
                    toValue:1,
                    friction:4,
                    useNativeDriver:true,
                  }).start();
                }}
                disabled={!lesson.unlocked}
                style={[
                  styles.lessonCard,
                  littleQuest && styles.questCard,
                  !lesson.unlocked && styles.lockedCard,
                ]}
                onPress={() => openLesson(lesson)}
              >
                <View style={styles.lessonTop}>
                  <View
                    style={[
                      littleQuest
                        ? styles.questThumbnail
                        : styles.thumbnail,
                      { backgroundColor: meta.soft },
                    ]}
                  >
                    <Text
                      style={
                        littleQuest
                          ? styles.questThumbnailIcon
                          : styles.thumbnailIcon
                      }
                    >
                      {lesson.completed ? '✅' : meta.icon}
                    </Text>
                  </View>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.lessonTitle}>
                      {lesson.title}
                    </Text>

                    {!littleQuest && (
                    <Text style={styles.lessonMeta}>
                      {meta.label} • Grade {lesson.gradeLevel || student.gradeLevel || '—'} • {lesson.xpReward || 0} XP
                    </Text>
                    )}

                    {!littleQuest && (
                    <View style={styles.metaRow}>
                      <View
                        style={[
                          styles.difficultyPill,
                          {
                            backgroundColor: difficulty.soft,
                            borderColor: difficulty.color,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.difficultyText,
                            { color: difficulty.color },
                          ]}
                        >
                          {difficulty.icon} {difficulty.label}
                        </Text>
                      </View>

                      <View style={styles.starRow}>
                        {[0,1,2].map(i => (
                          <Text
                            key={i}
                            style={[
                              styles.starIcon,
                              i >= stars && styles.starEmpty,
                            ]}
                          >
                            ⭐
                          </Text>
                        ))}
                      </View>
                    </View>
                    )}

                    {!littleQuest && (
                      <>
                        <Text style={styles.difficultyHelp}>
                          {game.title}
                        </Text>

                        <Text style={styles.lessonMeta}>
                          {game.mission}
                        </Text>
                      </>
                    )}

                    {!littleQuest && (
                      <>
                        <View style={styles.lessonTrack}>
                          <View
                            style={[
                              styles.lessonFill,
                              {
                                width: `${lesson.progressPercent}%`,
                                backgroundColor: meta.accent,
                              },
                            ]}
                          />
                        </View>

                        <View style={styles.lessonProgressRow}>
                          <Text style={styles.progressValue}>
                            {lesson.progressPercent}%
                          </Text>

                          <Text style={styles.xpChip}>
                            {action}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>

                  <Text style={styles.lessonArrow}>
                    {lesson.unlocked ? '›' : '🔒'}
                  </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6FFF5',
  },
  hero: {
    backgroundColor: '#FFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
  },
  heroPlayful: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  eyebrow: { color: '#16A34A', fontWeight: '900', fontSize: 12 },
  title: { color: '#0F172A', fontSize: 31, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#64748B', marginTop: 7, lineHeight: 21 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  heroStat: { color: '#166534', fontWeight: '900' },
  overallTrack: {
    height: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 12,
  },
  overallFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  progressCount: { color: '#64748B', marginTop: 8, fontSize: 12 },
  sectionTitle: { color: '#0F172A', fontSize: 22, fontWeight: '900' },
  filters: { paddingVertical: 12, gap: 8 },
  filter: {
    flexDirection: 'row',
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: { color: '#64748B', fontWeight: '800' },
  lessonCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
  },
  questCard: {
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  lockedCard: { opacity: 0.55 },
  lessonTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questThumbnail: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  thumbnailIcon: { fontSize: 28 },
  questThumbnailIcon: { fontSize: 36 },
  statusStack: {
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
  },
  status: {
    fontWeight: '900',
    textAlign: 'right',
  },
  difficultyPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '900',
  },
  subject: { marginTop: 12, fontWeight: '900' },
  lessonTitle: {
    color: '#0F172A',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },

  lessonMeta: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  lessonArrow: {
    fontSize: 28,
    color: '#94A3B8',
    fontWeight: '700',
    alignSelf: 'center',
  },
  difficultyHelp: {
    color: '#64748B',
    marginTop: 8,
    lineHeight: 20,
  },
  questBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  questBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questLabel: {
    color: '#92400E',
    fontWeight: '900',
  },
  questHelp: {
    color: '#92400E',
    marginTop: 6,
    lineHeight: 19,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  starIcon: {
    fontSize: 18,
  },
  starEmpty: {
    color: '#D6D3D1',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaMini: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaMiniText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  muted: { color: '#64748B', marginTop: 4 },
  xpChip: { color: '#F97316', fontSize: 12, fontWeight: '900' },
  lessonProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  progressValue: { color: '#334155', fontWeight: '900' },
  lessonTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 7,
  },
  lessonFill: { height: '100%', borderRadius: 99 },
  messageCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  error: { color: '#B91C1C' },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },
  retryText: { color: '#FFF', fontWeight: '900' },
});
