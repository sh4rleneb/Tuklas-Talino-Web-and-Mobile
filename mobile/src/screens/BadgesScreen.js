import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function BadgesScreen() {
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);

  useFocusEffect(useCallback(() => {
    api('/students/dashboard').then(d => api(`/students/${d.student.id}/badges`)).then(data => {
      setBadges(data.badges);
      setAllBadges(data.allBadges);
    });
  }, []));

  const owned = new Set(badges.map(b => b.id));

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Badges</Text>
      <View style={styles.grid}>
        {allBadges.map(b => (
          <Card key={b.id} style={[styles.badge, !owned.has(b.id) && styles.locked]}>
            <Text style={styles.icon}>{b.icon}</Text>
            <Text style={styles.name}>{b.name}</Text>
            <Text style={styles.muted}>{owned.has(b.id) ? 'Unlocked' : `${b.xpThreshold} XP`}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { width: '47%', alignItems: 'center' },
  locked: { opacity: .45 },
  icon: { fontSize: 42 },
  name: { textAlign: 'center', fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted, marginTop: 4 }
});
