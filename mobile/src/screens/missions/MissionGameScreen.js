import { SafeAreaView } from 'react-native-safe-area-context';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Audio } from 'expo-av';

import { api } from '../../api/client';

import MissionHeader from './components/MissionHeader';
import MissionCompleteModal from './components/MissionCompleteModal';
import WordMatchGame from './games/WordMatchGame';
import LetterPopGame from './games/LetterPopGame';
import PictureGuessGame from './games/PictureGuessGame';
import SentenceBuilderGame from './games/SentenceBuilderGame';
import StoryQuestGame from './games/StoryQuestGame';
import FillInTheBlankGame from './games/FillInTheBlankGame';


const MAX_MISSION_ATTEMPTS = 5;

const SOUND_AND_SAY_LEVELS = {
  1: {
    difficulty: 'Junior • Baitang 1',
    prompt: 'Magandang umaga po.',
    guide: 'Bigkasin nang malinaw ang isang magalang na pangungusap.',
  },
  2: {
    difficulty: 'Junior • Baitang 2',
    prompt: 'Ako ay batang masipag magbasa.',
    guide: 'Bigkasin nang malinaw ang isang buong pangungusap.',
  },
  3: {
    difficulty: 'Junior • Baitang 3',
    prompt: 'Malinaw kong binibigkas ang mga salita sa Filipino.',
    guide: 'Bigkasin nang maayos ang isang mas mahabang pangungusap.',
  },
  4: {
    difficulty: 'Senior • Baitang 4',
    prompt: 'Ang pagbabasa ay susi sa mas malawak na kaalaman.',
    guide: 'Bigkasin ang pangungusap nang may tamang bilis at kumpiyansa.',
  },
  5: {
    difficulty: 'Senior • Baitang 5',
    prompt: 'Ipinapahayag ko nang malinaw ang aking opinyon at dahilan.',
    guide: 'Bigkasin nang malinaw ang pangungusap at bigyang-diin ang pangunahing diwa.',
  },
  6: {
    difficulty: 'Senior • Baitang 6',
    prompt: 'Mahusay akong makinig, magsalita, at magpaliwanag nang may tiwala sa sarili.',
    guide: 'Bigkasin ang pangungusap nang may kumpiyansa, tamang damdamin, at maayos na bilis.',
  },
};

function friendlyMissionErrorMessage(message = '') {
  const text = String(message || '').toLowerCase();

  if (text.includes('already used all') && text.includes('attempt')) {
    return 'Naubos mo na ang 5 pagsubok para sa misyong ito. Magaling! Subukan ang ibang misyon o balikan ang iyong natutuhan.';
  }

  if (text.includes('mission not found')) {
    return 'Hindi pa handa ang misyong ito. Bumalik at pumili ng ibang misyon.';
  }

  return 'Hindi namin maisave ang iyong misyon sa ngayon. Subukan muli.';
}

function soundAndSayLevelForGrade(gradeLevel) {
  const grade = Number(gradeLevel || 1);

  if (grade <= 1) return SOUND_AND_SAY_LEVELS[1];
  if (grade >= 6) return SOUND_AND_SAY_LEVELS[6];

  return SOUND_AND_SAY_LEVELS[grade] || SOUND_AND_SAY_LEVELS[1];
}

const DEMOS = {
  'word-match': {
    id: 'word-match',
    module: 'Bokabularyo',
    title: 'Pagtutugma ng Salita',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    prompt: 'Piliin ang tamang pares: aso → ?',
    options: [
      'larawan ng aso',
      'larawan ng bahay',
      'larawan ng pusa',
    ],
    correct: 'larawan ng aso',
    xp: 15,
    icon: '🧩',
  },

  'letter-pop': {
    id: 'letter-pop',
    module: 'Pagbasa',
    title: 'Pagpili ng Titik',
    sample: 'ba + ___ = bata',
    prompt: 'ba + ___ = bata',
    options: ['ta', 'sa', 'la'],
    correct: 'ta',
    xp: 12,
    icon: '🎈',
  },

  'picture-guess': {
    id: 'picture-guess',
    module: 'Bokabularyo',
    title: 'Paghula sa Larawan',
    sample: 'larawan ng pusa → pusa',
    prompt: 'larawan ng pusa → pusa',
    options: ['pusa', 'aso', 'ibon'],
    correct: 'pusa',
    xp: 12,
    icon: '🖼️',
  },

  'sentence-builder': {
    id: 'sentence-builder',
    module: 'Pagsulat',
    title: 'Pagbuo ng Pangungusap',
    sample: 'Ako / ay / bata.',
    prompt: 'Ako / ay / bata.',
    options: [
      'Ako ay bata.',
      'Ay bata ako.',
      'Bata ako ay.',
    ],
    correct: 'Ako ay bata.',
    xp: 18,
    icon: '🧱',
  },

  'story-quest': {
    id: 'story-quest',
    module: 'Panitikan',
    title: 'Pag-unawa sa Kuwento',
    sample: 'Sino ang pangunahing tauhan?',
    prompt: 'Si Milo ay isang mabait na pusa. Mahilig siyang matulog sa tabi ng bintana. Sino ang pangunahing tauhan?',
    options: ['Milo', 'Ana', 'Payong'],
    correct: 'Milo',
    xp: 20,
    icon: '📖',
  },

  'sound-and-say': {
    id: 'sound-and-say',
    module: 'Oral Comm',
    title: 'Pakikinig at Pagbigkas',
    sample: 'Magandang umaga po.',
    prompt: 'Magandang umaga po.',
    options: ['Nasabi ko na!', 'Ulitin ko muna'],
    correct: 'Nasabi ko na!',
    xp: 15,
    icon: '🎙️',
  },
};

export default function MissionGameScreen({ navigation, route }) {
  const missionId = route?.params?.missionId;
  const gradeLevel = Number(route?.params?.gradeLevel ?? 1);

  const baseMission = useMemo(
    () => DEMOS[missionId] || DEMOS['word-match'],
    [missionId]
  );

  const mission = useMemo(() => {
    if (missionId !== 'sound-and-say') {
      return {
        ...baseMission,
        gradeLevel,
      };
    }

    const level = soundAndSayLevelForGrade(gradeLevel);

    return {
      ...baseMission,
      prompt: level.prompt,
      difficulty: level.difficulty,
      guide: level.guide,
      gradeLevel,
    };
  }, [baseMission, gradeLevel, missionId]);

  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [missionAttemptNo, setMissionAttemptNo] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [badgePopup, setBadgePopup] = useState(null);
  const recordingRef = useRef(null);
  const soundRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState('');
  const [soundStatus, setSoundStatus] = useState('');
  const [missionNotice, setMissionNotice] = useState(null);

  const stars =
    attempts <= 1 ? '⭐⭐⭐' :
    attempts === 2 ? '⭐⭐' :
    '⭐';

  const achievement =
    attempts <= 1
      ? {
          title: '🏅 Mahusay na Manlalaro',
          message: 'Nasagot nang tama sa unang pagsubok!',
        }
      : attempts === 2
      ? {
          title: '🌟 Bituin sa Pag-aaral',
          message: 'Natuto ka sa iyong pagkakamali at nagtagumpay!',
        }
      : {
          title: '💪 Hindi Sumusuko',
          message: 'Ang pagtitiyaga ay susi sa tagumpay.',
        };

  useEffect(() => () => {
    soundRef.current?.unloadAsync?.();
    recordingRef.current?.stopAndUnloadAsync?.();
  }, []);

  useEffect(() => {
    if (!missionNotice) return undefined;

    const timer = setTimeout(() => {
      setMissionNotice(null);
    }, 4200);

    return () => clearTimeout(timer);
  }, [missionNotice]);

  const showMissionNotice = (message, emoji = '🌈') => {
    setMissionNotice({
      title: 'Magaling!',
      message,
      emoji,
    });
  };

  const startSoundAndSayRecording = async () => {
    try {
      await soundRef.current?.unloadAsync?.();
      soundRef.current = null;

      const permission = await Audio.requestPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Mikropono',
          'Kailangan ang pahintulot sa mikropono upang maitala ang iyong pagbigkas.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const result = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = result.recording;
      setRecording(true);
      setRecordingUri('');
      setSoundStatus('Nagre-record... magsalita nang malinaw.');
    } catch (err) {
      setRecording(false);
      setSoundStatus('');
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi masimulan ang pagre-record.'
      );
    }
  };

  const stopSoundAndSayRecording = async () => {
    try {
      const activeRecording = recordingRef.current;

      if (!activeRecording) {
        setRecording(false);
        return;
      }

      await activeRecording.stopAndUnloadAsync();
      const uri = activeRecording.getURI();

      recordingRef.current = null;
      setRecording(false);
      setRecordingUri(uri || '');
      setSoundStatus(uri ? 'Naitala na ang iyong boses. Maaari mo itong pakinggan o tapusin ang misyon.' : '');
    } catch (err) {
      recordingRef.current = null;
      setRecording(false);
      Alert.alert(
        'May Problema sa Pagre-record',
        err.message || 'Hindi matapos ang pagre-record.'
      );
    }
  };

  const playSoundAndSayRecording = async () => {
    if (!recordingUri) {
      Alert.alert('Sound and Say', 'I-record muna ang iyong boses.');
      return;
    }

    try {
      await soundRef.current?.unloadAsync?.();

      const result = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );

      soundRef.current = result.sound;
      setSoundStatus('Pinapatugtog ang iyong naitalang boses...');
    } catch (err) {
      Alert.alert(
        'May Problema sa Pagpapatugtog',
        err.message || 'Hindi mapatugtog ang iyong naitalang boses.'
      );
    }
  };

  const clearSoundAndSayRecording = async () => {
    await soundRef.current?.unloadAsync?.();
    soundRef.current = null;
    setRecordingUri('');
    setSoundStatus('');
  };

  const completeSoundAndSayMission = () => {
    if (!recordingUri) {
      Alert.alert(
        'Sound and Say',
        'Please record your voice before completing this mission.'
      );
      return;
    }

    handleSubmit({ forceComplete: true });
  };

  const handleSubmit = async ({ forceComplete = false } = {}) => {
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
            challengeId: `attempt-${missionAttemptNo}-${Date.now()}`,
            challengeTitle: `Pagsubok ${missionAttemptNo} of ${MAX_MISSION_ATTEMPTS}`,
            attemptNo: missionAttemptNo,
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
        showMissionNotice(
          friendlyMissionErrorMessage(err.message),
          '🌟'
        );
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setAttempts((a) => a + 1);

    Alert.alert(
      'Maling Sagot',
      `❌ Mali ang sagot.\n\n✅ Tamang sagot: ${mission.correct}`
    );
  };

  const missionNoticePopup = missionNotice ? (
    <View style={styles.missionNoticeOverlay}>
      <View style={styles.missionNoticeCard}>
        <Text style={styles.missionNoticeEmoji}>
          {missionNotice.emoji}
        </Text>

        <View style={styles.missionNoticeBody}>
          <Text style={styles.missionNoticeTitle}>
            {missionNotice.title}
          </Text>

          <Text style={styles.missionNoticeMessage}>
            {missionNotice.message}
          </Text>

          <TouchableOpacity
            style={styles.missionNoticeButton}
            onPress={() => setMissionNotice(null)}
            activeOpacity={0.85}
          >
            <Text style={styles.missionNoticeButtonText}>
              Got it!
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ) : null;

  if (completed) {
    return (
      <SafeAreaView style={styles.safe}>
        <MissionCompleteModal
          title="🎉 Natapos ang Gawain!"
          xp={mission.xp}
          stars={stars}
          attempts={attempts}
          achievement={achievement}
          badge={badgePopup}
          onReplay={() => {
            if (missionAttemptNo >= MAX_MISSION_ATTEMPTS) {
              showMissionNotice(
                `You already used all ${MAX_MISSION_ATTEMPTS} tries for this mission. Great effort! Try another mission or review what you learned.`,
                '🎉'
              );
              return;
            }

            setSelected(null);
            setCompleted(false);
            setAttempts(1);
            setMissionAttemptNo((value) => Math.min(value + 1, MAX_MISSION_ATTEMPTS));
            setRecordingUri('');
            setSoundStatus('');
          }}
          onBack={() => navigation.goBack()}
        />

        {missionNoticePopup}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>

        <MissionHeader
          icon="🎮"
          title={mission.title}
          subtitle={`Pagsubok ${missionAttemptNo}/${MAX_MISSION_ATTEMPTS} • Tapusin ang gawain upang makakuha ng XP.`}
        />

        {missionId === 'word-match' && (
          <WordMatchGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'letter-pop' && (
          <LetterPopGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'picture-guess' && (
          <PictureGuessGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'sentence-builder' && (
          <SentenceBuilderGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}


        {missionId === 'story-quest' && (
          <StoryQuestGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'fill-in-the-blank' && (
          <FillInTheBlankGame
            activity={mission}
            submitting={submitting}
            onMissionComplete={handleSubmit}
          />
        )}

        {missionId === 'sound-and-say' && (
          <View style={styles.soundCard}>
            <Text style={styles.soundEyebrow}>
              🔊 Pakikinig at Pagbigkas
            </Text>

            <Text style={styles.soundDifficulty}>
              {mission.difficulty}
            </Text>

            <Text style={styles.soundInstruction}>
              Basahin, bigkasin, at i-record:
            </Text>

            <View style={styles.soundPromptBox}>
              <Text style={styles.soundPrompt}>
                “{mission.prompt}”
              </Text>
            </View>

            <Text style={styles.soundHint}>
              {mission.guide}
            </Text>

            <View style={styles.recordPanel}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recording && styles.recordingButton,
                ]}
                disabled={submitting}
                onPress={recording ? stopSoundAndSayRecording : startSoundAndSayRecording}
                activeOpacity={0.85}
              >
                <Text style={styles.recordButtonText}>
                  {recording ? '⏹ Ihinto' : '🎤 Simulan'}
                </Text>
              </TouchableOpacity>

              {recordingUri ? (
                <View style={styles.recordActions}>
                  <TouchableOpacity
                    style={styles.secondarySoundButton}
                    disabled={submitting}
                    onPress={playSoundAndSayRecording}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondarySoundButtonText}>
                      ▶ Play
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondarySoundButton}
                    disabled={submitting}
                    onPress={clearSoundAndSayRecording}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.secondarySoundButtonText}>
                      ↺ Record Again
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {soundStatus ? (
                <Text style={styles.soundStatus}>
                  {soundStatus}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.soundButton,
                (!recordingUri || submitting) && styles.soundButtonDisabled,
              ]}
              disabled={!recordingUri || submitting}
              onPress={completeSoundAndSayMission}
              activeOpacity={0.85}
            >
              <Text style={styles.soundButtonText}>
                {submitting ? 'Sine-save...' : 'Tapusin ang Gawain'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {missionNoticePopup}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 16 },
  soundCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#BBF7D0',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  soundEyebrow: {
    color: '#15803D',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  soundDifficulty: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    color: '#166534',
    fontSize: 13,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },
  soundInstruction: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  soundPromptBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 14,
  },
  soundPrompt: {
    color: '#0F172A',
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  soundHint: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  recordPanel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
  },
  recordButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  recordActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondarySoundButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondarySoundButtonText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 14,
  },
  soundStatus: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    lineHeight: 18,
  },
  soundButton: {
    backgroundColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  soundButtonDisabled: {
    opacity: 0.65,
  },
  soundButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  missionNoticeOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
  },
  missionNoticeCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FDBA74',
    paddingVertical: 24,
    paddingHorizontal: 20,
    shadowColor: '#9A3412',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  missionNoticeEmoji: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FED7AA',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 34,
    marginBottom: 12,
    overflow: 'hidden',
  },
  missionNoticeBody: {
    width: '100%',
    alignItems: 'center',
  },
  missionNoticeTitle: {
    color: '#7C2D12',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  missionNoticeMessage: {
    color: '#9A3412',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
    textAlign: 'center',
  },
  missionNoticeButton: {
    backgroundColor: '#FB923C',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginTop: 18,
  },
  missionNoticeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

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
