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
  getAuditTrailReportPdf,
  getActivityLogsCsv,
  reactivateStudent,
  reactivateTeacher,
  removeTeacherAssignment,
  resetStudentPassword,
  resetStudentProgress,
  resetTeacherPassword,
  updateStudentEnrollment,
  updateAccountStatus,
  removeAccountLockdown,
} from '../../api/admin';
import {
  hasAdminReauthProof,
  logout,
  verifyPassword,
} from '../../api/auth';
const NAV_ITEMS = [
  ['overview', '🏠', 'Overview'],
  ['accounts', '➕', 'Add Accounts'],
  ['assignments', '📌', 'Assignments'],
  ['students', '🎓', 'Students'],
  ['teachers', '👩‍🏫', 'Teachers'],
  ['archives', '🗃️', 'Deactivated Accounts'],
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
  const isSecondary = tone === 'slate';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`${tone}Button`],
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.78}
    >
      <Text
        style={[
          styles.buttonText,
          isSecondary && styles.secondaryButtonText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

export default function AdminHome({ navigation }) {
  const [section, setSection] = useState('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [stats, setStats] = useState({});
  const [enrollments, setEnrollments] = useState({ students: [], teachers: [], teacherAssignments: [], classOptions: [] });
  const [accounts, setAccounts] = useState([]);
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [recentCredentials, setRecentCredentials] = useState([]);

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
  // MOBILE_ADMIN_STUDENT_MANAGEMENT_PAGING_V1
  const [studentRenderLimit, setStudentRenderLimit] = useState(25);
  const [teachers, setTeachers] = useState([]);
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [archivedTeachers, setArchivedTeachers] = useState([]);
  const [logs, setLogs] = useState([]);

const [auditSearch, setAuditSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [auditDatePreset, setAuditDatePreset] = useState('all');
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false);
  const [auditCalendarTarget, setAuditCalendarTarget] = useState(null);
  const [auditCalendarMonth, setAuditCalendarMonth] = useState(() => new Date());
  const [auditFromDate, setAuditFromDate] = useState('');
  const [auditToDate, setAuditToDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [accountType, setAccountType] = useState('student');
  const [studentForm, setStudentForm] = useState({
    name: '',
    gradeLevel: '1',
    section: '',
    sectionMode: 'existing',
    newSection: '',
    gradeMenuOpen: false,
  });
  const [studentSectionMenuOpen, setStudentSectionMenuOpen] = useState(false);
  const [teacherForm, setTeacherForm] = useState({ name: '', email: '' });
  const [assignmentForm, setAssignmentForm] = useState({
    teacherId: '',
    gradeLevel: '1',
    section: '',
    teacherMenuOpen: false,
    gradeMenuOpen: false,
    sectionMenuOpen: false,
  });
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [
    studentGradeFilterMenuOpen,
    setStudentGradeFilterMenuOpen,
  ] = useState(false);
  const [
    studentSectionFilterMenuOpen,
    setStudentSectionFilterMenuOpen,
  ] = useState(false);

  const studentFormSection = studentForm.sectionMode === 'new' ? normalizeSpaces(studentForm.newSection) : normalizeSpaces(studentForm.section);
  const studentValidation = studentErrors({ ...studentForm, section: studentFormSection });
  const teacherValidation = teacherErrors(teacherForm);

  const studentFormValid = !Object.values(studentValidation).some(Boolean);
  const teacherFormValid = !Object.values(teacherValidation).some(Boolean);

  const classOptions = [
    ...(enrollments.classOptions || []),
    ...(enrollments.teacherAssignments || []),
    ...students,
  ];

  const gradeOptions = ['1', '2', '3', '4', '5', '6'];

  const [studentEnrollmentDrafts, setStudentEnrollmentDrafts] = useState({});

  function enrollmentDraftFor(student = {}) {
    const id = studentRecordId(student);
    return (
      studentEnrollmentDrafts[id] || {
        gradeLevel: String(student.gradeLevel || student.grade || ''),
        section: studentSectionValue(student),
      }
    );
  }

  function updateStudentEnrollmentDraft(studentId, values) {
    setStudentEnrollmentDrafts((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || {}),
        ...values,
      },
    }));
  }

  function studentRecordId(student = {}) {
    return student.id ?? student.studentId ?? student.student_id ?? student.profileId ?? student.profile_id;
  }

  function teacherRecordId(teacher = {}) {
    return (
      teacher.uuid ??
      teacher.id ??
      teacher.teacherId ??
      teacher.teacher_id ??
      teacher.profileId ??
      teacher.profile_id
    );
  }

  function studentGradeValue(student = {}) {
    return Number(student.gradeLevel ?? student.grade_level ?? student.grade ?? 0);
  }

  function studentSectionValue(student = {}) {
    return normalizeSpaces(student.section || student.sectionName || student.classSection || '');
  }

  async function saveStudentEnrollment(student) {
    const id = studentRecordId(student);
    const draft = enrollmentDraftFor(student);

    await run(
      `student-enrollment-${id}`,
      () =>
        updateStudentEnrollment(id, {
          gradeLevel: Number(draft.gradeLevel),
          section: normalizeSpaces(draft.section),
        }),
      'Student enrollment updated.'
    );

    setStudents((current) =>
      current.map((item) =>
        String(studentRecordId(item)) === String(id)
          ? {
              ...item,
              gradeLevel: Number(draft.gradeLevel),
              section: normalizeSpaces(draft.section),
            }
          : item
      )
    );
  }

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
        .filter((student) => studentGradeFilter === 'all' || studentGradeValue(student) === Number(studentGradeFilter))
        .map((student) => normalizeSpaces(student.section || student.sectionName || student.classSection || ''))
        .filter(Boolean)
    ),
  ].sort((first, second) => first.localeCompare(second));

  const normalizedStudentSearchQuery =
    normalizeSpaces(studentSearchQuery).toLowerCase();

  const filteredStudents = students.filter((student) => {
    const studentGrade = studentGradeValue(student);
    const studentSection = studentSectionValue(student);

    const matchesGrade =
      studentGradeFilter === 'all' ||
      studentGrade === Number(studentGradeFilter);

    const matchesSection =
      studentSectionFilter === 'all' ||
      studentSection === studentSectionFilter;

    const searchableStudent = [
      normalizeSpaces(
        student.name ||
        student.fullName ||
        student.displayName ||
        ''
      ),
      normalizeSpaces(
        student.studentCode ||
        student.student_code ||
        ''
      ),
      normalizeSpaces(
        student?.User?.username ||
        student?.user?.username ||
        ''
      ),
      studentGrade ? `Grade ${studentGrade}` : '',
      studentGrade ? `G${studentGrade}` : '',
      studentGrade ? String(studentGrade) : '',
      studentSection,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch =
      !normalizedStudentSearchQuery ||
      searchableStudent.includes(
        normalizedStudentSearchQuery
      );

    return (
      matchesGrade &&
      matchesSection &&
      matchesSearch
    );
  });

  const visibleStudents = filteredStudents.slice(0, studentRenderLimit);
  const hiddenFilteredStudentCount = Math.max(
    filteredStudents.length - visibleStudents.length,
    0
  );

  useEffect(() => {
    setStudentRenderLimit(25);
  }, [
    section,
    studentSearch,
    studentGradeFilter,
    studentSectionFilter,
    students.length,
  ]);


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
      setError(err.message || 'Hindi ma-load ang admin workspace.');
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
      Alert.alert('Hindi naisave', err.message || 'Pakisubukan muli.');
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
    setVerificationExpiresAt(null);

    await logout();

    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }


  function hasActiveVerificationSession() {
    return (
      verificationExpiresAt &&
      Date.now() < verificationExpiresAt &&
      hasAdminReauthProof()
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

    if (
      pendingAdminAction.keyword &&
      adminActionKeyword.trim() !== String(pendingAdminAction.keyword || '').trim().toUpperCase()
    ) {
      Alert.alert(
        'Confirmation Required',
        `Type ${String(pendingAdminAction.keyword || '').trim().toUpperCase()} using uppercase letters only.`
      );
      return;
    }

    setAdminActionVisible(false);

    runProtectedAction(async () => {
      await pendingAdminAction.action();
    });
  }

async function executeVerifiedAction() {
    try {
      const verification =
        await verifyPassword(
          passwordVerifyInput
        );

      const serverExpiry =
        Date.parse(
          String(
            verification?.reauthExpiresAt || ''
          )
        );

      setVerificationExpiresAt(
        Number.isFinite(serverExpiry)
          ? serverExpiry
          : Date.now() + (5 * 60 * 1000)
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
        'Hindi Na-verify',
        err?.message || 'Maling password.'
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


  function auditActionLabel(action = '') {
    const labels = {
      'account.status': 'Updated account status',
      'auth.login': 'Logged in',
      'auth.logout': 'Logged out',
      'auth.change_password': 'Changed password',
      'auth.verify_password': 'Verified password',
      'student.create': 'Created student account',
      'student.update': 'Updated student account',
      'student.archive': 'Deactivated student account',
      'student.reactivate': 'Reactivate students',
      'student.reset_password': 'Reset student password',
      'student.reset_progress': 'Reset student progress',
      'student.enrollment.update': 'Updated student class',
      'student.promote': 'Promoted student',
      'teacher.create': 'Created teacher account',
      'teacher.update': 'Updated teacher account',
      'teacher.archive': 'Deactivated teacher account',
      'teacher.reactivate': 'Reactivate teachers',
      'teacher.reset_password': 'Reset teacher password',
      'teacher.assignment.create': 'Assigned teacher class',
      'teacher.assignment.update': 'Updated teacher assignment',
      'teacher.assignment.remove': 'Removed teacher assignment',
      'lesson.create': 'Created lesson',
      'lesson.update': 'Updated lesson',
      'lesson.archive': 'Archived lesson',
      'lesson.complete': 'Completed lesson',
      'quiz.result': 'Submitted quiz result',
      'group.create': 'Created group',
      'group.update': 'Updated group',
      'group.archive': 'Archived group',
      'group.add_member': 'Added group member',
      'group.remove_member': 'Removed group member',
      'group.set_leader': 'Set group leader',
      'group_task.create': 'Created group task',
      'group_task.archive': 'Archived group task',
      'group_task.approve_group_completion': 'Approved group task',
      'group_task.return_group_completion': 'Returned group task',
      'speech_attempt.review': 'Reviewed speech attempt',
      'system.seed': 'Loaded seed data',
    };

    if (labels[action]) return labels[action];

    return String(action || 'System action')
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function auditActorFor(log) {
    const actorUserId = Number(log.actorUserId || log.userId || log.metadata?.actorUserId || 0);
    const actorProfiles = [
      ...accounts.map((account) => ({
        userId: Number(account.id || account.userId || 0),
        name: account.displayName || account.name || account.username || `User #${account.id || account.userId || '—'}`,
        username: account.username || account.email || '',
        roleLabel: account.Role?.name || account.role || account.roleName || 'user',
      })),
      ...students.map((student) => ({
        userId: Number(student.userId || student.User?.id || student.user?.id || 0),
        name: student.name || student.User?.displayName || student.user?.displayName || student.studentCode || 'Student',
        username: student.studentCode || student.User?.username || student.user?.username || '',
        roleLabel: 'student',
      })),
      ...archivedStudents.map((student) => ({
        userId: Number(student.userId || student.User?.id || student.user?.id || 0),
        name: student.name || student.User?.displayName || student.user?.displayName || student.studentCode || 'Deactivated student',
        username: student.studentCode || student.User?.username || student.user?.username || '',
        roleLabel: 'student',
      })),
      ...teachers.map((teacher) => ({
        userId: Number(teacher.userId || teacher.User?.id || teacher.user?.id || 0),
        name: teacher.name || teacher.User?.displayName || teacher.user?.displayName || teacher.employeeCode || 'Teacher',
        username: teacher.employeeCode || teacher.User?.username || teacher.user?.username || '',
        roleLabel: 'teacher',
      })),
      ...archivedTeachers.map((teacher) => ({
        userId: Number(teacher.userId || teacher.User?.id || teacher.user?.id || 0),
        name: teacher.name || teacher.User?.displayName || teacher.user?.displayName || teacher.employeeCode || 'Deactivated teacher',
        username: teacher.employeeCode || teacher.User?.username || teacher.user?.username || '',
        roleLabel: 'teacher',
      })),
    ].filter((profile) => profile.userId);

    const matched = actorProfiles.find((profile) => Number(profile.userId) === actorUserId);

    if (matched) {
      return {
        ...matched,
        roleLabel: String(matched.roleLabel || 'user').replace(/\b\w/g, (char) => char.toUpperCase()),
      };
    }

    return {
      userId: actorUserId || null,
      name: actorUserId ? `User #${actorUserId}` : 'System',
      username: '',
      roleLabel: actorUserId ? 'Unknown role' : 'System',
    };
  }

  function auditEntityLabel(log) {
    const entity = String(log.entityType || 'record')
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());

    return `${entity} #${log.entityId ?? '—'}`;
  }

  function auditDetails(log) {
    const metadata = log.metadata || {};
    const details = [];

    if (log.action === 'student.promote') {
      details.push(`${metadata.studentName || 'Student'}${metadata.studentCode ? ` (${metadata.studentCode})` : ''}`);
      if (metadata.oldGrade || metadata.newGrade) {
        details.push(`Grade ${metadata.oldGrade || '—'} → Grade ${metadata.newGrade || '—'}`);
      }
      if (metadata.section) details.push(`Section ${metadata.section}`);
    }

    if (metadata.status) details.push(`Status: ${metadata.status}`);
    if (metadata.reason) details.push(`Reason: ${metadata.reason}`);
    if (metadata.score !== undefined && metadata.score !== null) details.push(`Score: ${metadata.score}`);
    if (metadata.reviewStatus) details.push(`Review: ${metadata.reviewStatus}`);
    if (metadata.studentId) details.push(`Student ID: ${metadata.studentId}`);
    if (metadata.lessonId) details.push(`Lesson ID: ${metadata.lessonId}`);

    return details.join(' • ');
  }


  function accountUserIdForEntity(entity = {}) {
    return (
      entity?.userId ||
      entity?.User?.id ||
      entity?.user?.id ||
      entity?.Account?.id ||
      entity?.account?.id ||
      entity?.accountUserId ||
      null
    );
  }

  function statusForEntity(entity = {}) {
    return String(
      entity?.User?.status ||
      entity?.user?.status ||
      entity?.status ||
      'active'
    ).toLowerCase();
  }

  function loginSecurityForEntity(entity = {}) {
    const user =
      entity?.User ||
      entity?.user ||
      entity?.Account ||
      entity?.account ||
      entity ||
      {};

    const suppliedSecurity =
      user?.loginSecurity ||
      entity?.loginSecurity ||
      {};

    const lockedUntilValue =
      suppliedSecurity.lockedUntil ||
      user?.lockedUntil ||
      user?.locked_until ||
      null;

    const lockedUntil = lockedUntilValue
      ? new Date(lockedUntilValue)
      : null;

    const validLockedUntil =
      lockedUntil && Number.isFinite(lockedUntil.getTime());

    const permanent =
      suppliedSecurity.status === 'permanent' ||
      (
        validLockedUntil &&
        lockedUntil.getFullYear() >= 9999
      );

    const temporary =
      suppliedSecurity.status === 'temporary' ||
      (
        validLockedUntil &&
        !permanent &&
        lockedUntil > new Date()
      );

    return {
      status: permanent
        ? 'permanent'
        : temporary
          ? 'temporary'
          : 'unlocked',
      failedLoginAttempts: Number(
        suppliedSecurity.failedLoginAttempts ??
        user?.failedLoginAttempts ??
        user?.failed_login_attempts ??
        0
      ),
      totalFailedLoginAttempts: Number(
        suppliedSecurity.totalFailedLoginAttempts ??
        user?.totalFailedLoginAttempts ??
        user?.total_failed_login_attempts ??
        0
      ),
      lockedUntil: validLockedUntil
        ? lockedUntil
        : null,
      remainingLockMinutes: Number(
        suppliedSecurity.remainingLockMinutes ||
        (
          temporary && validLockedUntil
            ? Math.max(
                1,
                Math.ceil(
                  (
                    lockedUntil.getTime() -
                    Date.now()
                  ) /
                  (60 * 1000)
                )
              )
            : 0
        )
      ),
    };
  }

  function handleRemoveAccountLockdown(entity, label) {
    const userId = accountUserIdForEntity(entity);

    if (!userId) {
      Alert.alert(
        'Missing Account Link',
        'No user account is linked to this record.'
      );
      return;
    }

    requestProtectedAdminAction({
      keyword: 'UNLOCK',
      reasonPlaceholder:
        `e.g. ${label} verified their identity and requested account access`,
      action: (reason) =>
        run(
          `account-unlock-${userId}`,
          () => removeAccountLockdown(userId, { reason }),
          'Account lockdown removed.'
        ),
    });
  }

  function renderLoginSecurityControl(entity, label) {
    const security = loginSecurityForEntity(entity);
    const locked =
      security.status === 'temporary' ||
      security.status === 'permanent';

    return (
      <View style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: locked ? '#f59e0b' : '#d1d5db',
        backgroundColor: locked ? '#fffbeb' : '#f9fafb',
      }}>
        <Text style={{
          fontSize: 12,
          fontWeight: '800',
          color: '#374151',
          marginBottom: 5,
        }}>
          Login Security
        </Text>

        <Text style={{
          fontSize: 13,
          fontWeight: '900',
          color:
            security.status === 'permanent'
              ? '#b91c1c'
              : security.status === 'temporary'
                ? '#b45309'
                : '#047857',
        }}>
          {security.status === 'permanent'
            ? 'Permanently Locked'
            : security.status === 'temporary'
              ? 'Temporarily Locked'
              : 'Unlocked'}
        </Text>

        <Text style={{
          marginTop: 5,
          fontSize: 11,
          color: '#6b7280',
        }}>
          Current cycle failures: {security.failedLoginAttempts}
        </Text>

        <Text style={{
          marginTop: 2,
          fontSize: 11,
          color: '#6b7280',
        }}>
          Total failed logins: {security.totalFailedLoginAttempts}/10
        </Text>

        {security.status === 'temporary' ? (
          <Text style={{
            marginTop: 2,
            fontSize: 11,
            color: '#92400e',
          }}>
            Cooldown: approximately {security.remainingLockMinutes} minute
            {security.remainingLockMinutes === 1 ? '' : 's'} remaining
          </Text>
        ) : null}

        {locked ? (
          <View style={{ marginTop: 9 }}>
            <Button
              tone="green"
              disabled={Boolean(busy)}
              onPress={() =>
                handleRemoveAccountLockdown(entity, label)
              }
            >
              Remove Lockdown
            </Button>
          </View>
        ) : null}
      </View>
    );
  }

  function handleAccountStatusChange(entity, nextStatus, label) {
    const userId = accountUserIdForEntity(entity);

    if (!userId) {
      Alert.alert(
        'Missing Account Link',
        'No user account is linked to this record.'
      );
      return;
    }

    run(
      `account-status-${userId}-${nextStatus}`,
      () => updateAccountStatus(userId, nextStatus),
      nextStatus === 'archived'
        ? 'Account deactivated.'
        : 'Account status updated.'
    );
  }

  function renderStatusControl(entity, label) {
    const currentStatus = statusForEntity(entity);

    return (
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 6 }}>
          Account Status
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {['active', 'archived'].map((statusOption) => {
            const selected = currentStatus === statusOption;

            return (
              <TouchableOpacity
                key={statusOption}
                disabled={selected || Boolean(busy)}
                onPress={() => handleAccountStatusChange(entity, statusOption, label)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: selected ? '#125334' : '#D1D5DB',
                  backgroundColor: selected ? '#125334' : '#FFFFFF',
                  opacity: selected || busy ? 0.85 : 1,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: selected ? '#FFFFFF' : '#334155', fontWeight: '800' }}>
                  {statusOption === 'active' ? 'Active' : 'Deactivated'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ marginTop: 2, fontSize: 11, color: '#6b7280' }}>
          Only Active and Deactivated are allowed.
        </Text>
      </View>
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
            ['🗃️', archived, 'Deactivated Accounts'],
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
          {logs.slice(0, 6).map((log) => {
            const actor = auditActorFor(log);
            return (
              <View key={log.id} style={styles.timelineItem}>
                <Text style={styles.rowTitle}>{auditActionLabel(log.action)}</Text>
                <Text style={styles.auditActor}>By {actor.name}</Text>
                <Text style={styles.muted}>
                  {actor.roleLabel}{actor.username ? ` • ${actor.username}` : ''}{actor.userId ? ` • User #${actor.userId}` : ''}
                </Text>
                <Text style={styles.muted}>
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </View>
            );
          })}
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

              <TouchableOpacity
                style={styles.auditDateDropdownButton}
                onPress={() =>
                  setStudentForm((current) => ({
                    ...current,
                    gradeMenuOpen: !current.gradeMenuOpen,
                  }))
                }
                disabled={Boolean(busy)}
              >
                <Text style={styles.auditDateDropdownText}>
                  {studentForm.gradeLevel
                    ? `Grade ${studentForm.gradeLevel}`
                    : 'Select Grade'}
                </Text>

                <Text style={styles.auditDateDropdownChevron}>
                  {studentForm.gradeMenuOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>


              {studentForm.gradeMenuOpen ? (
                <View style={styles.auditDateDropdownPanel}>
                  {gradeOptions.map((grade) => (
                    <TouchableOpacity
                      key={`student-grade-${grade}`}
                      style={styles.auditDateDropdownOption}
                      onPress={() =>
                        setStudentForm((current) => ({
                          ...current,
                          gradeLevel: grade,
                          section: '',
                          sectionMode: 'existing',
                          newSection: '',
                          gradeMenuOpen: false,
                        }))
                      }
                    >
                      <Text style={styles.auditDateDropdownOptionText}>
                        Grade {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            {studentValidation.gradeLevel && (
              <Text style={styles.errorText}>
                Grade level must be from 1 to 6.
              </Text>
            )}
            <Text style={styles.fieldLabel}>Section</Text>
            <TouchableOpacity
              style={styles.auditDateDropdownButton}
              onPress={() => setStudentSectionMenuOpen((current) => !current)}
              disabled={Boolean(busy)}
            >
              <Text style={styles.auditDateDropdownText}>
                {studentForm.sectionMode === 'new'
                  ? 'Add new section'
                  : studentForm.section || 'Select existing section'}
              </Text>
              <Text style={styles.auditDateDropdownChevron}>
                {studentSectionMenuOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {studentSectionMenuOpen ? (
              <View style={styles.auditDateDropdownPanel}>
                {studentSectionOptions.map((sectionOption) => (
                  <TouchableOpacity
                    key={`student-section-${sectionOption}`}
                    style={[
                      styles.auditDateDropdownOption,
                      studentForm.sectionMode !== 'new' && normalizeSpaces(studentForm.section) === sectionOption && styles.auditDateDropdownOptionActive,
                    ]}
                    onPress={() => {
                      setStudentForm((current) => ({
                        ...current,
                        section: sectionOption,
                        sectionMode: 'existing',
                        newSection: '',
                      }));
                      setStudentSectionMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.auditDateDropdownOptionText,
                        studentForm.sectionMode !== 'new' && normalizeSpaces(studentForm.section) === sectionOption && styles.auditDateDropdownOptionTextActive,
                      ]}
                    >
                      {sectionOption}
                    </Text>
                  </TouchableOpacity>
                ))}

                {!studentSectionOptions.length ? (
                  <Text style={styles.helperText}>No existing sections for this grade.</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.auditDateDropdownOption,
                    studentForm.sectionMode === 'new' && styles.auditDateDropdownOptionActive,
                  ]}
                  onPress={() => {
                    setStudentForm((current) => ({
                      ...current,
                      section: '',
                      sectionMode: 'new',
                      newSection: current.newSection || '',
                    }));
                    setStudentSectionMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.auditDateDropdownOptionText,
                      studentForm.sectionMode === 'new' && styles.auditDateDropdownOptionTextActive,
                    ]}
                  >
                    + Add new section
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {studentForm.sectionMode === 'new' ? (
              <Field
                label="New Section Name"
                value={studentForm.newSection}
                onChangeText={(newSection) =>
                  setStudentForm((current) => ({
                    ...current,
                    newSection: normalizeSpaces(newSection),
                  }))
                }
              />
            ) : null}
            {studentValidation.section && (
              <Text style={styles.errorText}>
                Section must use A-Z letters and spaces only. Each word must have at least 2 letters.
              </Text>
            )}
            <Button
              disabled={Boolean(busy) || !studentFormValid}
              onPress={() =>
                  runProtectedAction(async () => {
              const payload = {
                name: normalizeSpaces(studentForm.name),
                gradeLevel: Number(studentForm.gradeLevel),
                section: studentFormSection,
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

                setStudentForm({ name: '', gradeLevel: '1', section: '', sectionMode: 'existing', newSection: '' });
                setStudentSectionMenuOpen(false);
              }
            })}>Create Student</Button>
          </>
        ) : (
          <>
            <Text style={styles.sectionEyebrow}>TEACHER ACCOUNT</Text>
            <Text style={styles.formHeroTitle}>Add Teacher</Text>
            <Text style={styles.formHeroSubtitle}>
              Create a teacher login, then assign handled classes in the next section.
            </Text>

            <Field
              label="Teacher First and Last Name"
              value={teacherForm.name}
              placeholder="e.g. Maria Santos"
              onChangeText={(name) =>
                setTeacherForm((current) => ({
                  ...current,
                  name,
                }))
              }
            />
            {/* STRICT_TEACHER_FULL_NAME_UI */}
            <Text style={styles.helperText}>
              First and last name are required. Use A-Z letters and spaces only. Each name must have at least 2 letters.
            </Text>
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
              onPress={() =>
                  runProtectedAction(async () => {
              const teacherEmail = String(teacherForm.email || '').trim();
              const teacherPayload = {
                name: normalizeSpaces(teacherForm.name),
              };

              if (teacherEmail) {
                teacherPayload.email = teacherEmail;
              }

              const saved = await run('create-teacher', () => createTeacherAccount(teacherPayload), 'Nagawa ang teacher account.');

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
                  'Nagawa ang Teacher Account',
                  `Username\n\n${saved.username}\n\nTemporary PIN\n\n${saved.temporaryPin}\n\nTeacher must change this PIN on first login.`
                );

                setTeacherForm({ name: '', email: '' });
              }
            })}>Add Teacher</Button>
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

          <TouchableOpacity
            style={styles.auditDateDropdownButton}
            onPress={() =>
              setAssignmentForm((current) => ({
                ...current,
                teacherMenuOpen: !current.teacherMenuOpen,
              }))
            }
          >
            <Text style={styles.auditDateDropdownText}>
              {
                teachers.find(
                  (teacher) =>
                    String(teacherRecordId(teacher)) ===
                    String(assignmentForm.teacherId)
                )?.name || 'Select Teacher'
              }
            </Text>

            <Text style={styles.auditDateDropdownChevron}>
              {assignmentForm.teacherMenuOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>


          {assignmentForm.teacherMenuOpen ? (
            <View style={styles.auditDateDropdownPanel}>
              {teachers.map((teacher) => (
                <TouchableOpacity
                  key={`assignment-teacher-${teacherRecordId(teacher)}`}
                  style={styles.auditDateDropdownOption}
                  onPress={() =>
                    setAssignmentForm((current) => ({
                      ...current,
                      teacherId: teacherRecordId(teacher),
                      teacherMenuOpen: false,
                    }))
                  }
                >
                  <Text style={styles.auditDateDropdownOptionText}>
                    {teacher.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}


          <Text style={styles.fieldLabel}>Grade</Text>

          <TouchableOpacity
            style={styles.auditDateDropdownButton}
            onPress={() =>
              setAssignmentForm((current) => ({
                ...current,
                gradeMenuOpen: !current.gradeMenuOpen,
              }))
            }
          >
            <Text style={styles.auditDateDropdownText}>
              {assignmentForm.gradeLevel
                ? `Grade ${assignmentForm.gradeLevel}`
                : 'Select Grade'}
            </Text>

            <Text style={styles.auditDateDropdownChevron}>
              {assignmentForm.gradeMenuOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>


          {assignmentForm.gradeMenuOpen ? (
            <View style={styles.auditDateDropdownPanel}>
              {gradeOptions.map((grade) => (
                <TouchableOpacity
                  key={`assignment-grade-${grade}`}
                  style={styles.auditDateDropdownOption}
                  onPress={() =>
                    setAssignmentForm((current) => ({
                      ...current,
                      gradeLevel: grade,
                      section: '',
                      gradeMenuOpen: false,
                    }))
                  }
                >
                  <Text style={styles.auditDateDropdownOptionText}>
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

<Text style={styles.fieldLabel}>Section</Text>

          <TouchableOpacity
            style={styles.auditDateDropdownButton}
            onPress={() =>
              setAssignmentForm((current) => ({
                ...current,
                sectionMenuOpen: !current.sectionMenuOpen,
              }))
            }
          >
            <Text style={styles.auditDateDropdownText}>
              {assignmentForm.section || 'Select Section'}
            </Text>

            <Text style={styles.auditDateDropdownChevron}>
              {assignmentForm.sectionMenuOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>


          {assignmentForm.sectionMenuOpen ? (
            <View style={styles.auditDateDropdownPanel}>

              {assignmentSectionOptions.map((sectionOption) => (
                <TouchableOpacity
                  key={`assignment-section-${sectionOption}`}
                  style={styles.auditDateDropdownOption}
                  onPress={() =>
                    setAssignmentForm((current) => ({
                      ...current,
                      section: sectionOption,
                      sectionMenuOpen: false,
                    }))
                  }
                >
                  <Text style={styles.auditDateDropdownOptionText}>
                    {sectionOption}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
<Button
            tone="green"
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
                'Naisave ang assignment.'
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
          <Text style={styles.helperText}>
            Search and filter active students by year level and section.
          </Text>

          <Text style={styles.fieldLabel}>Search Students</Text>

          <TextInput
            value={studentSearchQuery}
            onChangeText={setStudentSearchQuery}
            placeholder="Search by name, student code, username, grade, or section..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.auditSearchInput}
            onFocus={() => {
              setStudentGradeFilterMenuOpen(false);
              setStudentSectionFilterMenuOpen(false);
            }}
          />

          <Text style={styles.fieldLabel}>Year Level</Text>

          <TouchableOpacity
            style={styles.auditDateDropdownButton}
            disabled={Boolean(busy)}
            activeOpacity={0.85}
            onPress={() => {
              setStudentGradeFilterMenuOpen(
                (current) => !current
              );
              setStudentSectionFilterMenuOpen(false);
            }}
          >
            <Text style={styles.auditDateDropdownText}>
              {studentGradeFilter === 'all'
                ? 'All Year Levels'
                : `Grade ${studentGradeFilter}`}
            </Text>

            <Text style={styles.auditDateDropdownChevron}>
              {studentGradeFilterMenuOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {studentGradeFilterMenuOpen ? (
            <View style={styles.auditDateDropdownPanel}>
              {[
                {
                  value: 'all',
                  label: 'All Year Levels',
                },
                ...gradeOptions.map((grade) => ({
                  value: String(grade),
                  label: `Grade ${grade}`,
                })),
              ].map((option) => {
                const selected =
                  String(studentGradeFilter) ===
                  String(option.value);

                return (
                  <TouchableOpacity
                    key={`student-grade-filter-${option.value}`}
                    style={[
                      styles.auditDateDropdownOption,
                      selected &&
                        styles.auditDateDropdownOptionActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => {
                      setStudentGradeFilter(option.value);
                      setStudentSectionFilter('all');
                      setStudentGradeFilterMenuOpen(false);
                      setStudentSectionFilterMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.auditDateDropdownOptionText,
                        selected &&
                          styles.auditDateDropdownOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.fieldLabel}>Section</Text>

          <TouchableOpacity
            style={styles.auditDateDropdownButton}
            disabled={Boolean(busy)}
            activeOpacity={0.85}
            onPress={() => {
              setStudentSectionFilterMenuOpen(
                (current) => !current
              );
              setStudentGradeFilterMenuOpen(false);
            }}
          >
            <Text style={styles.auditDateDropdownText}>
              {studentSectionFilter === 'all'
                ? 'All Sections'
                : studentSectionFilter}
            </Text>

            <Text style={styles.auditDateDropdownChevron}>
              {studentSectionFilterMenuOpen ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {studentSectionFilterMenuOpen ? (
            <View style={styles.auditDateDropdownPanel}>
              {[
                {
                  value: 'all',
                  label: 'All Sections',
                },
                ...studentManagementSectionOptions.map(
                  (sectionOption) => ({
                    value: sectionOption,
                    label: sectionOption,
                  })
                ),
              ].map((option) => {
                const selected =
                  studentSectionFilter === option.value;

                return (
                  <TouchableOpacity
                    key={`student-section-filter-${option.value}`}
                    style={[
                      styles.auditDateDropdownOption,
                      selected &&
                        styles.auditDateDropdownOptionActive,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => {
                      setStudentSectionFilter(option.value);
                      setStudentSectionFilterMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.auditDateDropdownOptionText,
                        selected &&
                          styles.auditDateDropdownOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <Text style={styles.muted}>
            Showing {visibleStudents.length} of {filteredStudents.length} matching active students. Total: {students.length}.
          </Text>

        {visibleStudents.map((student) => (
          <View key={student.id} style={styles.recordCard}>
            <Text style={styles.rowTitle}>{student.avatar || '🧒'} {student.name}</Text>
            <Text style={styles.muted}>{student.studentCode} • Grade {student.gradeLevel} • {student.section} • {student.xp || 0} XP</Text>
            <View style={styles.choiceRow}>
              <Button tone="slate" disabled={Boolean(busy)} onPress={() => requestProtectedAdminAction({
                keyword: 'STUDENTPIN',
                reasonPlaceholder: 'e.g. Student forgot their password',
                action: (reason) => run(
                  `student-pin-${student.id}`,
                  () => resetStudentPassword(studentRecordId(student), {
                    reason
                  }),
                  (data) => `Temporary PIN: ${data.temporaryPin}`
                )
              })}>Reset Password</Button>

              <Button tone="slate" disabled={Boolean(busy)} onPress={() => run(
                `student-progress-${student.id}`,
                () => resetStudentProgress(studentRecordId(student)),
                'Progress reset.'
              )}>Reset Progress</Button>

{renderLoginSecurityControl(
  student,
  student.name || 'student account'
)}

            </View>
            {(() => {
              const enrollmentDraft = enrollmentDraftFor(student);

              return (
                <>
                  <Text style={styles.fieldLabel}>Grade</Text>

                  <TouchableOpacity
                    style={styles.auditDateDropdownButton}
                    onPress={() =>
                      updateStudentEnrollmentDraft(studentRecordId(student), {
                        gradeMenuOpen:
                          !enrollmentDraft.gradeMenuOpen,
                      })
                    }
                  >
                    <Text style={styles.auditDateDropdownText}>
                      {enrollmentDraft.gradeLevel
                        ? `Grade ${enrollmentDraft.gradeLevel}`
                        : 'Select Grade'}
                    </Text>

                    <Text style={styles.auditDateDropdownChevron}>
                      {enrollmentDraft.gradeMenuOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>

                  {enrollmentDraft.gradeMenuOpen ? (
                    <View style={styles.auditDateDropdownPanel}>
                      {gradeOptions.map((grade) => (
                        <TouchableOpacity
                          key={`student-grade-${student.id}-${grade}`}
                          style={styles.auditDateDropdownOption}
                          onPress={() =>
                            updateStudentEnrollmentDraft(
                              studentRecordId(student),
                              {
                                gradeLevel: grade,
                                gradeMenuOpen: false,
                              }
                            )
                          }
                        >
                          <Text style={styles.auditDateDropdownOptionText}>
                            Grade {grade}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}


            <Text style={styles.fieldLabel}>Section</Text>

            <TouchableOpacity
              style={styles.auditDateDropdownButton}
              onPress={() =>
                updateStudentEnrollmentDraft(studentRecordId(student), {
                  sectionMenuOpen:
                    !enrollmentDraft.sectionMenuOpen,
                })
              }
            >
              <Text style={styles.auditDateDropdownText}>
                {enrollmentDraft.section || 'Select Section'}
              </Text>

              <Text style={styles.auditDateDropdownChevron}>
                {enrollmentDraft.sectionMenuOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {enrollmentDraft.sectionMenuOpen ? (
              <View style={styles.auditDateDropdownPanel}>
                {[...new Set(
                  classOptions
                    .filter(item =>
                      !enrollmentDraft.gradeLevel ||
                      Number(item.gradeLevel || item.grade) ===
                      Number(enrollmentDraft.gradeLevel)
                    )
                    .map(item =>
                      normalizeSpaces(
                        item.section ||
                        item.sectionName ||
                        item.classSection ||
                        ''
                      )
                    )
                    .filter(Boolean)
                )]
                  .sort((a, b) => a.localeCompare(b))
                  .map(sectionOption => (
                    <TouchableOpacity
                      key={`student-section-${student.id}-${sectionOption}`}
                      style={styles.auditDateDropdownOption}
                      onPress={() =>
                        updateStudentEnrollmentDraft(
                          studentRecordId(student),
                          {
                            section: sectionOption,
                            sectionMenuOpen: false,
                          }
                        )
                      }
                    >
                      <Text style={styles.auditDateDropdownOptionText}>
                        {sectionOption}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : null}

            <Button
              tone="slate"
              disabled={Boolean(busy)}
              onPress={() => saveStudentEnrollment(student)}
            >
              Save Class
            </Button>

                </>
              );
            })()}
          </View>
        ))}
        {hiddenFilteredStudentCount > 0 && (
          <Button
            tone="slate"
            onPress={() =>
              setStudentRenderLimit((current) => current + 25)
            }
          >
            Show {Math.min(25, hiddenFilteredStudentCount)} more students
          </Button>
        )}

        {!filteredStudents.length && (
          <Text style={styles.muted}>
            {students.length
              ? 'No students match the selected filters.'
              : 'Walang aktibong mag-aaral.'}
          </Text>
        )}
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
                    () => resetTeacherPassword(teacherRecordId(teacher), {
                      reason
                    }),
                    (data) => `Temporary PIN: ${data.temporaryPin}`
                  )
                })}>Reset Password</Button>
            {renderStatusControl(teacher, teacher.name || 'teacher account')}
            {renderLoginSecurityControl(teacher, teacher.name || 'teacher account')}
              </View>
            </View>
          );
        })}
      </Card>
    );
  }

  function renderArchive() {
    return (
      <Card>
        <Text style={styles.cardTitle}>Deactivate</Text>

        <Text style={styles.helperText}>
          Deactivated students and teachers cannot log in, but their records remain saved and can be reactivated at any time.
        </Text>
        {archivedStudents.map((student) => (
          <View key={`student-${student.id}`} style={styles.actionRow}>
            <View style={styles.flex}><Text style={styles.rowTitle}>{student.name}</Text><Text style={styles.muted}>Student • {student.studentCode}</Text></View>
            <Button tone="green" disabled={Boolean(busy)} onPress={() => run(
              `student-reactivate-${student.id}`,
              () => reactivateStudent(studentRecordId(student), {
                reason: 'Reactivated by administrator'
              }),
              'Student reactivated and restored to active accounts.'
            )}>Reactivate</Button>
          </View>
        ))}
        {archivedTeachers.map((teacher) => (
          <View key={`teacher-${teacher.id}`} style={styles.actionRow}>
            <View style={styles.flex}><Text style={styles.rowTitle}>{teacher.name}</Text><Text style={styles.muted}>Teacher • {teacher.employeeCode}</Text></View>
            <Button tone="green" disabled={Boolean(busy)} onPress={() => run(
              `teacher-reactivate-${teacher.id}`,
              () => reactivateTeacher(teacherRecordId(teacher), {
                reason: 'Reactivated by administrator'
              }),
              'Teacher reactivated and restored to active accounts.'
            )}>Reactivate</Button>
          </View>
        ))}
        {!archivedStudents.length && !archivedTeachers.length && <Text style={styles.muted}>No archived student or teacher accounts.</Text>}
      </Card>
    );
  }


function renderLogs() {
    const actionOptions = [...new Set(logs.map(l => l.action).filter(Boolean))];

    function auditInputDate(date) {
      return date.toISOString().slice(0, 10);
    }

    function auditDateOnly(value) {
      if (!value) return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed.toDateString();
    }

    const now = new Date();
    const todayDate = auditInputDate(now);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);

    const todayLogs = logs.filter((log) => auditDateOnly(log.createdAt) === now.toDateString()).length;
    const weekLogs = logs.filter((log) => {
      const createdAt = new Date(log.createdAt);
      return !Number.isNaN(createdAt.getTime()) && now - createdAt <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const monthLogs = logs.filter((log) => {
      const createdAt = new Date(log.createdAt);
      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;

    function applyAuditPreset(preset) {
      setAuditDatePreset(preset);
      setDateRangeDropdownOpen(false);
      setAuditCalendarTarget(null);

      if (preset === 'today') {
        setAuditFromDate(todayDate);
        setAuditToDate(todayDate);
      } else if (preset === 'week') {
        setAuditFromDate(auditInputDate(sevenDaysAgo));
        setAuditToDate(todayDate);
      } else if (preset === 'month') {
        setAuditFromDate(auditInputDate(thirtyDaysAgo));
        setAuditToDate(todayDate);
      } else {
        setAuditFromDate('');
        setAuditToDate('');
      }
    }

    function auditParseDateInput(value) {
      if (!value) return null;
      const [year, month, day] = String(value).split('-').map(Number);
      if (!year || !month || !day) return null;
      const parsed = new Date(year, month - 1, day);
      if (Number.isNaN(parsed.getTime())) return null;
      return parsed;
    }

    function auditCalendarMonthLabel() {
      return auditCalendarMonth.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }

    function moveAuditCalendarMonth(offset) {
      setAuditCalendarMonth((current) => {
        const next = new Date(current);
        next.setMonth(current.getMonth() + offset);
        return next;
      });
    }

    function auditCalendarCells() {
      const year = auditCalendarMonth.getFullYear();
      const month = auditCalendarMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const startOffset = firstDay.getDay();
      const startDate = new Date(year, month, 1 - startOffset);

      return Array.from({ length: 42 }, (_, index) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + index);

        return {
          key: auditInputDate(date),
          date,
          label: date.getDate(),
          inMonth: date.getMonth() === month,
        };
      });
    }

    function openAuditCalendar(target) {
      setAuditCalendarTarget(target);
      const selected = auditParseDateInput(target === 'from' ? auditFromDate : auditToDate);
      setAuditCalendarMonth(selected || new Date());
    }

    function selectAuditCalendarDate(value) {
      if (auditCalendarTarget === 'from') {
        setAuditFromDate(value);
      } else {
        setAuditToDate(value);
      }
      setAuditDatePreset('custom');
      setAuditCalendarTarget(null);
    }

    function clearAuditCalendarDate(target) {
      if (target === 'from') {
        setAuditFromDate('');
      } else {
        setAuditToDate('');
      }
      setAuditDatePreset('custom');
      setAuditCalendarTarget(null);
    }

    function auditDateRangeLabel() {
      if (auditDatePreset === 'today') return 'Today';
      if (auditDatePreset === 'week') return 'Last 7 Days';
      if (auditDatePreset === 'month') return 'Last 30 Days';
      if (auditDatePreset === 'custom') {
        if (auditFromDate && auditToDate) return `${auditFromDate} to ${auditToDate}`;
        if (auditFromDate) return `From ${auditFromDate}`;
        if (auditToDate) return `Until ${auditToDate}`;
        return 'Custom Range';
      }
      return 'All Dates';
    }

    const filteredLogs = logs
      .filter((log) => {
        const actor = auditActorFor(log);
        const searchableLog = [
          JSON.stringify(log),
          auditActionLabel(log.action),
          auditEntityLabel(log),
          auditDetails(log),
          actor.name,
          actor.username,
          actor.roleLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          searchableLog.includes(auditSearch.toLowerCase());

        const matchesAction =
          actionFilter === 'all' ||
          log.action === actionFilter;

        const createdAt = new Date(log.createdAt);
        const matchesFrom =
          !auditFromDate ||
          (!Number.isNaN(createdAt.getTime()) && createdAt >= new Date(`${auditFromDate}T00:00:00`));
        const matchesTo =
          !auditToDate ||
          (!Number.isNaN(createdAt.getTime()) && createdAt <= new Date(`${auditToDate}T23:59:59`));

        return (
          matchesSearch &&
          matchesAction &&
          matchesFrom &&
          matchesTo
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
        <Text style={styles.muted}>
          Read-only record of recent admin and system maintenance actions.
        </Text>

        <View style={styles.auditStatsGrid}>
          {[
            [logs.length, 'Total Logs'],
            [todayLogs, 'Today'],
            [weekLogs, 'Last 7 Days'],
            [monthLogs, 'Ngayong Buwan'],
          ].map(([value, label]) => (
            <View key={label} style={styles.auditStatCard}>
              <Text style={styles.auditStatValue}>{value}</Text>
              <Text style={styles.auditStatLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <TextInput
          value={auditSearch}
          onChangeText={setAuditSearch}
          placeholder="Search user, action, or entity..."
          placeholderTextColor="#8aa39b"
          style={styles.auditSearchInput}
        />

        <Text style={styles.fieldLabel}>Date Range</Text>
        <TouchableOpacity
          style={styles.auditDateDropdownButton}
          onPress={() => setDateRangeDropdownOpen((current) => !current)}
        >
          <Text style={styles.auditDateDropdownIcon}>📅</Text>
          <Text style={styles.auditDateDropdownText}>{auditDateRangeLabel()}</Text>
          <Text style={styles.auditDateDropdownChevron}>
            {dateRangeDropdownOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {dateRangeDropdownOpen ? (
          <View style={styles.auditDateDropdownPanel}>
            {[
              ['today', 'Today'],
              ['week', 'Last 7 Days'],
              ['month', 'Last 30 Days'],
              ['all', 'All Dates'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.auditDateDropdownOption,
                  auditDatePreset === value && styles.auditDateDropdownOptionActive,
                ]}
                onPress={() => applyAuditPreset(value)}
              >
                <Text
                  style={[
                    styles.auditDateDropdownOptionText,
                    auditDatePreset === value && styles.auditDateDropdownOptionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}

            <View style={styles.auditCustomDatePanel}>
              <Text style={styles.auditCustomDateTitle}>Custom Range</Text>

              <View style={styles.auditDateRow}>
                <TouchableOpacity
                  style={[
                    styles.auditCalendarField,
                    auditCalendarTarget === 'from' && styles.auditCalendarFieldActive,
                  ]}
                  onPress={() => openAuditCalendar('from')}
                >
                  <Text style={styles.auditCalendarFieldLabel}>From</Text>
                  <Text style={styles.auditCalendarFieldValue}>
                    {auditFromDate || 'Select date'}
                  </Text>
                  <Text style={styles.auditCalendarFieldIcon}>📅</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.auditCalendarField,
                    auditCalendarTarget === 'to' && styles.auditCalendarFieldActive,
                  ]}
                  onPress={() => openAuditCalendar('to')}
                >
                  <Text style={styles.auditCalendarFieldLabel}>To</Text>
                  <Text style={styles.auditCalendarFieldValue}>
                    {auditToDate || 'Select date'}
                  </Text>
                  <Text style={styles.auditCalendarFieldIcon}>📅</Text>
                </TouchableOpacity>
              </View>

              {auditCalendarTarget ? (
                <View style={styles.auditCalendarPanel}>
                  <View style={styles.auditCalendarHeader}>
                    <TouchableOpacity
                      style={styles.auditCalendarNavButton}
                      onPress={() => moveAuditCalendarMonth(-1)}
                    >
                      <Text style={styles.auditCalendarNavText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.auditCalendarMonthTitle}>
                      {auditCalendarMonthLabel()}
                    </Text>

                    <TouchableOpacity
                      style={styles.auditCalendarNavButton}
                      onPress={() => moveAuditCalendarMonth(1)}
                    >
                      <Text style={styles.auditCalendarNavText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.auditCalendarWeekRow}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <Text key={day} style={styles.auditCalendarWeekText}>{day}</Text>
                    ))}
                  </View>

                  <View style={styles.auditCalendarGrid}>
                    {auditCalendarCells().map((cell) => {
                      const isSelected =
                        cell.key === auditFromDate ||
                        cell.key === auditToDate;

                      return (
                        <TouchableOpacity
                          key={cell.key}
                          style={[
                            styles.auditCalendarDay,
                            !cell.inMonth && styles.auditCalendarDayMuted,
                            isSelected && styles.auditCalendarDaySelected,
                          ]}
                          onPress={() => selectAuditCalendarDate(cell.key)}
                        >
                          <Text
                            style={[
                              styles.auditCalendarDayText,
                              !cell.inMonth && styles.auditCalendarDayTextMuted,
                              isSelected && styles.auditCalendarDayTextSelected,
                            ]}
                          >
                            {cell.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={styles.auditCalendarFooter}>
                    <TouchableOpacity
                      onPress={() => clearAuditCalendarDate(auditCalendarTarget)}
                    >
                      <Text style={styles.auditCalendarFooterText}>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => selectAuditCalendarDate(todayDate)}
                    >
                      <Text style={styles.auditCalendarFooterText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.auditApplyDateButton}
                onPress={() => {
                  setDateRangeDropdownOpen(false);
                  setAuditCalendarTarget(null);
                }}
              >
                <Text style={styles.auditApplyDateText}>Apply Date Range</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <Text style={styles.muted}>
          Logs: {filteredLogs.length} of {logs.length} • Actions: {actionOptions.length}
        </Text>

        <Text style={styles.fieldLabel}>Action</Text>

        <TouchableOpacity
          style={styles.auditActionDropdownButton}
          onPress={() => setActionDropdownOpen((current) => !current)}
        >
          <Text style={styles.auditActionDropdownText}>
            {actionFilter === 'all' ? 'All Actions' : auditActionLabel(actionFilter)}
          </Text>
          <Text style={styles.auditActionDropdownIcon}>
            {actionDropdownOpen ? '▲' : '▼'}
          </Text>
        </TouchableOpacity>

        {actionDropdownOpen ? (
          <View style={styles.auditActionDropdownPanel}>
            <TouchableOpacity
              style={[
                styles.auditActionDropdownOption,
                actionFilter === 'all' && styles.auditActionDropdownOptionActive,
              ]}
              onPress={() => {
                setActionFilter('all');
                setActionDropdownOpen(false);
              }}
            >
              <Text
                style={[
                  styles.auditActionDropdownOptionText,
                  actionFilter === 'all' && styles.auditActionDropdownOptionTextActive,
                ]}
              >
                All Actions
              </Text>
            </TouchableOpacity>

            {actionOptions.map(action => (
              <TouchableOpacity
                key={action}
                style={[
                  styles.auditActionDropdownOption,
                  actionFilter === action && styles.auditActionDropdownOptionActive,
                ]}
                onPress={() => {
                  setActionFilter(action);
                  setActionDropdownOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.auditActionDropdownOptionText,
                    actionFilter === action && styles.auditActionDropdownOptionTextActive,
                  ]}
                >
                  {auditActionLabel(action)}
                </Text>
                <Text style={styles.auditActionDropdownRawText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        <Text style={styles.fieldLabel}>Sort</Text>

        <View style={styles.choiceRow}>
          <Button
            tone={sortOrder === 'newest' ? 'green' : 'slate'}
            onPress={() => setSortOrder('newest')}
          >
            Newest
          </Button>

          <Button
            tone={sortOrder === 'oldest' ? 'green' : 'slate'}
            onPress={() => setSortOrder('oldest')}
          >
            Oldest
          </Button>
        </View>

        <Button
          tone="slate"
          onPress={() => {
            setAuditSearch('');
            setActionFilter('all');
            setActionDropdownOpen(false);
            setAuditDatePreset('all');
            setDateRangeDropdownOpen(false);
            setAuditCalendarTarget(null);
            setAuditFromDate('');
            setAuditToDate('');
            setSortOrder('newest');
          }}
        >
          Reset Filters
        </Button>

        {filteredLogs.map((log) => {
          const actor = auditActorFor(log);
          const details = auditDetails(log);

          return (
            <View key={log.id} style={styles.timelineItem}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>
                  {auditActionLabel(log.action)}
                </Text>

              </View>

              <Text style={styles.auditActor}>
                User: {actor.name}
              </Text>

              <Text style={styles.muted}>
                {actor.roleLabel}{actor.username ? ` • ${actor.username}` : ''}{actor.userId ? ` • User #${actor.userId}` : ''}
              </Text>

              <Text style={styles.auditRecord}>
                Action: {log.action}
              </Text>

              {details ? (
                <Text style={styles.muted}>
                  {details}
                </Text>
              ) : null}

              <Text style={styles.auditDate}>
                {new Date(log.createdAt).toLocaleString()}
              </Text>
            </View>
          );
        })}

        {!logs.length && <Text style={styles.muted}>No audit logs available.</Text>}
        {logs.length > 0 && !filteredLogs.length && (
          <Text style={styles.muted}>No audit logs match the selected filters.</Text>
        )}
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
        'Hindi na-export',
        err?.response?.data?.message || err?.message || 'Hindi makumpleto ang export.'
      );
    } finally {
      setBusy('');
    }
  }

  function renderReports() {
    return (
      <>
        <Card>
          <Text style={styles.cardTitle}>Take Action: Admin Audit Trail Report</Text>
          <Text style={styles.body}>
            Choose an admin audit trail action for system activity logs, account actions, timestamps, and target records.
          </Text>

          <Button
            tone="green"
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-audit-csv', () =>
                downloadTextReport({
                  title: 'Administrator CSV Audit Trail Report',
                  filename: 'tuklas-talino-admin-audit-trail-report.csv',
                  mimeType: 'text/csv',
                  loader: getActivityLogsCsv,
                })
              )
            }
          >
            {busy === 'admin-audit-csv' ? 'Preparing Admin CSV...' : 'CSV Admin Audit Trail Report'}
          </Button>

          <Button
            disabled={Boolean(busy)}
            onPress={() =>
              runExport('admin-audit-pdf', () =>
                downloadPdfReport({
                  title: 'Administrator PDF Audit Trail Report',
                  filename: 'tuklas-talino-admin-audit-trail-report.pdf',
                  loader: getAuditTrailReportPdf,
                  url: 'https://tuklastalino.com/api/reports/audit-trail.pdf',
                })
              )
            }
          >
            {busy === 'admin-audit-pdf' ? 'Preparing Admin PDF...' : 'PDF Admin Audit Trail Report'}
          </Button>




        </Card>
        <Card>
          <Text style={styles.cardTitle}>System Summary</Text>
          <Text style={styles.body}>Total users: {reportSummary?.totalUsers || 0}</Text>
          <Text style={styles.body}>Students: {reportSummary?.students || 0}</Text>
          <Text style={styles.body}>Teachers: {reportSummary?.teachers || 0}</Text>
          <Text style={styles.body}>Assignments: {reportSummary?.teacherAssignments || 0}</Text>
          <Text style={styles.body}>Deactivated accounts: {reportSummary?.archivedAccounts || 0}</Text>
        </Card>
      </>
    );
  }

  if (loading && !accounts.length) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /><Text style={styles.muted}>Loading admin workspace...</Text></View></SafeAreaView>;
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
          <Button tone="red" onPress={confirmLogout}>Logout</Button>
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
              workspaceNotice.type === 'warning' && styles.workspaceNoticeWarning,
              workspaceNotice.type === 'error' && styles.workspaceNoticeError,
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

Kailangan mong palitan ang PIN pagkatapos ng unang login.`
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
        {section === 'archives' && renderArchive()}
        {section === 'logs' && renderLogs()}
        {section === 'reports' && renderReports()}

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

            {pendingAdminAction?.reasonPlaceholder ? (
              <>
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
              style={[
                styles.input,
                styles.adminActionInput,
              ]}
              value={adminActionReason}
              onChangeText={setAdminActionReason}
              placeholder={String(
                pendingAdminAction?.reasonPlaceholder ||
                  'e.g. Reason for this administrative action'
              )
                .replace(/\s+/g, ' ')
                .trim()}
              placeholderTextColor="#94A3B8"
            />
              </>
            ) : null}

            <Text style={styles.workspaceLogoutCancelText}>
              Confirmation *
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.adminActionInput,
                styles.adminActionKeywordInput,
              ]}
              value={adminActionKeyword}
              onChangeText={(value) => {
                const uppercaseOnly = String(
                  value || ''
                ).replace(/[^A-Z]/g, '');

                setAdminActionKeyword(
                  uppercaseOnly
                );
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={32}
              placeholder={`Type ${pendingAdminAction?.keyword || ''} to continue`}
              placeholderTextColor="#94A3B8"
            />

            {pendingAdminAction?.keyword ? (
              <Text
                style={
                  styles.adminActionHelperText
                }
              >
                Uppercase letters only. Type{' '}
                {String(
                  pendingAdminAction.keyword
                )
                  .trim()
                  .toUpperCase()}{' '}
                exactly.
              </Text>
            ) : null}

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
                style={[
                  styles.workspaceLogoutConfirm,
                  (
                    (pendingAdminAction?.reasonPlaceholder && !adminActionReason.trim()) ||
                    (
                      Boolean(
                        pendingAdminAction?.keyword
                      ) &&
                      adminActionKeyword.trim() !==
                        String(
                          pendingAdminAction.keyword
                        )
                          .trim()
                          .toUpperCase()
                    )
                  ) && styles.disabled,
                ]}
                onPress={
                  executeProtectedAdminAction
                }
                disabled={
                  (pendingAdminAction?.reasonPlaceholder && !adminActionReason.trim()) ||
                  (
                    Boolean(
                      pendingAdminAction?.keyword
                    ) &&
                    adminActionKeyword.trim() !==
                      String(
                        pendingAdminAction.keyword
                      )
                        .trim()
                        .toUpperCase()
                  )
                }
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

            <Text style={styles.workspaceLogoutTitle}>Log out?</Text>
            <Text style={styles.workspaceLogoutBody}>
              Your workspace is saved. You can return at any time.
            </Text>

            <View style={styles.workspaceLogoutActions}>
              <TouchableOpacity
                style={styles.workspaceLogoutCancel}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.workspaceLogoutCancelText}>Cancel</Text>
              </TouchableOpacity>

              {/* WORKSPACE_LOGOUT_DANGER_RED_V1 */}
              <TouchableOpacity
                style={[
                  styles.workspaceLogoutConfirm,
                  styles.workspaceLogoutDangerConfirm,
                ]}
                onPress={handleLogout}
              >
                <Text style={styles.workspaceLogoutConfirmText}>Logout</Text>
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
    marginBottom: 10,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#86EFAC',
    shadowColor: '#14532D',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  workspaceNoticeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#22C55E',
  },
  workspaceNoticeWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  workspaceNoticeError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  workspaceNoticeText: {
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
  },

  workspaceLogoutModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  workspaceLogoutDangerConfirm: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },

  workspaceLogoutModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  workspaceLogoutIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  workspaceLogoutIconText: {
    fontSize: 42,
  },
  workspaceLogoutTitle: {
    width: '100%',
    alignSelf: 'stretch',

    fontSize: 30,
    lineHeight: 37,
    fontWeight: '900',
    color: '#0F172A',

    textAlign: 'center',

    marginBottom: 8,
  },
  workspaceLogoutBody: {
    fontSize: 16,
    lineHeight: 23,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 22,
  },
  adminActionInput: {
    width: '100%',
    minHeight: 56,

    alignSelf: 'stretch',
    flexShrink: 0,

    paddingHorizontal: 16,
    paddingVertical: 0,

    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  adminActionKeywordInput: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  adminActionHelperText: {
    width: '100%',
    alignSelf: 'stretch',

    marginTop: -10,
    marginBottom: 14,

    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',

    textAlign: 'center',
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
    backgroundColor: '#125334',
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
    borderColor: '#EDE9FE',
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
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 28,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  workspaceHeroIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#EDE9FE',
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
    color: '#6D28D9',
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
    borderColor: '#C4B5FD',
    color: '#5B21B6',
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
  navChip: {
    flexDirection: 'row',
    gap: 5,
    borderRadius: 99,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
  },
  navChipActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#7C3AED',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  navLabel: { color: '#64748B', fontWeight: '800' },
  navLabelActive: { color: '#6D28D9', fontWeight: '900' },
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
    backgroundColor: '#EDE9FE',
    color: '#6D28D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '900',
  },

  auditStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    marginBottom: 12,
  },
  auditStatCard: {
    flexGrow: 1,
    flexBasis: '46%',
    backgroundColor: '#FAF7FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 14,
  },
  auditStatValue: {
    color: '#2E1065',
    fontSize: 20,
    fontWeight: '900',
  },
  auditStatLabel: {
    color: '#2E1065',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  auditDateDropdownButton: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  auditDateDropdownIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  auditDateDropdownText: {
    color: '#2E1065',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  auditDateDropdownChevron: {
    color: '#2E1065',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
  },
  auditDateDropdownPanel: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  auditDateDropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  auditDateDropdownOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  auditDateDropdownOptionText: {
    color: '#2E1065',
    fontSize: 14,
    fontWeight: '900',
  },
  auditDateDropdownOptionTextActive: {
    color: '#6D28D9',
  },
  auditCustomDatePanel: {
    padding: 12,
    backgroundColor: '#FAF7FF',
  },
  auditCustomDateTitle: {
    color: '#6D28D9',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  auditApplyDateButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#125334',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  auditApplyDateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  auditSearchInput: {
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#2E1065',
    fontWeight: '800',
    backgroundColor: '#ffffff',
  },
  auditActionDropdownButton: {
    minHeight: 52,
    borderWidth: 2,
    borderColor: '#125334',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  auditActionDropdownText: {
    color: '#2E1065',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  auditActionDropdownIcon: {
    color: '#2E1065',
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 10,
  },
  auditActionDropdownPanel: {
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  auditActionDropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8FF',
  },
  auditActionDropdownOptionActive: {
    backgroundColor: '#F3E8FF',
  },
  auditActionDropdownOptionText: {
    color: '#2E1065',
    fontSize: 14,
    fontWeight: '900',
  },
  auditActionDropdownOptionTextActive: {
    color: '#6D28D9',
  },
  auditActionDropdownRawText: {
    color: '#7C6F8A',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  auditCalendarField: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 62,
  },
  auditCalendarFieldActive: {
    borderColor: '#6D28D9',
    backgroundColor: '#F3E8FF',
  },
  auditCalendarFieldLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  auditCalendarFieldValue: {
    color: '#2E1065',
    fontSize: 13,
    fontWeight: '900',
  },
  auditCalendarFieldIcon: {
    position: 'absolute',
    right: 10,
    top: 18,
    fontSize: 16,
  },
  auditCalendarPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 10,
    marginTop: 10,
  },
  auditCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  auditCalendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
  },
  auditCalendarNavText: {
    color: '#6D28D9',
    fontSize: 22,
    fontWeight: '900',
  },
  auditCalendarMonthTitle: {
    color: '#2E1065',
    fontSize: 14,
    fontWeight: '900',
  },
  auditCalendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  auditCalendarWeekText: {
    flex: 1,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '900',
  },
  auditCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  auditCalendarDay: {
    width: '14.285%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginVertical: 1,
  },
  auditCalendarDayMuted: {
    opacity: 0.35,
  },
  auditCalendarDaySelected: {
    backgroundColor: '#6D28D9',
  },
  auditCalendarDayText: {
    color: '#2E1065',
    fontSize: 12,
    fontWeight: '800',
  },
  auditCalendarDayTextMuted: {
    color: '#A78BFA',
  },
  auditCalendarDayTextSelected: {
    color: '#ffffff',
  },
  auditCalendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  auditCalendarFooterText: {
    color: '#6D28D9',
    fontSize: 13,
    fontWeight: '900',
  },

  auditDateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  auditDateInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#C4B5FD',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#2E1065',
    fontWeight: '800',
    backgroundColor: '#ffffff',
  },

  auditActor: {
    color: '#6D28D9',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 8,
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
  button: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  darkButton: {
    backgroundColor: '#125334',
    borderColor: '#125334',
  },
  greenButton: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  slateButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  redButton: {
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
  },
  disabled: {
    opacity: 0.42,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  secondaryButtonText: {
    color: '#334155',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  recordCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginTop: 10 },
  error: { color: '#B91C1C', fontWeight: '800' },
});
