import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MissionHeader({
  title,
  subtitle,
  icon = '🎮',
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>

      <Text style={styles.title}>
        {title}
      </Text>

      {!!subtitle && (
        <Text style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 24,
  },

  icon: {
    fontSize: 48,
    marginBottom: 10,
  },

  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },

  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 15,
  },
});
