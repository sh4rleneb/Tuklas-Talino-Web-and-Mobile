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


import {
  getLetterPopAttemptItems,
} from './data/letterPopData';

import MissionProgressCard from '../components/MissionProgressCard';
import MissionQuestionCard from '../components/MissionQuestionCard';

export default function LetterPopGame({
  activity,
  submitting,
  onMissionComplete,
}) {
  const gradeLevel = Number(activity?.gradeLevel || 1);

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);

  const [selected, setSelected] = useState('');
  const [toast, setToast] = useState(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setQuestions(
      getLetterPopAttemptItems(gradeLevel)
    );
    setIndex(0);
  }, [gradeLevel]);

  const question = questions[index];

  const handleChoice = (choice) => {
    if (submitting || completed) {
      return;
    }

    setSelected(choice);

    if (choice === question.answer) {
      setToast('🎉 Tama!');

      if (index === questions.length - 1) {
        setCompleted(true);

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
        setIndex((current) => current + 1);
      }, 500);

      return;
    }

    setToast('❌ Subukan muli!');

    setTimeout(() => {
      setSelected('');
      setToast(null);
    }, 700);
  };

  if (completed) {
    return (
      <View style={styles.container}>
        <Text style={styles.complete}>
          🎉 Ang galing!
        </Text>

        <Text style={styles.completeSubtext}>
          Natapos mo ang lahat ng hamon sa Pagpili ng Titik.
        </Text>
      </View>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MissionProgressCard
        label="Tanong"
        current={index + 1}
        total={questions.length}
      />

      <MissionQuestionCard
        title="Kumpletuhin ang Salita"
      >
        {question.prompt}
      </MissionQuestionCard>

      <Text style={styles.subtitle}>
        Piliin ang tamang pantig.
      </Text>

      <View style={styles.balloonGrid}>
        {question.choices.map((choice) => {
          const active = selected === choice;

          return (
            <TouchableOpacity
              key={choice}
              disabled={submitting}
              onPress={() => handleChoice(choice)}
              style={[
                styles.balloon,
                active && styles.balloonSelected,
              ]}
            >
              <Text style={styles.balloonText}>
                🎈
              </Text>

              <Text style={styles.balloonLabel}>
                {choice}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
    alignItems: 'center',
    paddingVertical: 40,
  },


  subtitle: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 18,
    textAlign: 'center',
  },

  balloonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  balloon: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F472B6',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  balloonSelected: {
    backgroundColor: '#22C55E',
  },

  balloonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 22,
  },

  balloonLabel: {
    marginTop: 6,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 22,
  },

  complete: {
    marginTop: 40,
    fontSize: 30,
    fontWeight: '900',
    color: '#16A34A',
    textAlign: 'center',
  },

  completeSubtext: {
    marginTop: 12,
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  toast: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
