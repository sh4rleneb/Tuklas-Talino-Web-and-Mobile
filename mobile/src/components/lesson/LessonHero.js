import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LessonHero({
  playful,
  student,
  progress,
  lessonsLength,
  clampPercent,
}) {
  return (
    <View style={[styles.hero, playful && styles.heroPlayful]}>
      <Text style={styles.eyebrow}>
        {playful ? 'GAME QUEST MAP' : 'FILIPINO LEARNING HUB'}
      </Text>

      <Text style={styles.title}>
        {playful ? '🎮 Mapa ng Hamon' : '📚 Aklatan ng mga Aralin'}
      </Text>

      <Text style={styles.subtitle}>
        {playful
          ? 'Maglaro ng mga gawaing pampagkatuto sa Filipino, mangolekta ng mga bituin, kumita ng XP, at buksan ang susunod na hamon.'
          : 'Pumili ng paksa, kumita ng XP, at ipagpatuloy ang iyong huling aralin.'}
      </Text>

      <View style={styles.heroStats}>
        <Text style={styles.heroStat}>⚡ {student.xp || 0} XP</Text>
        <Text style={styles.heroStat}>{progress.percent || 0}% tapos</Text>
      </View>

      <View style={styles.overallTrack}>
        <View
          style={[
            styles.overallFill,
            { width: `${clampPercent(progress.percent)}%` },
          ]}
        />
      </View>

      <Text style={styles.progressCount}>
        {progress.completedLessons || 0}/
        {progress.totalLessons || lessonsLength} aralin ang natapos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#FFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
  },
  heroPlayful: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  eyebrow: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 6,
  },
  subtitle: {
    color: '#64748B',
    marginTop: 7,
    lineHeight: 21,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  heroStat: {
    color: '#166534',
    fontWeight: '900',
  },
  overallTrack: {
    height: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 12,
  },
  overallFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 99,
  },
  progressCount: {
    color: '#64748B',
    marginTop: 8,
    fontSize: 12,
  },
});
