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

console.log('RN CHECK', {
  ActivityIndicator: !!ActivityIndicator,
  ScrollView: !!ScrollView,
  StyleSheet: !!StyleSheet,
  Text: !!Text,
  TouchableOpacity: !!TouchableOpacity,
  View: !!View,
  SafeAreaView: !!SafeAreaView,
});


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

    return () => { active = false; };
  }, [lessonId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Nilo-load ang aralin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Hindi nakita ang aralin.'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Bumalik</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progress = lesson.progress || null;
  const isCompleted = progress?.status === 'completed';
  const progressPercent = isCompleted ? 100 : (progress?.percent || 0);
  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  const activityCount = activities.length;
  const layunin = lesson.layunin || lesson.instructions || '';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Aklatan ng mga Aralin</Text>
        </TouchableOpacity>

        <View style={styles.pill}>
          <Text style={styles.pillText}>
            Baitang {lesson.gradeLevel} • {lesson.subject || 'Filipino'}
          </Text>
        </View>

        <Text style={styles.title}>{lesson.title}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{activityCount}</Text>
            <Text style={styles.statLabel}>{activityCount === 1 ? 'Gawain' : 'Mga Gawain'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⚡</Text>
            <Text style={styles.statValue}>+{lesson.xpReward || 0}</Text>
            <Text style={styles.statLabel}>Gantimpalang XP</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>{isCompleted ? '✅' : '📊'}</Text>
            <Text style={styles.statValue}>{progressPercent}%</Text>
            <Text style={styles.statLabel}>{isCompleted ? 'Tapos Na' : 'Pag-unlad'}</Text>
          </View>
        </View>

        {progressPercent > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}

        {!!layunin && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>🎯 Layunin</Text>
            <Text style={styles.cardBody}>{layunin}</Text>
          </View>
        )}

        {!layunin && !!lesson.description && (
          <View style={styles.card}>
            <Text style={styles.cardHeading}>📖 Tungkol sa Lesson</Text>
            <Text style={styles.cardBody}>{lesson.description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, isCompleted && styles.buttonReview]}
          onPress={() => navigation.navigate('StudentJuniorLessonDetail', { lessonId, homeRoute })}
        >
          <Text style={styles.buttonText}>
            {isCompleted ? '🔁 Balikan ang Lesson' : progressPercent > 0 ? '▶ Ipagpatuloy ang Aralin' : '▶ Simulan ang Aralin'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, color: '#64748B', fontWeight: '700' },
  errorText: { color: '#EF4444', fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  page: { padding: 20, paddingBottom: 40 },

  backRow: { marginBottom: 16 },
  backText: { color: '#22C55E', fontWeight: '900', fontSize: 15 },

  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 10,
  },
  pillText: { color: '#166534', fontWeight: '800', fontSize: 13 },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 34,
    marginBottom: 20,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },

  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: { fontWeight: '900', fontSize: 17, marginBottom: 8, color: '#0F172A' },
  cardBody: { color: '#475569', lineHeight: 22, fontSize: 15 },

  button: {
    marginTop: 8,
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonReview: { backgroundColor: '#3B82F6' },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 17 },

  backBtn: { marginTop: 12, padding: 12 },
  backBtnText: { color: '#22C55E', fontWeight: '900', fontSize: 15 },
});
