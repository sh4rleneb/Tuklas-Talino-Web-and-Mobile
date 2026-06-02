import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function MissionScreen() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/missions');
      setMissions(data.missions || []);
    } catch (err) {
      Alert.alert('Mission Error', err.message || 'Unable to load missions.');
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
        body: {
          challengeId: 'default',
          challengeTitle: 'Mission completed',
        },
      });
      Alert.alert('Mission Claimed', data.message || `+${data.xpAwarded} XP earned!`);
      load();
    } catch (err) {
      Alert.alert('Mission Error', err.message || 'Unable to claim mission.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>🎮 Missions</Text>
      <Text style={styles.subtitle}>Complete these learning challenges to earn extra XP.</Text>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading missions...</Text>
        </View>
      ) : (
        missions.map((mission) => (
          <Card key={mission.missionId} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.cardText}>
                <Text style={styles.missionTitle}>{mission.title}</Text>
                <Text style={styles.missionMeta}>{mission.xp} XP</Text>
              </View>
              <View style={styles.statusPill(mission.completed)}>
                <Text style={styles.statusText}>{mission.completed ? 'Completed' : 'Ready'}</Text>
              </View>
            </View>
            <Text style={styles.description}>Earn bonus XP by completing this activity.</Text>
            <TouchableOpacity
              style={[styles.button, mission.completed && styles.buttonDisabled]}
              disabled={mission.completed || submittingId === mission.missionId}
              onPress={() => claimMission(mission.missionId)}
            >
              <Text style={styles.buttonText}>{mission.completed ? 'Already Claimed' : 'Claim XP'}</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}

      {!loading && missions.length === 0 && (
        <Text style={styles.empty}>No missions are available at the moment.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 32, fontWeight: '900', color: colors.ink, marginBottom: 6 },
  subtitle: { color: colors.muted, marginBottom: 20 },
  card: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardText: { flex: 1, paddingRight: 10 },
  missionTitle: { fontSize: 20, fontWeight: '900', color: colors.ink },
  missionMeta: { color: colors.muted, marginTop: 4 },
  statusPill: (completed) => ({
    backgroundColor: completed ? '#DCFCE7' : '#E0F2FE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  }),
  statusText: { color: colors.ink, fontWeight: '700' },
  description: { color: colors.muted, marginTop: 12, marginBottom: 16 },
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
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
});
