import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const DEFAULT_SENTENCE_QUESTIONS = [
  {
    id: 'sentence-builder-ako-ay-bata',
    sentence: 'Ako ay bata',
    choices: ['bata', 'Ako', 'ay'],
  },
  {
    id: 'sentence-builder-ito-ay-bola',
    sentence: 'Ito ay bola',
    choices: ['bola', 'Ito', 'ay'],
  },
  {
    id: 'sentence-builder-si-ana-ay-masaya',
    sentence: 'Si Ana ay masaya',
    choices: ['masaya', 'Si', 'Ana', 'ay'],
  },
];

function getWordLabel(value) {
  if (typeof value === 'string') {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  return String(
    value.label ??
      value.text ??
      value.word ??
      value.value ??
      value.title ??
      ''
  ).trim();
}

function wordsFrom(value) {
  if (Array.isArray(value)) {
    return value
      .map(getWordLabel)
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeSentenceQuestion(rawQuestion = {}, index = 0) {
  const sentence = String(
    rawQuestion.sentence ??
      rawQuestion.correctSentence ??
      rawQuestion.answer ??
      rawQuestion.correctAnswer ??
      rawQuestion.phrase ??
      rawQuestion.prompt ??
      DEFAULT_SENTENCE_QUESTIONS[index % DEFAULT_SENTENCE_QUESTIONS.length].sentence
  ).trim();

  const targetWords = wordsFrom(
    rawQuestion.targetWords ??
      rawQuestion.correctWords ??
      rawQuestion.answerWords ??
      sentence
  );

  const fallbackChoices =
    DEFAULT_SENTENCE_QUESTIONS[index % DEFAULT_SENTENCE_QUESTIONS.length].choices;

  const choices = wordsFrom(
    rawQuestion.choices ??
      rawQuestion.words ??
      rawQuestion.options ??
      rawQuestion.wordBank ??
      fallbackChoices
  );

  const finalTargetWords = targetWords.length
    ? targetWords
    : wordsFrom(sentence);

  const finalChoices = choices.length
    ? choices
    : [...finalTargetWords].reverse();

  return {
    id:
      rawQuestion.id ||
      rawQuestion.key ||
      `sentence-builder-question-${index + 1}`,
    title: rawQuestion.title || 'Buuin ang pangungusap',
    instruction:
      rawQuestion.instruction ||
      rawQuestion.subtitle ||
      'Buuin ang simpleng pangungusap.',
    sentence,
    targetWords: finalTargetWords,
    choices: finalChoices.map((word, wordIndex) => ({
      id: `${rawQuestion.id || index}-${word}-${wordIndex}`,
      label: word,
    })),
  };
}

function getSentenceQuestions(mission = {}) {
  const rawQuestions =
    mission.attemptQuestions ||
    mission.questions ||
    mission.questionPool ||
    mission.items ||
    [];

  const rows = Array.isArray(rawQuestions) && rawQuestions.length
    ? rawQuestions
    : DEFAULT_SENTENCE_QUESTIONS;

  return rows.map(normalizeSentenceQuestion);
}

function SentenceBuilderGame({
  mission = {},
  onMissionComplete,
  onComplete,
  onSuccess,
  onSubmit,
  onBack,
}) {
  const navigation = useNavigation();

  const handleBackToMissions = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const questions = useMemo(
    () => getSentenceQuestions(mission),
    [mission]
  );

  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedWords, setSelectedWords] = useState([]);
  const [feedback, setFeedback] = useState('');

  const currentQuestion =
    questions[questionIndex] ||
    normalizeSentenceQuestion(DEFAULT_SENTENCE_QUESTIONS[0], 0);

  useEffect(() => {
    setQuestionIndex(0);
    setSelectedWords([]);
    setFeedback('');
  }, [
    mission?.id,
    mission?.missionId,
    mission?.questionPoolAttemptNo,
    mission?.questionSetAttemptNo,
  ]);

  useEffect(() => {
    setSelectedWords([]);
    setFeedback('');
  }, [questionIndex]);

  const selectedIds = selectedWords.map((word) => word.id);

  const remainingChoices = currentQuestion.choices.filter(
    (choice) => !selectedIds.includes(choice.id)
  );

  const isComplete =
    selectedWords.length === currentQuestion.targetWords.length;

  const selectedSentence = selectedWords
    .map((word) => word.label)
    .join(' ');

  const targetSentence = currentQuestion.targetWords.join(' ');

  const isCorrect =
    isComplete &&
    selectedSentence.trim().toLowerCase() ===
      targetSentence.trim().toLowerCase();

  const handleWordPress = (word) => {
    if (selectedWords.length >= currentQuestion.targetWords.length) {
      return;
    }

    setSelectedWords((value) => [...value, word]);
    setFeedback('');
  };

  const handleSlotPress = (wordId) => {
    setSelectedWords((value) => value.filter((word) => word.id !== wordId));
    setFeedback('');
  };

  const handleClear = () => {
    setSelectedWords([]);
    setFeedback('');
  };

  const handleCheck = async () => {
    if (!isComplete) {
      setFeedback('Piliin muna ang lahat ng salita.');
      return;
    }

    if (!isCorrect) {
      setFeedback('Subukan ulit. Ayusin ang pagkakasunod-sunod ng mga salita.');
      return;
    }

    if (questionIndex < questions.length - 1) {
      setFeedback('Tama! Sunod na pangungusap.');
      setTimeout(() => {
        setQuestionIndex((value) => value + 1);
      }, 450);
      return;
    }

    setFeedback('Mahusay! Nabuo mo ang pangungusap.');

    const complete =
      onMissionComplete ||
      onComplete ||
      onSuccess ||
      onSubmit;

    if (typeof complete === 'function') {
      await complete({
        forceComplete: true,
        correct: true,
        answer: selectedSentence,
        sentence: targetSentence,
        questionIndex,
        questionCount: questions.length,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.gameCard}>
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Mga Misyong Pangungusap</Text>
          </View>

          <Text style={styles.title}>Buuin ang pangungusap</Text>

          <View style={styles.instructionRow}>
            <Text style={styles.lightIcon}>💡</Text>
            <Text style={styles.subtitle}>{currentQuestion.instruction}</Text>
          </View>

          {questions.length > 1 ? (
            <Text style={styles.questionCounter}>
              Tanong {questionIndex + 1} sa {questions.length}
            </Text>
          ) : null}

          <Text style={styles.sparkle}>⭐</Text>
        </View>

        <View style={styles.slotPanel}>
          {currentQuestion.targetWords.map((_, index) => {
            const selected = selectedWords[index];

            return (
              <TouchableOpacity
                key={`slot-${index}`}
                activeOpacity={0.85}
                style={[
                  styles.slot,
                  selected && styles.slotFilled,
                ]}
              >
                <Text
                  style={[
                    styles.slotText,
                    !selected && styles.slotPlaceholder,
                  ]}
                >
                  {selected ? selected.label : '____'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.wordBank}>
          {remainingChoices.map((choice) => (
            <TouchableOpacity
              key={choice.id}
              activeOpacity={0.9}
              style={styles.wordTile}
              onPress={() => handleWordPress(choice)}
            >
              <Text style={styles.wordTileText}>{choice.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.actionButton,
              styles.clearButton,
              selectedWords.length === 0 && styles.disabledButton,
            ]}
            onPress={handleClear}
            disabled={selectedWords.length === 0}
          >
            <Text style={styles.clearButtonText}>↺ Burahin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.actionButton,
              styles.checkButton,
              !isComplete && styles.disabledCheckButton,
            ]}
            onPress={handleCheck}
            disabled={!isComplete}
          >
            <Text style={styles.checkButtonText}>✓ Suriin ang Pangungusap</Text>
          </TouchableOpacity>
        </View>

        {feedback ? (
          <Text
            style={[
              styles.feedback,
              isCorrect && styles.feedbackCorrect,
            ]}
          >
            {feedback}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.backButton}
          onPress={handleBackToMissions}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>← Bumalik sa mga Misyon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 18,
    backgroundColor: '#FFF8D9',
  },
  gameCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#B9EFD2',
    borderRadius: 24,
    padding: 16,
    backgroundColor: '#F8FCFF',
    shadowColor: '#6ECF9B',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 4,
  },
  heroCard: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#BBDDFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    backgroundColor: '#F6FBFF',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFD46D',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 10,
    backgroundColor: '#FFF7D9',
  },
  heroBadgeText: {
    color: '#8A5B00',
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    color: '#202844',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lightIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  subtitle: {
    flex: 1,
    color: '#416181',
    fontSize: 16,
    fontWeight: '800',
  },
  questionCounter: {
    marginTop: 8,
    color: '#6B7C93',
    fontSize: 12,
    fontWeight: '800',
  },
  sparkle: {
    position: 'absolute',
    right: 10,
    top: -2,
    fontSize: 26,
  },
  slotPanel: {
    minHeight: 92,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#98C6FF',
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#FBFDFF',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  slot: {
    minWidth: 88,
    minHeight: 58,
    borderWidth: 1,
    borderColor: '#D9E9FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#F7FBFF',
  },
  slotFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: '#BBD8FF',
    shadowColor: '#8CA4C9',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  slotText: {
    color: '#202844',
    fontSize: 22,
    fontWeight: '900',
  },
  slotPlaceholder: {
    color: '#7F94B2',
    letterSpacing: 2,
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  wordTile: {
    minHeight: 58,
    borderWidth: 2,
    borderColor: '#D9E9FF',
    borderRadius: 16,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#8CA4C9',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 3,
  },
  wordTileText: {
    color: '#202844',
    fontSize: 24,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#F97316',
    borderWidth: 2,
    borderColor: '#EA580C',
    shadowColor: '#F97316',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  checkButton: {
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#16A34A',
    shadowColor: '#22C55E',
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 7,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.7,
  },
  disabledCheckButton: {
    opacity: 0.75,
  },
  feedback: {
    color: '#CC6B00',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
  },
  feedbackCorrect: {
    color: '#159A55',
  },
  backButton: {

    marginTop: 24,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    shadowColor: '#16A34A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  backButtonText: {

    color: '#16A34A',
    fontWeight: '900',
    fontSize: 16,
  },
});

export { SentenceBuilderGame };
export default SentenceBuilderGame;
