import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

export default function GroupsScreen() {
  const [groups, setGroups] = useState([]);

  const load = useCallback(() => api('/groups').then(data => setGroups(data.groups || [])), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function complete(taskId) {
    const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
    Alert.alert('Group Task', data.xpAwarded ? `Complete! +${data.xpAwarded} XP` : 'Already completed.');
    load();
  }

  return (
    <ScrollView style={styles.screen}>
      <Text style={styles.title}>Group Tasks</Text>
      {groups.map(group => (
        <Card key={group.id}>
          <Text style={styles.group}>🤝 {group.name}</Text>
          <Text style={styles.muted}>{group.description}</Text>
          {(group.tasks || []).map(task => (
            <Card key={task.id} style={styles.inner}>
              <Text style={styles.task}>{task.title}</Text>
              <Text>{task.description}</Text>
              <PrimaryButton variant="secondary" onPress={() => complete(task.id)}>Complete</PrimaryButton>
            </Card>
          ))}
        </Card>
      ))}
      {!groups.length && <Text style={styles.muted}>No group assigned yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, marginBottom: 12 },
  group: { fontSize: 18, fontWeight: '900', color: colors.ink },
  task: { fontWeight: '900', marginBottom: 6 },
  muted: { color: colors.muted },
  inner: { backgroundColor: '#fff7df', marginTop: 10 }
});
