import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function MissionQuestionCard({
  title,
  children,
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>
        {title}
      </Text>

      <Text style={styles.content}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
  },

  content: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
