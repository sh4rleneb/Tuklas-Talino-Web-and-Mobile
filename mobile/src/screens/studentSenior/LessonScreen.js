import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default function LessonScreen({
  navigation,
}) {
  const [selected, setSelected] =
    useState(null);

  const [answered, setAnswered] =
    useState(false);

  const correctAnswer = 'Aso';

  const handleAnswer = (choice) => {
    if (answered) return;

    setSelected(choice);
    setAnswered(true);

    if (choice === correctAnswer) {
      Alert.alert(
        'Correct! 🎉',
        '+25 XP earned!'
      );
    } else {
      Alert.alert(
        'Oops!',
        'Try again next lesson.'
      );
    }
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <Text style={styles.lessonBadge}>
          📖 Reading Lesson
        </Text>

        <Text style={styles.title}>
          Ang Masayang Aso
        </Text>

        <Text style={styles.description}>
          Basahin ang maikling kwento
          at sagutin ang tanong.
        </Text>
      </View>

      {/* STORY */}

      <View style={styles.storyCard}>
        <Text style={styles.storyText}>
          Si Bantay ay isang masayang
          aso. Mahilig siyang tumakbo
          at maglaro sa parke araw-araw.
        </Text>
      </View>

      {/* QUESTION */}

      <Text style={styles.question}>
        🧠 Ano si Bantay?
      </Text>

      {/* CHOICES */}

      {[
        'Aso',
        'Pusa',
        'Ibon',
        'Isda',
      ].map((choice) => {
        const isCorrect =
          choice === correctAnswer;

        const isSelected =
          selected === choice;

        return (
          <TouchableOpacity
            key={choice}
            style={[
              styles.choiceButton,

              answered &&
                isCorrect &&
                styles.correctChoice,

              answered &&
                isSelected &&
                !isCorrect &&
                styles.wrongChoice,
            ]}
            onPress={() =>
              handleAnswer(choice)
            }
          >
            <Text style={styles.choiceText}>
              {choice}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* COMPLETE BUTTON */}

      <TouchableOpacity
        style={styles.completeButton}
        onPress={() =>
          navigation.goBack()
        }
      >
        <Text style={styles.completeText}>
          Finish Lesson →
        </Text>
      </TouchableOpacity>

      <View style={{ height: 50 }} />
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
  },

  lessonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },

  title: {
    marginTop: 20,
    fontSize: 36,
    fontWeight: '900',
    color: '#166534',
  },

  description: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 28,
    color: '#4B5563',
  },

  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    marginTop: 30,
  },

  storyText: {
    fontSize: 22,
    lineHeight: 38,
    color: '#111827',
    fontWeight: '600',
  },

  question: {
    marginTop: 35,
    marginBottom: 20,
    fontSize: 28,
    fontWeight: '900',
    color: '#166534',
  },

  choiceButton: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#DCFCE7',
  },

  correctChoice: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  wrongChoice: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  choiceText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  completeButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 22,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 30,
  },

  completeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
});