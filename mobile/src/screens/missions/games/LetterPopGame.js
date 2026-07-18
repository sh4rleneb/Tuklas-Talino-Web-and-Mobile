import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

const DEFAULT_OPTIONS = ['no', 'la', 'sa'];
const BALLOON_COLORS = ['#FFD873', '#73CEF2', '#EF8BC8'];

// WEB-PARITY: mobile Letter Pop player based on the active web reference.
export default function LetterPopGame({
  activity = {},
  submitting = false,
  onMissionComplete,
}) {
  const { width } = useWindowDimensions();
  const popScale = useRef(new Animated.Value(1)).current;
  const popOpacity = useRef(new Animated.Value(1)).current;
  const floatValue = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const questions = useMemo(() => {
    const rawQuestions =
      Array.isArray(activity?.attemptQuestions) &&
      activity.attemptQuestions.length
        ? activity.attemptQuestions
        : Array.isArray(activity?.questions) &&
          activity.questions.length
          ? activity.questions
          : Array.isArray(activity?.questionPool) &&
            activity.questionPool.length
            ? activity.questionPool
            : [activity];

    const seen = new Set();

    const uniqueQuestions = rawQuestions.filter((question = {}, index) => {
      const key = String(
        question.id ||
        question.prompt ||
        question.equation ||
        question.resultWord ||
        `letter-pop-question-${index}`
      )
        .trim()
        .toLocaleLowerCase();

      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });

    return uniqueQuestions.slice(0, 3);
  }, [
    activity,
    activity?.attemptQuestions,
    activity?.questionPool,
    activity?.questions,
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const currentQuestion =
    questions[currentQuestionIndex] ||
    questions[0] ||
    activity;

  const totalQuestions = Math.max(1, questions.length);

  const options = useMemo(() => {
    const raw = Array.isArray(currentQuestion?.options)
      ? currentQuestion.options
      : Array.isArray(currentQuestion?.choices)
        ? currentQuestion.choices
        : DEFAULT_OPTIONS;

    const normalized = raw
      .map((option) => {
        if (typeof option === 'string') {
          return option.trim();
        }

        return String(
          option?.label ??
          option?.text ??
          option?.value ??
          ''
        ).trim();
      })
      .filter(Boolean);

    const source = normalized.length >= 3
      ? normalized.slice(0, 3)
      : DEFAULT_OPTIONS;

    const seedText = [
      currentQuestion?.id,
      currentQuestion?.prompt,
      activity?.questionPoolAttemptNo,
      currentQuestionIndex,
    ].join(':');

    let seed = 0;

    for (let index = 0; index < seedText.length; index += 1) {
      seed = ((seed << 5) - seed) + seedText.charCodeAt(index);
      seed |= 0;
    }

    const seededValue = (index) => {
      const value = Math.sin(seed + index + 1) * 10000;
      return value - Math.floor(value);
    };

    return source
      .map((choice, index) => ({
        choice,
        order: seededValue(index),
      }))
      .sort((a, b) => a.order - b.order)
      .map((item) => item.choice);
  }, [
    activity?.questionPoolAttemptNo,
    currentQuestion,
    currentQuestionIndex,
  ]);

  const prefix = String(currentQuestion?.prefix || 'pu');
  const resultEmoji = String(
    currentQuestion?.resultEmoji || '🌳'
  );

  const promptText = String(
    currentQuestion?.prompt ||
    currentQuestion?.equation ||
    `${prefix} + ___ = ${resultEmoji}`
  ).trim();

  const correct = String(
    currentQuestion?.correct ??
    currentQuestion?.answer ??
    'no'
  ).trim();

  const missionLabel = String(
    activity?.missionLabel ||
    'Misyong Pantig'
  );

  const clue = String(
    currentQuestion?.resultEmoji ||
    currentQuestion?.imageEmoji ||
    resultEmoji
  );

  const instruction = String(
    currentQuestion?.instruction ||
    currentQuestion?.instructions ||
    activity?.instruction ||
    activity?.instructions ||
    'Pindutin ang lobong bubuo sa salita. Kapag tama, puputok ito!'
  );

  const [selected, setSelected] = useState('');
  const [wrongChoice, setWrongChoice] = useState('');
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState('');

  const balloonWidth = Math.max(
    88,
    Math.min(126, Math.floor((width - 76) / 3))
  );
  const balloonHeight = Math.round(balloonWidth * 0.68);

  useEffect(() => {
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, {
          toValue: -5,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatValue, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    floating.start();

    return () => {
      floating.stop();

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [floatValue]);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelected('');
    setWrongChoice('');
    setLocked(false);
    setToast('');
    popScale.setValue(1);
    popOpacity.setValue(1);
  }, [
    activity?.id,
    activity?.questionPoolAttemptNo,
    popOpacity,
    popScale,
  ]);

  useEffect(() => {
    setSelected('');
    setWrongChoice('');
    setLocked(false);
    setToast('');
    popScale.setValue(1);
    popOpacity.setValue(1);
  }, [
    currentQuestion?.id,
    currentQuestion?.prompt,
    currentQuestionIndex,
    popOpacity,
    popScale,
  ]);

  function isCorrectChoice(choice) {
    return String(choice).trim().toLocaleLowerCase() ===
      correct.toLocaleLowerCase();
  }

  function finishCorrectChoice(choice) {
    setSelected(choice);
    setWrongChoice('');
    setLocked(true);
    setToast('🎉 Tama! Pop!');

    Animated.sequence([
      Animated.spring(popScale, {
        toValue: 1.16,
        friction: 4,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(popScale, {
          toValue: 0.12,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(popOpacity, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      timerRef.current = setTimeout(() => {
        const isLastQuestion =
          currentQuestionIndex >= totalQuestions - 1;

        if (isLastQuestion) {
          onMissionComplete?.({
            forceComplete: true,
            selected: choice,
            correct,
            answeredQuestions: totalQuestions,
            totalQuestions,
          });
          return;
        }

        setCurrentQuestionIndex((current) =>
          Math.min(current + 1, totalQuestions - 1)
        );
      }, 380);
    });
  }

  function handleChoice(choice) {
    if (locked || submitting) {
      return;
    }

    if (isCorrectChoice(choice)) {
      finishCorrectChoice(choice);
      return;
    }

    setSelected(choice);
    setWrongChoice(choice);
    setLocked(true);
    setToast('❌ Subukan muli!');

    timerRef.current = setTimeout(() => {
      setSelected('');
      setWrongChoice('');
      setLocked(false);
      setToast('');
    }, 720);
  }

  return (
    <View style={styles.container}>
      <View style={styles.challengeCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {missionLabel}
            </Text>
          </View>

          <View style={styles.questionCounter}>
            <Text style={styles.questionCounterText}>
              Tanong {currentQuestionIndex + 1} sa {totalQuestions}
            </Text>
          </View>
        </View>

        <View style={styles.equationRow}>
          <Text style={styles.equationText}>
            {promptText}
          </Text>
        <View style={styles.clueRow}>
          <Text style={styles.clueIcon}>
            💡
          </Text>

          <Text style={styles.clueText}>
            <Text style={styles.clueLabel}>
              Pahiwatig:{' '}
            </Text>
            {currentQuestion?.clue ||
              'Piliin ang pantig na bubuo sa tamang salita.'}
          </Text>
        </View>
        </View>

      </View>

      <View style={styles.balloonRow}>
        {options.map((choice, index) => {
          const chosen = selected === choice;
          const wrong = wrongChoice === choice;
          const correctChosen = chosen && isCorrectChoice(choice);

          const animatedStyle = correctChosen
            ? {
                opacity: popOpacity,
                transform: [
                  {
                    translateY: floatValue,
                  },
                  {
                    scale: popScale,
                  },
                ],
              }
            : {
                transform: [
                  {
                    translateY: floatValue,
                  },
                ],
              };

          return (
            <Animated.View
              key={`${choice}-${index}`}
              style={[
                styles.balloonSlot,
                {
                  width: balloonWidth,
                },
                animatedStyle,
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Pantig ${choice}`}
                activeOpacity={0.82}
                disabled={locked || submitting}
                onPress={() => handleChoice(choice)}
                style={[
                  styles.balloon,
                  {
                    width: balloonWidth,
                    height: balloonHeight,
                    borderRadius: balloonHeight / 2,
                    backgroundColor:
                      BALLOON_COLORS[index % BALLOON_COLORS.length],
                  },
                  wrong && styles.balloonWrong,
                  correctChosen && styles.balloonCorrect,
                ]}
              >
                <View style={styles.balloonShine} />

                <Text style={styles.balloonText}>
                  {choice}
                </Text>
              </TouchableOpacity>

              <View style={styles.balloonKnot} />
              <View style={styles.balloonString} />
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.instructionPill}>
        <Text style={styles.instructionText}>
          {instruction}
        </Text>
      </View>

      {!!toast && (
        <View
          style={[
            styles.toast,
            toast.startsWith('🎉')
              ? styles.toastGood
              : styles.toastWrong,
          ]}
        >
          <Text style={styles.toastText}>
            {toast}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 28,
  },

  challengeCard: {
    width: '100%',
    minHeight: 168,
    backgroundColor: '#F8FBFF',
    borderWidth: 2,
    borderColor: '#BBDDFF',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#7592B4',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 4,
  },

  cardHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  questionCounter: {
    borderRadius: 999,
    backgroundColor: '#E8F3FF',
    borderWidth: 1,
    borderColor: '#A7D2FF',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },

  questionCounterText: {
    color: '#24558A',
    fontSize: 12,
    fontWeight: '900',
  },

  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#FFF8DA',
    borderWidth: 1,
    borderColor: '#F2CE67',
    paddingVertical: 7,
    paddingHorizontal: 13,
  },

  badgeText: {
    color: '#7A5A14',
    fontSize: 12,
    fontWeight: '900',
  },

  equationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
  },

  equationText: {
    color: '#17213D',
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: 0.2,
    flexShrink: 1,
  },

  clueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 13,
  },

  clueIcon: {
    marginRight: 9,
    fontSize: 18,
    lineHeight: 23,
  },

  clueText: {
    flex: 1,
    color: '#455D80',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },

  clueLabel: {
    fontWeight: '900',
  },

  balloonRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 2,
    marginTop: 30,
    marginBottom: 26,
  },

  balloonSlot: {
    alignItems: 'center',
    minHeight: 112,
  },

  balloon: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.42)',
    shadowColor: '#5F7695',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.24,
    shadowRadius: 7,
    elevation: 6,
  },

  balloonWrong: {
    borderColor: '#EF4444',
  },

  balloonCorrect: {
    borderColor: '#22C55E',
  },

  balloonShine: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 15,
    height: 25,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    transform: [
      {
        rotate: '24deg',
      },
    ],
  },

  balloonText: {
    color: '#17213D',
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },

  balloonKnot: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#A7B5C8',
  },

  balloonString: {
    width: 2,
    height: 25,
    backgroundColor: '#A7B5C8',
  },

  instructionPill: {
    maxWidth: '94%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#98D6FF',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  instructionText: {
    color: '#31587F',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    fontWeight: '900',
  },

  toast: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  toastGood: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },

  toastWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },

  toastText: {
    color: '#17213D',
    fontSize: 14,
    fontWeight: '900',
  },
});
