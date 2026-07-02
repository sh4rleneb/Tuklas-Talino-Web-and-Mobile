import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';

export default function LessonDashboardScreen({ navigation, route }) {
  const { lessonId, homeRoute } = route.params || {};

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api(`/lessons/${lessonId}`)
      .then((data) => {
        if (!active) return;

        setLesson(data.lesson || null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Unable to load lesson.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [lessonId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.subject}>
          {lesson?.subject || 'Filipino'}
        </Text>

        <Text style={styles.title}>
          {lesson?.title}
        </Text>

        <Text style={styles.xp}>
          ⭐ {lesson?.xpReward || 0} XP
        </Text>

        {lesson?.layunin ? (
          <View style={styles.card}>
            <Text style={styles.heading}>🎯 Layunin</Text>
            <Text style={styles.body}>
              {lesson.layunin}
            </Text>
          </View>
        ) : null}

        {lesson?.description ? (
          <View style={styles.card}>
            <Text style={styles.heading}>📖 Paglalarawan</Text>
            <Text style={styles.body}>
              {lesson.description}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate(
              'StudentJuniorLessonDetail',
              {
                lessonId,
                homeRoute,
              }
            )
          }
        >
          <Text style={styles.buttonText}>
            ▶ Start / Continue Lesson
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  page: {
    padding: 20,
  },
  subject: {
    color: '#16A34A',
    fontWeight: '800',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  xp: {
    marginTop: 8,
    marginBottom: 20,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  heading: {
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 10,
  },
  body: {
    color: '#475569',
    lineHeight: 22,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 17,
  },
});
