import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import MissionProgressCard from '../components/MissionProgressCard';
import MissionQuestionCard from '../components/MissionQuestionCard';

import {
  getStoryQuestAttemptItems,
} from './data/storyQuestData';

export default function StoryQuestGame({
  activity,
  submitting,
  onMissionComplete,
}) {
  const gradeLevel = Number(activity?.gradeLevel || 1);

  const [stories, setStories] = useState([]);
  const [storyIndex, setStoryIndex] = useState(0);

  const [mode, setMode] = useState('story');

  const [pageIndex, setPageIndex] = useState(0);

  const [questionIndex, setQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState('');

  const [toast, setToast] = useState(null);

  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const items =
      getStoryQuestAttemptItems(gradeLevel);

    setStories(items);

    setStoryIndex(0);

    setMode('story');

    setPageIndex(0);

    setQuestionIndex(0);

    setSelectedAnswer('');

    setToast(null);

    setLocked(false);
  }, [gradeLevel]);

  const story = stories[storyIndex];

  if (!story) {
    return null;
  }

  const totalPages = story.story.length;

  const totalQuestions = story.questions.length;

  const currentPage =
    story.story[pageIndex];

  const currentQuestion =
    story.questions[questionIndex];

  const previousPage = () => {
    if (pageIndex === 0) {
      return;
    }

    setPageIndex(pageIndex - 1);
  };

  const nextPage = () => {
    if (pageIndex >= totalPages - 1) {
      return;
    }

    setPageIndex(pageIndex + 1);
  };

  const beginQuiz = () => {
    setMode('quiz');
    setQuestionIndex(0);
    setSelectedAnswer('');
    setToast(null);
    setLocked(false);
  };

  const nextQuestion = () => {
    if (questionIndex >= totalQuestions - 1) {
      onMissionComplete({
        forceComplete: true,
      });
      return;
    }

    setQuestionIndex((i) => i + 1);

    setSelectedAnswer('');

    setToast(null);

    setLocked(false);
  };

  const chooseAnswer = (choice) => {
    if (locked || submitting) {
      return;
    }

    setLocked(true);

    setSelectedAnswer(choice.label);

    if (choice.label === currentQuestion.correct) {
      setToast('🎉 Tama!');

      setTimeout(nextQuestion, 700);

      return;
    }

    setToast('❌ Mali. Subukan muli.');

    setTimeout(() => {
      setLocked(false);
      setSelectedAnswer('');
      setToast(null);
    }, 700);
  };

  if (mode === 'story') {
    return (
      <View>

        <MissionProgressCard
          label="Pahina"
          current={pageIndex + 1}
          total={totalPages}
        />

        <Text
          style={{
            textAlign:'center',
            fontSize:18,
            fontWeight:'700',
            color:'#64748B',
            marginBottom:14,
          }}
        >
          📚 Basahin muna ang kuwento bago sagutan ang mga tanong.
        </Text>

        <MissionQuestionCard
          title={`📖 ${story.title}`}
        >
          {currentPage}
        </MissionQuestionCard>

        <Text
          style={{
            textAlign:'center',
            color:'#94A3B8',
            fontWeight:'800',
            marginBottom:16,
          }}
        >
          Pahina {pageIndex + 1} ng {totalPages}
        </Text>

        <View style={styles.navigationRow}>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              pageIndex === 0 &&
                styles.disabledButton,
            ]}
            disabled={pageIndex === 0}
            onPress={previousPage}
          >
            <Text style={styles.secondaryText}>
              ⬅ Nakaraang Pahina
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              pageIndex === totalPages - 1 &&
                styles.disabledButton,
            ]}
            disabled={pageIndex === totalPages - 1}
            onPress={nextPage}
          >
            <Text style={styles.secondaryText}>
              Susunod ➡
            </Text>
          </TouchableOpacity>

        </View>

        {pageIndex === totalPages - 1 && (

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={beginQuiz}
          >
            <Text style={styles.primaryText}>
              🎯 Simulan ang Pagsusulit
            </Text>
          </TouchableOpacity>

        )}

      </View>
    );
  }
    return (
    <ScrollView>

      <MissionProgressCard
        label="Tanong"
        current={questionIndex + 1}
        total={totalQuestions}
      />

      <MissionQuestionCard
        title={story.title}
      >
        {currentQuestion.question}
      </MissionQuestionCard>

      {currentQuestion.options.map((choice) => {

        const selected =
          selectedAnswer === choice.label;

        return (
          <TouchableOpacity
            key={choice.label}
            disabled={locked || submitting}
            onPress={() => chooseAnswer(choice)}
            style={[
              styles.choiceButton,
              selected &&
                styles.choiceSelected,
            ]}
          >

            <Text style={styles.choiceEmoji}>
              {choice.icon}
            </Text>

            <Text style={styles.choiceText}>
              {choice.label}
            </Text>

          </TouchableOpacity>
        );

      })}

      {toast && (

        <View style={styles.toastCard}>
          <Text style={styles.toastText}>
            {toast}
          </Text>
        </View>

      )}

    </ScrollView>
  );

}

const styles = StyleSheet.create({

  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  secondaryButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  secondaryText: {
    fontWeight: '800',
    color: '#334155',
    fontSize: 16,
  },

  primaryButton: {
    marginTop: 12,
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },

  primaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },

  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
  },

  choiceSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },

  choiceEmoji: {
    fontSize: 26,
    marginRight: 14,
  },

  choiceText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },

  toastCard: {
    marginTop: 20,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },

  toastText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
  },

});