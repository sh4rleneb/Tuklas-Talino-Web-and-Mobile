import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

export default function StudentJuniorHome({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/dashboard');
      setDashboard(data);
    } catch (error) {
      console.warn('Dashboard load failed', error);
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
  const lessons = dashboard?.lessons || [];
  const groups = dashboard?.groups || [];
  const badges = dashboard?.badges || [];
  const completedLessons = lessons.filter((lesson) => lesson?.completed).length;
  const totalLessons = lessons.length;
  const completionPct = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const nextLesson = lessons.find((lesson) => !lesson?.completed) || lessons[0];
  const badgePreview = badges.slice(-2).reverse();
  const activeGroupTask = groups[0]?.tasks?.find((task) => !task.completed) || groups[0]?.tasks?.[0];

  const xp = student?.xp || 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const avatar = student?.avatar || '🧒';
  const name = student?.name || 'Student';
  const grade = student?.gradeLevel || 1;

  const showProgress = completionPct > 0;

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loaderText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
        <View style={styles.userSection}>

          <View style={styles.avatarBubble}>
            <Text style={styles.avatarBubbleText}>
              {avatar}
            </Text>
          </View>

          <View>
            <Text style={styles.profileName}>
              {name}
            </Text>

            <Text style={styles.profileGrade}>
              Grade {grade}
            </Text>
          </View>

        </View>

        <View style={styles.rightSection}>

          <View style={styles.smallChip}>
            <Text style={styles.smallChipText}>
              ⚡ {xp}
            </Text>
          </View>

          <View style={styles.smallChip}>
            <Text style={styles.smallChipText}>
              ⭐ Lv {level}
            </Text>
          </View>

        </View>

      </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.greeting}>Hi {name}! 👋</Text>
              <Text style={styles.subtitle}>Ready ka na ba sa learning adventure today?</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatar}>{avatar}</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <View>
                <Text style={styles.xpLabel}>XP points</Text>
                <Text style={styles.xpValue}>{xp} XP</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Level {level}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((xp % 100), 100)}%` }]} />
            </View>
            <Text style={styles.progressInfo}>{100 - (xp % 100)} XP until next level</Text>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalLessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completedLessons}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completionPct}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Your Lessons
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Lessons')}>
              <Text style={styles.sectionLink}>All lessons →</Text>
            </TouchableOpacity>
          </View>

          {nextLesson ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate(
                'Lessons',
                {
                  screen: 'StudentJuniorLessonDetail',
                  params: {
                    lessonId: nextLesson.id
                  }
                }
              )}
            >
              <View style={styles.lessonCardContent}>
              <View style={styles.lessonIconWrap}>
                <Text style={styles.lessonIcon}>
                  📚
                </Text>
              </View>

              <View style={{ flex: 1 }}>

                <Text style={styles.cardTag}>
                  {nextLesson.subject || 'Lesson'}
                </Text>

                <Text style={styles.cardTitle}>
                  {nextLesson.title}
                </Text>

                <Text style={styles.cardMeta}>
                  Grade {nextLesson.gradeLevel || '—'}
                </Text>

              </View>

              <View style={styles.lessonXpBadge}>
                <Text style={styles.lessonXpText}>
                  +{nextLesson.xpReward || 0} XP
                </Text>
              </View>

            </View>

            <View style={styles.continueButton}>
              <Text style={styles.continueButtonText}>
                Continue →
              </Text>
            </View>
            </TouchableOpacity>

          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📚</Text>
              <Text style={styles.emptyTitle}>No active lessons</Text>
              <Text style={styles.emptyText}>Explore the lesson library to start your next activity.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Badges')}>
              <Text style={styles.sectionLink}>View all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            {badgePreview.length ? (
              badgePreview.map((badge) => (
                <View key={badge.id || badge.name} style={styles.badgeCard}>
                  <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeMeta}>{badge.description || 'Earned from a completed activity'}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>No badges yet</Text>
                <Text style={styles.emptyText}>Complete lessons or missions to earn badges.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Your Group Tasks
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
              <Text style={styles.sectionLink}>Open groups →</Text>
            </TouchableOpacity>
          </View>

          {activeGroupTask ? (
            <View style={styles.taskCard}>
              <Text style={styles.taskTitle}>{activeGroupTask.title}</Text>
              <Text style={styles.taskMeta}>{activeGroupTask.description || 'Group activity available'}</Text>
              <Text style={styles.taskXp}>+{activeGroupTask.xpReward || 0} XP</Text>
            </View>
          ) : (
            <View style={styles.emptyStateSmall}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>No group task yet</Text>
              <Text style={styles.emptyText}>Great job! Check back later for group activities.</Text>
            </View>
          )}
          
        </View>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4FFF5',
    paddingTop: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarBubbleText: {
    fontSize: 26,
  },

  profileName: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },

  profileGrade: {
    color: '#64748B',
    marginTop: 2,
  },

  rightSection: {
    flexDirection: 'row',
  },

  smallChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },

  smallChipText: {
    color: '#166534',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginTop: 12,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontFamily: 'Poppins_500Medium',
    maxWidth: '75%',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 28,
  },
  xpCard: {
    marginTop: 22,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpValue: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
    marginTop: 6,
  },
  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  levelText: {
    color: '#166534',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressInfo: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F7FEF7',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
  },
  statLabel: {
    marginTop: 6,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  sectionLink: {
    color: '#16A34A',
    fontFamily: 'Poppins_700Bold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTag: {
    color: '#16A34A',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardMeta: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
  },
  cardAction: {
    marginTop: 14,
    alignSelf: 'flex-start',
    color: '#16A34A',
    fontFamily: 'Poppins_700Bold',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyStateSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  badgeCard: {
    flex: 1,
    backgroundColor: '#F9FEF4',
    borderRadius: 18,
    padding: 14,
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 22,
    marginBottom: 10,
  },
  badgeName: {
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    marginBottom: 6,
  },
  badgeMeta: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
    marginBottom: 8,
  },
  taskMeta: {
    color: '#64748B',
    fontFamily: 'Poppins_500Medium',
    marginBottom: 10,
  },
  taskXp: {
    color: '#16A34A',
    fontFamily: 'Poppins_700Bold',
  },

  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  lessonIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  lessonIcon: {
    fontSize: 28,
  },

  lessonXpBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  lessonXpText: {
    color: '#166534',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },

  continueButton: {
    marginTop: 16,
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  
});
