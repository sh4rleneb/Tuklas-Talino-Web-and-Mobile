import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

function getActivityVisual(activity, lesson) {
  const imageUri =
    activity?.imageUrl ||
    activity?.illustrationUrl ||
    activity?.visualUrl ||
    activity?.dataJson?.imageUrl ||
    activity?.dataJson?.illustrationUrl ||
    activity?.dataJson?.visualUrl ||
    activity?.dataJson?.coverImage ||
    lesson?.imageUrl ||
    lesson?.illustrationUrl ||
    lesson?.dataJson?.imageUrl ||
    lesson?.dataJson?.illustrationUrl;

  if (!imageUri) return null;

  return {
    imageUri,
    emoji: '🖼️',
    title: 'Tingnan ang larawan',
    body: 'Gamitin ang larawan bilang gabay bago sagutin ang gawain.',
  };
}

export default function ActivityVisualCard({ activity, lesson }) {
  if (!activity) return null;

  const visual = getActivityVisual(activity, lesson);

  if (!visual) return null;

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {visual.imageUri ? (
          <Image
            source={{ uri: visual.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.emoji}>{visual.emoji}</Text>
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{visual.title}</Text>
        <Text style={styles.body}>{visual.body}</Text>
      </View>
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
  imageWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  emoji: {
    fontSize: 56,
  },
  copy: {
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
});
