import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  archiveStudent,
  archiveTeacher,
  assignTeacher,
  createStudentAccount,
  createTeacherAccount,
  getActivityLogsCsv,
  getActiveStudents,
  getActiveTeachers,
  getAdminAccounts,
  getAdminAuditLogs,
  getAdminEnrollments,
  getAdminStats,
  getArchivedStudents,
  getArchivedTeachers,
  getReportSummary,
  getStudentReportCsv,
  getSummaryReportText,
  reactivateStudent,
  reactivateTeacher,
  removeTeacherAssignment,
  resetStudentPassword,
  resetStudentProgress,
  resetTeacherPassword,
  updateStudentEnrollment,
} from '../../api/admin';
import { logout } from '../../api/auth';

const NAV_ITEMS = [
  ['overview', '🏠', 'Overview'],
  ['accounts', '➕', 'Add Accounts'],
  ['assignments', '📌', 'Assignments'],
  ['students', '🎓', 'Students'],
  ['teachers', '👩‍🏫', 'Teachers'],
  ['archives', '🗃️', 'Archives'],
  ['logs', '🧾', 'Audit Logs'],
  ['reports', '📊', 'Reports'],
];

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Field({ label, value, onChangeText, keyboardType = 'default', secureTextEntry = false, placeholder = '' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

function Button({ children, onPress, tone = 'dark', disabled = false }) {
  return (
    <TouchableOpacity style={[styles.button, styles[`${tone}Button`], disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
}

export default function AdminHome({ navigation }) {
  const [section, setSection] = useState('overview');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [stats, setStats] = useState({});
  const [enrollments, setEnrollments] = useState({ students: [], teachers: [], teacherAssignments: [], classOptions: [] });
  const [accounts, setAccounts] = useState([]);
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  
const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [studentForm, setStudentForm] = useState({ studentCode: '', name: '', gradeLevel: '1', section: '', password: '' });
  const [teacherForm, setTeacherForm] = useState({ username: '', employeeCode: '', name: '', password: '' });
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', gradeLevel: '1', section: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statData, enrollmentData, accountData, activeStudentData, activeTeacherData, archivedStudentData, archivedTeacherData, logData, summary] = await Promise.all([
        getAdminStats(),
        getAdminEnrollments(),
        getAdminAccounts(),
        getActiveStudents(),
        getActiveTeachers(),
        getArchivedStudents(),
        getArchivedTeachers(),
        getAdminAuditLogs(100),
        getReportSummary(),
      ]);
      setStats(statData.stats || {});
      setEnrollments(enrollmentData);
      setAccounts(accountData.users || []);
      setStudents(activeStudentData.students || []);
      setTeachers(activeTeacherData.teachers || []);
      setArchivedStudents(archivedStudentData.students || []);
      setArchivedTeachers(archivedTeacherData.teachers || []);
      setLogs(logData.logs || []);
      setReportSummary(summary);
    } catch (err) {
      setError(err.message || 'Unable to load admin workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  async function run(action, work, success) {
    setBusy(action);
    try {
      const data = await work();
      setWorkspaceNotice({ type: 'success', text: typeof success === 'function' ? success(data) : success });
      await load();
      return data;
    } catch (err) {
      Alert.alert('Unable to save', err.message || 'Please try again.');
      return null;
    } finally {
      setBusy('');
    }
  }


  function confirmLogout() {
    setLogoutVisible(true);
  }

async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  async function shareReport(title, loader) {
    setBusy(title);
    try {
      await Share.share({ title, message: await loader() });
    } catch (err) {
      Alert.alert('Reports', err.message || 'Unable to generate report.');
    } finally {
      setBusy('');
    }
  }

  function renderTabs() {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
        {NAV_ITEMS.map(([key, icon, label]) => (
          <TouchableOpacity key={key} style={[styles.navChip, section === key && styles.navChipActive]} onPress={() => setSection(key)}>
            <Text>{icon}</Text>
            <Text style={[styles.navLabel, section === key && styles.navLabelActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  function renderOverview() {
    const archived = accounts.filter((account) => account.status === 'archived').length;
    const assignments = enrollments.teacherAssignments || [];
    return (
      <>
        <View style={styles.statsGrid}>
          {[
            ['👥', stats.users || 0, 'Total Users'],
            ['🎓', stats.students || 0, 'Students'],
            ['👩‍🏫', stats.teachers || 0, 'Teachers'],
            ['📌', assignments.length, 'Assignments'],
            ['✅', students.length, 'Active Students'],
            ['✅', teachers.length, 'Active Teachers'],
            ['🗃️', archived, 'Archived Accounts'],
          ].map(([icon, value, label]) => (
            <Card key={label} style={styles.statCard}>
              <Text style={styles.statIcon}>{icon}</Text>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.muted}>{label}</Text>
            </Card>
          ))}
        </View>
        <Card>
          <Text style={styles.cardTitle}>Recent System Activity</Text>
          {logs.slice(0, 6).map((log) => (
            <View key={log.id} style={styles.timelineItem}>
              <Text style={styles.rowTitle}>{log.action}</Text>
              <Text style={styles.muted}>{log.entityType || 'record'} #{log.entityId ?? '—'} • {new Date(log.createdAt).toLocaleString()}</Text>
            </View>
          ))}
          {!logs.length && <Text style={styles.muted}>No audit logs available.</Text>}
        </Card>
      </>
    );
  }

  function renderAccounts() {
    return (
      <Card>
        <Text style={styles.cardTitle}>Add Accounts</Text>
        <View style={styles.choiceRow}>
          <Button tone={accountType === 'student' ? 'green' : 'slate'} onPress={() => setAccountType('student')}>Student Account</Button>
          <Button tone={accountType === 'teacher' ? 'green' : 'slate'} onPress={() => setAccountType('teacher')}>Teacher Account</Button>
        </View>
        {accountType === 'student' ? (
          <>
            <Field label="Student ID" placeholder="STU-2026-001" value={studentForm.studentCode} onChangeText={(studentCode) => setStudentForm((current) => ({ ...current, studentCode: studentCode.toUpperCase() }))} />
            <Field label="Name" value={studentForm.name} onChangeText={(name) => setStudentForm((current) => ({ ...current, name }))} />
            <Field label="Grade" value={studentForm.gradeLevel} keyboardType="numeric" onChangeText={(gradeLevel) => setStudentForm((current) => ({ ...current, gradeLevel }))} />
            <Field label="Section" value={studentForm.section} onChangeText={(section) => setStudentForm((current) => ({ ...current, section }))} />
            <Field label="Password" value={studentForm.password} secureTextEntry onChangeText={(password) => setStudentForm((current) => ({ ...current, password }))} />
            <Button disabled={Boolean(busy)} onPress={async () => {
              const saved = await run('create-student', () => createStudentAccount({ ...studentForm, gradeLevel: Number(studentForm.gradeLevel), avatar: '🧒' }), 'Student account created.');
              if (saved) setStudentForm({ studentCode: '', name: '', gradeLevel: '1', section: '', password: '' });
            }}>Create Student</Button>
          </>
        ) : (
          <>
            <Field label="Username" value={teacherForm.username} onChangeText={(username) => setTeacherForm((current) => ({ ...current, username }))} />
            <Field label="Employee Code" value={teacherForm.employeeCode} onChangeText={(employeeCode) => setTeacherForm((current) => ({ ...current, employeeCode }))} />
            <Field label="Name" value={teacherForm.name} onChangeText={(name) => setTeacherForm((current) => ({ ...current, name }))} />
            <Field label="Password" value={teacherForm.password} secureTextEntry onChangeText={(password) => setTeacherForm((current) => ({ ...current, password }))} />
            <Button disabled={Boolean(busy)} onPress={async () => {
              const saved = await run('create-teacher', () => createTeacherAccount(teacherForm), 'Teacher account created.');
              if (saved) setTeacherForm({ username: '', employeeCode: '', name: '', password: '' });
            }}>Create Teacher</Button>
          </>
        )}
      </Card>
    );
  }

  function renderAssignments() {
    return (
      <>
        <Card>
          <Text style={styles.cardTitle}>Assign Teacher</Text>
          <Text style={styles.fieldLabel}>Teacher</Text>
          <View style={styles.choiceRow}>{teachers.map((teacher) => <Button key={teacher.id} tone={Number(assignmentForm.teacherId) === Number(teacher.id) ? 'green' : 'slate'} onPress={() => setAssignmentForm((current) => ({ ...current, teacherId: teacher.id }))}>{teacher.name}</Button>)}</View>
          <Field label="Grade" value={assignmentForm.gradeLevel} keyboardType="numeric" onChangeText={(gradeLevel) => setAssignmentForm((current) => ({ ...current, gradeLevel }))} />
          <Field label="Section" value={assignmentForm.section} onChangeText={(section) => setAssignmentForm((current) => ({ ...current, section }))} />
          <Button disabled={!assignmentForm.teacherId || !assignmentForm.section.trim() || Boolean(busy)} onPress={() => run('assignment', () => assignTeacher(assignmentForm.teacherId, { gradeLevel: Number(assignmentForm.gradeLevel), section: assignmentForm.section }), 'Assignment saved.')}>Save Assignment</Button>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Teacher Assignments</Text>
          {(enrollments.teacherAssignments || []).map((assignment) => (
            <View key={assignment.id} style={styles.actionRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{assignment.Teacher?.name || 'Teacher'}</Text>
                <Text style={styles.muted}>Grade {assignment.gradeLevel} • {assignment.section}</Text>
              </View>
              <Button tone="red" disabled={Boolean(busy)} onPress={() => run(`remove-assignment-${assignment.id}`, () => removeTeacherAssignment(assignment.id), 'Assignment removed.')}>Remove</Button>
            </View>
          ))}
        </Card>
      </>
    );
  }

  function renderStudents() {
    return (
      <Card>
        <Text style={styles.cardTitle}>Student Management</Text>
        {students.map((student) => (
          <View key={student.id} style={styles.recordCard}>
            <Text style={styles.rowTitle}>{student.avatar || '🧒'} {student.name}</Text>
            <Text style={styles.muted}>{student.studentCode} • Grade {student.gradeLevel} • {student.section} • {student.xp || 0} XP</Text>
            <View style={styles.choiceRow}>
              <Button tone="slate" disabled={Boolean(busy)} onPress={() => run(`student-pin-${student.id}`, () => resetStudentPassword(student.id), (data) => `Temporary PIN: ${data.temporaryPin}`)}>Reset Password</Button>
              <Button tone="slate" disabled={Boolean(busy)} onPress={() => run(`student-progress-${student.id}`, () => resetStudentProgress(student.id), 'Progress reset.')}>Reset Progress</Button>
              <Button tone="red" disabled={Boolean(busy)} onPress={() => run(`student-archive-${student.id}`, () => archiveStudent(student.id), 'Student archived.')}>Archive</Button>
            </View>
            <View style={styles.choiceRow}>
              {['1', '2', '3', '4', '5', '6'].map((grade) => <Button key={grade} tone={Number(student.gradeLevel) === Number(grade) ? 'green' : 'slate'} disabled={Boolean(busy)} onPress={() => run(`grade-${student.id}`, () => updateStudentEnrollment(student.id, { gradeLevel: Number(grade), section: student.section }), 'Enrollment updated.')}>G{grade}</Button>)}
            </View>
          </View>
        ))}
        {!students.length && <Text style={styles.muted}>No active students.</Text>}
      </Card>
    );
  }

  function renderTeachers() {
    return (
      <Card>
        <Text style={styles.cardTitle}>Teacher Management</Text>
        {teachers.map((teacher) => {
          const teacherAssignments = (enrollments.teacherAssignments || []).filter((assignment) => Number(assignment.teacherId) === Number(teacher.id));
          return (
            <View key={teacher.id} style={styles.recordCard}>
              <Text style={styles.rowTitle}>👩‍🏫 {teacher.name}</Text>
              <Text style={styles.muted}>{teacher.User?.username || teacher.employeeCode}</Text>
              <Text style={styles.muted}>{teacherAssignments.map((assignment) => `G${assignment.gradeLevel} ${assignment.section}`).join(' • ') || 'No assigned classes'}</Text>
              <View style={styles.choiceRow}>
                <Button tone="slate" disabled={Boolean(busy)} onPress={() => run(`teacher-pin-${teacher.id}`, () => resetTeacherPassword(teacher.id), (data) => `Temporary PIN: ${data.temporaryPin}`)}>Reset Password</Button>
                <Button tone="red" disabled={Boolean(busy)} onPress={() => run(`teacher-archive-${teacher.id}`, () => archiveTeacher(teacher.id), 'Teacher archived.')}>Archive</Button>
              </View>
            </View>
          );
        })}
      </Card>
    );
  }

  function renderArchives() {
    return (
      <Card>
        <Text style={styles.cardTitle}>Archives</Text>
        {archivedStudents.map((student) => (
          <View key={`student-${student.id}`} style={styles.actionRow}>
            <View style={styles.flex}><Text style={styles.rowTitle}>{student.name}</Text><Text style={styles.muted}>Student • {student.studentCode}</Text></View>
            <Button tone="green" disabled={Boolean(busy)} onPress={() => run(`student-reactivate-${student.id}`, () => reactivateStudent(student.id), 'Student reactivated.')}>Reactivate</Button>
          </View>
        ))}
        {archivedTeachers.map((teacher) => (
          <View key={`teacher-${teacher.id}`} style={styles.actionRow}>
            <View style={styles.flex}><Text style={styles.rowTitle}>{teacher.name}</Text><Text style={styles.muted}>Teacher • {teacher.employeeCode}</Text></View>
            <Button tone="green" disabled={Boolean(busy)} onPress={() => run(`teacher-reactivate-${teacher.id}`, () => reactivateTeacher(teacher.id), 'Teacher reactivated.')}>Reactivate</Button>
          </View>
        ))}
        {!archivedStudents.length && !archivedTeachers.length && <Text style={styles.muted}>No archived student or teacher accounts.</Text>}
      </Card>
    );
  }

  
function renderLogs() {
    const actionOptions = [...new Set(logs.map(l => l.action).filter(Boolean))];
    const entityOptions = [...new Set(logs.map(l => l.entityType).filter(Boolean))];
    const userOptions = [...new Set(logs.map(l => l.actorUserId).filter(Boolean))];

    const filteredLogs = logs
      .filter((log) => {
        const matchesSearch =
          JSON.stringify(log)
            .toLowerCase()
            .includes(auditSearch.toLowerCase());

        const matchesAction =
          actionFilter === 'all' ||
          log.action === actionFilter;

        const matchesEntity =
          entityFilter === 'all' ||
          log.entityType === entityFilter;

        const matchesUser =
          userFilter === 'all' ||
          String(log.actorUserId) === String(userFilter);

        return (
          matchesSearch &&
          matchesAction &&
          matchesEntity &&
          matchesUser
        );
      })
      .sort((a, b) =>
        sortOrder === 'newest'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt)
      );

    return (
      <Card>
        <Text style={styles.cardTitle}>Audit Log Timeline</Text>

        <TextInput
          value={auditSearch}
          onChangeText={setAuditSearch}
          placeholder="Search logs..."
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
          }}

        />

        <Text style={styles.muted}>
          Logs: {filteredLogs.length} • Actions: {actionOptions.length} • Users: {userOptions.length}
        </Text>

        <TextInput
          value={actionFilter}
          onChangeText={setActionFilter}
          placeholder="Action filter (or all)"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 10,
            marginBottom: 10,
          }}
        />

        <TextInput
          value={entityFilter}
          onChangeText={setEntityFilter}
          placeholder="Entity filter (or all)"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        />

        <TextInput
          value={userFilter}
          onChangeText={setUserFilter}
          placeholder="User ID filter (or all)"
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        />
        {filteredLogs.map((log) => (
          <View key={log.id} style={styles.timelineItem}>
            <Text style={styles.rowTitle}>{log.action}</Text>
            <Text style={styles.muted}>{log.entityType || 'record'} #{log.entityId ?? '—'}</Text>
            <Text style={styles.muted}>{new Date(log.createdAt).toLocaleString()}</Text>
          </View>
        ))}
        {!logs.length && <Text style={styles.muted}>No audit logs available.</Text>}
      </Card>
    );
  }

  function renderReports() {
    return (
      <>
        <Card>
          <Text style={styles.cardTitle}>Admin Reports</Text>
          <Text style={styles.body}>Generate system reports and share them using your device.</Text>
          <Button disabled={Boolean(busy)} onPress={() => shareReport('Student CSV', getStudentReportCsv)}>Export CSV</Button>
          <Button disabled={Boolean(busy)} onPress={() => shareReport('Activity Logs CSV', getActivityLogsCsv)}>Export Logs</Button>
          <Button disabled={Boolean(busy)} onPress={() => shareReport('Tuklas Talino Summary Report', getSummaryReportText)}>Download Summary Report</Button>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>System Summary</Text>
          <Text style={styles.body}>Total users: {reportSummary?.totalUsers || 0}</Text>
          <Text style={styles.body}>Students: {reportSummary?.students || 0}</Text>
          <Text style={styles.body}>Teachers: {reportSummary?.teachers || 0}</Text>
          <Text style={styles.body}>Assignments: {reportSummary?.teacherAssignments || 0}</Text>
          <Text style={styles.body}>Archived accounts: {reportSummary?.archivedAccounts || 0}</Text>
        </Card>
      </>
    );
  }

  if (loading && !accounts.length) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#0F172A" /><Text style={styles.muted}>Loading admin workspace...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.title}>Admin Workspace</Text>
            <Text style={styles.subtitle}>Manage accounts, classes, archives, and reports.</Text>

          </View>
          <Button tone="slate" onPress={confirmLogout}>Logout</Button>
        </View>

        <View style={styles.workspaceHero}>
          <View style={styles.workspaceHeroIcon}>
            <Text style={styles.workspaceHeroEmoji}>🛡️</Text>
          </View>

          <View style={styles.workspaceHeroCopy}>
            <Text style={styles.workspaceHeroKicker}>System control center</Text>
            <Text style={styles.workspaceHeroTitle}>Manage users, assignments, and activity safely.</Text>

            <View style={styles.workspaceHeroChips}>
              <Text style={styles.workspaceHeroChip}>🔐 Accounts</Text>
              <Text style={styles.workspaceHeroChip}>📌 Assignments</Text>
              <Text style={styles.workspaceHeroChip}>📈 Reports</Text>
            </View>
          </View>
        </View>

        {renderTabs()}
        {workspaceNotice ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setWorkspaceNotice(null)}
            style={[
              styles.workspaceNoticeCard,
              workspaceNotice.type === 'success' && styles.workspaceNoticeSuccess,
            ]}
          >
            <Text style={styles.workspaceNoticeText}>{workspaceNotice.text}</Text>
          </Pressable>
        ) : null}

        {error ? <Card><Text style={styles.error}>{error}</Text><Button onPress={load}>Try Again</Button></Card> : null}
        {section === 'overview' && renderOverview()}
        {section === 'accounts' && renderAccounts()}
        {section === 'assignments' && renderAssignments()}
        {section === 'students' && renderStudents()}
        {section === 'teachers' && renderTeachers()}
        {section === 'archives' && renderArchives()}
        {section === 'logs' && renderLogs()}
        {section === 'reports' && renderReports()}

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.workspaceLogoutModalBackdrop}>
          <View style={styles.workspaceLogoutModalCard}>
            <View style={styles.workspaceLogoutIcon}>
              <Text style={styles.workspaceLogoutIconText}>🚪</Text>
            </View>

            <Text style={styles.workspaceLogoutTitle}>Mag-logout?</Text>
            <Text style={styles.workspaceLogoutBody}>
              Naka-save ang workspace. Maaari kang bumalik anumang oras.
            </Text>

            <View style={styles.workspaceLogoutActions}>
              <TouchableOpacity
                style={styles.workspaceLogoutCancel}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.workspaceLogoutCancelText}>Kanselahin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workspaceLogoutConfirm}
                onPress={handleLogout}
              >
                <Text style={styles.workspaceLogoutConfirmText}>Mag-logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  workspaceNoticeCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#e8f8ec',
    borderWidth: 1,
    borderColor: '#b9efc8',
  },
  workspaceNoticeSuccess: {
    backgroundColor: '#e8f8ec',
    borderColor: '#b9efc8',
  },
  workspaceNoticeText: {
    color: '#1f6f3f',
    fontSize: 13,
    fontWeight: '700',
  },

  workspaceLogoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  workspaceLogoutModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    shadowColor: '#2563EB',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  workspaceLogoutIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  workspaceLogoutIconText: {
    fontSize: 42,
  },
  workspaceLogoutTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  workspaceLogoutBody: {
    fontSize: 16,
    lineHeight: 23,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 22,
  },
  workspaceLogoutActions: {
    flexDirection: 'row',
    width: '100%',
  },
  workspaceLogoutCancel: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  workspaceLogoutConfirm: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 10,
  },
  workspaceLogoutCancelText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '900',
  },
  workspaceLogoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  workspaceHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 28,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
    shadowColor: '#2563EB',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  workspaceHeroIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  workspaceHeroEmoji: {
    fontSize: 44,
  },
  workspaceHeroCopy: {
    flex: 1,
  },
  workspaceHeroKicker: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  workspaceHeroTitle: {
    color: '#0F172A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  workspaceHeroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  workspaceHeroChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },

  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  page: { padding: 16, paddingBottom: 44 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  flex: { flex: 1 },
  title: { color: '#0F172A', fontSize: 29, fontWeight: '900' },
  subtitle: { color: '#64748B', marginTop: 5, lineHeight: 20 },
  navRow: { gap: 8, paddingVertical: 8, paddingBottom: 16 },
  navChip: { flexDirection: 'row', gap: 5, borderRadius: 99, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  navChipActive: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#3B82F6' },
  navLabel: { color: '#64748B', fontWeight: '800' },
  navLabelActive: { color: '#1D4ED8' },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, marginBottom: 14, shadowColor: '#0F172A', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTitle: { color: '#0F172A', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
 width: '48%' },
  statIcon: { fontSize: 24 },
  statValue: { color: '#0F172A', fontWeight: '900', fontSize: 28, marginTop: 6 },
  muted: { color: '#64748B', marginTop: 4 },
  body: { color: '#475569', marginTop: 7, lineHeight: 20 },
  rowTitle: { color: '#0F172A', fontWeight: '800' },
  timelineItem: { borderLeftWidth: 3, borderLeftColor: '#93C5FD', paddingLeft: 12, marginTop: 12 },
  field: { marginTop: 12 },
  fieldLabel: { color: '#334155', fontWeight: '800', marginTop: 8, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', backgroundColor: '#FFF' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 },
  button: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 8 },
  darkButton: { backgroundColor: '#0F172A' },
  greenButton: { backgroundColor: '#16A34A' },
  slateButton: { backgroundColor: '#64748B' },
  redButton: { backgroundColor: '#DC2626' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  recordCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginTop: 10 },
  error: { color: '#B91C1C', fontWeight: '800' },
});
