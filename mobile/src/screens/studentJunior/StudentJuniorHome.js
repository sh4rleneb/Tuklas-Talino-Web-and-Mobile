import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import { logout } from '../../api/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

const quickNavItems = [
  { icon: '📘', label: 'Lessons', screen: 'StudentJuniorLessons' },
  { icon: '🧠', label: 'Quizzes', screen: 'QuizScreen' },
  { icon: '🎮', label: 'Missions', screen: 'MissionScreen' },
  { icon: '👥', label: 'Groups', screen: 'GroupsScreen' },
  { icon: '🏅', label: 'Badges', screen: 'BadgesScreen' },
  { icon: '🔔', label: 'Updates', screen: 'NotificationsScreen' },
];

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

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

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
          <View>
            <Text style={styles.logo}>Tuklas Talino</Text>
            <Text style={styles.profileText}>{name} • Grade {grade}</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.profileChip} onPress={() => navigation.navigate('ProfileScreen')}>
              <Text style={styles.profileEmoji}>{avatar}</Text>
              <Text style={styles.profileChipText}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
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

        <View style={styles.navigationCard}>
          {quickNavItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.navTile}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.navTileIcon}>{item.icon}</Text>
              <Text style={styles.navTileText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continue learning</Text>
            <TouchableOpacity onPress={() => navigation.navigate('StudentJuniorLessons')}>
              <Text style={styles.sectionLink}>All lessons →</Text>
            </TouchableOpacity>
          </View>

          {nextLesson ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('StudentJuniorLessonDetail', { lessonId: nextLesson.id })}
            >
              <View>
                <Text style={styles.cardTag}>{nextLesson.subject || 'Lesson'}</Text>
                <Text style={styles.cardTitle}>{nextLesson.title}</Text>
                <Text style={styles.cardMeta}>Grade {nextLesson.gradeLevel || '—'} • +{nextLesson.xpReward || 0} XP</Text>
              </View>
              <Text style={styles.cardAction}>▶ Continue</Text>
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
            <TouchableOpacity onPress={() => navigation.navigate('BadgesScreen')}>
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
            <Text style={styles.sectionTitle}>Group task</Text>
            <TouchableOpacity onPress={() => navigation.navigate('GroupsScreen')}>
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

      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navButton, styles.navButtonActive]}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('StudentJuniorLessons')}>
          <Text style={styles.navIcon}>📚</Text>
          <Text style={styles.navLabel}>Lessons</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MissionScreen')}>
          <Text style={styles.navIcon}>🎮</Text>
          <Text style={styles.navLabel}>Missions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('GroupsScreen')}>
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('BadgesScreen')}>
          <Text style={styles.navIcon}>🏅</Text>
          <Text style={styles.navLabel}>Badges</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 18,
  },
  contentContainer: {
    paddingBottom: 120,
    paddingTop: 12,
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
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
  },
  profileText: {
    marginTop: 8,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  profileChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  profileChipText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#0F172A',
  },
  logoutButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#166534',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    marginTop: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontFamily: 'Poppins_500Medium',
    maxWidth: '75%',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 36,
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
    fontSize: 32,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
    marginTop: 6,
  },
  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 18,
    paddingVertical: 10,
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
    borderRadius: 24,
    padding: 16,
    marginRight: 10,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#16A34A',
  },
  statLabel: {
    marginTop: 6,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },
  navigationCard: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  navTileIcon: {
    fontSize: 28,
    marginBottom: 12,
  },
  navTileText: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#0F172A',
    textAlign: 'center',
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
    fontSize: 24,
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
    borderRadius: 24,
    padding: 18,
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 28,
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
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F9D58',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 12,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navButtonActive: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    marginHorizontal: 4,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#E5E7EB',
    fontFamily: 'Poppins_600SemiBold',
  },
  navLabelActive: {
    marginTop: 4,
    fontSize: 11,
    color: '#166534',
    fontFamily: 'Poppins_700Bold',
  },
});
