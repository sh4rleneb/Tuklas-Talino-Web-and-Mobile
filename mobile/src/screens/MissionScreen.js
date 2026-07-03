import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import StudentScreenHeader from '../components/StudentScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Card from '../components/Card';


const colors = {
  primary: '#22C55E',
  green: '#22C55E',
  ink: '#0F172A',
  muted: '#64748B',
};

const MISSION_GAMES = [
  {
    id: 'word-match',
    title: 'Pagtutugma ng Salita',
    icon: '🧩',
    module: 'Bokabularyo',
    xp: 15,
    instruction: 'Itugma ang salita sa tamang larawan.',
    sample: 'aso → larawan ng aso'
  },
  {
    id: 'letter-pop',
    title: 'Pagpili ng Titik',
    icon: '🎈',
    module: 'Pagbasa',
    xp: 12,
    instruction: 'Piliin ang tamang titik o pantig upang mabuo ang salita.',
    sample: 'ba + ___ = bata'
  },
  {
    id: 'picture-guess',
    title: 'Paghula sa Larawan',
    icon: '🖼️',
    module: 'Bokabularyo',
    xp: 12,
    instruction: 'Tukuyin ang tamang salita batay sa larawan.',
    sample: 'pusa → pusa'
  },
  {
    id: 'sentence-builder',
    title: 'Pagbuo ng Pangungusap',
    icon: '🧱',
    module: 'Pagsulat',
    xp: 18,
    instruction: 'Ayusin ang mga salita upang makabuo ng wastong pangungusap.',
    sample: 'Ako / ay / bata'
  },
  {
    id: 'story-quest',
    title: 'Pag-unawa sa Kuwento',
    icon: '📖',
    module: 'Panitikan',
    xp: 20,
    instruction: 'Basahin ang kuwento at sagutin ang mga tanong.'
  },
  {
    id: 'sound-and-say',
    title: 'Pakikinig at Pagbigkas',
    icon: '🎙️',
    module: 'Komunikasyong Pagsasalita',
    xp: 15,
    instruction: 'Makinig muna, pagkatapos bigkasin nang malinaw ang ipinakitang salita o pangungusap.'
  }
];


export default function MissionScreen({ navigation }) {
  const [missions, setMissions] = useState(MISSION_GAMES);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dashboard = await api('/dashboard');




      const backendMissions = dashboard.missions || [];

      const merged = MISSION_GAMES.map((mission) => {
        const backend = backendMissions.find(
          (m) => m.missionId === mission.id
        );

        return {
          ...(backend || {}),
          ...mission,
        };
      });


      console.log("MISSION MERGED:");
      console.log(JSON.stringify(merged, null, 2));
      setMissions(merged);
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
      Alert.alert('Nakuha ang Gantimpala', data.message || `+${data.xpAwarded} XP ang nakuha!`);
      load();
    } catch (err) {
      Alert.alert('May Problema', err.message || 'Hindi makuha ang gantimpala.');
    } finally {
      setSubmittingId(null);
    }
  }

  function statusLabel(state) {
    if (state === 'claimed') return 'Natapos';
    return 'Handa';
}

  function buttonLabel(mission) {
    if (submittingId === mission.missionId) return 'Kinukuha...';
    if (mission.state === 'claimed') return 'Nakuha na';
    if (mission.state === 'ready_to_claim') return 'Kunin ang XP';
    return 'Keep Learning';
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" removeClippedSubviews={false}>
      <StudentScreenHeader
        navigation={navigation}
        avatar={student?.avatar}
        gradeLevel={student?.gradeLevel}
      />

      <View style={styles.header}>
        <View style={styles.heroCard}>
          <Text style={styles.heading}>🎮 Mga Misyon</Text>
          <Text style={styles.subtitle}>
            Maglaro at kumita ng XP!
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
              <Text>🔥 {student.currentStreak || 0} Araw na Sunod-sunod</Text>
              <Text>🏆 Pinakamahabang {student.longestStreak || 0}</Text>
            </View>
          )}
        </View>
        
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Inaayos ang mga misyon...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        missions.map((mission) => (
          <Card
            key={mission.id}
            style={[
              styles.card,
              mission.state === 'claimed'
                ? styles.cardCompleted
                : styles.cardReady,
            ]}
          >
            <View style={styles.cardHeader}>

              <View style={styles.iconBox}>
                <Text style={styles.icon}>
                  {mission.icon}
                </Text>
              </View>

              <View style={styles.cardText}>
                <Text style={styles.missionTitle}>
                  {mission.title}
                </Text>

                <Text style={styles.missionMeta}>
                  {mission.module} • +{mission.xp} XP
                </Text>
              </View>

              <View style={styles.statusPill(mission.state)}>
                <Text style={styles.statusText}>
                  {statusLabel(mission.state)}
                </Text>
              </View>

            </View>

            <Text style={styles.description}>
              {mission.instruction}
            </Text>

            {mission.sample ? (
              <Text style={styles.progressText}>
                Halimbawa: {mission.sample}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                mission.state === 'claimed' && styles.buttonDisabled,
              ]}
              disabled={false}
              onPress={() => {


                navigation.navigate("MissionGame", {
                  missionId: mission.id,
                  gradeLevel: student?.gradeLevel,
                });
              }}
            >
              <Text style={styles.buttonText}>
                {mission.state === 'claimed'
                  ? '✓ Natapos'
                  : '▶ Maglaro'}
              </Text>
            </TouchableOpacity>

          </Card>
        ))
      )}

      {!loading && !error && missions.length === 0 && (
        <Text style={styles.empty}>Wala pang misyon sa ngayon.</Text>
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
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerText: { flex: 1, paddingRight: 12 },
  heading: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  studentChip: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 18, padding: 8 },
  studentAvatar: { fontSize: 26 },
  studentXp: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  card: {
    marginBottom: 18,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  cardHeader: {
    flexDirection:'row',
    alignItems:'center',
    marginBottom:14,
  },
  iconBox:{
    width:68,
    height:68,
    borderRadius:22,
    backgroundColor:'#ECFDF5',
    borderWidth:1,
    borderColor:'#BBF7D0',
    alignItems:'center',
    justifyContent:'center',
    marginRight:16,
  },
  icon:{
    fontSize:34,
  },
  cardCompleted:{
    borderWidth:2,
    borderColor:'#86EFAC',
  },
  cardReady:{
    borderWidth:2,
    borderColor:'#60A5FA',
  },
  cardProgress:{
    borderWidth:2,
    borderColor:'#E5E7EB',
  },
  cardLocked:{
    opacity:.75,
  },

  cardText: { flex: 1, paddingRight: 10 },
  missionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.ink,
  },
  missionMeta: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 13,
  },
  statusPill: (state) => ({
    backgroundColor:
      state === 'claimed'
        ? '#DCFCE7'
        : '#DBEAFE',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  }),
  statusText: { color: colors.ink, fontWeight: '700' },
  description: {
    color: colors.muted,
    marginTop: 14,
    marginBottom: 18,
    lineHeight: 22,
    fontSize: 14,
  },
  progressTrack: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: 99 },
  progressText: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 10,
    marginBottom: 14,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 15,
  },
  loading: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: colors.muted },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 20 },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 36,
    fontSize: 15,
    lineHeight: 22,
  },
});
