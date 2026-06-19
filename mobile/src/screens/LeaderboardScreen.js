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
          setError(err.message || 'Unable to load leaderboard.');
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
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>
            Top students ranked by XP and learning consistency.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.green} />
        ) : error ? (
          <Text>{error}</Text>
        ) : (
          leaderboard.map((player) => (
            <Card key={player.id}>
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
                    Grade {player.gradeLevel}
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
  safe:{ flex:1, backgroundColor:'#F6FFF5' },
  screen:{ flex:1, backgroundColor:'#F6FFF5' },
  content:{ padding:16, paddingTop:32, paddingBottom:44 },

  heroCard:{
    backgroundColor:'#ECFDF5',
    borderRadius:26,
    padding:20,
    marginBottom:20,
  },

  title:{
    fontSize:24,
    fontWeight:'900',
    color:colors.ink,
  },

  subtitle:{
    color:colors.muted,
    marginTop:4,
  },

  row:{
    flexDirection:'row',
    alignItems:'center',
  },

  rank:{
    width:52,
    fontSize:22,
    fontWeight:'900',
  },

  avatar:{
    fontSize:28,
    marginRight:12,
  },

  flex:{
    flex:1,
  },

  name:{
    fontWeight:'900',
    fontSize:16,
  },

  meta:{
    color:'#64748B',
  },

  xp:{
    textAlign:'right',
    fontWeight:'900',
  },

  streak:{
    textAlign:'right',
    color:'#EA580C',
  },
});
