import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
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
  addGroupMember,
  addGroupTask,
  approveGroupTask,
  archiveLesson,
  createGroup,
  createLesson,
  getActivityLogsCsv,
  getPendingGroupChecks,
  getReportSummary,
  getStudentReportCsv,
  getSummaryReportText,
  getTeacherDashboard,
  getTeacherGroups,
  getTeacherLessons,
  getTeacherMonitoringStats,
  getTeacherQuizPerformance,
  returnGroupTask,
  updateLesson,
  uploadLessonMaterial,
} from '../../api/teacher';
import { logout } from '../../api/auth';

const NAV_ITEMS = [
  ['dashboard', '🏠', 'Dashboard'],
  ['lessons', '📚', 'Lessons'],
  ['groups', '👥', 'Groups'],
  ['assessment', '🧠', 'Assessment'],
  ['students', '🎓', 'Students'],
  ['reports', '📊', 'Reports'],
];
const BUILDER_STEPS = ['Material', 'Details', 'Activities', 'Preview', 'My Lessons'];
const QUIZ_FILTERS = ['All', 'Needs Support', 'Developing', 'Proficient', 'Advanced'];
const SUBJECTS = ['Pagbasa', 'Bokabularyo', 'Panitikan', 'Oral Communication', 'Pagsulat'];

function emptyLessonDraft() {
  return {
    gradeLevel: '1',
    subject: 'Pagbasa',
    title: '',
    duration: '10 minuto',
    xpReward: '20',
    passage: '',
    instructions: '',
    speechTarget: '',
    material: null,
    activities: [],
  };
}

function SectionCard({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Field({ label, value, onChangeText, multiline = false, keyboardType = 'default', placeholder = '' }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

function SmallButton({ children, onPress, tone = 'green', disabled = false }) {
  return (
    <TouchableOpacity
      style={[styles.smallButton, styles[`${tone}Button`], disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.smallButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}

export default function TeacherHome({ navigation }) {
  const [section, setSection] = useState('dashboard');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [monitoring, setMonitoring] = useState({ rows: [] });
  const [quizPerformance, setQuizPerformance] = useState({ summary: {}, rows: [] });
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [pendingChecks, setPendingChecks] = useState({ summary: {}, rows: [] });
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [builderStep, setBuilderStep] = useState(0);
  const [draft, setDraft] = useState(emptyLessonDraft);
  const [newActivity, setNewActivity] = useState({
    type: 'infographic',
    title: '',
    instructions: '',
    content: '',
    question: '',
    optionA: '',
    optionB: '',
    correctOption: 'A',
  });
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', xpReward: '10' });
  const [quizFilter, setQuizFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, monitor, quiz, pending, groupData, lessonData, summary] = await Promise.all([
        getTeacherDashboard(),
        getTeacherMonitoringStats(),
        getTeacherQuizPerformance(),
        getPendingGroupChecks(),
        getTeacherGroups(),
        getTeacherLessons(),
        getReportSummary(),
      ]);
      setDashboard(dash);
      setMonitoring(monitor);
      setQuizPerformance(quiz);
      setPendingChecks(pending);
      setGroups((groupData.groups || []).filter((group) => group.status !== 'archived'));
      setLessons(lessonData.lessons || []);
      setReportSummary(summary);
    } catch (err) {
      setError(err.message || 'Unable to load teacher workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const selectedGroup = groups.find((group) => Number(group.id) === Number(selectedGroupId)) || groups[0];
  const activityCoverage = useMemo(() => lessons.map((lesson) => {
    const activities = lesson.activities || [];
    return {
      ...lesson,
      quizCount: activities.reduce((count, activity) => count + (activity.questions?.length || 0), 0),
      writingCount: activities.filter((activity) => activity.type === 'writing').length,
      speechCount: activities.filter((activity) => activity.type === 'speech').length,
    };
  }), [lessons]);
  const quizRows = (quizPerformance.rows || []).filter((row) => quizFilter === 'All' || row.status === quizFilter);
  const stats = dashboard?.stats || {};

  async function run(action, work, success) {
    setBusy(action);
    try {
      const data = await work();
      if (success) setWorkspaceNotice({ type: 'success', text: typeof success === 'function' ? success(data) : success });
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

  async function pickMaterial() {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    setBusy('material');
    try {
      const data = await uploadLessonMaterial(result.assets[0]);
      setDraft((current) => ({ ...current, material: data.material }));
      Alert.alert('Lesson Material', 'File uploaded successfully.');
    } catch (err) {
      Alert.alert('Lesson Material', err.message || 'Unable to upload file.');
    } finally {
      setBusy('');
    }
  }

  function addActivity() {
    const type = newActivity.type;
    const title = newActivity.title.trim() || {
      infographic: 'Lesson Notes',
      writing: 'Writing Activity',
      speech: 'Speech Practice',
      mcq: 'Multiple Choice Quiz',
    }[type];
    let activity;

    if (type === 'mcq') {
      if (!newActivity.question.trim() || !newActivity.optionA.trim() || !newActivity.optionB.trim()) {
        Alert.alert('Activities', 'Add a question and two answer choices.');
        return;
      }
      activity = {
        type,
        title,
        instructions: newActivity.instructions,
        questions: [{
          question: newActivity.question,
          options: [
            { text: newActivity.optionA, isCorrect: newActivity.correctOption === 'A' },
            { text: newActivity.optionB, isCorrect: newActivity.correctOption === 'B' },
          ],
        }],
      };
    } else if (type === 'writing') {
      if (!newActivity.content.trim()) return Alert.alert('Activities', 'Add a writing prompt.');
      activity = { type, title, instructions: newActivity.instructions, prompt: newActivity.content };
    } else if (type === 'speech') {
      if (!newActivity.content.trim()) return Alert.alert('Activities', 'Add a speech target.');
      activity = { type, title, instructions: newActivity.instructions, targetText: newActivity.content };
    } else {
      if (!newActivity.content.trim()) return Alert.alert('Activities', 'Add lesson-note content.');
      activity = { type: 'infographic', title, instructions: newActivity.instructions, content: newActivity.content };
    }

    setDraft((current) => ({ ...current, activities: [...current.activities, activity] }));
    setNewActivity({
      type: 'infographic',
      title: '',
      instructions: '',
      content: '',
      question: '',
      optionA: '',
      optionB: '',
      correctOption: 'A',
    });
  }

  async function saveLesson(status) {
    if (!draft.title.trim()) return Alert.alert('Lesson Builder', 'Add a lesson title.');

    const activities = [
      ...(draft.material ? [{
        type: 'material',
        title: 'Lesson Material',
        instructions: draft.instructions,
        ...draft.material,
      }] : []),
      ...draft.activities,
    ];

    const payload = {
      gradeLevel: Number(draft.gradeLevel),
      subject: draft.subject,
      title: draft.title,
      duration: draft.duration,
      xpReward: Number(draft.xpReward || 20),
      passage: draft.passage || null,
      instructions: draft.instructions || null,
      speechTarget: draft.speechTarget || null,
      status,
      activities,
    };

    const saved = await run('lesson-save', () => createLesson(payload), status === 'draft' ? 'Draft saved.' : 'Lesson published.');
    if (saved) {
      setDraft(emptyLessonDraft());
      setBuilderStep(4);
    }
  }

  async function shareReport(title, loader) {
    setBusy(title);
    try {
      const message = await loader();
      await Share.share({ title, message });
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

  function renderDashboard() {
    return (
      <>
        <View style={styles.statsGrid}>
          {[
            ['📗', stats.publishedLessons ?? stats.lessons ?? 0, 'Published Lessons'],
            ['🎓', stats.students ?? 0, 'Students'],
            ['📈', `${stats.classProgress ?? 0}%`, 'Class Progress'],
            ['📝', stats.draftLessons ?? 0, 'Draft Lessons'],
          ].map(([icon, value, label]) => (
            <SectionCard key={label} style={styles.statCard}>
              <Text style={styles.statIcon}>{icon}</Text>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.muted}>{label}</Text>
            </SectionCard>
          ))}
        </View>
        <SectionCard>
          <Text style={styles.cardTitle}>Assigned Classes</Text>
          {(dashboard?.assignedClasses || []).map((item) => (
            <View key={item.id} style={styles.softRow}>
              <Text style={styles.rowTitle}>Grade {item.gradeLevel} • {item.section}</Text>
            </View>
          ))}
          {!dashboard?.assignedClasses?.length && <Text style={styles.muted}>No assigned classes yet.</Text>}
        </SectionCard>
        <SectionCard>
          <Text style={styles.cardTitle}>Pending Group Checks</Text>
          {(pendingChecks.rows || []).slice(0, 4).map((row) => (
            <View key={row.id} style={styles.actionRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{row.groupName}</Text>
                <Text style={styles.muted}>{row.taskTitle} • {row.studentName}</Text>
              </View>
              <View style={styles.buttonRow}>
                <SmallButton tone="slate" disabled={Boolean(busy)} onPress={() => run(`return-${row.id}`, () => returnGroupTask(row.groupTaskId, row.studentId, 'Please revise and resubmit this task.'), 'Task returned for revision.')}>Return</SmallButton>
                <SmallButton disabled={Boolean(busy)} onPress={() => run(`approve-${row.id}`, () => approveGroupTask(row.groupTaskId, row.studentId), 'Task approved.')}>Approve</SmallButton>
              </View>
            </View>
          ))}
          {!pendingChecks.rows?.length && <Text style={styles.muted}>No pending checks.</Text>}
        </SectionCard>
      </>
    );
  }

  function renderBuilder() {
    return (
      <>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.builderTabs}>
          {BUILDER_STEPS.map((label, index) => (
            <TouchableOpacity key={label} style={[styles.stepChip, builderStep === index && styles.stepChipActive]} onPress={() => setBuilderStep(index)}>
              <Text style={builderStep === index ? styles.stepTextActive : styles.stepText}>{index + 1}. {label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {builderStep === 0 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Lesson Material</Text>
            <Text style={styles.muted}>Upload a PDF, PPT, or PPTX file for this lesson.</Text>
            {draft.material && (
              <View style={styles.softRow}>
                <Text style={styles.rowTitle}>📎 {draft.material.fileName}</Text>
                <Text style={styles.muted}>{draft.material.fileType} • {Math.round((draft.material.size || 0) / 1024)} KB</Text>
              </View>
            )}
            <SmallButton disabled={busy === 'material'} onPress={pickMaterial}>{busy === 'material' ? 'Uploading...' : 'Choose and Upload File'}</SmallButton>
            <Field label="Teacher Notes" value={draft.instructions} onChangeText={(value) => setDraft((current) => ({ ...current, instructions: value }))} multiline placeholder="Notes and instructions for learners" />
            <SmallButton onPress={() => setBuilderStep(1)}>Continue</SmallButton>
          </SectionCard>
        )}

        {builderStep === 1 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Lesson Details</Text>
            <Text style={styles.fieldLabel}>Grade</Text>
            <View style={styles.choiceRow}>{['1', '2', '3', '4', '5', '6'].map((grade) => <SmallButton key={grade} tone={draft.gradeLevel === grade ? 'green' : 'slate'} onPress={() => setDraft((current) => ({ ...current, gradeLevel: grade }))}>{grade}</SmallButton>)}</View>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.choiceRow}>{SUBJECTS.map((subject) => <SmallButton key={subject} tone={draft.subject === subject ? 'green' : 'slate'} onPress={() => setDraft((current) => ({ ...current, subject }))}>{subject}</SmallButton>)}</View>
            <Field label="Title" value={draft.title} onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))} placeholder="Lesson title" />
            <Field label="Duration" value={draft.duration} onChangeText={(value) => setDraft((current) => ({ ...current, duration: value }))} />
            <Field label="XP Reward" value={draft.xpReward} keyboardType="numeric" onChangeText={(value) => setDraft((current) => ({ ...current, xpReward: value }))} />
            <Field label="Reading Passage" value={draft.passage} onChangeText={(value) => setDraft((current) => ({ ...current, passage: value }))} multiline />
            <SmallButton onPress={() => setBuilderStep(2)}>Continue</SmallButton>
          </SectionCard>
        )}

        {builderStep === 2 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Activities</Text>
            <View style={styles.choiceRow}>{['infographic', 'mcq', 'writing', 'speech'].map((type) => <SmallButton key={type} tone={newActivity.type === type ? 'green' : 'slate'} onPress={() => setNewActivity((current) => ({ ...current, type }))}>{type}</SmallButton>)}</View>
            <Field label="Activity Title" value={newActivity.title} onChangeText={(value) => setNewActivity((current) => ({ ...current, title: value }))} />
            <Field label="Instructions" value={newActivity.instructions} onChangeText={(value) => setNewActivity((current) => ({ ...current, instructions: value }))} multiline />
            {newActivity.type === 'mcq' ? (
              <>
                <Field label="Question" value={newActivity.question} onChangeText={(value) => setNewActivity((current) => ({ ...current, question: value }))} />
                <Field label="Choice A" value={newActivity.optionA} onChangeText={(value) => setNewActivity((current) => ({ ...current, optionA: value }))} />
                <Field label="Choice B" value={newActivity.optionB} onChangeText={(value) => setNewActivity((current) => ({ ...current, optionB: value }))} />
                <Text style={styles.fieldLabel}>Correct Choice</Text>
                <View style={styles.choiceRow}>{['A', 'B'].map((choice) => <SmallButton key={choice} tone={newActivity.correctOption === choice ? 'green' : 'slate'} onPress={() => setNewActivity((current) => ({ ...current, correctOption: choice }))}>{choice}</SmallButton>)}</View>
              </>
            ) : (
              <Field label={newActivity.type === 'writing' ? 'Writing Prompt' : newActivity.type === 'speech' ? 'Speech Target' : 'Content'} value={newActivity.content} onChangeText={(value) => setNewActivity((current) => ({ ...current, content: value }))} multiline />
            )}
            <SmallButton onPress={addActivity}>Add Activity</SmallButton>
            {draft.activities.map((activity, index) => (
              <View key={`${activity.type}-${index}`} style={styles.softRow}>
                <Text style={styles.rowTitle}>{index + 1}. {activity.title}</Text>
                <Text style={styles.muted}>{activity.type}</Text>
              </View>
            ))}
            <SmallButton onPress={() => setBuilderStep(3)}>Preview</SmallButton>
          </SectionCard>
        )}

        {builderStep === 3 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Preview</Text>
            <Text style={styles.previewTitle}>{draft.title || 'Untitled lesson'}</Text>
            <Text style={styles.muted}>Grade {draft.gradeLevel} • {draft.subject} • +{draft.xpReward || 0} XP</Text>
            <Text style={styles.body}>{draft.passage || 'No reading passage added.'}</Text>
            <Text style={styles.rowTitle}>{draft.activities.length} learning activit{draft.activities.length === 1 ? 'y' : 'ies'}</Text>
            <View style={styles.buttonRow}>
              <SmallButton tone="slate" disabled={Boolean(busy)} onPress={() => saveLesson('draft')}>Save Draft</SmallButton>
              <SmallButton disabled={Boolean(busy)} onPress={() => saveLesson('published')}>Publish</SmallButton>
            </View>
          </SectionCard>
        )}

        {builderStep === 4 && (
          <SectionCard>
            <Text style={styles.cardTitle}>My Lessons</Text>
            {lessons.map((lesson) => (
              <View key={lesson.id} style={styles.actionRow}>
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{lesson.title}</Text>
                  <Text style={styles.muted}>Grade {lesson.gradeLevel} • {lesson.subject} • {lesson.status}</Text>
                </View>
                {lesson.status === 'draft' ? <SmallButton disabled={Boolean(busy)} onPress={() => run(`publish-${lesson.id}`, () => updateLesson(lesson.id, { status: 'published' }), 'Lesson published.')}>Publish</SmallButton> : null}
                {lesson.status !== 'archived' ? <SmallButton tone="red" disabled={Boolean(busy)} onPress={() => run(`archive-${lesson.id}`, () => archiveLesson(lesson.id), 'Lesson archived.')}>Archive</SmallButton> : null}
              </View>
            ))}
            {!lessons.length && <Text style={styles.muted}>No lessons created yet.</Text>}
          </SectionCard>
        )}
      </>
    );
  }

  function renderGroups() {
    return (
      <>
        <SectionCard>
          <Text style={styles.cardTitle}>Create Group</Text>
          <Field label="Group Name" value={groupForm.name} onChangeText={(name) => setGroupForm((current) => ({ ...current, name }))} />
          <Field label="Description" value={groupForm.description} onChangeText={(description) => setGroupForm((current) => ({ ...current, description }))} multiline />
          <SmallButton disabled={!groupForm.name.trim() || Boolean(busy)} onPress={async () => {
            const saved = await run('group-create', () => createGroup(groupForm), 'Group created.');
            if (saved) setGroupForm({ name: '', description: '' });
          }}>Create Group</SmallButton>
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Group Manager</Text>
          {groups.map((group) => (
            <TouchableOpacity key={group.id} style={[styles.softRow, Number(selectedGroup?.id) === Number(group.id) && styles.selectedRow]} onPress={() => setSelectedGroupId(group.id)}>
              <Text style={styles.rowTitle}>{group.name}</Text>
              <Text style={styles.muted}>{group.members?.length || 0} members • {group.tasks?.length || 0} tasks</Text>
            </TouchableOpacity>
          ))}
          {!groups.length && <Text style={styles.muted}>No groups created yet.</Text>}
        </SectionCard>

        {selectedGroup && (
          <>
            <SectionCard>
              <Text style={styles.cardTitle}>{selectedGroup.name} Members</Text>
              {(selectedGroup.members || []).map((member) => (
                <Text key={member.id} style={styles.body}>{member.Student?.avatar || '🧒'} {member.Student?.name || 'Student'} • {member.groupRole || 'member'}</Text>
              ))}
              <Text style={styles.fieldLabel}>Add Learner</Text>
              <View style={styles.choiceRow}>{(monitoring.rows || []).map((student) => <SmallButton key={student.id} tone="slate" disabled={Boolean(busy)} onPress={() => run(`member-${student.id}`, () => addGroupMember(selectedGroup.id, student.id), 'Learner added.')}>{student.name}</SmallButton>)}</View>
            </SectionCard>
            <SectionCard>
              <Text style={styles.cardTitle}>Add Task</Text>
              <Field label="Task Title" value={taskForm.title} onChangeText={(title) => setTaskForm((current) => ({ ...current, title }))} />
              <Field label="Description" value={taskForm.description} onChangeText={(description) => setTaskForm((current) => ({ ...current, description }))} multiline />
              <Field label="XP Reward" value={taskForm.xpReward} keyboardType="numeric" onChangeText={(xpReward) => setTaskForm((current) => ({ ...current, xpReward }))} />
              <SmallButton disabled={!taskForm.title.trim() || Boolean(busy)} onPress={async () => {
                const saved = await run('task-create', () => addGroupTask(selectedGroup.id, { ...taskForm, xpReward: Number(taskForm.xpReward || 10) }), 'Task added.');
                if (saved) setTaskForm({ title: '', description: '', xpReward: '10' });
              }}>Add Task</SmallButton>
              {(selectedGroup.tasks || []).map((task) => <View key={task.id} style={styles.softRow}><Text style={styles.rowTitle}>{task.title}</Text><Text style={styles.muted}>+{task.xpReward || 0} XP</Text></View>)}
            </SectionCard>
          </>
        )}
      </>
    );
  }

  function renderAssessment() {
    const summary = quizPerformance.summary || {};
    return (
      <>
        <View style={styles.statsGrid}>
          {[
            ['✅', activityCoverage.filter((lesson) => lesson.quizCount).length, 'Quiz Ready Lessons'],
            ['❓', activityCoverage.reduce((total, lesson) => total + lesson.quizCount, 0), 'Total Questions'],
            ['🎓', monitoring.rows?.length || 0, 'Students to Monitor'],
            ['🎯', '75%', 'Passing Target'],
          ].map(([icon, value, label]) => <SectionCard key={label} style={styles.statCard}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.muted}>{label}</Text></SectionCard>)}
        </View>
        <SectionCard>
          <Text style={styles.cardTitle}>Lesson to Quiz Checklist</Text>
          {activityCoverage.map((lesson) => (
            <View key={lesson.id} style={styles.softRow}>
              <Text style={styles.rowTitle}>{lesson.title}</Text>
              <Text style={styles.muted}>Quiz {lesson.quizCount} • Writing {lesson.writingCount} • Speech {lesson.speechCount}</Text>
              {!lesson.quizCount && <Text style={styles.warning}>Missing quiz evidence</Text>}
            </View>
          ))}
        </SectionCard>
        <SectionCard>
          <Text style={styles.cardTitle}>Student Quiz Attempts</Text>
          <Text style={styles.muted}>{summary.total || 0} quiz records • {summary.averageBest || 0}% average best</Text>
          <View style={styles.choiceRow}>{QUIZ_FILTERS.map((filter) => <SmallButton key={filter} tone={quizFilter === filter ? 'green' : 'slate'} onPress={() => setQuizFilter(filter)}>{filter}</SmallButton>)}</View>
          {quizRows.map((row) => (
            <View key={row.key} style={styles.softRow}>
              <Text style={styles.rowTitle}>{row.studentName} • {row.quizTitle}</Text>
              <Text style={styles.muted}>Attempt 1: {row.attempt1?.percent ?? '—'}% • Attempt 2: {row.attempt2?.percent ?? '—'}%</Text>
              <Text style={styles.statusText}>Best {row.bestPercent}% • {row.status}</Text>
            </View>
          ))}
          {!quizRows.length && <Text style={styles.muted}>No quiz attempts match this filter.</Text>}
        </SectionCard>
      </>
    );
  }

  function renderStudents() {
    return (
      <SectionCard>
        <Text style={styles.cardTitle}>Student Monitoring</Text>
        {(monitoring.rows || []).map((student) => (
          <View key={student.id} style={styles.studentCard}>
            <Text style={styles.studentAvatar}>{student.avatar || '🧒'}</Text>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{student.name}</Text>
              <Text style={styles.muted}>Grade {student.gradeLevel} • {student.section} • {student.xp || 0} XP</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${student.percent || 0}%` }]} /></View>
            </View>
            <Text style={styles.statusText}>{student.percent || 0}%</Text>
          </View>
        ))}
        {!monitoring.rows?.length && <Text style={styles.muted}>No assigned learners yet.</Text>}
      </SectionCard>
    );
  }

  function renderReports() {
    return (
      <>
        <SectionCard>
          <Text style={styles.cardTitle}>Reports</Text>
          <Text style={styles.body}>Generate current teacher reports and share them using your device.</Text>
          <SmallButton disabled={Boolean(busy)} onPress={() => shareReport('Student CSV', getStudentReportCsv)}>Export Student CSV</SmallButton>
          <SmallButton disabled={Boolean(busy)} onPress={() => shareReport('Activity Logs CSV', getActivityLogsCsv)}>Export Activity Logs</SmallButton>
          <SmallButton disabled={Boolean(busy)} onPress={() => shareReport('Tuklas Talino Summary Report', getSummaryReportText)}>Download Summary Report</SmallButton>
        </SectionCard>
        <SectionCard>
          <Text style={styles.cardTitle}>Current Summary</Text>
          <Text style={styles.body}>Students: {reportSummary?.students || 0}</Text>
          <Text style={styles.body}>Published lessons: {reportSummary?.lessons || 0}</Text>
          <Text style={styles.body}>Total XP: {reportSummary?.totalXp || 0}</Text>
          <Text style={styles.body}>Average progress: {reportSummary?.averageProgress || 0}%</Text>
          <Text style={styles.body}>Completions: {reportSummary?.completions || 0}</Text>
        </SectionCard>
      </>
    );
  }

  if (loading && !dashboard) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#16A34A" /><Text style={styles.muted}>Loading teacher workspace...</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.title}>Teacher Workspace</Text>
            <Text style={styles.subtitle}>Teach, monitor, and review learning progress from mobile.</Text>

          </View>
          <SmallButton tone="slate" onPress={confirmLogout}>Logout</SmallButton>
        </View>

        <View style={styles.workspaceHero}>
          <View style={styles.workspaceHeroIcon}>
            <Text style={styles.workspaceHeroEmoji}>📚</Text>
          </View>

          <View style={styles.workspaceHeroCopy}>
            <Text style={styles.workspaceHeroKicker}>Today&apos;s teaching hub</Text>
            <Text style={styles.workspaceHeroTitle}>Guide lessons, groups, and progress in one place.</Text>

            <View style={styles.workspaceHeroChips}>
              <Text style={styles.workspaceHeroChip}>✨ Live class view</Text>
              <Text style={styles.workspaceHeroChip}>✅ Checks ready</Text>
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

        {error ? <SectionCard><Text style={styles.error}>{error}</Text><SmallButton onPress={load}>Try Again</SmallButton></SectionCard> : null}
        {section === 'dashboard' && renderDashboard()}
        {section === 'lessons' && renderBuilder()}
        {section === 'groups' && renderGroups()}
        {section === 'assessment' && renderAssessment()}
        {section === 'students' && renderStudents()}
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
    borderColor: '#DCFCE7',
    shadowColor: '#16A34A',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  workspaceLogoutIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#DCFCE7',
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
    backgroundColor: '#16A34A',
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
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 28,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
    shadowColor: '#16A34A',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  workspaceHeroIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
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
    color: '#15803D',
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
    borderColor: '#BBF7D0',
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },

  safe: { flex: 1, backgroundColor: '#F6FFF5' },
  page: { padding: 16, paddingBottom: 44 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  flex: { flex: 1 },
  title: { color: '#0F172A', fontSize: 29, fontWeight: '900' },
  subtitle: { color: '#64748B', marginTop: 5, lineHeight: 20 },
  navRow: { gap: 8, paddingVertical: 8, paddingBottom: 16 },
  navChip: { flexDirection: 'row', gap: 5, borderRadius: 99, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center' },
  navChipActive: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#22C55E' },
  navLabel: { color: '#64748B', fontWeight: '800' },
  navLabelActive: { color: '#166534' },
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
  statValue: { color: '#166534', fontWeight: '900', fontSize: 28, marginTop: 6 },
  muted: { color: '#64748B', marginTop: 4 },
  body: { color: '#475569', marginTop: 7, lineHeight: 20 },
  softRow: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12, marginTop: 9 },
  selectedRow: { borderWidth: 2, borderColor: '#22C55E' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  rowTitle: { color: '#0F172A', fontWeight: '800' },
  statusText: { color: '#166534', fontWeight: '800', marginTop: 5 },
  warning: { color: '#B45309', fontWeight: '800', marginTop: 5 },
  field: { marginTop: 12 },
  fieldLabel: { color: '#334155', fontWeight: '800', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', backgroundColor: '#FFF' },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  smallButton: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 8 },
  greenButton: { backgroundColor: '#16A34A' },
  slateButton: { backgroundColor: '#64748B' },
  redButton: { backgroundColor: '#DC2626' },
  disabledButton: { opacity: 0.5 },
  smallButtonText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  builderTabs: { gap: 7, paddingBottom: 12 },
  stepChip: { backgroundColor: '#FFF', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  stepChipActive: { backgroundColor: '#DCFCE7' },
  stepText: { color: '#64748B', fontWeight: '800' },
  stepTextActive: { color: '#166534', fontWeight: '900' },
  previewTitle: { color: '#166534', fontSize: 24, fontWeight: '900' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  studentAvatar: { fontSize: 28 },
  progressTrack: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  error: { color: '#B91C1C', fontWeight: '800' },
});
