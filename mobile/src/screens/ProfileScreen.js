import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

const avatars = ['🦋','🐸','🦊','🐨','🦁','🐼','🐯','🐙','🦉','🐢'];

export default function ProfileScreen() {
  const [dashboard, setDashboard] = useState(null);
  const { logout } = useAuth();

  const load = useCallback(() => api('/students/dashboard').then(setDashboard), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function choose(avatar) {
    await api(`/students/${dashboard.student.id}/avatar`, { method: 'PATCH', body: { avatar } });
    Alert.alert('Avatar', 'Updated!');
    load();
  }

  if (!dashboard) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.screen}>
      <Card style={styles.header}>
        <Text style={styles.avatar}>{dashboard.student.avatar}</Text>
        <Text style={styles.title}>{dashboard.student.name}</Text>
        <Text style={styles.muted}>{dashboard.student.studentCode}</Text>
      </Card>
      <Text style={styles.heading}>Choose Avatar</Text>
      <View style={styles.avatars}>
        {avatars.map(a => <Pressable key={a} style={styles.choice} onPress={() => choose(a)}><Text style={styles.choiceText}>{a}</Text></Pressable>)}
      </View>
      <PrimaryButton variant="secondary" onPress={logout}>Logout</PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  header: { alignItems: 'center' },
  avatar: { fontSize: 70 },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink },
  muted: { color: colors.muted },
  heading: { fontSize: 20, fontWeight: '900', marginVertical: 12 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: { width: 64, height: 64, backgroundColor: '#fff', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  choiceText: { fontSize: 34 }
});
