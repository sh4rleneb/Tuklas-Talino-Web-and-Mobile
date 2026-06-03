import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

export default function GroupsScreen() {
  const [groups, setGroups] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dashboard = await api('/dashboard');
      setGroups(dashboard.groups || []);
      setStudent(dashboard.student || null);
    } catch (err) {
      setError(err.message || 'Unable to load group tasks.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function complete(taskId) {
    try {
      const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      Alert.alert('Group Task', data.message || 'Submitted for teacher review.');
      load();
    } catch (err) {
      Alert.alert('Group Task', err.message || 'Unable to submit this task.');
    }
  }

  function taskStatus(task) {
    if (task.completed) return 'Approved';
    if (task.pendingTeacherCheck) return 'Pending teacher review';
    if (task.returnedByTeacher) return 'Returned for revision';
    return 'Not submitted';
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Group Tasks</Text>
          <Text style={styles.muted}>Work together and wait for teacher approval.</Text>
        </View>
        {student && (
          <View style={styles.studentChip}>
            <Text style={styles.studentAvatar}>{student.avatar || '🧒'}</Text>
            <Text style={styles.studentXp}>{student.xp || 0} XP</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.muted}>Loading group tasks...</Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : groups.map(group => (
          <Card key={group.id}>
            <Text style={styles.group}>🤝 {group.name}</Text>
            <Text style={styles.muted}>{group.description || 'Your assigned learning group.'}</Text>
            <Text style={styles.role}>{group.currentStudentIsLeader ? 'You are the group leader.' : 'Your group leader submits tasks.'}</Text>
            {(group.tasks || []).map(task => (
              <Card key={task.id} style={styles.inner}>
                <Text style={styles.task}>{task.title}</Text>
                <Text>{task.description}</Text>
                <Text style={styles.taskXp}>+{task.xpReward || 0} XP</Text>
                <Text style={styles.status}>{taskStatus(task)}</Text>
                {group.currentStudentIsLeader && !task.completed && !task.pendingTeacherCheck && (
                  <PrimaryButton variant="secondary" onPress={() => complete(task.id)}>
                    {task.returnedByTeacher ? 'Resubmit for Review' : 'Submit for Review'}
                  </PrimaryButton>
                )}
              </Card>
            ))}
            {(group.tasks || []).length === 0 && (
              <Text style={styles.muted}>No tasks have been assigned to this group yet.</Text>
            )}
          </Card>
        ))}

      {!loading && !error && !groups.length && <Text style={styles.muted}>No group assigned yet.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink },
  studentChip: { alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 18, padding: 8 },
  studentAvatar: { fontSize: 26 },
  studentXp: { color: colors.ink, fontWeight: '800', fontSize: 12 },
  group: { fontSize: 18, fontWeight: '900', color: colors.ink },
  task: { fontWeight: '900', marginBottom: 6 },
  muted: { color: colors.muted },
  role: { color: colors.muted, fontSize: 12, marginTop: 8 },
  inner: { backgroundColor: '#fff7df', marginTop: 10 },
  taskXp: { color: colors.green, fontWeight: '900', marginTop: 8 },
  status: { color: colors.muted, marginTop: 4 },
  center: { alignItems: 'center', paddingVertical: 50 },
  error: { color: '#B91C1C', textAlign: 'center', marginTop: 30 },
});
