import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

function formatXpLogDate(log) {
  const raw = log.createdAt || log.created_at || log.awardedAt || log.awarded_at;
  if (!raw) return 'Walang Petsa';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'Walang Petsa';

  return date.toLocaleString('fil-PH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function translateXpLessonTitle(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  const lower = raw.toLowerCase();

  const lessonTitleMap = {
    noun: 'Pangngalan',
    nouns: 'Pangngalan',
    verb: 'Pandiwa',
    verbs: 'Pandiwa',
    adjective: 'Pang-uri',
    adjectives: 'Pang-uri',
    pronoun: 'Panghalip',
    pronouns: 'Panghalip',
    adverb: 'Pang-abay',
    adverbs: 'Pang-abay',
  };

  return lessonTitleMap[lower] || raw;
}

function getXpNote(log) {
  const note = String(log?.note || '').replace(/\s+/g, ' ').trim();

  if (!note) return 'Nakuhang XP';

  const exactTranslations = {
    'Completed lesson': 'Natapos ang aralin',
    'Completed quiz': 'Natapos ang pagsusulit',
    'Submitted quiz result': 'Nakapagsumite ng resulta ng pagsusulit',
    'Correct MCQ answer': 'Tamang sagot sa pagpipilian',
    'Correct answer': 'Tamang sagot',
    'Submitted speech attempt': 'Nakapagsumite ng pagsubok sa pagbigkas',
    'Submitted writing attempt': 'Nakapagsumite ng pagsubok sa pagsulat',
    'Earned badge': 'Nakakuha ng badge',
    'Mission completed': 'Natapos ang misyon',
    'Completed Nouns': 'Natapos ang aralin: Pangngalan',
  };

  if (exactTranslations[note]) {
    return exactTranslations[note];
  }

  const completedMatch = note.match(/^Completed\s+(.+)$/i);
  if (completedMatch) {
    return `Natapos ang aralin: ${translateXpLessonTitle(completedMatch[1])}`;
  }

  const submittedMatch = note.match(/^Submitted\s+(.+?)\s+attempt$/i);
  if (submittedMatch) {
    const attemptType = submittedMatch[1].toLowerCase();
    if (attemptType === 'speech') return 'Nakapagsumite ng pagsubok sa pagbigkas';
    if (attemptType === 'writing') return 'Nakapagsumite ng pagsubok sa pagsulat';
    return `Nakapagsumite ng pagsubok sa ${translateXpLessonTitle(attemptType)}`;
  }

  return note;
}


function getXpIcon(log) {
  if (log.sourceType === 'lesson') return '📚';
  if (log.sourceType === 'quiz') return '📝';
  if (log.sourceType === 'mcq') return '🧠';
  if (log.sourceType === 'writing') return '✍️';
  if (log.sourceType === 'speech') return '🎤';
  if (log.sourceType === 'mission') return '🚀';
  return '⭐';
}

function formatXpLogNote(log = {}) {
  const value = String(log.note || '').trim();
  const normalized = value.toLowerCase();

  const translations = {
    'correct fill-in-the-blank writing task':
      'Tamang sagot sa gawaing pagpuno sa patlang',
    'correct mcq answer':
      'Tamang sagot sa tanong na may pagpipilian',
    'correct answer':
      'Tamang sagot',
    'lesson completed':
      'Natapos ang aralin',
    'completed lesson':
      'Natapos ang aralin',
    'quiz completed':
      'Natapos ang pagsusulit',
    'completed quiz':
      'Natapos ang pagsusulit',
    'perfect quiz':
      'Perpektong iskor sa pagsusulit',
    'writing task submitted':
      'Naisumite ang gawaing pagsulat',
    'speech attempt submitted':
      'Naisumite ang pagsubok sa pagbigkas',
    'mission completed':
      'Natapos ang misyon',
    'group task completed':
      'Natapos ang gawaing pangkat',
  };

  if (translations[normalized]) {
    return translations[normalized];
  }

  const fallbacks = {
    lesson: 'Nakuhang XP sa aralin',
    quiz: 'Nakuhang XP sa pagsusulit',
    mcq: 'Nakuhang XP sa tamang sagot',
    writing: 'Nakuhang XP sa gawaing pagsulat',
    speech: 'Nakuhang XP sa pagbigkas',
    mission: 'Nakuhang XP sa misyon',
  };

  return fallbacks[log.sourceType] || 'Nakuhang XP';
}


function normalizeXpSourceType(log = {}) {
  return String(
    log.sourceType ||
    log.source_type ||
    log.type ||
    log.kind ||
    ''
  ).trim().toLowerCase();
}

function getXpSourceLabel(log = {}) {
  const sourceType = normalizeXpSourceType(log);

  const labels = {
    lesson: 'Aralin',
    quiz: 'Pagsusulit',
    mcq: 'Tanong na may pagpipilian',
    writing: 'Pagsulat',
    speech: 'Pagbigkas',
    mission: 'Misyon',
    group: 'Pangkat',
    group_task: 'Gawaing pangkat',
    badge: 'Gantimpala',
  };

  return labels[sourceType] || 'Gawain';
}

function getDetailedXpIcon(log = {}) {
  const sourceType = normalizeXpSourceType(log);

  if (sourceType === 'lesson') return '📚';
  if (sourceType === 'quiz') return '📝';
  if (sourceType === 'mcq') return '🧠';
  if (sourceType === 'writing') return '✍️';
  if (sourceType === 'speech') return '🎤';
  if (sourceType === 'mission') return '🚀';
  if (sourceType === 'group' || sourceType === 'group_task') return '👥';
  if (sourceType === 'badge') return '🏅';

  return '⭐';
}

function extractXpLogLessonTitle(note = '') {
  const value = String(note || '').replace(/\s+/g, ' ').trim();

  const forMatch = value.match(/\bfor\s+(.+?)(?:\s*:\s*\d+%|\s*$)/i);
  if (forMatch) return translateXpLessonTitle(forMatch[1]);

  const completedMatch = value.match(/^Completed\s+(.+)$/i);
  if (completedMatch) return translateXpLessonTitle(completedMatch[1]);

  return '';
}

function extractXpLogPercent(note = '') {
  const value = String(note || '');
  const match = value.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? `${match[1]}%` : '';
}

function formatDetailedXpLogNote(log = {}) {
  const value = String(log.note || '').replace(/\s+/g, ' ').trim();
  const normalized = value.toLowerCase();

  const translations = {
    'correct fill-in-the-blank writing task': 'Tamang sagot sa gawaing pagpuno sa patlang',
    'correct mcq answer': 'Tamang sagot sa tanong na may pagpipilian',
    'correct answer': 'Tamang sagot',
    'lesson completed': 'Natapos ang aralin',
    'completed lesson': 'Natapos ang aralin',
    'quiz completed': 'Natapos ang pagsusulit',
    'completed quiz': 'Natapos ang pagsusulit',
    'submitted quiz result': 'Nakapagsumite ng resulta ng pagsusulit',
    'perfect quiz': 'Perpektong iskor sa pagsusulit',
    'writing task submitted': 'Naisumite ang gawaing pagsulat',
    'submitted writing attempt': 'Nakapagsumite ng pagsubok sa pagsulat',
    'speech attempt submitted': 'Naisumite ang pagsubok sa pagbigkas',
    'submitted speech attempt': 'Nakapagsumite ng pagsubok sa pagbigkas',
    'mission completed': 'Natapos ang misyon',
    'group task completed': 'Natapos ang gawaing pangkat',
    'earned badge': 'Nakakuha ng gantimpala',
    'completed nouns': 'Natapos ang aralin: Pangngalan',
  };

  if (translations[normalized]) return translations[normalized];

  const quizParticipation = value.match(/^Quiz participation for\s+(.+?)(?:\s*:\s*(\d+(?:\.\d+)?)%)?$/i);
  if (quizParticipation) return 'Pakikilahok sa pagsusulit';

  const quizImprovement = value.match(/^Quiz improvement\s+(.+?)\s+for\s+(.+?)(?:\s*:\s*(\d+(?:\.\d+)?)%)?$/i);
  if (quizImprovement) return `Pagbuti sa pagsusulit (${quizImprovement[1]})`;

  const completedMatch = value.match(/^Completed\s+(.+)$/i);
  if (completedMatch) return `Natapos ang aralin: ${translateXpLessonTitle(completedMatch[1])}`;

  const submittedMatch = value.match(/^Submitted\s+(.+?)\s+attempt$/i);
  if (submittedMatch) {
    const attemptType = submittedMatch[1].toLowerCase();
    if (attemptType === 'speech') return 'Nakapagsumite ng pagsubok sa pagbigkas';
    if (attemptType === 'writing') return 'Nakapagsumite ng pagsubok sa pagsulat';
    return `Nakapagsumite ng pagsubok sa ${translateXpLessonTitle(attemptType)}`;
  }

  const fallbacks = {
    lesson: 'Nakuhang XP sa aralin',
    quiz: 'Nakuhang XP sa pagsusulit',
    mcq: 'Nakuhang XP sa tamang sagot',
    writing: 'Nakuhang XP sa gawaing pagsulat',
    speech: 'Nakuhang XP sa pagbigkas',
    mission: 'Nakuhang XP sa misyon',
    group: 'Nakuhang XP sa gawaing pangkat',
    group_task: 'Nakuhang XP sa gawaing pangkat',
    badge: 'Nakuhang XP sa gantimpala',
  };

  return fallbacks[normalizeXpSourceType(log)] || 'Nakuhang XP';
}

function getXpDetailLines(log = {}) {
  const rawNote = String(log.note || '').replace(/\s+/g, ' ').trim();
  const details = [
    `Pinagmulan: ${getXpSourceLabel(log)}`,
    `Nakuha: +${Number(log.points || 0)} XP`,
  ];

  const lessonTitle = extractXpLogLessonTitle(rawNote);
  if (lessonTitle) details.push(`Aralin/Gawain: ${lessonTitle}`);

  const percent = extractXpLogPercent(rawNote);
  if (percent) details.push(`Iskor: ${percent}`);

  details.push(`Kailan: ${formatXpLogDate(log)}`);

  return details;
}

function getXpProfileDetail(log = {}) {
  const rawNote = String(log.note || '').replace(/\s+/g, ' ').trim();
  const lessonTitle = extractXpLogLessonTitle(rawNote);
  const percent = extractXpLogPercent(rawNote);
  const parts = [`Pinagmulan: ${getXpSourceLabel(log)}`];

  if (lessonTitle) parts.push(`Gawain: ${lessonTitle}`);
  if (percent) parts.push(`Iskor: ${percent}`);

  return parts.join(' • ');
}

export default function XPHistoryScreen({ navigation, route }) {
  const logs = route?.params?.xpLogs || [];
  const totalListedXp = logs.reduce(
    (sum, log) => sum + Number(log?.points || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Bumalik sa Aking Impormasyon</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.title}>⭐ Detalyadong Kasaysayan ng XP</Text>
          <Text style={styles.subtitle}>Makikita rito ang pinagmulan, puntos, petsa, at detalye ng bawat XP.</Text>
        </View>

        {logs.length ? (
          logs.map((log, index) => (
            <View key={log.id || index} style={styles.xpLogItem}>
              <View style={styles.xpLogAccent} />

              <View style={styles.xpLogIconBubble}>
                <Text style={styles.xpLogIcon}>{getXpIcon(log)}</Text>
              </View>

                <View style={styles.xpLogContent}>
                  <View style={styles.xpLogTopRow}>
                    <Text style={styles.xpLogPoints}>+{Number(log.points || 0)} XP</Text>
                    <Text style={styles.xpSourceBadge}>{getXpSourceLabel(log)}</Text>
                  </View>

                  <Text style={styles.xpLogNote}>{formatDetailedXpLogNote(log)}</Text>

                  <View style={styles.xpDetailList}>
                    {getXpDetailLines(log).map((detail) => (
                      <Text key={detail} style={styles.xpDetailText}>
                        {detail}
                      </Text>
                    ))}
                  </View>
                </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Wala ka pang kasaysayan ng XP.</Text>
            <Text style={styles.emptyText}>Tapusin ang mga aralin, pagsusulit, at misyon upang makakuha ng XP.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  page: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 42,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 18,
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  backText: {
    color: '#166534',
    fontWeight: '900',
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 28,
  },
  subtitle: {
    color: '#64748B',
    marginTop: 6,
    fontWeight: '700',
  },
  xpLogItem: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  xpLogAccent: {
    width: 5,
    backgroundColor: '#22C55E',
    borderRadius: 99,
    marginRight: 12,
  },
  xpLogIconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  xpLogIcon: {
    fontSize: 26,
  },
  xpLogContent: {
    flex: 1,
  },
  xpLogPoints: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 16,
  },
  xpLogNote: {
    color: '#334155',
    marginTop: 4,
  },
  xpDate: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 5,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    elevation: 2,
  },
  emptyTitle: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 18,
  },
  emptyText: {
    color: '#64748B',
    marginTop: 6,
  },
});
