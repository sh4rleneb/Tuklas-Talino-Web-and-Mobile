import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function MissionCompleteModal({
  title,
  xp,
  stars,
  attempts,
  achievement,
  badge,
  onReplay,
  onBack,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>🏆</Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.xp}>
        +{xp} XP
      </Text>

      {stars ? (
        <Text style={styles.stars}>
          {stars}
        </Text>
      ) : null}

      {typeof attempts === 'number' ? (
        <Text style={styles.attempts}>
          Mga Pagsubok: {attempts}
        </Text>
      ) : null}

      {badge ? (
        <View style={styles.badgeCard}>
          <Text style={styles.badgeIcon}>
            {badge.icon || '🏅'}
          </Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.badgeLabel}>
              Bagong Badge!
            </Text>

            <Text style={styles.badgeName}>
              {badge.name || 'Bagong Tagumpay'}
            </Text>
          </View>
        </View>
      ) : null}

      {achievement ? (
        <View style={styles.achievementCard}>
          <Text style={styles.achievementTitle}>
            {achievement.title}
          </Text>

          <Text style={styles.achievementMessage}>
            {achievement.message}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.button}
        onPress={onReplay}
      >
        <Text style={styles.buttonText}>
          🔄 Maglaro Muli
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={onBack}
      >
        <Text style={styles.secondaryText}>
          ← Bumalik sa mga Misyon
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },

  icon: {
    fontSize: 54,
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 12,
  },

  xp: {
    fontSize: 34,
    fontWeight: '900',
    color: '#22C55E',
    marginBottom: 24,
  },

  stars: {
    fontSize: 30,
    marginBottom: 8,
  },

  attempts: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 18,
  },

  badgeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
  },

  badgeIcon: {
    fontSize: 34,
    marginRight: 12,
  },

  badgeLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
  },

  badgeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400E',
  },

  achievementCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
    alignItems: 'center',
  },

  achievementTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },

  achievementMessage: {
    fontSize: 15,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 22,
  },

  button: {
    width: '100%',
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 18,
    marginBottom: 14,
    alignItems: 'center',
  },

  secondary: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#22C55E',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFF',
    fontWeight: '900',
  },

  secondaryText: {
    color: '#22C55E',
    fontWeight: '900',
  },
});
