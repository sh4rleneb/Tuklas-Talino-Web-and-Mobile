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
import { api } from '../api/client';

import {
  cleanStudentLessonTitle,
  studentLessonDateValue,
} from '../utils/studentLessonDisplay';

const CATEGORIES = [
  { key: 'ALL', label: 'Lahat', icon: '✨', accent: '#22C55E', soft: '#ECFDF5' },
  { key: 'Pagbasa', label: 'Pagbasa', icon: '📖', accent: '#22C55E', soft: '#DCFCE7' },
  { key: 'Bokabularyo', label: 'Bokabularyo', icon: '🧩', accent: '#3B82F6', soft: '#DBEAFE' },
  { key: 'Panitikan', label: 'Panitikan', icon: '📚', accent: '#A855F7', soft: '#F3E8FF' },
  { key: 'Oral Communication', label: 'Pagsasalita', icon: '🎙️', accent: '#F59E0B', soft: '#FEF3C7' },
  { key: 'Pagsulat', label: 'Pagsulat', icon: '✍️', accent: '#EC4899', soft: '#FCE7F3' },
  { key: 'FINISHED', label: 'Tapos na', icon: '✅', accent: '#16A34A', soft: '#DCFCE7' },
];

function categoryKey(subject = '') {
  const value = String(subject || '').trim().toLowerCase();

  if (
    value === 'oral comm' ||
    value === 'oral communication' ||
    value === 'pagsasalita' ||
    value === 'komunikasyong pagsasalita'
  ) {
    return 'Oral Communication';
  }

  return CATEGORIES.find((category) => category.key.toLowerCase() === value)?.key || String(subject || 'General');
}

function categoryMeta(subject) {
  const key = categoryKey(subject);

  return CATEGORIES.find((category) => category.key === key) || {
    key,
    label: key || 'Filipino',
    icon: '📘',
    accent: '#64748B',
    soft: '#F1F5F9',
  };
}

function gameQuestMeta(subject) {
  const key = categoryKey(subject);

  const games = {
    Pagbasa: {
      title: 'Laro ng Pagbasa',
      mission: 'Basahin ang pahiwatig, piliin ang tamang sagot, at mangolekta ng mga bituin.',
    },
    Bokabularyo: {
      title: 'Pagtutugma ng Salita',
      mission: 'Itugma ang salita sa larawan o kahulugan para lumawak ang bokabularyo.',
    },
    Panitikan: {
      title: 'Pakikipagsapalaran sa Kuwento',
      mission: 'Basahin ang kuwento, sagutin ang hamon, at i-unlock ang susunod na bahagi.',
    },
    'Oral Communication': {
      title: 'Malinaw na Pagbigkas',
      mission: 'Makinig, bumigkas, at magsanay magsalita nang may kumpiyansa.',
    },
    Pagsulat: {
      title: 'Laro sa Pagsulat',
      mission: 'Magsanay sa pagsulat ng salita, pangungusap, at maiikling sagot.',
    },
  };

  return games[key] || {
    title: 'Laro sa Pagkatuto',
    mission: 'Magbasa, pumili, magsalita, o magsulat upang makakuha ng XP.',
  };
}

function clampPercent(value = 0) {
  return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
}

function lessonDifficulty(lesson = {}, student = {}) {
  const raw = String(lesson.difficulty || lesson.difficultyLevel || lesson.level || '').trim().toLowerCase();
  const grade = Number(lesson.gradeLevel || student.gradeLevel || 0);
  const xp = Number(lesson.xpReward || 0);

  if (raw.includes('beginner') || raw.includes('easy')) {
    return {
      label: raw.includes('beginner') ? 'Baguhan' : 'Madali',
      icon: '🌱',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Maikli, masaya, at madaling simulan.',
    };
  }

  if (raw.includes('medium') || raw.includes('normal')) {
    return {
      label: 'Katamtaman',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'Balanseng hamon para sa tuloy-tuloy na pagsasanay.',
    };
  }

  if (raw.includes('hard') || raw.includes('advanced')) {
    return {
      label: raw.includes('advanced') ? 'Dalubhasa' : 'Mahirap',
      icon: '🔥',
      color: '#DC2626',
      soft: '#FEE2E2',
      helper: 'Mas mapaghamong gawain para sa masusing pag-iisip.',
    };
  }

  if (grade <= 1) {
    return {
      label: 'Baguhan',
      icon: '🌱',
      color: '#16A34A',
      soft: '#DCFCE7',
      helper: 'Para sa nagsisimula: magbasa, pumili, at mangolekta ng bituin.',
    };
  }

  if (grade === 2) {
    return {
      label: 'Madaling Hamon',
      icon: '⭐',
      color: '#F59E0B',
      soft: '#FEF3C7',
      helper: 'Masayang hamon na may simple at malinaw na gawain.',
    };
  }

  if (grade <= 4 || xp <= 20) {
    return {
      label: 'Katamtaman',
      icon: '⚡',
      color: '#2563EB',
      soft: '#DBEAFE',
      helper: 'Balanseng hamon para sa tuloy-tuloy na pagsasanay.',
    };
  }

  if (grade === 5 || xp <= 30) {
    return {
      label: 'Mahirap',
      icon: '🔥',
      color: '#EA580C',
      soft: '#FFEDD5',
      helper: 'Mas mapaghamong gawain para sa masusing pag-iisip.',
    };
  }

  return {
    label: 'Dalubhasa',
    icon: '🏆',
    color: '#7C3AED',
    soft: '#EDE9FE',
    helper: 'Mas mataas na antas para sa handa sa malaking hamon.',
  };
}

function questStarCount(lesson = {}) {
  if (lesson.completed) return 3;

  const percent = clampPercent(lesson.progressPercent ?? lesson.progress?.percent);

  if (percent >= 70) return 2;
  if (percent >= 25) return 1;

  return 0;
}

function withUnlockStates(lessons = [], enforceSequential = false) {
  const unlockBySubject = new Map();

  return (Array.isArray(lessons) ? lessons : []).map((lesson) => {
    const subject = categoryKey(lesson.subject);
    const completed = Boolean(lesson.completed);
    let unlocked;

    if (!enforceSequential) {
      unlocked = true;
    } else {
      const canStart = unlockBySubject.get(subject) ?? true;
      unlocked = completed || canStart;
      if (!completed) unlockBySubject.set(subject, false);
    }

    return {
      ...lesson,
      completed,
      unlocked,
      subjectKey: subject,
      progressPercent: completed ? 100 : clampPercent(lesson.progressPercent ?? lesson.progress?.percent),
    };
  });
}

function actionText(lesson = {}) {
  if (!lesson.unlocked) return 'Hindi pa bukas';
  if (lesson.completed) return 'Tapos Na';
  if (Number(lesson.progressPercent || 0) > 0) return 'Magpatuloy';
  return 'Simulan';
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
      setError('Hindi makuha ang aklatan ng mga aralin. Pakisubukan muli.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const student = dashboard?.student || {};
  const progress = dashboard?.progress || {};

  const lessons = useMemo(
    () => withUnlockStates(dashboard?.lessons || [], false),
    [dashboard]
  );

  const filteredLessons = useMemo(() => {
    const sortedLessons = [...lessons].sort(
      (first, second) => {
        const completionOrder =
          Number(first.completed) -
          Number(second.completed);

        if (completionOrder) {
          return completionOrder;
        }

        return (
          studentLessonDateValue(second) -
          studentLessonDateValue(first)
        );
      }
    );

    if (selectedCategory === 'FINISHED') {
      return sortedLessons.filter((lesson) => lesson.completed);
    }

    if (selectedCategory === 'ALL') return sortedLessons;

    return sortedLessons.filter(
      (lesson) => lesson.subjectKey === selectedCategory
    );
  }, [lessons, selectedCategory]);

  const completedLessons = lessons.filter((lesson) => lesson.completed).length;
  const totalLessons = lessons.length;
  const overallPercent = totalLessons
    ? clampPercent(progress.percent ?? (completedLessons / totalLessons) * 100)
    : 0;

  function openLesson(lesson) {
    if (!lesson.unlocked) return;

    const params = {
      lessonId: lesson.id,
      homeRoute: variant === 'senior' ? 'StudentSeniorTabs' : 'StudentTabs',
    };

    const routeNames = navigation?.getState?.()?.routeNames || [];

    if (routeNames.includes('LessonDashboardScreen')) {
      navigation.navigate('LessonDashboardScreen', params);
      return;
    }

    navigation.navigate('Mga Aralin', {
      screen: 'LessonDashboardScreen',
      params,
    });
  }

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#16A34A" size="large" />
          <Text style={styles.loadingText}>Inihahanda ang iyong mga aralin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, playful ? styles.heroJunior : styles.heroSenior]}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTop}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.eyebrow}>
                {playful ? 'MAPA NG MGA HAMON' : 'SENTRO NG PAG-AARAL'}
              </Text>
              <Text style={styles.title}>
                {playful ? 'Aklatan ng Aralin' : 'Mga Aralin sa Filipino'}
              </Text>
              <Text style={styles.subtitle}>
                {playful
                  ? 'Pumili ng aralin, mangolekta ng bituin, kumita ng XP, at i-unlock ang susunod na hamon.'
                  : 'Piliin ang kategorya, ipagpatuloy ang aralin, at subaybayan ang progreso mo.'}
              </Text>
            </View>

            <View style={styles.gradeBadge}>
              <Text style={styles.gradeBadgeIcon}>{playful ? '🧭' : '📘'}</Text>
              <Text style={styles.gradeBadgeText}>Baitang {student.gradeLevel || '—'}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{student.xp || 0}</Text>
              <Text style={styles.heroStatLabel}>XP</Text>
            </View>

            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{overallPercent}%</Text>
              <Text style={styles.heroStatLabel}>Pag-unlad</Text>
            </View>

            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{completedLessons}/{totalLessons || 0}</Text>
              <Text style={styles.heroStatLabel}>Aralin</Text>
            </View>
          </View>

          <View style={styles.overallTrack}>
            <View style={[styles.overallFill, { width: `${overallPercent}%` }]} />
          </View>

          <Text style={styles.progressCount}>
            {completedLessons} sa {totalLessons || 0} aralin ang natapos
          </Text>
        </View>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionTitle}>Mga Kategorya</Text>
            <Text style={styles.sectionHint}>Piliin ang gusto mong pag-aralan.</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {CATEGORIES.map((category) => {
            const active = category.key === selectedCategory;

            return (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                activeOpacity={0.86}
                style={[
                  styles.filter,
                  {
                    borderColor: active ? category.accent : '#E2E8F0',
                    backgroundColor: active ? category.soft : '#FFFFFF',
                  },
                ]}
              >
                <Text style={styles.filterIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? category.accent : '#64748B' },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.messageCard}>
            <Text style={styles.errorTitle}>Hindi makuha ang mga aralin</Text>
            <Text style={styles.error}>Hindi makuha ang mga aralin. Pakisubukan muli.</Text>

            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Subukan Muli</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!error && filteredLessons.length ? (
          filteredLessons.map((lesson) => {
            const meta = categoryMeta(lesson.subject);
            const game = gameQuestMeta(lesson.subject);
            const difficulty = lessonDifficulty(lesson, student);
            const stars = questStarCount(lesson);
            const percent = clampPercent(lesson.progressPercent);
            const locked = !lesson.unlocked;
            const completed = lesson.completed;
            const action = actionText(lesson);

            return (
              <TouchableOpacity
                key={lesson.id}
                disabled={locked}
                activeOpacity={0.88}
                onPress={() => openLesson(lesson)}
                style={[
                  styles.lessonCard,
                  completed && styles.lessonCardDone,
                  locked && styles.lockedCard,
                  { borderColor: completed ? '#86EFAC' : meta.soft },
                ]}
              >
                <View style={styles.lessonTop}>
                  <View
                    style={[
                      styles.thumbnail,
                      {
                        backgroundColor: meta.soft,
                        borderColor: meta.accent,
                      },
                    ]}
                  >
                    <Text style={styles.thumbnailIcon}>
                      {completed ? '✅' : meta.icon}
                    </Text>
                  </View>

                  <View style={styles.lessonTitleWrap}>
                    <View style={styles.lessonHeadingRow}>
                      <Text style={[styles.subject, { color: meta.accent }]}>
                        {meta.label}
                      </Text>

                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: completed
                              ? '#DCFCE7'
                              : locked
                                ? '#F1F5F9'
                                : difficulty.soft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: completed
                                ? '#166534'
                                : locked
                                  ? '#64748B'
                                  : difficulty.color,
                            },
                          ]}
                        >
                          {completed ? 'Tapos' : action}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.lessonTitle}>
                      {cleanStudentLessonTitle(
                        lesson.title ||
                        lesson.name ||
                        lesson.lessonTitle
                      )}
                    </Text>
                    <Text style={styles.lessonMeta}>
                      Baitang {lesson.gradeLevel || student.gradeLevel || '—'} • +{lesson.xpReward || 0} XP
                    </Text>
                  </View>
                </View>

                <View style={styles.questBox}>
                  <View style={styles.questTop}>
                    <Text style={styles.questTitle}>
                      {playful ? '🎮 ' : '📌 '}
                      {game.title}
                    </Text>

                    <View style={styles.starRow}>
                      {[0, 1, 2].map((index) => (
                        <Text
                          key={index}
                          style={[
                            styles.starIcon,
                            index >= stars && styles.starEmpty,
                          ]}
                        >
                          ⭐
                        </Text>
                      ))}
                    </View>
                  </View>

                  <Text style={styles.questHelp}>{game.mission}</Text>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>
                      {difficulty.icon} {difficulty.label}
                    </Text>
                  </View>

                  <View style={styles.infoChip}>
                    <Text style={styles.infoChipText}>
                      {percent}% tapos
                    </Text>
                  </View>
                </View>

                <Text style={styles.difficultyHelp}>{difficulty.helper}</Text>

                <View style={styles.lessonProgressRow}>
                  <Text style={styles.progressValue}>Progreso</Text>
                  <Text style={styles.progressValue}>{percent}%</Text>
                </View>

                <View style={styles.lessonTrack}>
                  <View
                    style={[
                      styles.lessonFill,
                      {
                        width: `${percent}%`,
                        backgroundColor: completed ? '#22C55E' : meta.accent,
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardBottom}>
                  <Text style={[styles.xpChip, { backgroundColor: meta.accent }]}>
                    +{lesson.xpReward || 0} XP
                  </Text>

                  <Text style={styles.openText}>
                    {locked ? '🔒 Hindi pa bukas' : `${action} →`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : null}

        {!error && !filteredLessons.length ? (
          <View style={styles.messageCard}>
            <Text style={styles.emptyTitle}>
              {selectedCategory === 'FINISHED'
                ? 'Wala pang tapos na aralin'
                : 'Wala pang aralin dito'}
            </Text>
            <Text style={styles.muted}>
              {selectedCategory === 'FINISHED'
                ? 'Ang mga matatapos mong aralin ay lalabas dito.'
                : 'Wala pang nailalathalang aralin sa kategoryang ito.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  screen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  page: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 100,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    padding: 24,
  },

  loadingText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },

  hero: {
    borderRadius: 28,
    padding: 14,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowColor: '#14532D',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },

  heroJunior: {
    backgroundColor: '#FFFFFF',
    borderColor: '#86EFAC',
  },

  heroSenior: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BFDBFE',
  },

  heroGlowOne: {
    position: 'absolute',
    top: -48,
    right: -38,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },

  heroGlowTwo: {
    position: 'absolute',
    bottom: -74,
    left: -46,
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  heroTextWrap: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  title: {
    color: '#0F172A',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },

  subtitle: {
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
    fontSize: 13,
    fontWeight: '800',
  },

  gradeBadge: {
    width: 72,
    minHeight: 72,
    borderRadius: 26,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  gradeBadgeIcon: {
    fontSize: 28,
  },

  gradeBadgeText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 13,
    marginTop: 2,
  },

  heroStats: {
    flexDirection: 'row',
    marginTop: 13,
  },

  heroStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },

  heroStatValue: {
    color: '#16A34A',
    fontSize: 22,
    fontWeight: '900',
  },

  heroStatLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
  },

  overallTrack: {
    height: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 14,
  },

  overallFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 99,
  },

  progressCount: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '800',
  },

  sectionRow: {
    marginBottom: 8,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },

  sectionHint: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },

  filters: {
    paddingVertical: 10,
    paddingRight: 16,
  },

  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
  },

  filterIcon: {
    fontSize: 15,
    marginRight: 6,
  },

  filterText: {
    fontWeight: '900',
    fontSize: 13,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16,
    minHeight: 190,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  lessonCardDone: {
    backgroundColor: '#F8FAFC',
  },

  lockedCard: {
    opacity: 0.55,
  },

  lessonTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },

  thumbnail: {
    width: 66,
    height: 66,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  thumbnailIcon: {
    fontSize: 33,
  },

  lessonTitleWrap: {
    flex: 1,
    minWidth: 0,
  },

  lessonHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
    marginBottom: 4,
  },

  subject: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginRight: 8,
  },
  lessonTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    flexShrink: 1,
  },
  lessonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: 8,
    columnGap: 8,
    marginTop: 12,
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexShrink: 0,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  questBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  questTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  questTitle: {
    flex: 1,
    minWidth: 0,
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 15,
    marginRight: 8,
  },

  questHelp: {
    color: '#64748B',
    marginTop: 7,
    lineHeight: 20,
    fontWeight: '800',
    fontSize: 13,
  },

  starRow: {
    flexDirection: 'row',
    flexShrink: 0,
  },

  starIcon: {
    fontSize: 16,
  },

  starEmpty: {
    opacity: 0.24,
  },

  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  infoChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  infoChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },

  difficultyHelp: {
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
    fontSize: 13,
    fontWeight: '800',
  },

  lessonProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  progressValue: {
    color: '#334155',
    fontWeight: '900',
    fontSize: 13,
  },

  lessonTrack: {
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8,
  },

  lessonFill: {
    height: '100%',
    borderRadius: 99,
  },

  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  xpChip: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
  },

  openText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  error: {
    color: '#B91C1C',
    lineHeight: 21,
    fontWeight: '700',
  },

  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16A34A',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 12,
  },

  retryText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 5,
  },

  muted: {
    color: '#64748B',
    lineHeight: 21,
    fontWeight: '800',
  },
});
