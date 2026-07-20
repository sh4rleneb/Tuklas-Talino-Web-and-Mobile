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
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  downloadPdfReport,
  downloadTextReport,
} from '../../services/reportExport';

import {
  addGroupMember,
  addGroupMembers,
  removeGroupMember,
  addGroupTask,
  approveGroupTask,
  archiveLesson,
  createGroup,
  updateGroup,
  deleteGroup,
  createLesson,
  createTeacherSection,
  getActiveStudents,
  updateStudentSection,
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

// TEACHER_DOCUMENT_PICKER_GUARD
let teacherDocumentPickerInProgress = false;

function canceledTeacherDocumentPickerResult() {
  return {
    canceled: true,
    cancelled: true,
    type: 'cancel',
    assets: [],
  };
}

async function getTeacherDocumentAsyncSafely(options) {
  if (teacherDocumentPickerInProgress) {
    return canceledTeacherDocumentPickerResult();
  }

  teacherDocumentPickerInProgress = true;

  try {
    return await DocumentPicker.getDocumentAsync(options);
  } catch (error) {
    const message = String(
      error?.message ||
      error ||
      ''
    );

    if (
      message.includes(
        'Different document picking in progress'
      )
    ) {
      return canceledTeacherDocumentPickerResult();
    }

    throw error;
  } finally {
    /*
     * Give the native picker enough time to close before
     * permitting another teacher upload request.
     */
    setTimeout(() => {
      teacherDocumentPickerInProgress = false;
    }, 350);
  }
}

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
  { value: 'matching', label: 'Matching Activity' },
  { value: 'vocabulary', label: 'Vocabulary Activity' },
  { value: 'infographic', label: 'Infographic Activity' },
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

function Field({
  label,
  value,
  onChangeText,
  multiline = false,
  keyboardType = 'default',
  placeholder = '',
  maxLength,
}) {
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
        maxLength={maxLength}
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
              {normalizedOptions.map((option, teacherKeyIndex) => {
                const active = String(option.value) === String(value);

                return (
                  <TouchableOpacity
                    key={String((option.value) || 'teacher-map-268') + '-' + teacherKeyIndex}
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
              <Text style={styles.selectCloseText}>Close</Text>
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
      <Text
        style={[
          styles.smallButtonText,
          tone === 'slate' && styles.secondaryButtonText,
        ]}
      >
        {children}
      </Text>
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


function getMinimumTeacherDeadlineDate(now = new Date()) {
  const minimum = new Date(now);

  minimum.setTime(
    minimum.getTime() + (60 * 60 * 1000)
  );

  return minimum;
}

function isSameTeacherCalendarDate(left, right) {
  const first = new Date(left);
  const second = new Date(right);

  if (
    Number.isNaN(first.getTime()) ||
    Number.isNaN(second.getTime())
  ) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function createDefaultTeacherDeadlineDate() {
  const next = getMinimumTeacherDeadlineDate();

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

function getTeacherDeadlineValidationMessage(
  rawDeadline = '',
  hasDeadline = false
) {
  if (!hasDeadline) return '';

  const normalizedDeadline =
    normalizeTeacherDeadlineInput(rawDeadline);

  if (!normalizedDeadline) {
    return 'Pumili ng petsa at oras ng deadline bago idagdag ang gawain.';
  }

  const parsedDeadline =
    new Date(normalizedDeadline);

  if (Number.isNaN(parsedDeadline.getTime())) {
    return 'Hindi wasto ang deadline. Pumili muli ng petsa at oras.';
  }

  const minimumDeadline =
    getMinimumTeacherDeadlineDate();

  if (
    parsedDeadline.getTime() <
    minimumDeadline.getTime()
  ) {
    return 'Ang deadline ay dapat hindi bababa sa isang oras mula ngayon.';
  }

  return '';
}

function getTeacherMaxAttemptsFormValue(value = '2') {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();

  if (
    normalized === 'unlimited' ||
    normalized === '0'
  ) {
    return 'unlimited';
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed)) {
    return '2';
  }

  return String(
    Math.min(10, Math.max(1, parsed))
  );
}

function normalizeTeacherMaxAttempts(value = '2') {
  const normalized =
    getTeacherMaxAttemptsFormValue(value);

  return normalized === 'unlimited'
    ? 0
    : Number(normalized);
}

function getTeacherAttemptOptions() {
  return [
    ...Array.from(
      { length: 10 },
      (_, index) => String(index + 1)
    ),
    'unlimited',
  ];
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




const GROUP_TASK_MINIMUM_DEADLINE_MS =
  60 * 60 * 1000;

function getMinimumTaskDeadlineDate(
  now = Date.now()
) {
  const exactMinimum =
    now + GROUP_TASK_MINIMUM_DEADLINE_MS;

  const roundedMinimum = new Date(exactMinimum);
  roundedMinimum.setSeconds(0, 0);

  if (roundedMinimum.getTime() < exactMinimum) {
    roundedMinimum.setMinutes(
      roundedMinimum.getMinutes() + 1
    );
  }

  return roundedMinimum;
}

function getTaskDeadlineDate(value = '') {
  const parsedDate = new Date(value);

  if (
    value &&
    !Number.isNaN(parsedDate.getTime())
  ) {
    return parsedDate;
  }

  return getMinimumTaskDeadlineDate();
}

function formatTaskDeadlineValue(value) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toISOString();
}

function mergeTaskDeadlineDateTime(
  currentValue,
  selectedValue,
  mode
) {
  const combinedDate =
    getTaskDeadlineDate(currentValue);

  const selectedDate =
    new Date(selectedValue);

  if (mode === 'time') {
    combinedDate.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      0,
      0
    );
  } else {
    combinedDate.setFullYear(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );

    combinedDate.setSeconds(0, 0);
  }

  return combinedDate;
}

function formatTaskDeadlineForDisplay(
  value = ''
) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTaskDeadlineValidationMessage(
  value = '',
  now = Date.now()
) {
  if (!String(value || '').trim()) {
    return 'Select a deadline date and time.';
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return (
      'Select a valid deadline date and time.'
    );
  }

  if (
    parsedDate.getTime() <
    now + GROUP_TASK_MINIMUM_DEADLINE_MS
  ) {
    return (
      'Deadline must be at least one hour ' +
      'from the current time.'
    );
  }

  return '';
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
      : rawName.endsWith('.docx')
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : rawName.endsWith('.doc')
      ? 'application/msword'
      : rawName.endsWith('.png')
      ? 'image/png'
      : rawName.endsWith('.jpg') ||
        rawName.endsWith('.jpeg')
      ? 'image/jpeg'
      : rawName.endsWith('.webp')
      ? 'image/webp'
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
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp') ||
    type.includes('pdf') ||
    type.includes('powerpoint') ||
    type.includes('presentation') ||
    type.includes('msword') ||
    type.includes('wordprocessingml') ||
    type.startsWith('image/')
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
    return 'The lesson material could not be uploaded. Make sure the file is a PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, or WEBP file, then try again.';
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
  const [newActivityState, setNewActivity] = useState({
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

  const newActivity =
    newActivityState && typeof newActivityState === 'object'
      ? newActivityState
      : {};
  const [groupForm, setGroupForm] = useState({ name: '', description: '', section: '', gradeLevel: '1' });
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [openGroupTools, setOpenGroupTools] = useState({});
  const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState({});
  const [taskForm, setTaskForm] = useState({ title: '', description: '', deadline: '', xpReward: '10' });
  const [taskNotice, setTaskNotice] = useState(null);
  const [taskDeadlinePickerVisible, setTaskDeadlinePickerVisible] = useState(false);
    const [
    teacherStudentSearchQuery,
    setTeacherStudentSearchQuery,
  ] = useState('');

  const [
    teacherStudentSearchResults,
    setTeacherStudentSearchResults,
  ] = useState([]);

  const [
    selectedTeacherStudent,
    setSelectedTeacherStudent,
  ] = useState(null);

  const [
    teacherSectionSearchQuery,
    setTeacherSectionSearchQuery,
  ] = useState('');

  const [
    teacherSelectedSection,
    setTeacherSelectedSection,
  ] = useState('');

  const [
    teacherNewSectionName,
    setTeacherNewSectionName,
  ] = useState('');

  const [
    teacherAddingSection,
    setTeacherAddingSection,
  ] = useState(false);

  useEffect(() => {
    setTeacherNewSectionName('');
    setTeacherAddingSection(false);
  }, [selectedTeacherStudent]);
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

  const [leaderboardGradeFilter, setLeaderboardGradeFilter] =
    useState('all');

  const leaderboardGradeOptions = useMemo(() => (
    [
      ...new Set(
        usableStudents
          .map(student =>
            Number(
              getStudentGradeValue(student) ||
              student?.gradeLevel ||
              student?.grade ||
              0
            )
          )
          .filter(grade => grade >= 1 && grade <= 6)
      )
    ].sort((first, second) => first - second)
  ), [usableStudents]);

  const teacherStudentLeaderboard = useMemo(() => (
    usableStudents
      .filter(student => {
        if (leaderboardGradeFilter === 'all') {
          return true;
        }

        const studentGrade = Number(
          getStudentGradeValue(student) ||
          student?.gradeLevel ||
          student?.grade ||
          0
        );

        return studentGrade === Number(leaderboardGradeFilter);
      })
      .sort((first, second) => {
        const xpDifference =
          Number(second?.xp || 0) -
          Number(first?.xp || 0);

        if (xpDifference !== 0) {
          return xpDifference;
        }

        return String(first?.name || 'Student')
          .localeCompare(String(second?.name || 'Student'));
      })
      .map((student, index) => ({
        ...student,
        leaderboardRank: index + 1,
      }))
  ), [
    leaderboardGradeFilter,
    usableStudents,
  ]);

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

  function startEditGroup(group = {}) {
    setEditingGroupId(group?.id || null);
    setGroupForm({
      name: String(group?.name || '').trim(),
      description: String(group?.description || group?.section || '').trim(),
      section: String(group?.section || group?.sectionName || group?.classSection || '').trim(),
      gradeLevel: String(group?.gradeLevel || group?.grade || '1'),
    });
    setSelectedGroupId(group?.id || null);
  }

  function buildGroupPayload() {
    const groupName = String(groupForm.name || '').trim();
    const groupGradeLevel = Number(groupForm.gradeLevel);

    if (!groupName) {
      Alert.alert('Create Group', 'Enter a group name.');
      return null;
    }

    if (groupName.length > 20) {
      Alert.alert(
        'Create Group',
        'Group name must not exceed 20 characters.'
      );
      return null;
    }

    if (![1, 2, 3, 4, 5, 6].includes(groupGradeLevel)) {
      Alert.alert('Create Group', 'Select a valid grade level from Grade 1 to Grade 6.');
      return null;
    }

    const groupSection = normalizeSectionName(groupForm.section || groupForm.description);

    if (!groupSection) {
      Alert.alert('Create Group', 'Select a section for this group.');
      return null;
    }

    if (groupSection.length > 20) {
      Alert.alert(
        'Create Group',
        'Section must not exceed 20 characters.'
      );
      return null;
    }

    if (!canUseGradeSection(groupGradeLevel, groupSection)) {
      Alert.alert('Create Group', 'You can only create groups for your assigned grade level or section.');
      return null;
    }

    return {
      ...groupForm,
      name: groupName,
      gradeLevel: groupGradeLevel,
      section: groupSection,
      description: groupSection,
    };
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
      const result = await getTeacherDocumentAsyncSafely({
        type: [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/png',
          'image/jpeg',
          'image/webp',
        ],
        multiple: false,
        copyToCacheDirectory: true,
      });

      const asset = getPickedLessonMaterialAsset(result);

      if (!asset) return;

      if (!asset.uri) {
        Alert.alert('Lesson Material', 'The selected file could not be read. Select another PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, or WEBP file.');
        return;
      }

      if (!isSupportedLessonMaterial(asset)) {
        Alert.alert('Lesson Material', 'Only PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, and WEBP files can be uploaded.');
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
    activity = activity && typeof activity === 'object' ? activity : {};
    current = current && typeof current === 'object' ? current : {};
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
      maxAttempts: getTeacherMaxAttemptsFormValue(
        activity.maxAttempts ??
        activity.max_attempts ??
        activity.attemptLimit ??
        activity.attemptsAllowed ??
        activity?.dataJson?.maxAttempts ??
        activity?.dataJson?.max_attempts ??
        activity?.data_json?.maxAttempts ??
        activity?.data_json?.max_attempts ??
        current.maxAttempts ??
        '2'
      ),
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

        const existingActivity =
          nextActivities[editingActivityIndex] || {};

        let updatedActivity = {
          ...existingActivity,
          ...activity,
        };

        if (
          type === 'mcq' &&
          Array.isArray(existingActivity.questions) &&
          existingActivity.questions.length &&
          Array.isArray(activity.questions) &&
          activity.questions.length
        ) {
          const existingQuestions = existingActivity.questions;
          const existingFirstQuestion = existingQuestions[0] || {};
          const updatedFirstQuestion = activity.questions[0] || {};
          const existingOptions = Array.isArray(existingFirstQuestion.options)
            ? existingFirstQuestion.options
            : [];
          const updatedOptions = Array.isArray(updatedFirstQuestion.options)
            ? updatedFirstQuestion.options
            : [];

          updatedActivity = {
            ...updatedActivity,
            questions: [
              {
                ...existingFirstQuestion,
                ...updatedFirstQuestion,
                id:
                  existingFirstQuestion.id ??
                  updatedFirstQuestion.id,
                options: updatedOptions.map((option, optionIndex) => ({
                  ...(existingOptions[optionIndex] || {}),
                  ...option,
                  id:
                    existingOptions[optionIndex]?.id ??
                    option.id,
                })),
              },
              ...existingQuestions.slice(1),
            ],
          };
        }

        nextActivities[editingActivityIndex] = updatedActivity;

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

  function hasCurrentLessonPreviewContent() {
    const previewActivities = Array.isArray(draft.activities)
      ? draft.activities
      : [];

    const previewPassage =
      buildStructuredLessonPassage(draft);

    return Boolean(
      String(draft.title || '').trim() ||
      String(draft.instructions || '').trim() ||
      String(draft.speechTarget || '').trim() ||
      draft.material ||
      previewPassage ||
      previewActivities.length
    );
  }

  async function previewLessonDraft(lesson) {
    if (!lesson) return;

    await editLessonDraft(lesson);
    setBuilderStep(3);
    setWorkspaceNotice({
      type: 'success',
      text: `Previewing: ${lesson.title || 'Untitled Lesson'}`,
    });
  }

  function handleBuilderStepPress(index) {
    if (index !== 3) {
      setBuilderStep(index);
      return;
    }

    if (hasCurrentLessonPreviewContent()) {
      setBuilderStep(3);
      return;
    }

    if (lessons.length) {
      setBuilderStep(4);
      setWorkspaceNotice({
        type: 'warning',
        text: 'Choose a lesson below, then tap Preview.',
      });
      return;
    }

    setBuilderStep(1);
    setWorkspaceNotice({
      type: 'warning',
      text: 'Add lesson details before opening the preview.',
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
      <View style={styles.navRow}>
        {NAV_ITEMS.map(([key, icon, label], teacherKeyIndex) => (
          <TouchableOpacity
            key={String((key) || 'teacher-map-2333') + '-' + teacherKeyIndex}
            style={[
              styles.navChip,
              section === key && styles.navChipActive,
            ]}
            onPress={() => setSection(key)}
          >
            <Text>{icon}</Text>
            <Text
              style={[
                styles.navLabel,
                section === key && styles.navLabelActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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

    void 0;

    const saved = await run(
      `pending-group-approve-${taskId}-${studentId}`,
      () => approveGroupTask(taskId, studentId, ''),
      'Group check approved.'
    );

    void 0;

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
            void 0;

            const saved = await run(
              `pending-group-revise-${taskId}-${studentId}`,
              () => returnGroupTask(taskId, studentId, 'Please revise and resubmit.'),
              'Group check returned for revision.'
            );

            void 0;

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
        <View style={styles.teacherParityMetricsGrid}>
          {[
            {
              icon: '📗',
              value:
                stats.publishedLessons ??
                stats.lessons ??
                lessons.filter(
                  lesson =>
                    String(lesson?.status || 'published').toLowerCase() ===
                    'published'
                ).length,
              label: 'Published Lessons',
              description: 'Available to learners',
              destination: 'lessons',
            },
            {
              icon: '📝',
              value:
                stats.draftLessons ??
                lessons.filter(
                  lesson =>
                    String(lesson?.status || '').toLowerCase() ===
                    'draft'
                ).length,
              label: 'Draft Lessons',
              description: 'Waiting to be published',
              destination: 'lessons',
            },
            {
              icon: '🎓',
              value:
                stats.students ??
                currentStudents.length ??
                0,
              label: 'Students',
              description: 'Assigned learners',
              destination: 'students',
            },
            {
              icon: '📈',
              value: `${stats.classProgress ?? 0}%`,
              label: 'Class Progress',
              description: 'Average completion',
              destination: 'students',
            },
          ].map((metric, teacherKeyIndex) => (
            <TouchableOpacity
              key={`${metric.label}-${teacherKeyIndex}`}
              activeOpacity={0.84}
              style={styles.teacherParityMetricCard}
              onPress={() => setSection(metric.destination)}
            >
              <View style={styles.teacherParityMetricTopRow}>
                <View style={styles.teacherParityMetricIcon}>
                  <Text style={styles.teacherParityMetricEmoji}>
                    {metric.icon}
                  </Text>
                </View>

                <Text style={styles.teacherParityMetricArrow}>
                  →
                </Text>
              </View>

              <Text style={styles.teacherParityMetricValue}>
                {metric.value}
              </Text>

              <Text style={styles.teacherParityMetricLabel}>
                {metric.label}
              </Text>

              <Text style={styles.teacherParityMetricDescription}>
                {metric.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TEACHER_ASSIGNED_CLASSES_UI_V1 */}
        <SectionCard
          style={[
            styles.assignedClassesCard,
            styles.teacherParityDashboardCard,
          ]}
        >
          <View style={styles.assignedClassesHeader}>
            <View style={styles.assignedClassesHeaderCopy}>
              <View style={styles.assignedClassesTitleRow}>
                <View style={styles.assignedClassesTitleIcon}>
                  <Text style={styles.assignedClassesTitleEmoji}>
                    🏫
                  </Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.assignedClassesTitle}>
                    Assigned Classes
                  </Text>
                  <Text style={styles.assignedClassesSubtitle}>
                    Classes currently assigned to your account
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.assignedClassesCount}>
              <Text style={styles.assignedClassesCountValue}>
                {dashboard?.assignedClasses?.length || 0}
              </Text>
              <Text style={styles.assignedClassesCountLabel}>
                {(dashboard?.assignedClasses?.length || 0) === 1
                  ? 'Class'
                  : 'Classes'}
              </Text>
            </View>
          </View>

          {(dashboard?.assignedClasses || []).length ? (
            <View style={styles.assignedClassesGrid}>
              {(dashboard?.assignedClasses || []).map(
                (item, teacherKeyIndex) => {
                  const gradeLevel =
                    item?.gradeLevel ??
                    item?.grade_level ??
                    item?.grade ??
                    '—';

                  const section =
                    item?.section ??
                    item?.sectionName ??
                    item?.classSection ??
                    'No section';

                  return (
                    <View
                      key={
                        String(
                          item?.id ||
                            `${gradeLevel}-${section}` ||
                            'teacher-assigned-class'
                        ) +
                        '-' +
                        teacherKeyIndex
                      }
                      style={styles.assignedClassCard}
                    >
                      <View style={styles.assignedClassTopRow}>
                        <View style={styles.assignedClassGradeBadge}>
                          <Text style={styles.assignedClassGradeBadgeLabel}>
                            GRADE
                          </Text>
                          <Text style={styles.assignedClassGradeBadgeValue}>
                            {gradeLevel}
                          </Text>
                        </View>

                        <View style={styles.assignedClassStatus}>
                          <View style={styles.assignedClassStatusDot} />
                          <Text style={styles.assignedClassStatusText}>
                            Assigned
                          </Text>
                        </View>
                      </View>

                      <View style={styles.assignedClassBody}>
                        <Text style={styles.assignedClassSectionLabel}>
                          SECTION
                        </Text>
                        <Text style={styles.assignedClassSection}>
                          {section}
                        </Text>
                      </View>

                      <View style={styles.assignedClassFooter}>
                        <Text style={styles.assignedClassFooterIcon}>
                          📘
                        </Text>
                        <Text style={styles.assignedClassFooterText}>
                          Active teaching class
                        </Text>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          ) : (
            <View style={styles.assignedClassesEmpty}>
              <View style={styles.assignedClassesEmptyIcon}>
                <Text style={styles.assignedClassesEmptyEmoji}>
                  🏫
                </Text>
              </View>

              <Text style={styles.assignedClassesEmptyTitle}>
                No assigned classes yet
              </Text>

              <Text style={styles.assignedClassesEmptyText}>
                Your assigned grade levels and sections will appear
                here once they are added by the administrator.
              </Text>
            </View>
          )}
        </SectionCard>

        <SectionCard style={styles.teacherParityDashboardCard}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.cardTitle}>
                Student Leaderboard
              </Text>

              <Text style={styles.muted}>
                Ranking of your assigned students based on total XP.
              </Text>


              <View
                testID="mobile-leaderboard-grade-filter"
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Text
                  onPress={() => setLeaderboardGradeFilter('all')}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 13,
                    borderRadius: 999,
                    overflow: 'hidden',
                    fontWeight: '800',
                    color:
                      leaderboardGradeFilter === 'all'
                        ? '#166534'
                        : '#475569',
                    backgroundColor:
                      leaderboardGradeFilter === 'all'
                        ? '#dcfce7'
                        : '#f8fafc',
                    borderWidth:
                      leaderboardGradeFilter === 'all' ? 2 : 1,
                    borderColor:
                      leaderboardGradeFilter === 'all'
                        ? '#16a34a'
                        : '#cbd5e1',
                  }}
                >
                  All Grades
                </Text>

                {leaderboardGradeOptions.map(grade => (
                  <Text
                    key={`mobile-leaderboard-grade-${grade}`}
                    onPress={() =>
                      setLeaderboardGradeFilter(String(grade))
                    }
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 13,
                      borderRadius: 999,
                      overflow: 'hidden',
                      fontWeight: '800',
                      color:
                        Number(leaderboardGradeFilter) === grade
                          ? '#166534'
                          : '#475569',
                      backgroundColor:
                        Number(leaderboardGradeFilter) === grade
                          ? '#dcfce7'
                          : '#f8fafc',
                      borderWidth:
                        Number(leaderboardGradeFilter) === grade
                          ? 2
                          : 1,
                      borderColor:
                        Number(leaderboardGradeFilter) === grade
                          ? '#16a34a'
                          : '#cbd5e1',
                    }}
                  >
                    Grade {grade}
                  </Text>
                ))}
              </View>
            </View>

            <View
              style={{
                minWidth: 48,
                minHeight: 48,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FEF3C7',
                borderWidth: 1,
                borderColor: '#FDE68A',
              }}
            >
              <Text style={{ fontSize: 24 }}>
                🏆
              </Text>
            </View>
          </View>

          {teacherStudentLeaderboard.length ? (
            <View style={{ marginTop: 10 }}>
              {teacherStudentLeaderboard.map(
                (student, leaderboardIndex) => {
                  const rank =
                    student.leaderboardRank ||
                    leaderboardIndex + 1;

                  const medal =
                    rank === 1
                      ? '🥇'
                      : rank === 2
                        ? '🥈'
                        : rank === 3
                          ? '🥉'
                          : String(rank);

                  const name =
                    student?.name ||
                    student?.studentName ||
                    'Student';

                  const grade =
                    getStudentGradeValue(student) ||
                    '—';

                  const studentSection =
                    normalizeSectionName(
                      getStudentSectionValue(student)
                    ) || 'Not assigned';

                  return (
                    <View
                      key={`teacher-leaderboard-${
                        getStudentStableId(student)
                      }-${rank}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 12,
                        marginBottom: 8,
                        borderRadius: 14,
                        backgroundColor:
                          rank <= 3 ? '#FFFBEB' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor:
                          rank <= 3 ? '#FDE68A' : '#E2E8F0',
                      }}
                    >
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          backgroundColor:
                            rank <= 3 ? '#FEF3C7' : '#E2E8F0',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: rank <= 3 ? 22 : 15,
                            fontWeight: '900',
                            color: '#334155',
                          }}
                        >
                          {medal}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle}>
                          {name}
                        </Text>

                        <Text style={styles.muted}>
                          Grade {grade} • {studentSection}
                        </Text>
                      </View>

                      <View
                        style={{
                          alignItems: 'flex-end',
                          paddingLeft: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: '#16A34A',
                            fontSize: 17,
                            fontWeight: '900',
                          }}
                        >
                          {Number(student?.xp || 0)}
                        </Text>

                        <Text
                          style={{
                            color: '#64748B',
                            fontSize: 11,
                            fontWeight: '800',
                          }}
                        >
                          XP
                        </Text>
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          ) : (
            <View
              style={{
                marginTop: 12,
                padding: 18,
                borderRadius: 14,
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>
                🏆
              </Text>

              <Text style={styles.rowTitle}>
                No students to rank yet
              </Text>

              <Text
                style={[
                  styles.muted,
                  {
                    textAlign: 'center',
                    marginTop: 4,
                  },
                ]}
              >
                Assigned students will appear here once their
                records are available.
              </Text>
            </View>
          )}
        </SectionCard>

        <SectionCard style={styles.teacherParityDashboardCard}>
          <View style={styles.teacherParitySectionHeading}>
            <View style={styles.teacherParitySectionIcon}>
              <Text style={styles.teacherParitySectionEmoji}>
                ✅
              </Text>
            </View>

            <View style={styles.flex}>
              <Text style={styles.cardTitle}>
                Pending Group Checks
              </Text>

              <Text style={styles.muted}>
                Review collaborative tasks submitted by your students.
              </Text>
            </View>
          </View>
          {(pendingChecks.rows || []).slice(0, 4).map((row, teacherKeyIndex) => {
            const actionId = getPendingGroupCheckActionKey(row);

            return (
              <View key={String((actionId || row.id || `${row.groupName}-${row.taskTitle}-${row.studentName}`) || 'teacher-map-2519') + '-' + teacherKeyIndex} style={styles.softRow}>
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
        <View style={styles.builderTabs}>
          {BUILDER_STEPS.map((label, index) => (
            <TouchableOpacity
              key={String((label) || 'teacher-map-2559') + '-' + index}
              style={[
                styles.stepChip,
                builderStep === index && styles.stepChipActive,
              ]}
              onPress={() => handleBuilderStepPress(index)}
            >
              <Text
                style={
                  builderStep === index
                    ? styles.stepTextActive
                    : styles.stepText
                }
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {builderStep === 0 && (
          <SectionCard>
            <Text style={styles.cardTitle}>Lesson Material</Text>
            <Text style={styles.muted}>Upload a PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, JPEG, or WEBP file. PDFs and images can preview inside the student lesson. Office files open or download using a compatible app.</Text>
            {draft.material && (
              <View style={styles.softRow}>
                <Text style={styles.rowTitle}>📎 {draft.material.fileName}</Text>
                <Text style={styles.muted}>{draft.material.fileType} • {Math.round((draft.material.size || 0) / 1024)} KB</Text>
              </View>
            )}
            <Pressable
              disabled={busy === 'material'}
              onPress={pickMaterial}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                marginTop: 18,
                backgroundColor: '#64748B',
                borderColor: '#64748B',
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                opacity: busy === 'material'
                  ? 0.55
                  : pressed
                    ? 0.85
                    : 1,
              })}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: '800',
                }}
              >
                {busy === 'material'
                  ? 'Uploading...'
                  : 'Upload PPT/PDF Material'}
              </Text>
            </Pressable>
            <View
              style={{
                width: '100%',
                marginTop: 14,
                alignItems: 'flex-start',
              }}
            >
              <Pressable
                onPress={() => setBuilderStep(1)}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  backgroundColor: '#2563EB',
                  borderColor: '#1D4ED8',
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontWeight: '800',
                  }}
                >
                  Next: Lesson Details →
                </Text>
              </Pressable>
            </View>
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
                  placeholder={`Ano ang dapat unang malaman ng mga mag-aaral tungkol sa paksa?\n\nHalimbawa: Ang titik M ay may tunog na /m/. May mga salitang nagsisimula sa M.`}
                />

                <Field
                  label="3  Lesson — Main lesson content"
                  value={draft.aralin}
                  onChangeText={(value) => setDraft((current) => ({ ...current, aralin: value }))}
                  multiline
                  placeholder={"Ano ang babasahin o pag-aaralan ng mga mag-aaral?\n\nHalimbawa: May mga salitang nagsisimula sa M, tulad ng mata, mesa, at maya."}
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

            <SelectMenu
              label="Attempts Allowed"
              value={getTeacherMaxAttemptsFormValue(
                newActivity.maxAttempts ?? '2'
              )}
              options={getTeacherAttemptOptions().map(
                (attemptOption) => ({
                  value: attemptOption,
                  label:
                    attemptOption === 'unlimited'
                      ? 'Unlimited'
                      : `${attemptOption} ${
                          Number(attemptOption) === 1
                            ? 'attempt'
                            : 'attempts'
                        }`,
                })
              )}
              onSelect={(maxAttempts) =>
                setNewActivity((current) => ({
                  ...current,
                  maxAttempts,
                }))
              }
            />

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
                  Deadline must be at least 1 hour from the current date and time.
                </Text>

                {activityDeadlinePickerVisible ? (
                  <DateTimePicker
                    value={getActivityDeadlineDate(newActivity.deadline)}
                    mode={activityDeadlinePickerMode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={
                      activityDeadlinePickerMode === 'date'
                        ? getMinimumTeacherDeadlineDate()
                        : isSameTeacherCalendarDate(
                            getActivityDeadlineDate(
                              newActivity.deadline
                            ),
                            new Date()
                          )
                          ? getMinimumTeacherDeadlineDate()
                          : undefined
                    }
                    onChange={(event, selectedDate) => {
                      if (Platform.OS !== 'ios') {
                        setActivityDeadlinePickerVisible(false);
                      }

                      if (!selectedDate) return;

                      const mergedDeadline =
                        mergeTeacherDeadlineDateTime(
                          newActivity.deadline,
                          selectedDate,
                          activityDeadlinePickerMode
                        );

                      const selectedDeadline =
                        new Date(mergedDeadline);

                      const minimumDeadline =
                        getMinimumTeacherDeadlineDate();

                      if (
                        Number.isNaN(
                          selectedDeadline.getTime()
                        ) ||
                        selectedDeadline.getTime() <
                          minimumDeadline.getTime()
                      ) {
                        setWorkspaceNotice({
                          type: 'warning',
                          text: 'Hindi maaaring pumili ng oras na mas mababa sa isang oras mula ngayon.',
                        });

                        if (
                          Platform.OS !== 'ios' &&
                          activityDeadlinePickerMode === 'time'
                        ) {
                          setTimeout(() => {
                            setActivityDeadlinePickerVisible(true);
                          }, 250);
                        }

                        return;
                      }

                      setNewActivity((current) => ({
                        ...current,
                        hasDeadline: true,
                        deadline: mergedDeadline,
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
                {/* TEACHER_PERSISTENT_QUIZ_TEMPLATE */}
                <View style={styles.softRow}>
                  <Text style={styles.rowTitle}>
                    Quiz Question Template
                  </Text>
                  <Text style={styles.muted}>
                    Question: Ano ang kasingkahulugan ng masaya?
                  </Text>
                  <Text style={styles.muted}>
                    A. Maligaya
                  </Text>
                  <Text style={styles.muted}>
                    B. Malungkot
                  </Text>
                  <Text style={styles.muted}>
                    C. Galit
                  </Text>
                  <Text style={styles.muted}>
                    D. Takot
                  </Text>
                  <Text style={styles.muted}>
                    Correct Answer: A
                  </Text>
                </View>

                {ACTIVITY_CHOICE_KEYS.slice(
                  0,
                  Math.min(ACTIVITY_CHOICE_KEYS.length, Math.max(2, Number(newActivity.choiceCount || 2)))
                ).map((choice, teacherKeyIndex) => {
                  const optionKey = `option${choice}`;

                  return (
                    <Field
                      key={String((choice) || 'teacher-map-2933') + '-' + teacherKeyIndex}
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
                  {/* TEACHER_UNIFIED_ADD_MORE_CHOICE */}
                  {/* TEACHER_ADD_CHOICE_VISUAL_OFFSET_FINAL */}
                  <View style={{ transform: [{ translateY: 10 }] }}>
                    <SmallButton
                                          tone="mediumBlue"
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
                                          ＋  Add More Choice
                                        </SmallButton>
                  </View>

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

                {/* TEACHER_CORRECT_CHOICE_TOP_SPACE_16 */}
                <View style={{ height: 16 }} />
                {/* TEACHER_QUIZ_CORRECT_CHOICE_DROPDOWN */}
                <SelectMenu
                  label="Correct Choice"
                  value={newActivity.correctOption || 'A'}
                  options={ACTIVITY_CHOICE_KEYS.slice(
                    0,
                    Math.min(
                      ACTIVITY_CHOICE_KEYS.length,
                      Math.max(2, Number(newActivity.choiceCount || 2))
                    )
                  ).map((choice) => ({
                    value: choice,
                    label: `${choice}. ${String(
                      newActivity[`option${choice}`] || `Choice ${choice}`
                    ).trim() || `Choice ${choice}`}`,
                  }))}
                  onSelect={(correctOption) =>
                    setNewActivity((current) => ({
                      ...current,
                      correctOption,
                    }))
                  }
                />
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
            {/* TEACHER_ACTIVITY_FOOTER_ROW */}
            <View
              style={{
                alignSelf: 'stretch',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginTop: 14,
                paddingTop: 14,
              }}
            >
              <View style={{ flexShrink: 1 }}>
                <SmallButton
                  tone="mediumBlue"
                  onPress={addActivity}
                >
                  {typeof newActivity.editingActivityIndex === 'number'
                    ? 'Update Activity Block'
                    : 'Add Activity Block'}
                </SmallButton>
              </View>

              <View
                style={{
                  flexShrink: 1,
                  alignItems: 'flex-end',
                }}
              >
                <SmallButton
                  tone="darkBlue"
                  onPress={() => setBuilderStep(3)}
                >
                  Next: Preview →
                </SmallButton>
              </View>
            </View>
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
                      <SmallButton onPress={() => setBuilderStep(4)}>
                        Choose from My Lessons
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
            {lessons.map((lesson, teacherKeyIndex) => {
              const isPublished = (lesson.status || 'published') === 'published';

              return (
                <View key={String((lesson.id) || 'teacher-map-3202') + '-' + teacherKeyIndex} style={styles.lessonListCard}>
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
                    <SmallButton
                      tone="slate"
                      disabled={Boolean(busy)}
                      onPress={() => previewLessonDraft(lesson)}
                    >
                      Preview
                    </SmallButton>
                    <SmallButton
                      tone="slate"
                      disabled={Boolean(busy)}
                      onPress={() => editLessonDraft(lesson)}
                    >
                      Edit
                    </SmallButton>
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

  function getSelectedGroupStudentIds(groupId) {
    const selected =
      selectedGroupStudentIds[groupId];

    return Array.isArray(selected)
      ? selected.map(String)
      : [];
  }

  function toggleSelectedGroupStudent(
    groupId,
    studentId
  ) {
    const normalizedStudentId =
      String(studentId);

    setSelectedGroupStudentIds(
      (current) => {
        const selected = new Set(
          Array.isArray(current[groupId])
            ? current[groupId].map(String)
            : []
        );

        if (
          selected.has(normalizedStudentId)
        ) {
          selected.delete(
            normalizedStudentId
          );
        } else {
          selected.add(
            normalizedStudentId
          );
        }

        return {
          ...current,
          [groupId]: [...selected],
        };
      }
    );
  }

  function setAllSelectedGroupStudents(
    groupId,
    students = []
  ) {
    setSelectedGroupStudentIds(
      (current) => ({
        ...current,
        [groupId]: students
          .map(getStudentGroupMemberId)
          .filter(Boolean)
          .map(String),
      })
    );
  }

  function clearSelectedGroupStudents(
    groupId
  ) {
    setSelectedGroupStudentIds(
      (current) => ({
        ...current,
        [groupId]: [],
      })
    );
  }

  async function handleBulkAddGroupMembers(
    group,
    eligibleStudents = []
  ) {
    const selectedIds =
      getSelectedGroupStudentIds(
        group.id
      );

    const eligibleIds = new Set(
      eligibleStudents
        .map(getStudentGroupMemberId)
        .filter(Boolean)
        .map(String)
    );

    const studentIds = selectedIds
      .filter((studentId) =>
        eligibleIds.has(
          String(studentId)
        )
      )
      .map(Number)
      .filter(
        (studentId) =>
          Number.isInteger(studentId) &&
          studentId > 0
      );

    if (!studentIds.length) {
      Alert.alert(
        'Group Members',
        'Select at least one learner.'
      );
      return;
    }

    const saved = await run(
      `members-bulk-${group.id}`,
      () =>
        addGroupMembers(
          group.id,
          studentIds
        ),
      `${studentIds.length} learner(s) added.`
    );

    if (saved) {
      clearSelectedGroupStudents(
        group.id
      );
      await load();
    }
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

  function getGroupTaskDeadlineLabel(
    task = {}
  ) {
    const rawDeadline =
      task.dueAt ||
      task.deadline ||
      task.dueDate ||
      task.scheduledAt ||
      '';

    if (!rawDeadline) {
      return '';
    }

    const parsedDeadline =
      new Date(rawDeadline);

    if (
      Number.isNaN(
        parsedDeadline.getTime()
      )
    ) {
      return '';
    }

    return parsedDeadline.toLocaleString(
      'en-PH',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }
    );
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
            maxLength={20}
            onChangeText={(name) =>
              setGroupForm((current) => ({
                ...current,
                name: String(name || '').slice(0, 20),
              }))
            }
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
            const groupPayload = buildGroupPayload();

            if (!groupPayload) return;

            const saved = await run(
              editingGroupId ? `group-update-${editingGroupId}` : 'group-create',
              () => editingGroupId ? updateGroup(editingGroupId, groupPayload) : createGroup(groupPayload),
              editingGroupId ? 'Group updated.' : 'Group created.'
            );

            if (saved) {
              setGroups((current) => {
                const nextGroup = { ...saved, gradeLevel: saved.gradeLevel || groupPayload.gradeLevel };

                return editingGroupId
                  ? current.map((group) => Number(group.id) === Number(editingGroupId) ? nextGroup : group)
                  : [nextGroup, ...current.filter((group) => Number(group.id) !== Number(saved.id))];
              });
              setSelectedGroupId(editingGroupId || saved.id);
              setGroupForm({ name: '', description: '', section: '', gradeLevel: String(groupPayload.gradeLevel) });
              setEditingGroupId(null);
            }
          }}>{editingGroupId ? 'Save Changes' : 'Create Group'}</SmallButton>
        </SectionCard>

        <SectionCard>
          <Text style={styles.cardIcon}>📝</Text>
          <Text style={styles.cardTitle}>Add Task</Text>
          <Text style={styles.muted}>Assign collaborative work with a deadline and XP reward.</Text>

          {taskNotice ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss task notice"
              onPress={() => setTaskNotice(null)}
              style={[
                styles.taskNoticeCard,
                taskNotice.type === 'success' &&
                  styles.taskNoticeSuccess,
                taskNotice.type === 'warning' &&
                  styles.taskNoticeWarning,
                taskNotice.type === 'error' &&
                  styles.taskNoticeError,
              ]}
            >
              <Text style={styles.taskNoticeText}>
                {taskNotice.text}
              </Text>
            </Pressable>
          ) : null}

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

          <Text style={styles.fieldLabel}>
            Deadline
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={Boolean(busy)}
            onPress={() => {
              const initialDeadline =
                getTaskDeadlineDate(
                  taskForm.deadline
                );

              const minimumDeadline =
                getMinimumTaskDeadlineDate();

              if (Platform.OS === 'android') {
                DateTimePickerAndroid.open({
                  value: initialDeadline,
                  mode: 'date',
                  display: 'calendar',
                  minimumDate: minimumDeadline,
                  onChange: (
                    dateEvent,
                    selectedDate
                  ) => {
                    if (
                      dateEvent?.type !== 'set' ||
                      !selectedDate
                    ) {
                      return;
                    }

                    const deadlineDate =
                      mergeTaskDeadlineDateTime(
                        initialDeadline,
                        selectedDate,
                        'date'
                      );

                    DateTimePickerAndroid.open({
                      value: deadlineDate,
                      mode: 'time',
                      display: 'clock',
                      is24Hour: false,
                      onChange: (
                        timeEvent,
                        selectedTime
                      ) => {
                        if (
                          timeEvent?.type !==
                            'set' ||
                          !selectedTime
                        ) {
                          return;
                        }

                        const combinedDeadline =
                          mergeTaskDeadlineDateTime(
                            deadlineDate,
                            selectedTime,
                            'time'
                          );

                        const normalizedDeadline =
                          formatTaskDeadlineValue(
                            combinedDeadline
                          );

                        const validationMessage =
                          getTaskDeadlineValidationMessage(
                            normalizedDeadline
                          );

                        if (validationMessage) {
                          setTaskNotice({
                            type: 'error',
                            text:
                              validationMessage,
                          });

                          Alert.alert(
                            'Invalid Deadline',
                            validationMessage
                          );
                          return;
                        }

                        setTaskNotice(null);

                        setTaskForm(
                          (current) => ({
                            ...current,
                            deadline:
                              normalizedDeadline,
                          })
                        );
                      },
                    });
                  },
                });

                return;
              }

              setTaskDeadlinePickerVisible(
                true
              );
            }}
            style={{
              borderWidth: 1,
              borderColor:
                taskForm.deadline &&
                getTaskDeadlineValidationMessage(
                  taskForm.deadline
                )
                  ? '#FCA5A5'
                  : '#CBD5E1',
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 14,
              marginBottom: 8,
              opacity: busy ? 0.65 : 1,
            }}
          >
            <Text
              style={{
                color: taskForm.deadline
                  ? '#0F172A'
                  : '#94A3B8',
                fontWeight: '800',
              }}
            >
              {taskForm.deadline
                ? `Deadline: ${
                    formatTaskDeadlineForDisplay(
                      taskForm.deadline
                    )
                  }`
                : 'Select deadline date and time'}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.muted,
              { marginBottom: 12 },
            ]}
          >
            Deadline must be at least one hour
            from the current time.
          </Text>

          {taskForm.deadline &&
          getTaskDeadlineValidationMessage(
            taskForm.deadline
          ) ? (
            <Text
              style={{
                color: '#B91C1C',
                fontWeight: '700',
                marginBottom: 12,
              }}
            >
              {getTaskDeadlineValidationMessage(
                taskForm.deadline
              )}
            </Text>
          ) : null}

          {Platform.OS !== 'android' &&
          taskDeadlinePickerVisible ? (
            <DateTimePicker
              value={getTaskDeadlineDate(
                taskForm.deadline
              )}
              mode="datetime"
              display="default"
              minimumDate={
                getMinimumTaskDeadlineDate()
              }
              onChange={(
                event,
                selectedDate
              ) => {
                setTaskDeadlinePickerVisible(
                  false
                );

                if (
                  event?.type !== 'set' ||
                  !selectedDate
                ) {
                  return;
                }

                const normalizedDeadline =
                  formatTaskDeadlineValue(
                    selectedDate
                  );

                const validationMessage =
                  getTaskDeadlineValidationMessage(
                    normalizedDeadline
                  );

                if (validationMessage) {
                  setTaskNotice({
                    type: 'error',
                    text: validationMessage,
                  });
                  return;
                }

                setTaskNotice(null);

                setTaskForm((current) => ({
                  ...current,
                  deadline: normalizedDeadline,
                }));
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

          <SmallButton
            disabled={
              !groups.length ||
              !taskForm.title.trim() ||
              Boolean(
                getTaskDeadlineValidationMessage(
                  taskForm.deadline
                )
              ) ||
              Boolean(busy)
            }
            onPress={async () => {
              const groupId =
                taskForm.groupId ||
                selectedGroup?.id ||
                groups[0]?.id;

              setWorkspaceNotice(null);
              setTaskNotice(null);

              if (!groupId) {
                setTaskNotice({
                  type: 'warning',
                  text: 'Select a group first.',
                });
                return;
              }

              if (busy) {
                return;
              }

              const deadlineValidationMessage =
                getTaskDeadlineValidationMessage(
                  taskForm.deadline
                );

              if (deadlineValidationMessage) {
                setTaskNotice({
                  type: 'error',
                  text:
                    deadlineValidationMessage,
                });
                return;
              }

              const normalizedTaskDeadline =
                formatTaskDeadlineValue(
                  taskForm.deadline
                );

              setBusy('task-create');

              try {
                await addGroupTask(groupId, {
                  title: taskForm.title,
                  description: taskForm.description,
                  dueAt: normalizedTaskDeadline,
                  deadline: normalizedTaskDeadline,
                  xpReward: Number(
                    taskForm.xpReward || 10
                  ),
                });

                setTaskForm({
                  title: '',
                  description: '',
                  deadline: '',
                  xpReward: '10',
                  groupId: String(groupId),
                });

                setTaskNotice({
                  type: 'success',
                  text: 'Task added.',
                });

                await load();
              } catch (err) {
                setTaskNotice({
                  type: 'error',
                  text:
                    err?.response?.data?.message ||
                    err?.data?.message ||
                    err?.message ||
                    'Hindi maidagdag ang group task. Pakisubukan muli.',
                });
              } finally {
                setBusy('');
              }
            }}
          >
            Add Task
          </SmallButton>
        </SectionCard>

        <SectionCard>
          <View style={styles.actionRow}>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Groups</Text>
              <Text style={styles.muted}>Add students to existing groups and review assigned tasks.</Text>
            </View>
            <Text style={styles.lessonStatusChip}>{groups.length} group{groups.length === 1 ? '' : 's'}</Text>
          </View>

          {groups.length ? groups.map((group, teacherKeyIndex) => {
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
            const selectedStudentIds =
              new Set(
                getSelectedGroupStudentIds(
                  group.id
                )
              );
            const selectedCount =
              addableStudents.reduce(
                (total, student) => {
                  const studentId =
                    getStudentGroupMemberId(
                      student
                    );

                  return total + (
                    selectedStudentIds.has(
                      String(studentId)
                    )
                      ? 1
                      : 0
                  );
                },
                0
              );

            return (
              <View key={String((group.id) || 'teacher-map-4036') + '-' + teacherKeyIndex} style={[styles.lessonListCard, Number(selectedGroup?.id) === Number(group.id) && styles.selectedRow]}>
                <TouchableOpacity onPress={() => toggleGroupTools(group.id)}>
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
                  {/* Compact members preview (first 3 members) */}
                  <View style={styles.memberPreviewContainer}>
                    {members.slice(0, 3).map((member, teacherKeyIndex) => {
                      const student = getMemberStudent(member);
                      const studentName = student?.name || 'Learner';
                      const isLeader = String(member.groupRole || '').toLowerCase() === 'leader';

                      return (
                        <View key={String((member.id || studentName) || 'teacher-map-4108') + '-' + teacherKeyIndex} style={styles.memberPreviewChip}>
                          <Text numberOfLines={1} style={styles.memberPreviewChipText}>{studentName}</Text>
                          {isLeader ? <Text style={styles.memberPreviewLeader}>Leader</Text> : null}
                        </View>
                      );
                    })}

                    {members.length > 3 ? (
                      <Text style={styles.memberPreviewMore}>+{members.length - 3} more</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>

                {isOpen ? (
                  <>
                    <View style={styles.softRow}>
                      <Text style={styles.rowTitle}>Members</Text>
                      {members.length ? members.map((member, teacherKeyIndex) => {
                        const student = getMemberStudent(member);
                        const studentId = student.id || member.studentId;
                        const isLeader = String(member.groupRole || '').toLowerCase() === 'leader';

                        return (
                          <View key={String((member.id || studentId || student.studentCode || student.name) || 'teacher-map-4131') + '-' + teacherKeyIndex} style={styles.actionRow}>
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
                          {tasks.slice(0, 3).map((task, teacherKeyIndex) => (
                            <View key={String((task.id || task.title) || 'teacher-map-4169') + '-' + teacherKeyIndex} style={styles.actionRow}>
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

                    <View style={styles.groupManagementActions}>
                    <TouchableOpacity
                      style={[
                        styles.groupAddMemberToggle,
                        isOpen && styles.groupAddMemberToggleActive,
                        Boolean(busy) && styles.disabledButton,
                      ]}
                      disabled={Boolean(busy)}
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      accessibilityState={{
                        expanded: isOpen,
                        disabled: Boolean(busy),
                      }}
                      onPress={() => toggleGroupTools(group.id)}
                    >
                      <View style={styles.groupActionIcon}>
                        <Text style={styles.groupActionIconText}>
                          {isOpen ? '✕' : '👤'}
                        </Text>
                      </View>

                      <View style={styles.flex}>
                        <Text style={styles.groupAddMemberToggleTitle}>
                          {isOpen
                            ? 'Close Member Picker'
                            : 'Add Members'}
                        </Text>

                        <Text style={styles.groupAddMemberToggleSubtitle}>
                          {isOpen
                            ? 'Hide the learner selection panel'
                            : 'Choose eligible learners for this group'}
                        </Text>
                      </View>

                      <Text style={styles.groupActionChevron}>
                        {isOpen ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.groupSelectionSecondaryButton,
                        Boolean(busy) && styles.groupSelectionSecondaryButtonDisabled,
                      ]}
                      disabled={Boolean(busy)}
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      accessibilityLabel="Expand group"
                      onPress={() => {
                        startEditGroup(group);
                        toggleGroupTools(group.id);
                      }}
                    >
                      <Text style={styles.groupSelectionSecondaryButtonText}>
                        {isOpen ? '✕ Collapse' : '✏ Expand'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.groupRemoveButton,
                        Boolean(busy) && styles.disabledButton,
                      ]}
                      disabled={Boolean(busy)}
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      accessibilityLabel="Remove group"
                      onPress={() => confirmDeleteGroup(group)}
                    >
                      <Text style={styles.groupRemoveButtonText}>
                        🗑 Remove Group
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isOpen ? (
                    <View style={styles.groupMemberPanel}>
                      <View style={styles.groupMemberPanelHeader}>
                        <View style={styles.flex}>
                          <Text style={styles.groupMemberPanelTitle}>
                            Add Members
                          </Text>

                          <Text style={styles.groupMemberPanelDescription}>
                            {groupGrade
                              ? `Only Grade ${groupGrade} learners can be added to this group.`
                              : 'Set the group grade level before adding learners.'}
                          </Text>
                        </View>

                        {addableStudents.length ? (
                          <View style={styles.groupMemberCountBadge}>
                            <Text style={styles.groupMemberCountText}>
                              {selectedCount}/{addableStudents.length}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {addableStudents.length ? (
                        <>
                          <View style={styles.groupSelectionToolbar}>
                            <TouchableOpacity
                              style={[
                                styles.groupSelectionSecondaryButton,
                                (
                                  Boolean(busy) ||
                                  selectedCount === addableStudents.length
                                ) &&
                                  styles.groupSelectionSecondaryButtonDisabled,
                              ]}
                              disabled={
                                Boolean(busy) ||
                                selectedCount === addableStudents.length
                              }
                              activeOpacity={0.82}
                              accessibilityRole="button"
                              onPress={() =>
                                setAllSelectedGroupStudents(
                                  group.id,
                                  addableStudents
                                )
                              }
                            >
                              <Text
                                style={
                                  styles.groupSelectionSecondaryButtonText
                                }
                              >
                                Select All
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.groupSelectionSecondaryButton,
                                (
                                  Boolean(busy) ||
                                  selectedCount === 0
                                ) &&
                                  styles.groupSelectionSecondaryButtonDisabled,
                              ]}
                              disabled={
                                Boolean(busy) ||
                                selectedCount === 0
                              }
                              activeOpacity={0.82}
                              accessibilityRole="button"
                              onPress={() =>
                                clearSelectedGroupStudents(group.id)
                              }
                            >
                              <Text
                                style={
                                  styles.groupSelectionSecondaryButtonText
                                }
                              >
                                Clear
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.groupSelectionSummary}>
                            {selectedCount === 0
                              ? 'No learners selected.'
                              : `${selectedCount} of ${addableStudents.length} learners selected.`}
                          </Text>

                          <View style={styles.groupStudentList}>
                            {addableStudents.map((student, teacherKeyIndex) => {
                              const studentId =
                                getStudentGroupMemberId(student);

                              const isSelected =
                                selectedStudentIds.has(
                                  String(studentId)
                                );

                              const studentGrade =
                                student.gradeLevel ||
                                student.grade ||
                                '-';

                              const studentCode =
                                student.studentCode ||
                                student.student_code ||
                                '';

                              return (
                                <TouchableOpacity
                                  key={String((studentId ||
                                    studentCode ||
                                    student.name) || 'teacher-map-4359') + '-' + teacherKeyIndex}
                                  style={[
                                    styles.groupStudentRow,
                                    isSelected &&
                                      styles.groupStudentRowSelected,
                                    Boolean(busy) &&
                                      styles.disabledButton,
                                  ]}
                                  disabled={Boolean(busy)}
                                  activeOpacity={0.82}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{
                                    checked: isSelected,
                                    disabled: Boolean(busy),
                                  }}
                                  accessibilityLabel={`${student.name || 'Learner'}, Grade ${studentGrade}`}
                                  onPress={() => {
                                    if (!studentId) {
                                      Alert.alert(
                                        'Group Members',
                                        'Missing student details.'
                                      );
                                      return;
                                    }

                                    const gradeValidationMessage =
                                      getGroupMemberGradeValidationMessage(
                                        group,
                                        student
                                      );

                                    if (gradeValidationMessage) {
                                      Alert.alert(
                                        'Group Members',
                                        gradeValidationMessage
                                      );
                                      return;
                                    }

                                    toggleSelectedGroupStudent(
                                      group.id,
                                      studentId
                                    );
                                  }}
                                >
                                  <View
                                    style={[
                                      styles.groupStudentCheckbox,
                                      isSelected &&
                                        styles.groupStudentCheckboxSelected,
                                    ]}
                                  >
                                    <Text
                                      style={
                                        styles.groupStudentCheckboxMark
                                      }
                                    >
                                      {isSelected ? '✓' : ''}
                                    </Text>
                                  </View>

                                  <View style={styles.groupStudentIdentity}>
                                    <Text
                                      style={[
                                        styles.groupStudentName,
                                        isSelected &&
                                          styles.groupStudentNameSelected,
                                      ]}
                                      numberOfLines={1}
                                    >
                                      {student.name || 'Learner'}
                                    </Text>

                                    {studentCode ? (
                                      <Text
                                        style={styles.groupStudentMeta}
                                        numberOfLines={1}
                                      >
                                        {studentCode}
                                      </Text>
                                    ) : null}
                                  </View>

                                  <View
                                    style={styles.groupStudentGradeBadge}
                                  >
                                    <Text
                                      style={styles.groupStudentGradeText}
                                    >
                                      Grade {studentGrade}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>

                          <TouchableOpacity
                            style={[
                              styles.groupAddSelectedButton,
                              (
                                Boolean(busy) ||
                                selectedCount === 0
                              ) &&
                                styles.groupAddSelectedButtonDisabled,
                            ]}
                            disabled={
                              Boolean(busy) ||
                              selectedCount === 0
                            }
                            activeOpacity={0.86}
                            accessibilityRole="button"
                            accessibilityState={{
                              disabled:
                                Boolean(busy) ||
                                selectedCount === 0,
                            }}
                            onPress={() =>
                              handleBulkAddGroupMembers(
                                group,
                                addableStudents
                              )
                            }
                          >
                            <Text
                              style={styles.groupAddSelectedButtonText}
                            >
                              {busy === `members-bulk-${group.id}`
                                ? 'Adding Learners...'
                                : selectedCount > 0
                                  ? `Add ${selectedCount} Selected Learner${selectedCount === 1 ? '' : 's'}`
                                  : 'Select Learners to Add'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      ) : null}

                      {!groupGrade ? (
                        <View style={styles.groupMemberEmptyState}>
                          <Text style={styles.groupMemberEmptyIcon}>
                            🎓
                          </Text>

                          <Text style={styles.groupMemberEmptyTitle}>
                            Grade level required
                          </Text>

                          <Text style={styles.groupMemberEmptyText}>
                            Set this group's grade level before adding learners.
                          </Text>
                        </View>
                      ) : !addableStudents.length ? (
                        <View style={styles.groupMemberEmptyState}>
                          <Text style={styles.groupMemberEmptyIcon}>
                            ✓
                          </Text>

                          <Text style={styles.groupMemberEmptyTitle}>
                            No eligible learners available
                          </Text>

                          <Text style={styles.groupMemberEmptyText}>
                            All matching Grade {groupGrade} learners may already be group members.
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                  </>
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
          ].map(([icon, value, label], teacherKeyIndex) => (
            <View key={String((label) || 'teacher-map-4637') + '-' + teacherKeyIndex} style={styles.assessmentMetricCard}>
              <Text style={styles.assessmentMetricIcon}>{icon}</Text>
              <Text style={styles.assessmentMetricValue}>{value}</Text>
              <Text style={styles.assessmentMetricLabel}>{label}</Text>
            </View>
          ))}
        </View>

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
            placeholderTextColor="#94A3B8"
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

          {visibleRows.map((row, teacherKeyIndex) => (
            <View key={String((row.key || `${row.studentName}-${row.quizId}`) || 'teacher-map-4692') + '-' + teacherKeyIndex} style={styles.assessmentResultRow}>
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
            <Text style={styles.reviewAvatarText}>
              {item.student?.avatar || '🧒'}
            </Text>
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
          ].map(([icon, value, label], teacherKeyIndex) => (
            <View key={String((label) || 'teacher-map-5531') + '-' + teacherKeyIndex} style={styles.reviewMetricCard}>
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

          {pendingWritingReviewRows.length ? pendingWritingReviewRows.map((item, teacherKeyIndex) => {
            const draft = getReviewDraft('writing', item);
            const isSaving = Boolean(draft.saving);
            return (
              <View key={String((`writing-review-${getReviewSubmissionId(item)}`) || 'teacher-map-5571') + '-' + teacherKeyIndex} style={styles.reviewCard}>
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
                  placeholderTextColor="#94A3B8"
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
                    {visibleSpeechRows.map((item, teacherKeyIndex) => {
                  const attemptId = getSpeechReviewAttemptId(item);
                  const draftKey = getSpeechReviewDraftKey(item);
                  const speechDraft = reviewDrafts[draftKey] || {};
                  const scoreValue = String(speechDraft.score ?? item.score ?? item.rating ?? '');
                  const feedbackValue = String(speechDraft.feedback ?? item.teacherFeedback ?? item.feedback ?? '');
                  const recordingUrl = getSpeechReviewRecordingUrl(item);
                  const targetText = getSpeechReviewTargetText(item);

                  return (
                    <View key={String((`speech-review-${attemptId || draftKey}`) || 'teacher-map-5663') + '-' + teacherKeyIndex} style={styles.reviewCardCompact}>
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

          {gradedWritingReviewRows.length ? gradedWritingReviewRows.map((item, teacherKeyIndex) => (
            <View key={String((`graded-writing-${getReviewSubmissionId(item)}`) || 'teacher-map-5764') + '-' + teacherKeyIndex} style={styles.reviewCardCompact}>
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



    async function handleTeacherStudentSearch() {
    const query =
      teacherStudentSearchQuery.trim();

    if (query.length < 2) {
      Alert.alert(
        'Search Student',
        'Enter at least two letters of the student name.'
      );
      return;
    }

    setBusy('student-search');

    try {
      const data =
        await getActiveStudents(query);

      const results =
        Array.isArray(data?.students)
          ? data.students
          : Array.isArray(data)
            ? data
            : [];

      setTeacherStudentSearchResults(results);
      setSelectedTeacherStudent(null);
      setTeacherSectionSearchQuery('');
      setTeacherSelectedSection('');

      if (!results.length) {
        Alert.alert(
          'Search Student',
          'No existing student account matched that name.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Search Student',
        error?.message ||
          'Unable to search for students.'
      );
    } finally {
      setBusy('');
    }
  }

  async function handleTeacherSectionCreate() {
    const gradeLevel = Number(
      selectedTeacherStudent?.gradeLevel ??
      selectedTeacherStudent?.grade_level ??
      selectedTeacherStudent?.grade ??
      0
    );

    const section = String(
      teacherNewSectionName || ''
    )
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();

    if (!selectedTeacherStudent) {
      Alert.alert(
        'Add Section',
        'Select a student before adding a section.'
      );
      return;
    }

    if (
      !Number.isInteger(gradeLevel) ||
      gradeLevel < 1 ||
      gradeLevel > 6
    ) {
      Alert.alert(
        'Add Section',
        'The selected student has an invalid grade level.'
      );
      return;
    }

    if (section.length < 2) {
      Alert.alert(
        'Add Section',
        'Enter a section name with at least two characters.'
      );
      return;
    }

    if (section.length > 80) {
      Alert.alert(
        'Add Section',
        'The section name must not exceed 80 characters.'
      );
      return;
    }

    const currentSection = String(
      selectedTeacherStudent?.section || ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (
      currentSection &&
      currentSection.toLowerCase() ===
        section.toLowerCase()
    ) {
      Alert.alert(
        'Add Section',
        `${section} is already the student's current section.`
      );
      return;
    }

    setBusy('section-create');

    try {
      const data =
        await createTeacherSection(
          gradeLevel,
          section
        );

      const assignment =
        data?.assignment || {
          gradeLevel,
          section,
          status: 'active',
        };

      const savedSection = String(
        assignment?.section || section
      )
        .replace(/\s+/g, ' ')
        .trim();

      const assignmentRow = {
        ...assignment,
        gradeLevel:
          Number(
            assignment?.gradeLevel ??
            assignment?.grade_level ??
            gradeLevel
          ) || gradeLevel,
        section: savedSection,
        status: 'active',
      };

      function mergeAssignedClass(current) {
        const state =
          current &&
          typeof current === 'object'
            ? current
            : {};

        const assignedClasses =
          Array.isArray(state.assignedClasses)
            ? state.assignedClasses
            : [];

        const duplicateIndex =
          assignedClasses.findIndex((item) => {
            const itemGrade = Number(
              item?.gradeLevel ??
              item?.grade_level ??
              item?.grade ??
              0
            );

            const itemSection = String(
              item?.section ??
              item?.sectionName ??
              item?.classSection ??
              ''
            )
              .replace(/\s+/g, ' ')
              .trim()
              .toLowerCase();

            return (
              itemGrade === gradeLevel &&
              itemSection ===
                savedSection.toLowerCase()
            );
          });

        const nextAssignedClasses =
          duplicateIndex >= 0
            ? assignedClasses.map(
                (item, index) =>
                  index === duplicateIndex
                    ? {
                        ...item,
                        ...assignmentRow,
                      }
                    : item
              )
            : [
                ...assignedClasses,
                assignmentRow,
              ];

        return {
          ...state,
          assignedClasses:
            nextAssignedClasses,
        };
      }

      setDashboard((current) =>
        mergeAssignedClass(current)
      );

      setMonitoring((current) =>
        mergeAssignedClass(current)
      );

      setTeacherSelectedSection(
        savedSection
      );
      setTeacherNewSectionName('');
      setTeacherAddingSection(false);

      Alert.alert(
        data?.created
          ? 'Section Added'
          : 'Section Available',
        data?.message ||
          `${savedSection} is ready to use for Grade ${gradeLevel}.`
      );
    } catch (error) {
      Alert.alert(
        'Add Section',
        error?.response?.data?.message ||
          error?.data?.message ||
          error?.message ||
          'Unable to add the new section.'
      );
    } finally {
      setBusy('');
    }
  }


  async function handleTeacherStudentSectionUpdate() {
    const studentId =
      selectedTeacherStudent?.id ??
      selectedTeacherStudent?.studentId ??
      selectedTeacherStudent?.student_id;

    const section =
      teacherSelectedSection.trim();

    if (!studentId) {
      Alert.alert(
        'Update Section',
        'Select an existing student first.'
      );
      return;
    }

    if (!section) {
      Alert.alert(
        'Update Section',
        'Search for and select a section first.'
      );
      return;
    }

    const currentSection = String(
      selectedTeacherStudent?.section || ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (
      currentSection &&
      section.toLowerCase() ===
        currentSection.toLowerCase()
    ) {
      Alert.alert(
        'Update Section',
        'Select a different section before updating this student.'
      );
      return;
    }

    setBusy(
      `student-section-${studentId}`
    );

    try {
      const data =
        await updateStudentSection(
          studentId,
          section
        );

      const updatedStudent =
        data?.student || {
          ...selectedTeacherStudent,
          section,
        };

      setSelectedTeacherStudent(
        updatedStudent
      );

      setTeacherStudentSearchResults(
        (current) =>
          current.map((student) => {
            const currentId =
              student?.id ??
              student?.studentId ??
              student?.student_id;

            return String(currentId) ===
              String(studentId)
              ? {
                  ...student,
                  ...updatedStudent,
                  section,
                }
              : student;
          })
      );

      Alert.alert(
        'Section Updated',
        `${updatedStudent.name || 'Student'} is now assigned to ${section}.`
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Update Section',
        error?.message ||
          'Unable to update the student section.'
      );
    } finally {
      setBusy('');
    }
  }

  function renderStudents() {
    const selectedGrade = Number(
      selectedTeacherStudent?.gradeLevel ??
      selectedTeacherStudent?.grade_level ??
      selectedTeacherStudent?.grade ??
      0
    );

    const currentSection = String(
      selectedTeacherStudent?.section || ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    const currentSectionKey =
      currentSection.toLowerCase();

    const assignedSections = [
      ...new Set(
        [
          ...(
            Array.isArray(dashboard?.assignedClasses)
              ? dashboard.assignedClasses
              : []
          ),
          ...(
            Array.isArray(monitoring?.assignedClasses)
              ? monitoring.assignedClasses
              : []
          ),
        ]
          .filter((item) => {
            const grade = Number(
              item?.gradeLevel ??
              item?.grade_level ??
              item?.grade ??
              0
            );

            return grade === selectedGrade;
          })
          .map((item) =>
            String(
              item?.section ??
              item?.sectionName ??
              item?.classSection ??
              ''
            )
              .replace(/\s+/g, ' ')
              .trim()
          )
          .filter(Boolean)
      ),
    ].sort((first, second) =>
      first.localeCompare(second)
    );

    const availableSections =
      assignedSections.filter((section) => {
        const sectionKey =
          section.toLowerCase();

        const isCurrentSection =
          Boolean(currentSectionKey) &&
          sectionKey === currentSectionKey;

        return !isCurrentSection;
      });

    const sectionOptions =
      availableSections.map((section) => ({
        label: section,
        value: section,
      }));

    const teacherStudentClassGroups = Object.values(
      usableStudents.reduce((groups, student) => {
        const grade =
          getStudentGradeValue(student) || '—';

        const studentSection =
          normalizeSectionName(
            getStudentSectionValue(student)
          ) || 'Not assigned';

        const groupKey = `${grade}::${studentSection}`;

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            grade,
            section: studentSection,
            students: [],
          };
        }

        groups[groupKey].students.push(student);
        return groups;
      }, {})
    )
      .map((group) => ({
        ...group,
        students: [...group.students].sort(
          (first, second) =>
            String(
              first?.name ||
                first?.studentName ||
                'Student'
            ).localeCompare(
              String(
                second?.name ||
                  second?.studentName ||
                  'Student'
              )
            )
        ),
      }))
      .sort((first, second) => {
        const firstGrade = Number(first.grade);
        const secondGrade = Number(second.grade);

        if (
          Number.isFinite(firstGrade) &&
          Number.isFinite(secondGrade) &&
          firstGrade !== secondGrade
        ) {
          return firstGrade - secondGrade;
        }

        return String(first.section).localeCompare(
          String(second.section)
        );
      });

    return (
      <>
        <SectionCard>
          <Text style={styles.cardTitle}>
            Find Existing Student
          </Text>

          <Text style={styles.muted}>
            Student accounts are created only by
            administrators. Search for an existing
            student, then assign the student to one
            of your sections.
          </Text>

          <Field
            label="Search Student Name"
            value={teacherStudentSearchQuery}
            onChangeText={(value) => {
              setTeacherStudentSearchQuery(value);

              if (!value.trim()) {
                setTeacherStudentSearchResults([]);
                setSelectedTeacherStudent(null);
                setTeacherSectionSearchQuery('');
                setTeacherSelectedSection('');
              }
            }}
            placeholder="Enter at least two letters"
          />

          <Text style={styles.studentSearchHint}>
            Search using at least two letters of the
            student's name.
          </Text>

          <View style={styles.studentSearchActions}>
            <SmallButton
              disabled={
                Boolean(busy) ||
                teacherStudentSearchQuery
                  .trim()
                  .length < 2
              }
              onPress={
                handleTeacherStudentSearch
              }
            >
              {busy === 'student-search'
                ? 'Searching...'
                : 'Search Student'}
            </SmallButton>

            {teacherStudentSearchQuery.trim() ||
            teacherStudentSearchResults.length ? (
              <SmallButton
                tone="slate"
                disabled={Boolean(busy)}
                onPress={() => {
                  setTeacherStudentSearchQuery('');
                  setTeacherStudentSearchResults([]);
                  setSelectedTeacherStudent(null);
                  setTeacherSectionSearchQuery('');
                  setTeacherSelectedSection('');
                }}
              >
                Clear Search
              </SmallButton>
            ) : null}
          </View>

          {teacherStudentSearchResults.length ? (
            <View style={styles.studentResultsPanel}>
              <View style={styles.studentResultsHeader}>
                <View style={styles.studentResultsHeaderCopy}>
                  <Text style={styles.rowTitle}>
                    Search Results
                  </Text>

                  <Text style={styles.muted}>
                    Select one student to continue.
                  </Text>
                </View>

                <View style={styles.studentResultCountBadge}>
                  <Text
                    style={styles.studentResultCountText}
                  >
                    {teacherStudentSearchResults.length}{' '}
                    {teacherStudentSearchResults.length === 1
                      ? 'result'
                      : 'results'}
                  </Text>
                </View>
              </View>

              <View style={styles.studentResultList}>
                {teacherStudentSearchResults.map(
                  (student, teacherKeyIndex) => {
                    const studentId =
                      student?.id ??
                      student?.studentId ??
                      student?.student_id;

                    const selectedId =
                      selectedTeacherStudent?.id ??
                      selectedTeacherStudent?.studentId ??
                      selectedTeacherStudent?.student_id;

                    const isSelected =
                      studentId != null &&
                      selectedId != null &&
                      String(studentId) ===
                        String(selectedId);

                    const studentName =
                      student?.name || 'Student';

                    const studentCode =
                      student?.studentCode ||
                      student?.student_code ||
                      'No student code';

                    const studentGrade =
                      student?.gradeLevel ??
                      student?.grade_level ??
                      student?.grade ??
                      '-';

                    const studentSection =
                      student?.section ||
                      'Not assigned';

                    return (
                      <TouchableOpacity
                        key={String((studentId ||
                          studentCode ||
                          studentName) || 'teacher-map-6305') + '-' + teacherKeyIndex}
                        style={[
                          styles.studentSearchResultCard,
                          isSelected &&
                            styles.studentSearchResultCardSelected,
                        ]}
                        activeOpacity={0.84}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isSelected
                            ? `${studentName}, selected`
                            : `Select ${studentName}`
                        }
                        accessibilityState={{
                          selected: isSelected,
                        }}
                        onPress={() => {
                          setSelectedTeacherStudent(
                            student
                          );
                          setTeacherSectionSearchQuery(
                            ''
                          );
                          setTeacherSelectedSection(
                            ''
                          );
                        }}
                      >
                        <View
                          style={
                            styles.studentSearchResultTop
                          }
                        >
                          <View
                            style={[
                              styles.studentSearchAvatar,
                              isSelected &&
                                styles.studentSearchAvatarSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.studentSearchAvatarText,
                                isSelected &&
                                  styles.studentSearchAvatarTextSelected,
                              ]}
                            >
                              {String(studentName)
                                .trim()
                                .charAt(0)
                                .toUpperCase() || 'S'}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.studentSearchResultCopy
                            }
                          >
                            <Text
                              style={
                                styles.studentSearchResultName
                              }
                            >
                              {studentName}
                            </Text>

                            <Text
                              style={
                                styles.studentSearchResultMeta
                              }
                            >
                              {studentCode} • Grade{' '}
                              {studentGrade}
                            </Text>

                            <Text
                              style={
                                styles.studentSearchResultSection
                              }
                            >
                              Current section: {studentSection}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.studentSelectionBadge,
                            isSelected
                              ? styles.studentSelectionBadgeSelected
                              : styles.studentSelectionBadgeDefault,
                          ]}
                        >
                          <Text
                            style={[
                              styles.studentSelectionBadgeText,
                              isSelected &&
                                styles.studentSelectionBadgeTextSelected,
                            ]}
                          >
                            {isSelected
                              ? '✓ Selected Student'
                              : 'Select Student'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard style={styles.myStudentsCard}>
          <View style={styles.myStudentsHeader}>
            <View style={styles.myStudentsTitleRow}>
              <View style={styles.myStudentsTitleIcon}>
                <Text style={styles.myStudentsTitleEmoji}>
                  🎓
                </Text>
              </View>

              <View style={styles.myStudentsTitleCopy}>
                <Text style={styles.cardTitle}>
                  My Students
                </Text>

                <Text style={styles.muted}>
                  Students assigned to your classes,
                  grouped by grade and section.
                </Text>
              </View>
            </View>

            <View style={styles.myStudentsTotalBadge}>
              <Text style={styles.myStudentsTotalValue}>
                {usableStudents.length}
              </Text>

              <Text style={styles.myStudentsTotalLabel}>
                {usableStudents.length === 1
                  ? 'Student'
                  : 'Students'}
              </Text>
            </View>
          </View>

          {teacherStudentClassGroups.length ? (
            <View style={styles.myStudentsClassList}>
              {teacherStudentClassGroups.map(
                (classGroup) => (
                  <View
                    key={classGroup.key}
                    style={styles.myStudentsClassCard}
                  >
                    <View
                      style={styles.myStudentsClassHeader}
                    >
                      <View
                        style={
                          styles.myStudentsClassHeaderCopy
                        }
                      >
                        <Text
                          style={styles.myStudentsClassName}
                        >
                          Grade {classGroup.grade} •{' '}
                          {classGroup.section}
                        </Text>

                        <Text
                          style={styles.myStudentsClassMeta}
                        >
                          Assigned class
                        </Text>
                      </View>

                      <View
                        style={
                          styles.myStudentsClassCountBadge
                        }
                      >
                        <Text
                          style={
                            styles.myStudentsClassCountValue
                          }
                        >
                          {classGroup.students.length}
                        </Text>

                        <Text
                          style={
                            styles.myStudentsClassCountLabel
                          }
                        >
                          {classGroup.students.length === 1
                            ? 'Student'
                            : 'Students'}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={styles.myStudentsLearnerList}
                    >
                      {classGroup.students.map(
                        (student, studentIndex) => {
                          const studentName =
                            student?.name ||
                            student?.studentName ||
                            'Student';

                          const studentCode =
                            student?.studentCode ||
                            student?.student_code ||
                            '';

                          const stableStudentId =
                            getStudentStableId(student);

                          return (
                            <View
                              key={`${stableStudentId}-${studentIndex}`}
                              style={
                                styles.myStudentsLearnerRow
                              }
                            >
                              <View
                                style={
                                  styles.myStudentsLearnerAvatar
                                }
                              >
                                <Text
                                  style={
                                    styles.myStudentsLearnerAvatarText
                                  }
                                >
                                  {String(studentName)
                                    .trim()
                                    .charAt(0)
                                    .toUpperCase() || 'S'}
                                </Text>
                              </View>

                              <View
                                style={
                                  styles.myStudentsLearnerCopy
                                }
                              >
                                <Text
                                  style={
                                    styles.myStudentsLearnerName
                                  }
                                >
                                  {studentName}
                                </Text>

                                {studentCode ? (
                                  <Text
                                    style={
                                      styles.myStudentsLearnerCode
                                    }
                                  >
                                    Student ID: {studentCode}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          );
                        }
                      )}
                    </View>
                  </View>
                )
              )}
            </View>
          ) : (
            <View style={styles.myStudentsEmpty}>
              <View style={styles.myStudentsEmptyIcon}>
                <Text style={styles.myStudentsEmptyEmoji}>
                  👥
                </Text>
              </View>

              <Text style={styles.myStudentsEmptyTitle}>
                No assigned students yet
              </Text>

              <Text style={styles.myStudentsEmptyText}>
                Students assigned to your grade and
                section will appear here.
              </Text>
            </View>
          )}
        </SectionCard>

        {selectedTeacherStudent ? (
          <SectionCard>
            <View style={styles.studentUpdateHeader}>
              <View
                style={
                  styles.studentUpdateHeaderCopy
                }
              >
                <Text style={styles.cardTitle}>
                  Update Student Section
                </Text>

                <Text style={styles.muted}>
                  Choose a different assigned section
                  for this student.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.changeStudentButton}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel="Choose another student"
                onPress={() => {
                  setSelectedTeacherStudent(null);
                  setTeacherSectionSearchQuery('');
                  setTeacherSelectedSection('');
                }}
              >
                <Text
                  style={styles.changeStudentButtonText}
                >
                  Change
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.selectedStudentSummary}>
              <View style={styles.selectedStudentHeader}>
                <View style={styles.selectedStudentAvatar}>
                  <Text
                    style={
                      styles.selectedStudentAvatarText
                    }
                  >
                    {String(
                      selectedTeacherStudent.name ||
                        'Student'
                    )
                      .trim()
                      .charAt(0)
                      .toUpperCase() || 'S'}
                  </Text>
                </View>

                <View style={styles.selectedStudentCopy}>
                  <Text
                    style={styles.selectedStudentEyebrow}
                  >
                    SELECTED STUDENT
                  </Text>

                  <Text
                    style={styles.selectedStudentName}
                  >
                    {selectedTeacherStudent.name ||
                      'Student'}
                  </Text>

                  <Text
                    style={styles.selectedStudentMeta}
                  >
                    {selectedTeacherStudent.studentCode ||
                      selectedTeacherStudent.student_code ||
                      'No student code'}
                    {' • '}
                    Grade {selectedGrade || '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.currentSectionBanner}>
                <Text style={styles.currentSectionLabel}>
                  Current Section
                </Text>

                <Text style={styles.currentSectionValue}>
                  {currentSection || 'Not assigned'}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionChoiceLabel}>
              New Section
            </Text>

            <Text style={styles.sectionChoiceHelp}>
              Select a different section assigned to
              your account for Grade{' '}
              {selectedGrade || '-'}.
            </Text>

            <SelectMenu
              label="Select Existing Section"
              value={teacherSelectedSection}
              options={sectionOptions}
              onSelect={(value) => {
                setTeacherSelectedSection(value);
                setTeacherAddingSection(false);
                setTeacherNewSectionName('');
              }}
              disabled={
                Boolean(busy) ||
                !sectionOptions.length
              }
              placeholder={
                sectionOptions.length
                  ? 'Select an assigned section'
                  : 'No other existing sections'
              }
            />

            <Text style={styles.sectionDropdownHint}>
              Existing sections assigned to your
              account for Grade{' '}
              {selectedGrade || '-'} are listed here.
            </Text>

            {!sectionOptions.length ? (
              <View style={styles.sectionEmptyState}>
                <Text
                  style={styles.sectionEmptyStateText}
                >
                  No other existing section is
                  available. Add a new section for
                  this grade level below.
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.sectionCreateToggle,
                teacherAddingSection &&
                  styles.sectionCreateToggleActive,
                Boolean(busy) &&
                  styles.disabledButton,
              ]}
              disabled={Boolean(busy)}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel={
                teacherAddingSection
                  ? 'Cancel adding a new section'
                  : 'Add a new section'
              }
              onPress={() => {
                setTeacherAddingSection(
                  (current) => !current
                );
                setTeacherNewSectionName('');
              }}
            >
              <Text
                style={[
                  styles.sectionCreateToggleText,
                  teacherAddingSection &&
                    styles.sectionCreateToggleTextActive,
                ]}
              >
                {teacherAddingSection
                  ? 'Cancel New Section'
                  : '+ Add New Section'}
              </Text>
            </TouchableOpacity>

            {teacherAddingSection ? (
              <View style={styles.sectionCreateCard}>
                <Text
                  style={styles.sectionCreateTitle}
                >
                  Add Grade {selectedGrade || '-'} Section
                </Text>

                <Text
                  style={styles.sectionCreateHelp}
                >
                  The new section will be added only
                  under your existing Grade{' '}
                  {selectedGrade || '-'} assignment.
                </Text>

                <Field
                  label="New Section Name"
                  value={teacherNewSectionName}
                  onChangeText={
                    setTeacherNewSectionName
                  }
                  placeholder="Example: Courage"
                />

                <Text
                  style={styles.sectionCreateInputHint}
                >
                  Enter between 2 and 80 characters.
                </Text>

                <SmallButton
                  disabled={
                    Boolean(busy) ||
                    teacherNewSectionName
                      .trim()
                      .length < 2
                  }
                  onPress={
                    handleTeacherSectionCreate
                  }
                >
                  {busy === 'section-create'
                    ? 'Adding Section...'
                    : 'Add and Select Section'}
                </SmallButton>
              </View>
            ) : null}

            {teacherSelectedSection ? (
              <View style={styles.sectionChangePreview}>
                <Text
                  style={styles.sectionChangePreviewLabel}
                >
                  Ready to update
                </Text>

                <Text
                  style={styles.sectionChangePreviewValue}
                >
                  {currentSection || 'Not assigned'}
                  {'  →  '}
                  {teacherSelectedSection}
                </Text>
              </View>
            ) : (
              <Text style={styles.sectionSelectionHint}>
                Select a new section to enable the
                update action.
              </Text>
            )}

            <SmallButton
              disabled={
                Boolean(busy) ||
                !teacherSelectedSection ||
                teacherSelectedSection
                  .toLowerCase() ===
                  currentSectionKey
              }
              onPress={
                handleTeacherStudentSectionUpdate
              }
            >
              {busy.startsWith(
                'student-section-'
              )
                ? 'Updating Section...'
                : 'Update Student Section'}
            </SmallButton>
          </SectionCard>
        ) : null}
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
          <View style={styles.teacherParityHeader}>
            <View style={styles.flex}>
              <Text style={styles.teacherParityPageTitle}>
                Teacher Dashboard
              </Text>

              <Text style={styles.teacherParityPageSubtitle}>
                Manage lessons, monitor learners, and review classroom progress.
              </Text>
            </View>

            <SmallButton tone="red" onPress={confirmLogout}>
              Logout
            </SmallButton>
          </View>

          <View style={styles.teacherParityHero}>
            <View style={styles.teacherParityHeroDecorationOne} />
            <View style={styles.teacherParityHeroDecorationTwo} />

            <View style={styles.teacherParityHeroContent}>
              <View style={styles.teacherParityHeroIcon}>
                <Text style={styles.teacherParityHeroEmoji}>
                  👩‍🏫
                </Text>
              </View>

              <View style={styles.teacherParityHeroCopy}>
                <Text style={styles.teacherParityHeroKicker}>
                  TEACHER DASHBOARD
                </Text>

                <Text style={styles.teacherParityHeroTitle}>
                  Welcome back, Teacher!
                </Text>

                <Text style={styles.teacherParityHeroDescription}>
                  Create meaningful lessons, organize your classes,
                  and monitor each learner's progress in one place.
                </Text>

                <View style={styles.teacherParityHeroChips}>
                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.teacherParityHeroChip}
                    onPress={() => setSection('lessons')}
                  >
                    <Text style={styles.teacherParityHeroChipText}>
                      📚 Manage Lessons
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.82}
                    style={styles.teacherParityHeroChip}
                    onPress={() => setSection('students')}
                  >
                    <Text style={styles.teacherParityHeroChipText}>
                      🎓 View Students
                    </Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#93C5FD',
    shadowColor: '#0B3D22',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  workspaceNoticeSuccess: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
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

  taskNoticeCard: {
    width: '100%',
    alignSelf: 'stretch',

    marginTop: 14,
    marginBottom: 14,

    borderWidth: 1,
    borderRadius: 16,

    paddingVertical: 13,
    paddingHorizontal: 15,

    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },

  taskNoticeSuccess: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },

  taskNoticeWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },

  taskNoticeError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },

  taskNoticeText: {
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
    borderColor: '#BFDBFE',
    shadowColor: '#1E40AF',
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
    shadowColor: '#1E40AF',
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
    color: '#0F172A',
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
    color: '#0F172A',
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
    backgroundColor: '#DBEAFE',
    borderColor: '#1D4ED8',
  },
  canvasStudentName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  canvasStudentNameActive: {
    color: '#0F172A',
  },
  canvasStudentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  canvasStudentMetaActive: {
    color: '#0F172A',
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
    color: '#0F172A',
    fontWeight: '900',
  },
  canvasSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  canvasSectionLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 2,
  },
  canvasSubmissionCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  canvasSubmissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  canvasSubmissionType: {
    color: '#0F172A',
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
    color: '#0F172A',
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
    color: '#0F172A',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  canvasPlayButton: {
    backgroundColor: '#2563EB',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 11,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    borderColor: '#BFDBFE',
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
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  canvasReviewButton: {
    backgroundColor: '#2563EB',
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

  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  page: { padding: 16, paddingBottom: 44 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  flex: { flex: 1 },
  title: { color: '#0F172A', fontSize: 29, fontWeight: '900' },
  subtitle: { color: '#64748B', marginTop: 5, lineHeight: 20 },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navChip: {
    flexDirection: 'row',
    flexShrink: 0,
    gap: 5,
    minHeight: 40,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navChipActive: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.16,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  navLabel: { color: '#64748B', fontWeight: '800' },
  navLabelActive: { color: '#1D4ED8', fontWeight: '900' },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, marginBottom: 14, shadowColor: '#1E40AF', shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardTitle: { color: '#0F172A', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  assignedClassesCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
  },
  assignedClassesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  assignedClassesHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  assignedClassesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedClassesTitleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DBEAFE',
    marginRight: 12,
  },
  assignedClassesTitleEmoji: {
    fontSize: 23,
  },
  assignedClassesTitle: {
    color: '#0F172A',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  assignedClassesSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  assignedClassesCount: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  assignedClassesCountValue: {
    color: '#1D4ED8',
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '900',
  },
  assignedClassesCountLabel: {
    color: '#475569',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignedClassesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  assignedClassCard: {
    width: '100%',
    marginBottom: 10,
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#1D4ED8',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  assignedClassTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  assignedClassGradeBadge: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  assignedClassGradeBadgeLabel: {
    color: '#DBEAFE',
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  assignedClassGradeBadgeValue: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  assignedClassStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  assignedClassStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  assignedClassStatusText: {
    color: '#166534',
    fontSize: 11,
    fontWeight: '900',
  },
  assignedClassBody: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  assignedClassSectionLabel: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  assignedClassSection: {
    color: '#0F172A',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  assignedClassFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  assignedClassFooterIcon: {
    fontSize: 14,
    marginRight: 7,
  },
  assignedClassFooterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  assignedClassesEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  assignedClassesEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  assignedClassesEmptyEmoji: {
    fontSize: 28,
  },
  assignedClassesEmptyTitle: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  assignedClassesEmptyText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },

  statCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 4,
 width: '48%' },
  statIcon: { fontSize: 24 },
  statValue: { color: '#0F172A', fontWeight: '900', fontSize: 28, marginTop: 6 },
  selectTrigger: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectTriggerDisabled: { opacity: 0.6 },
  selectValue: { color: '#0F172A', fontWeight: '800', flex: 1 },
  selectChevron: { color: '#64748B', fontWeight: '900', marginLeft: 10 },
  selectOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'flex-end' },
  selectSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, maxHeight: '72%' },
  selectTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  selectOption: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 8, backgroundColor: '#F8FAFC' },
  selectOptionActive: { borderColor: '#1D4ED8', backgroundColor: '#DBEAFE' },
  selectOptionText: { color: '#0F172A', fontWeight: '800' },
  selectOptionTextActive: { color: '#0F172A', fontWeight: '900' },
  selectClose: { backgroundColor: '#2563EB', borderRadius: 14, padding: 13, alignItems: 'center', marginTop: 12 },
  selectCloseText: { color: '#FFFFFF', fontWeight: '900' },
  muted: { color: '#64748B', marginTop: 4 },
  body: { color: '#475569', marginTop: 7, lineHeight: 20 },
  softRow: { backgroundColor: '#EFF6FF', borderRadius: 14, padding: 12, marginTop: 9 },
  selectedRow: { borderWidth: 2, borderColor: '#1D4ED8' },
  studentSearchHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 7,
    marginBottom: 12,
  },
  studentSearchActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  studentResultsPanel: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginTop: 16,
  },
  studentResultsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  studentResultsHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  studentResultCountBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  studentResultCountText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  studentResultList: {
    gap: 10,
  },
  studentSearchResultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 13,
  },
  studentSearchResultCardSelected: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#1D4ED8',
  },
  studentSearchResultTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  studentSearchAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  studentSearchAvatarSelected: {
    backgroundColor: '#2563EB',
  },
  studentSearchAvatarText: {
    color: '#475569',
    fontSize: 18,
    fontWeight: '900',
  },
  studentSearchAvatarTextSelected: {
    color: '#FFFFFF',
  },
  studentSearchResultCopy: {
    flex: 1,
    minWidth: 0,
  },
  studentSearchResultName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  studentSearchResultMeta: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 3,
  },
  studentSearchResultSection: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  studentSelectionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 11,
  },
  studentSelectionBadgeDefault: {
    backgroundColor: '#F1F5F9',
  },
  studentSelectionBadgeSelected: {
    backgroundColor: '#2563EB',
  },
  studentSelectionBadgeText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  studentSelectionBadgeTextSelected: {
    color: '#FFFFFF',
  },
  studentUpdateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  studentUpdateHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  changeStudentButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeStudentButtonText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '900',
  },
  selectedStudentSummary: {
    backgroundColor: '#EFF6FF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    marginTop: 14,
  },
  selectedStudentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedStudentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedStudentAvatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  selectedStudentCopy: {
    flex: 1,
    minWidth: 0,
  },
  selectedStudentEyebrow: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  selectedStudentName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  selectedStudentMeta: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  currentSectionBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  currentSectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentSectionValue: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  sectionChoiceLabel: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 18,
  },
  sectionChoiceHelp: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  sectionDropdownHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    marginTop: 8,
  },
  sectionCreateToggle: {
    width: '100%',
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 14,
  },
  sectionCreateToggleActive: {
    borderColor: '#64748B',
    backgroundColor: '#F8FAFC',
  },
  sectionCreateToggleText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionCreateToggleTextActive: {
    color: '#475569',
  },
  sectionCreateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 14,
    marginTop: 10,
  },
  sectionCreateTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  sectionCreateHelp: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  sectionCreateInputHint: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  sectionEmptyState: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 10,
  },
  sectionEmptyStateText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionChangePreview: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
    padding: 12,
    marginTop: 14,
  },
  sectionChangePreviewLabel: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionChangePreviewValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  sectionSelectionHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
  },
    buttonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  secondaryButtonText: {
    color: '#334155',
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  lessonListCard: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 12 },
  lessonListHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  lessonStatusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900', overflow: 'hidden' },
  lessonStatusPublished: { backgroundColor: '#DBEAFE', color: '#0F172A' },
  lessonStatusDraft: { backgroundColor: '#FEF3C7', color: '#92400E' },
  lessonMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  lessonMetaPill: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, padding: 9, minWidth: '47%', flex: 1 },
  lessonMetaLabel: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  lessonMetaValue: { color: '#0F172A', fontWeight: '900', marginTop: 3 },
  groupManagementActions: {
    marginTop: 14,
    gap: 10,
  },
  groupAddMemberToggle: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  groupAddMemberToggleActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
  },
  groupActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupActionIconText: {
    fontSize: 18,
  },
  groupAddMemberToggleTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  groupAddMemberToggleSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 2,
  },
  groupActionChevron: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '900',
  },
  groupRemoveButton: {
    minHeight: 46,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  groupRemoveButtonText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '900',
  },
  groupMemberPanel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    padding: 14,
    marginTop: 12,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  groupMemberPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  groupMemberPanelTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  groupMemberPanelDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  groupMemberCountBadge: {
    minWidth: 48,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  groupMemberCountText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  groupSelectionToolbar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  groupSelectionSecondaryButton: {
    minHeight: 42,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  groupSelectionSecondaryButtonDisabled: {
    opacity: 0.45,
  },
  groupSelectionSecondaryButtonText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  groupSelectionSummary: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 4,
  },
  groupStudentList: {
    gap: 8,
    marginTop: 8,
  },
  groupStudentRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupStudentRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1D4ED8',
    borderWidth: 2,
  },
  groupStudentCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupStudentCheckboxSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  groupStudentCheckboxMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  groupStudentIdentity: {
    flex: 1,
    minWidth: 0,
  },
  groupStudentName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  groupStudentNameSelected: {
    color: '#0F172A',
  },
  groupStudentMeta: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  groupStudentGradeBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  groupStudentGradeText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '900',
  },
  memberPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  memberPreviewChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF6',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 80,
    maxWidth: 160,
  },
  memberPreviewChipText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  memberPreviewLeader: {
    marginTop: 4,
    color: '#065f46',
    fontSize: 11,
    fontWeight: '900',
  },
  memberPreviewMore: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 6,
  },
  groupAddSelectedButton: {
    minHeight: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 16,
    shadowColor: '#1E40AF',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  groupAddSelectedButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  groupAddSelectedButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  groupMemberEmptyState: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    marginTop: 14,
  },
  groupMemberEmptyIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  groupMemberEmptyTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  groupMemberEmptyText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 5,
  },
  lessonActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rowTitle: { color: '#0F172A', fontWeight: '800' },
  statusText: { color: '#0F172A', fontWeight: '800', marginTop: 5 },
  warning: { color: '#B45309', fontWeight: '800', marginTop: 5 },
  field: { marginTop: 12 },
  fieldLabel: { color: '#334155', fontWeight: '800', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, color: '#0F172A', backgroundColor: '#FFF' },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  smallButton: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 8 },
  greenButton: {
      backgroundColor: '#16A34A',
      borderColor: '#15803D',
    },
  darkBlueButton: { backgroundColor: '#1E3A8A' },
  mediumBlueButton: { backgroundColor: '#2563EB' },
  slateButton: {
      backgroundColor: '#FFFFFF',
      borderColor: '#CBD5E1',
    },
  redButton: {
      backgroundColor: '#DC2626',
      borderColor: '#B91C1C',
    },
  disabledButton: { opacity: 0.5 },
  smallButtonText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  builderTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 12,
  },
  stepChip: {
    flexShrink: 0,
    backgroundColor: '#FFF',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepChipActive: { backgroundColor: '#DBEAFE', borderColor: '#1D4ED8' },
  stepText: { color: '#64748B', fontWeight: '800', fontSize: 12, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  stepTextActive: { color: '#0F172A', fontWeight: '900', fontSize: 12, lineHeight: 16, textAlign: 'center', includeFontPadding: false },
  previewTitle: { color: '#1E40AF', fontSize: 24, fontWeight: '900' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  myStudentsCard: {
    gap: 4,
  },
  myStudentsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  myStudentsTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  myStudentsTitleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  myStudentsTitleEmoji: {
    fontSize: 23,
  },
  myStudentsTitleCopy: {
    flex: 1,
  },
  myStudentsTotalBadge: {
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  myStudentsTotalValue: {
    color: '#5B21B6',
    fontSize: 19,
    fontWeight: '900',
  },
  myStudentsTotalLabel: {
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  myStudentsClassList: {
    gap: 14,
  },
  myStudentsClassCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myStudentsClassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  myStudentsClassHeaderCopy: {
    flex: 1,
  },
  myStudentsClassName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  myStudentsClassMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  myStudentsClassCountBadge: {
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
  },
  myStudentsClassCountValue: {
    color: '#1D4ED8',
    fontSize: 16,
    fontWeight: '900',
  },
  myStudentsClassCountLabel: {
    color: '#1E40AF',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  myStudentsLearnerList: {
    paddingHorizontal: 14,
  },
  myStudentsLearnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  myStudentsLearnerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
  },
  myStudentsLearnerAvatarText: {
    color: '#6D28D9',
    fontSize: 15,
    fontWeight: '900',
  },
  myStudentsLearnerCopy: {
    flex: 1,
  },
  myStudentsLearnerName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '900',
  },
  myStudentsLearnerCode: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  myStudentsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  myStudentsEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    marginBottom: 11,
  },
  myStudentsEmptyEmoji: {
    fontSize: 26,
  },
  myStudentsEmptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  myStudentsEmptyText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 5,
  },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  studentAvatar: { fontSize: 28 },
  progressTrack: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginTop: 7 },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 99 },
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#1E40AF',
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
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  assessmentMetricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  assessmentSearchInput: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 12,
  },
  assessmentCountText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 10,
  },
  assessmentResultRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  assessmentLessonTitle: {
    color: '#0F172A',
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
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  assessmentStatusWarn: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  assessmentStatusBad: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  assessmentStatusGoodText: {
    color: '#0F172A',
  },
  assessmentStatusWarnText: {
    color: '#92400E',
  },
  assessmentStatusBadText: {
    color: '#B91C1C',
  },
  assessmentMetaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  assessmentMetaItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  assessmentMetaLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  assessmentMetaValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 3,
  },
  assessmentEmptyState: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    borderColor: '#1D4ED8',
    backgroundColor: '#EFF6FF',
    marginTop: 14,
  },
  assessmentShowMoreText: {
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#1E40AF',
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
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  reviewMetricLabel: {
    color: '#64748B',
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
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  reviewMiniPill: {
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  reviewMiniPillText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '900',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 14,
    marginTop: 12,
  },
  reviewCardCompact: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  reviewIdentityContent: {
    flex: 1,
  },
  reviewStudentName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  reviewStudentMeta: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  reviewLessonLine: {
    color: '#0F172A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reviewEvidenceLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewEvidenceValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 3,
  },
  reviewContentBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    padding: 12,
    marginBottom: 12,
  },
  reviewBlockLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  reviewBlockText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  reviewInputLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 8,
  },
  reviewTextInput: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
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
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  reviewFileButtonText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  reviewXpPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  reviewXpPillText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
  },
  reviewFeedbackText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 10,
  },
  reviewEmptyPanel: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    backgroundColor: '#125334',
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

  // TEACHER_WEB_MOBILE_DASHBOARD_PARITY_V1
  teacherParityHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 16,
  },
  teacherParityPageTitle: {
    color: '#0F172A',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  teacherParityPageSubtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  teacherParityHero: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    marginBottom: 18,
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#15803D',
    borderWidth: 1,
    borderColor: '#16A34A',
    shadowColor: '#14532D',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  teacherParityHeroDecorationOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 999,
    top: -90,
    right: -55,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  teacherParityHeroDecorationTwo: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    bottom: -65,
    left: -30,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  teacherParityHeroContent: {
    position: 'relative',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  teacherParityHeroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  teacherParityHeroEmoji: {
    fontSize: 31,
  },
  teacherParityHeroCopy: {
    flex: 1,
  },
  teacherParityHeroKicker: {
    color: '#DCFCE7',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  teacherParityHeroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.35,
    marginTop: 4,
  },
  teacherParityHeroDescription: {
    color: '#ECFDF5',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 7,
  },
  teacherParityHeroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
  },
  teacherParityHeroChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  teacherParityHeroChipText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '900',
  },
  teacherParityMetricsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  teacherParityMetricCard: {
    width: '48.5%',
    minHeight: 166,
    marginBottom: 12,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  teacherParityMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teacherParityMetricIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  teacherParityMetricEmoji: {
    fontSize: 22,
  },
  teacherParityMetricArrow: {
    color: '#94A3B8',
    fontSize: 20,
    fontWeight: '900',
  },
  teacherParityMetricValue: {
    color: '#0F172A',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '900',
    marginTop: 14,
  },
  teacherParityMetricLabel: {
    color: '#1E293B',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  teacherParityMetricDescription: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: 3,
  },
  teacherParityDashboardCard: {
    width: '100%',
    borderRadius: 22,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  teacherParitySectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  teacherParitySectionIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  teacherParitySectionEmoji: {
    fontSize: 22,
  },

});
