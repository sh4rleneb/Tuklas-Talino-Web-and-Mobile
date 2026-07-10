import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../api/client';
import Card from '../../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import logo from '../../../assets/icons/tuklas-logo.png';

const HOME_BADGE_IMAGES = {
  'batang-mambabasa': require('../../../assets/badges/batang-mambabasa.png'),
  'bituin-ng-kasipagan': require('../../../assets/badges/bituin-ng-kasipagan.png'),
  'bituin-sa-pagsagot': require('../../../assets/badges/bituin-sa-pagsagot.png'),
  'boses-bituin': require('../../../assets/badges/boses-bituin.png'),
  'henyo-sa-pagsusulit': require('../../../assets/badges/henyo-sa-pagsusulit.png'),
  'kaagapay-sa-gawain': require('../../../assets/badges/kaagapay-sa-gawain.png'),
  'tuklas-kampeon': require('../../../assets/badges/tuklas-kampeon.png'),
  'unang-hakbang': require('../../../assets/badges/unang-hakbang.png'),
};

function normalizeHomeBadgeSlug(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getHomeBadgeImageSource(badge = {}) {
  const candidates = [
    badge.slug,
    badge.code,
    badge.key,
    badge.name,
    badge.title,
    badge.badge?.slug,
    badge.badge?.code,
    badge.badge?.name,
    badge.badge?.title,
  ].map(normalizeHomeBadgeSlug).filter(Boolean);

  for (const slug of candidates) {
    if (HOME_BADGE_IMAGES[slug]) return HOME_BADGE_IMAGES[slug];
  }

  return HOME_BADGE_IMAGES['unang-hakbang'];
}


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


function localizeBadgeDescription(description) {
  const value = description || 'Nakuha sa matagumpay na pagtatapos ng isang gawain.';

  return String(value)
    .replace(/\blessons\b/gi, 'mga aralin')
    .replace(/\blesson\b/gi, 'aralin');
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
      console.warn('Hindi na-load ang dashboard', error);
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
  const completedLesson = lessons.filter((lesson) => lesson?.completed).length;
  const totalLesson = lessons.length;
  const nextLesson = lessons.find((lesson) => !lesson?.completed) || lessons[0];
  const getBadgeKey = (badge) =>
    String(
      badge.name ||
      badge.title ||
      badge.badgeName ||
      badge.badgeId ||
      badge.id ||
      ''
    )
      .trim()
      .toLowerCase();

  const uniqueBadges = badges.filter((badge, index, list) => {
    const badgeKey = getBadgeKey(badge);

    return (
      badgeKey &&
      index === list.findIndex((item) => getBadgeKey(item) === badgeKey)
    );
  });

  const badgePreview = [...uniqueBadges].slice(-2).reverse();
  const activeGroupTask = groups.flatMap((group) => group.tasks || []).find((task) => !task.completed) || groups.flatMap((group) => group.tasks || [])[0];

  const xp = student?.xp || 0;
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const avatar = student?.avatar || '🧒';
  const name = student?.name || 'Mag-aaral';
  const grade = student?.gradeLevel || 1;


  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loaderText}>Inihahanda ang iyong pangunahing pahina...</Text>
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
                Magbasa, matuto, at magsaya!
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
            <Text style={styles.profileGreeting}>Kumusta, batang talino! 👋</Text>

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
              ⭐ Antas {level}
            </Text>
          </View>

        </View>

      </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTextBlock}>
              <Text style={styles.greeting}>Tara, mag-aral tayo! 🌈</Text>
              <Text style={styles.subtitle}>Pumili ng aralin, sumagot, at mangolekta ng XP!</Text>
            </View>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpRow}>
              <View>
                <Text style={styles.xpLabel}>⭐ XP</Text>
                <Text style={styles.xpValue}>{xp}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Antas {level}</Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  🔥 {student?.currentStreak || 0}
                </Text>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>
                  🏅 {uniqueBadges.length}
                </Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((xp % 100), 100)}%` }]} />
            </View>
            <Text style={styles.progressInfo}>🌟 {100 - (xp % 100)} XP bago ang Antas {level + 1}</Text>
          </View>

          <View style={styles.quickStatsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>📚 {totalLesson}</Text>
              <Text style={styles.statLabel}>Aralin</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>✅ {completedLesson}</Text>
              <Text style={styles.statLabel}>Natapos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>🏅 {uniqueBadges.length}</Text>
              <Text style={styles.statLabel}>Mga Gantimpala</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Mga Aralin Mo
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Mga Aralin')}>
              <Text style={styles.sectionLink}>Tingnan Lahat →</Text>
            </TouchableOpacity>
          </View>

          {nextLesson ? (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Mga Aralin', {
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
                        {nextLesson.subject || 'Aralin'}
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
                      Simulan ang aralin →
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyTitle}>Wala pang aktibong aralin</Text>
                <Text style={styles.emptyText}>
                  Pumili ng aralin para magsimula.
                </Text>
              </View>
            )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mga Gantimpala</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Mga Gantimpala')}>
              <Text style={styles.sectionLink}>Tingnan Lahat →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badgeRow}>
            {badgePreview.length ? (
              badgePreview.map((badge) => (
                <View key={badge.id || badge.name} style={styles.badgeCard}>
                  <Image source={getHomeBadgeImageSource(badge)} style={styles.homeBadgeImage} resizeMode="contain" />
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeMeta}>{localizeBadgeDescription(badge.description)}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyStateSmall}>
                <Text style={styles.emptyEmoji}>🌱</Text>
                <Text style={styles.emptyTitle}>Wala ka pang gantimpala</Text>
                <Text style={styles.emptyText}>Tapusin ang aralin para makakuha ng gantimpala.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Gawain ng Grupo
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Mga Pangkat')}>
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
              <Text style={styles.emptyTitle}>Wala pang gawaing panggrupo</Text>
              <Text style={styles.emptyText}>Mahusay! Bumalik mamaya para sa bagong gawain.</Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  homeBadgeImage: {
    width: 72,
    height: 72,
    alignSelf: 'center',
  },
  homeBadgeImageLocked: {
    opacity: 0.35,
  },

  safe: {
    flex: 1,
    backgroundColor: '#DDFBE8',
  },
  container: {
    flex: 1,
    backgroundColor: '#DDFBE8',
    paddingTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 130,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandLogo: {
    width: 64,
    height: 64,
    marginRight: 14,
  },

  brandTitle: {
    fontSize: 26,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
    lineHeight: 31,
  },

  brandSubtitle: {
    marginTop: 5,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Nunito_800ExtraBold',
  },

  profileGreeting: {
    color: '#16A34A',
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 3,
  },

  header: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 6,
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatarBubble: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#86EFAC',
    shadowColor: '#16A34A',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },

  avatarBubbleText: {
    fontSize: 34,
  },

  profileName: {
    fontSize: 22,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    lineHeight: 27,
  },

  profileGrade: {
    color: '#64748B',
    marginTop: 3,
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
  },

  rightSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  smallChip: {
    backgroundColor: '#ECFDF5',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  smallChipText: {
    color: '#166534',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 15,
  },

  heroCard: {
    marginTop: 14,
    backgroundColor: '#16A34A',
    borderRadius: 34,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#15803D',
    shadowColor: '#14532D',
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
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
    fontSize: 31,
    fontFamily: 'Fredoka_700Bold',
    color: '#FFFFFF',
    lineHeight: 37,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    color: '#DCFCE7',
    lineHeight: 25,
    fontFamily: 'Nunito_800ExtraBold',
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
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 10,
  },
  xpLabel: {
    fontSize: 15,
    color: '#16A34A',
    fontFamily: 'Fredoka_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpValue: {
    fontSize: 36,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
    marginTop: 4,
    lineHeight: 42,
  },
  levelBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  levelText: {
    color: '#166534',
    fontSize: 14,
    fontFamily: 'Fredoka_700Bold',
  },
  progressBar: {
    height: 13,
    backgroundColor: '#86EFAC',
    borderRadius: 999,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },
  progressInfo: {
    marginTop: 10,
    color: '#475569',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Nunito_800ExtraBold',
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    minHeight: 86,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
    lineHeight: 29,
  },
  statLabel: {
    marginTop: 6,
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'Nunito_800ExtraBold',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 25,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    lineHeight: 31,
  },
  sectionLink: {
    color: '#16A34A',
    fontSize: 15,
    fontFamily: 'Fredoka_700Bold',
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
    fontFamily: 'Fredoka_700Bold',
    fontSize: 14,
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 23,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginBottom: 7,
    lineHeight: 29,
  },
  cardMeta: {
    color: '#64748B',
    fontSize: 15,
    fontFamily: 'Nunito_800ExtraBold',
  },
  cardAction: {
    marginTop: 14,
    alignSelf: 'flex-start',
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyStateSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',
    marginBottom: 7,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Nunito_800ExtraBold',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    minHeight: 184,
  },
  badgeIcon: {
    fontSize: 48,
    backgroundColor: '#BBF7D0',
    width: 72,
    height: 72,
    borderRadius: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
  },
  badgeName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  badgeMeta: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  taskTitle: {
    color: '#0F172A',
    fontSize: 22,
    lineHeight: 28,
    fontFamily: 'Fredoka_700Bold',
  },
  taskMeta: {
    color: '#64748B',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
    fontFamily: 'Nunito_800ExtraBold',
  },
  taskXp: {
    marginTop: 14,
    color: '#16A34A',
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
  },

  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  lessonIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: '#BBF7D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
  },

  lessonIcon: {
    fontSize: 38,
  },

  lessonXpBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  lessonXpText: {
    color: '#166534',
    fontSize: 13,
    fontFamily: 'Fredoka_700Bold',
  },

  continueButton: {
    marginTop: 16,
    backgroundColor: '#22C55E',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Fredoka_700Bold',
  },

});
