import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { api } from '../api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


const MAX_MISSION_ATTEMPTS = 5;
const MISSION_ATTEMPT_STORAGE_KEY = 'tuklas_mobile_misyon_attempts_v1';

const MOBILE_MISSION_TYPE_FALLBACKS = [
  'word-match',
  'letter-pop',
  'picture-guess',
  'sentence-builder',
  'story-quest',
  'fill-in-the-blank',
];

const TAGALOG_MISSION_TITLES = Object.freeze({
  'word-match': 'Pagtutugma ng Salita',
  'letter-pop': 'Pagpili ng Titik',
  'picture-guess': 'Hulaan ang Larawan',
  'sentence-builder': 'Pagbuo ng Pangungusap',
  'story-quest': 'Pag-unawa sa Kuwento',
  'sound-and-say': 'Pakikinig at Pagbigkas',
  'fill-in-the-blank': 'Punan ang Patlang',
});

const TAGALOG_MISSION_TITLES_BY_ENGLISH = Object.freeze({
  'word match': 'Pagtutugma ng Salita',
  'letter pop': 'Pagpili ng Titik',
  'picture guess': 'Hulaan ang Larawan',
  'sentence builder': 'Pagbuo ng Pangungusap',
  'story quest': 'Pag-unawa sa Kuwento',
  'sound and say': 'Pakikinig at Pagbigkas',
  'fill in the blank': 'Punan ang Patlang',
  'fill-in-the-blank': 'Punan ang Patlang',
});

function getTagalogMissionTitle(
  missionId,
  fallbackTitle = ''
) {
  const id = String(missionId || '')
    .trim()
    .toLowerCase();

  const fallback = String(fallbackTitle || '')
    .trim();

  const normalizedFallback = fallback
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

  return (
    TAGALOG_MISSION_TITLES[id] ||
    TAGALOG_MISSION_TITLES_BY_ENGLISH[
      normalizedFallback
    ] ||
    fallback ||
    'Misyon'
  );
}

function normalizeMissionCatalog(rows = []) {
  return rows.slice(0, 6).map((mission = {}, index) => {
    const rawTitle =
      mission.title ||
      mission.name ||
      mission.label ||
      `Misyon ${index + 1}`;

    const slug = String(
      mission.id ||
      mission.key ||
      mission.missionId ||
      mission.gameId ||
      rawTitle
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const fallbackType = MOBILE_MISSION_TYPE_FALLBACKS[index] || slug || `mission-${index + 1}`;

    return {
      ...mission,
      id: mission.id || mission.key || mission.missionId || slug || `mission-${index + 1}`,
      missionId: mission.missionId || mission.id || mission.key || slug || `mission-${index + 1}`,
      title: getTagalogMissionTitle(mission.id || mission.missionId || slug, rawTitle),
      name: getTagalogMissionTitle(mission.id || mission.missionId || slug, rawTitle),
      subtitle: mission.subtitle || mission.tagline || mission.description || '',
      description: mission.description || mission.instructions || mission.subtitle || '',
      instructions: mission.instructions || mission.description || mission.guide || '',
      icon: mission.icon || mission.emoji || '⭐',
      tone: mission.tone || mission.color || ['mint', 'sky', 'amber', 'pink', 'violet', 'rose'][index % 6],
      type: mission.type || mission.gameType || mission.kind || fallbackType,
      gameType: mission.gameType || mission.type || mission.kind || fallbackType,
      xpReward: Number(mission.xpReward || mission.rewardXp || mission.xp || 20),
      maxAttempts: Math.max(
        MAX_MISSION_ATTEMPTS,
        Number(mission.maxAttempts || MAX_MISSION_ATTEMPTS)
      ),
      questionPool: mission.questionPool || mission.questions || mission.pool || [],
      questions: mission.questions || mission.questionPool || mission.pool || [],
      state: mission.state || mission.status || 'ready',
      baseStatus: mission.baseStatus || 'Handa na',
    };
  });
}


const MISSION_GAMES = normalizeMissionCatalog([
  {
    id: 'word-match',
    title: 'Pagtutugma ng Salita',
    icon: '🧩',
    module: 'Bokabularyo',
    xp: 15,
    baseStatus: 'Handa na',
    short: 'Hanapin ang pares!',
    instruction: 'Hanapin ang tamang pares. Basahin ang salita, tingnan ang larawan o kahulugan, at piliin ang magkapareha.',
    sample: 'aso → larawan ng aso, bahay → larawan ng bahay',
    reward: 'Pag-unlad sa Bituin ng Bokabularyo',
    tone: 'sky'
  },
  {
    id: 'letter-pop',
    title: 'Pagpili ng Titik',
    icon: '🎈',
    module: 'Pagbasa',
    xp: 12,
    baseStatus: 'Handa na',
    short: 'Piliin ang pantig na bubuo sa salita!',
    instruction: 'Tap the balloon na bubuo sa salita. Kapag tama, pop!',
    sample: 'pu + ___ = 🌳',
    reward: 'Pag-unlad sa sunod-sunod na pagbasa',
    tone: 'sun',
    missionLabel: 'Misyong Pantig',
    prompt: 'pu + ___ = 🌳',
    prefix: 'pu',
    resultEmoji: '🌳',
    resultWord: 'puno',
    clue: 'Halamang may katawan, sanga, at dahon.',
    options: ['no', 'la', 'sa'],
    correct: 'no',
},
  {
    id: 'picture-guess',
    title: 'Hulaan ang Larawan',
    icon: '🖼️',
    module: 'Bokabularyo',
    xp: 12,
    baseStatus: 'Handa na',
    short: 'Hulaan ang larawan!',
    instruction: 'Pagmasdan ang picture card, pagkatapos piliin ang salitang tumutukoy dito.',
    sample: 'larawan ng pusa → pusa',
    reward: 'Vocabulary confidence',
    tone: 'mint'
  },
  {
    id: 'sentence-builder',
    title: 'Pagbuo ng Pangungusap',
    icon: '🧱',
    module: 'Pagsulat',
    xp: 18,
    baseStatus: 'Handa na',
    short: 'Ayusin ang pangungusap!',
    instruction: 'Ilagay ang mga salita sa tamang ayos hanggang makabuo ng malinaw na pangungusap.',
    sample: 'Ako / ay / bata.',
    reward: 'Pag-unlad sa gantimpala sa Pagsulat Builder',
    tone: 'pink'
  },
  {
    id: 'story-quest',
    title: 'Pag-unawa sa Kuwento',
    icon: '📖',
    module: 'Panitikan',
    xp: 20,
    baseStatus: 'Handa na',
    short: 'Basahin at sagutin!',
    instruction: 'Basahin ang story card. Sagutin ang tanong tungkol sa tauhan, tagpuan, o pangyayari.',
    sample: 'Sino ang pangunahing tauhan?',
    reward: 'Pag-unlad sa Hamon sa Pag-unawa',
    tone: 'violet'
  },
  {
    id: 'sound-and-say',
    title: 'Pakikinig at Pagbigkas',
    icon: '🎙️',
    module: 'Oral Comm',
    xp: 15,
    baseStatus: 'Handa na',
    short: 'Magsanay bumigkas ng salitang Filipino o maikling parirala.',
    instruction: 'Pakinggan ang salita, pagkatapos bigkasin ito nang malinaw. Maaaring ikonekta ang pagsusuri ng pagbigkas sa susunod.',
    sample: 'Magandang umaga po.',
    reward: 'Oral practice confidence',
    tone: 'rose',
    future: true
  },
  ]);

const TONES = {
  sky: {
    soft: '#E0F2FE',
    mid: '#7DD3FC',
    strong: '#0284C7',
    ink: '#075985',
    glow: '#BAE6FD',
  },
  sun: {
    soft: '#FEF3C7',
    mid: '#FDE68A',
    strong: '#D97706',
    ink: '#92400E',
    glow: '#FDE68A',
  },
  mint: {
    soft: '#D1FAE5',
    mid: '#86EFAC',
    strong: '#16A34A',
    ink: '#166534',
    glow: '#BBF7D0',
  },
  pink: {
    soft: '#FCE7F3',
    mid: '#F9A8D4',
    strong: '#DB2777',
    ink: '#9D174D',
    glow: '#FBCFE8',
  },
  violet: {
    soft: '#EDE9FE',
    mid: '#C4B5FD',
    strong: '#7C3AED',
    ink: '#5B21B6',
    glow: '#DDD6FE',
  },
  rose: {
    soft: '#FFE4E6',
    mid: '#FDA4AF',
    strong: '#E11D48',
    ink: '#9F1239',
    glow: '#FECDD3',
  },
};

function getTone(tone) {
  return TONES[tone] || TONES.mint;
}

async function readStoredMissionAttempts() {
  try {
    const raw = await AsyncStorage.getItem(MISSION_ATTEMPT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

async function writeStoredMissionAttempts(nextAttempts = {}) {
  try {
    await AsyncStorage.setItem(
      MISSION_ATTEMPT_STORAGE_KEY,
      JSON.stringify(nextAttempts || {})
    );
  } catch (error) {
    // Local persistence is best-effort only.
  }
}

function missionState(mission = {}) {
  return String(mission.state || mission.status || '').toLowerCase();
}

function statusLabel(mission = {}) {
  const state = missionState(mission);
  const finishedAttempts = hasUsedAllMissionAttempts(mission);

  if (state === 'claimed') {
    return 'Natapos';
  }

  if (
    finishedAttempts &&
    (state === 'ready_to_claim' || state === 'completed')
  ) {
    return state === 'ready_to_claim'
      ? 'Kunin ang Bituin'
      : 'Natapos';
  }

  if (state === 'locked') {
    return 'Naka-lock';
  }

  return mission.baseStatus || 'Handa na';
}

function isClaimable(mission = {}) {
  return (
    missionState(mission) === 'ready_to_claim' &&
    hasUsedAllMissionAttempts(mission)
  );
}

function isCompleted(mission = {}) {
  const state = missionState(mission);

  if (state === 'claimed') {
    return true;
  }

  return (
    state === 'completed' &&
    hasUsedAllMissionAttempts(mission)
  );
}

function getMissionKey(mission = {}) {
  return mission.missionId || mission.id;
}


function getMissionAttemptCount(mission = {}) {
  const rawAttempts =
    mission.attemptCount ??
    mission.attemptsUsed ??
    mission.attemptNo ??
    mission.missionAttemptCount ??
    mission.quizAttemptCount ??
    mission.latestAttempt?.attemptNo ??
    mission.attempt?.attemptNo ??
    mission?.dataJson?.attemptCount ??
    0;

  const fromArray = Array.isArray(mission.attempts)
    ? mission.attempts.length
    : Array.isArray(mission.missionAttempts)
    ? mission.missionAttempts.length
    : 0;

  return Math.max(0, Math.min(MAX_MISSION_ATTEMPTS, Number(rawAttempts || fromArray || 0)));
}

function getMissionMaxAttempts(mission = {}) {
  return Math.max(
    MAX_MISSION_ATTEMPTS,
    Number(mission.maxAttempts || MAX_MISSION_ATTEMPTS)
  );
}

function hasUsedAllMissionAttempts(mission = {}) {
  return getMissionAttemptCount(mission) >= getMissionMaxAttempts(mission);
}

function missionAttemptLabel(mission = {}) {
  const state = missionState(mission);
  const used = getMissionAttemptCount(mission);
  const max = getMissionMaxAttempts(mission);
  const finishedAttempts = used >= max;

  if (state === 'claimed') {
    return 'Natapos na';
  }

  if (
    finishedAttempts &&
    (state === 'completed' || state === 'ready_to_claim')
  ) {
    return state === 'ready_to_claim'
      ? 'Kumpleto • Kunin ang Bituin'
      : 'Natapos na';
  }

  if (finishedAttempts) {
    return `Pagsubok ${max} sa ${max} • Naubos na`;
  }

  const currentAttemptNo = Number(
    mission.currentAttemptNo ??
    mission.nextAttemptNo ??
    0
  );

  const nextAttempt = Math.min(
    max,
    Math.max(1, currentAttemptNo || used + 1)
  );

  return `Pagsubok ${nextAttempt} sa ${max}`;
}

function getMissionProgress(mission = {}) {
  const state = missionState(mission);
  const attemptsUsed = getMissionAttemptCount(mission);
  const maxAttempts = getMissionMaxAttempts(mission);
  const finishedAttempts = attemptsUsed >= maxAttempts;

  if (state === 'claimed') {
    return 100;
  }

  const attemptProgress =
    attemptsUsed > 0 && Number.isFinite(maxAttempts) && maxAttempts > 0
      ? Math.round((Math.min(attemptsUsed, maxAttempts) / maxAttempts) * 100)
      : 0;

  if (
    !finishedAttempts &&
    (state === 'completed' || state === 'ready_to_claim')
  ) {
    return Math.max(
      0,
      Math.min(99, attemptProgress)
    );
  }

  const backendProgress = Number(
    mission.progress ??
    mission.percent ??
    0
  );

  const safeProgress = Math.max(
    Number.isFinite(backendProgress) ? backendProgress : 0,
    attemptProgress
  );

  if (
    finishedAttempts &&
    (state === 'completed' || state === 'ready_to_claim')
  ) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(99, safeProgress)
  );
}

function buildMergedMissions(backendMissions = []) {
  const backendRows = Array.isArray(backendMissions) ? backendMissions : [];

  return MISSION_GAMES.map((mission) => {
    const backend = backendRows.find((item) => {
      const backendKey = String(item.missionId || item.id || item.key || '');
      const localKeys = [
        mission.missionId,
        mission.id,
        mission.key,
        mission.gameId,
      ].filter(Boolean).map(String);

      return localKeys.includes(backendKey);
    });

    const xp = Number(
      backend?.xp ??
      backend?.xpReward ??
      backend?.rewardXp ??
      mission.xp ??
      mission.xpReward ??
      20
    );

    const attemptCount = getMissionAttemptCount(backend || mission);
    const maxAttempts = Math.max(
      MAX_MISSION_ATTEMPTS,
      Number(
        backend?.maxAttempts ??
        mission.maxAttempts ??
        MAX_MISSION_ATTEMPTS
      )
    );

    const currentAttemptNo = Math.min(
      maxAttempts,
      Math.max(1, attemptCount + 1)
    );

    const state =
      backend?.state ||
      backend?.status ||
      mission.state ||
      mission.status ||
      'ready';

    const progress = getMissionProgress({
      ...mission,
      ...(backend || {}),
      attemptCount,
      attemptsUsed: attemptCount,
      currentAttemptNo,
      attemptNo: currentAttemptNo,
      attemptLabel: `Pagsubok ${currentAttemptNo} sa ${maxAttempts}`,
      maxAttempts,
    });

    return {
      ...mission,
      ...(backend || {}),

      // Keep local game id for frontend routing/game selection.
      id: mission.id,
      gameId: mission.gameId || mission.id,
      type: mission.type,
      gameType: mission.gameType,

      // Keep backend id for claim/complete API behavior.
      missionId:
        backend?.missionId ||
        backend?.id ||
        mission.missionId ||
        mission.id,

      // Backend is source of truth for public mission reward/content fields.
      title: getTagalogMissionTitle(mission.id, mission.title || backend?.title),
      name: getTagalogMissionTitle(mission.id, mission.name || mission.title || backend?.title),
      xp,
      xpReward: xp,
      rewardXp: xp,

      // Web-style frontend card content.
      module: backend?.module || mission.module,
      short:
        backend?.short ||
        backend?.tagline ||
        backend?.description ||
        mission.short ||
        mission.subtitle ||
        '',
      subtitle:
        backend?.subtitle ||
        backend?.tagline ||
        backend?.description ||
        mission.subtitle ||
        mission.short ||
        '',
      description:
        backend?.description ||
        backend?.instructions ||
        mission.description ||
        mission.instruction ||
        '',
      instructions:
        backend?.instructions ||
        backend?.description ||
        mission.instructions ||
        mission.instruction ||
        '',

      icon: backend?.icon || backend?.emoji || mission.icon,
      tone: backend?.tone || backend?.color || mission.tone,

      state,
      status: state,
      baseStatus: backend?.baseStatus || mission.baseStatus || 'Handa na',
      progress,
      attemptCount,
      attemptsUsed: attemptCount,
      maxAttempts,
      requirement: backend?.requirement || mission.requirement || null,
    };
  });
}

export default function MissionScreen({ navigation, route }) {
  const [missions, setMissions] = useState(MISSION_GAMES);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [selectedMission, setSelectedMission] = useState(null);
  const [error, setError] = useState('');
  const [missionAttemptOverrides, setMissionAttemptOverrides] = useState({});
  const missionAttemptOverridesRef = useRef({});

  const gradeLevel = Number(student?.gradeLevel || 1);
  const isEarlyGrade = gradeLevel <= 2;

  const completedCount = useMemo(
    () => missions.filter(isCompleted).length,
    [missions]
  );

  const totalXp = useMemo(
    () => missions.reduce(
      (sum, mission) => sum + Number(mission.xpReward ?? mission.xp ?? 0),
      0
    ),
    [missions]
  );


  const syncMissionAttemptOverrides = useCallback((nextOverrides = {}) => {
    const normalizedOverrides = nextOverrides || {};
    missionAttemptOverridesRef.current = normalizedOverrides;

    setMissionAttemptOverrides((currentOverrides) => {
      const currentText = JSON.stringify(currentOverrides || {});
      const nextText = JSON.stringify(normalizedOverrides);

      return currentText === nextText
        ? currentOverrides
        : normalizedOverrides;
    });
  }, []);

  const buildMissionsWithAttemptOverrides = useCallback((
    backendMissions = [],
    overrides = {}
  ) => {
    const merged = buildMergedMissions(
      Array.isArray(backendMissions) ? backendMissions : []
    );

    return merged.map((mission = {}) => {
      const keys = [
        mission.missionId,
        mission.id,
        mission.key,
        mission.gameId,
        mission.type,
        mission.gameType,
      ]
        .filter(Boolean)
        .map(String);

      const override = keys
        .map((key) => overrides[key])
        .find(Boolean);

      if (!override) {
        return mission;
      }

      const maxAttempts = Math.max(
        MAX_MISSION_ATTEMPTS,
        Number(
          override.maxAttempts ||
          mission.maxAttempts ||
          MAX_MISSION_ATTEMPTS
        )
      );

      const overrideAttemptNo = Number(
        override.attemptNo || 0
      );

      const attemptCount = Math.max(
        getMissionAttemptCount(mission),
        overrideAttemptNo
      );

      const cappedAttemptCount = Math.max(
        0,
        Math.min(maxAttempts, attemptCount)
      );

      const progress = Math.round(
        (cappedAttemptCount / maxAttempts) * 100
      );

      const shouldRemainActive =
        cappedAttemptCount > 0 &&
        cappedAttemptCount < maxAttempts &&
        missionState(mission) !== 'claimed';

      return {
        ...mission,
        attemptCount: cappedAttemptCount,
        attemptsUsed: cappedAttemptCount,
        currentAttemptNo: Math.min(
          maxAttempts,
          cappedAttemptCount + 1
        ),
        attemptNo: Math.min(
          maxAttempts,
          cappedAttemptCount + 1
        ),
        attemptLabel: `Pagsubok ${Math.min(maxAttempts, cappedAttemptCount + 1)} sa ${maxAttempts}`,
        maxAttempts,
        progress,
        percent: progress,
        state: shouldRemainActive ? 'ready' : mission.state,
        status: shouldRemainActive ? 'ready' : mission.status,
      };
    });
  }, []);

  const load = useCallback(async (overrides = missionAttemptOverridesRef.current) => {
    const storedOverrides = await readStoredMissionAttempts();
    const combinedOverrides = {
      ...storedOverrides,
      ...overrides,
    };
    setLoading(true);
    setError('');

    try {
      const dashboard = await api('/dashboard');
      const merged = buildMissionsWithAttemptOverrides(dashboard.missions || [], combinedOverrides);
      syncMissionAttemptOverrides(combinedOverrides);

      setMissions(merged);
      setStudent(dashboard.student || null);
    } catch (err) {
      setMissions(buildMissionsWithAttemptOverrides([], combinedOverrides));
      syncMissionAttemptOverrides(combinedOverrides);
      setError('Hindi makuha ang mga misyon. Pakisubukan muli.');
    } finally {
      setLoading(false);
    }
  }, [buildMissionsWithAttemptOverrides, syncMissionAttemptOverrides]);

  useFocusEffect(
    useCallback(() => {
      const update = route?.params?.missionAttemptUpdate;

      if (update?.missionApiId || update?.missionId) {
        const attemptNo = Number(update.attemptNo || 0);
        const maxAttempts = Math.max(
          MAX_MISSION_ATTEMPTS,
          Number(update.maxAttempts || MAX_MISSION_ATTEMPTS)
        );

        const keys = [
          update.missionApiId,
          update.missionId,
          update.gameId,
        ]
          .filter(Boolean)
          .map(String);

        const nextOverrides = {
          ...missionAttemptOverridesRef.current,
        };

        keys.forEach((key) => {
          const previous = Number(
            nextOverrides[key]?.attemptNo || 0
          );

          nextOverrides[key] = {
            attemptNo: Math.max(previous, attemptNo),
            maxAttempts,
          };
        });

        syncMissionAttemptOverrides(nextOverrides);
        writeStoredMissionAttempts(nextOverrides);
        load(nextOverrides);

        navigation.setParams?.({
          missionAttemptUpdate: undefined,
        });

        return;
      }

      load();
    }, [
      load,
      navigation,
      route?.params?.missionAttemptUpdate,
      syncMissionAttemptOverrides,
    ])
  );

  async function claimMission(mission) {
    const missionId = getMissionKey(mission);

    if (!missionId) {
      Alert.alert('May Problema', 'Hindi makita ang mission ID.');
      return;
    }

    setSubmittingId(missionId);

    try {
      const data = await api(`/missions/${missionId}/claim`, {
        method: 'POST',
      });

      Alert.alert(
        'Nakuha ang Gantimpala',
        data.message || `+${data.xpAwarded || mission.xpReward || mission.xp} XP ang nakuha!`
      );

      setSelectedMission(null);
      load();
    } catch (err) {
      Alert.alert(
        'May Problema',
        err.message || 'Hindi makuha ang gantimpala.'
      );
    } finally {
      setSubmittingId(null);
    }
  }

  function openMission(mission) {
    setSelectedMission(mission);
  }

  if (selectedMission) {
    const tone = getTone(selectedMission.tone);
    const state = missionState(selectedMission);
    const completed = isCompleted(selectedMission);
    const claimable = isClaimable(selectedMission);
    const submitting = submittingId === getMissionKey(selectedMission);

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => setSelectedMission(null)}
          >
            <Text style={styles.backButtonText}>← Bumalik sa Mga Misyon</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.playHero,
              {
                backgroundColor: tone.soft,
                borderColor: tone.mid,
              },
            ]}
          >
            <View
              style={[
                styles.playIcon,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: tone.mid,
                },
              ]}
            >
              <Text style={styles.playIconText}>{selectedMission.icon}</Text>
            </View>

            <Text style={[styles.playEyebrow, { color: tone.strong }]}>
              {selectedMission.module}
            </Text>
            <Text style={styles.playTitle}>{selectedMission.title}</Text>
            <Text style={styles.playSubtitle}>{selectedMission.short}</Text>

            <View style={styles.playMetaRow}>
              <View style={styles.playMetaPill}>
                <Text style={[styles.playMetaValue, { color: tone.strong }]}>
                  +{selectedMission.xp}
                </Text>
                <Text style={styles.playMetaLabel}>XP</Text>
              </View>

              <View style={styles.playMetaPill}>
                <Text style={[styles.playMetaValue, { color: tone.strong }]}>
                  G{gradeLevel}
                </Text>
                <Text style={styles.playMetaLabel}>Baitang</Text>
              </View>

              <View style={styles.playMetaPill}>
                <Text style={[styles.playMetaValue, { color: tone.strong }]}>
                  {completed ? '✓' : claimable ? '★' : '▶'}
                </Text>
                <Text style={styles.playMetaLabel}>{statusLabel(selectedMission)}</Text>
                <Text style={styles.playAttemptLabel}>{missionAttemptLabel(selectedMission)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailLabel}>Panuto</Text>
            <Text style={styles.detailText}>{selectedMission.instruction}</Text>

            {!!selectedMission.sample && (
              <View style={[styles.sampleBox, { backgroundColor: tone.soft }]}>
                <Text style={[styles.sampleLabel, { color: tone.strong }]}>
                  Halimbawa
                </Text>
                <Text style={styles.sampleText}>{selectedMission.sample}</Text>
              </View>
            )}

            <View style={styles.rewardBox}>
              <Text style={styles.rewardIcon}>🏆</Text>
              <View style={styles.rewardTextWrap}>
                <Text style={styles.rewardTitle}>Gantimpala</Text>
                <Text style={styles.rewardText}>
                  {selectedMission.reward || `Makakuha ng +${selectedMission.xp} XP`}
                </Text>
              </View>
            </View>

            {selectedMission.future ? (
              <Text style={styles.futureNote}>
                Maaaring ikonekta ang pagsusuri ng pagbigkas sa susunod.
              </Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  backgroundColor: completed
                    ? '#94A3B8'
                    : claimable
                      ? '#F59E0B'
                      : tone.strong,
                },
              ]}
              activeOpacity={0.85}
              disabled={submitting || completed}
              onPress={() => {
                  if (claimable) {
                    claimMission(selectedMission);
                    return;
                  }

                  const missionId = getMissionKey(selectedMission);
                  if (!missionId) {
                    Alert.alert('May Problema', 'Hindi makita ang mission ID.');
                    return;
                  }

                  navigation.navigate('MissionGame', {
                    missionId: selectedMission.gameId || selectedMission.id,
                    missionApiId: getMissionKey(selectedMission),
                    mission: selectedMission,
                    gradeLevel,
                  });
                }}
            >
              <Text style={styles.playButtonText}>
                {submitting
                  ? 'Kinukuha...'
                  : completed
                    ? '✓ Natapos'
                    : claimable
                      ? 'Kunin ang Bituin'
                      : 'Simulan ang Misyon'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, isEarlyGrade && styles.heroCardEarly]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroEyebrow}>MGA MISYON</Text>
              <Text style={styles.heroTitle}>
                Maglaro, magsanay, at kumita ng XP!
              </Text>
              <Text style={styles.heroSubtitle}>
                Piliin ang misyon para sa Pagbasa, Bokabularyo, Panitikan, Oral Comm, at Pagsulat.
              </Text>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeIcon}>🚀</Text>
              <Text style={styles.heroBadgeText}>Baitang {gradeLevel}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{student?.xp || 0}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{completedCount}</Text>
              <Text style={styles.statLabel}>Natapos</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalXp}</Text>
              <Text style={styles.statLabel}>Gantimpalang XP</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#16A34A" size="large" />
            <Text style={styles.loadingText}>Inaayos ang mga misyon...</Text>
          </View>
        ) : null}

        {!!error && !loading ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Hindi makuha ang mga misyon</Text>
            <Text style={styles.errorText}>Pakisubukan muli.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={load}>
              <Text style={styles.retryButtonText}>Subukan Muli</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && missions.map((mission) => {
          const tone = getTone(mission.tone);
          const completed = isCompleted(mission);
          const claimable = isClaimable(mission);
          const progress = getMissionProgress(mission);

          return (
            <TouchableOpacity
              key={mission.id}
              style={[
                styles.missionCard,
                {
                  borderColor: tone.mid,
                  backgroundColor: completed ? '#F8FAFC' : '#FFFFFF',
                },
              ]}
              activeOpacity={0.88}
              onPress={() => openMission(mission)}
            >
              <View
                style={[
                  styles.missionGlow,
                  {
                    backgroundColor: tone.soft,
                  },
                ]}
              />

              <View style={styles.missionTop}>
                <View
                  style={[
                    styles.missionIconBox,
                    {
                      backgroundColor: tone.soft,
                      borderColor: tone.mid,
                    },
                  ]}
                >
                  <Text style={styles.missionIcon}>{mission.icon}</Text>
                </View>

                <View style={styles.missionTextWrap}>
                  <Text style={[styles.missionModule, { color: tone.strong }]}>
                    {mission.module}
                  </Text>
                  <Text style={styles.missionTitle}>{mission.title}</Text>
                  <Text style={styles.missionShort}>{mission.short}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: completed
                        ? '#DCFCE7'
                        : claimable
                          ? '#FEF3C7'
                          : tone.soft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: completed
                          ? '#166534'
                          : claimable
                            ? '#92400E'
                            : tone.strong,
                      },
                    ]}
                  >
                    {statusLabel(mission)}
                  </Text>
                  <Text style={styles.missionAttemptText}>{missionAttemptLabel(mission)}</Text>
                </View>
              </View>

              <Text style={styles.missionInstruction}>{mission.instruction}</Text>

              {!!mission.sample && (
                <View style={styles.inlineSample}>
                  <Text style={styles.inlineSampleLabel}>Halimbawa:</Text>
                  <Text style={styles.inlineSampleText}>{mission.sample}</Text>
                </View>
              )}

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(0, Math.min(100, progress))}%`,
                      backgroundColor: tone.strong,
                    },
                  ]}
                />
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={[styles.xpText, { color: tone.strong }]}>
                  +{mission.xp} XP
                </Text>

                <Text style={styles.openText}>
                  {completed ? 'Tingnan →' : claimable ? 'Kunin →' : 'Buksan →'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {!loading && !error && !missions.length ? (
          <Text style={styles.emptyText}>Wala pang misyon sa ngayon.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  screen: {
    flex: 1,
    backgroundColor: '#ECFDF5',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 120,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    marginBottom: 18,
  },

  heroCardEarly: {
    borderRadius: 36,
    borderWidth: 2,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroEyebrow: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  heroTitle: {
    color: '#0F172A',
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
  },

  heroSubtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 8,
  },

  heroBadge: {
    width: 72,
    minHeight: 72,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  heroBadgeIcon: {
    fontSize: 28,
  },

  heroBadgeText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  statValue: {
    color: '#16A34A',
    fontSize: 22,
    fontWeight: '900',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
  },

  missionCard: {
    borderRadius: 30,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },

  missionGlow: {
    position: 'absolute',
    top: -34,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 999,
    opacity: 0.8,
  },

  missionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  missionIconBox: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  missionIcon: {
    fontSize: 34,
  },

  missionTextWrap: {
    flex: 1,
  },

  missionModule: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  missionTitle: {
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
    marginTop: 3,
  },

  missionShort: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginTop: 4,
  },

  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  missionAttemptText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'right',
  },

  missionInstruction: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 14,
  },

  inlineSample: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  inlineSampleLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 3,
  },

  inlineSampleText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },

  progressTrack: {
    height: 9,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginTop: 14,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
  },

  xpText: {
    fontSize: 15,
    fontWeight: '900',
  },

  openText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },

  loadingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  retryButton: {
    backgroundColor: '#DC2626',
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 36,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },

  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },

  backButtonText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '900',
  },

  playHero: {
    borderRadius: 34,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowColor: '#14532D',
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },

  playIcon: {
    width: 86,
    height: 86,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  playIconText: {
    fontSize: 44,
  },

  playEyebrow: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
  },

  playTitle: {
    color: '#0F172A',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },

  playSubtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },

  playMetaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  playMetaPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  playMetaValue: {
    fontSize: 20,
    fontWeight: '900',
  },

  playAttemptLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },

  playMetaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 3,
    textAlign: 'center',
  },

  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 16,
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  detailLabel: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },

  detailText: {
    color: '#334155',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '800',
    marginTop: 8,
  },

  sampleBox: {
    borderRadius: 22,
    padding: 15,
    marginTop: 16,
  },

  sampleLabel: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },

  sampleText: {
    color: '#0F172A',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
  },

  rewardBox: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 16,
  },

  rewardIcon: {
    fontSize: 32,
  },

  rewardTextWrap: {
    flex: 1,
  },

  rewardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },

  rewardText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 3,
  },

  futureNote: {
    color: '#9F1239',
    backgroundColor: '#FFF1F2',
    borderRadius: 18,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 14,
  },

  playButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#14532D',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
