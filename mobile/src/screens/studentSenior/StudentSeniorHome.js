import React, {
  useState,
  useCallback,
} from 'react';

import {
  useFocusEffect,
} from '@react-navigation/native';

import { api } from '../../api/client';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';

import { SafeAreaView }
from 'react-native-safe-area-context';

export default function StudentSeniorHome({
  navigation,
}) {


  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const load =
    useCallback(
      async () => {
        setLoading(true);
        setError('');
        try {
          setDashboard(await api('/dashboard'));
        } catch (err) {
          setError(err.message || 'Unable to load your dashboard.');
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadState}>
          {loading ? <ActivityIndicator size="large" color="#22C55E" /> : null}
          <Text style={error ? styles.loadError : styles.loadText}>
            {error || 'Loading your dashboard...'}
          </Text>
          {error ? (
            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

    const student =
      dashboard.student;

    const avatar =
      student?.avatar || '🧒';

    const name =
      student?.name || 'Student';

    const grade =
      student?.gradeLevel || 1;

    const section =
      student?.section || '';

    const xp =
      student?.xp || 0;

    const level =
      Math.max(
        1,
        Math.floor(xp / 100) + 1
      );

    const lessons =
      dashboard.lessons || [];

    const badges =
      dashboard.badges || [];

    const allBadges =
      dashboard.allBadges || [];

    const earnedBadgeIds =
      new Set(badges.map((badge) => badge.id));

    const featuredLessons =
      lessons.slice(0, 4);

    const lessonColors = [
      '#EEF4FF',
      '#FFF0F7',
      '#F3F0FF',
      '#FEF3C7',
    ];

    const lessonIcons = [
      '📖',
      '🎧',
      '🔤',
      '📜',
    ];

  return (

    <SafeAreaView style={styles.safe}>

      <View style={styles.wrapper}>

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 120,
          }}
        >

          <View style={styles.contentWrapper}>

            {/* HEADER */}

            <View style={styles.header}>

            <View style={styles.headerTop}>

              <View style={styles.brandLogoRow}>
                  <Image
                    source={require('../../../assets/icons/tuklas-logo.png')}
                    style={styles.brandLogoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.logo}>
                    Tuklas Talino
                  </Text>
                </View>
</View>

            <TouchableOpacity
              style={styles.profileChip}
              onPress={() =>
                navigation.navigate('ProfileScreen')
              }
              activeOpacity={0.8}
            >

              <Text style={styles.profileEmoji}>
                {avatar}
              </Text>

              <Text style={styles.profileText}>
                {name} • Grade {grade}
              </Text>

            </TouchableOpacity>

          </View>

            {/* HERO */}

            <View style={styles.heroCard}>

              <View style={styles.heroTop}>

                <View style={styles.heroTextBlock}>

                  <Text style={styles.heroTitle}>
                    Hi {name}!
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    Ready ka na ba sa learning adventure today?
                  </Text>

                </View>

              </View>

              {/* XP */}

              <View style={styles.xpCard}>

                <View style={styles.xpHeader}>

                  <View>

                    <Text style={styles.xpLabel}>
                      XP Points
                    </Text>

                    <Text style={styles.xpValue}>
                      {xp} XP
                    </Text>

                  </View>

                  <View style={styles.levelBadge}>

                    <Text style={styles.levelText}>
                      Level {level}
                    </Text>

                  </View>


                </View>

                <View style={styles.progressBg}>

                  <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        5,
                        xp % 100
                      )}%`,
                    },
                  ]}
                />

                </View>

                <Text style={styles.xpSub}>
                  {100 - (xp % 100)} XP pa bago ang next level.
                </Text>

              
</View>

            <View style={styles.achievementRow}>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🔥 {student?.currentStreak || 0}</Text>
                <Text style={styles.achievementLabel}>Current Streak</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🏆 {student?.longestStreak || 0}</Text>
                <Text style={styles.achievementLabel}>Best Streak</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🏅 {badges.length}</Text>
                <Text style={styles.achievementLabel}>Badges</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>⭐ {level}</Text>
                <Text style={styles.achievementLabel}>Level</Text>
              </View>

            </View>

          </View>

            {/* QUICK STATS */}

            <View style={styles.quickStats}>

              <View style={styles.quickCard}>

                <Text
                  style={styles.quickValue}
                >
                  {lessons.length}
                </Text>

                <Text
                  style={styles.quickLabel}
                >
                  Lessons
                </Text>

              </View>

              <View style={styles.quickCard}>

                <Text style={styles.quickValue}>
                  {xp}
                </Text>

                <Text
                  style={styles.quickLabel}
                >
                  XP
                </Text>

              </View>

              <View style={styles.quickCard}>

                <Text
                  style={styles.quickValue}
                >
                  {badges.length}
                </Text>

                <Text
                  style={styles.quickLabel}
                >
                  Badges
                </Text>

              </View>

            </View>

            {/* LESSONS */}

            <View style={styles.section}>

              <View
                style={styles.sectionHeader}
              >

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Your Lessons
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      'StudentSeniorLessons'
                    )
                  }
                >
                  <Text
                    style={styles.allLessons}
                  >
                    All Lessons →
                  </Text>
                </TouchableOpacity>

              </View>

              <View
                style={styles.lessonGrid}
              >

                {featuredLessons.map((lesson, index) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.lessonCard,
                      {
                        backgroundColor:
                          lessonColors[index % lessonColors.length],
                      },
                    ]}
                      onPress={() =>
                        navigation.navigate(
                          'StudentJuniorLessonDetail',
                          {
                            lessonId: lesson.id,
                            homeRoute: 'StudentSeniorTabs',
                          }
                        )
                      }
                  >
                    <Text style={styles.lessonEmoji}>
                      {lessonIcons[index % lessonIcons.length]}
                    </Text>

                    <Text style={styles.lessonTag}>
                      {lesson.subject}
                    </Text>

                    <Text style={styles.lessonTitle}>
                      {lesson.title}
                    </Text>

                    <View style={styles.startBtn}>
                      <Text style={styles.startText}>
                        {lesson.completed ? 'Review' : 'Start'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

              </View>

              {!featuredLessons.length && (
                <Text style={styles.emptyText}>
                  No published lessons are available for your grade yet.
                </Text>
              )}

            </View>

            {/* BADGES */}

            <View style={styles.section}>

              <Text style={styles.sectionTitle}>
                Badges
              </Text>

              <View style={styles.badgeRow}>

                {allBadges.slice(0, 4).map((badge) => {
                  const unlocked =
                    earnedBadgeIds.has(badge.id);

                  return (
                    <View
                      key={badge.id}
                      style={
                        unlocked
                          ? styles.badgeUnlocked
                          : styles.badgeLocked
                      }
                    >
                      <Text style={styles.badgeEmoji}>
                        {unlocked ? badge.icon : '🔒'}
                      </Text>

                      <Text
                        style={
                          unlocked
                            ? styles.badgeText
                            : styles.badgeLockedText
                        }
                      >
                        {badge.name}
                      </Text>
                    </View>
                  );
                })}

              </View>

              {!allBadges.length && (
                <Text style={styles.emptyText}>
                  Badge progress will appear after you start learning.
                </Text>
              )}

            </View>

          </View>

        </ScrollView>


        </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  loadState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ECFDF5',
  },

  loadText: {
    color: '#64748B',
    marginTop: 12,
  },

  loadError: {
    color: '#B91C1C',
    marginTop: 12,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 14,
  },

  retryText: {
    color: '#FFF',
    fontFamily: 'Fredoka_600SemiBold',
  },

  wrapper: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  contentWrapper: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 32,
  },

    header: {

      backgroundColor: '#FFFFFF',

      borderRadius: 28,

      padding: 16,

      borderWidth: 1,

      borderColor: '#DCFCE7',

      shadowColor: '#14532D',

      shadowOpacity: 0.08,

      shadowRadius: 16,

      shadowOffset: { width: 0, height: 8 },

      elevation: 4,

    },

  headerTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

    profileChip: {

      marginTop: 12,

      flexDirection: 'row',

      alignItems: 'center',

      alignSelf: 'flex-start',

      backgroundColor: '#ECFDF5',

      borderRadius: 999,

      paddingVertical: 8,

      paddingHorizontal: 12,

      borderWidth: 1,

      borderColor: '#BBF7D0',

    },

  profileEmoji: {
    fontSize: 18,
    marginRight: 6,
  },

  profileText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
  },

  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandLogoImage: {
    width: 44,
    height: 44,
    marginRight: 10,
  },

  logo: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#22C55E',
  },

  studentInfo: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Nunito_800ExtraBold',
  },
heroCard: {
  marginTop: 18,
  backgroundColor: '#FFFFFF',
  borderRadius: 32,
  padding: 20,
  borderWidth: 1,
  borderColor: '#DCFCE7',
  shadowColor: '#14532D',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 5,
},

  heroTop: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    width: '100%',

  },

  heroTextBlock: {

    flex: 1,

    minWidth: 0,

  },

  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 26,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  avatar: {
    fontSize: 38,
  },

  heroTitle: {
    fontSize: 30,
    fontFamily: 'Fredoka_700Bold',
    color: '#15803D',
    lineHeight: 36,
  },

  heroSubtitle: {

    fontSize: 15,

    color: '#334155',

    marginTop: 6,

    lineHeight: 23,

    fontFamily: 'Nunito_700Bold',

    width: '100%',

    flexShrink: 1,

  },

  xpCard: {
    backgroundColor: '#F8FAFC',
    marginTop: 20,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  xpLabel: {
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#64748B',
  },

  xpValue: {
    fontSize: 32,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
    marginTop: 4,
  },

  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },


  levelText: {
    color: '#166534',
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
  },

  progressBg: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },

  progressFill: {
    width: '42%',
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 999,
  },

  xpSub: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
  },


  achievementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    rowGap: 10,
  },

  achievementCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 22,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  achievementValue: {
    fontSize: 18,
    fontFamily: 'Fredoka_700Bold',
    color: '#22C55E',
  },

  achievementLabel: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    color: '#64748B',
    fontFamily: 'Nunito_800ExtraBold',
  },

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  quickValue: {
    fontSize: 26,
    color: '#22C55E',
    fontFamily: 'Fredoka_700Bold',
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Nunito_800ExtraBold',
  },

  section: {
    marginTop: 26,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },

  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
  },

  allLessons: {
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
  },

  lessonGrid: {
    flexDirection: 'column',
    marginTop: 2,
  },

  lessonCard: {
    marginTop: 14,
    borderRadius: 26,
    padding: 20,
    width: '100%',
    minHeight: 176,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  lessonEmoji: {
    fontSize: 36,
  },

  lessonTag: {
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
    marginTop: 12,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  lessonTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginTop: 8,
    lineHeight: 28,
  },

  startBtn: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 16,
    shadowColor: '#15803D',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  startText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    rowGap: 12,
  },

  badgeUnlocked: {
    width: '48%',
    backgroundColor: '#ECFDF5',
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  badgeLocked: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  badgeEmoji: {
    fontSize: 32,
  },

  badgeText: {
    marginTop: 10,
    fontFamily: 'Fredoka_600SemiBold',
    color: '#166534',
    textAlign: 'center',
    fontSize: 14,
  },

  badgeLockedText: {
    marginTop: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
  },

  emptyText: {
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
    marginTop: 16,
  },







});
