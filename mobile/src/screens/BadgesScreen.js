import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function BadgesScreen() {
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
        setError(err.message || 'Unable to load badges.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []));

  const owned = new Set(badges.map(b => b.id));
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
        ? `Unlocked ${awardedAt.toLocaleDateString()}`
        : 'Unlocked';
    }

    const progress = progressByCode.get(badge.code);
    if (progress) return `${progress.current}/${progress.target} complete`;
    if (badge.xpThreshold != null && Number.isFinite(Number(badge.xpThreshold))) return `${badge.xpThreshold} XP`;
    return 'Locked';
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Badges</Text>
          <Text style={styles.subtitle}>Your learning milestones and progress.</Text>
        </View>
        {student && (
          <View style={styles.studentChip}>
            <Text style={styles.studentAvatar}>{student.avatar || '🧒'}</Text>
            <Text style={styles.studentXp}>{student.xp || 0} XP</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.muted}>Loading badges...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.grid}>
          {allBadges.map(b => {
            const progress = progressByCode.get(b.code);
            const isOwned = owned.has(b.id);

            return (
              <Card key={b.id} style={[styles.badge, !isOwned && styles.locked]}>
                <Text style={styles.icon}>{b.icon}</Text>
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
        <Text style={styles.muted}>No badge definitions are available yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink },
  subtitle: { color: colors.muted, marginTop: 4 },
  studentChip: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 18, padding: 8 },
  studentAvatar: { fontSize: 26 },
  studentXp: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47%', alignItems: 'center' },
  locked: { opacity: .45 },
  icon: { fontSize: 42 },
  name: { textAlign: 'center', fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted, marginTop: 4, textAlign: 'center' },
  center: { paddingVertical: 50, alignItems: 'center' },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 30 },
  progressTrack: { height: 7, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 10 },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
});
