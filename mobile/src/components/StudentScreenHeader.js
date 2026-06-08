import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function StudentScreenHeader({
  navigation,
  avatar = '🧒',
  gradeLevel,
}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </TouchableOpacity>

      <View style={styles.studentChip}>
        <Text style={styles.avatar}>
          {avatar}
        </Text>

        <Text style={styles.studentChipText}>
          Grade {gradeLevel || '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  backButton: {
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  backText: {
    color: '#16A34A',
    fontWeight: '900',
  },

  studentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  avatar: {
    fontSize: 20,
    marginRight: 6,
  },

  studentChipText: {
    color: '#166534',
    fontWeight: '900',
  },
});