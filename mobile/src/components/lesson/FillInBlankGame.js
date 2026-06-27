import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function FillInBlankGame({
  rubric = {},
  submitting = false,
  onSubmit,
}) {
  const choices = rubric.choices || rubric.wordBank || [];
  const template = rubric.template || '';
  const correctAnswer = String(rubric.correctAnswer || '');

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
    setTimeout(() => checkAnswer(choice), 150);
  }

  function reset() {
    if (locked) return;
    setSelected('');
    setCorrect(false);
    setStatus('');
  }

  function submit() {
    setStatus('Submitting...');

    if (correct) {
      setLocked(true);
      setStatus('🎉 Correct!');
    } else {
      setStatus('❌ Try again');
    }

    onSubmit?.(selected);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🧩 Punan ang Patlang</Text>

      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{preview}</Text>
      </View>

      <Text style={styles.subtitle}>Tapikin ang sagot</Text>

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
            <Text style={styles.successText}>🎉 Great Job!</Text>
            <Text style={styles.successSentence}>{preview}</Text>

            <TouchableOpacity style={styles.button} onPress={submit}>
              <Text style={styles.buttonText}>✅ Ipasa ang Sagot</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ Subukan muli</Text>

            <TouchableOpacity style={styles.button} onPress={reset}>
              <Text style={styles.buttonText}>Burahin</Text>
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
    gap: 10,
    justifyContent: 'center',
  },
  choice: {
    padding: 14,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  choiceSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  choiceText: {
    fontWeight: '800',
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
