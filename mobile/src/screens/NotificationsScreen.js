import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../api/client';
import { colors } from '../styles/theme';

function formatNotificationDate(value) {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString('en-PH', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MgaAbisoScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [notificationData, dashboard] = await Promise.all([
        api('/students/notifications'),
        api('/dashboard'),
      ]);

      setNotifications(notificationData.notifications || []);
      setStudent(dashboard.student || null);
    } catch (err) {
      setError(err.message || 'Hindi ma-load ang mga abiso.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  async function markRead(notificationId) {
    if (readingId) return;

    setReadingId(notificationId);

    try {
      await api(`/students/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      setNotifications((items) => items.filter((item) => item.id !== notificationId));
    } catch (err) {
      Alert.alert('Mga Abiso', err.message || 'Hindi mamarkahan bilang nabasa ang abiso.');
    } finally {
      setReadingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Bumalik</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Mga update sa pag-aaral</Text>
              <Text style={styles.title}>🔔 Mga Abiso</Text>
              <Text style={styles.subtitle}>
                Makikita rito ang paalala mula sa iyong guro at bagong gawain.
              </Text>
            </View>

            {student ? (
              <View style={styles.studentChip}>
                <Text style={styles.avatar}>{student.avatar || '🧒'}</Text>
                <Text style={styles.xp}>{student.xp || 0} XP</Text>
              </View>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.centerCard}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>Ina-load ang mga abiso...</Text>
          </View>
        ) : error ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeIcon}>⚠️</Text>
            <Text style={styles.noticeTitle}>Hindi ma-load ang mga abiso</Text>
            <Text style={styles.noticeMessage}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={load}>
              <Text style={styles.buttonText}>Subukang Muli</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <View key={notification.id} style={styles.notificationCard}>
              <View style={styles.notificationIconBubble}>
                <Text style={styles.notificationIcon}>📣</Text>
              </View>

              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>
                  {notification.title || 'Bagong Abiso'}
                </Text>

                <Text style={styles.message}>
                  {notification.message || 'May bagong update para sa iyo.'}
                </Text>

                <Text style={styles.date}>
                  🕒 {formatNotificationDate(notification.createdAt || notification.created_at)}
                </Text>

                <TouchableOpacity
                  style={[styles.button, readingId === notification.id && styles.buttonDisabled]}
                  onPress={() => markRead(notification.id)}
                  disabled={Boolean(readingId)}
                >
                  <Text style={styles.buttonText}>
                    {readingId === notification.id ? 'Sine-save...' : 'Markahan bilang Nabasa'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeIcon}>✅</Text>
            <Text style={styles.noticeTitle}>Wala ka nang bagong abiso.</Text>
            <Text style={styles.noticeMessage}>
              Dito lalabas ang mga bagong paalala, gawain, at update mula sa iyong guro.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  page: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  back: {
    color: '#166534',
    fontWeight: '900',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  studentChip: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 22,
    padding: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  avatar: {
    fontSize: 28,
  },
  xp: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 12,
    marginTop: 3,
  },
  centerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  loadingText: {
    color: colors.muted,
    marginTop: 12,
    fontWeight: '800',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  notificationIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.ink,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  message: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 7,
    fontWeight: '700',
  },
  date: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 9,
    fontWeight: '800',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '900',
  },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#14532D',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  noticeIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  noticeTitle: {
    color: colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  noticeMessage: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
});
