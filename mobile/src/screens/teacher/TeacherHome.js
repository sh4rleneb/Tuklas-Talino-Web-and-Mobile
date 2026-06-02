import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  getTeacherDashboard,
  getTeacherMonitoringStats,
  getTeacherQuizPerformance,
  getPendingGroupChecks,
  getTeacherGroups,
} from '../../api/teacher';
import { logout } from '../../api/auth';

export default function TeacherHome({ navigation }) {
  const [dashboard, setDashboard] = useState(null);
  const [monitoring, setMonitoring] = useState(null);
  const [quizPerformance, setQuizPerformance] = useState(null);
  const [pendingChecks, setPendingChecks] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, monitoringData, quizData, pendingData, groupData] = await Promise.all([
        getTeacherDashboard(),
        getTeacherMonitoringStats(),
        getTeacherQuizPerformance(),
        getPendingGroupChecks(),
        getTeacherGroups(),
      ]);

      setDashboard(dashData);
      setMonitoring(monitoringData);
      setQuizPerformance(quizData);
      setPendingChecks(pendingData);
      setGroups((groupData.groups || []).filter((group) => String(group.status || 'active').toLowerCase() !== 'archived'));
    } catch (err) {
      console.warn('Teacher dashboard load failed', err);
      setError(err.message || 'Unable to load teacher dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const stats = dashboard?.stats || {};
  const assignedClasses = dashboard?.assignedClasses || [];
  const quizSummary = quizPerformance?.summary || {};
  const pendingCount = pendingChecks?.summary?.pending || 0;
  const monitoredStudents = monitoring?.rows?.length ?? 0;

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  if (loading && !dashboard) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loaderText}>Loading teacher dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Teacher Dashboard</Text>
            <Text style={styles.subtitle}>View class progress, quizzes, and group tasks in one place.</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadDashboard}>
              <Text style={styles.refreshText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.students ?? 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.lessons ?? 0}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.completed ?? 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.groups ?? 0}</Text>
            <Text style={styles.statLabel}>Groups</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Assigned classes</Text>
          {assignedClasses.length ? (
            assignedClasses.map((item) => (
              <View key={`${item.gradeLevel}-${item.section}-${item.id}`} style={styles.tagRow}>
                <Text style={styles.tagText}>Grade {item.gradeLevel} • {item.section}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardNote}>No class assignments found.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Quiz performance</Text>
          <View style={styles.cardGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{quizSummary.total ?? 0}</Text>
              <Text style={styles.metricLabel}>Records</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{quizSummary.averageBest ?? 0}%</Text>
              <Text style={styles.metricLabel}>Average best</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{quizSummary.needsSupport ?? 0}</Text>
              <Text style={styles.metricLabel}>Needs support</Text>
            </View>
          </View>
          <Text style={styles.cardNote}>{monitoredStudents} monitored learner{monitoredStudents === 1 ? '' : 's'} included in this view.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Pending group checks</Text>
          <Text style={styles.cardNote}>{pendingCount} group task(s) need review.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Recent groups</Text>
          {groups.slice(0, 4).map((group) => (
            <View key={group.id} style={styles.groupRow}>
              <View>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <Text style={styles.groupMeta}>{group.members?.length || 0} member(s)</Text>
              </View>
              <Text style={styles.groupStatus}>{String(group.status || 'active')}</Text>
            </View>
          ))}
          {!groups.length ? (
            <Text style={styles.cardNote}>No active groups yet.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  contentContainer: {
    paddingBottom: 32,
    paddingTop: 18,
  },
  header: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '70%',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  logoutButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logoutText: {
    color: '#166534',
    fontWeight: '700',
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#334155',
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    marginTop: 6,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  cardNote: {
    color: '#475569',
    lineHeight: 20,
  },
  cardGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  metricBlock: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    minWidth: '30%',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#166534',
  },
  metricLabel: {
    marginTop: 6,
    color: '#475569',
  },
  groupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  groupMeta: {
    color: '#64748B',
    marginTop: 2,
  },
  groupStatus: {
    color: '#166534',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  errorText: {
    color: '#991B1B',
    fontWeight: '700',
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshText: {
    color: '#991B1B',
    fontWeight: '700',
  },
  tagRow: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  tagText: {
    color: '#166534',
    fontWeight: '700',
  },
});
