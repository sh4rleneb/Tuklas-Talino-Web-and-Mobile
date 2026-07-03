import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MissionProgressCard from '../components/MissionProgressCard';
import MissionQuestionCard from '../components/MissionQuestionCard';

export default function MissingLetterGame({
  activity,
  submitting,
  onMissionComplete,
}) {
  const [index, setIndex] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState(null);

  const questions = useMemo(() => {
    const items = activity?.dataJson?.words || [];

    return items.map(w => ({
      word: w.word,
      missingIndex: w.missingIndex,
      choices: w.choices,
    }));
  }, [mission]);

  const current = questions[index];

  const letters = useMemo(() => {
    const arr = current.word.split('');
    arr[current.missingIndex] = '_';
    return arr;
  }, [current]);

  const handleSelect = (letter) => {
    if (locked || submitting) return;
    setSelectedLetter(letter);
  };

  const handleCheck = () => {
    if (locked || submitting) return;

    setLocked(true);

    const correct = current.word[current.missingIndex];

    if (selectedLetter === correct) {
      setToast('🎉 Tama!');

      setTimeout(() => {
        if (index === questions.length - 1) {
          onMissionComplete?.({ forceComplete: true });
          return;
        }

        setIndex(i => i + 1);
        setSelectedLetter(null);
        setLocked(false);
        setToast(null);
      }, 700);
    } else {
      setToast('❌ Subukan muli!');

      setTimeout(() => {
        setSelectedLetter(null);
        setLocked(false);
        setToast(null);
      }, 700);
    }
  };

  return (
    <View>
      <MissionProgressCard
        label="Nawawalang Titik"
        current={index + 1}
        total={questions.length}
      />

      <MissionQuestionCard title="Punan ang Nawawalang Titik">
        <Text style={styles.word}>
          {letters.join(' ')}
        </Text>
      </MissionQuestionCard>

      <View style={styles.choices}>
        {current.choices.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => handleSelect(c)}
            style={[
              styles.choice,
              selectedLetter === c && styles.selected,
            ]}
          >
            <Text style={styles.choiceText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleCheck}
        disabled={!selectedLetter || locked || submitting}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Check Answer</Text>
      </TouchableOpacity>

      {toast && <Text style={styles.toast}>{toast}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  word: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 4,
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 10,
  },
  choice: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 12,
  },
  selected: {
    backgroundColor: '#DCFCE7',
  },
  choiceText: {
    fontSize: 22,
    fontWeight: '900',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '900',
  },
  toast: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
  },
});
