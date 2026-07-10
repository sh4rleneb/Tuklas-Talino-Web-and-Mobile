import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const COMMON_POWER_UP_WORDS = new Set([
  'ang', 'mga', 'and', 'the', 'for', 'with', 'that', 'this', 'from', 'your', 'you',
  'ng', 'sa', 'si', 'ni', 'na', 'ay', 'at', 'ito', 'iyon', 'muna', 'bago',
  'piliin', 'tamang', 'sagot', 'subukan', 'gawain', 'lesson', 'activity',
  'question', 'answer', 'choice', 'instructions', 'content', 'prompt',
]);

function cleanPowerUpWord(value) {
  if (!value) return '';

  if (typeof value === 'object') {
    value = value.word ?? value.text ?? value.label ?? value.value ?? value.answer ?? value.correctAnswer ?? '';
  }

  const word = String(value || '')
    .replace(/[_{}\[\]<>]/g, ' ')
    .replace(/[^\p{L}\p{N}'’ -]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!word || word.length > 40) return '';
  if (!/[\p{L}\p{N}]/u.test(word)) return '';

  return word;
}

function addPowerUpWord(words, value, { allowCommon = false } = {}) {
  const word = cleanPowerUpWord(value);
  if (!word) return;

  const key = word.toLocaleLowerCase('fil-PH');

  // Teacher-provided rubric words must be preserved, including valid
  // Filipino function words such as "ang", "ng", "sa", and "at".
  if (!allowCommon && COMMON_POWER_UP_WORDS.has(key)) return;

  if (!words.some(
    (existing) => existing.toLocaleLowerCase('fil-PH') === key
  )) {
    words.push(word);
  }
}

function collectPowerUpValues(words, value) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectPowerUpValues(words, item));
    return;
  }

  addPowerUpWord(words, value, { allowCommon: true });
}

function collectFallbackWords(words, value) {
  if (!value || typeof value !== 'string') return;

  value
    .split(/\s+/)
    .forEach((word) => addPowerUpWord(words, word));
}

function buildWordPowerUps(activity = {}) {
  const words = [];
  const rubric = activity.writingTask?.rubricJson || activity.rubricJson || activity.dataJson || {};

  [
    rubric.correctAnswer,
    rubric.answer,
    rubric.correct,
    rubric.targetWord,
    rubric.word,
    rubric.blankWord,
    rubric.correctAnswers,
    rubric.acceptedAnswers,
    rubric.correctWords,
    rubric.wordBank,
    rubric.choices,
    activity.wordBank,
    activity.words,
  ].forEach((value) => collectPowerUpValues(words, value));

  if (words.length) return words.slice(0, 12);

  [
    activity.writingTask?.prompt,
    activity.prompt,
    activity.question,
    activity.title,
  ].forEach((value) => collectFallbackWords(words, value));

  return words.slice(0, 12);
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
      <Text style={styles.title}>📝 Bangko ng mga Salita</Text>

      <Text style={styles.subtitle}>
        Pindutin ang salita upang maidagdag ito sa iyong sagot.
      </Text>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>📈 Iyong Pag-unlad</Text>

        <Text style={styles.progressSubtitle}>
          Pumili ng 3 salita upang mabuo ang pangungusap.
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
          📝 {selectedWords.length}/3 Salitang Napili
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
