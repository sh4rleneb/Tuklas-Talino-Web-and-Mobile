import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function normalizeGameChoiceText(value) {
  if (!value) return '';

  if (typeof value === 'object') {
    value = value.text ?? value.word ?? value.label ?? value.value ?? value.answer ?? value.correctAnswer ?? '';
  }

  return String(value || '')
    .replace(/[_{}\[\]<>]/g, ' ')
    .replace(/[^\p{L}\p{N}'’ -]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeGameChoices(values = [], correctAnswer = '') {
  const seen = new Set();
  const normalized = [];

  const addChoice = (value) => {
    const word = normalizeGameChoiceText(value);
    const key = word.toLowerCase();

    if (!word || word.length > 40 || seen.has(key)) return;
    if (!/[\p{L}\p{N}]/u.test(word)) return;

    seen.add(key);
    normalized.push(word);
  };

  if (Array.isArray(values)) values.forEach(addChoice);
  else addChoice(values);

  addChoice(correctAnswer);

  return normalized;
}


export default function FillInBlankGame({
  rubric = {},
  submitting = false,
  onSubmit,
}) {
  const correctAnswer = normalizeGameChoiceText(rubric.correctAnswer || rubric.answer || rubric.correct || '');
  const choices = useMemo(
    () => normalizeGameChoices(rubric.choices || rubric.wordBank || [], correctAnswer),
    [rubric, correctAnswer]
  );
  const template = String(rubric.template || '');

  const [selected, setSelected] = useState('');
  const [correct, setCorrect] = useState(false);
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState('');

  const preview = useMemo(() => {
    return template.replace(/_{2,}|\[blank\]/gi, selected || '____');
  }, [template, selected]);

  function checkAnswer(value) {
    const ok =
      String(value).trim().toLowerCase() ===
      correctAnswer.trim().toLowerCase();

    setCorrect(ok);
  }

  function handleSelect(choice) {
    if (locked || submitting) return;

    setSelected(choice);
    checkAnswer(choice);
  }

  function reset() {
    if (locked) return;
    setSelected('');
    setCorrect(false);
    setStatus('');
  }

  function submit() {
    setStatus('Isinusumite...');

    if (correct) {
      setLocked(true);
      setStatus('🎉 Tamang Sagot!');
    } else {
      setStatus('❌ Subukan muli');
    }

    onSubmit?.(selected);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🧩 Kumpletuhin ang Pangungusap</Text>

      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{preview}</Text>
      </View>

      <Text style={styles.subtitle}>Piliin ang tamang sagot</Text>

      <View style={styles.choiceRow}>
        {choices.map((choice, index) => (
          <TouchableOpacity
            key={`${choice}-${index}`}
            style={[
              styles.choice,
              selected === choice && styles.choiceSelected,
            ]}
            onPress={() => handleSelect(choice)}
            disabled={submitting || locked}
          >
            <Text
              style={[
                styles.choiceText,
                selected === choice && styles.choiceTextSelected,
              ]}
            >
              {choice}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected ? (
        correct ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>🌟 Ang Husay Mo! 🌟</Text>
            <Text style={styles.successSentence}>{preview}</Text>

            <TouchableOpacity style={styles.button} onPress={submit}>
              <Text style={styles.buttonText}>⭐ +1 Bituin!</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>🙂 Hindi pa. Subukan muli!</Text>

            <TouchableOpacity style={styles.button} onPress={reset}>
              <Text style={styles.buttonText}>Subukang Muli</Text>
            </TouchableOpacity>
          </View>
        )
      ) : null}

      {status ? (
        <Text style={styles.status}>{status}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
  },
  previewBox: {
    backgroundColor: '#FFF7D6',
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },
  previewText: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  choice: {
    width: '48%',
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  choiceText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  choiceTextSelected: {
    color: '#166534',
  },
  successBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSentence: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '700',
  },
  errorBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
  },
  errorText: {
    textAlign: 'center',
    fontWeight: '900',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#22C55E',
    padding: 14,
    borderRadius: 14,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '900',
  },
  status: {
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '800',
  },
});
