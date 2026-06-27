import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import MissionProgressCard from '../components/MissionProgressCard';
import MissionQuestionCard from '../components/MissionQuestionCard';

import {
  getPictureGuessAttemptItems,
} from './data/pictureGuessData';

export default function PictureGuessGame({
  activity,
  submitting,
  onMissionComplete,
}) {
  const gradeLevel = Number(activity?.gradeLevel || 1);

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [toast, setToast] = useState(null);

  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setQuestions(getPictureGuessAttemptItems(gradeLevel));
    setIndex(0);
    setSelected('');
    setToast(null);
    setLocked(false);
  }, [gradeLevel]);

  const question = questions[index];

  const handleChoice = (choice) => {
    if (submitting || locked) {
      return;
    }

    setLocked(true);
    setSelected(choice);

    if (choice === question.answer) {
      setToast('🎉 Tama!');

      if (index === questions.length - 1) {
        setTimeout(() => {
          onMissionComplete({
            forceComplete: true,
          });
        }, 500);

        return;
      }

      setTimeout(() => {
        setSelected('');
        setToast(null);
        setLocked(false);
        setIndex((current) => current + 1);
      }, 500);

      return;
    }

    setToast('❌ Subukan muli!');

    setTimeout(() => {
      setSelected('');
      setToast(null);
      setLocked(false);
    }, 700);
  };

  if (!question) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MissionProgressCard
        label="Question"
        current={index + 1}
        total={questions.length}
      />

      <MissionQuestionCard
        title="Picture Guess"
      >
        {question.emoji}
      </MissionQuestionCard>

      <Text style={styles.subtitle}>
        Piliin ang tamang salita.
      </Text>

      {question.choices.map((choice) => {
        const active = selected === choice;

        return (
          <TouchableOpacity
            key={choice}
            disabled={submitting}
            onPress={() => handleChoice(choice)}
            style={[
              styles.choice,
              active && styles.choiceSelected,
            ]}
          >
            <Text style={styles.choiceText}>
              {choice}
            </Text>
          </TouchableOpacity>
        );
      })}

      {toast && (
        <Text style={styles.toast}>
          {toast}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },

  subtitle: {
    marginBottom: 18,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },

  choice: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 18,
    marginBottom: 14,
    alignItems: 'center',
  },

  choiceSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  choiceText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  toast: {
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 18,
  },
});
