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

export default function XPHistoryScreen({ navigation, route }) {
  const logs = route?.params?.xpLogs || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Bumalik sa Aking Impormasyon</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.title}>⭐ Kasaysayan ng XP</Text>
          <Text style={styles.subtitle}>Lahat ng natanggap na XP at tala ng mga gawain.</Text>
        </View>

        {logs.length ? (
          logs.map((log, index) => (
            <View key={log.id || index} style={styles.xpLogItem}>
              <View style={styles.xpLogAccent} />

              <View style={styles.xpLogIconBubble}>
                <Text style={styles.xpLogIcon}>{getXpIcon(log)}</Text>
              </View>

              <View style={styles.xpLogContent}>
                <Text style={styles.xpLogPoints}>+{log.points} XP</Text>
                <Text style={styles.xpLogNote}>{formatXpLogNote(log)}</Text>
                <Text style={styles.xpDate}>🕒 {formatXpLogDate(log)}</Text>
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
