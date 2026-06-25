import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { api } from '../../api/client';

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

  const mission = useMemo(
    () => DEMOS[missionId] || DEMOS['word-match'],
    [missionId]
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

  if (completed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>MISSION COMPLETE</Text>

          <Text style={styles.resultTitle}>
            🎉 Mission Complete!
          </Text>

          <Text style={styles.resultScore}>
            +{mission.xp} XP
          </Text>

          <Text style={styles.starRating}>
            {stars}
          </Text>

          <Text style={styles.attemptText}>
            Attempts: {attempts}
          </Text>

          {badgePopup ? (
            <View style={styles.badgePopup}>
              <Text style={styles.badgeIcon}>
                {badgePopup?.icon || '🏅'}
              </Text>

              <View style={{ flex: 1 }}>
                <Text style={styles.badgeLabel}>
                  Badge Unlocked!
                </Text>

                <Text style={styles.badgeName}>
                  {badgePopup?.name || 'New Achievement'}
                </Text>

                <Text style={styles.badgeDesc}>
                  Achievement Earned ⭐
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.rewardCard}>
            <Text style={styles.achievementTitle}>
              {achievement.title}
            </Text>

            <Text style={styles.achievementMessage}>
              {achievement.message}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setSelected(null);
              setCompleted(false);
              setAttempts(1);
            }}
          >
            <Text style={styles.primaryButtonText}>
              🔄 Play Again
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.primaryButtonText}>
              🎮 Missions
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {mission.title}
        </Text>

        <Text style={styles.question}>
          {mission.prompt}
        </Text>

        {mission.options.map((option) => {
          const active = selected === option;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                active && styles.optionSelected,
              ]}
              onPress={() => setSelected(option)}
            >
              <Text style={styles.optionText}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !selected && styles.buttonDisabled,
          ]}
          disabled={!selected || submitting}
          onPress={async () => {
            if (selected === mission.correct) {
              try {
                setSubmitting(true);

                const data = await api(`/missions/${missionId}/complete`, {
                  method: 'POST',
                  body: {
                    challengeId: `attempt-${attempts}`,
                    challengeTitle: `${stars} ${attempts} attempts`,
                  },
                });

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
          }}
        >
          <Text style={styles.primaryButtonText}>
            Submit
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  question: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  option: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  optionSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#DCFCE7',
  },
  optionText: {
    fontSize: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFF',
    fontWeight: '900',
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },
  eyebrow: {
    fontWeight: '900',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 12,
  },
  resultScore: {
    fontSize: 48,
    fontWeight: '900',
    marginBottom: 20,
  },
  starRating: {
    fontSize: 36,
    marginBottom: 10,
  },
  attemptText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  achievementTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  achievementMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 24,
  },

  rewardCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: 'center',
  },
  badgePopup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 20,
  },
  badgeIcon: {
    fontSize: 36,
    marginRight: 12,
  },
  badgeLabel: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '900',
  },
  badgeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#92400E',
  },
  badgeDesc: {
    fontSize: 13,
    color: '#78716C',
  },
});
