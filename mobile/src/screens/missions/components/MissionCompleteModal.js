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

      <TouchableOpacity
        style={styles.button}
        onPress={onReplay}
      >
        <Text style={styles.buttonText}>
          🔄 Play Again
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondary}
        onPress={onBack}
      >
        <Text style={styles.secondaryText}>
          ← Back to Missions
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
