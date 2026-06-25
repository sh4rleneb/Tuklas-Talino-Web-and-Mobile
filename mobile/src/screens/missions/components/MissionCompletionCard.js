import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function MissionCompletionCard({
  title = '🎉 Great Job!',
  message = 'Mission completed successfully.',
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: '#16A34A',
    textAlign: 'center',
  },

  message: {
    marginTop: 10,
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
  },
});
