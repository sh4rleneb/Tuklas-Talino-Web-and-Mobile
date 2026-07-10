import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  downloadPdfReport,
  downloadTextReport,
} from '../../services/reportExport';

import {
  addGroupMember,
  removeGroupMember,
  addGroupTask,
  approveGroupTask,
  archiveLesson,
  createGroup,
  deleteGroup,
  createLesson,
  createStudentAccount,
  getActiveStudents,
  getPendingGroupChecks,
  getReportSummary,
  getStudentReport,
  getSummaryReportCsv,
  getSummaryReportPdf,
  getTeacherDashboard,
  getTeacherGroups,
  getTeacherLessons,
  getTeacherMonitoringStats,
  getTeacherQuizPerformance,
  getTeacherReviews,
  gradeWritingSubmission,
  reviewSpeechAttempt,
  returnGroupTask,
  setGroupLeader,
  updateLesson,
  uploadLessonMaterial,
} from '../../api/teacher';
import { logout } from '../../api/auth';

const NAV_ITEMS = [
  ['dashboard', '🏠', 'Dashboard'],
  ['lessons', '📚', 'Lessons'],
  ['groups', '👥', 'Groups'],
  ['assessment', '🧠', 'Assessment'],
  ['review', '📝', 'Review'],
  ['students', '🎓', 'Students'],
  ['reports', '📊', 'Reports'],
];
const BUILDER_STEPS = ['📎 Lesson Material', '📝 Lesson Details', '🧩 Activities', '👁 Preview', '📚 My Lessons'];
const QUIZ_FILTERS = ['All', 'Needs Support', 'Developing', 'Proficient', 'Advanced'];
const SUBJECT_OPTIONS = [
  { name: 'Pagbasa', icon: '📖' },
  { name: 'Bokabularyo', icon: '🔤' },
  { name: 'Panitikan', icon: '📜' },
  { name: 'Oral Comm', icon: '🎙️' },
  { name: 'Pagsulat', icon: '✍️' },
];
const SUBJECTS = SUBJECT_OPTIONS.map((subject) => subject.name);
const SUBJECT_SELECT_OPTIONS = SUBJECT_OPTIONS.map((subject) => ({
  value: subject.name,
  label: `${subject.icon} ${subject.name}`,
}));
const GRADE_SELECT_OPTIONS = ['1', '2', '3', '4', '5', '6'].map((grade) => ({
  value: grade,
  label: `Grade ${grade}`,
}));
const ACTIVITY_TYPE_OPTIONS = [
  { value: 'mcq', label: 'Quiz' },
  { value: 'writing', label: 'Writing' },
  { value: 'speech', label: 'Speech' },
];
const WRITING_ACTIVITY_TYPE_OPTIONS = [
  { value: 'complete_sentence', label: 'Complete the Sentence' },
  { value: 'writing_task', label: 'Writing Task' },
];
const ACTIVITY_CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];


function normalizeXpRewardInput(value) {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (!digits) return '';

  return String(Math.min(500, Number(digits)));
}

function getXpRewardValue(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 25;

  return Math.min(500, Math.max(1, Math.round(parsed)));
}

function normalizeStudentRows(payload = []) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.students)) return payload.students;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
}

function normalizeSectionName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getStudentStableId(student = {}) {
  return student.id || student.studentId || student.studentCode || `${student.name || 'Student'}-${student.gradeLevel || student.grade || ''}-${student.section || ''}`;
}

function mergeStudentRows(rows = []) {
  const studentMap = new Map();

  rows.forEach((student) => {
    if (!student) return;
    studentMap.set(String(getStudentStableId(student)), student);
  });

  return Array.from(studentMap.values()).sort((first, second) => String(first.name || '').localeCompare(String(second.name || '')));
}

function getStudentGradeValue(student = {}) {
  const grade = Number(student.gradeLevel || student.grade || student.Student?.gradeLevel || student.student?.gradeLevel || 0);

  return [1, 2, 3, 4, 5, 6].includes(grade) ? grade : null;
}

function getStudentSectionValue(student = {}) {
  return normalizeSectionName(student.section || student.sectionName || student.classSection || student.Student?.section || student.student?.section);
}


function emptyLessonDraft() {
  return {
    gradeLevel: '1',
    subject: 'Reading',
    title: '',
    duration: '10 minuto',
    xpReward: '25',
    passage: '',
    layunin: '',
    alamin: '',
    aralin: '',
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


function SelectMenu({ label, value, options = [], onSelect, disabled = false, placeholder = 'Select an option' }) {
  const [visible, setVisible] = useState(false);
  const normalizedOptions = options.map((option) => (
    typeof option === 'string'
      ? { value: option, label: option }
      : { value: String(option.value), label: option.label || String(option.value) }
  ));
  const selected = normalizedOptions.find((option) => String(option.value) === String(value));
  const displayValue = selected?.label || placeholder;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectTrigger, disabled && styles.selectTriggerDisabled]}
        disabled={disabled}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.selectValue}>{displayValue}</Text>
        <Text style={styles.selectChevron}>⌄</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <View style={styles.selectOverlay}>
          <View style={styles.selectSheet}>
            <Text style={styles.selectTitle}>{label}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {normalizedOptions.map((option) => {
                const active = String(option.value) === String(value);

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.selectOption, active && styles.selectOptionActive]}
                    onPress={() => {
                      onSelect(option.value);
                      setVisible(false);
                    }}
                  >
                    <Text style={[styles.selectOptionText, active && styles.selectOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.selectClose} onPress={() => setVisible(false)}>
              <Text style={styles.selectCloseText}>Isara</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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


function cleanTeacherLessonText(value) {
  return String(value ?? '').trim();
}

function splitStructuredLessonPassage(passage = '') {
  const text = String(passage || '');

  const sections = {
    layunin: '',
    alamin: '',
    aralin: ''
  };

  const patterns = [
    ['layunin', /Layunin:\s*([\s\S]*?)(?=\n\s*Alamin:|\n\s*(?:Aralin|Lesson):|$)/i],
    ['alamin', /Alamin:\s*([\s\S]*?)(?=\n\s*(?:Aralin|Lesson):|$)/i],
    ['aralin', /(?:Aralin|Lesson):\s*([\s\S]*)$/i]
  ];

  patterns.forEach(([key, pattern]) => {
    const match = text.match(pattern);
    if (match?.[1]) {
      sections[key] = match[1].trim();
    }
  });

  if (!sections.layunin && !sections.alamin && !sections.aralin) {
    sections.aralin = text.trim();
  }

  return sections;
}

function buildStructuredLessonPassage(draft = {}) {
  const parts = [
    cleanTeacherLessonText(draft.layunin) ? `Layunin:\n${cleanTeacherLessonText(draft.layunin)}` : '',
    cleanTeacherLessonText(draft.alamin) ? `Alamin:\n${cleanTeacherLessonText(draft.alamin)}` : '',
    cleanTeacherLessonText(draft.aralin) ? `Aralin:\n${cleanTeacherLessonText(draft.aralin)}` : ''
  ].filter(Boolean);

  return parts.join('\n\n') || cleanTeacherLessonText(draft.passage);
}


function createDefaultTeacherDeadlineDate() {
  const next = new Date();

  next.setMinutes(next.getMinutes() + 60);
  next.setSeconds(0, 0);

  const remainder = next.getMinutes() % 5;
  if (remainder) {
    next.setMinutes(next.getMinutes() + (5 - remainder));
  }

  return next;
}

function createDefaultTeacherDeadlineValue() {
  return createDefaultTeacherDeadlineDate().toISOString();
}

function normalizeTeacherDeadlineInput(value = '') {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return '';

  return parsed.toISOString();
}

function getActivityDeadlineDate(value = '') {
  const parsed = new Date(value);

  if (!value || Number.isNaN(parsed.getTime())) {
    return createDefaultTeacherDeadlineDate();
  }

  return parsed;
}

function mergeTeacherDeadlineDateTime(currentValue = '', selectedDate = new Date(), mode = 'date') {
  const base = getActivityDeadlineDate(currentValue);
  const selected = new Date(selectedDate);

  if (Number.isNaN(selected.getTime())) {
    return base.toISOString();
  }

  const next = new Date(base);

  if (mode === 'time') {
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
  } else {
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
  }

  return next.toISOString();
}

function formatTeacherDeadlineForDisplay(value = '') {
  const parsed = new Date(value);

  if (!value || Number.isNaN(parsed.getTime())) {
    return 'Select activity date and time';
  }

  return parsed.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTeacherDeadlineValidationMessage(rawDeadline = '', hasDeadline = false) {
  if (!hasDeadline) return '';

  const normalizedDeadline = normalizeTeacherDeadlineInput(rawDeadline);

  if (!normalizedDeadline) {
    return 'Select the activity date and time before adding the activity.';
  }

  const parsedDeadline = new Date(normalizedDeadline);

  if (Number.isNaN(parsedDeadline.getTime())) {
    return 'The deadline is invalid. Select a valid date and time.';
  }

  const now = new Date();

  if (parsedDeadline.getTime() <= now.getTime()) {
    return 'The deadline cannot be in the past. Select a later date and time.';
  }

  return '';
}

function normalizeTeacherMaxAttempts(value = 2) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 2;
  return Math.max(1, Math.min(5, Math.round(parsed)));
}

function getTeacherAttemptOptions() {
  return ['1', '2', '3', '4', '5'];
}

function getTeacherActivityValidationMessage(activity = {}) {
  const type = cleanTeacherLessonText(
    activity.type || activity.gawainType || activity.activityType
  ).toLowerCase();

  const hasAnyText = (...keys) =>
    keys.some((key) => cleanTeacherLessonText(activity[key]));

  const optionTexts = [
    activity.optionA,
    activity.optionB,
    activity.optionC,
    activity.optionD,
    activity.optionE,
    activity.optionF,
    ...(Array.isArray(activity.options)
      ? activity.options.map((option) => option?.text ?? option?.label ?? option?.value ?? option)
      : []),
  ]
    .map(cleanTeacherLessonText)
    .filter(Boolean);

  if (!type) {
    return 'Select an activity type.';
  }

  if (
    type.includes('mcq') ||
    type.includes('quiz') ||
    type.includes('multiple') ||
    type.includes('choice')
  ) {
    if (!hasAnyText('question', 'prompt')) {
      return 'Add a quiz question.';
    }

    if (optionTexts.length < 2) {
      return 'Add at least two answer options.';
    }

    return '';
  }

  if (type.includes('speech') || type.includes('bigkas') || type.includes('read')) {
    if (!hasAnyText('targetText', 'content', 'prompt')) {
      return 'Add the speech text students must read.';
    }

    return '';
  }

  if (type.includes('writing') || type.includes('sulat') || type.includes('essay')) {
    if (!hasAnyText('prompt', 'content', 'question')) {
      return 'Add writing instructions for the student.';
    }

    return '';
  }

  if (type.includes('matching') || type.includes('pair')) {
    const pairs = Array.isArray(activity.pairs) ? activity.pairs : [];
    const validPairs = pairs.filter(
      (pair) => cleanTeacherLessonText(pair?.left) && cleanTeacherLessonText(pair?.right)
    );

    if (pairs.length && validPairs.length < 2) {
      return 'Add at least two complete matching pairs.';
    }

    if (!pairs.length && !hasAnyText('content', 'prompt')) {
      return 'Add matching instructions or matching pairs.';
    }

    return '';
  }

  if (type.includes('vocab') || type.includes('word')) {
    const words = Array.isArray(activity.words) ? activity.words : [];
    const validWords = words.filter(
      (word) => cleanTeacherLessonText(word?.word) && cleanTeacherLessonText(word?.meaning)
    );

    if (words.length && validWords.length < 1) {
      return 'Add at least one vocabulary word with a meaning.';
    }

    if (!words.length && !hasAnyText('content', 'prompt')) {
      return 'Add vocabulary content before saving.';
    }

    return '';
  }

  if (!hasAnyText('title', 'prompt', 'content', 'question', 'targetText')) {
    return 'Add the required activity instructions before saving.';
  }

  return '';
}

function getTeacherLessonBuilderValidationMessage(draft = {}, activities = [], assignedGradeLevels = []) {
  const gradeLevel = Number(draft.gradeLevel ?? draft.grade ?? 0);

  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 6) {
    return 'Select a valid grade level from Grade 1 to Grade 6.';
  }

  const assignedGrades = Array.isArray(assignedGradeLevels)
    ? assignedGradeLevels.map((level) => Number(level)).filter(Boolean)
    : [];

  if (assignedGrades.length && !assignedGrades.includes(gradeLevel)) {
    return 'You can only create lessons for your assigned grade level.';
  }

  if (!cleanTeacherLessonText(draft.title)) {
    return 'Add a lesson title.';
  }

  const xpReward = Number(draft.xpReward ?? draft.xp ?? 25);

  if (!Number.isFinite(xpReward) || xpReward < 1 || xpReward > 500) {
    return 'Enter an XP reward from 1 to 500.';
  }

  const hasUploadedMaterial = Boolean(
    draft.materialFile ||
    draft.material ||
    draft.file ||
    draft.lessonPlanFile ||
    draft.materialName ||
    draft.fileName
  );

  if (
    hasUploadedMaterial &&
    !cleanTeacherLessonText(draft.layunin) &&
    !cleanTeacherLessonText(draft.alamin) &&
    !cleanTeacherLessonText(draft.aralin)
  ) {
    return 'Add a short Objective, Background, or Lesson summary for uploaded material.';
  }

  const activityList = Array.isArray(activities)
    ? activities
    : Array.isArray(draft.activities)
      ? draft.activities
      : [];

  for (const activity of activityList) {
    const activityMessage = getTeacherActivityValidationMessage(activity);
    if (activityMessage) return activityMessage;
  }

  return '';
}




function getTaskDeadlineDate(value) {
  const parts = String(value || '').split('-').map((part) => Number(part));

  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts;
    const parsed = new Date(year, month - 1, day);

    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

function formatTaskDeadlineValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function buildTaskDeadlineOptions(dayCount = 90) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);

    return {
      value: formatTaskDeadlineValue(date),
      day: String(date.getDate()),
      month: date.toLocaleDateString(undefined, { month: 'short' }),
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    };
  });
}



function getTeacherSpeechTargetText(item = {}) {
  if (typeof item === 'string') {
    return cleanTeacherLessonText(item);
  }

  if (!item || typeof item !== 'object') {
    return '';
  }

  const speechTask = item.speechTask || item.speech_task || {};

  return cleanTeacherLessonText(
    item.targetText ||
    item.speechTarget ||
    item.speech_target ||
    speechTask.targetText ||
    speechTask.text ||
    item.content ||
    item.prompt ||
    item.instructions ||
    ''
  );
}


function getTeacherLessonSpeechFallback(draft = {}, editingLesson = {}) {
  const draftActivities = Array.isArray(draft.activities) ? draft.activities : [];
  const editingActivities = Array.isArray(editingLesson.activities) ? editingLesson.activities : [];

  return cleanTeacherLessonText(
    draft.speechTarget ||
    draft.speech_target ||
    getTeacherSpeechTargetText(draftActivities.find((activity) => activity?.type === 'speech')) ||
    getTeacherSpeechTargetText(editingActivities.find((activity) => activity?.type === 'speech')) ||
    editingLesson.speechTarget ||
    editingLesson.speech_target ||
    editingLesson.targetText ||
    getTeacherSpeechTargetText(editingLesson.speechTask || editingLesson.speech_task) ||
    ''
  );
}


function getPickedLessonMaterialAsset(result = {}) {
  if (!result || result.canceled || result.cancelled) return null;
  if (Array.isArray(result.assets) && result.assets.length) return result.assets[0];
  if (result.uri) return result;
  return null;
}

function getLessonMaterialMimeType(asset = {}) {
  const rawName = String(asset.name || asset.fileName || asset.uri || '').toLowerCase();

  return asset.mimeType ||
    asset.type ||
    (rawName.endsWith('.pdf')
      ? 'application/pdf'
      : rawName.endsWith('.pptx')
      ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      : rawName.endsWith('.ppt')
      ? 'application/vnd.ms-powerpoint'
      : '');
}

function getLessonMaterialDisplayName(asset = {}) {
  return asset.name || asset.fileName || String(asset.uri || '').split('/').pop() || 'lesson-material';
}

function isSupportedLessonMaterial(asset = {}) {
  const name = getLessonMaterialDisplayName(asset).toLowerCase();
  const type = getLessonMaterialMimeType(asset).toLowerCase();

  return (
    name.endsWith('.pdf') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx') ||
    type.includes('pdf') ||
    type.includes('powerpoint') ||
    type.includes('presentation')
  );
}

function normalizeUploadedLessonMaterial(response = {}, asset = {}) {
  const material =
    response.material ||
    response.lessonMaterial ||
    response.file ||
    response.upload ||
    response.data ||
    response;

  const fileName =
    material.fileName ||
    material.name ||
    material.originalName ||
    material.originalname ||
    getLessonMaterialDisplayName(asset);

  const fileType =
    material.fileType ||
    material.mimeType ||
    material.mimetype ||
    getLessonMaterialMimeType(asset) ||
    'application/octet-stream';

  return {
    ...material,
    fileName,
    name: material.name || fileName,
    fileType,
    mimeType: material.mimeType || fileType,
    size: material.size || asset.size || 0,
    uri: material.uri || material.url || material.fileUrl || asset.uri,
  };
}

function lessonMaterialUploadErrorMessage(error = {}) {
  const message = String(
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    ''
  ).trim();

  if (!message || message === 'Request failed') {
    return 'The lesson material could not be uploaded. Make sure the file is a PDF, PPT, or PPTX, then try again.';
  }

  return message;
}

function formatActivityDeadlineValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTeacherActiveGroupRows(groupData = {}) {
  const rows = Array.isArray(groupData)
    ? groupData
    : Array.isArray(groupData.groups)
    ? groupData.groups
    : [];

  return rows.filter((group) => group?.status !== 'archived' && group?.status !== 'deleted');
}

function getPendingGroupCheckRows(payload = {}) {
  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload.rows)
    ? payload.rows
    : Array.isArray(payload.pending)
    ? payload.pending
    : Array.isArray(payload.data)
    ? payload.data
    : [];
}

function getPendingGroupCheckGroupId(row = {}) {
  const candidates = [
    row.groupId,
    row.GroupId,
    row.group_id,
    row.group?.id,
    row.Group?.id,
    row.task?.groupId,
    row.task?.GroupId,
    row.Task?.groupId,
    row.Task?.GroupId,
    row.groupTask?.groupId,
    row.groupTask?.GroupId,
    row.GroupTask?.groupId,
    row.GroupTask?.GroupId,
  ];

  const found = candidates
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0);

  return found || null;
}

function getPendingGroupCheckGroupName(row = {}) {
  return cleanTeacherLessonText(
    row.groupName ||
    row.group?.name ||
    row.Group?.name ||
    row.task?.groupName ||
    row.task?.group?.name ||
    row.Task?.groupName ||
    row.Task?.Group?.name ||
    ''
  ).toLowerCase();
}

function buildPendingGroupChecksPayload(source = {}, rows = []) {
  const base = Array.isArray(source) ? {} : source || {};

  return {
    ...base,
    rows,
    summary: {
      ...(base.summary || {}),
      total: rows.length,
      pending: rows.length,
      count: rows.length,
    },
  };
}

function filterPendingGroupChecksForActiveGroups(pending = {}, activeGroups = []) {
  const activeIds = new Set(
    activeGroups
      .map((group) => Number(group.id))
      .filter((value) => Number.isFinite(value) && value > 0)
  );

  const activeNames = new Set(
    activeGroups
      .map((group) => cleanTeacherLessonText(group.name).toLowerCase())
      .filter(Boolean)
  );

  const rows = getPendingGroupCheckRows(pending).filter((row) => {
    const groupId = getPendingGroupCheckGroupId(row);
    const groupName = getPendingGroupCheckGroupName(row);

    if (groupId) {
      return activeIds.has(Number(groupId));
    }

    if (groupName) {
      return activeNames.has(groupName);
    }

    return true;
  });

  return buildPendingGroupChecksPayload(pending, rows);
}

function removeGroupFromPendingChecksState(pending = {}, deletedGroup = {}) {
  const deletedId = Number(deletedGroup.id);
  const deletedName = cleanTeacherLessonText(deletedGroup.name).toLowerCase();

  const rows = getPendingGroupCheckRows(pending).filter((row) => {
    const groupId = getPendingGroupCheckGroupId(row);
    const groupName = getPendingGroupCheckGroupName(row);

    if (Number.isFinite(deletedId) && deletedId > 0 && Number(groupId) === deletedId) {
      return false;
    }

    if (deletedName && groupName === deletedName) {
      return false;
    }

    return true;
  });

  return buildPendingGroupChecksPayload(pending, rows);
}


function isPasswordChangeRequiredError(error = {}) {
  const message = String(
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    ''
  ).toLowerCase();

  return (
    message.includes('password change required') ||
    message.includes('must change password') ||
    message.includes('change your password')
  );
}

function routeTeacherToPasswordChange(navigation) {
  if (!navigation?.replace) return;

  navigation.replace('ChangePassword', {
    homeRoute: 'TeacherHome',
  });
}

export default function TeacherHome({ navigation }) {
  const insets = useSafeAreaInsets();
  const keyboardVerticalOffset = Platform.OS === 'ios' ? Math.max(insets.top - 6, 0) : 0;
  const [section, setSection] = useState('dashboard');
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [monitoring, setMonitoring] = useState({ rows: [] });
  const [allStudents, setAllStudents] = useState([]);
  const [quizPerformance, setQuizPerformance] = useState({ summary: {}, rows: [] });
  const [workspaceNotice, setWorkspaceNotice] = useState(null);
  const [pendingChecks, setPendingChecks] = useState({ summary: {}, rows: [] });
  const [reviewQueue, setReviewQueue] = useState({ summary: {}, writing: [], speech: [] });
  const [selectedReviewStudentKey, setSelectedReviewStudentKey] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [showAllSpeechAttempts, setShowAllSpeechAttempts] = useState(false);
  const [reviewGradeFilter, setReviewGradeFilter] = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [groups, setGroups] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [reportSummary, setReportSummary] = useState(null);
  const [studentReport, setStudentReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [reportBusy, setReportBusy] = useState('');
  const [error, setError] = useState('');
  const [builderStep, setBuilderStep] = useState(0);
  const [editingLesson, setEditingLesson] = useState(null);
  const [draft, setDraft] = useState(emptyLessonDraft);
  const [activityDeadlinePickerVisible, setActivityDeadlinePickerVisible] = useState(false);
  const [activityDeadlinePickerMode, setActivityDeadlinePickerMode] = useState('date');
  const [newActivity, setNewActivity] = useState({
    type: 'mcq',
      gawainType: 'writing_task',
    title: '',
    deadline: '',
    hasDeadline: false,
    maxAttempts: '2',
    editingActivityIndex: null,
    instructions: '',
    content: '',
    question: '',
    optionA: '',
    optionB: '',
    correctOption: 'A',
    choiceCount: 2,
    optionC: '',
    optionD: '',
    optionE: '',
    optionF: '',
  });
  const [groupForm, setGroupForm] = useState({ name: '', description: '', section: '', gradeLevel: '1' });
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [openGroupTools, setOpenGroupTools] = useState({});
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', xpReward: '10' });
  const [taskDeadlinePickerVisible, setTaskDeadlinePickerVisible] = useState(false);
  const [studentForm, setStudentForm] = useState({ name: '', gradeLevel: '1', section: '' });
  const [createdStudentAccount, setCreatedStudentAccount] = useState(null);
  const [quizFilter, setQuizFilter] = useState('All');
  const [assessmentQuery, setAssessmentQuery] = useState('');
  const [selectedAssessmentQuizId, setSelectedAssessmentQuizId] = useState('ALL');
  const [showAllAssessmentRows, setShowAllAssessmentRows] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dash, monitor, quiz, pending, groupData, lessonData, summary, reviews, activeStudentsData, students] = await Promise.all([
        getTeacherDashboard(),
        getTeacherMonitoringStats(),
        getTeacherQuizPerformance(),
        getPendingGroupChecks(),
        getTeacherGroups(),
        getTeacherLessons(),
        getReportSummary(),
        getTeacherReviews(),
        getActiveStudents(),
        getStudentReport(),
      ]);
      setDashboard(dash);
      setMonitoring(monitor);
      setAllStudents(normalizeStudentRows(activeStudentsData));
      setQuizPerformance(quiz);
      const activeGroups = getTeacherActiveGroupRows(groupData);
      setPendingChecks(filterPendingGroupChecksForActiveGroups(pending, activeGroups));
      setGroups(activeGroups);
      setLessons(lessonData.lessons || []);
      setReportSummary(summary);
      setReviewQueue(reviews || { summary: {}, writing: [], speech: [] });
      setStudentReport(students || []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.data?.message ||
        err?.message ||
        'Hindi ma-load ang teacher workspace.';

      if (isPasswordChangeRequiredError(err)) {
        const notice = 'Kailangan munang palitan ang temporary PIN/password bago buksan ang teacher dashboard.';
        setError(notice);
        setWorkspaceNotice({ type: 'warning', text: notice });
        routeTeacherToPasswordChange(navigation);
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [navigation]);


  const refreshPendingGroupChecksRealtime = useCallback(async () => {
    try {
      const [pending, groupData] = await Promise.all([
        getPendingGroupChecks(),
        getTeacherGroups(),
      ]);

      const activeGroups = getTeacherActiveGroupRows(groupData);
      setGroups(activeGroups);
      setPendingChecks(filterPendingGroupChecksForActiveGroups(pending, activeGroups));
    } catch (err) {
      if (isPasswordChangeRequiredError(err)) {
        routeTeacherToPasswordChange(navigation);
        return;
      }

      console.warn('[TeacherHome] Pending group checks refresh failed:', err?.message || err);
    }
  }, [navigation]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));


  useEffect(() => {
    const timer = setInterval(() => {
      refreshPendingGroupChecksRealtime();
    }, 10000);

    return () => clearInterval(timer);
  }, [refreshPendingGroupChecksRealtime]);

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

  const assignedClassRules = useMemo(() => {
    const rules = [];

    function addRule(item = {}) {
      const gradeLevel = Number(item.gradeLevel || item.grade || item.yearLevel || 0);
      const section = normalizeSectionName(item.section || item.sectionName || item.classSection || item.name);

      if ([1, 2, 3, 4, 5, 6].includes(gradeLevel) || section) {
        rules.push({
          gradeLevel: [1, 2, 3, 4, 5, 6].includes(gradeLevel) ? gradeLevel : null,
          section,
        });
      }
    }

    (dashboard?.assignedClasses || []).forEach(addRule);
    (monitoring?.assignedClasses || []).forEach(addRule);
    (dashboard?.classes || []).forEach(addRule);

    return rules;
  }, [dashboard, monitoring?.assignedClasses]);

  const assignedGradeOptions = useMemo(() => {
    const assignedGrades = Array.from(new Set(assignedClassRules.map((rule) => rule.gradeLevel).filter(Boolean)));

    return GRADE_SELECT_OPTIONS.filter((option) => assignedGrades.includes(Number(option.value)));
  }, [assignedClassRules]);

  const usableGradeOptions = assignedGradeOptions.length ? assignedGradeOptions : GRADE_SELECT_OPTIONS;
  const lessonGradeOptions = usableGradeOptions;

  const currentStudents = useMemo(() => mergeStudentRows([
    ...normalizeStudentRows(allStudents),
    ...normalizeStudentRows(studentReport),
    ...normalizeStudentRows(monitoring.rows),
  ]), [allStudents, monitoring.rows, studentReport]);

  const canUseGradeSection = useCallback((gradeLevel, section) => {
    if (!assignedClassRules.length) return true;

    const grade = Number(gradeLevel);
    const normalizedSection = normalizeSectionName(section);

    return assignedClassRules.some((rule) => {
      if (rule.gradeLevel && grade !== rule.gradeLevel) return false;
      if (rule.section && normalizedSection !== rule.section) return false;

      return true;
    });
  }, [assignedClassRules]);

  const usableStudents = useMemo(() => currentStudents.filter((student) => (
    canUseGradeSection(getStudentGradeValue(student), getStudentSectionValue(student))
  )), [canUseGradeSection, currentStudents]);

  const studentSectionOptions = useMemo(() => {
    const sections = new Set();

    function addSection(value) {
      const section = normalizeSectionName(value);

      if (section) {
        sections.add(section);
      }
    }

    if (assignedClassRules.length) {
      assignedClassRules.forEach((rule) => addSection(rule.section));
    } else {
      currentStudents.forEach((student) => addSection(getStudentSectionValue(student)));

      groups.forEach((group) => {
        addSection(group.section);
        addSection(group.sectionName);
        addSection(group.classSection);
        addSection(group.description);
      });
    }

    return Array.from(sections)
      .sort((first, second) => first.localeCompare(second))
      .map((section) => ({ value: section, label: section }));
  }, [assignedClassRules, currentStudents, groups]);

  const groupSectionOptions = useMemo(() => {
    const selectedGrade = Number(groupForm.gradeLevel || 0);
    const sections = new Set();

    function addSection(value) {
      const section = normalizeSectionName(value);

      if (section) {
        sections.add(section);
      }
    }

    if (assignedClassRules.length) {
      assignedClassRules.forEach((rule) => {
        const ruleGrade = Number(rule.gradeLevel || 0);

        if (!selectedGrade || !ruleGrade || ruleGrade === selectedGrade) {
          addSection(rule.section);
        }
      });
    }

    currentStudents.forEach((student) => {
      const studentGrade = Number(getStudentGradeValue(student) || 0);

      if (!selectedGrade || !studentGrade || studentGrade === selectedGrade) {
        addSection(getStudentSectionValue(student));
      }
    });

    groups.forEach((group) => {
      const groupGrade = Number(group.gradeLevel || group.grade || group.classGradeLevel || 0);

      if (!selectedGrade || !groupGrade || groupGrade === selectedGrade) {
        addSection(group.section);
        addSection(group.sectionName);
        addSection(group.classSection);
        addSection(group.description);
      }
    });

    const options = Array.from(sections)
      .sort((first, second) => first.localeCompare(second))
      .map((section) => ({ value: section, label: section }));

    return options.length ? options : studentSectionOptions;
  }, [assignedClassRules, currentStudents, groupForm.gradeLevel, groups, studentSectionOptions]);

  const stats = dashboard?.stats || {};

  async function run(action, work, success) {
    setBusy(action);
    try {
      const data = await work();
      if (success) setWorkspaceNotice({ type: 'success', text: typeof success === 'function' ? success(data) : success });
      await load();
      return data;
    } catch (err) {
      setWorkspaceNotice({ type: 'error', text: err.message || 'Hindi naisave. Pakisubukan muli.' });
      return null;
    } finally {
      setBusy('');
    }
  }


  function confirmLogout() {
    setLogoutVisible(true);
  }


  async function runTeacherReportExport(type, action) {
    if (reportBusy) return;

    setReportBusy(type);

    try {
      await action();
    } catch (err) {
      Alert.alert(
        'Hindi Na-export ang Report',
        err?.message || 'Hindi maihanda ang monitoring report.'
      );
    } finally {
      setReportBusy('');
    }
  }

async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  }

  async function pickMaterial() {
    if (busy === 'material') return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });

      const asset = getPickedLessonMaterialAsset(result);

      if (!asset) return;

      if (!asset.uri) {
        Alert.alert('Lesson Material', 'The selected file could not be read. Select another PDF, PPT, or PPTX file.');
        return;
      }

      if (!isSupportedLessonMaterial(asset)) {
        Alert.alert('Lesson Material', 'Only PDF, PPT, and PPTX files can be uploaded.');
        return;
      }

      setBusy('material');

      const uploaded = await uploadLessonMaterial(asset);
      const material = normalizeUploadedLessonMaterial(uploaded, asset);

      setDraft((current) => ({
        ...current,
        material,
      }));

      setWorkspaceNotice({
        type: 'success',
        text: `Lesson material uploaded: ${material.fileName || getLessonMaterialDisplayName(asset)}`,
      });
    } catch (err) {
      Alert.alert('Lesson Material', lessonMaterialUploadErrorMessage(err));
    } finally {
      setBusy('');
    }
  }


  function normalizeActivityBuilderType(activityOrType = {}) {
    const raw = typeof activityOrType === 'string'
      ? activityOrType
      : activityOrType?.type || activityOrType?.activityType || activityOrType?.gawainType || '';

    const type = String(raw || '').toLowerCase();

    if (type === 'quiz' || type === 'choice' || type === 'multiple_choice') return 'mcq';
    if (type.includes('writing') || type.includes('sentence')) return 'writing';
    if (type.includes('speech') || type.includes('read')) return 'speech';

    return type || 'mcq';
  }

  function getActivityBuilderDeadlineState(activity = {}) {
    const deadline = activity.deadline || activity.dueAt || activity.dueDate || '';

    return {
      deadline: deadline || '',
      hasDeadline: Boolean(deadline),
    };
  }

  function getActivityBuilderOptionText(option = {}) {
    if (typeof option === 'string') {
      return option;
    }

    return String(option.text || option.label || option.value || option.title || '').trim();
  }

  function hydrateActivityBuilderFromExisting(activity = {}, index = null, current = {}) {
    const type = normalizeActivityBuilderType(activity);
    const deadlineState = getActivityBuilderDeadlineState(activity);
    const editingIndex = Number.isInteger(index) ? index : null;

    const base = {
      ...current,
      type,
      editingActivityIndex: editingIndex,
      title: activity.title || current.title || '',
      instructions: type === 'speech' ? '' : activity.instructions || current.instructions || '',
      deadline: deadlineState.deadline,
      hasDeadline: deadlineState.hasDeadline,
      maxAttempts: String(activity.maxAttempts ?? activity.max_attempts ?? activity.attemptLimit ?? activity.attemptsAllowed ?? current.maxAttempts ?? '2'),
    };

    if (type === 'mcq') {
      const firstQuestion = Array.isArray(activity.questions) && activity.questions.length
        ? activity.questions[0]
        : activity;

      const options = Array.isArray(firstQuestion.options)
        ? firstQuestion.options
        : Array.isArray(activity.options)
        ? activity.options
        : [];

      const next = {
        ...base,
        question: firstQuestion.question || firstQuestion.prompt || activity.question || '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: '',
        optionF: '',
        correctOption: activity.correctOption || firstQuestion.correctOption || 'A',
        choiceCount: Math.min(ACTIVITY_CHOICE_KEYS.length, Math.max(2, options.length || Number(current.choiceCount || 2))),
      };

      ACTIVITY_CHOICE_KEYS.forEach((choice) => {
        const fieldValue = activity[`option${choice}`] || firstQuestion[`option${choice}`] || '';
        if (fieldValue) {
          next[`option${choice}`] = fieldValue;
        }
      });

      options.slice(0, ACTIVITY_CHOICE_KEYS.length).forEach((option, optionIndex) => {
        const choice = ACTIVITY_CHOICE_KEYS[optionIndex];
        const optionText = getActivityBuilderOptionText(option);

        next[`option${choice}`] = optionText;

        if (
          typeof option === 'object' &&
          Boolean(option.isCorrect || option.correct)
        ) {
          next.correctOption = choice;
        }
      });

      next.choiceCount = Math.min(
        ACTIVITY_CHOICE_KEYS.length,
        Math.max(
          2,
          ACTIVITY_CHOICE_KEYS.filter((choice) => String(next[`option${choice}`] || '').trim()).length || next.choiceCount
        )
      );

      if (!ACTIVITY_CHOICE_KEYS.slice(0, next.choiceCount).includes(next.correctOption)) {
        next.correctOption = 'A';
      }

      return next;
    }

    if (type === 'writing') {
      return {
        ...base,
        gawainType: activity.gawainType || current.gawainType || 'writing_task',
        content: activity.prompt || activity.content || activity.targetText || current.content || '',
      };
    }

    if (type === 'speech') {
      return {
        ...base,
        instructions: '',
        content: getTeacherSpeechTargetText(activity) || activity.targetText || activity.content || current.content || '',
      };
    }

    return {
      ...base,
      content: activity.content || activity.prompt || current.content || '',
    };
  }

  function handleSelectActivityType(type) {
    const normalizedType = normalizeActivityBuilderType(type);
    const activities = Array.isArray(draft.activities) ? draft.activities : [];
    const existingIndex = activities.findIndex((activity) => normalizeActivityBuilderType(activity) === normalizedType);

    if (existingIndex >= 0) {
      setNewActivity((current) => hydrateActivityBuilderFromExisting(activities[existingIndex], existingIndex, current));
      return;
    }

    setNewActivity((current) => ({
      ...current,
      type: normalizedType,
      editingActivityIndex: null,
    }));
  }

  function addActivity() {
    const type = newActivity.type;
    const activityValidationMessage = getTeacherActivityValidationMessage(newActivity);
    if (activityValidationMessage) {
      return Alert.alert('Activity Builder', activityValidationMessage);
    }

    const title = newActivity.title.trim() || {
      infographic: 'Lesson Infographic',
      writing: 'Writing Activity',
      speech: 'Pagsasanay sa Pagbigkas',
      mcq: 'Multiple-Choice Quiz',
    }[type];
    let activity;
    const deadlineValidationMessage = getTeacherDeadlineValidationMessage(newActivity.deadline, newActivity.hasDeadline);
    if (deadlineValidationMessage) {
      setWorkspaceNotice({ type: 'warning', text: deadlineValidationMessage });
      return;
    }

    const activityDeadlineValue = newActivity.hasDeadline
      ? normalizeTeacherDeadlineInput(newActivity.deadline)
      : null;

    const activityMaxAttempts = normalizeTeacherMaxAttempts(newActivity.maxAttempts);


    if (type === 'mcq') {
      const choiceCount = Math.min(
        ACTIVITY_CHOICE_KEYS.length,
        Math.max(2, Number(newActivity.choiceCount || 2))
      );
      const activeChoiceKeys = ACTIVITY_CHOICE_KEYS.slice(0, choiceCount);
      const quizOptions = activeChoiceKeys
        .map((choice) => ({
          choice,
          text: String(newActivity[`option${choice}`] || '').trim(),
        }))
        .filter((option) => option.text);

      if (!newActivity.question.trim() || quizOptions.length < 2) {
        setWorkspaceNotice({ type: 'warning', text: 'Maglagay ng tanong at kahit dalawang pagpipilian.' });
        return;
      }

      if (!quizOptions.some((option) => option.choice === newActivity.correctOption)) {
        setWorkspaceNotice({ type: 'warning', text: 'Select the correct answer from the provided choices.' });
        return;
      }

      activity = {
        type,
        title,
        instructions: newActivity.instructions,
        deadline: activityDeadlineValue, dueAt: activityDeadlineValue, maxAttempts: activityMaxAttempts,
        questions: [{
          question: newActivity.question,
          options: quizOptions.map((option) => ({
            text: option.text,
            isCorrect: newActivity.correctOption === option.choice,
          })),
        }],
      };
    } else if (type === 'writing') {
      if (!newActivity.content.trim()) {
        setWorkspaceNotice({ type: 'warning', text: 'Add a writing activity first.' });
        return;
      }
      activity = { type, title, instructions: newActivity.instructions, prompt: newActivity.content, gawainType: newActivity.gawainType || 'writing_task', deadline: activityDeadlineValue, dueAt: activityDeadlineValue, maxAttempts: activityMaxAttempts };
    } else if (type === 'speech') {
      if (!newActivity.content.trim()) {
        setWorkspaceNotice({ type: 'warning', text: 'Ilagay ang eksaktong salitang bibigkasin ng mag-aaral.' });
        return;
      }
      activity = { type, title, instructions: '', targetText: newActivity.content, content: newActivity.content, contentSafetyContext: 'speech_target', allowTeacherSpeechTarget: true, deadline: activityDeadlineValue, dueAt: activityDeadlineValue, maxAttempts: activityMaxAttempts };
    } else {
      if (!newActivity.content.trim()) {
        setWorkspaceNotice({ type: 'warning', text: 'Add lesson infographic content first.' });
        return;
      }
      activity = { type: 'infographic', title, instructions: newActivity.instructions, content: newActivity.content, deadline: activityDeadlineValue, dueAt: activityDeadlineValue, maxAttempts: activityMaxAttempts };
    }

    setDraft((current) => {
      const currentActivities = Array.isArray(current.activities) ? current.activities : [];
      const editingActivityIndex =
        typeof newActivity.editingActivityIndex === 'number'
          ? newActivity.editingActivityIndex
          : -1;

      if (editingActivityIndex >= 0 && editingActivityIndex < currentActivities.length) {
        const nextActivities = [...currentActivities];

        nextActivities[editingActivityIndex] = {
          ...nextActivities[editingActivityIndex],
          ...activity,
        };

        return {
          ...current,
          speechTarget: type === 'speech'
            ? getTeacherSpeechTargetText(activity) || current.speechTarget || ''
            : current.speechTarget,
          activities: nextActivities,
        };
      }

      if (type === 'speech') {
        const existingSpeechIndex = currentActivities.findIndex((item) => item?.type === 'speech');
        const nextActivities = [...currentActivities];

        if (existingSpeechIndex >= 0) {
          nextActivities[existingSpeechIndex] = {
            ...nextActivities[existingSpeechIndex],
            ...activity,
          };
        } else {
          nextActivities.push(activity);
        }

        return {
          ...current,
          speechTarget: getTeacherSpeechTargetText(activity) || current.speechTarget || '',
          activities: nextActivities,
        };
      }

      return {
        ...current,
        activities: [...currentActivities, activity],
      };
    });
    setNewActivity({
      type: 'mcq',
      gawainType: 'writing_task',
      title: '',
      deadline: '',
      hasDeadline: false,
    maxAttempts: '2',
      editingActivityIndex: null,
      instructions: '',
      content: '',
      question: '',
      optionA: '',
      optionB: '',
      correctOption: 'A',
      choiceCount: 2,
      optionC: '',
      optionD: '',
      optionE: '',
      optionF: '',
    });
  }

  function normalizeLessonForEditing(lesson = {}) {
    const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
    const materialActivity = activities.find((activity) => activity.type === 'material') || null;
    const editableActivities = activities.filter((activity) => activity.type !== 'material');
    const legacySpeechTarget = getTeacherSpeechTargetText({
      targetText: lesson.speechTarget || lesson.speech_target || lesson.targetText,
      speechTask: lesson.speechTask || lesson.speech_task,
    });
    const hasSpeechActivity = editableActivities.some(
      (activity) => activity?.type === 'speech' && getTeacherSpeechTargetText(activity)
    );
    const normalizedEditableActivities =
      hasSpeechActivity
        ? editableActivities.map((activity) => {
            if (activity?.type !== 'speech') {
              return activity;
            }

            const target = getTeacherSpeechTargetText(activity) || legacySpeechTarget;

            return {
              ...activity,
              targetText: target,
              content: target,
              instructions: '',
              contentSafetyContext: 'speech_target',
              allowTeacherSpeechTarget: true,
            };
          })
        : legacySpeechTarget
        ? [
            ...editableActivities,
            {
              type: 'speech',
              title: 'Pagsasanay sa Pagbigkas',
              instructions: '',
              targetText: legacySpeechTarget,
              content: legacySpeechTarget,
            },
          ]
        : editableActivities;

    return {
      gradeLevel: String(lesson.gradeLevel || '1'),
      subject: lesson.subject || 'Reading',
      title: lesson.title || '',
      duration: lesson.duration || '10 minuto',
      xpReward: String(lesson.xpReward || 25),
      passage: lesson.passage || '',
      ...splitStructuredLessonPassage(lesson.passage || ''),
      instructions: lesson.instructions || materialActivity?.instructions || '',
      speechTarget: legacySpeechTarget || lesson.speechTarget || '',
      material: materialActivity
        ? {
            fileName: materialActivity.fileName || materialActivity.name || 'Lesson Material',
            fileType: materialActivity.fileType || materialActivity.mimeType || '',
            size: materialActivity.size || 0,
            url: materialActivity.url || materialActivity.fileUrl || materialActivity.materialUrl || '',
            ...materialActivity,
          }
        : null,
      activities: normalizedEditableActivities,
    };
  }


  function getLessonActivities(lesson = {}) {
    return Array.isArray(lesson.activities) ? lesson.activities : [];
  }

  function getLessonMaterialLabel(lesson = {}) {
    const material = getLessonActivities(lesson).find((activity) => activity?.type === 'material');

    if (!material) return 'No material';

    return material.fileName || material.name || material.title || 'Attached material';
  }

  function getLessonQuizItemCount(lesson = {}) {
    return getLessonActivities(lesson)
      .filter((activity) => activity?.type === 'mcq')
      .reduce((total, activity) => {
        if (Array.isArray(activity.questions)) return total + activity.questions.length;
        if (activity.question || Array.isArray(activity.options)) return total + 1;
        return total;
      }, 0);
  }

  function getTeacherLessonActivityTypeLabel(activity = {}) {
    const type = cleanTeacherLessonText(
      activity.type ||
      activity.activityType ||
      activity.gawainType ||
      ''
    ).toLowerCase();

    if (type === 'mcq' || type.includes('quiz') || type.includes('choice')) {
      return 'Quiz';
    }

    if (type === 'writing' || type.includes('writing') || type.includes('sentence')) {
      return 'Writing';
    }

    if (type === 'speech' || type.includes('speech') || type.includes('read')) {
      return 'Speech';
    }

    if (type === 'material') {
      return 'Material';
    }

    if (type === 'infographic' || type.includes('info')) {
      return 'Info';
    }

    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Activity';
  }

  function getTeacherLessonActivityTypeSummary(lesson = {}) {
    const activities = getLessonActivities(lesson)
      .filter((activity) => activity?.type !== 'material');

    if (!activities.length) {
      return 'No activity yet';
    }

    const counts = activities.reduce((acc, activity) => {
      const label = getTeacherLessonActivityTypeLabel(activity);
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([label, count]) => count > 1 ? `${label} (${count})` : label)
      .join(' • ');
  }


  function formatTeacherLessonDate(value) {
    if (!value) return 'No date';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'No date';

    return date.toLocaleDateString();
  }

  function editLessonDraft(lesson) {
    setEditingLesson(lesson);
    setDraft(normalizeLessonForEditing(lesson));
    setBuilderStep(0);
    setWorkspaceNotice({
      type: 'success',
      text: `Editing ${lesson.status === 'published' ? 'published lesson' : 'draft'}: ${lesson.title || 'Untitled Lesson'}`,
    });
  }

  function resetLessonBuilder() {
    setEditingLesson(null);
    setDraft(emptyLessonDraft());
    setBuilderStep(0);
  }

  async function saveLesson(status) {
    const derivedAssignedGrades = [
      ...new Set([
        ...(Array.isArray(dashboard?.assignedClasses)
          ? dashboard.assignedClasses.map((item) => Number(item.gradeLevel || item.grade || 0))
          : []),
        ...groups.map((group) => Number(group.gradeLevel || group.grade || 0)),
        ...groups.flatMap((group) =>
          Array.isArray(group.members)
            ? group.members.map((member) =>
                Number(
                  member?.gradeLevel ||
                    member?.Student?.gradeLevel ||
                    member?.student?.gradeLevel ||
                    0
                )
              )
            : []
        ),
        ...studentReport.map((student) => Number(student.gradeLevel || student.grade || 0)),
      ].filter(Boolean)),
    ];

    const validationActivities = Array.isArray(draft.activities) ? draft.activities : [];
    const validationQuizItems = validationActivities
      .filter((activity) => {
        const type = String(activity?.type || activity?.activityType || '').toLowerCase();
        return type === 'mcq' || type === 'quiz' || type.includes('quiz');
      })
      .flatMap((activity) => {
        if (Array.isArray(activity.questions) && activity.questions.length) {
          return activity.questions.map((question) => ({
            ...question,
            question: question.question || question.prompt || '',
            options: Array.isArray(question.options) ? question.options : [],
          }));
        }

        if (activity.question || Array.isArray(activity.options)) {
          return [{
            question: activity.question || activity.prompt || '',
            options: Array.isArray(activity.options) ? activity.options : [],
          }];
        }

        return [];
      })
      .filter((question) => {
        const questionText = String(question.question || question.prompt || '').trim();
        const options = Array.isArray(question.options) ? question.options : [];
        return questionText && options.length >= 2;
      });

    const speechValidationTarget = getTeacherLessonSpeechFallback(draft, editingLesson || {});
    const validationDraft = {
      ...draft,
      quizItems: validationQuizItems,
      assessmentItems: validationQuizItems,
      speechTarget: speechValidationTarget || draft.speechTarget || '',
      speech_target: speechValidationTarget || draft.speech_target || '',
      activities: validationActivities.map((activity) => {
        if (activity?.type !== 'speech') {
          return activity;
        }

        const target = getTeacherSpeechTargetText(activity) || speechValidationTarget;

        return {
          ...activity,
          targetText: target,
          content: target,
          instructions: '',
              contentSafetyContext: 'speech_target',
              allowTeacherSpeechTarget: true,
        };
      }),
    };

    let lessonValidationMessage = getTeacherLessonBuilderValidationMessage(
      validationDraft,
      validationDraft.activities,
      validationQuizItems
    );

    if (
      lessonValidationMessage &&
      String(lessonValidationMessage).toLowerCase().includes('quiz question') &&
      validationQuizItems.length
    ) {
      lessonValidationMessage = '';
    }
    if (lessonValidationMessage) {
      return Alert.alert('Lesson Builder', lessonValidationMessage);
    }

    const speechFallbackTarget = getTeacherLessonSpeechFallback(draft, editingLesson || {});
    const draftActivitiesForSave = (Array.isArray(draft.activities) ? draft.activities : []).map((activity) => {
      if (activity?.type !== 'speech') {
        return activity;
      }

      const target = getTeacherSpeechTargetText(activity) || speechFallbackTarget;

      return {
        ...activity,
        targetText: target,
        content: target,
        instructions: '',
              contentSafetyContext: 'speech_target',
              allowTeacherSpeechTarget: true,
      };
    });

    const activities = [
      ...(draft.material ? [{
        type: 'material',
        title: 'Lesson Material',
        instructions: draft.instructions,
        ...draft.material,
      }] : []),
      ...draftActivitiesForSave,
    ];

    const speechActivityTarget =
      getTeacherSpeechTargetText(activities.find((activity) => activity?.type === 'speech')) ||
      speechFallbackTarget;

    const payload = {
      gradeLevel: Number(draft.gradeLevel),
      subject: draft.subject,
      title: draft.title,
      duration: draft.duration,
      xpReward: getXpRewardValue(draft.xpReward),
      passage: buildStructuredLessonPassage(draft) || null,
      instructions: draft.instructions || null,
      speechTarget: speechActivityTarget || draft.speechTarget || null,
      status,
      activities,
    };

    const targetStatus = status || editingLesson?.status || 'draft';
    const nextPayload = { ...payload, status: targetStatus };
    const saved = await run(
      'lesson-save',
      () => editingLesson?.id ? updateLesson(editingLesson.id, nextPayload) : createLesson(nextPayload),
      editingLesson?.id
        ? (targetStatus === 'published' ? 'Published lesson updated.' : 'Draft lesson updated.')
        : (targetStatus === 'draft' ? 'Draft saved.' : 'Lesson published.')
    );
    if (saved) {
      setEditingLesson(null);
      setDraft(emptyLessonDraft());
      setBuilderStep(4);
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


  function getPendingGroupCheckTaskId(row = {}) {
    const candidates = [
      row.groupTaskId,
      row.taskId,
      row.GroupTaskId,
      row.task_id,
      row.group_task_id,
      row.task?.id,
      row.Task?.id,
      row.groupTask?.id,
      row.GroupTask?.id,
    ];

    const found = candidates.find((value) => value !== undefined && value !== null && String(value).trim());

    return found ? String(found) : '';
  }

  function getPendingGroupCheckStudentId(row = {}) {
    const candidates = [
      row.submittedByStudentId,
      row.studentId,
      row.StudentId,
      row.student_id,
      row.learnerId,
      row.userId,
      row.student?.id,
      row.Student?.id,
      row.learner?.id,
      row.user?.id,
    ];

    const found = candidates.find((value) => value !== undefined && value !== null && String(value).trim());

    return found ? String(found) : '';
  }

  function getPendingGroupCheckActionKey(row = {}) {
    const taskId = getPendingGroupCheckTaskId(row);
    const studentId = getPendingGroupCheckStudentId(row);

    if (taskId && studentId) {
      return `${taskId}-${studentId}`;
    }

    return String(row.id || row.checkId || row.groupCheckId || row.submissionId || '');
  }

  function removePendingGroupCheckRow(row = {}) {
    const targetKey = getPendingGroupCheckActionKey(row);

    setPendingChecks((current) => {
      const rows = getPendingGroupCheckRows(current).filter((item) => {
        const itemKey = getPendingGroupCheckActionKey(item);

        if (targetKey && itemKey) {
          return String(itemKey) !== String(targetKey);
        }

        return item !== row;
      });

      return buildPendingGroupChecksPayload(current, rows);
    });
  }

  async function handleApprovePendingGroupCheck(row = {}) {
    const taskId = getPendingGroupCheckTaskId(row);
    const studentId = getPendingGroupCheckStudentId(row);

    if (!taskId || !studentId) {
      Alert.alert('Pending Group Checks', 'Missing task or student details.');
      return;
    }

    console.log('[PendingGroupCheck] Approving with:', { taskId, studentId });

    const saved = await run(
      `pending-group-approve-${taskId}-${studentId}`,
      () => approveGroupTask(taskId, studentId, ''),
      'Group check approved.'
    );

    console.log('[PendingGroupCheck] Approve saved result:', saved);

    if (saved) {
      removePendingGroupCheckRow(row);
      await refreshPendingGroupChecksRealtime();
    }
  }

  function handleRevisePendingGroupCheck(row = {}) {
    const taskId = getPendingGroupCheckTaskId(row);
    const studentId = getPendingGroupCheckStudentId(row);

    if (!taskId || !studentId) {
      Alert.alert('Pending Group Checks', 'Missing task or student details.');
      return;
    }

    Alert.alert(
      'Return for Revision',
      'Send this group task back for revision?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revise',
          style: 'destructive',
          onPress: async () => {
            console.log('[PendingGroupCheck] Returning with:', { taskId, studentId });

            const saved = await run(
              `pending-group-revise-${taskId}-${studentId}`,
              () => returnGroupTask(taskId, studentId, 'Please revise and resubmit.'),
              'Group check returned for revision.'
            );

            console.log('[PendingGroupCheck] Return saved result:', saved);

            if (saved) {
              removePendingGroupCheckRow(row);
              await refreshPendingGroupChecksRealtime();
            }
          },
        },
      ]
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
          {!dashboard?.assignedClasses?.length && (
            <Text style={styles.muted}>No assigned classes yet.</Text>
          )}
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Pending Group Checks</Text>
          {(pendingChecks.rows || []).slice(0, 4).map((row) => {
            const actionId = getPendingGroupCheckActionKey(row);

            return (
              <View key={actionId || row.id || `${row.groupName}-${row.taskTitle}-${row.studentName}`} style={styles.softRow}>
                <Text style={styles.rowTitle}>{row.groupName || row.group?.name || 'Group'}</Text>
                <Text style={styles.muted}>
                  {row.taskTitle || row.task?.title || 'Task'} • {row.studentName || row.student?.name || 'Student'}
                </Text>

                <View style={styles.buttonRow}>
                  <SmallButton
                    disabled={Boolean(busy)}
                    onPress={() => handleApprovePendingGroupCheck(row)}
                  >
                    Approve
                  </SmallButton>
                  <SmallButton
                    tone="slate"
                    disabled={Boolean(busy)}
                    onPress={() => handleRevisePendingGroupCheck(row)}
                  >
                    Revise
                  </SmallButton>
                </View>
              </View>
            );
          })}
          {!(pendingChecks.rows || []).length && (
            <Text style={styles.muted}>No pending group checks.</Text>
          )}
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
              <Text style={builderStep === index ? styles.stepTextActive : styles.stepText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {builderStep === 0 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Optional Lesson Material</Text>
            <Text style={styles.muted}>Upload a PPT, PPTX, or PDF file. PDFs can preview inside the student lesson. PPT/PPTX files open as slides or download.</Text>
            {draft.material && (
              <View style={styles.softRow}>
                <Text style={styles.rowTitle}>📎 {draft.material.fileName}</Text>
                <Text style={styles.muted}>{draft.material.fileType} • {Math.round((draft.material.size || 0) / 1024)} KB</Text>
              </View>
            )}
            <SmallButton disabled={busy === 'material'} onPress={pickMaterial}>{busy === 'material' ? 'Uploading...' : 'Upload PPT/PDF Material'}</SmallButton>
            <Field label="Teacher Notes" value={draft.instructions} onChangeText={(value) => setDraft((current) => ({ ...current, instructions: value }))} multiline placeholder="Notes and instructions for the student" />
            <SmallButton onPress={() => setBuilderStep(1)}>Next: Lesson Details →</SmallButton>
          </SectionCard>
        )}

          {builderStep === 1 && (
            <>
              <SectionCard>
                <Text style={styles.cardTitle}>Lesson Information</Text>
                <Text style={styles.muted}>Provide the basic details for your lesson.</Text>

                <SelectMenu
                  label="Grade Level"
                  value={draft.gradeLevel}
                  options={lessonGradeOptions}
                  onSelect={(gradeLevel) => setDraft((current) => ({ ...current, gradeLevel }))}
                />

                <SelectMenu
                  label="Subject Area"
                  value={draft.subject}
                  options={SUBJECT_SELECT_OPTIONS}
                  onSelect={(subject) => setDraft((current) => ({ ...current, subject }))}
                />

                <Field
                  label="XP Reward"
                  value={draft.xpReward}
                  keyboardType="numeric"
                  onChangeText={(value) => setDraft((current) => ({ ...current, xpReward: normalizeXpRewardInput(value) }))}
                />

                <Field
                  label="Lesson Title"
                  value={draft.title}
                  onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
                />
              </SectionCard>

              <SectionCard>
                <Text style={styles.cardTitle}>Learning Content</Text>
                <Text style={styles.muted}>
                  {draft.material ? 'You uploaded a material. Add a short Objective, Background, and Lesson summary so students still have readable lesson cards.' : 'No uploaded material yet. Fill in the Lesson content manually.'}
                </Text>

                <Field
                  label="1  Layunin — Lesson objective"
                  value={draft.layunin}
                  onChangeText={(value) => setDraft((current) => ({ ...current, layunin: value }))}
                  multiline
                  placeholder={`Ano ang matututunan ng mga mag-aaral?\n\nHalimbawa: Tutukuyin ng mga mag-aaral ang mga salitang nagsisimula sa titik M.`}
                />

                <Field
                  label="2  Alamin — Short topic explanation"
                  value={draft.alamin}
                  onChangeText={(value) => setDraft((current) => ({ ...current, alamin: value }))}
                  multiline
                  placeholder={`What should students know first about the topic?\n\nExample: The letter M has the /m/ sound. Some words start with M.`}
                />

                <Field
                  label="3  Lesson — Main lesson content"
                  value={draft.aralin}
                  onChangeText={(value) => setDraft((current) => ({ ...current, aralin: value }))}
                  multiline
                  placeholder={"What will students read or study?\n\nExample: Some words start with M, such as mata, mesa, and maya."}
                />

                <SmallButton onPress={() => setBuilderStep(2)}>Next: Activities →</SmallButton>
              </SectionCard>
            </>
          )}

        {builderStep === 2 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Activity Builder</Text>
            <Text style={styles.muted}>Add activity blocks to build your lesson structure.</Text>
              <SelectMenu
                label="Activity Type"
                value={newActivity.type}
                options={ACTIVITY_TYPE_OPTIONS}
                onSelect={handleSelectActivityType}
              />
            <Field label="Activity Title" value={newActivity.title} onChangeText={(value) => setNewActivity((current) => ({ ...current, title: value }))} />

            <Text style={styles.fieldLabel}>Attempts Allowed</Text>
            <View style={styles.choiceRow}>
              {getTeacherAttemptOptions().map((attemptOption) => (
                <SmallButton
                  key={`activity-attempt-${attemptOption}`}
                  tone={Number(newActivity.maxAttempts || 2) === Number(attemptOption) ? 'green' : 'slate'}
                  onPress={() => setNewActivity((current) => ({ ...current, maxAttempts: attemptOption }))}
                >
                  {attemptOption} {Number(attemptOption) === 1 ? 'attempt' : 'attempts'}
                </SmallButton>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Deadline Option</Text>
            <View style={styles.choiceRow}>
              <SmallButton
                tone={!newActivity.hasDeadline ? 'green' : 'slate'}
                onPress={() => {
                  setActivityDeadlinePickerVisible(false);
                  setActivityDeadlinePickerMode('date');
                  setNewActivity((current) => ({
                    ...current,
                    hasDeadline: false,
                    deadline: '',
                  }));
                }}
              >
                No Deadline
              </SmallButton>
              <SmallButton
                tone={newActivity.hasDeadline ? 'green' : 'slate'}
                onPress={() =>
                  setNewActivity((current) => ({
                    ...current,
                    hasDeadline: true,
                    deadline: current.deadline || createDefaultTeacherDeadlineValue(),
                  }))
                }
              >
                With Deadline
              </SmallButton>
            </View>

            {newActivity.hasDeadline ? (
              <>
                <Text style={styles.fieldLabel}>Deadline</Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => { setActivityDeadlinePickerMode('date'); setActivityDeadlinePickerVisible(true); }}
                  style={{
                    borderWidth: 1,
                    borderColor: '#CBD5E1',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: newActivity.deadline ? '#0F172A' : '#94A3B8',
                      fontWeight: '800',
                    }}
                  >
                    {newActivity.deadline ? formatTeacherDeadlineForDisplay(newActivity.deadline) : 'Select activity date and time'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.choiceRow}>
                  <SmallButton
                    tone={activityDeadlinePickerMode === 'date' ? 'green' : 'slate'}
                    onPress={() => {
                      setActivityDeadlinePickerMode('date');
                      setActivityDeadlinePickerVisible(true);
                    }}
                  >
                    Change Date
                  </SmallButton>

                  <SmallButton
                    tone={activityDeadlinePickerMode === 'time' ? 'green' : 'slate'}
                    onPress={() => {
                      setActivityDeadlinePickerMode('time');
                      setActivityDeadlinePickerVisible(true);
                    }}
                  >
                    Change Time
                  </SmallButton>
                </View>

                <Text style={styles.muted}>
                  Deadline must be later than the current date and time.
                </Text>

                {activityDeadlinePickerVisible ? (
                  <DateTimePicker
                    value={getActivityDeadlineDate(newActivity.deadline)}
                    mode={activityDeadlinePickerMode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={activityDeadlinePickerMode === 'date' ? new Date() : undefined}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') {
                        setActivityDeadlinePickerVisible(false);
                      }

                      if (!selectedDate) return;

                      setNewActivity((current) => ({
                        ...current,
                        hasDeadline: true,
                        deadline: mergeTeacherDeadlineDateTime(
                          current.deadline,
                          selectedDate,
                          activityDeadlinePickerMode
                        ),
                      }));
                    }}
                  />
                ) : null}

                {newActivity.deadline ? (
                  <SmallButton
                    tone="slate"
                    onPress={() => setNewActivity((current) => ({ ...current, deadline: '' }))}
                  >
                    Clear Deadline
                  </SmallButton>
                ) : null}
              </>
            ) : null}

            {newActivity.type !== 'speech' ? (
              <Field label={newActivity.type === 'writing' ? 'Activity Overview / Note' : 'Instructions'} value={newActivity.instructions} onChangeText={(value) => setNewActivity((current) => ({ ...current, instructions: value }))} multiline />
            ) : null}
            {newActivity.type === 'mcq' ? (
              <>
                <Field label="Question" value={newActivity.question} onChangeText={(value) => setNewActivity((current) => ({ ...current, question: value }))} />

                {ACTIVITY_CHOICE_KEYS.slice(
                  0,
                  Math.min(ACTIVITY_CHOICE_KEYS.length, Math.max(2, Number(newActivity.choiceCount || 2)))
                ).map((choice) => {
                  const optionKey = `option${choice}`;

                  return (
                    <Field
                      key={choice}
                      label={`Choice ${choice}`}
                      value={newActivity[optionKey] || ''}
                      onChangeText={(value) =>
                        setNewActivity((current) => ({
                          ...current,
                          [optionKey]: value,
                        }))
                      }
                    />
                  );
                })}

                <View style={styles.choiceRow}>
                  <SmallButton
                    tone="slate"
                    disabled={Number(newActivity.choiceCount || 2) >= ACTIVITY_CHOICE_KEYS.length}
                    onPress={() =>
                      setNewActivity((current) => ({
                        ...current,
                        choiceCount: Math.min(
                          ACTIVITY_CHOICE_KEYS.length,
                          Math.max(2, Number(current.choiceCount || 2)) + 1
                        ),
                      }))
                    }
                  >
                    Add More Choice
                  </SmallButton>

                  {Number(newActivity.choiceCount || 2) > 2 ? (
                    <SmallButton
                      tone="red"
                      onPress={() =>
                        setNewActivity((current) => {
                          const currentCount = Math.min(
                            ACTIVITY_CHOICE_KEYS.length,
                            Math.max(2, Number(current.choiceCount || 2))
                          );
                          const nextCount = Math.max(2, currentCount - 1);
                          const removedChoice = ACTIVITY_CHOICE_KEYS[currentCount - 1];

                          return {
                            ...current,
                            choiceCount: nextCount,
                            [`option${removedChoice}`]: '',
                            correctOption:
                              current.correctOption === removedChoice
                                ? 'A'
                                : current.correctOption,
                          };
                        })
                      }
                    >
                      Remove Last Choice
                    </SmallButton>
                  ) : null}
                </View>

                <Text style={styles.fieldLabel}>Correct Choice</Text>
                <View style={styles.choiceRow}>
                  {ACTIVITY_CHOICE_KEYS.slice(
                    0,
                    Math.min(ACTIVITY_CHOICE_KEYS.length, Math.max(2, Number(newActivity.choiceCount || 2)))
                  ).map((choice) => (
                    <SmallButton
                      key={choice}
                      tone={newActivity.correctOption === choice ? 'green' : 'slate'}
                      onPress={() => setNewActivity((current) => ({ ...current, correctOption: choice }))}
                    >
                      {choice}
                    </SmallButton>
                  ))}
                </View>
              </>
            ) : (
              <>
                {newActivity.type === 'writing' ? (
                  <SelectMenu
                    label="Writing Activity Type"
                    value={newActivity.gawainType || 'writing_task'}
                    options={WRITING_ACTIVITY_TYPE_OPTIONS}
                    onSelect={(gawainType) => setNewActivity((current) => ({ ...current, gawainType }))}
                  />
                ) : null}
                <Field label={newActivity.type === 'writing' ? 'Student Writing Task' : newActivity.type === 'speech' ? 'Reading Text' : 'Content'} value={newActivity.content} onChangeText={(value) => setNewActivity((current) => ({ ...current, content: value }))} multiline />
                {newActivity.type === 'speech' ? (
                  <View style={styles.softRow}>
                    <Text style={styles.rowTitle}>Speech target only</Text>
                    <Text style={styles.muted}>Type only the exact words students should say aloud. Do not add writing instructions or passage prompts here.</Text>
                  </View>
                ) : null}
              </>
            )}
            <SmallButton onPress={addActivity}>{typeof newActivity.editingActivityIndex === 'number' ? 'Update Activity Block' : 'Add Activity Block'}</SmallButton>
            {draft.activities.map((activity, index) => (
              <View key={`${activity.type}-${index}`} style={styles.softRow}>
                <Text style={styles.rowTitle}>{index + 1}. {activity.title}</Text>
                <Text style={styles.muted}>Type: {typeof getTeacherLessonActivityTypeLabel === 'function' ? getTeacherLessonActivityTypeLabel(activity) : activity.type}</Text>
                <SmallButton
                  tone="slate"
                  onPress={() => setNewActivity((current) => hydrateActivityBuilderFromExisting(activity, index, current))}
                >
                  Edit This Activity
                </SmallButton>
              </View>
            ))}
            <SmallButton onPress={() => setBuilderStep(3)}>Next: Preview →</SmallButton>
          </SectionCard>
        )}

        {builderStep === 3 && (
          <SectionCard>
            {(() => {
              const previewActivities = Array.isArray(draft.activities) ? draft.activities : [];
              const previewPassage = buildStructuredLessonPassage(draft);
              const hasPreviewContent = Boolean(
                String(draft.title || '').trim() ||
                String(draft.instructions || '').trim() ||
                String(draft.speechTarget || '').trim() ||
                draft.material ||
                previewPassage ||
                previewActivities.length
              );

              if (!hasPreviewContent) {
                return (
                  <>
                    <Text style={styles.cardTitle}>Student Lesson Preview</Text>
                    <View style={styles.softRow}>
                      <Text style={styles.rowTitle}>No lesson preview yet.</Text>
                      <Text style={styles.muted}>
                        Add lesson details, reading material, or activities first before previewing the student lesson.
                      </Text>
                    </View>
                    <View style={styles.buttonRow}>
                      <SmallButton tone="slate" onPress={() => setBuilderStep(1)}>
                        Go to Lesson Details
                      </SmallButton>
                      <SmallButton onPress={() => setBuilderStep(2)}>
                        Add Task
                      </SmallButton>
                    </View>
                  </>
                );
              }

              return (
                <>
                  <Text style={styles.cardTitle}>{editingLesson?.id ? 'Edit Lesson Preview' : 'Student Lesson Preview'}</Text>
                  <Text style={styles.previewTitle}>
                    {String(draft.title || '').trim() || 'Lesson title not yet added'}
                  </Text>
                  <Text style={styles.muted}>
                    Grade {draft.gradeLevel || '-'} • {draft.subject || 'No subject'} • +{draft.xpReward || 0} XP
                  </Text>
                  <Text style={styles.body}>{previewPassage || 'No reading material has been added yet.'}</Text>
                  <Text style={styles.rowTitle}>{previewActivities.length} activity block{previewActivities.length === 1 ? '' : 's'} in this lesson</Text>

                  {previewActivities.length ? (
                    <View style={{ marginTop: 12, gap: 10 }}>
                      {previewActivities.map((activity, index) => {
                        const activityDeadline = activity.deadline || activity.dueAt || activity.dueDate || '';
                        const activityTypeLabel =
                          activity.type === 'mcq'
                            ? 'Quiz'
                            : activity.type === 'writing'
                            ? 'Writing'
                            : activity.type === 'speech'
                            ? 'Speech'
                            : activity.type === 'infographic'
                            ? 'Info'
                            : activity.type || 'Activity';

                        return (
                          <View key={`${activity.type}-${index}-preview`} style={styles.softRow}>
                            <Text style={styles.rowTitle}>
                              {index + 1}. {activity.title || `${activityTypeLabel} Activity`}
                            </Text>
                            <Text style={styles.muted}>Type: {activityTypeLabel}</Text>
                            <Text style={styles.muted}>
                              Deadline: {activityDeadline ? formatTeacherLessonDate(activityDeadline) : 'No Deadline'}
                            </Text>

                            {activity.instructions ? (
                              <Text style={styles.body}>{activity.type === 'writing' ? 'Activity Overview / Note' : 'Instructions'}: {activity.instructions}</Text>
                            ) : null}

                            {activity.type === 'mcq' && Array.isArray(activity.questions) ? (
                              <View style={{ marginTop: 8, gap: 8 }}>
                                {activity.questions.map((question, questionIndex) => (
                                  <View key={`preview-question-${questionIndex}`} style={styles.softRow}>
                                    <Text style={styles.rowTitle}>
                                      Question {questionIndex + 1}: {question.question || question.prompt || 'Untitled question'}
                                    </Text>

                                    {Array.isArray(question.options) && question.options.length ? (
                                      <View style={{ marginTop: 6, gap: 4 }}>
                                        {question.options.map((option, optionIndex) => {
                                          const choiceLabel = String.fromCharCode(65 + optionIndex);
                                          const optionText =
                                            typeof option === 'string'
                                              ? option
                                              : option.text || option.label || option.value || '';

                                          const isCorrect =
                                            typeof option === 'object' &&
                                            Boolean(option.isCorrect || option.correct);

                                          return (
                                            <Text
                                              key={`preview-option-${questionIndex}-${optionIndex}`}
                                              style={isCorrect ? styles.rowTitle : styles.muted}
                                            >
                                              {choiceLabel}. {optionText || 'Blank choice'}{isCorrect ? ' — Correct answer' : ''}
                                            </Text>
                                          );
                                        })}
                                      </View>
                                    ) : (
                                      <Text style={styles.muted}>No answer choices added.</Text>
                                    )}
                                  </View>
                                ))}
                              </View>
                            ) : null}

                            {activity.type === 'writing' ? (
                              <Text style={styles.body}>
                                Prompt: {activity.prompt || activity.content || 'No writing prompt added.'}
                              </Text>
                            ) : null}

                            {activity.type === 'speech' ? (
                              <Text style={styles.body}>
                                Reading Text: {getTeacherSpeechTargetText(activity) || getTeacherLessonSpeechFallback(draft, editingLesson || {}) || 'No speech text added.'}
                              </Text>
                            ) : null}
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={styles.muted}>No activities added yet.</Text>
                  )}

                  <View style={styles.buttonRow}>
                    {editingLesson?.id ? <SmallButton tone="slate" disabled={Boolean(busy)} onPress={() => saveLesson(editingLesson.status || 'draft')}>💾 Save Changes</SmallButton> : <SmallButton tone="slate" disabled={Boolean(busy)} onPress={() => saveLesson('draft')}>📋 Save Draft</SmallButton>}
                    {editingLesson?.status !== 'published' ? <SmallButton disabled={Boolean(busy)} onPress={() => saveLesson('published')}>🚀 Publish Lesson</SmallButton> : null}
                    {editingLesson?.id ? <SmallButton tone="slate" disabled={Boolean(busy)} onPress={resetLessonBuilder}>Cancel Edit</SmallButton> : null}
                  </View>
                </>
              );
            })()}
          </SectionCard>
        )}

        {builderStep === 4 && (
          <SectionCard>
            <Text style={styles.cardTitle}>My Created Lessons</Text>
            <Text style={styles.muted}>Edit draft or published lessons from your list.</Text>
            {lessons.map((lesson) => {
              const isPublished = (lesson.status || 'published') === 'published';

              return (
                <View key={lesson.id} style={styles.lessonListCard}>
                  <View style={styles.lessonListHeader}>
                    <View style={styles.flex}>
                      <Text style={styles.rowTitle}>📘 {lesson.title || 'Untitled Lesson'}</Text>
                      <Text style={styles.muted}>Grade {lesson.gradeLevel} • {lesson.subject}</Text>
                  <Text style={styles.muted}>
                    Mga Prompt: {getTeacherLessonActivityTypeSummary(lesson)}
                  </Text>
                    </View>
                    <Text style={[styles.lessonStatusChip, isPublished ? styles.lessonStatusPublished : styles.lessonStatusDraft]}>
                      ● {isPublished ? 'Published' : 'Draft'}
                    </Text>
                  </View>

                  <View style={styles.lessonMetaGrid}>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>Material</Text>
                      <Text style={styles.lessonMetaValue}>{getLessonMaterialLabel(lesson)}</Text>
                    </View>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>Quiz Items</Text>
                      <Text style={styles.lessonMetaValue}>{getLessonQuizItemCount(lesson)}</Text>
                    </View>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>XP</Text>
                      <Text style={styles.lessonMetaValue}>+{lesson.xpReward || 0}</Text>
                    </View>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>Updated</Text>
                      <Text style={styles.lessonMetaValue}>{formatTeacherLessonDate(lesson.updatedAt || lesson.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.lessonActionRow}>
                    <SmallButton tone="slate" disabled={Boolean(busy)} onPress={() => editLessonDraft(lesson)}>Edit</SmallButton>
                    {lesson.status === 'draft' ? <SmallButton disabled={Boolean(busy)} onPress={() => run(`publish-${lesson.id}`, () => updateLesson(lesson.id, { status: 'published' }), 'Lesson published.')}>Publish</SmallButton> : null}
                    {lesson.status !== 'archived' ? <SmallButton tone="red" disabled={Boolean(busy)} onPress={() => run(`archive-${lesson.id}`, () => archiveLesson(lesson.id), 'Lesson removed.')}>Remove Lesson</SmallButton> : null}
                  </View>
                </View>
              );
            })}
            {!lessons.length && <Text style={styles.muted}>No lessons created yet.</Text>}
          </SectionCard>
        )}
      </>
    );
  }

  function getStudentGradeLevelValue(student = {}) {
    const grade = Number(
      student.gradeLevel ||
        student.grade ||
        student.Student?.gradeLevel ||
        student.student?.gradeLevel ||
        0
    );

    return [1, 2, 3, 4, 5, 6].includes(grade) ? grade : null;
  }

  function getGroupGradeLevelValue(group = {}) {
    const directGrade = Number(group.gradeLevel || group.grade || 0);
    if ([1, 2, 3, 4, 5, 6].includes(directGrade)) return directGrade;

    const members = Array.isArray(group.members) ? group.members : [];
    for (const member of members) {
      const memberGrade = getStudentGradeLevelValue(member.Student || member.student || member);
      if (memberGrade) return memberGrade;
    }

    return null;
  }

  function getGroupMemberGradeValidationMessage(group = {}, student = {}) {
    const groupGrade = getGroupGradeLevelValue(group);
    const studentGrade = getStudentGradeLevelValue(student);

    if (!studentGrade) {
      return 'Nawawala ang grade level ng mag-aaral. Pakisuri muna ang student record.';
    }

    if (groupGrade && studentGrade !== groupGrade) {
      return `Only Grade ${groupGrade} students can be added to this group.`;
    }

    return '';
  }

  function toggleGroupTools(groupId) {
    setOpenGroupTools((current) => ({
      ...current,
      [groupId]: !current[groupId],
    }));
  }

  function getStudentGroupMemberId(student = {}) {
    return student.id ?? student.studentId ?? student.student_id ?? student.profileId ?? student.profile_id;
  }

  function getGroupMembers(group = {}) {
    return Array.isArray(group.members)
      ? group.members
      : Array.isArray(group.Members)
        ? group.Members
        : [];
  }

  function getGroupTasks(group = {}) {
    return Array.isArray(group.tasks) ? group.tasks : [];
  }

  function getMemberStudent(member = {}) {
    return member.Student || member.student || member;
  }

  function getGroupTaskDeadlineLabel(task = {}) {
    const value = task.dueAt || task.deadline || task.dueDate;

    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString();
  }

  async function handleSetGroupLeader(groupId, studentId) {
    if (!groupId || !studentId) {
      Alert.alert('Group Manager', 'Missing group leader details.');
      return;
    }

    const saved = await run(
      `leader-${groupId}-${studentId}`,
      () => setGroupLeader(groupId, studentId),
      'Group leader updated.'
    );

    if (saved) await load();
  }

  function confirmRemoveGroupMember(group = {}, member = {}) {
    const student = getMemberStudent(member);
    const studentId = student.id || member.studentId;
    const studentName = student.name || 'this student';
    const groupName = group.name || 'this group';

    if (!group.id || !studentId) {
      Alert.alert('Group Manager', 'Missing member details.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Remove "${studentName}" from "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const removed = await run(
              `member-remove-${group.id}-${studentId}`,
              () => removeGroupMember(group.id, studentId),
              'Member removed from group.'
            );

            if (removed) await load();
          },
        },
      ]
    );
  }

  function confirmDeleteGroup(group = {}) {
    const groupName = group.name || 'this group';

    Alert.alert(
      'Remove Group',
      `Remove "${groupName}"? Hindi na ito makikita ng mga mag-aaral na naka-assign sa grupong ito.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const removed = await run(
              `group-delete-${group.id}`,
              () => deleteGroup(group.id),
              'Group removed.'
            );

            if (removed) {
              setGroups((current) => current.filter((item) => Number(item.id) !== Number(group.id)));
              setPendingChecks((current) => removeGroupFromPendingChecksState(current, group));
              setSelectedGroupId((current) => Number(current) === Number(group.id) ? null : current);
              setTaskForm((current) =>
                Number(current.groupId) === Number(group.id)
                  ? { ...current, groupId: '' }
                  : current
              );
              await refreshPendingGroupChecksRealtime();
              await load();
            }
          },
        },
      ]
    );
  }

  function renderGroups() {
    const groupSelectOptions = groups.length
      ? groups.map((group) => ({ value: String(group.id), label: group.name || 'Group' }))
      : [{ value: '', label: 'No groups yet' }];
    const taskTargetGroup = groups.find((group) => String(group.id) === String(taskForm.groupId || selectedGroup?.id)) || selectedGroup || groups[0] || null;
    const taskTargetGroupId = taskForm.groupId || taskTargetGroup?.id || '';

    return (
      <>
        <SectionCard>
          <Text style={styles.sectionLabel}>Classroom Tools</Text>
          <Text style={styles.cardTitle}>Group Manager</Text>
          <Text style={styles.muted}>Create groups, assign tasks, and add students to collaborative learning groups.</Text>
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Create Group</Text>
          <Text style={styles.muted}>Set up a group, class section, or collaborative activity team.</Text>

          <Field
            label="Group Name"
            value={groupForm.name}
            onChangeText={(name) => setGroupForm((current) => ({ ...current, name }))}
            placeholder="Group name"
          />

          <SelectMenu
            label="Section"
            value={groupForm.section || groupForm.description || ''}
            options={groupSectionOptions}
            disabled={!groupSectionOptions.length || Boolean(busy)}
            onSelect={(section) =>
              setGroupForm((current) => ({
                ...current,
                section,
                description: section,
              }))
            }
          />

          <SelectMenu
            label="Group Grade Level"
            value={groupForm.gradeLevel}
            options={usableGradeOptions}
            disabled={Boolean(busy)}
            onSelect={(gradeLevel) => setGroupForm((current) => ({ ...current, gradeLevel, section: '', description: '' }))}
          />

          <SmallButton disabled={!groupForm.name.trim() || !(groupForm.section || groupForm.description || '').trim() || Boolean(busy)} onPress={async () => {
            const groupGradeLevel = Number(groupForm.gradeLevel);

            if (![1, 2, 3, 4, 5, 6].includes(groupGradeLevel)) {
              Alert.alert('Create Group', 'Select a valid grade level from Grade 1 to Grade 6.');
              return;
            }

            const groupSection = normalizeSectionName(groupForm.section || groupForm.description);

            if (!groupSection) {
              Alert.alert('Create Group', 'Select a section for this group.');
              return;
            }

            if (!canUseGradeSection(groupGradeLevel, groupSection)) {
              Alert.alert('Create Group', 'You can only create groups for your assigned grade level or section.');
              return;
            }

            const groupPayload = {
              ...groupForm,
              gradeLevel: groupGradeLevel,
              section: groupSection,
              description: groupSection,
            };
            const saved = await run('group-create', () => createGroup(groupPayload), 'Group created.');

            if (saved) {
              setGroups((current) => [
                { ...saved, gradeLevel: saved.gradeLevel || groupGradeLevel },
                ...current.filter((group) => Number(group.id) !== Number(saved.id)),
              ]);
              setSelectedGroupId(saved.id);
              setGroupForm({ name: '', description: '', section: '', gradeLevel: String(groupGradeLevel) });
            }
          }}>Create Group</SmallButton>
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>Add Task</Text>
          <Text style={styles.muted}>Assign collaborative work with a deadline and XP reward.</Text>

          <SelectMenu
            label="Group"
            value={String(taskTargetGroupId)}
            options={groupSelectOptions}
            disabled={!groups.length || Boolean(busy)}
            onSelect={(groupId) => {
              setTaskForm((current) => ({ ...current, groupId }));
              setSelectedGroupId(groupId);
            }}
          />

          <Field
            label="Task Title"
            value={taskForm.title}
            onChangeText={(title) => setTaskForm((current) => ({ ...current, title }))}
            placeholder="Task title"
          />

          <Text style={styles.fieldLabel}>Deadline</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTaskDeadlinePickerVisible(true)}
            style={{
              borderWidth: 1,
              borderColor: '#CBD5E1',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 14,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: taskForm.deadline ? '#0F172A' : '#94A3B8',
                fontWeight: '800',
              }}
            >
              {taskForm.deadline ? `Deadline: ${taskForm.deadline}` : 'Select a deadline'}
            </Text>
          </TouchableOpacity>

          {taskDeadlinePickerVisible ? (
            <DateTimePicker
              value={getTaskDeadlineDate(taskForm.deadline)}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'default'}
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setTaskDeadlinePickerVisible(false);

                if (event?.type === 'set' && selectedDate) {
                  setTaskForm((current) => ({
                    ...current,
                    deadline: formatTaskDeadlineValue(selectedDate),
                  }));
                }
              }}
            />
          ) : null}

          <Field
            label="XP Reward"
            value={taskForm.xpReward}
            keyboardType="numeric"
            onChangeText={(xpReward) => setTaskForm((current) => ({ ...current, xpReward: normalizeXpRewardInput(xpReward) }))}
            placeholder="XP"
          />

          <SmallButton disabled={!groups.length || !taskForm.title.trim() || Boolean(busy)} onPress={async () => {
            const groupId = taskForm.groupId || selectedGroup?.id || groups[0]?.id;

            if (!groupId) {
              Alert.alert('Add Task', 'Select a group first.');
              return;
            }

            const saved = await run(
              'task-create',
              () => addGroupTask(groupId, {
                title: taskForm.title,
                description: taskForm.description,
                dueAt: taskForm.deadline || null,
                deadline: taskForm.deadline || null,
                xpReward: Number(taskForm.xpReward || 10),
              }),
              'Task added.'
            );

            if (saved) {
              setTaskForm({ title: '', description: '', deadline: '', xpReward: '10', groupId: String(groupId) });
              await load();
            }
          }}>Add Task</SmallButton>
        </SectionCard>

        <SectionCard>
          <View style={styles.actionRow}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Groups</Text>
              <Text style={styles.muted}>Add students to existing groups and review assigned tasks.</Text>
            </View>
            <Text style={styles.lessonStatusChip}>{groups.length} group{groups.length === 1 ? '' : 's'}</Text>
          </View>

          {groups.length ? groups.map((group) => {
            const members = getGroupMembers(group);
            const tasks = getGroupTasks(group);
            const memberCount = members.length;
            const taskCount = tasks.length;
            const isOpen = Boolean(openGroupTools[group.id]);
            const groupGrade = getGroupGradeLevelValue(group);
            const existingMemberIds = new Set(
              members
                .map((member) => {
                  const memberStudent = getMemberStudent(member);
                  return String(getStudentGroupMemberId(memberStudent) ?? member.studentId ?? member.student_id ?? '');
                })
                .filter(Boolean)
            );
            const addableStudents = usableStudents.filter((student) => {
              const studentId = getStudentGroupMemberId(student);
              const studentGrade = getStudentGradeLevelValue(student);

              if (!studentId || existingMemberIds.has(String(studentId))) return false;
              if (!groupGrade) return false;

              return studentGrade === groupGrade;
            });

            return (
              <View key={group.id} style={[styles.lessonListCard, Number(selectedGroup?.id) === Number(group.id) && styles.selectedRow]}>
                <TouchableOpacity onPress={() => setSelectedGroupId(group.id)}>
                  <Text style={styles.rowTitle}>{group.name}</Text>
                  <Text style={styles.muted}>{group.description || 'No description added.'}</Text>
                  <View style={styles.lessonMetaGrid}>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>Members</Text>
                      <Text style={styles.lessonMetaValue}>👥 {memberCount}</Text>
                    </View>
                    <View style={styles.lessonMetaPill}>
                      <Text style={styles.lessonMetaLabel}>Tasks</Text>
                      <Text style={styles.lessonMetaValue}>✅ {taskCount}</Text>
                    </View>
                    {groupGrade ? (
                      <View style={styles.lessonMetaPill}>
                        <Text style={styles.lessonMetaLabel}>Grade</Text>
                        <Text style={styles.lessonMetaValue}>{groupGrade}</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>

                <View style={styles.softRow}>
                  <Text style={styles.rowTitle}>Members</Text>
                  {members.length ? members.map((member) => {
                    const student = getMemberStudent(member);
                    const studentId = student.id || member.studentId;
                    const isLeader = String(member.groupRole || '').toLowerCase() === 'leader';

                    return (
                      <View key={member.id || studentId || student.studentCode || student.name} style={styles.actionRow}>
                        <View style={styles.flex}>
                          <Text style={styles.body}>👤 {student.name || 'Student'}</Text>
                          <Text style={styles.muted}>{isLeader ? 'Leader' : 'Member'}</Text>
                        </View>
                        {!isLeader ? (
                          <SmallButton
                            tone="slate"
                            disabled={Boolean(busy)}
                            onPress={() => handleSetGroupLeader(group.id, studentId)}
                          >
                            Set as Leader
                          </SmallButton>
                        ) : null}
                        <SmallButton
                          tone="red"
                          disabled={Boolean(busy)}
                          onPress={() => confirmRemoveGroupMember(group, member)}
                        >
                          Remove
                        </SmallButton>
                      </View>
                    );
                  }) : (
                    <Text style={styles.muted}>No members added yet.</Text>
                  )}
                </View>

                <View style={styles.softRow}>
                  <Text style={styles.rowTitle}>Tasks</Text>
                  {tasks.length ? (
                    <>
                      {tasks.slice(0, 3).map((task) => (
                        <View key={task.id || task.title} style={styles.actionRow}>
                          <View style={styles.flex}>
                            <Text style={styles.body}>{task.title || 'Group task'}</Text>
                            <Text style={styles.muted}>
                              +{task.xpReward || 0} XP{getGroupTaskDeadlineLabel(task) ? ` • Due ${getGroupTaskDeadlineLabel(task)}` : ''}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {tasks.length > 3 ? (
                        <Text style={styles.muted}>+{tasks.length - 3} more task{tasks.length - 3 === 1 ? '' : 's'}</Text>
                      ) : null}
                    </>
                  ) : (
                    <Text style={styles.muted}>No tasks assigned yet.</Text>
                  )}
                </View>

                <View style={styles.lessonActionRow}>
                  <SmallButton tone="slate" onPress={() => toggleGroupTools(group.id)}>
                    {isOpen ? 'Hide Add Member' : 'Add Member'}
                  </SmallButton>
                  <SmallButton tone="red" disabled={Boolean(busy)} onPress={() => confirmDeleteGroup(group)}>
                    Remove Group
                  </SmallButton>
                </View>

                {isOpen ? (
                  <View style={styles.softRow}>
                    <Text style={styles.fieldLabel}>Add Member</Text>
                    <Text style={styles.muted}>
                      {groupGrade
                        ? `Only Grade ${groupGrade} learners can be added to this group.`
                        : 'Only learners from the same grade level can be grouped.'}
                    </Text>

                    <View style={styles.choiceRow}>
                      {addableStudents.map((student) => {
                        const studentId = getStudentGroupMemberId(student);

                        return (
                          <SmallButton
                            key={studentId || student.studentCode || student.student_code || student.name}
                            tone="slate"
                            disabled={Boolean(busy)}
                            onPress={() => {
                              if (!studentId) {
                                Alert.alert('Group Members', 'Missing student details.');
                                return;
                              }

                              const gradeValidationMessage = getGroupMemberGradeValidationMessage(group, student);
                              if (gradeValidationMessage) {
                                Alert.alert('Group Members', gradeValidationMessage);
                                return;
                              }

                              run(`member-${group.id}-${studentId}`, () => addGroupMember(group.id, studentId), 'Learner added.');
                            }}
                          >
                            {student.name} • Grade {student.gradeLevel || student.grade || '-'}
                          </SmallButton>
                        );
                      })}
                    </View>

                    {!groupGrade ? (
                      <Text style={styles.muted}>Set a group grade level before adding learners.</Text>
                    ) : !addableStudents.length ? (
                      <Text style={styles.muted}>No available learners match this group grade level, or all matching learners are already members.</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          }) : (
            <View style={styles.softRow}>
              <Text style={styles.rowTitle}>👥 No groups yet.</Text>
              <Text style={styles.muted}>Create your first group to start collaborative learning tasks.</Text>
            </View>
          )}
        </SectionCard>
      </>
    );
  }

  function renderAssessment() {
    const summary = quizPerformance.summary || {};
    const rawRows = Array.isArray(quizPerformance.rows) ? quizPerformance.rows : [];
    const selectedRows = selectedAssessmentQuizId && selectedAssessmentQuizId !== 'ALL'
      ? rawRows.filter((row) => String(row.quizId || '') === String(selectedAssessmentQuizId))
      : rawRows;
    const normalizedQuery = assessmentQuery.trim().toLowerCase();
    const filteredRows = selectedRows.filter((row) => {
      const matchesStatus = quizFilter === 'All' || String(row.status || '') === quizFilter;
      const haystack = [
        row.studentName,
        row.quizTitle,
        row.quizId,
        row.section,
        row.gradeLevel ? `grade ${row.gradeLevel}` : '',
      ]
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
    const visibleRows = showAllAssessmentRows ? filteredRows : filteredRows.slice(0, 8);
    const hiddenCount = Math.max(0, filteredRows.length - visibleRows.length);
    const assessmentOptions = [
      { value: 'ALL', label: 'All assessments' },
      ...Array.from(
        new Map(
          rawRows
            .filter((row) => row.quizId)
            .map((row) => [String(row.quizId), row.quizTitle || row.quizId])
        ).entries()
      ).map(([value, label]) => ({ value, label })),
    ];
    const quizReadyLessons = activityCoverage.filter((lesson) => lesson.quizCount).length;
    const totalQuestions = activityCoverage.reduce((total, lesson) => total + lesson.quizCount, 0);
    const missingQuizLessons = Math.max(0, activityCoverage.length - quizReadyLessons);
    const readiness = activityCoverage.length
      ? Math.round((quizReadyLessons / activityCoverage.length) * 100)
      : 0;
    const proficientTotal = Number(summary.proficient || 0) + Number(summary.advanced || 0);

    function scoreText(attempt) {
      if (!attempt) return '—';
      return `${attempt.percent ?? 0}%`;
    }

    function statusTone(status = '') {
      const value = String(status).toLowerCase();
      if (value.includes('advanced') || value.includes('proficient')) return 'good';
      if (value.includes('developing')) return 'warn';
      return 'bad';
    }

    function statusPillStyle(status = '') {
      const tone = statusTone(status);
      if (tone === 'good') return [styles.assessmentStatusPill, styles.assessmentStatusGood];
      if (tone === 'warn') return [styles.assessmentStatusPill, styles.assessmentStatusWarn];
      return [styles.assessmentStatusPill, styles.assessmentStatusBad];
    }

    function statusTextStyle(status = '') {
      const tone = statusTone(status);
      if (tone === 'good') return [styles.assessmentStatusText, styles.assessmentStatusGoodText];
      if (tone === 'warn') return [styles.assessmentStatusText, styles.assessmentStatusWarnText];
      return [styles.assessmentStatusText, styles.assessmentStatusBadText];
    }

    return (
      <>
        <View style={styles.assessmentSummaryGrid}>
          {[
            ['✅', summary.total || rawRows.length || 0, 'Completed Assessments'],
            ['📊', `${summary.averageBest || 0}%`, 'Average Score'],
            ['🧭', summary.needsSupport || 0, 'Needs Support'],
            ['🏅', proficientTotal, 'Proficient Students'],
            ['🎯', `${readiness}%`, 'Quiz Readiness'],
            ['❓', totalQuestions, 'Total Questions'],
          ].map(([icon, value, label]) => (
            <View key={label} style={styles.assessmentMetricCard}>
              <Text style={styles.assessmentMetricIcon}>{icon}</Text>
              <Text style={styles.assessmentMetricValue}>{value}</Text>
              <Text style={styles.assessmentMetricLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <SectionCard>
          <Text style={styles.cardTitle}>Assessment Coverage</Text>
          <Text style={styles.muted}>
            {quizReadyLessons} of {activityCoverage.length} lesson(s) have objective quiz evidence.
            {missingQuizLessons ? ` ${missingQuizLessons} lesson(s) still need quiz items.` : ' All lessons are quiz-ready.'}
          </Text>
          {activityCoverage.map((lesson) => (
            <View key={lesson.id} style={styles.softRow}>
              <Text style={styles.rowTitle}>{lesson.title}</Text>
              <Text style={styles.muted}>
                {lesson.quizCount} quiz question(s) • {lesson.writingCount} writing • {lesson.speechCount} speech
              </Text>
              {!lesson.quizCount && <Text style={styles.warning}>Missing quiz evidence</Text>}
            </View>
          ))}
          {!activityCoverage.length && <Text style={styles.muted}>No lessons available for assessment coverage yet.</Text>}
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Student Assessment Results</Text>
          <Text style={styles.muted}>
            Monitor student assessment completion, review quiz scores, and identify learners who need support.
          </Text>

          <SelectMenu
            label="Assessment"
            value={selectedAssessmentQuizId}
            options={assessmentOptions}
            onSelect={(value) => {
              setSelectedAssessmentQuizId(value);
              setShowAllAssessmentRows(false);
            }}
          />

          <TextInput
            style={styles.assessmentSearchInput}
            value={assessmentQuery}
            onChangeText={(value) => {
              setAssessmentQuery(value);
              setShowAllAssessmentRows(false);
            }}
            placeholder="Search student or assessment..."
            placeholderTextColor="#8aa39b"
          />

          <SelectMenu
            label="Performance Filter"
            value={quizFilter}
            options={QUIZ_FILTERS.map((filter) => ({ value: filter, label: filter }))}
            onSelect={(value) => {
              setQuizFilter(value);
              setShowAllAssessmentRows(false);
            }}
          />

          <Text style={styles.assessmentCountText}>
            Showing {visibleRows.length} of {filteredRows.length} assessment record{filteredRows.length === 1 ? '' : 's'}
          </Text>

          {visibleRows.map((row) => (
            <View key={row.key || `${row.studentName}-${row.quizId}`} style={styles.assessmentResultRow}>
              <View style={styles.assessmentResultHeader}>
                <View style={styles.assessmentResultIdentity}>
                  <Text style={styles.assessmentLearnerName}>{row.studentName || 'Student'}</Text>
                  <Text style={styles.assessmentLessonTitle}>{row.quizTitle || 'Assessment'}</Text>
                  <Text style={styles.muted}>
                    Grade {row.gradeLevel || '—'}{row.section ? ` • Section ${row.section}` : ''}
                  </Text>
                </View>
                <View style={statusPillStyle(row.status)}>
                  <Text style={statusTextStyle(row.status)}>{row.status || 'Needs Support'}</Text>
                </View>
              </View>

              <View style={styles.assessmentMetaGrid}>
                <View style={styles.assessmentMetaItem}>
                  <Text style={styles.assessmentMetaLabel}>Attempt 1</Text>
                  <Text style={styles.assessmentMetaValue}>{scoreText(row.attempt1)}</Text>
                </View>
                <View style={styles.assessmentMetaItem}>
                  <Text style={styles.assessmentMetaLabel}>Attempt 2</Text>
                  <Text style={styles.assessmentMetaValue}>{scoreText(row.attempt2)}</Text>
                </View>
                <View style={styles.assessmentMetaItem}>
                  <Text style={styles.assessmentMetaLabel}>Best Score</Text>
                  <Text style={styles.assessmentMetaValue}>{row.bestPercent || 0}%</Text>
                </View>
              </View>
            </View>
          ))}

          {!visibleRows.length && (
            <View style={styles.assessmentEmptyState}>
              <Text style={styles.assessmentEmptyIcon}>📝</Text>
              <Text style={styles.rowTitle}>No matching assessment records.</Text>
              <Text style={styles.muted}>Try another search or wait for students to complete their assessments.</Text>
            </View>
          )}

          {filteredRows.length > 8 && (
            <Pressable
              style={styles.assessmentShowMoreButton}
              onPress={() => setShowAllAssessmentRows((current) => !current)}
            >
              <Text style={styles.assessmentShowMoreText}>
                {showAllAssessmentRows ? 'Show Less' : `Show More (${hiddenCount} more)`}
              </Text>
            </Pressable>
          )}
        </SectionCard>
      </>
    );
  }


  function formatReviewDate(value) {
    if (!value) {
      return 'No date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'No date';
    }

    return date.toLocaleDateString();
  }

  function getReviewStudent(item) {
    return item.student || item.Student || {};
  }

  function getReviewLesson(item) {
    return item.lesson || item.Lesson || {};
  }

  function getReviewTask(item) {
    return item.task || item.Task || {};
  }

  function getReviewStudentName(item) {
    const student = getReviewStudent(item);
    return item.studentName || student.name || item.name || 'Student';
  }

  function getReviewStudentKey(item) {
    const student = getReviewStudent(item);
    return String(item.studentId || student.id || item.studentCode || student.studentCode || getReviewStudentName(item));
  }

  function getReviewLessonTitle(item) {
    const lesson = getReviewLesson(item);
    return item.lessonTitle || lesson.title || item.activityTitle || 'Untitled Lesson';
  }

  function getReviewSubject(item) {
    const lesson = getReviewLesson(item);
    return item.subject || lesson.subject || '';
  }

  function getReviewGradeSection(item) {
    const student = getReviewStudent(item);
    const grade = item.gradeLevel || student.gradeLevel || '—';
    const section = item.section || student.section || 'No section';
    return `Grade ${grade} • ${section}`;
  }

  function getReviewPrompt(item, type) {
    const task = getReviewTask(item);

    if (type === 'speech') {
      return item.speechTarget || item.targetText || task.targetText || task.speechTarget || item.prompt || 'No speech target provided.';
    }

    return item.prompt || task.prompt || item.question || item.instructions || 'No writing prompt provided.';
  }

  function getReviewAnswer(item, type) {
    if (type === 'speech') {
      return item.transcript || item.studentTranscript || item.answer || '[VOICE_RECORDING_SUBMITTED]';
    }

    return item.content || item.answer || item.studentAnswer || item.response || 'No answer submitted.';
  }

  function buildReviewStudentBuckets(writingItems, speechItems) {
    const bucketMap = new Map();

    [...writingItems.map((item) => ({ ...item, reviewType: 'writing' })), ...speechItems.map((item) => ({ ...item, reviewType: 'speech' }))].forEach((item) => {
      const key = getReviewStudentKey(item);

      if (!bucketMap.has(key)) {
        bucketMap.set(key, {
          key,
          name: getReviewStudentName(item),
          gradeSection: getReviewGradeSection(item),
          writing: [],
          speech: [],
        });
      }

      bucketMap.get(key)[item.reviewType].push(item);
    });

    return Array.from(bucketMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  function getReviewSubmissionId(item) {
    return item.submissionId || item.id;
  }

  function getReviewDraftKey(type, item) {
    return `${type}-${getReviewSubmissionId(item) || item.createdAt || getReviewStudentName(item)}`;
  }

  function getReviewDraft(type, item) {
    const key = getReviewDraftKey(type, item);

    return reviewDrafts[key] || {
      score: item.score === 0 || item.score ? String(item.score) : '',
      feedback: item.feedback || item.teacherFeedback || '',
    };
  }

  function updateReviewDraft(type, item, field, value) {
    const key = getReviewDraftKey(type, item);

    setReviewDrafts((current) => ({
      ...current,
      [key]: {
        ...getReviewDraft(type, item),
        ...current[key],
        [field]: value,
      },
    }));
  }

  async function submitWritingReview(item) {
    const submissionId = getReviewSubmissionId(item);

    if (!submissionId) {
      Alert.alert('Missing submission', 'This writing submission cannot be reviewed because its ID is missing.');
      return;
    }

    const draft = getReviewDraft('writing', item);
    const score = Number.parseInt(draft.score, 10);

    if (!Number.isInteger(score) || score < 1 || score > 10) {
      Alert.alert('Score required', 'Enter a whole number score from 1 to 10.');
      return;
    }

    const actionKey = `writing-review-${submissionId}`;

    if (busy) {
      return;
    }

    setBusy(actionKey);

    try {
      await gradeWritingSubmission(submissionId, {
        score,
        feedback: draft.feedback || '',
      });

      setWorkspaceNotice({
        type: 'success',
        text: 'Writing review saved.',
      });

      setReviewDrafts((current) => {
        const next = { ...current };
        delete next[getReviewDraftKey('writing', item)];
        return next;
      });

      setReviewModal(null);
      await load();
    } catch (err) {
      Alert.alert(
        'Review failed',
        err?.response?.data?.message || err?.message || 'Unable to save the writing review.'
      );
    } finally {
      setBusy('');
    }
  }

  async function submitSpeechReview(item) {
    const attemptId = getReviewSubmissionId(item);

    if (!attemptId) {
      Alert.alert('Missing attempt', 'This speech attempt cannot be reviewed because its ID is missing.');
      return;
    }

    const draft = getReviewDraft('speech', item);
    const rawScore = String(draft.score || '').trim();
    const score = rawScore ? Number.parseInt(rawScore, 10) : null;

    if (rawScore && (!Number.isInteger(score) || score < 1 || score > 10)) {
      Alert.alert('Score invalid', 'Enter a whole number score from 1 to 10, or leave it blank.');
      return;
    }

    if (!rawScore && !String(draft.feedback || '').trim()) {
      Alert.alert('Review required', 'Add feedback or a score before saving the speech review.');
      return;
    }

    const actionKey = `speech-review-${attemptId}`;

    if (busy) {
      return;
    }

    setBusy(actionKey);

    try {
      await reviewSpeechAttempt(attemptId, {
        score,
        feedback: draft.feedback || '',
      });

      setWorkspaceNotice({
        type: 'success',
        text: 'Speech review saved.',
      });

      setReviewDrafts((current) => {
        const next = { ...current };
        delete next[getReviewDraftKey('speech', item)];
        return next;
      });

      setReviewModal(null);
      await load();
    } catch (err) {
      Alert.alert(
        'Review failed',
        err?.response?.data?.message || err?.message || 'Unable to save the speech review.'
      );
    } finally {
      setBusy('');
    }
  }

  function getReviewCanGrade(item, type) {
    const status = item.status || item.reviewStatus || 'pending';
    const isWriting = type === 'writing';
    const submissionId = getReviewSubmissionId(item);
    const isGraded = isWriting && (status === 'graded' || item.score === 0 || item.score);
    const isAutoChecked = isWriting && status === 'auto_checked';

    return isWriting && submissionId && !isGraded && !isAutoChecked && item.reviewEligible !== false;
  }

  function renderCanvasSubmissionCard(item, type) {
    const isSpeech = type === 'speech';
    const title = isSpeech ? 'Speech attempt' : 'Writing submission';
    const subject = getReviewSubject(item);
    const status = item.status || item.reviewStatus || 'pending';
    const submittedAt = item.submittedAt || item.createdAt || item.updatedAt;
    const canGrade = getReviewCanGrade(item, type);

    return (
      <View key={`${type}-${getReviewSubmissionId(item) || item.createdAt}`} style={styles.canvasSubmissionCard}>
        <View style={styles.canvasSubmissionHeader}>
          <View style={styles.flex}>
            <Text style={styles.canvasSubmissionType}>{title}</Text>
            <Text style={styles.canvasSubmissionTitle}>{getReviewLessonTitle(item)}</Text>
            <Text style={styles.canvasSubmissionMeta}>
              {subject ? `${subject} • ` : ''}{formatReviewDate(submittedAt)}
            </Text>
          </View>

          <Text style={styles.canvasStatusChip}>{status}</Text>
        </View>

        <View style={styles.canvasBlock}>
          <Text style={styles.canvasBlockLabel}>{isSpeech ? 'Speech target' : 'Writing prompt'}</Text>
          <Text numberOfLines={3} style={styles.canvasBlockText}>{getReviewPrompt(item, type)}</Text>
        </View>

        <View style={styles.canvasBlock}>
          <Text style={styles.canvasBlockLabel}>{isSpeech ? 'Student transcript' : 'Student answer'}</Text>
          <Text numberOfLines={4} style={styles.canvasAnswerText}>{getReviewAnswer(item, type)}</Text>
        </View>

        <TouchableOpacity
          style={styles.canvasOpenButton}
          onPress={() => setReviewModal({ type, item })}
        >
          <Text style={styles.canvasOpenButtonText}>
            {canGrade ? 'Open Grading' : isSpeech ? 'Open Review' : 'View Submission'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }



  function getReviewItemGradeLevel(item = {}) {
    const candidates = [
      item.gradeLevel,
      item.grade,
      item.studentGradeLevel,
      item.studentGrade,
      item.Student?.gradeLevel,
      item.Student?.grade,
      item.student?.gradeLevel,
      item.student?.grade,
      item.learner?.gradeLevel,
      item.learner?.grade,
      item.user?.gradeLevel,
      item.user?.grade,
      item.submission?.gradeLevel,
      item.submission?.student?.gradeLevel,
      item.speechAttempt?.gradeLevel,
      item.speechAttempt?.student?.gradeLevel,
      item.SpeechAttempt?.gradeLevel,
      item.SpeechAttempt?.Student?.gradeLevel,
    ];

    const found = candidates.find((value) => value !== undefined && value !== null && String(value).trim());

    if (!found) {
      return '';
    }

    const normalized = String(found).replace(/grade/ig, '').trim();
    const number = Number(normalized);

    return Number.isFinite(number) && number > 0 ? String(number) : normalized;
  }

  function getReviewGradeFilterOptions() {
    const queue = reviewQueue || {};
    const rows = Object.values(queue).flatMap((value) => Array.isArray(value) ? value : []);
    const gradeLevels = [...new Set(rows.map(getReviewItemGradeLevel).filter(Boolean))].sort((a, b) => {
      const left = Number(a);
      const right = Number(b);

      if (Number.isFinite(left) && Number.isFinite(right)) {
        return left - right;
      }

      return String(a).localeCompare(String(b));
    });

    const defaultGradeLevels = ['1', '2', '3', '4', '5', '6'];
    const allGradeLevels = [...new Set([...defaultGradeLevels, ...gradeLevels])].sort((a, b) => {
      const left = Number(a);
      const right = Number(b);

      if (Number.isFinite(left) && Number.isFinite(right)) {
        return left - right;
      }

      return String(a).localeCompare(String(b));
    });

    return [
      { value: 'all', label: 'All Grade Levels' },
      ...allGradeLevels.map((grade) => ({
        value: String(grade),
        label: `Grade ${grade}`,
      })),
    ];
  }

  function filterReviewRowsByGrade(rows = []) {
    const list = Array.isArray(rows) ? rows : [];

    if (!reviewGradeFilter || reviewGradeFilter === 'all') {
      return list;
    }

    return list.filter((item) => String(getReviewItemGradeLevel(item)) === String(reviewGradeFilter));
  }

  function getSpeechReviewAttemptId(item = {}) {
    const candidates = [
      item.id,
      item.attemptId,
      item.speechAttemptId,
      item.speech_attempt_id,
      item.submissionId,
      item.SpeechAttempt?.id,
      item.speechAttempt?.id,
      item.attempt?.id,
    ];

    const found = candidates.find((value) => value !== undefined && value !== null && String(value).trim());

    return found ? String(found) : '';
  }

  function getSpeechReviewDraftKey(item = {}) {
    return `speech-${getSpeechReviewAttemptId(item) || item.studentId || item.studentName || Date.now()}`;
  }

  function normalizeSpeechReviewScoreInput(value) {
    return String(value || '').replace(/[^0-9]/g, '').slice(0, 2);
  }

  function isValidSpeechReviewScore(value) {
    const scoreText = String(value ?? '').trim();

    if (!scoreText) {
      return false;
    }

    const score = Number(scoreText);

    return Number.isInteger(score) && score >= 1 && score <= 10;
  }

  function getSpeechReviewRecordingUrl(item = {}) {
    return (
      item.recordingUrl ||
      item.audioUrl ||
      item.fileUrl ||
      item.url ||
      item.recording_url ||
      item.audio_url ||
      item.file_url ||
      item.SpeechAttempt?.recordingUrl ||
      item.speechAttempt?.recordingUrl ||
      item.audio?.url ||
      ''
    );
  }

  function getSpeechReviewTargetText(item = {}) {
    return cleanTeacherLessonText(
      item.targetText ||
      item.speechTarget ||
      item.speech_target ||
      item.expectedText ||
      item.prompt ||
      item.activityTitle ||
      item.activity?.targetText ||
      item.activity?.speechTarget ||
      item.SpeechTask?.targetText ||
      item.speechTask?.targetText ||
      ''
    );
  }

  function updateSpeechReviewDraft(item = {}, patch = {}) {
    const key = getSpeechReviewDraftKey(item);

    setReviewDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        ...patch,
      },
    }));
  }

  async function submitSpeechAttemptReview(item = {}) {
    const attemptId = getSpeechReviewAttemptId(item);
    const draftKey = getSpeechReviewDraftKey(item);
    const draft = reviewDrafts[draftKey] || {};
    const score = Number(draft.score ?? item.score ?? item.rating ?? '');

    if (!attemptId) {
      Alert.alert('Speech Review', 'Missing speech attempt ID.');
      return;
    }

    if (!isValidSpeechReviewScore(draft.score ?? item.score ?? item.rating ?? '')) {
      Alert.alert('Speech Review', 'Enter a valid whole number score from 1 to 10 only.');
      return;
    }

    const feedback = cleanTeacherLessonText(
      draft.feedback ??
      item.teacherFeedback ??
      item.feedback ??
      ''
    );

    const saved = await run(
      `speech-review-${attemptId}`,
      () => reviewSpeechAttempt(attemptId, {
        score,
        rating: score,
        feedback,
        teacherFeedback: feedback,
      }),
      'Speech attempt scored.'
    );

    if (saved) {
      setReviewDrafts((current) => {
        const next = { ...current };
        delete next[draftKey];
        return next;
      });
    }
  }

  function renderReviewGradingModal() {
    if (!reviewModal) {
      return null;
    }

    const { type, item } = reviewModal;
    const isSpeech = type === 'speech';
    const isWriting = type === 'writing';
    const title = isSpeech ? 'Speech attempt' : 'Writing submission';
    const subject = getReviewSubject(item);
    const status = item.status || item.reviewStatus || 'pending';
    const submittedAt = item.submittedAt || item.createdAt || item.updatedAt;
    const submissionId = getReviewSubmissionId(item);
    const actionKey = `writing-review-${submissionId}`;
    const draft = getReviewDraft(type, item);
    const canGrade = getReviewCanGrade(item, type);
    const isGraded = isWriting && (status === 'graded' || item.score === 0 || item.score);
    const isAutoChecked = isWriting && status === 'auto_checked';

    return (
      <Modal
        visible={Boolean(reviewModal)}
        transparent
        animationType="slide"
        onRequestClose={() => setReviewModal(null)}
      >
        <View style={styles.canvasGradingBackdrop}>
          <View style={styles.canvasGradingSheet}>
            <View style={styles.canvasGradingHeader}>
              <View style={styles.flex}>
                <Text style={styles.canvasSubmissionType}>{title}</Text>
                <Text style={styles.canvasGradingTitle}>{getReviewLessonTitle(item)}</Text>
                <Text style={styles.canvasSubmissionMeta}>
                  {subject ? `${subject} • ` : ''}{formatReviewDate(submittedAt)} • {status}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.canvasCloseButton}
                onPress={() => setReviewModal(null)}
              >
                <Text style={styles.canvasCloseButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.canvasGradingBody}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.canvasBlock}>
                <Text style={styles.canvasBlockLabel}>{isSpeech ? 'Speech target' : 'Writing prompt'}</Text>
                <Text style={styles.canvasBlockText}>{getReviewPrompt(item, type)}</Text>
              </View>

              <View style={styles.canvasBlock}>
                <Text style={styles.canvasBlockLabel}>{isSpeech ? 'Student transcript' : 'Student answer'}</Text>
                <Text style={styles.canvasAnswerText}>{getReviewAnswer(item, type)}</Text>
              </View>

              {isSpeech && item.audioUrl ? (
                <TouchableOpacity
                  style={styles.canvasPlayButton}
                  onPress={() => Linking.openURL(item.audioUrl)}
                >
                  <Text style={styles.canvasPlayButtonText}>▶ Play recording</Text>
                </TouchableOpacity>
              ) : null}

              {isWriting ? (
                <View style={styles.canvasReviewPanel}>
                  <Text style={styles.canvasBlockLabel}>Teacher grading</Text>

                  {isGraded || isAutoChecked ? (
                    <>
                      <Text style={styles.canvasBlockText}>
                        {isAutoChecked ? 'Auto-checked submission.' : `Score: ${item.score ?? draft.score}/10`}
                      </Text>
                      {item.feedback || item.teacherFeedback ? (
                        <Text style={styles.canvasBlockText}>{item.feedback || item.teacherFeedback}</Text>
                      ) : null}
                    </>
                  ) : canGrade ? (
                    <>
                      <View style={styles.canvasScoreRow}>
                        <Text style={styles.canvasScoreLabel}>Score /10</Text>
                        <TextInput
                          value={draft.score}
                          onChangeText={(value) => updateReviewDraft('writing', item, 'score', value.replace(/[^0-9]/g, '').slice(0, 2))}
                          keyboardType="number-pad"
                          placeholder="1-10"
                          placeholderTextColor="#94A3B8"
                          style={styles.canvasScoreInput}
                        />
                      </View>

                      <TextInput
                        value={draft.feedback}
                        onChangeText={(value) => updateReviewDraft('writing', item, 'feedback', value)}
                        multiline
                        placeholder="Write feedback for this learner..."
                        placeholderTextColor="#94A3B8"
                        style={styles.canvasFeedbackInput}
                      />

                      <TouchableOpacity
                        style={[styles.canvasReviewButton, busy === actionKey && styles.canvasReviewButtonDisabled]}
                        disabled={Boolean(busy)}
                        onPress={() => submitWritingReview(item)}
                      >
                        <Text style={styles.canvasReviewButtonText}>
                          {busy === actionKey ? 'Saving Review...' : 'Save Review'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.canvasBlockText}>
                      This writing submission is not eligible for teacher grading.
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.canvasReviewPanel}>
                  <Text style={styles.canvasBlockLabel}>Teacher speech review</Text>

                  <View style={styles.canvasScoreRow}>
                    <Text style={styles.canvasScoreLabel}>Score /10</Text>
                    <TextInput
                      value={draft.score}
                      onChangeText={(value) => updateReviewDraft('speech', item, 'score', value.replace(/[^0-9]/g, '').slice(0, 2))}
                      keyboardType="number-pad"
                      placeholder="Optional"
                      placeholderTextColor="#94A3B8"
                      style={styles.canvasScoreInput}
                    />
                  </View>

                  <TextInput
                    value={draft.feedback}
                    onChangeText={(value) => updateReviewDraft('speech', item, 'feedback', value)}
                    multiline
                    placeholder="Comment on pronunciation, clarity, fluency, or corrections..."
                    placeholderTextColor="#94A3B8"
                    style={styles.canvasFeedbackInput}
                  />

                  <TouchableOpacity
                    style={[styles.canvasReviewButton, busy === `speech-review-${submissionId}` && styles.canvasReviewButtonDisabled]}
                    disabled={Boolean(busy)}
                    onPress={() => submitSpeechReview(item)}
                  >
                    <Text style={styles.canvasReviewButtonText}>
                      {busy === `speech-review-${submissionId}` ? 'Saving Review...' : 'Save Speech Review'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderCanvasStudentButton(bucket) {
    const active = selectedReviewStudentKey === bucket.key;
    const count = bucket.writing.length + bucket.speech.length;

    return (
      <TouchableOpacity
        key={bucket.key}
        style={[styles.canvasStudentButton, active && styles.canvasStudentButtonActive]}
        onPress={() => setSelectedReviewStudentKey(bucket.key)}
      >
        <View style={styles.flex}>
          <Text style={[styles.canvasStudentName, active && styles.canvasStudentNameActive]}>
            {bucket.name}
          </Text>
          <Text style={[styles.canvasStudentMeta, active && styles.canvasStudentMetaActive]}>
            {bucket.gradeSection}
          </Text>
        </View>

        <View style={styles.canvasStudentCount}>
          <Text style={styles.canvasStudentCountText}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderReview() {
    const writingReviewRows = filterReviewRowsByGrade(Array.isArray(reviewQueue?.writing) ? reviewQueue.writing : []);
    const pendingWritingReviewRows = writingReviewRows.filter((item) => (
      String(item.reviewStatus || 'pending').toLowerCase() === 'pending' &&
      Boolean(item.reviewEligible) &&
      Number(item.student?.gradeLevel || item.lesson?.gradeLevel || 0) >= 3
    ));
    const gradedWritingReviewRows = writingReviewRows
      .filter((item) => String(item.reviewStatus || '').toLowerCase() === 'graded')
      .slice(0, 8);
    const speechReviewRows = (Array.isArray(reviewQueue?.speech) ? reviewQueue.speech : []).slice(0, 12);

    function reviewGrade(item) {
      return item.student?.gradeLevel || item.lesson?.gradeLevel || '-';
    }

    function reviewSection(item) {
      return item.student?.section || 'No section';
    }

    function reviewSubject(item) {
      return item.lesson?.subject || 'Subject';
    }

    function reviewLessonTitle(item) {
      return item.lesson?.title || 'Lesson';
    }

    function reviewStudentName(item) {
      return item.student?.name || item.studentName || 'Student';
    }

    function renderReviewIdentity(item, statusLabel = '') {
      return (
        <View style={styles.reviewIdentityCard}>
          <View style={styles.reviewAvatar}>
            <Text style={styles.reviewAvatarText}>{String(reviewStudentName(item)).charAt(0).toUpperCase() || 'S'}</Text>
          </View>
          <View style={styles.reviewIdentityContent}>
            <Text style={styles.reviewStudentName}>{reviewStudentName(item)}</Text>
            <Text style={styles.reviewStudentMeta}>
              Grade {reviewGrade(item)} • {reviewSection(item)} • {reviewSubject(item)}
            </Text>
            <Text style={styles.reviewLessonLine}>Lesson: {reviewLessonTitle(item)}</Text>
          </View>
          {statusLabel ? (
            <View style={styles.reviewMiniPill}>
              <Text style={styles.reviewMiniPillText}>{statusLabel}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    async function saveWritingGrade(item) {
      const submissionId = getReviewSubmissionId(item);
      if (!submissionId || !gradeWritingSubmission) return;

      const key = getReviewDraftKey('writing', item);
      const draft = getReviewDraft('writing', item);
      const score = Number(draft.score || 0);
      const feedback = String(draft.feedback || '').trim();

      if (!Number.isInteger(score) || score < 1 || score > 10) {
        Alert.alert('Writing Review', 'Please select a score from 1 to 10.');
        return;
      }

      setReviewDrafts((current) => ({
        ...current,
        [key]: {
          ...(current[key] || draft),
          score: String(score),
          feedback,
          saving: true,
        },
      }));

      try {
        await gradeWritingSubmission(submissionId, { score, feedback });
        Alert.alert('Writing Review', 'Grade saved successfully.');
        await load();
      } catch (err) {
        Alert.alert('Writing Review', err.message || 'Unable to save writing grade.');
      } finally {
        setReviewDrafts((current) => ({
          ...current,
          [key]: {
            ...(current[key] || draft),
            saving: false,
          },
        }));
      }
    }

    return (
      <>
        <View style={styles.reviewSummaryGrid}>
          {[
            ['✍️', pendingWritingReviewRows.length, 'Pending Writing'],
            ['⭐', gradedWritingReviewRows.length, 'Graded Writing'],
            ['🎙️', speechReviewRows.length, 'Speech Attempts'],
          ].map(([icon, value, label]) => (
            <View key={label} style={styles.reviewMetricCard}>
              <Text style={styles.reviewMetricIcon}>{icon}</Text>
              <Text style={styles.reviewMetricValue}>{value}</Text>
              <Text style={styles.reviewMetricLabel}>{label}</Text>
            </View>
          ))}
        </View>

<SectionCard>
          <Text style={styles.cardTitle}>Student Submission Review</Text>
          <Text style={styles.muted}>Filter student writing submissions and speech attempts by grade level.</Text>
          <SelectMenu
            label="Grade Level"
            value={reviewGradeFilter}
            options={getReviewGradeFilterOptions()}
            onSelect={(value) => {
              setReviewGradeFilter(value);
              setShowAllSpeechAttempts(false);
            }}
          />
        </SectionCard>

        <SectionCard>
          <View style={styles.reviewSectionHeader}>
            <View style={styles.flex1}>
              <Text style={styles.reviewSectionLabel}>Writing Submissions</Text>
              <Text style={styles.cardTitle}>Writing Submissions for Grading</Text>
              <Text style={styles.muted}>
                Student writing submissions that need teacher grading will appear here.</Text>
            </View>
            <View style={styles.reviewMiniPill}>
              <Text style={styles.reviewMiniPillText}>✍️ {pendingWritingReviewRows.length} pending</Text>
            </View>
          </View>

          {pendingWritingReviewRows.length ? pendingWritingReviewRows.map((item) => {
            const draft = getReviewDraft('writing', item);
            const isSaving = Boolean(draft.saving);
            return (
              <View key={`writing-review-${getReviewSubmissionId(item)}`} style={styles.reviewCard}>
                {renderReviewIdentity(item, 'Pending Grade')}

                <View style={styles.reviewEvidenceGrid}>
                  <View style={styles.reviewEvidenceItem}>
                    <Text style={styles.reviewEvidenceLabel}>Submitted Date</Text>
                    <Text style={styles.reviewEvidenceValue}>{formatReviewDate(item.submittedAt)}</Text>
                  </View>
                  <View style={styles.reviewEvidenceItem}>
                    <Text style={styles.reviewEvidenceLabel}>XP Rule</Text>
                    <Text style={styles.reviewEvidenceValue}>Score 1–10 = +1 to +10 XP</Text>
                  </View>
                </View>

                <View style={styles.reviewContentBlock}>
                  <Text style={styles.reviewBlockLabel}>Writing Prompt</Text>
                  <Text style={styles.reviewBlockText}>{item.task?.prompt || 'No prompt available.'}</Text>
                </View>

                <View style={styles.reviewContentBlock}>
                  <Text style={styles.reviewBlockLabel}>Student Answer</Text>
                  <Text style={styles.reviewBlockText}>{item.content || 'No answer submitted.'}</Text>
                </View>

                <SelectMenu
                  label="Score"
                  value={draft.score || ''}
                  options={[
                    { value: '', label: 'Select score from 1 to 10' },
                    ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => ({
                      value: String(score),
                      label: `${score}/10 → +${score} XP`,
                    })),
                  ]}
                  onSelect={(value) => updateReviewDraft('writing', item, 'score', value)}
                />

                <Text style={styles.reviewInputLabel}>Teacher Feedback</Text>
                <TextInput
                  style={[styles.reviewTextInput, styles.reviewFeedbackInput]}
                  value={draft.feedback || ''}
                  onChangeText={(value) => updateReviewDraft('writing', item, 'feedback', value)}
                  placeholder="Write feedback for the student..."
                  placeholderTextColor="#8aa39b"
                  multiline
                />

                <TouchableOpacity
                  style={[styles.primaryAction, isSaving && styles.disabledAction]}
                  disabled={isSaving}
                  onPress={() => saveWritingGrade(item)}
                >
                  <Text style={styles.primaryActionText}>{isSaving ? 'Saving Grade...' : 'Save Grade'}</Text>
                </TouchableOpacity>
              </View>
            );
          }) : (
            <View style={styles.reviewEmptyPanel}>
              <Text style={styles.reviewEmptyIcon}>✅</Text>
              <Text style={styles.rowTitle}>No pending writing submissions.</Text>
              <Text style={styles.muted}>Student writing submissions waiting for grades will appear here.</Text>
            </View>
          )}
        </SectionCard>

        <SectionCard>
          {(() => {
            const speechRows = filterReviewRowsByGrade(Array.isArray(reviewQueue?.speech) ? reviewQueue.speech : []);
            const visibleSpeechRows = showAllSpeechAttempts ? speechRows : speechRows.slice(0, 1);
            const hiddenSpeechCount = Math.max(0, speechRows.length - visibleSpeechRows.length);

            return (
              <>
                <View style={styles.reviewSectionHeader}>
                  <View style={styles.flex1}>
                    <Text style={styles.reviewSectionLabel}>Speech Attempts</Text>
                    <Text style={styles.cardTitle}>Speech Attempts for Scoring</Text>
                    <Text style={styles.muted}>
                      Listen to each attempt, give a score from 1–10, and add optional feedback.
                    </Text>
                  </View>
                  <View style={styles.reviewMiniPill}>
                    <Text style={styles.reviewMiniPillText}>🎙️ {speechRows.length} attempt{speechRows.length === 1 ? '' : 's'}</Text>
                  </View>
                </View>

                {speechRows.length ? (
                  <>
                    {visibleSpeechRows.map((item) => {
                  const attemptId = getSpeechReviewAttemptId(item);
                  const draftKey = getSpeechReviewDraftKey(item);
                  const speechDraft = reviewDrafts[draftKey] || {};
                  const scoreValue = String(speechDraft.score ?? item.score ?? item.rating ?? '');
                  const feedbackValue = String(speechDraft.feedback ?? item.teacherFeedback ?? item.feedback ?? '');
                  const recordingUrl = getSpeechReviewRecordingUrl(item);
                  const targetText = getSpeechReviewTargetText(item);

                  return (
                    <View key={`speech-review-${attemptId || draftKey}`} style={styles.reviewCardCompact}>
                      {renderReviewIdentity(item, item.lessonTitle || item.activityTitle || 'Speech attempt')}

                      {targetText ? (
                        <Text style={styles.reviewFeedbackText}>Target Text: {targetText}</Text>
                      ) : null}

                      {recordingUrl ? (
                        <>
                          <Text selectable style={styles.muted}>Recording: {recordingUrl}</Text>
                          <SmallButton
                            tone="slate"
                            onPress={() => Linking.openURL(recordingUrl)}
                          >
                            Open Recording
                          </SmallButton>
                        </>
                      ) : (
                        <Text style={styles.muted}>No recording link available.</Text>
                      )}

                      <Field
                        label="Speech Score (1–10)"
                        value={scoreValue}
                        keyboardType="numeric"
                        onChangeText={(score) =>
                          updateSpeechReviewDraft(item, {
                            score: normalizeSpeechReviewScoreInput(score),
                          })
                        }
                        placeholder="Score"
                      />

                      {scoreValue && !isValidSpeechReviewScore(scoreValue) ? (
                        <Text style={styles.error}>Score must be a whole number from 1 to 10 only.</Text>
                      ) : null}

                      <Field
                        label="Teacher Feedback"
                        value={feedbackValue}
                        onChangeText={(feedback) => updateSpeechReviewDraft(item, { feedback })}
                        placeholder="Optional feedback"
                        multiline
                      />

                      <SmallButton
                        disabled={Boolean(busy) || !isValidSpeechReviewScore(scoreValue)}
                        onPress={() => submitSpeechAttemptReview(item)}
                      >
                        Save Speech Score
                      </SmallButton>
                    </View>
                  );
                    })}

                    {speechRows.length > 1 ? (
                  <View style={styles.buttonRow}>
                    <SmallButton
                      tone="slate"
                      onPress={() => setShowAllSpeechAttempts((current) => !current)}
                    >
                      {showAllSpeechAttempts
                        ? 'Show Less'
                        : `View All Speech Attempts (${hiddenSpeechCount} more)`}
                    </SmallButton>
                  </View>
                    ) : null}
                  </>
                ) : (
                  <View style={styles.reviewEmptyPanel}>
                    <Text style={styles.reviewEmptyIcon}>🎙️</Text>
                    <Text style={styles.rowTitle}>No speech attempts yet.</Text>
                    <Text style={styles.muted}>Student speech attempts will appear here.</Text>
                  </View>
                )}
              </>
            );
          })()}
        </SectionCard>

        <SectionCard>
          <View style={styles.reviewSectionHeader}>
            <View style={styles.flex1}>
              <Text style={styles.reviewSectionLabel}>Recently Graded</Text>
              <Text style={styles.cardTitle}>Recently Graded Writing</Text>
            </View>
            <View style={styles.reviewMiniPill}>
              <Text style={styles.reviewMiniPillText}>⭐ {gradedWritingReviewRows.length} graded</Text>
            </View>
          </View>

          {gradedWritingReviewRows.length ? gradedWritingReviewRows.map((item) => (
            <View key={`graded-writing-${getReviewSubmissionId(item)}`} style={styles.reviewCardCompact}>
              {renderReviewIdentity(item, `Score ${item.score ?? '-'} / 10`)}
              <View style={styles.reviewXpPill}>
                <Text style={styles.reviewXpPillText}>+{item.xpPreview ?? item.score ?? 0} XP</Text>
              </View>
              <Text style={styles.reviewFeedbackText}>
                Feedback: {item.feedback || item.teacherFeedback || 'No feedback added.'}
              </Text>
            </View>
          )) : (
            <View style={styles.reviewEmptyPanel}>
              <Text style={styles.reviewEmptyIcon}>⭐</Text>
              <Text style={styles.rowTitle}>No graded writing yet.</Text>
              <Text style={styles.muted}>Saved grades will appear here after teachers review writing submissions.</Text>
            </View>
          )}
        </SectionCard>
      </>
    );
  }

  async function handleCreateStudentAccount() {
    const name = String(studentForm.name || '').replace(/\s+/g, ' ').trim();
    const section = String(studentForm.section || '').replace(/\s+/g, ' ').trim();
    const gradeLevel = Number(studentForm.gradeLevel);

    if (!name) {
      Alert.alert('Student Account', 'Student name is required.');
      return;
    }

    if (![1, 2, 3, 4, 5, 6].includes(gradeLevel)) {
      Alert.alert('Student Account', 'Grade must be from 1 to 6.');
      return;
    }

    if (!section) {
      Alert.alert('Student Account', 'Section is required.');
      return;
    }

    if (!canUseGradeSection(gradeLevel, section)) {
      Alert.alert('Student Account', 'You can only create students for your assigned grade level or section.');
      return;
    }

    setBusy('student-create');
    try {
      const data = await createStudentAccount({ name, gradeLevel, section });
      const createdStudent = {
        ...(data?.student || data?.learner || data?.data || data || {}),
        name: data?.student?.name || data?.name || name,
        gradeLevel,
        section,
      };
      const createdStudentId = createdStudent.id || createdStudent.studentId || createdStudent.studentCode || `${name}-${gradeLevel}-${section}`;

      function mergeCreatedStudentRows(rows = []) {
        return [
          createdStudent,
          ...rows.filter((student) => {
            const studentId = student.id || student.studentId || student.studentCode || `${student.name}-${student.gradeLevel}-${student.section}`;
            return String(studentId) !== String(createdStudentId);
          }),
        ];
      }

      setMonitoring((current) => ({
        ...current,
        rows: mergeCreatedStudentRows(current.rows || []),
      }));

      setStudentReport((current) => mergeCreatedStudentRows(current || []));
      setAllStudents((current) => mergeCreatedStudentRows(current || []));
      Alert.alert('Student Account', `Created account for ${createdStudent.name || name}. Temporary password: ${data?.temporaryPassword || 'Not returned'}`);
      setStudentForm({ name: '', gradeLevel: String(gradeLevel), section });
      Alert.alert(
        'Student Account Created',
        `Username: ${data.username || data.student?.studentCode || 'Created'}\nTemporary PIN: ${data.temporaryPin || 'Check response'}`
      );
      await load();
    } catch (err) {
      Alert.alert('Student Account', err.message || 'Unable to create student account.');
    } finally {
      setBusy('');
    }
  }

  function renderStudents() {
    return (
      <>
        <SectionCard>
          <Text style={styles.cardTitle}>Add Student Account</Text>
          <Field
            label="Student Name"
            value={studentForm.name}
            onChangeText={(name) => setStudentForm((current) => ({ ...current, name }))}
            placeholder="Full name"
          />

            <SelectMenu
              label="Student Grade"
              value={studentForm.gradeLevel}
              options={usableGradeOptions}
              disabled={busy === 'student-create'}
              onSelect={(gradeLevel) => setStudentForm((current) => ({ ...current, gradeLevel }))}
            />

          {studentSectionOptions.length ? (
            <SelectMenu
              label="Section Suggestions"
              value={studentForm.section}
              options={studentSectionOptions}
              disabled={busy === 'student-create'}
              placeholder="Choose existing section"
              onSelect={(section) => setStudentForm((current) => ({ ...current, section }))}
            />
          ) : null}

          <Field
            label={studentSectionOptions.length ? 'Section / Custom Section' : 'Section'}
            value={studentForm.section}
            onChangeText={(section) => setStudentForm((current) => ({ ...current, section }))}
            placeholder="Section name"
          />

          <SmallButton disabled={Boolean(busy)} onPress={handleCreateStudentAccount}>
            {busy === 'student-create' ? 'Creating...' : 'Create Student Account'}
          </SmallButton>

          {createdStudentAccount && (
            <View style={[styles.studentCard, { marginTop: 12, borderBottomWidth: 0 }]}>
              <Text style={styles.studentAvatar}>✅</Text>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>Student account created</Text>
                <Text style={styles.muted}>Username: {createdStudentAccount.username || createdStudentAccount.student?.studentCode || '—'}</Text>
                <Text style={styles.muted}>Temporary PIN: {createdStudentAccount.temporaryPin || '—'}</Text>
              </View>
            </View>
          )}
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Student Monitoring Report</Text>
        {currentStudents.map((student) => (
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
        {!currentStudents.length && <Text style={styles.muted}>No current students yet.</Text>}
        </SectionCard>
      </>
    );
  }

  function renderReports() {
    return (
      <>
        <SectionCard>
          <Text style={styles.cardTitle}>Student Monitoring Report Downloads</Text>

          <SmallButton
            disabled={Boolean(busy) || Boolean(reportBusy)}
            onPress={() =>
              runTeacherReportExport('csv', () =>
                downloadTextReport({
                  title: 'Teacher CSV Monitoring Report',
                  filename: 'tuklas-talino-teacher-monitoring-report.csv',
                  mimeType: 'text/csv',
                  loader: getSummaryReportCsv,
                })
              )
            }
          >
            {reportBusy === 'csv' ? 'Preparing CSV...' : 'CSV Monitoring Report'}
          </SmallButton>

          <SmallButton
            disabled={Boolean(busy) || Boolean(reportBusy)}
            onPress={() =>
              runTeacherReportExport('pdf', () =>
                downloadPdfReport({
                  title: 'Teacher PDF Monitoring Summary',
                  filename: 'tuklas-talino-teacher-monitoring-summary-report.pdf',
                  loader: getSummaryReportPdf,
                })
              )
            }
          >
            {reportBusy === 'pdf' ? 'Preparing PDF...' : 'PDF Monitoring Summary'}
          </SmallButton>

          {reportBusy ? (
            <Text style={styles.muted}>
              Preparing report file. The export popup will open shortly...
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardTitle}>Current Monitoring Summary</Text>
          <Text style={styles.body}>Students: {reportSummary?.students || 0}</Text>
          <Text style={styles.body}>Published lessons: {reportSummary?.lessons || 0}</Text>
          <Text style={styles.body}>Total XP: {reportSummary?.totalXp || 0}</Text>
          <Text style={styles.body}>Average progress: {reportSummary?.averageProgress || 0}%</Text>
          <Text style={styles.body}>Completions: {reportSummary?.completions || 0}</Text>
        </SectionCard>
      </>
    );
  }

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            styles.teacherScrollContentInset,
            { paddingBottom: Math.max(insets.bottom + 32, 48) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>Teacher Workspace</Text>
              <Text style={styles.subtitle}>Manage lessons, groups, assessments, and reports.</Text>
            </View>
            <SmallButton tone="slate" onPress={confirmLogout}>Mag-logout</SmallButton>
          </View>

          <View style={styles.workspaceHero}>
            <View style={styles.workspaceHeroIcon}>
              <Text style={styles.workspaceHeroEmoji}>📚</Text>
            </View>

            <View style={styles.workspaceHeroCopy}>
              <Text style={styles.workspaceHeroKicker}>TEACHING HUB</Text>
              <Text style={styles.workspaceHeroTitle}>
                Guide lessons, groups, and learner progress safely.
              </Text>

              <View style={styles.workspaceHeroChips}>
                <Text style={styles.workspaceHeroChip}>✨ Lessons</Text>
                <Text style={styles.workspaceHeroChip}>✅ Checks</Text>
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

          {error ? (
            <SectionCard>
              <Text style={styles.error}>{error}</Text>
              <SmallButton onPress={load}>Try Again</SmallButton>
            </SectionCard>
          ) : null}
        {section === 'dashboard' && renderDashboard()}
        {section === 'lessons' && renderBuilder()}
        {section === 'groups' && renderGroups()}
        {section === 'assessment' && renderAssessment()}
        {section === 'review' && renderReview()}
        {section === 'students' && renderStudents()}
        {section === 'reports' && renderReports()}

          {renderReviewGradingModal()}

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
                <Text style={styles.workspaceLogoutCancelText}>Cancel</Text>
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
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  teacherScrollContentInset: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  canvasOpenButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  canvasOpenButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },
  canvasGradingBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.44)',
    justifyContent: 'flex-end',
  },
  canvasGradingSheet: {
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
  },
  canvasGradingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  canvasGradingTitle: {
    color: '#0F172A',
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },
  canvasCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  canvasCloseButtonText: {
    color: '#0F172A',
    fontWeight: '900',
    fontSize: 16,
  },
  canvasGradingBody: {
    padding: 16,
    paddingBottom: 28,
  },
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

  canvasStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 13,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  canvasStudentButtonActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  canvasStudentName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  canvasStudentNameActive: {
    color: '#166534',
  },
  canvasStudentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  canvasStudentMetaActive: {
    color: '#166534',
  },
  canvasStudentCount: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  canvasStudentCountText: {
    color: '#166534',
    fontWeight: '900',
  },
  canvasSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  canvasSectionLabel: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 2,
  },
  canvasSubmissionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  canvasSubmissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  canvasSubmissionType: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  canvasSubmissionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  canvasSubmissionMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  canvasStatusChip: {
    color: '#166534',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  canvasBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 11,
    marginTop: 8,
  },
  canvasBlockLabel: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  canvasBlockText: {
    color: '#334155',
    lineHeight: 19,
    fontSize: 13,
  },
  canvasAnswerText: {
    color: '#0F172A',
    lineHeight: 19,
    fontSize: 13,
    fontWeight: '700',
  },
  canvasFeedbackBlock: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  canvasPlayButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  canvasPlayButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  canvasReviewPanel: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  canvasScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  canvasScoreLabel: {
    color: '#0F172A',
    fontWeight: '900',
  },
  canvasScoreInput: {
    width: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#0F172A',
    fontWeight: '900',
    textAlign: 'center',
  },
  canvasFeedbackInput: {
    minHeight: 82,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  canvasReviewButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  canvasReviewButtonDisabled: {
    opacity: 0.65,
  },
  canvasReviewButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
  },

  canvasEmptyState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  canvasEmptyTitle: {
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 3,
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
  selectTrigger: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectTriggerDisabled: { opacity: 0.6 },
  selectValue: { color: '#0F172A', fontWeight: '800', flex: 1 },
  selectChevron: { color: '#64748B', fontWeight: '900', marginLeft: 10 },
  selectOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'flex-end' },
  selectSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '72%' },
  selectTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  selectOption: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 8, backgroundColor: '#F8FAFC' },
  selectOptionActive: { borderColor: '#16A34A', backgroundColor: '#DCFCE7' },
  selectOptionText: { color: '#0F172A', fontWeight: '800' },
  selectOptionTextActive: { color: '#166534', fontWeight: '900' },
  selectClose: { backgroundColor: '#0F172A', borderRadius: 14, padding: 13, alignItems: 'center', marginTop: 12 },
  selectCloseText: { color: '#FFFFFF', fontWeight: '900' },
  muted: { color: '#64748B', marginTop: 4 },
  body: { color: '#475569', marginTop: 7, lineHeight: 20 },
  softRow: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 12, marginTop: 9 },
  selectedRow: { borderWidth: 2, borderColor: '#22C55E' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  lessonListCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  lessonListHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lessonStatusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  lessonStatusPublished: { backgroundColor: '#DCFCE7', color: '#166534' },
  lessonStatusDraft: { backgroundColor: '#FEF3C7', color: '#92400E' },
  lessonMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  lessonMetaPill: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 9, minWidth: '47%', flex: 1 },
  lessonMetaLabel: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  lessonMetaValue: { color: '#0F172A', fontWeight: '900', marginTop: 3 },
  lessonActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
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
  builderTabs: { gap: 6, paddingBottom: 12, paddingHorizontal: 4, alignItems: 'center' },
  stepChip: { backgroundColor: '#FFF', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 8, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  stepChipActive: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  stepText: { color: '#64748B', fontWeight: '800', fontSize: 12, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  stepTextActive: { color: '#166534', fontWeight: '900', fontSize: 12, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  previewTitle: { color: '#166534', fontSize: 24, fontWeight: '900' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  studentAvatar: { fontSize: 28 },
  progressTrack: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  progressFill: { height: '100%', backgroundColor: '#22C55E', borderRadius: 99 },
  error: { color: '#B91C1C', fontWeight: '800' },
  assessmentSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  assessmentMetricCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d8e7da',
    shadowColor: '#125334',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  assessmentMetricIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  assessmentMetricValue: {
    color: '#125334',
    fontSize: 22,
    fontWeight: '900',
  },
  assessmentMetricLabel: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  assessmentSearchInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d8e7da',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    color: '#14223b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
  },
  assessmentCountText: {
    color: '#587066',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 10,
  },
  assessmentResultRow: {
    backgroundColor: '#f8fbf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcefe3',
    padding: 14,
    marginTop: 12,
  },
  assessmentResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  assessmentResultIdentity: {
    flex: 1,
  },
  assessmentLearnerName: {
    color: '#14223b',
    fontSize: 16,
    fontWeight: '900',
  },
  assessmentLessonTitle: {
    color: '#125334',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  assessmentStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  assessmentStatusText: {
    fontSize: 11,
    fontWeight: '900',
  },
  assessmentStatusGood: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  assessmentStatusWarn: {
    backgroundColor: '#fef9c3',
    borderColor: '#fde68a',
  },
  assessmentStatusBad: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  assessmentStatusGoodText: {
    color: '#166534',
  },
  assessmentStatusWarnText: {
    color: '#854d0e',
  },
  assessmentStatusBadText: {
    color: '#991b1b',
  },
  assessmentMetaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  assessmentMetaItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5efe8',
  },
  assessmentMetaLabel: {
    color: '#6b7f76',
    fontSize: 11,
    fontWeight: '800',
  },
  assessmentMetaValue: {
    color: '#14223b',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  assessmentEmptyState: {
    alignItems: 'center',
    backgroundColor: '#f8fbf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcefe3',
    padding: 18,
    marginTop: 12,
  },
  assessmentEmptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  assessmentShowMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#125334',
    backgroundColor: '#eef8f1',
    marginTop: 14,
  },
  assessmentShowMoreText: {
    color: '#125334',
    fontSize: 14,
    fontWeight: '900',
  },

  flex1: {
    flex: 1,
  },
  reviewSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  reviewMetricCard: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#d8e7da',
    shadowColor: '#125334',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  reviewMetricIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  reviewMetricValue: {
    color: '#125334',
    fontSize: 22,
    fontWeight: '900',
  },
  reviewMetricLabel: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  reviewSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  reviewSectionLabel: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  reviewMiniPill: {
    backgroundColor: '#eef8f1',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7e6d1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  reviewMiniPillText: {
    color: '#125334',
    fontSize: 11,
    fontWeight: '900',
  },
  reviewCard: {
    backgroundColor: '#f8fbf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcefe3',
    padding: 14,
    marginTop: 12,
  },
  reviewCardCompact: {
    backgroundColor: '#f8fbf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcefe3',
    padding: 14,
    marginTop: 12,
  },
  reviewIdentityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#125334',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  reviewIdentityContent: {
    flex: 1,
  },
  reviewStudentName: {
    color: '#14223b',
    fontSize: 16,
    fontWeight: '900',
  },
  reviewStudentMeta: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  reviewLessonLine: {
    color: '#125334',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },
  reviewEvidenceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  reviewEvidenceItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5efe8',
  },
  reviewEvidenceLabel: {
    color: '#6b7f76',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewEvidenceValue: {
    color: '#14223b',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  reviewContentBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5efe8',
    padding: 12,
    marginBottom: 12,
  },
  reviewBlockLabel: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  reviewBlockText: {
    color: '#14223b',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  reviewInputLabel: {
    color: '#587066',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },
  reviewTextInput: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d8e7da',
    backgroundColor: '#ffffff',
    color: '#14223b',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reviewFeedbackInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  reviewFileButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef8f1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#125334',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  reviewFileButtonText: {
    color: '#125334',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewXpPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  reviewXpPillText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
  },
  reviewFeedbackText: {
    color: '#587066',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  reviewEmptyPanel: {
    alignItems: 'center',
    backgroundColor: '#f8fbf8',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dcefe3',
    padding: 18,
    marginTop: 12,
  },
  reviewEmptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },


  scrollContent: {
    flexGrow: 1,
  },
  primaryAction: {
    backgroundColor: '#0B7A3B',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 52,
    shadowColor: '#0B3D22',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  disabledAction: {
    opacity: 0.55,
  },
});
