import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function MissionProgressCard({
  current,
  total,
  label = 'Pag-unlad',
}) {
  const progress =
    Math.max(
      0,
      Math.min(current / Math.max(total, 1), 1)
    );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {label}
        </Text>

        <Text style={styles.value}>
          {current}/{total}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },

  value: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },

  track: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },

  fill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },
});
