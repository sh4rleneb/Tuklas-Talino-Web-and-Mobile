import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function buildWordPowerUps(activity = {}) {
  const words = new Set();

  const rubric = activity.writingTask?.rubricJson || {};

  [
    rubric.correctAnswer,
    ...(rubric.correctAnswers || []),
    ...(rubric.acceptedAnswers || []),
    ...(rubric.correctWords || []),
    ...(rubric.wordBank || []),
    ...(rubric.choices || []),
  ].forEach((value) => {
    if (!value) return;

    if (typeof value === "string") {
      words.add(value.trim());
      return;
    }

    if (typeof value === "object") {
      words.add(
        String(
          value.text ??
          value.word ??
          value.label ??
          ""
        ).trim()
      );
    }
  });

  const collect = (value) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (typeof value === 'string') {
      value
        .split(/\s+/)
        .map((word) => word.replace(/[^\p{L}\p{N}-]/gu, '').trim())
        .filter((word) => word.length >= 3)
        .forEach((word) => words.add(word));
    }
  };

  if (words.size) {
    return [...words];
  }

  collect(activity.instructions);
  collect(activity.content);
  collect(activity.passage);
  collect(activity.story);
  collect(activity.writingTask?.prompt);

  return [...words].slice(0, 12);
}

export default function PowerUpTray({
  visible,
  activity,
  selectedWords,
  onSelectionChange,
}) {
  if (!visible || !activity) return null;

  const words = buildWordPowerUps(activity);
  if (!words.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📝 Word Bank</Text>

      <Text style={styles.subtitle}>
        Tap a word to drop it into your answer.
      </Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>📈 Your Progress</Text>

        <Text style={styles.progressSubtitle}>
          Choose 3 words to complete the sentence.
        </Text>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  (selectedWords.length / 3) * 100
                )}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          📝 {selectedWords.length}/3 Words Chosen
        </Text>
      </View>

      <View style={styles.choiceRow}>
        {words.map((word, index) => (
          <TouchableOpacity
            key={`${word}-${index}`}
            style={[
              styles.choiceChip,
              selectedWords.includes(word) && styles.choiceChipSelected,
            ]}
            onPress={() => {
              const exists = selectedWords.includes(word);

              const next = exists
                ? selectedWords.filter((w) => w !== word)
                : [...selectedWords, word];

              onSelectionChange(next);
            }}
          >
            <Text
              style={[
                styles.choiceText,
                selectedWords.includes(word) && styles.choiceTextSelected,
              ]}
            >
              ✨ {word}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 2,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  title: {
    color: '#92400E',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 6,
  },
  progressSubtitle: {
    color: '#475569',
    marginBottom: 10,
  },
  progressBar: {
    height: 14,
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '900',
    color: '#15803D',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  choiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  choiceChipSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#15803D',
  },
  choiceText: {
    fontWeight: '700',
    color: '#334155',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
});
