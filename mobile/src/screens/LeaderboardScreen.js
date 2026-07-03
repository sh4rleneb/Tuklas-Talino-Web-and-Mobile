import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import StudentScreenHeader from '../components/StudentScreenHeader';
import Card from '../components/Card';
import { colors } from '../styles/theme';
import { getLeaderboard } from '../api/leaderboard';
import { api } from '../api/client';

export default function LeaderboardScreen({ navigation }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);

          const [board, dashboard] = await Promise.all([
            getLeaderboard(),
            api('/dashboard'),
          ]);

          if (!active) return;

          setLeaderboard(board.leaderboard || []);
          setStudent(dashboard.student || null);
        } catch (err) {
          if (!active) return;
          setError(err.message || 'Hindi ma-load ang talaan ng ranggo.');
        } finally {
          if (active) setLoading(false);
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [])
  );

  function medal(rank) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>

        <StudentScreenHeader
          navigation={navigation}
          avatar={student?.avatar}
          gradeLevel={student?.gradeLevel}
        />

        <View style={styles.heroCard}>
          <Text style={styles.title}>🏆 Talaan ng Ranggo</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>
              Ina-load ang talaan ng ranggo...
            </Text>
          </View>
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          leaderboard.map((player) => (
            <Card
                key={player.id}
                style={[
                  styles.leaderboardCard,
                  String(player.id) === String(student?.id) && styles.currentPlayerCard,
                ]}
              >
              <View style={styles.row}>
                <Text style={styles.rank}>
                  {medal(player.rank)}
                </Text>

                <Text style={styles.avatar}>
                  {player.avatar || '🦊'}
                </Text>

                <View style={styles.flex}>
                  <Text style={styles.name}>
                    {player.name}
                  </Text>

                  <Text style={styles.meta}>
                    Baitang {player.gradeLevel}
                  </Text>
                </View>

                <View>
                  <Text style={styles.xp}>
                    ⚡ {player.xp}
                  </Text>

                  <Text style={styles.streak}>
                    🔥 {player.currentStreak || 0}
                  </Text>
                </View>
              </View>
            </Card>
          ))
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
    paddingTop: 8,
    paddingBottom: 140,
  },

  heroCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
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

  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  currentPlayerCard: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 74,
  },

  rank: {
    width: 50,
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },

  avatar: {
    fontSize: 30,
    width: 52,
    textAlign: 'center',
    marginRight: 12,
  },

  flex: {
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontWeight: '900',
    fontSize: 16,
    color: '#0F172A',
  },

  meta: {
    color: '#64748B',
    fontWeight: '700',
    marginTop: 3,
  },

  scoreBox: {
    alignItems: 'flex-end',
    marginLeft: 10,
    minWidth: 58,
  },

  xp: {
    textAlign: 'right',
    fontWeight: '900',
    color: '#16A34A',
    fontSize: 15,
  },


  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 14,
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },

  streak: {
    textAlign: 'right',
    color: '#EA580C',
    fontWeight: '800',
    marginTop: 4,
  },
});
