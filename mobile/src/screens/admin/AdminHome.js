import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  getAdminStats,
  getAdminEnrollments,
  getAdminAuditLogs,
  getActiveStudents,
  getActiveTeachers,
} from '../../api/admin';
import { logout } from '../../api/auth';

export default function AdminHome({ navigation }) {
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, enrollmentsData, studentData, teacherData, logsData] = await Promise.all([
        getAdminStats(),
        getAdminEnrollments(),
        getActiveStudents(),
        getActiveTeachers(),
        getAdminAuditLogs(20),
      ]);

      setStats(statsData.stats || {});
      setEnrollments(enrollmentsData);
      setStudents(studentData.students || []);
      setTeachers(teacherData.teachers || []);
      setLogs(logsData.logs || []);
    } catch (err) {
      console.warn('Admin dashboard load failed', err);
      setError(err.message || 'Unable to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color="#0F172A" />
          <Text style={styles.loaderText}>Loading admin dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage users, class assignments, and system logs.</Text>
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
            <Text style={styles.statValue}>{stats.users ?? 0}</Text>
            <Text style={styles.statLabel}>Total users</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.students ?? students.length}</Text>
            <Text style={styles.statLabel}>Active students</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.teachers ?? teachers.length}</Text>
            <Text style={styles.statLabel}>Active teachers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(enrollments?.teacherAssignments || []).length ?? 0}</Text>
            <Text style={styles.statLabel}>Assignments</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Class assignments</Text>
          {(enrollments?.teacherAssignments || []).length ? (
            (enrollments.teacherAssignments || []).slice(0, 4).map((assignment) => (
              <View key={assignment.id} style={styles.assignmentRow}>
                <View>
                  <Text style={styles.assignmentName}>{assignment.gradeLevel} • {assignment.section}</Text>
                  <Text style={styles.assignmentMeta}>{assignment.Teacher?.name || 'Teacher'}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.cardNote}>No teacher assignments configured yet.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Recent audit logs</Text>
          {logs.length ? (
            logs.slice(0, 6).map((log) => (
              <View key={log.id} style={styles.logRow}>
                <Text style={styles.logAction}>{log.action}</Text>
                <Text style={styles.logMeta}>{String(log.entityType || '')} #{log.entityId ?? '—'}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardNote}>No audit logs available.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Quick counts</Text>
          <View style={styles.cardGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{stats.lessons ?? 0}</Text>
              <Text style={styles.metricLabel}>Lessons</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{stats.completions ?? 0}</Text>
              <Text style={styles.metricLabel}>Completions</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{(enrollments?.classOptions || []).length ?? 0}</Text>
              <Text style={styles.metricLabel}>Sections</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  logoutText: {
    color: '#0F172A',
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
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  assignmentMeta: {
    color: '#64748B',
    marginTop: 2,
  },
  logRow: {
    marginBottom: 12,
  },
  logAction: {
    fontWeight: '700',
    color: '#0F172A',
  },
  logMeta: {
    color: '#64748B',
    marginTop: 2,
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
});
