import React, { useCallback, useEffect, useState } from 'react';
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
  downloadPdfReport,
  downloadTextReport,
} from '../../services/reportExport';
import {
  normalizeSpaces,
  studentErrors,
  teacherErrors,
  isValidGrade,
  isValidSection,
} from '../../utils/accountValidation';

import {
  archiveStudent,
  archiveTeacher,
  assignTeacher,
  createStudentAccount,
  createTeacherAccount,
  getActiveStudents,
  getActiveTeachers,
  getAdminAccounts,
  getAdminAuditLogs,
  getAdminEnrollments,
  getAdminStats,
  getArchivedStudents,
  getArchivedTeachers,
  getReportSummary,
  getSummaryReportCsv,
  getSummaryReportPdf,
  getStudentReportCsv,
  getActivityLogsCsv,
  reactivateStudent,
  reactivateTeacher,
  removeTeacherAssignment,
  resetStudentPassword,
  resetStudentProgress,
  resetTeacherPassword,
  updateStudentEnrollment,
} from '../../api/admin';
import { logout, verifyPassword } from '../../api/auth';
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
  const [vaultVisible, setVaultVisible] = useState(false);
  const [vaultUser, setVaultUser] = useState(null);
  const [generatedPin, setGeneratedPin] = useState('');

  const [stats, setStats] = useState({});
  const [enrollments, setEnrollments] = useState({ students: [], teachers: [], teacherAssignments: [], classOptions: [] });
  const [accounts, setAccounts] = useState([]);
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [recentCredentials, setRecentCredentials] = useState([]);
  const [revealedPins, setRevealedPins] = useState({});

  const [passwordVerifyVisible, setPasswordVerifyVisible] = useState(false);
  const [passwordVerifyInput, setPasswordVerifyInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const [verificationExpiresAt, setVerificationExpiresAt] = useState(null);

  const [adminActionVisible, setAdminActionVisible] = useState(false);
  const [adminActionReason, setAdminActionReason] = useState('');
  const [adminActionKeyword, setAdminActionKeyword] = useState('');
  const [pendingAdminAction, setPendingAdminAction] = useState(null);



  useEffect(() => {
    if (!recentCredentials.length) {
      return;
    }

    const timer = setTimeout(() => {
      setRecentCredentials([]);
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [recentCredentials]);

  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [logs, setLogs] = useState([]);
  
const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [studentForm, setStudentForm] = useState({ name: '', gradeLevel: '1', section: '' });
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', gradeLevel: '1', section: '' });
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState('all');

  const studentValidation = studentErrors(studentForm);
  const teacherValidation = teacherErrors(teacherForm);

  const studentFormValid = !Object.values(studentValidation).some(Boolean);
  const teacherFormValid = !Object.values(teacherValidation).some(Boolean);

  const classOptions = [
    ...(enrollments.classOptions || []),
    ...(enrollments.teacherAssignments || []),
    ...students,
  ];

  const gradeOptions = ['1', '2', '3', '4', '5', '6'];

  const studentSectionOptions = [
    ...new Set(
      classOptions
        .filter((item) => !studentForm.gradeLevel || Number(item.gradeLevel || item.grade) === Number(studentForm.gradeLevel))
        .map((item) => normalizeSpaces(item.section || item.sectionName || item.classSection || ''))
        .filter(Boolean)
    ),
  ].sort((first, second) => first.localeCompare(second));

  const assignmentSectionOptions = [
    ...new Set(
      classOptions
        .filter((item) => !assignmentForm.gradeLevel || Number(item.gradeLevel || item.grade) === Number(assignmentForm.gradeLevel))
        .map((item) => normalizeSpaces(item.section || item.sectionName || item.classSection || ''))
        .filter(Boolean)
    ),
  ].sort((first, second) => first.localeCompare(second));

  const studentManagementSectionOptions = [
    ...new Set(
      students
        .filter((student) => studentGradeFilter === 'all' || Number(student.gradeLevel || student.grade) === Number(studentGradeFilter))
        .map((student) => normalizeSpaces(student.section || student.sectionName || student.classSection || ''))
        .filter(Boolean)
    ),
  ].sort((first, second) => first.localeCompare(second));

  const filteredStudents = students.filter((student) => {
    const matchesGrade = studentGradeFilter === 'all' || Number(student.gradeLevel || student.grade) === Number(studentGradeFilter);
    const matchesSection = studentSectionFilter === 'all' || normalizeSpaces(student.section || student.sectionName || student.classSection || '') === studentSectionFilter;

    return matchesGrade && matchesSection;
  });

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
    setRecentCredentials([]);
    setGeneratedPin('');
    setVerificationExpiresAt(null);
    setVaultUser(null);
    setVaultVisible(false);

    await logout();

    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }


  function hasActiveVerificationSession() {
    return (
      verificationExpiresAt &&
      Date.now() < verificationExpiresAt
    );
  }

  function runProtectedAction(action) {
    if (hasActiveVerificationSession()) {
      action();
      return;
    }

    setPendingAction(() => action);
    setPasswordVerifyInput('');
    setPasswordVerifyVisible(true);
  }

  
  function requestProtectedAdminAction(config) {
    setAdminActionReason('');
    setAdminActionKeyword('');
    setPendingAdminAction(config);
    setAdminActionVisible(true);
  }

  async function executeProtectedAdminAction() {
    if (!pendingAdminAction) return;

    if (!adminActionReason.trim()) {
      Alert.alert(
        'Reason Required',
        'Please provide a reason before continuing.'
      );
      return;
    }

    if (
      pendingAdminAction.keyword &&
      adminActionKeyword.trim().toUpperCase() !==
      pendingAdminAction.keyword.toUpperCase()
    ) {
      Alert.alert(
        'Confirmation Required',
        `Type ${pendingAdminAction.keyword} to continue.`
      );
      return;
    }

    const reason = adminActionReason.trim();

    setAdminActionVisible(false);

    runProtectedAction(async () => {
      await pendingAdminAction.action(reason);
    });
  }

async function executeVerifiedAction() {
    try {
      await verifyPassword(passwordVerifyInput);

      setVerificationExpiresAt(
        Date.now() + (5 * 60 * 1000)
      );

      const action = pendingAction;

      setPasswordVerifyVisible(false);
      setPasswordVerifyInput('');
      setPendingAction(null);

      if (action) {
        await action();
      }
    } catch (err) {
      Alert.alert(
        'Verification Failed',
        err?.message || 'Incorrect password.'
      );
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
          <Text style={styles.cardTitle}>👑 Administrators</Text>

          {accounts
            .filter((account) => account.Role?.name === 'admin')
            .map((account) => (
              <View
                key={account.id}
                style={styles.recordCard}
              >
                <Text style={styles.rowTitle}>
                  {account.displayName || account.username}
                </Text>

                <Text style={styles.muted}>
                  {account.username}
                </Text>

                <Text style={styles.muted}>
                  {account.status || 'active'}
                </Text>
              </View>
            ))}

          {!accounts.filter(
            (account) => account.Role?.name === 'admin'
          ).length && (
            <Text style={styles.muted}>
              No administrator accounts found.
            </Text>
          )}
        </Card>

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
            <Field
              label="Student Full Name"
              value={studentForm.name}
              placeholder="e.g. Juan Dela Cruz"
              onChangeText={(name) =>
                setStudentForm((current) => ({
                  ...current,
                  name,
                }))
              }
            />
            {studentValidation.name && (
              <Text style={styles.errorText}>
                Enter the student's first and last name.
              </Text>
            )}
              <Text style={styles.fieldLabel}>Grade</Text>
              <View style={styles.choiceRow}>
                {gradeOptions.map((grade) => (
                  <Button
                    key={`student-grade-${grade}`}
                    tone={Number(studentForm.gradeLevel) === Number(grade) ? 'green' : 'slate'}
                    disabled={Boolean(busy)}
                    onPress={() => setStudentForm((current) => ({ ...current, gradeLevel: grade }))}
                  >
                    G{grade}
                  </Button>
                ))}
              </View>
            {studentValidation.gradeLevel && (
              <Text style={styles.errorText}>
                Baitang must be from 1 to 6.
              </Text>
            )}
            <Field
              label="Section"
              value={studentForm.section}
              onChangeText={(section) =>
                setStudentForm((current) => ({
                  ...current,
                  section: normalizeSpaces(section),
                }))
              }
            />
              {studentSectionOptions.length ? (
                <>
                  <Text style={styles.helperText}>Section suggestions for selected grade:</Text>
                  <View style={styles.choiceRow}>
                    {studentSectionOptions.map((sectionOption) => (
                      <Button
                        key={`student-section-${sectionOption}`}
                        tone={normalizeSpaces(studentForm.section) === sectionOption ? 'green' : 'slate'}
                        disabled={Boolean(busy)}
                        onPress={() => setStudentForm((current) => ({ ...current, section: sectionOption }))}
                      >
                        {sectionOption}
                      </Button>
                    ))}
                  </View>
                </>
              ) : null}
            {studentValidation.section && (
              <Text style={styles.errorText}>
                Section is required.
              </Text>
            )}
            <Button
              disabled={Boolean(busy) || !studentFormValid}
              onPress={async () => {
              const payload = {
                ...studentForm,
                name: normalizeSpaces(studentForm.name),
                gradeLevel: Number(studentForm.gradeLevel),
                section: normalizeSpaces(studentForm.section),
                avatar: '🧒',
              };

              const saved = await run(
                'create-student',
                () => createStudentAccount(payload),
                'Student account created.'
              );

              if (saved) {
                  setStudents((current) => [
                    {
                      ...(saved.student || saved),
                      ...payload,
                      id: saved.student?.id || saved.id || `${payload.name}-${payload.gradeLevel}-${payload.section}`,
                      name: saved.student?.name || payload.name,
                      studentCode: saved.student?.studentCode || saved.username,
                    },
                    ...current.filter((student) => String(student.id || student.studentCode) !== String(saved.student?.id || saved.id || saved.username)),
                  ]);

                setRecentCredentials(current => [
                  {
                    type: 'Student',
                    username: saved.username,
                    pin: saved.temporaryPin
                  },
                  ...current
                ].slice(0, 10));

                Alert.alert(
                  'Student Account Created',
                  `Username\n\n${saved.username}\n\nTemporary PIN\n\n${saved.temporaryPin}\n\nStudent must change this PIN on first login.`
                );

                setStudentForm({ name: '', gradeLevel: '1', section: '' });
              }
            }}>Create Student</Button>
          </>
        ) : (
          <>
            <Text style={styles.sectionEyebrow}>TEACHER ACCOUNT</Text>
            <Text style={styles.formHeroTitle}>Add Teacher</Text>
            <Text style={styles.formHeroSubtitle}>
              Create a teacher login, then assign handled classes in the next section.
            </Text>

            <Field
              label="Teacher Full Name"
              value={teacherForm.name}
              placeholder="e.g. Maria Santos"
              onChangeText={(name) =>
                setTeacherForm((current) => ({
                  ...current,
                  name,
                }))
              }
            />
            {teacherValidation.name && (
              <Text style={styles.errorText}>
                Enter the teacher's first and last name.
              </Text>
            )}

            <Field
              label="Email (optional)"
              value={teacherForm.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(email) =>
                setTeacherForm((current) => ({
                  ...current,
                  email: email.trim(),
                }))
              }
            />
            {teacherValidation.email && (
              <Text style={styles.errorText}>
                Invalid email address.
              </Text>
            )}

            <Text style={styles.helperText}>
              Username (TCH-YYYY-XXX) and employee code are generated automatically.
            </Text>

            <Button
              disabled={Boolean(busy) || !teacherFormValid}
              onPress={async () => {
              const teacherEmail = String(teacherForm.email || '').trim();
              const teacherPayload = {
                name: normalizeSpaces(teacherForm.name),
              };

              if (teacherEmail) {
                teacherPayload.email = teacherEmail;
              }

              const saved = await run('create-teacher', () => createTeacherAccount(teacherPayload), 'Teacher account created.');

              if (saved) {
                  setTeachers((current) => [
                    {
                      ...(saved.teacher || saved),
                      ...teacherPayload,
                      id: saved.teacher?.id || saved.id || saved.username,
                      name: saved.teacher?.name || teacherPayload.name,
                      employeeCode: saved.teacher?.employeeCode || saved.username,
                    },
                    ...current.filter((teacher) => String(teacher.id || teacher.employeeCode) !== String(saved.teacher?.id || saved.id || saved.username)),
                  ]);

                setRecentCredentials(current => [
                  {
                    type: 'Teacher',
                    username: saved.username,
                    pin: saved.temporaryPin
                  },
                  ...current
                ].slice(0, 10));

                Alert.alert(
                  'Teacher Account Created',
                  `Username\n\n${saved.username}\n\nTemporary PIN\n\n${saved.temporaryPin}\n\nTeacher must change this PIN on first login.`
                );

                setTeacherForm({ name: '', email: '' });
              }
            }}>Add Teacher</Button>
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
            <Text style={styles.fieldLabel}>Grade</Text>
            <View style={styles.choiceRow}>
              {gradeOptions.map((grade) => (
                <Button
                  key={`assignment-grade-${grade}`}
                  tone={Number(assignmentForm.gradeLevel) === Number(grade) ? 'green' : 'slate'}
                  disabled={Boolean(busy)}
                  onPress={() => setAssignmentForm((current) => ({ ...current, gradeLevel: grade, section: '' }))}
                >
                  G{grade}
                </Button>
              ))}
            </View>
          <Field
            label="Section"
            value={assignmentForm.section}
            onChangeText={(section) => setAssignmentForm((current) => ({ ...current, section: normalizeSpaces(section) }))}
          />
            {assignmentSectionOptions.length ? (
              <>
                <Text style={styles.helperText}>Section suggestions for selected grade:</Text>
                <View style={styles.choiceRow}>
                  {assignmentSectionOptions.map((sectionOption) => (
                    <Button
                      key={`assignment-section-${sectionOption}`}
                      tone={normalizeSpaces(assignmentForm.section) === sectionOption ? 'green' : 'slate'}
                      disabled={Boolean(busy)}
                      onPress={() => setAssignmentForm((current) => ({ ...current, section: sectionOption }))}
                    >
                      {sectionOption}
                    </Button>
                  ))}
                </View>
              </>
            ) : null}
          <Button
            disabled={
              !assignmentForm.teacherId ||
              !isValidGrade(assignmentForm.gradeLevel) ||
              !isValidSection(assignmentForm.section) ||
              Boolean(busy)
            }
            onPress={() =>
              run(
                'assignment',
                () =>
                  assignTeacher(assignmentForm.teacherId, {
                    gradeLevel: Number(assignmentForm.gradeLevel),
                    section: normalizeSpaces(assignmentForm.section),
                  }),
                'Assignment saved.'
              )
            }
          >
            Save Assignment
          </Button>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>Teacher Assignments</Text>
          {(enrollments.teacherAssignments || []).map((assignment) => (
            <View key={assignment.id} style={styles.actionRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{assignment.Teacher?.name || 'Teacher'}</Text>
                <Text style={styles.muted}>Baitang {assignment.gradeLevel} • {assignment.section}</Text>
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
          <Text style={styles.helperText}>Filter learners by year level and section.</Text>

          <Text style={styles.fieldLabel}>Year Level</Text>
          <View style={styles.choiceRow}>
            <Button
              tone={studentGradeFilter === 'all' ? 'green' : 'slate'}
              disabled={Boolean(busy)}
              onPress={() => {
                setStudentGradeFilter('all');
                setStudentSectionFilter('all');
              }}
            >
              All
            </Button>
            {gradeOptions.map((grade) => (
              <Button
                key={`student-filter-grade-${grade}`}
                tone={Number(studentGradeFilter) === Number(grade) ? 'green' : 'slate'}
                disabled={Boolean(busy)}
                onPress={() => {
                  setStudentGradeFilter(grade);
                  setStudentSectionFilter('all');
                }}
              >
                G{grade}
              </Button>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Section</Text>
          <View style={styles.choiceRow}>
            <Button
              tone={studentSectionFilter === 'all' ? 'green' : 'slate'}
              disabled={Boolean(busy)}
              onPress={() => setStudentSectionFilter('all')}
            >
              All
            </Button>
            {studentManagementSectionOptions.map((sectionOption) => (
              <Button
                key={`student-filter-section-${sectionOption}`}
                tone={studentSectionFilter === sectionOption ? 'green' : 'slate'}
                disabled={Boolean(busy)}
                onPress={() => setStudentSectionFilter(sectionOption)}
              >
                {sectionOption}
              </Button>
            ))}
          </View>

          <Text style={styles.muted}>
            Showing {filteredStudents.length} of {students.length} active student{students.length === 1 ? '' : 's'}.
          </Text>

        {filteredStudents.map((student) => (
          <View key={student.id} style={styles.recordCard}>
            <Text style={styles.rowTitle}>{student.avatar || '🧒'} {student.name}</Text>
            <Text style={styles.muted}>{student.studentCode} • Baitang {student.gradeLevel} • {student.section} • {student.xp || 0} XP</Text>
            <View style={styles.choiceRow}>
              <Button tone="slate" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                keyword: 'STUDENTPIN',
                reasonPlaceholder: 'e.g. Student forgot their password',
                action: (reason) => run(
                  `student-pin-${student.id}`,
                  () => resetStudentPassword(student.id, {
                    reason
                  }),
                  (data) => `Temporary PIN: ${data.temporaryPin}`
                )
              })}>Reset Password</Button>
              <Button tone="slate" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                keyword: 'RESET',
                reasonPlaceholder: 'e.g. Student needs to restart their lesson progress',
                action: (reason) => run(
                      `student-progress-${student.id}`,
                      () => resetStudentProgress(student.id, {
                        reason
                      }),
                      'Progress reset.'
                    )
              })}>Reset Progress</Button>
              <Button tone="slate" onPress={() => {
                setGeneratedPin('');
                setVaultUser({
                  id: student.id,
                  type: 'Student',
                  username: student?.User?.username || student.studentCode,
                  email: student?.User?.email || 'Not provided',
                  status: student?.status || 'active'
                });
                setVaultVisible(true);
              }}>Login Credentials</Button>
              <Button tone="red" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                keyword: 'ARCHIVE',
                reasonPlaceholder: 'e.g. Student transferred to another class or school',
                action: (reason) => run(
                      `student-archive-${student.id}`,
                      () => archiveStudent(student.id, {
                        reason
                      }),
                      'Student archived.'
                    )
              })}>Archive</Button>
            </View>
            <View style={styles.choiceRow}>
              {['1', '2', '3', '4', '5', '6'].map((grade) => <Button key={grade} tone={Number(student.gradeLevel) === Number(grade) ? 'green' : 'slate'} disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                    keyword: 'PROMOTE',
                    reasonPlaceholder: 'e.g. Student is moving to the selected grade level',
                    action: (reason) => run(
                      `grade-${student.id}`,
                      () => updateStudentEnrollment(student.id, {
                        gradeLevel: Number(grade),
                        section: student.section,
                        promotionReason: reason
                      }),
                      'Enrollment updated.'
                    )
                  })}>G{grade}</Button>)}
            </View>
          </View>
        ))}
        {!filteredStudents.length && <Text style={styles.muted}>{students.length ? 'No students match the selected filters.' : 'No active students.'}</Text>}
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
                <Button tone="slate" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                  keyword: 'TEACHERPIN',
                  reasonPlaceholder: 'e.g. Teacher forgot their password',
                  action: (reason) => run(
                    `teacher-pin-${teacher.id}`,
                    () => resetTeacherPassword(teacher.id, {
                      reason
                    }),
                    (data) => `Temporary PIN: ${data.temporaryPin}`
                  )
                })}>Reset Password</Button>
                <Button tone="slate" onPress={() => {
                  setGeneratedPin('');
                  setVaultUser({
                    id: teacher.id,
                    type: 'Teacher',
                    username: teacher?.User?.username || teacher.employeeCode,
                    email: teacher?.User?.email || 'Not provided',
                    status: teacher?.status || 'active'
                  });
                  setVaultVisible(true);
                }}>Login Credentials</Button>
                <Button tone="red" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                  keyword: 'TEACHERARCHIVE',
                  reasonPlaceholder: 'e.g. Teacher no longer works at this school',
                  action: (reason) => run(
                    `teacher-archive-${teacher.id}`,
                    () => archiveTeacher(teacher.id, {
                      reason
                    }),
                    'Teacher archived.'
                  )
                })}>Archive</Button>
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
            <Button tone="green" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
              keyword: 'REACTIVATE',
              action: (reason) => run(
                `student-reactivate-${student.id}`,
                () => reactivateStudent(student.id, {
                  reason
                }),
                'Student reactivated.'
              )
            })}>Reactivate</Button>
          </View>
        ))}
        {archivedTeachers.map((teacher) => (
          <View key={`teacher-${teacher.id}`} style={styles.actionRow}>
            <View style={styles.flex}><Text style={styles.rowTitle}>{teacher.name}</Text><Text style={styles.muted}>Teacher • {teacher.employeeCode}</Text></View>
            <Button tone="green" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
              keyword: 'REACTIVATE',
              action: (reason) => run(
                `teacher-reactivate-${teacher.id}`,
                () => reactivateTeacher(teacher.id, {
                  reason
                }),
                'Teacher reactivated.'
              )
            })}>Reactivate</Button>
          </View>
        ))}
        {!archivedStudents.length && !archivedTeachers.length && <Text style={styles.muted}>No archived student or teacher accounts.</Text>}
      </Card>
    );
  }

  
function renderLogs() {
    const actionOptions = [...new Set(logs.map(l => l.action).filter(Boolean))];

    const filteredLogs = logs
      .filter((log) => {
        const matchesSearch =
          JSON.stringify(log)
            .toLowerCase()
            .includes(auditSearch.toLowerCase());

        const matchesAction =
          actionFilter === 'all' ||
          log.action === actionFilter;

        return (
          matchesSearch &&
          matchesAction
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
          Logs: {filteredLogs.length} • Actions: {actionOptions.length}
        </Text>

        <Text style={styles.fieldLabel}>Action</Text>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[styles.navChip, actionFilter === 'all' && styles.navChipActive]}
            onPress={() => setActionFilter('all')}
          >
            <Text style={[styles.navLabel, actionFilter === 'all' && styles.navLabelActive]}>
              All
            </Text>
          </TouchableOpacity>

          {actionOptions.map(action => (
            <TouchableOpacity
              key={action}
              style={[styles.navChip, actionFilter === action && styles.navChipActive]}
              onPress={() => setActionFilter(action)}
            >
              <Text style={[styles.navLabel, actionFilter === action && styles.navLabelActive]}>
                {action}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Sort</Text>

        <View style={styles.choiceRow}>
          <TouchableOpacity
            style={[styles.navChip, sortOrder === 'newest' && styles.navChipActive]}
            onPress={() => setSortOrder('newest')}
          >
            <Text style={[styles.navLabel, sortOrder === 'newest' && styles.navLabelActive]}>
              Newest
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navChip, sortOrder === 'oldest' && styles.navChipActive]}
            onPress={() => setSortOrder('oldest')}
          >
            <Text style={[styles.navLabel, sortOrder === 'oldest' && styles.navLabelActive]}>
              Oldest
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          tone="slate"
          onPress={() => {
            setAuditSearch('');
            setActionFilter('all');
            setSortOrder('newest');
          }}
        >
          Reset Filters
        </Button>
        {filteredLogs.map((log) => (
          <View key={log.id} style={styles.timelineItem}>
            <View style={styles.auditHeader}>
              <Text style={styles.auditAction}>
                {log.action}
              </Text>

              <Text style={styles.auditEntity}>
                {log.entityType || 'record'}
              </Text>
            </View>

            <Text style={styles.auditRecord}>
              Record #{log.entityId ?? '—'}
            </Text>

            {log.action === 'student.promote' &&
             log.metadata ? (
              <>
                <Text style={styles.muted}>
                  {log.metadata.studentName || 'Unknown Student'}
                </Text>

                <Text style={styles.muted}>
                  {log.metadata.studentCode || ''}
                </Text>

                <Text style={styles.muted}>
                  Baitang {log.metadata.oldGrade}
                  {' → '}
                  Baitang {log.metadata.newGrade}
                </Text>
              </>
            ) : null}

            {log.metadata?.reason ? (
              <Text style={styles.muted}>
                Reason: {log.metadata.reason}
              </Text>
            ) : null}

            <Text style={styles.auditDate}>
              {new Date(log.createdAt).toLocaleString()}
            </Text>
          </View>
        ))}
        {!logs.length && <Text style={styles.muted}>No audit logs available.</Text>}
      </Card>
    );
  }

  async function runExport(action, task) {
    if (busy) {
      return;
    }

    setBusy(action);

    try {
      await task();
    } catch (err) {
      Alert.alert(
        'Export failed',
        err?.response?.data?.message || err?.message || 'Unable to complete the export.'
      );
    } finally {
      setBusy('');
    }
  }

  function renderReports() {
    return (
      <>
        <Card>
          <Text style={styles.cardTitle}>Admin Reports</Text>
          <Text style={styles.body}>
            Download the administrator summary report in CSV or PDF format.
          </Text>

          <Button
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-summary-csv', () =>
                downloadTextReport({
                  title: 'Administrator Summary CSV',
                  filename: 'administrator-summary-report.csv',
                  mimeType: 'text/csv',
                  loader: getSummaryReportCsv,
                })
              )
            }
          >
            {busy === 'admin-summary-csv' ? 'Preparing Summary CSV...' : 'Download Summary CSV'}
          </Button>

          <Button
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-summary-pdf', () =>
                downloadPdfReport({
                  title: 'Administrator Summary PDF',
                  filename: 'administrator-summary-report.pdf',
                  loader: getSummaryReportPdf,
                })
              )
            }
          >
            {busy === 'admin-summary-pdf' ? 'Preparing Summary PDF...' : 'Download Summary PDF'}
          </Button>

          <Button
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-student-csv', () =>
                downloadTextReport({
                  title: 'Student Report CSV',
                  filename: 'student-report.csv',
                  mimeType: 'text/csv',
                  loader: getStudentReportCsv,
                })
              )
            }
          >
            {busy === 'admin-student-csv' ? 'Preparing Student CSV...' : 'Download Student Report CSV'}
          </Button>

          <Button
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-activity-csv', () =>
                downloadTextReport({
                  title: 'Activity Logs CSV',
                  filename: 'activity-logs.csv',
                  mimeType: 'text/csv',
                  loader: getActivityLogsCsv,
                })
              )
            }
          >
            {busy === 'admin-activity-csv' ? 'Preparing Activity CSV...' : 'Download Activity Logs CSV'}
          </Button>
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

      <ScrollView
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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


        {recentCredentials.length > 0 ? (
          <Card>
            <Text style={styles.cardTitle}>🔑 New Account Login Details</Text>

            {recentCredentials.map((credential, index) => (
              <View
                key={`${credential.username}-${index}`}
                style={styles.recordCard}
              >
                <Text style={styles.rowTitle}>
                  {credential.type}
                </Text>

                <Text style={styles.muted}>
                  Username: {credential.username}
                </Text>

                <Text style={styles.rowTitle}>
                  PIN: {revealedPins[credential.username]
                    ? credential.pin
                    : '••••••'}
                </Text>

                <Button
                  tone="slate"
                  onPress={() => {
                    runProtectedAction(async () => {
                      setRevealedPins(current => ({
                        ...current,
                        [credential.username]: true
                      }));

                      setTimeout(() => {
                        setRevealedPins(current => ({
                          ...current,
                          [credential.username]: false
                        }));
                      }, 10000);
                    });
                  }}
                >
                  Reveal PIN
                </Button>

                <Button
                  tone="slate"
                  onPress={() => {
                    runProtectedAction(async () => {
                      await Share.share({
                        title: 'Tuklas Talino Credentials',
                      message:
`Tuklas Talino Account

Role: ${credential.type}
Username: ${credential.username}
Temporary PIN: ${credential.pin}

You will be required to change this PIN after first login.`
                      });
                    });
                  }}
                >
                  Share Credential
                </Button>
              </View>
            ))}

            <Button
              tone="red"
              onPress={() => setRecentCredentials([])}
            >
              Clear Vault
            </Button>
          </Card>
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
        visible={vaultVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVaultVisible(false)}
      >
        <View style={styles.workspaceLogoutModalBackdrop}>
          <View style={styles.workspaceLogoutModalCard}>
            <Text style={styles.vaultTitle}>🔑 Login Credentials</Text>

            <Text style={styles.vaultSubtitle}>
              View login information and generate a temporary PIN for password resets.
            </Text>

            <View style={styles.vaultRow}>
              <Text style={styles.fieldLabel}>Role</Text>
              <Text style={styles.rowTitle}>{vaultUser?.type}</Text>
            </View>

            <View style={styles.vaultRow}>
              <Text style={styles.fieldLabel}>Username</Text>
              <Text style={styles.rowTitle}>{vaultUser?.username}</Text>
            </View>

            <View style={styles.vaultRow}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.rowTitle}>{vaultUser?.email}</Text>
            </View>

            <View style={styles.vaultRow}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.rowTitle}>{vaultUser?.status}</Text>
            </View>

            <View style={styles.vaultRow}>
              <Text style={styles.fieldLabel}>Password</Text>
              <Text style={styles.rowTitle}>Protected by Encryption</Text>
            </View>

            {generatedPin ? (
              <>
                <Text style={styles.fieldLabel}>Temporary PIN</Text>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: '#16A34A',
                    textAlign: 'center',
                    marginTop: 6,
                    marginBottom: 10
                  }}
                >
                  {generatedPin}
                </Text>

                <Text
                  style={{
                    color: '#64748B',
                    textAlign: 'center',
                    marginBottom: 14
                  }}
                >
                  User must change password on next login.
                </Text>
              </>
            ) : null}

            <View style={styles.workspaceLogoutActions}>
              <TouchableOpacity
                style={styles.vaultGenerateButton}
                onPress={() => {
                  if (!vaultUser?.id) return;

                  runProtectedAction(async () => {
                    try {
                      const result =
                        vaultUser.type === 'Student'
                          ? await resetStudentPassword(vaultUser.id)
                          : await resetTeacherPassword(vaultUser.id);

                      setGeneratedPin(result?.temporaryPin || '');
                    } catch (err) {
                      Alert.alert(
                        'Unable to Reset PIN',
                        err?.message || 'Please try again.'
                      );
                    }
                  });
                }}
              >
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.vaultGenerateText}
                >
                  Generate New PIN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workspaceLogoutConfirm}
                onPress={() => setVaultVisible(false)}
              >
                <Text style={styles.workspaceLogoutConfirmText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={adminActionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAdminActionVisible(false)}
      >
        <View style={styles.workspaceLogoutModalBackdrop}>
          <View style={styles.workspaceLogoutModalCard}>

            <Text style={styles.workspaceLogoutTitle}>
              Administrative Confirmation
            </Text>

            <Text style={styles.workspaceLogoutBody}>
              This action requires a reason and confirmation.
            </Text>

            <Text style={styles.workspaceLogoutBody}>
              The reason will be recorded in the audit log.
            </Text>

            <Text style={styles.workspaceLogoutCancelText}>
              Reason *
            </Text>

            <TextInput
              style={styles.input}
              value={adminActionReason}
              onChangeText={setAdminActionReason}
              placeholder={pendingAdminAction?.reasonPlaceholder || 'e.g. Reason for this administrative action'}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.workspaceLogoutCancelText}>
              Confirmation *
            </Text>

            <TextInput
              style={styles.input}
              value={adminActionKeyword}
              onChangeText={setAdminActionKeyword}
              placeholder={`Type ${pendingAdminAction?.keyword || ''} to continue`}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.workspaceLogoutActions}>
              <TouchableOpacity
                style={styles.workspaceLogoutCancel}
                onPress={() => setAdminActionVisible(false)}
              >
                <Text style={styles.workspaceLogoutCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workspaceLogoutConfirm}
                onPress={executeProtectedAdminAction}
              >
                <Text style={styles.workspaceLogoutConfirmText}>
                  Continue
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>


      <Modal
        visible={passwordVerifyVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordVerifyVisible(false)}
      >
        <View style={styles.workspaceLogoutModalBackdrop}>
          <View style={styles.workspaceLogoutModalCard}>

            <Text style={styles.workspaceLogoutTitle}>
              Verify Password
            </Text>

            <Text style={styles.workspaceLogoutBody}>
              Re-enter your admin password to continue.
            </Text>

            <TextInput
              style={styles.input}
              secureTextEntry
              value={passwordVerifyInput}
              onChangeText={setPasswordVerifyInput}
              placeholder="Admin password"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.workspaceLogoutActions}>
              <TouchableOpacity
                style={styles.workspaceLogoutCancel}
                onPress={() => {
                  setPasswordVerifyVisible(false);
                  setPasswordVerifyInput('');
                  setPendingAction(null);
                }}
              >
                <Text style={styles.workspaceLogoutCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.workspaceLogoutConfirm}
                onPress={executeVerifiedAction}
              >
                <Text style={styles.workspaceLogoutConfirmText}>
                  Verify
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>


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
    marginTop: 10,
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

  vaultGenerateText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },

  vaultCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },


  vaultSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 16,
  },

  vaultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 18,
    textAlign: 'center',
  },

  vaultRow: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  vaultGenerateButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
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

  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  auditAction: {
    color: '#0F172A',
    fontWeight: '900',
    flex: 1,
  },

  auditEntity: {
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
  },

  auditRecord: {
    color: '#475569',
    marginTop: 8,
  },

  auditDate: {
    color: '#94A3B8',
    marginTop: 6,
    fontSize: 12,
  },

  timelineItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  sectionEyebrow: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },

  formHeroTitle: {
    color: '#0F172A',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },

  formHeroSubtitle: {
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8,
  },


  helperText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: -4,
    marginBottom: 16,
  },
  field: { marginTop: 12 },
  fieldLabel: { color: '#334155', fontWeight: '800', marginTop: 8, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', backgroundColor: '#FFF', marginBottom: 18 },
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
