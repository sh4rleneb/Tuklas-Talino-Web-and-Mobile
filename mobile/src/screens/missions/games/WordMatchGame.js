import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';


import {
  getWordMatchAttemptItems,
  shuffleWordMatchItems,
} from './data/wordMatchData';

import MissionProgressCard from '../components/MissionProgressCard';
import MissionQuestionCard from '../components/MissionQuestionCard';

export default function WordMatchGame({
  activity,
  submitting,
  onMissionComplete,
}) {

  const [selectedWordId, setSelectedWordId] = useState('');
  const [matchedPairs, setMatchedPairs] = useState({});
  const [pictures, setPictures] = useState([]);
  const [toast, setToast] = useState(null);
  const [wrongWordId, setWrongWordId] = useState('');
  const [wrongPictureId, setWrongPictureId] = useState('');

  const gradeLevel = Number(activity?.gradeLevel || 1);

  const [items, setItems] = useState([]);

  const matchedCount = Object.keys(matchedPairs).length;
  const wordMatchComplete = matchedCount === items.length;

  const challengeId = useMemo(() => {
    return items
      .map(item => item.id)
      .sort()
      .join('-');
  }, [items]);

  const challengeTitle = useMemo(() => {
    return items
      .map(item => item.label)
      .join(', ');
  }, [items]);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => {
      setToast(null);
    }, 1400);

    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const nextItems = getWordMatchAttemptItems(gradeLevel);

    setItems(nextItems);
    setPictures(shuffleWordMatchItems(nextItems));

    setSelectedWordId('');
    setMatchedPairs({});
    setWrongWordId('');
    setWrongPictureId('');
    setToast(null);
  }, [gradeLevel]);

  return (
    <>
      <MissionQuestionCard
        title="Word Match"
      >
        Piliin ang salitang Filipino sa kaliwa, pagkatapos piliin ang tamang larawan sa kanan.
      </MissionQuestionCard>

      <MissionProgressCard
        label="Matched Pairs"
        current={matchedCount}
        total={items.length}
      />

      <View style={styles.boardCard}>
        <View style={styles.board}>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>
            Mga Salita
          </Text>

          {items.map((item) => {
            const selected = selectedWordId === item.id;
            const matched = Boolean(matchedPairs[item.id]);
            const wrong = wrongWordId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                disabled={matched || submitting}
                style={[
                  styles.option,
                  selected && styles.optionSelected,
                  matched && styles.optionMatched,
                  wrong && styles.optionWrong,
                ]}
                onPress={() => {
                  setSelectedWordId(item.id);
                  setWrongWordId('');
                  setWrongPictureId('');
                  setToast(null);
                }}
              >
                <Text style={styles.optionText}>
                  {item.word}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.column}>
          <Text style={styles.columnTitle}>
            Mga Larawan
          </Text>

          {pictures.map((item) => {
            const matched = Boolean(matchedPairs[item.id]);
            const wrong = wrongPictureId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                disabled={matched || submitting}
                style={[
                  styles.option,
                  matched && styles.optionMatched,
                  wrong && styles.optionWrong,
                ]}
                onPress={() => {
                  if (!selectedWordId) {
                    setToast('Pumili muna ng salita.');
                    return;
                  }

                  if (selectedWordId === item.id) {
                    setMatchedPairs((prev) => ({
                      ...prev,
                      [item.id]: true,
                    }));

                    setSelectedWordId('');
                    setWrongWordId('');
                    setWrongPictureId('');
                    setToast(null);

                    return;
                  }

                  setWrongWordId(selectedWordId);
                  setWrongPictureId(item.id);
                  setToast('Hindi pa tugma. Try ulit!');

                  setTimeout(() => {
                    setWrongWordId('');
                    setWrongPictureId('');
                  }, 650);
                }}
              >
                <View style={styles.pictureIcon}>
                  <Text style={styles.pictureText}>
                    {item.picture}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </View>
      </View>

      {wordMatchComplete && (
        <Text style={styles.complete}>
          🎉 Lahat ng pares ay tama!
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.completeButton,
          (!wordMatchComplete || submitting) &&
            styles.completeButtonDisabled,
        ]}
        disabled={!wordMatchComplete || submitting}
        onPress={() =>
          onMissionComplete({
            forceComplete: true,
            challengeId,
            challengeTitle,
          })
        }
      >
        <Text style={styles.completeButtonText}>
          ✅ Complete Mission
        </Text>
      </TouchableOpacity>

      {toast && (
        <View pointerEvents="none" style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <Text style={styles.toastEmoji}>
              ⭐
            </Text>

            <Text style={styles.toast}>
              {toast}
            </Text>
          </View>
        </View>
      )}

    </>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  progressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },

  progressValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },

  progressTrack: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 999,
  },

  boardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 18,
  },

  board: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  column: {
    flex: 1,
  },

  columnTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },

  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    minHeight: 88,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  optionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },

  optionMatched: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5',
  },

  optionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  optionText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },

  pictureIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pictureText: {
    fontSize: 40,
  },

  complete: {
    marginTop: 18,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 18,
    color: '#16A34A',
  },

  completeButton: {
    marginTop: 16,
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },

  completeButtonDisabled: {
    opacity: 0.5,
  },

  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  toastOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },

  toastCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 3,
    borderColor: '#FACC15',
    shadowColor: '#92400E',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },

  toastEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },

  toast: {
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 21,
    lineHeight: 28,
    color: '#78350F',
  },
});

