import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

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

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              setSelected(null);
              setCompleted(false);
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
          disabled={!selected}
          onPress={() => {
            if (selected === mission.correct) {
              setCompleted(true);
              return;
            }

            alert('❌ Mali ang sagot. Subukan muli.');
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
});
