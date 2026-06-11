import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function formatXpLogDate(log) {
  const raw = log.createdAt || log.created_at || log.awardedAt || log.awarded_at;
  if (!raw) return 'No date';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return 'No date';

  return date.toLocaleString('en-PH', {
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

export default function XPHistoryScreen({ navigation, route }) {
  const logs = route?.params?.xpLogs || [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Profile</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.title}>⭐ XP History</Text>
          <Text style={styles.subtitle}>All XP rewards and activity records.</Text>
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
                <Text style={styles.xpLogNote}>{log.note || 'XP earned'}</Text>
                <Text style={styles.xpDate}>🕒 {formatXpLogDate(log)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No XP activity yet.</Text>
            <Text style={styles.emptyText}>Complete lessons, quizzes, and missions to earn XP.</Text>
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
    padding: 20,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  backText: {
    color: '#16A34A',
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
