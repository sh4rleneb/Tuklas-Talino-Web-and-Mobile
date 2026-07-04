import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
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
  const entrance = useRef(new Animated.Value(0)).current;
  const podiumScale = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          setLoading(true);
          setError('');
          entrance.setValue(0);
          podiumScale.setValue(0);

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
          if (active) {
            setLoading(false);

            Animated.parallel([
              Animated.timing(entrance, {
                toValue: 1,
                duration: 520,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.spring(podiumScale, {
                toValue: 1,
                friction: 7,
                tension: 70,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [entrance, podiumScale])
  );

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  const entranceStyle = {
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const podiumScaleStyle = {
    transform: [
      {
        scale: podiumScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.97, 1],
        }),
      },
    ],
  };

  function medal(rank) {
    const value = Number(rank);
    if (value === 1) return '🥇';
    if (value === 2) return '🥈';
    if (value === 3) return '🥉';
    return `#${rank}`;
  }

  function podiumConfig(rank) {
    const value = Number(rank);

    if (value === 1) {
      return {
        height: 110,
        avatarSize: 48,
        cardWidth: '36%',
        blockStyle: styles.firstPodiumBlock,
        nameStyle: styles.firstPodiumName,
        crown: true,
      };
    }

    if (value === 2) {
      return {
        height: 84,
        avatarSize: 40,
        cardWidth: '32%',
        blockStyle: styles.secondPodiumBlock,
        nameStyle: styles.podiumName,
        crown: false,
      };
    }

    return {
      height: 72,
      avatarSize: 38,
      cardWidth: '32%',
      blockStyle: styles.thirdPodiumBlock,
      nameStyle: styles.podiumName,
      crown: false,
    };
  }

  function renderPodiumPlayer(player, slotIndex) {
    if (!player) {
      return <View key={`empty-${slotIndex}`} style={styles.emptyPodiumSlot} />;
    }

    const rank = Number(player.rank || top3.indexOf(player) + 1);
    const cfg = podiumConfig(rank);
    const isMe = String(player.id) === String(student?.id);

    return (
      <View
        key={player.id || `${player.name}-${rank}`}
        style={[
          styles.podiumPlayer,
          { width: cfg.cardWidth },
          rank === 1 && styles.firstPodiumPlayer,
        ]}
      >
        {cfg.crown ? <Text style={styles.crown}>👑</Text> : null}

        <Text style={[styles.podiumAvatar, { fontSize: cfg.avatarSize }]}>
          {player.avatar || '🦊'}
        </Text>

        <View style={styles.podiumNameRow}>
          <Text style={[cfg.nameStyle]} numberOfLines={1}>
            {player.name || 'Mag-aaral'}
          </Text>

          {isMe ? <Text style={styles.podiumMeBadge}>Ikaw</Text> : null}
        </View>

        <Text style={styles.podiumXp}>⚡ {player.xp || 0} XP</Text>

        <View style={[styles.podiumBlock, cfg.blockStyle, { height: cfg.height }]}>
          <Text style={styles.podiumMedal}>{medal(rank)}</Text>
        </View>
      </View>
    );
  }

  function renderPodium() {
    if (!top3.length) return null;

    const orderedPodium = [top3[1], top3[0], top3[2]];

    return (
      <Animated.View style={[styles.podiumCard, podiumScaleStyle]}>
        <View style={styles.podiumHeader}>
          <View>
            <Text style={styles.podiumTitle}>Nangungunang Mag-aaral</Text>
            <Text style={styles.podiumSubtitle}>
              Podium ng may pinakamataas na XP.
            </Text>
          </View>

          <Text style={styles.podiumBadge}>Top 3</Text>
        </View>

        <View style={styles.podiumStageWrap}>
          <View style={styles.podiumStage}>
            {orderedPodium.map(renderPodiumPlayer)}
          </View>
        </View>
      </Animated.View>
    );
  }

  function renderRestList() {
    if (!rest.length) return null;

    return (
      <View style={styles.list}>
        {rest.map((player) => {
          const isMe = String(player.id) === String(student?.id);

          return (
            <Card
              key={player.id}
              style={[
                styles.leaderboardCard,
                isMe && styles.currentPlayerCard,
              ]}
            >
              <View style={styles.row}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankText}>#{player.rank}</Text>
                </View>

                <Text style={styles.avatar}>
                  {player.avatar || '🦊'}
                </Text>

                <View style={styles.flex}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {player.name || 'Mag-aaral'}
                    </Text>

                    {isMe ? <Text style={styles.meBadge}>Ikaw</Text> : null}
                  </View>

                  <Text style={styles.meta}>
                    Baitang {player.gradeLevel || '-'}
                  </Text>
                </View>

                <View style={styles.scoreBox}>
                  <Text style={styles.xp}>
                    ⚡ {player.xp || 0}
                  </Text>

                  {Number(player.currentStreak || 0) > 0 ? (
                    <Text style={styles.streak}>
                      🔥 {player.currentStreak}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    );
  }

  function renderBody() {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.green} />
          <Text style={styles.loadingText}>
            Ina-load ang talaan ng ranggo...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <Card style={styles.messageCard}>
          <Text style={styles.errorTitle}>May problema sa pag-load</Text>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      );
    }

    if (!leaderboard.length) {
      return (
        <Card style={styles.messageCard}>
          <Text style={styles.emptyTitle}>Wala pang talaan ng ranggo</Text>
          <Text style={styles.emptyText}>
            Kumpletuhin ang mga aralin para makita ang ranggo ng mga mag-aaral.
          </Text>
        </Card>
      );
    }

    return (
      <Animated.View style={entranceStyle}>
        {renderPodium()}
        {renderRestList()}
      </Animated.View>
    );
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
          <Text style={styles.subtitle}>
            Tingnan ang ranggo ng mga mag-aaral batay sa XP.
          </Text>
        </View>

        {renderBody()}

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

  podiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingTop: 16,
    paddingHorizontal: 14,
    paddingBottom: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },


  podiumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },

  podiumTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
  },

  podiumSubtitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  podiumBadge: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    overflow: 'hidden',
    fontWeight: '900',
    fontSize: 12,
  },

  podiumStageWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 0,
  },

  podiumStage: {
    minHeight: 240,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
  },

  podiumPlayer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  firstPodiumPlayer: {
    marginBottom: 0,
  },

  emptyPodiumSlot: {
    width: '32%',
  },

  crown: {
    fontSize: 25,
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.14)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  podiumAvatar: {
    marginBottom: 6,
    textShadowColor: 'rgba(15,23,42,0.16)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },

  podiumNameRow: {
    minHeight: 24,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  podiumName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },

  firstPodiumName: {
    color: '#16A34A',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },

  podiumMeBadge: {
    marginTop: 4,
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 10,
    fontWeight: '900',
  },

  podiumXp: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
    marginBottom: 10,
  },

  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },


  firstPodiumBlock: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },

  secondPodiumBlock: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },

  thirdPodiumBlock: {
    backgroundColor: '#FFEDD5',
    borderColor: '#F97316',
  },

  podiumMedal: {
    fontSize: 30,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  list: {
    gap: 10,
  },

  leaderboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
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

  rankCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    marginRight: 12,
  },

  rankText: {
    color: '#475569',
    fontWeight: '900',
    fontSize: 15,
  },

  avatar: {
    fontSize: 30,
    width: 46,
    textAlign: 'center',
    marginRight: 12,
  },

  flex: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  name: {
    flex: 1,
    fontWeight: '900',
    fontSize: 16,
    color: '#0F172A',
  },

  meBadge: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '900',
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

  streak: {
    textAlign: 'right',
    color: '#EA580C',
    fontWeight: '800',
    marginTop: 5,
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

  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },

  errorTitle: {
    color: '#991B1B',
    fontWeight: '900',
    fontSize: 16,
  },

  errorText: {
    color: '#B91C1C',
    marginTop: 8,
    fontWeight: '700',
    lineHeight: 20,
  },

  emptyTitle: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 16,
  },

  emptyText: {
    color: '#64748B',
    marginTop: 8,
    fontWeight: '700',
    lineHeight: 20,
  },
});
