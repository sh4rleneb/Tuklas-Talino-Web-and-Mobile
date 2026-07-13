import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import StudentScreenHeader from '../components/StudentScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import { colors } from '../styles/theme';

const KAAGAPAY_BADGE_IMAGE = require('../../assets/badges/kaagapay-sa-gawain.png');
const BITUIN_BADGE_IMAGE = require('../../assets/badges/bituin-sa-pagsagot.png');
const HENYO_BADGE_IMAGE = require('../../assets/badges/henyo-sa-pagsusulit.png');

function isKaagapayBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'kaagapay sa gawain' || code.includes('kaagapay');
}

const BADGE_IMAGE_BY_CODE = {
  first_lesson: require('../../assets/badges/unang-hakbang.png'),
  firstlesson: require('../../assets/badges/unang-hakbang.png'),
  reader: require('../../assets/badges/batang-mambabasa.png'),
  reader_3: require('../../assets/badges/batang-mambabasa.png'),
  quiz_perfect: require('../../assets/badges/henyo-sa-pagsusulit.png'),
  writing_3: require('../../assets/badges/bituin-sa-pagsagot.png'),
  speech_3: require('../../assets/badges/boses-bituin.png'),
  group_1: require('../../assets/badges/kaagapay-sa-gawain.png'),
  xp_100: require('../../assets/badges/bituin-ng-kasipagan.png'),
  level_10: require('../../assets/badges/tuklas-kampeon.png'),
};

const BADGE_IMAGE_BY_NAME = {
  'unang hakbang': require('../../assets/badges/unang-hakbang.png'),
  'batang mambabasa': require('../../assets/badges/batang-mambabasa.png'),
  'henyo sa pagsusulit': require('../../assets/badges/henyo-sa-pagsusulit.png'),
  'bituin sa pagsagot': require('../../assets/badges/bituin-sa-pagsagot.png'),
  'boses bituin': require('../../assets/badges/boses-bituin.png'),
  'kaagapay sa gawain': require('../../assets/badges/kaagapay-sa-gawain.png'),
  'bituin ng kasipagan': require('../../assets/badges/bituin-ng-kasipagan.png'),
  'tuklas kampeon': require('../../assets/badges/tuklas-kampeon.png'),
};

function getBadgeImage(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return BADGE_IMAGE_BY_CODE[code] || BADGE_IMAGE_BY_NAME[name] || null;
}

function isHenyoBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'henyo sa pagsusulit' || code === 'quiz_perfect';
}

function isBituinBadge(badge) {
  const name = String(badge?.name || '').trim().toLowerCase();
  const code = String(badge?.code || '').trim().toLowerCase();
  return name === 'bituin sa pagsagot' || code === 'writing_3' || code.includes('writing') || code.includes('sagot');
}

function BadgeVisual({ badge }) {
  const mappedBadgeImage = getBadgeImage(badge);
  if (mappedBadgeImage) {
    return (
      <Image
        source={mappedBadgeImage}
        style={styles.badgeImage}
        resizeMode="contain"
      />
    );
  }

  if (isHenyoBadge(badge)) {
    return (
      <Image
        source={HENYO_BADGE_IMAGE}
        style={styles.badgeImage}
        resizeMode="contain"
      />
    );
  }

  if (isBituinBadge(badge)) {
    return (
      <Image
        source={BITUIN_BADGE_IMAGE}
        style={styles.badgeImage}
        resizeMode="contain"
      />
    );
  }

  if (isKaagapayBadge(badge)) {
    return (
      <Image
        source={KAAGAPAY_BADGE_IMAGE}
        style={styles.badgeImage}
        resizeMode="contain"
      />
    );
  }

  return <Text style={styles.icon}>{badge?.icon}</Text>;
}

export default function BadgesScreen({ navigation }) {
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [badgeProgress, setBadgeProgress] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([api('/badges'), api('/dashboard')])
      .then(([badgeData, dashboard]) => {
        if (!active) return;
        setBadges(badgeData.earnedBadges || badgeData.badges || []);
        setAllBadges(badgeData.allBadges || []);
        setBadgeProgress(badgeData.badgeProgress || []);
        setStudent(dashboard.student || null);
      })
      .catch((err) => {
        if (!active) return;
        setError('Hindi makuha ang mga gantimpala. Pakisubukan muli.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []));

  const owned = new Set(
    badges
      .map((badge) => badge?.id)
      .filter(
        (badgeId) =>
          badgeId !== undefined &&
          badgeId !== null
      )
  );

  // Use the same canonical badge list displayed by the cards.
  // Duplicate earned records must not increase the totals.
  const earnedCount = allBadges.filter(
    (badge) => owned.has(badge.id)
  ).length;

  const totalCount = allBadges.length;
  const lockedCount = Math.max(
    0,
    totalCount - earnedCount
  );

  const completionPercent = totalCount
    ? Math.min(
        100,
        Math.round(
          (earnedCount / totalCount) * 100
        )
      )
    : 0;

  const earnedById = useMemo(
    () => new Map(badges.map((badge) => [badge.id, badge])),
    [badges]
  );
  const progressByCode = useMemo(
    () => new Map(badgeProgress.map((progress) => [progress.code, progress])),
    [badgeProgress]
  );

  function badgeCaption(badge) {
    const earned = earnedById.get(badge.id);
    if (earned) {
      const awardedAt = earned.awardedAt ? new Date(earned.awardedAt) : null;
      return awardedAt && !Number.isNaN(awardedAt.getTime())
        ? `Nabuksan ${awardedAt.toLocaleDateString()}`
        : 'Nabuksan';
    }

    const progress = progressByCode.get(badge.code);
    if (progress) return `${progress.current}/${progress.target} kompleto`;
    if (badge.xpThreshold != null && Number.isFinite(Number(badge.xpThreshold))) return `${badge.xpThreshold} XP`;
    return 'Nakasara';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StudentScreenHeader
          showBack={false}
        navigation={navigation}
        avatar={student?.avatar}
        gradeLevel={student?.gradeLevel}
      />

      <View style={styles.header}>
        <View style={styles.heroCard}>
          <Text style={styles.title}>🏅 Mga Gantimpala</Text>
          <Text style={styles.subtitle}>
            Ang iyong mga tagumpay at pag-unlad sa pag-aaral.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{earnedCount}</Text>
              <Text style={styles.statLabel}>Nakamit</Text>
            </View>

            <View style={styles.statChip}>
              <Text style={styles.statValue}>{lockedCount}</Text>
              <Text style={styles.statLabel}>Nakasara</Text>
            </View>

            <View style={styles.statChip}>
              <Text style={styles.statValue}>{completionPercent}%</Text>
              <Text style={styles.statLabel}>Kumpleto</Text>
            </View>
          </View>

        </View>

      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.muted}>Inihahanda ang mga gantimpala...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>Hindi makuha ang mga gantimpala. Pakisubukan muli.</Text>
      ) : (
        <View style={styles.grid}>
          {allBadges.map(b => {
            const progress = progressByCode.get(b.code);
            const isOwned = owned.has(b.id);

            return (
              <Card key={b.id} style={[styles.badge, !isOwned && styles.locked]}>
                <BadgeVisual badge={b} />
                <Text style={styles.name}>{b.name}</Text>
                <Text style={styles.muted}>{badgeCaption(b)}</Text>
                {!isOwned && progress && (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress.percent}%` }]} />
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      {!loading && !error && allBadges.length === 0 && (
        <Text style={styles.muted}>Wala pang magagamit na gantimpala.</Text>
      )}
          </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  screen: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 140,
  },

  header: {
    marginBottom: 16,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 20,
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 34,
  },

  subtitle: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 18,
  },

  statChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803D',
  },

  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  studentChip: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    padding: 8,
  },

  studentAvatar: {
    fontSize: 26,
  },

  studentXp: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    marginTop: 4,
  },

  badge: {
    width: '48%',
    alignItems: 'center',
    minHeight: 190,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  locked: {
    opacity: 0.58,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },

  icon: {
    fontSize: 48,
    backgroundColor: '#ECFDF5',
    width: 72,
    height: 72,
    borderRadius: 26,
    textAlign: 'center',
    textAlignVertical: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  badgeImage: { width: 72, height: 72, borderRadius: 26, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#BBF7D0' }, name: {
    textAlign: 'center',
    fontWeight: '900',
    color: '#0F172A',
    fontSize: 16,
    lineHeight: 21,
    marginTop: 12,
  },

  muted: {
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  center: {
    paddingVertical: 50,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  error: {
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '800',
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 12,
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 99,
  },
});
