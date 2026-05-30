import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

export default function ModulesScreen() {
  const modules = [
    {
      id: 1,
      title: 'Pagbasa',
      description:
        'Reading and comprehension activities.',
      emoji: '📖',
      xp: 25,
      progress: '70%',
      difficulty: 'Easy',
    },

    {
      id: 2,
      title: 'Bokabularyo',
      description:
        'Word building and vocabulary games.',
      emoji: '✏️',
      xp: 30,
      progress: '40%',
      difficulty: 'Medium',
    },

    {
      id: 3,
      title: 'Pagsusulit',
      description:
        'Interactive quizzes and exercises.',
      emoji: '🧠',
      xp: 50,
      progress: '15%',
      difficulty: 'Hard',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.header}>
        📚 Learning Modules
      </Text>

      <Text style={styles.sub}>
        Piliin ang aralin na gusto mong
        simulan.
      </Text>

      {modules.map((module) => (
        <TouchableOpacity
          key={module.id}
          style={styles.card}
          onPress={() =>
            alert(
              `${module.title} opened`
            )
          }
        >
          <View style={styles.topRow}>
            <Text style={styles.emoji}>
              {module.emoji}
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {module.difficulty}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>
            {module.title}
          </Text>

          <Text style={styles.description}>
            {module.description}
          </Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      module.progress,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {module.progress}
            </Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.xp}>
              ⭐ +{module.xp} XP
            </Text>

            <TouchableOpacity
              style={styles.startButton}
            >
              <Text
                style={
                  styles.startButtonText
                }
              >
                Start →
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    padding: 20,
  },

  header: {
    marginTop: 55,
    fontSize: 34,
    fontWeight: '900',
    color: '#166534',
  },

  sub: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    marginBottom: 20,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  emoji: {
    fontSize: 40,
  },

  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  badgeText: {
    color: '#166534',
    fontWeight: '700',
  },

  title: {
    marginTop: 18,
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },

  description: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 26,
    color: '#6B7280',
  },

  progressContainer: {
    marginTop: 22,
  },

  progressBar: {
    height: 14,
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  progressText: {
    marginTop: 8,
    color: '#166534',
    fontWeight: '700',
  },

  bottomRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  xp: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
  },

  startButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },

  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});