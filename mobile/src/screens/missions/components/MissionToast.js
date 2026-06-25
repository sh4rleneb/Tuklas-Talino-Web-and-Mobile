import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MissionToast({
  message,
  type = 'info',
}) {
  if (!message) return null;

  return (
    <View
      style={[
        styles.toast,
        type === 'good'
          ? styles.good
          : type === 'warn'
          ? styles.warn
          : styles.info,
      ]}
    >
      <Text style={styles.text}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },

  info: {
    backgroundColor: '#DBEAFE',
  },

  warn: {
    backgroundColor: '#FDE68A',
  },

  good: {
    backgroundColor: '#DCFCE7',
  },

  text: {
    textAlign: 'center',
    fontWeight: '800',
  },
});
