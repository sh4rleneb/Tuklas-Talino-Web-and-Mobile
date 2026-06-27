import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

import { api } from '../../api/client';

import MissionHeader from './components/MissionHeader';
import MissionCompleteModal from './components/MissionCompleteModal';
import WordMatchGame from './games/WordMatchGame';
import LetterPopGame from './games/LetterPopGame';
import PictureGuessGame from './games/PictureGuessGame';
import SentenceBuilderGame from './games/SentenceBuilderGame';
import StoryQuestGame from './games/StoryQuestGame';


const DEMOS = {
  'word-match': {
    title: 'Word Match',
    prompt: 'Ano ang ibig sabihin ng salitang "bahay"?',
    options: ['House / tahanan', 'Dog / aso', 'Book / aklat'],
    correct: 'House / tahanan',
    xp: 15,
  },

  'letter-pop': {
    title: 'Letter Pop',
    prompt: 'ba + ___ = 🧒',
    options: ['ta', 'sa', 'la'],
    correct: 'ta',
    xp: 12,
  },

  'picture-guess': {
    title: 'Picture Guess',
    prompt: '🐱',
    options: ['pusa', 'aso', 'ibon'],
    correct: 'pusa',
    xp: 12,
  },

  'sentence-builder': {
    title: 'Sentence Builder',
    prompt: 'bata / Ako / ay',
    options: [
      'Ako ay bata.',
      'Ay bata ako.',
      'Bata ako ay.',
    ],
    correct: 'Ako ay bata.',
    xp: 18,
  },

  'story-quest': {
    title: 'Story Quest',
    prompt:
      'Si Ana ay may pulang payong. Ginamit niya ito nang umulan. Ano ang ginamit ni Ana?',
    options: ['payong', 'aklat', 'lapis'],
    correct: 'payong',
    xp: 20,
  },

  'sound-and-say': {
    title: 'Sound and Say',
    prompt: 'Magandang umaga po.',
    options: ['Nasabi ko na!', 'Ulitin ko muna'],
    correct: 'Nasabi ko na!',
    xp: 15,
  },
};

export default function MissionGameScreen({ navigation, route }) {
  const missionId = route?.params?.missionId;
  const gradeLevel = Number(route?.params?.gradeLevel ?? 1);

  const baseMission = useMemo(
    () => DEMOS[missionId] || DEMOS['word-match'],
    [missionId]
  );

  const mission = useMemo(
    () => ({
      ...baseMission,
      gradeLevel,
    }),
    [baseMission, gradeLevel]
  );

  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [badgePopup, setBadgePopup] = useState(null);

  const stars =
    attempts <= 1 ? '⭐⭐⭐' :
    attempts === 2 ? '⭐⭐' :
    '⭐';

  const achievement =
    attempts <= 1
      ? {
          title: '🏅 Perfect Explorer',
          message: 'Answered correctly on the first try!',
        }
      : attempts === 2
      ? {
          title: '🌟 Learning Star',
          message: 'You learned from a mistake and succeeded.',
        }
      : {
          title: '💪 Never Give Up',
          message: 'Persistence leads to mastery.',
        };

  const handleSubmit = async ({
    forceComplete = false,
    challengeId = `attempt-${attempts}`,
    challengeTitle = `${stars} ${attempts} attempts`,
  } = {}) => {
    const success =
      forceComplete || selected === mission.correct;

    if (success) {
      try {
        setSubmitting(true);

        console.log('[MISSION] submitting', {
          missionId,
          attempts,
          gradeLevel: mission.gradeLevel,
        });

        const data = await api(`/missions/${missionId}/complete`, {
          method: 'POST',
          body: {
            challengeId,
            challengeTitle,
          },
        });

        console.log(
          '[MISSION] response',
          JSON.stringify(data, null, 2)
        );

        if (Array.isArray(data?.newBadges) && data.newBadges.length) {
          setBadgePopup(data.newBadges[0]);

          setTimeout(() => {
            setBadgePopup(null);
          }, 5500);
        }

        setCompleted(true);
      } catch (err) {
        Alert.alert(
          'Mission Error',
          err.message || 'Unable to save mission progress.'
        );
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setAttempts((a) => a + 1);

    Alert.alert(
      'Incorrect Answer',
      `❌ Mali ang sagot.\n\n✅ Tamang sagot: ${mission.correct}`
    );
  };

  if (completed) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissionCompleteModal
          title="🎉 Mission Complete!"
          xp={mission.xp}
          stars={stars}
          attempts={attempts}
          achievement={achievement}
          badge={badgePopup}
          onReplay={() => {
            setSelected(null);
            setCompleted(false);
            setAttempts(1);
          }}
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        <MissionHeader
          icon="🎮"
          title={mission.title}
          subtitle="Complete the activity and earn XP."
        />

        {missionId === 'word-match' && (
          <WordMatchGame
            mission={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'letter-pop' && (
          <LetterPopGame
            mission={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'picture-guess' && (
          <PictureGuessGame
            mission={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'sentence-builder' && (
          <SentenceBuilderGame
            mission={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'story-quest' && (
          <StoryQuestGame
            mission={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  secondaryButton: {
    width: '100%',
    marginTop: 14,
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  secondaryButtonText: {
    color: '#22C55E',
    fontWeight: '900',
    fontSize: 16,
  },
});
