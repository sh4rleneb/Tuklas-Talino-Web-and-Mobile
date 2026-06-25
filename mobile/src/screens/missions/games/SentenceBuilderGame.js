import React, {
  useEffect,
  useMemo,
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
  getSentenceBuilderAttemptItems,
} from './data/sentenceBuilderData';

export default function SentenceBuilderGame({
  mission,
  submitting,
  onMissionComplete,
}) {
  const gradeLevel = Number(mission.gradeLevel);

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [shuffledWords, setShuffledWords] = useState([]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    setQuestions(
      getSentenceBuilderAttemptItems(gradeLevel)
    );
    setIndex(0);
    setSelectedWords([]);
    setLocked(false);
    setToast(null);
  }, [gradeLevel]);

  const question = questions[index];

  useEffect(() => {
    if (!question) {
      return;
    }

    const words = [...question.words];

    for (let i = words.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }

    setShuffledWords(words);
  }, [question]);

  const builtSentence = useMemo(
    () => selectedWords.join(' '),
    [selectedWords]
  );

  if (!question) {
    return null;
  }

  const handleWordPress = (word) => {
    if (locked || submitting) {
      return;
    }

    setSelectedWords((current) => [
      ...current,
      word,
    ]);
  };

  const handleUndo = () => {
    setSelectedWords((current) =>
      current.slice(0, -1)
    );
  };

  const handleClear = () => {
    setSelectedWords([]);
  };

  const handleCheck = () => {
    if (locked || submitting) {
      return;
    }

    setLocked(true);

    if (
      `${builtSentence}.` === question.answer
    ) {
      setToast('🎉 Tama!');

      if (index === questions.length - 1) {
        setTimeout(() => {
          onMissionComplete({
            forceComplete: true,
          });
        }, 600);

        return;
      }

      setTimeout(() => {
        setSelectedWords([]);
        setToast(null);
        setLocked(false);
        setIndex((current) => current + 1);
      }, 700);

      return;
    }

    setToast('❌ Subukan muli!');

    setTimeout(() => {
      setSelectedWords([]);
      setToast(null);
      setLocked(false);
    }, 700);
  };

  return (
    <View>

      <MissionProgressCard
        label="Question"
        current={index + 1}
        total={questions.length}
      />

      <MissionQuestionCard
        title="Build the Sentence"
      >
        {builtSentence || 'Tap the words below'}
      </MissionQuestionCard>

      <View style={styles.words}>
        {shuffledWords.map((word) => (
          <TouchableOpacity
            key={word}
            disabled={
              locked ||
              submitting ||
              selectedWords.includes(word)
            }
            onPress={() => handleWordPress(word)}
            style={styles.word}
          >
            <Text style={styles.wordText}>
              {word}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          disabled={
            submitting ||
            locked ||
            selectedWords.length === 0
          }
          onPress={handleUndo}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            ↩ Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={
            submitting ||
            locked ||
            selectedWords.length === 0
          }
          onPress={handleClear}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            ✕ Clear
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        disabled={
          submitting ||
          locked ||
          selectedWords.length !== question.words.length
        }
        style={styles.button}
        onPress={handleCheck}
      >
        <Text style={styles.buttonText}>
          Check Answer
        </Text>
      </TouchableOpacity>

      {toast && (
        <Text style={styles.toast}>
          {toast}
        </Text>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },

  word: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    margin: 6,
  },

  wordText: {
    fontWeight: '800',
    fontSize: 18,
    color: '#1E3A8A',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  secondaryButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 16,
  },

  button: {
    marginTop: 24,
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },

  toast: {
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
  },
});
