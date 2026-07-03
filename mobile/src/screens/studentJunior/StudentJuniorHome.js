import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import logo from '../../../assets/icons/tuklas-logo.png';

const HIDDEN_GROUP_STATUSES = new Set([
  'archived',
  'deleted',
  'inactive',
  'removed',
  'disabled',
]);

function isVisibleGroupRecord(item) {
  if (!item) return false;

  const status = String(
    item.status ||
    item.state ||
    item.visibility ||
    ''
  ).trim().toLowerCase();

  return !(
    HIDDEN_GROUP_STATUSES.has(status) ||
    item.deletedAt ||
    item.deleted_at ||
    item.archivedAt ||
    item.archived_at ||
    item.removedAt ||
    item.removed_at ||
    item.isDeleted ||
    item.deleted ||
    item.isArchived ||
    item.archived
  );
}

function getVisibleGroups(rawGroups = []) {
  return (Array.isArray(rawGroups) ? rawGroups : [])
    .filter(isVisibleGroupRecord)
    .map((group) => ({
      ...group,
      tasks: (Array.isArray(group.tasks) ? group.tasks : [])
        .filter(isVisibleGroupRecord),
    }));
}

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
  const groups = getVisibleGroups(dashboard?.groups || []);
  const badges = dashboard?.badges || [];
  const completedAralin = lessons.filter((lesson) => lesson?.completed).length;
  const totalAralin = lessons.length;
  const nextLesson = lessons.find((lesson) => !lesson?.completed) || lessons[0];
  const badgePreview = badges.slice(-2).reverse();
  const activeGroupTask = groups.flatMap((group) => group.tasks || []).find((task) => !task.completed) || groups.flatMap((group) => group.tasks || [])[0];

  const xp = student?.xp || 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const avatar = student?.avatar || '🧒';
  const name = student?.name || 'Student';
  const grade = student?.gradeLevel || 1;


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
        <View style={styles.brandCard}>
          <View style={styles.brandRow}>
            <Image
              source={logo}
              style={styles.brandLogo}
              resizeMode="contain"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.brandTitle}>
                Tuklas-Talino
              </Text>

              <Text style={styles.brandSubtitle}>
                Matuto ng Filipino habang naglalaro.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.header}>
        <View style={styles.userSection}>

          <View style={styles.avatarBubble}>
            <Text style={styles.avatarBubbleText}>
              {avatar}
            </Text>
          </View>

          <View>
            <Text style={styles.profileGreeting}>Magandang araw! 👋</Text>

            <Text style={styles.profileName}>
              {name}
            </Text>

            <Text style={styles.profileGrade}>
              Baitang {grade}
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
            <View style={styles.heroTextBlock}>
              <Text style={styles.greeting}>Ipagpatuloy ang iyong pag-aaral</Text>
              <Text style={styles.subtitle}>Tuloy lang sa iyong pag-aaral at kumita ng mas maraming XP!</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <View>
                <Text style={styles.xpLabel}>⭐ XP</Text>
                <Text style={styles.xpValue}>{xp}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Level {level}</Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  🔥 {student?.currentStreak || 0}
                </Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  🏅 {badges.length}
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((xp % 100), 100)}%` }]} />
            </View>
            <Text style={styles.progressInfo}>🌟 {100 - (xp % 100)} XP bago ang Level {level + 1}</Text>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalAralin}</Text>
              <Text style={styles.statLabel}>Aralin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completedAralin}</Text>
              <Text style={styles.statLabel}>Natapos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{badges.length}</Text>
              <Text style={styles.statLabel}>Mga Badge</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Iyong mga Aralin
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Aralin')}>
              <Text style={styles.sectionLink}>Tingnan lahat →</Text>
            </TouchableOpacity>
          </View>

          {nextLesson ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Aralin', {
                    screen: 'StudentJuniorLessonDetail',
                    params: {
                      lessonId: nextLesson.id,
                    },
                  })
                }
              >
                <View style={styles.lessonCard}>
                  <View style={styles.lessonCardContent}>
                    <View style={styles.lessonIconWrap}>
                      <Text style={styles.lessonIcon}>📚</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTag}>
                        {nextLesson.subject || 'Lesson'}
                      </Text>

                      <Text style={styles.cardTitle}>
                        {nextLesson.title}
                      </Text>

                      <Text style={styles.cardMeta}>
                        Baitang {nextLesson.gradeLevel || '—'}
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
                      Buksan ang aralin →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyTitle}>No active lessons</Text>
                <Text style={styles.emptyText}>
                  Explore the lesson library to start your next activity.
                </Text>
              </View>
            )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mga Badge</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Badge')}>
              <Text style={styles.sectionLink}>Tingnan lahat →</Text>
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
              Mga Gawain ng Grupo
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Groups')}>
              <Text style={styles.sectionLink}>Buksan →</Text>
            </TouchableOpacity>
          </View>

          {activeGroupTask ? (
            <Card style={styles.taskCard}>
              <Text style={styles.taskTitle}>{activeGroupTask.title}</Text>
              <Text style={styles.taskMeta}>{activeGroupTask.description || 'May nakahandang gawain para sa inyong grupo.'}</Text>
              <Text style={styles.taskXp}>+{activeGroupTask.xpReward || 0} XP</Text>
            </Card>
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
    backgroundColor: '#ECFDF5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    paddingTop: 16,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 44,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
  },

  brandCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 28,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandLogo: {
    width: 56,
    height: 56,
    marginRight: 14,
  },

  brandTitle: {
    fontSize: 22,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
  },

  brandSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },

  profileGreeting: {
    color: '#16A34A',
    fontSize: 12,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 2,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarBubble: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  avatarBubbleText: {
    fontSize: 24,
  },

  profileName: {
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
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
    paddingVertical: 6,
    marginLeft: 8,
  },

  smallChipText: {
    color: '#166534',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 12,
  },

  heroCard: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  heroTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#334155',
    lineHeight: 22,
    fontFamily: 'Nunito_700Bold',
    width: '100%',
    flexShrink: 1,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  avatar: {
    fontSize: 28,
  },
  xpCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  xpLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Fredoka_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpValue: {
    fontSize: 28,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  levelText: {
    color: '#166534',
    fontSize: 12,
    fontFamily: 'Fredoka_600SemiBold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 999,
  },
  progressInfo: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 12,
    fontFamily: 'Nunito_700Bold',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  statValue: {
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
  },
  statLabel: {
    marginTop: 6,
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
  },
  section: {
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 21,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
  },
  sectionLink: {
    color: '#16A34A',
    fontSize: 13,
    fontFamily: 'Fredoka_600SemiBold',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  cardTag: {
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardMeta: {
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
  },
  cardAction: {
    marginTop: 14,
    alignSelf: 'flex-start',
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyStateSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginTop: 8,
  },

  badgeCard: {

    width: '48%',

    backgroundColor: '#F8FAFC',

    borderRadius: 26,

    paddingVertical: 18,

    paddingHorizontal: 12,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#BBF7D0',

    shadowColor: '#14532D',

    shadowOpacity: 0.06,

    shadowRadius: 12,

    shadowOffset: { width: 0, height: 6 },

    elevation: 3,

    minHeight: 170,

  },
  badgeIcon: {
    fontSize: 42,
    backgroundColor: '#ECFDF5',
    width: 64,
    height: 64,
    borderRadius: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 12,
  },
  badgeMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 6,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  taskTitle: {
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  taskMeta: {
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 10,
  },
  taskXp: {
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
  },

  lessonCardContent: {

    flexDirection: 'row',

    alignItems: 'flex-start',

  },

  lessonIconWrap: {

    width: 60,

    height: 60,

    borderRadius: 20,

    backgroundColor: '#DCFCE7',

    justifyContent: 'center',

    alignItems: 'center',

    marginRight: 14,

    borderWidth: 1,

    borderColor: '#BBF7D0',

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
    fontFamily: 'Fredoka_600SemiBold',
  },

  continueButton: {

    marginTop: 18,

    backgroundColor: '#16A34A',

    borderRadius: 18,

    paddingVertical: 10,

    alignItems: 'center',

    shadowColor: '#15803D',

    shadowOpacity: 0.18,

    shadowRadius: 8,

    shadowOffset: { width: 0, height: 5 },

    elevation: 3,

  },

  continueButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_600SemiBold',
  },

});
