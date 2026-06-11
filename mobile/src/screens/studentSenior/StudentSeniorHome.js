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
} from 'react-native';

import { SafeAreaView }
from 'react-native-safe-area-context';

export default function StudentSeniorHome({
  navigation,
}) {

  const [showMore, setShowMore] =
    useState(false);

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

              <Text style={styles.logo}>
                🏡 Tuklas Talino
              </Text>
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

                <View style={styles.avatarCircle}>

                  <Text style={styles.avatar}>
                    {avatar}
                  </Text>

                </View>

                <View style={{ flex: 1 }}>

                  <Text style={styles.heroTitle}>
                    Hi {name}!
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    Ready ka na ba sa
                    learning adventure
                    today?
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
                            homeRoute: 'StudentSeniorHome',
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

        {/* BOTTOM NAV */}

        <View style={styles.bottomNav}>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.activeNavButton,
            ]}
          >

            <Text style={styles.navIcon}>
              🏠
            </Text>

            <Text
              style={styles.activeNavText}
            >
              Home
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              navigation.navigate(
                'StudentSeniorLessons'
              )
            }
          >

            <Text style={styles.navIcon}>
              📚
            </Text>

            <Text style={styles.navText}>
              Lessons
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              navigation.navigate(
                'QuizScreen'
              )
            }
          >

            <Text style={styles.navIcon}>
              🧠
            </Text>

            <Text style={styles.navText}>
              Quizzes
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              navigation.navigate(
                'MissionScreen'
              )
            }
          >

            <Text style={styles.navIcon}>
              🎮
            </Text>

            <Text style={styles.navText}>
              Missions
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              setShowMore(!showMore)
            }
          >
            <Text style={styles.navIcon}>
              ⋯
            </Text>

            <Text style={styles.navText}>
              More
            </Text>
          </TouchableOpacity>

        </View>

          {showMore && (
  <>

    <TouchableOpacity
      style={styles.moreOverlay}
      activeOpacity={1}
      onPress={() =>
        setShowMore(false)
      }
    />

    <View style={styles.moreMenu}>

      <TouchableOpacity
        style={styles.moreItem}
        onPress={() => {
          setShowMore(false);
          navigation.navigate(
            'GroupsScreen'
          );
        }}
      >
        <Text style={styles.moreText}>
          👥 Groups
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moreItem}
        onPress={() => {
          setShowMore(false);
          navigation.navigate(
            'BadgesScreen'
          );
        }}
      >
        <Text style={styles.moreText}>
          🏅 Badges
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moreItem}
        onPress={() => {
          setShowMore(false);
          navigation.navigate(
            'NotificationsScreen'
          );
        }}
      >
        <Text style={styles.moreText}>
          🔔 Notifications
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.moreItem}
        onPress={() => {
          setShowMore(false);
          navigation.navigate(
            'ProfileScreen'
          );
        }}
      >
        <Text style={styles.moreText}>
          👤 Profile
        </Text>
      </TouchableOpacity>
</View>

  </>
)}

      </View>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },

  loadState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
    fontFamily: 'Poppins_700Bold',
  },

  wrapper: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },

  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },

  contentWrapper: {
    backgroundColor: '#F6FFF5',

    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,

    paddingTop: 14,

    paddingHorizontal: 16,

    paddingBottom: 30,

    minHeight: '100%',
  },

    header: {
    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    padding: 18,

    marginBottom: 20,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 4,
  },

  headerTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

    profileChip: {
    marginTop: 10,

    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#ECFDF5',

    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: '#D1FAE5',
  },

  profileEmoji: {
    fontSize: 18,
    marginRight: 6,
  },

  profileText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },

  logo: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#22C55E',
  },

  studentInfo: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
  },
heroCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 18,
    borderRadius: 26,
    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 3,
  },

  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarCircle: {
    width: 72,
    height: 72,

    borderRadius: 100,

    backgroundColor: '#ECFDF5',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  avatar: {
    fontSize: 38,
  },

  heroTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#22C55E',
  },

  heroSubtitle: {
    fontSize: 15,
    color: '#334155',
    marginTop: 6,
    lineHeight: 24,
    fontFamily: 'Poppins_500Medium',
  },

  xpCard: {
    backgroundColor: '#F8FAFC',
    marginTop: 22,
    borderRadius: 22,
    padding: 18,
  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  xpLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#64748B',
  },

  xpValue: {
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#22C55E',
    marginTop: 4,
  },

  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },

  levelText: {
    color: '#166534',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },

  progressBg: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 30,
    marginTop: 18,
    overflow: 'hidden',
  },

  progressFill: {
    width: '42%',
    height: '100%',
    backgroundColor: '#22C55E',
  },

  xpSub: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
  },

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  quickCard: {
    backgroundColor: '#FFFFFF',
    width: '31%',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,

    elevation: 2,
  },

  quickValue: {
    fontSize: 26,
    color: '#22C55E',
    fontFamily: 'Poppins_800ExtraBold',
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_600SemiBold',
  },

  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    borderRadius: 26,
    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,

    elevation: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },

  allLessons: {
    color: '#22C55E',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },

  lessonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  lessonCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 18,
    width: '48%',
  },

  lessonEmoji: {
    fontSize: 38,
  },

  lessonTag: {
    color: '#22C55E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 10,
    fontSize: 12,
  },

  lessonTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    marginTop: 8,
    lineHeight: 26,
  },

  startBtn: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    alignSelf: 'flex-start',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 16,
  },

  startText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },

  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  badgeUnlocked: {
    width: '48%',
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
  },

  badgeLocked: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,

    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  badgeEmoji: {
    fontSize: 32,
  },

  badgeText: {
    marginTop: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#166534',
    textAlign: 'center',
    fontSize: 14,
  },

  badgeLockedText: {
    marginTop: 10,
    color: '#94A3B8',
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },

  emptyText: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    marginTop: 16,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: '#0F9D58',

    flexDirection: 'row',
    justifyContent: 'space-evenly',

    alignItems: 'center',

    paddingVertical: 12,
    paddingHorizontal: 8,

    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',

    elevation: 10,
  },

  navButton: {
    alignItems: 'center',
    justifyContent: 'center',

    minWidth: 52,

    paddingVertical: 8,

    borderRadius: 18,
  },

  activeNavButton: {
    backgroundColor: '#FEF3C7',

    borderWidth: 2,
    borderColor: '#FCD34D',

    paddingHorizontal: 12,
  },

  navIcon: {
    fontSize: 20,
  },

  navText: {
    marginTop: 2,
    color: '#E5E7EB',
    fontSize: 9,
    fontFamily: 'Poppins_600SemiBold',
  },

  activeNavText: {
    marginTop: 2,
    color: '#166534',
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
  },

    moreMenu: {
    position: 'absolute',

    right: 20,
    bottom: 95,

     zIndex: 999,

    backgroundColor: '#FFFFFF',

    borderRadius: 20,

    width: 180,

    paddingVertical: 10,

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 8,
  },

  moreOverlay: {
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 998,
  },

  moreItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  moreText: {
    fontSize: 15,

    color: '#0F172A',

    fontFamily:
      'Poppins_600SemiBold',
  },

});
