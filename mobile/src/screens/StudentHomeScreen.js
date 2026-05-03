import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function StudentHomeScreen() {
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setData(await api('/students/dashboard')); } finally { setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!data) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.screen} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Card style={styles.welcome}>
        <Text style={styles.avatar}>{data.student.avatar}</Text>
        <Text style={styles.title}>Kumusta, {data.student.name}!</Text>
        <Text style={styles.muted}>Grade {data.student.gradeLevel} • {data.student.section}</Text>
      </Card>
      <View style={styles.stats}>
        <Card style={styles.stat}><Text style={styles.statNumber}>{data.student.xp}</Text><Text>XP</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNumber}>{data.level}</Text><Text>Level</Text></Card>
        <Card style={styles.stat}><Text style={styles.statNumber}>{data.progress.percent}%</Text><Text>Progress</Text></Card>
      </View>
      <Text style={styles.heading}>Recommended</Text>
      {data.lessons.slice(0, 5).map(lesson => (
        <Card key={lesson.id}>
          <Text style={styles.lessonTitle}>{lesson.completed ? '✅ ' : '📘 '}{lesson.title}</Text>
          <Text style={styles.muted}>{lesson.subject} • {lesson.xpReward} XP</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { alignItems: 'center', backgroundColor: '#fff7de' },
  avatar: { fontSize: 64 },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink, textAlign: 'center' },
  muted: { color: colors.muted },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '900', color: colors.primary },
  heading: { fontSize: 20, fontWeight: '900', marginVertical: 10, color: colors.ink },
  lessonTitle: { fontSize: 16, fontWeight: '900', color: colors.ink }
});
