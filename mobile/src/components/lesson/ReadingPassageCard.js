import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function getActivityPassage(activity, lesson) {
  const candidates = [
    activity?.passage,
    activity?.readingPassage,
    activity?.story,
    activity?.content,
    activity?.instructions,
    activity?.dataJson?.passage,
    activity?.dataJson?.readingPassage,
    activity?.dataJson?.story,
    activity?.dataJson?.content,
    activity?.dataJson?.text,
    activity?.dataJson?.body,
    activity?.dataJson?.context,
    activity?.dataJson?.lessonText,
    activity?.questions?.[0]?.passage,
    activity?.questions?.[0]?.context,
    activity?.questions?.[0]?.readingText,
    lesson?.passage,
    lesson?.readingPassage,
    lesson?.story,
    lesson?.content,
    lesson?.description,
    lesson?.dataJson?.passage,
    lesson?.dataJson?.readingPassage,
    lesson?.dataJson?.story,
    lesson?.dataJson?.content,
    lesson?.dataJson?.text,
    lesson?.dataJson?.body,
    lesson?.dataJson?.context,
  ];

  const passage = candidates.find(
    value => typeof value === 'string' && value.trim().length >= 20
  );

  return passage?.trim() || '';
}

export default function ReadingPassageCard({ activity, lesson }) {
  const passage = getActivityPassage(activity, lesson);

  if (!passage) return null;

  const title =
    activity?.type === 'writing'
      ? '✍️ Gabay sa pagsulat'
      : activity?.type === 'speech'
        ? '🎤 Basahin at bigkasin'
        : '📖 Basahin ang teksto';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{passage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
  },
});
