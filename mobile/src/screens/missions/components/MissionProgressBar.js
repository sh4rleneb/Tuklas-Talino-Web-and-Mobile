import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function MissionProgressBar({
  progress = 0,
}) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.max(
              0,
              Math.min(100, progress)
            )}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
});
