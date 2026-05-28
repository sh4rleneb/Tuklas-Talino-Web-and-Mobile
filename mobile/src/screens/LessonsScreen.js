import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function LessonsScreen({ navigation }) {
  const [lessons, setLessons] = useState([]);

  useFocusEffect(useCallback(() => {
    api('/students/dashboard').then(data => setLessons(data.lessons));
  }, []));

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Lessons</Text>
      {lessons.map(lesson => (
        <Pressable key={lesson.id} onPress={() => navigation.navigate('LessonDetail', { id: lesson.id })}>
          <Card>
            <Text style={styles.lesson}>{lesson.completed ? '✅' : '📘'} {lesson.title}</Text>
            <Text style={styles.muted}>{lesson.subject} • Grade {lesson.gradeLevel} • {lesson.xpReward} XP</Text>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, marginBottom: 12 },
  lesson: { fontWeight: '900', fontSize: 17, color: colors.ink },
  muted: { color: colors.muted, marginTop: 4 }
});
