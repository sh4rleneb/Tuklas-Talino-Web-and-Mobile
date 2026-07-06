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
import Card from '../components/Card';
import { colors } from '../styles/theme';

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
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.header}>
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>← Bumalik</Text>
            </TouchableOpacity>
            <Text style={styles.title}>🔔 Mga Abiso</Text>
            <Text style={styles.subtitle}>Updates from your teacher and learning activities.</Text>
          </View>
          {student && (
            <View style={styles.studentChip}>
              <Text style={styles.avatar}>{student.avatar || '🧒'}</Text>
              <Text style={styles.xp}>{student.xp || 0} XP</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.subtitle}>Ina-load ang mga abiso...</Text>
          </View>
        ) : error ? (
          <Card>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={load}>
              <Text style={styles.buttonText}>Subukang Muli</Text>
            </TouchableOpacity>
          </Card>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.message}>{notification.message}</Text>
              <Text style={styles.date}>
                {new Date(notification.createdAt).toLocaleString()}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => markRead(notification.id)}
                disabled={Boolean(readingId)}
              >
                <Text style={styles.buttonText}>
                  {readingId === notification.id ? 'Sine-save...' : 'Markahan bilang Nabasa'}
                </Text>
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <Card>
            <Text style={styles.notificationTitle}>Wala ka nang bagong abiso.</Text>
            <Text style={styles.message}>New learning updates will appear here.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  back: { color: colors.green, fontWeight: '900', marginBottom: 10 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: colors.muted, marginTop: 5, maxWidth: 260 },
  studentChip: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 18, padding: 8 },
  avatar: { fontSize: 26 },
  xp: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  center: { alignItems: 'center', paddingVertical: 50 },
  notificationTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  message: { color: colors.muted, lineHeight: 20, marginTop: 8 },
  date: { color: '#94A3B8', fontSize: 12, marginTop: 8 },
  button: { alignSelf: 'flex-start', backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  buttonText: { color: '#FFF', fontWeight: '900' },
  error: { color: '#B91C1C' },
});
