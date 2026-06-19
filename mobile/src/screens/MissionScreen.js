import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import StudentScreenHeader from '../components/StudentScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function MissionScreen({ navigation }) {
  const [missions, setMissions] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [missionData, dashboard] = await Promise.all([
        api('/missions'),
        api('/dashboard'),
      ]);
      setMissions(missionData.missions || []);
      setStudent(dashboard.student || null);
    } catch (err) {
      setError(err.message || 'Unable to load missions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function claimMission(missionId) {
    setSubmittingId(missionId);
    try {
      const data = await api(`/missions/${missionId}/claim`, {
        method: 'POST',
      });
      Alert.alert('Mission Claimed', data.message || `+${data.xpAwarded} XP earned!`);
      load();
    } catch (err) {
      Alert.alert('Mission Error', err.message || 'Unable to claim mission.');
    } finally {
      setSubmittingId(null);
    }
  }

  function statusLabel(state) {
    if (state === 'claimed') return 'Claimed';
    if (state === 'ready_to_claim') return 'Ready';
    if (state === 'in_progress') return 'In Progress';
    return 'Locked';
  }

  function buttonLabel(mission) {
    if (submittingId === mission.missionId) return 'Claiming...';
    if (mission.state === 'claimed') return 'Already Claimed';
    if (mission.state === 'ready_to_claim') return 'Claim XP';
    return 'Keep Learning';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StudentScreenHeader
        navigation={navigation}
        avatar={student?.avatar}
        gradeLevel={student?.gradeLevel}
      />

      <View style={styles.header}>
        <View style={styles.heroCard}>
          <Text style={styles.heading}>🎯 Daily Quests</Text>
          <Text style={styles.subtitle}>
            Complete quests, earn XP, maintain streaks, and unlock badges.
          </Text>

          {!!student && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                marginTop: 12,
              }}
            >
              <Text>⚡ {student.xp || 0} XP</Text>
              <Text>🔥 {student.currentStreak || 0} Day Streak</Text>
              <Text>🏆 Best {student.longestStreak || 0}</Text>
            </View>
          )}
        </View>
        
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        missions.map((mission) => (
          <Card key={mission.missionId} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.cardText}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionMeta}>{mission.xp} XP</Text>
              </View>
              <View style={styles.statusPill(mission.state)}>
                <Text style={styles.statusText}>{statusLabel(mission.state)}</Text>
              </View>
            </View>
            <Text style={styles.description}>
              Complete {mission.requirement?.target || 0} lessons to unlock this reward.
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${mission.requirement?.percent || 0}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {mission.requirement?.current || 0}/{mission.requirement?.target || 0} lessons completed
            </Text>
            <TouchableOpacity
              style={[
                styles.button,
                mission.state !== 'ready_to_claim' && styles.buttonDisabled,
              ]}
              disabled={mission.state !== 'ready_to_claim' || Boolean(submittingId)}
              onPress={() => claimMission(mission.missionId)}
            >
              <Text style={styles.buttonText}>{buttonLabel(mission)}</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}

      {!loading && !error && missions.length === 0 && (
        <Text style={styles.empty}>No missions are available at the moment.</Text>
      )}
          </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  screen: { flex: 1, backgroundColor: '#F6FFF5' },
    content: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 44,
  },
  header: {
    marginBottom: 22,
  },

  heroCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
    flex: 1,
  },
  headerText: { flex: 1, paddingRight: 12 },
  heading: { fontSize: 24, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  subtitle: { color: colors.muted },
  studentChip: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 18, padding: 8 },
  studentAvatar: { fontSize: 26 },
  studentXp: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardText: { flex: 1, paddingRight: 10 },
  missionTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  missionMeta: { color: colors.muted, marginTop: 4 },
  statusPill: (state) => ({
    backgroundColor: state === 'claimed'
      ? '#DCFCE7'
      : state === 'ready_to_claim'
        ? '#E0F2FE'
        : '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  }),
  statusText: { color: colors.ink, fontWeight: '700' },
  description: { color: colors.muted, marginTop: 12, marginBottom: 16 },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
  progressText: { color: colors.muted, fontSize: 12, marginTop: 7, marginBottom: 12 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: { color: '#FFF', fontWeight: '900' },
  loading: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.muted },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 20 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
