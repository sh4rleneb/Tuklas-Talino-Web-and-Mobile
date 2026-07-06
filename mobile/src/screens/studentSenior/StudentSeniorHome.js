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
            {error || 'Ina-load ang iyong dashboard...'}
          </Text>
          {error ? (
            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryText}>Subukang Muli</Text>
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

    

function categoryKey(subject = '') {
  const value = String(subject).trim().toLowerCase();

  if (value === 'oral comm' || value === 'oral communication' || value === 'pagsasalita') {
    return 'Oral Communication';
  }

  const map = {
    'pagbasa': 'Pagbasa',
    'bokabularyo': 'Bokabularyo',
    'panitikan': 'Panitikan',
    'pagsulat': 'Pagsulat',
  };

  return map[value] || String(subject || 'General');
}

function categoryMeta(subject) {
  const key = categoryKey(subject);

  const meta = {
    Pagbasa: {
      label: 'Pagbasa',
    },
    Bokabularyo: {
      label: 'Bokabularyo',
    },
    Panitikan: {
      label: 'Panitikan',
    },
    'Oral Communication': {
      label: 'Komunikasyong Pagsasalita',
    },
    Pagsulat: {
      label: 'Pagsulat',
    },
  };

  return meta[key] || {
    label: key,
  };
}


const lessonColors = [
  '#F7FEF9',
  '#F0FDF4',
  '#F8FAFC',
  '#F4FBF7',
  '#ECFDF5',
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
                {name} • Baitang {grade}
              </Text>

            </TouchableOpacity>

          </View>

            {/* HERO */}

            <View style={styles.heroCard}>

              <View style={styles.heroTop}>

                <View style={styles.heroTextBlock}>

                  <Text style={styles.heroTitle}>
                    Magandang araw, {name}!
                  </Text>

                  <Text style={styles.heroSubtitle}>
                    Handa ka na bang matuto at magsaya ngayon?
                  </Text>

                </View>

              </View>

              {/* XP */}

              <View style={styles.xpCard}>

                <View style={styles.xpHeader}>

                  <View>

                    <Text style={styles.xpLabel}>
                      ⭐ XP
                    </Text>

                    <Text style={styles.xpValue}>
                      {xp} XP
                    </Text>

                  </View>

                  <View style={styles.levelBadge}>

                    <Text style={styles.levelText}>
                      Antas {level}
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
                  {100 - (xp % 100)} XP na lang bago umangat sa susunod na antas.
                </Text>

              
</View>

            <View style={styles.achievementRow}>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🔥 {student?.currentStreak || 0}</Text>
                <Text style={styles.achievementLabel}>Kasalukuyang Streak</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🏆 {student?.longestStreak || 0}</Text>
                <Text style={styles.achievementLabel}>Pinakamahabang Streak</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>🏅 {badges.length}</Text>
                <Text style={styles.achievementLabel}>Mga Badge</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementValue}>⭐ {level}</Text>
                <Text style={styles.achievementLabel}>Antas</Text>
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
                  Mga Aralin
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
                  🏅 Mga Badge
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
                  📚 Mga Aralin
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      'Lessons'
                    )
                  }
                >
                  <Text
                    style={styles.allLessons}
                  >
                    Tingnan ang Lahat →
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
                      {categoryMeta(lesson.subject).label}
                    </Text>

                    <Text style={styles.lessonTitle}>
                      {lesson.title}
                    </Text>

                    <View style={styles.startBtn}>
                      <Text style={styles.startText}>
                        {lesson.completed ? 'Balikan' : 'Simulan'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

              </View>

              {!featuredLessons.length && (
                <Text style={styles.emptyText}>
                  Wala pang nailalathalang mga aralin para sa iyong baitang.
                </Text>
              )}

            </View>

            {/* BADGES */}

            <View style={styles.section}>

              <Text style={styles.sectionTitle}>
                🏅 Mga Badge
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
                      <Image
                        source={getHomeBadgeImageSource(badge)}
                        style={[
                          styles.homeBadgeImage,
                          !unlocked && styles.homeBadgeImageLocked,
                        ]}
                        resizeMode="contain"
                      />

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
                  Lalabas ang progreso ng iyong mga badge kapag nagsimula ka nang mag-aral.
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

    backgroundColor: '#EAFBF1',

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

      borderRadius: 30,

      paddingHorizontal: 18,

      paddingTop: 18,

      paddingBottom: 16,

      marginBottom: 16,

      borderWidth: 1,

      borderColor: '#BBF7D0',

      shadowColor: '#14532D',

      shadowOpacity: 0.10,

      shadowRadius: 18,

      shadowOffset: { width: 0, height: 8 },

      elevation: 5,

    },

  headerTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

    profileChip: {

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor: '#F0FDF4',

      paddingHorizontal: 12,

      paddingVertical: 8,

      borderRadius: 999,

      borderWidth: 1,

      borderColor: '#BBF7D0',

      shadowColor: '#16A34A',

      shadowOpacity: 0.08,

      shadowRadius: 8,

      shadowOffset: { width: 0, height: 4 },

      elevation: 2,

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
    backgroundColor: '#16A34A',
    borderRadius: 32,
    padding: 22,
  marginBottom: 18,
    borderWidth: 1,
    borderColor: '#86EFAC',
  shadowColor: '#14532D',
    shadowOpacity: 0.1,
    shadowRadius: 16,
  shadowOffset: { width: 0, height: 10 },
    elevation: 4,
},

  heroTop: {

    flexDirection: 'row',
    alignItems: 'center',

    width: '100%',

  },

  heroTextBlock: {

    flex: 1,

    minWidth: 0,

  },

  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },

  avatar: {
    fontSize: 34,
  },

  heroTitle: {
    fontSize: 28,

    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 34,


  },

  heroSubtitle: {
    fontSize: 14,
    color: '#DCFCE7',

    marginTop: 6,
    lineHeight: 22,

    fontFamily: 'Nunito_700Bold',

    width: '100%',

    flexShrink: 1,

  },

  xpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 18,

    marginTop: 18,

    borderWidth: 1,
    borderColor: '#DCFCE7',

    shadowColor: '#14532D',
    shadowOpacity: 0.06,

    shadowRadius: 14,

    shadowOffset: { width: 0, height: 7 },
    elevation: 2,

  },

  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  xpLabel: {

    fontSize: 13,

    fontWeight: '900',

    color: '#64748B',

    textTransform: 'uppercase',

    letterSpacing: 0.5,

  },

  xpValue: {
    fontSize: 32,

    fontWeight: '900',
    color: '#166534',

    marginTop: 2,

  },

  levelBadge: {
    backgroundColor: '#ECFDF5',

    paddingHorizontal: 14,

    paddingVertical: 9,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: '#86EFAC',

  },


  levelText: {


    fontSize: 14,


    fontWeight: '900',
    color: '#166534',


  },

  progressBg: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },

  progressFill: {

    height: 12,

    backgroundColor: '#22C55E',

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
    marginTop: 18,
    rowGap: 12,
  },

  achievementCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
    paddingHorizontal: 10,

  },

  achievementValue: {
    fontSize: 18,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
  },

  achievementLabel: {
    marginTop: 4,
    fontSize: 11,
    textAlign: 'center',
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
    lineHeight: 15,

  },

  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },

  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
    paddingHorizontal: 10,
    minHeight: 98,
    justifyContent: 'center',

  },

  quickValue: {
    fontSize: 28,
    color: '#16A34A',
    fontFamily: 'Fredoka_700Bold',
  },

  quickLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
    lineHeight: 16,
    textAlign: 'center',

  },

  section: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,

    borderWidth: 1,
    borderColor: '#BBF7D0',

    shadowColor: '#14532D',
    shadowOpacity: 0.06,

    shadowRadius: 14,

    shadowOffset: { width: 0, height: 7 },

    elevation: 3,

  },

  sectionHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,


  },

  sectionTitle: {
    fontSize: 24,

    fontWeight: '900',
    color: '#0F172A',

    letterSpacing: -0.3,
    lineHeight: 30,
    flex: 1,
    minWidth: 0,



  },

  allLessons: {
    color: '#15803D',

    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: '#BBF7D0',

  },

  lessonGrid: {

    flexDirection: 'column',
    gap: 12,
    marginTop: 4,

  },

  lessonCard: {
    backgroundColor: '#F7FEF9',
    borderRadius: 26,
    padding: 18,

    marginBottom: 0,

    borderWidth: 1,
    borderColor: '#BBF7D0',
    minHeight: 178,

    shadowColor: '#14532D',
    shadowOpacity: 0.05,
    shadowRadius: 10,

    shadowOffset: { width: 0, height: 6 },

    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',


  },

  lessonEmoji: {
    fontSize: 31,
    backgroundColor: '#FFFFFF',
    width: 56,
    height: 56,
    borderRadius: 20,
    textAlign: 'center',

    textAlignVertical: 'center',

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignSelf: 'center',


  },

  lessonTag: {
    alignSelf: 'center',
    color: '#15803D',

    fontFamily: 'Fredoka_600SemiBold',
    marginTop: 12,
    fontSize: 10,

    textTransform: 'uppercase',

    letterSpacing: 0.5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 11,
    paddingVertical: 5,

    borderRadius: 999,

    borderWidth: 1,
    borderColor: '#86EFAC',
    textAlign: 'center',
    lineHeight: 14,
    maxWidth: '92%',



  },

  lessonTitle: {
    fontSize: 18,

    fontWeight: '900',

    color: '#0F172A',
    lineHeight: 24,
    marginTop: 10,
    alignSelf: 'center',
    textAlign: 'center',
    width: '100%',



  },

  startBtn: {
    marginTop: 16,
    backgroundColor: '#16A34A',

    alignSelf: 'stretch',

    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 20,

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#14532D',
    shadowOpacity: 0.08,

    shadowRadius: 10,

    shadowOffset: { width: 0, height: 5 },
    elevation: 2,

  },

  startText: {

    color: '#FFFFFF',

    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,

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
    backgroundColor: '#F0FDF4',
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
    lineHeight: 18,

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

    fontFamily: 'Nunito_800ExtraBold',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,

    padding: 16,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    textAlign: 'center',
    lineHeight: 21,

  },

});
