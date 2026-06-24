import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import StudentScreenHeader from '../components/StudentScreenHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

const HIDDEN_GROUP_STATUSES = new Set([
  'archived',
  'deleted',
  'inactive',
  'removed',
  'disabled',
]);

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'pending', label: 'Pending' },
  { key: 'done', label: 'Done' },
];

function isVisibleGroupRecord(item) {
  if (!item) return false;

  const status = String(
    item.status ||
    item.state ||
    item.visibility ||
    ''
  ).trim().toLowerCase();

  return !(
    HIDDEN_GROUP_STATUSES.has(status) ||
    item.deletedAt ||
    item.deleted_at ||
    item.archivedAt ||
    item.archived_at ||
    item.removedAt ||
    item.removed_at ||
    item.isDeleted ||
    item.deleted ||
    item.isArchived ||
    item.archived
  );
}

function getVisibleGroups(rawGroups = []) {
  return (Array.isArray(rawGroups) ? rawGroups : [])
    .filter(isVisibleGroupRecord)
    .map((group) => ({
      ...group,
      tasks: (Array.isArray(group.tasks) ? group.tasks : [])
        .filter(isVisibleGroupRecord),
    }));
}

function getTaskBucket(task) {
  if (task?.completed) return 'done';
  if (task?.pendingTeacherCheck) return 'pending';
  return 'todo';
}

function taskStatus(task) {
  if (task.completed) return 'Approved';
  if (task.pendingTeacherCheck) return 'Pending teacher review';
  if (task.returnedByTeacher) return 'Returned for revision';
  return 'Not submitted';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function taskSearchText(task) {
  return normalizeText([
    task?.title,
    task?.description,
    taskStatus(task),
    task?.xpReward,
  ].join(' '));
}

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [missionStep, setMissionStep] = useState('choose');
  const [selectedRole, setSelectedRole] = useState(null);
  const [completedTaskId, setCompletedTaskId] = useState(null);

  const TEAM_ROLES = [
    {
      key: 'reader',
      icon: '📖',
      title: 'Reader',
      description: 'Basahin ang salita o kuwento.',
    },
    {
      key: 'speaker',
      icon: '🎤',
      title: 'Speaker',
      description: 'Bigkasin ang sagot nang malinaw.',
    },
    {
      key: 'helper',
      icon: '⭐',
      title: 'Helper',
      description: 'Tumulong sa kaklase.',
    },
    {
      key: 'checker',
      icon: '✅',
      title: 'Checker',
      description: 'Tingnan kung tapos na ang gawain.',
    },
  ];


  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true);
    setError('');

    try {
      const dashboard = await api('/dashboard');
      setGroups(getVisibleGroups(dashboard.groups));
      setStudent(dashboard.student || null);
    } catch (err) {
      setError(err.message || 'Unable to load group tasks.');
    } finally {
      if (!quiet) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load({ quiet: true });
  }, [load]);

  async function complete(taskId) {
    if (busyTaskId) return;

    setBusyTaskId(taskId);
    setNotice(null);

    try {
      const data = await api(`/groups/tasks/${taskId}/complete`, { method: 'POST' });
      setNotice({
        tone: 'success',
        message: data.message || 'Submitted for teacher review.',
      });

      setCompletedTaskId(taskId);
      setMissionStep('done');

      await load({ quiet: true });
    } catch (err) {
      setNotice({
        tone: 'error',
        message: err.message || 'Unable to submit this task.',
      });
    } finally {
      setBusyTaskId(null);
    }
  }

  const summary = useMemo(() => {
    const tasks = groups.flatMap((group) => group.tasks || []);

    return {
      groups: groups.length,
      todo: tasks.filter((task) => getTaskBucket(task) === 'todo').length,
      pending: tasks.filter((task) => getTaskBucket(task) === 'pending').length,
      done: tasks.filter((task) => getTaskBucket(task) === 'done').length,
    };
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const search = normalizeText(query);

    return groups
      .map((group) => {
        const tasks = Array.isArray(group.tasks) ? group.tasks : [];
        const groupMatches = !search || normalizeText([
          group.name,
          group.description,
          group.currentStudentIsLeader ? 'leader' : 'member',
        ].join(' ')).includes(search);

        const filteredTasks = tasks.filter((task) => {
          const bucket = getTaskBucket(task);
          const matchesFilter = statusFilter === 'all' || bucket === statusFilter;
          const matchesSearch = !search || groupMatches || taskSearchText(task).includes(search);

          return matchesFilter && matchesSearch;
        });

        if (statusFilter === 'all' && groupMatches) {
          return { ...group, tasks };
        }

        if (filteredTasks.length) {
          return { ...group, tasks: filteredTasks };
        }

        return null;
      })
      .filter(Boolean);
  }, [groups, query, statusFilter]);

  const hasFilters = Boolean(query.trim()) || statusFilter !== 'all';

  const selectedGroup =
    filteredGroups.find(
      (group) => Number(group.id) === Number(selectedGroupId)
    ) || null;

  function clearFilters() {
    setQuery('');
    setStatusFilter('all');
  }

  function renderFilterChip(item) {
    const active = statusFilter === item.key;

    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.filterChip, active && styles.filterChipActive]}
        onPress={() => setStatusFilter(item.key)}
        activeOpacity={0.85}
      >
        <Text style={[styles.filterText, active && styles.filterTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }

  function renderTask(group, task) {
    const bucket = getTaskBucket(task);
    const isBusy = busyTaskId === task.id;
    const canSubmit = group.currentStudentIsLeader && !task.completed && !task.pendingTeacherCheck;

    return (
      <Card key={task.id} style={styles.inner}>
        <View style={styles.taskHeader}>
          <Text style={styles.task}>{task.title}</Text>
          <View style={[styles.statusPill, bucket === 'done' && styles.statusDone, bucket === 'pending' && styles.statusPending]}>
            <Text style={[styles.statusPillText, bucket === 'done' && styles.statusDoneText, bucket === 'pending' && styles.statusPendingText]}>
              {taskStatus(task)}
            </Text>
          </View>
        </View>

        {task.description ? (
          <Text style={styles.taskDescription}>{task.description}</Text>
        ) : (
          <Text style={styles.muted}>
            Complete this group activity with your teammates.
          </Text>
        )}

        <View style={styles.taskFooter}>
          <Text style={styles.taskXp}>+{task.xpReward || 0} XP</Text>
          {task.returnedByTeacher ? (
            <Text style={styles.revisionText}>Needs revision</Text>
          ) : null}
        </View>

        {canSubmit && (
          <PrimaryButton variant="secondary" onPress={() => complete(task.id)}>
            {isBusy ? 'Submitting...' : task.returnedByTeacher ? 'I helped my team!' : 'I helped my team!'}
          </PrimaryButton>
        )}
      </Card>
    );
  }


  function renderJobSelection(group) {
    return (
      <Card style={styles.jobScreen}>
        <Text style={styles.jobTitle}>
          Choose your job
        </Text>

        <Text style={styles.jobSubtitle}>
          Every teammate has a special role.
        </Text>

        <View style={styles.jobGrid}>
          {TEAM_ROLES.map((role) => (
            <TouchableOpacity
              key={role.key}
              style={styles.jobCard}
              onPress={() => {
                setSelectedRole(role);
                setMissionStep('task');
              }}
            >
              <Text style={styles.jobIcon}>
                {role.icon}
              </Text>

              <Text style={styles.jobCardTitle}>
                {role.title}
              </Text>

              <Text style={styles.jobCardDescription}>
                {role.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    );
  }


  function renderWaitingForTeacher() {
    return (
      <Card style={styles.waitingCard}>
        <Text style={styles.waitingIcon}>
          🎉
        </Text>

        <Text style={styles.waitingTitle}>
          Waiting for Teacher
        </Text>

        <Text style={styles.waitingSubtitle}>
          Your teacher will check your team's work.
        </Text>

        <PrimaryButton
          onPress={() => {
            setMissionStep('choose');
            setSelectedRole(null);
            setSelectedGroupId(null);
            setCompletedTaskId(null);
          }}
        >
          Back to Teams
        </PrimaryButton>
      </Card>
    );
  }

  function renderGroup(group) {
    const tasks = Array.isArray(group.tasks) ? group.tasks : [];
    const memberCount = Array.isArray(group.members) ? group.members.length : 0;

    return (
      <Card key={group.id} style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIconWrap}>
            <Text style={styles.groupIcon}>🤝</Text>
          </View>

          <View style={styles.groupTitleBlock}>
            <Text style={styles.group}>{group.name}</Text>
            <Text style={styles.muted}>
              {group.description || 'Your assigned learning group.'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{tasks.length} task{tasks.length === 1 ? '' : 's'}</Text>
          </View>
          {memberCount > 0 ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{memberCount} member{memberCount === 1 ? '' : 's'}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.role}>
          {group.currentStudentIsLeader
            ? 'You are the group leader. Submit finished tasks for teacher review.'
            : 'Work with your teammates. Your group leader submits tasks.'}
        </Text>

        {tasks.map((task) => renderTask(group, task))}

        {tasks.length === 0 && (
          <View style={styles.emptyMini}>
            <Text style={styles.emptyMiniTitle}>No tasks here yet</Text>
            <Text style={styles.muted}>
              {hasFilters
                ? 'Try another search or filter.'
                : 'No tasks have been assigned to this group yet.'}
            </Text>
          </View>
        )}
      </Card>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        <StudentScreenHeader
          navigation={navigation}
          avatar={student?.avatar}
          gradeLevel={student?.gradeLevel}
        />

        <View style={styles.header}>
          <View style={styles.heroCard}>
            <Text style={styles.title}>👥 Group Tasks</Text>
            <Text style={styles.muted}>
              Work together, track progress, and submit tasks for teacher approval.
            </Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.groups}</Text>
                <Text style={styles.summaryLabel}>Groups</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.todo}</Text>
                <Text style={styles.summaryLabel}>To Do</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.pending}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.done}</Text>
                <Text style={styles.summaryLabel}>Done</Text>
              </View>
            </View>
          </View>
        </View>

        <Card style={styles.toolsCard}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search groups or tasks"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTERS.map(renderFilterChip)}
          </ScrollView>
        </Card>

        {notice ? (
          <View style={[styles.notice, notice.tone === 'error' && styles.noticeError]}>
            <Text style={[styles.noticeText, notice.tone === 'error' && styles.noticeErrorText]}>
              {notice.message}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.muted}>Loading group tasks...</Text>
          </View>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
            <PrimaryButton variant="secondary" onPress={() => load()}>
              Try Again
            </PrimaryButton>
          </Card>
        ) : filteredGroups.length ? (
          <>
            <Card style={styles.teamMissionCard}>
              <Text style={styles.teamMissionTitle}>
                👥 Team Mission
              </Text>

              <Text style={styles.teamMissionSubtitle}>
                Choose. Help. Done.
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Choose</Text>
                </View>

                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Job</Text>
                </View>

                <View style={styles.stepPill}>
                  <Text style={styles.stepText}>Task</Text>
                </View>

                <View style={styles.stepDone}>
                  <Text style={styles.stepDoneText}>
                    Done ({summary.done})
                  </Text>
                </View>
              </View>

              {filteredGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.teamCard}
                  onPress={() => {
                    setSelectedGroupId(group.id);
                    setMissionStep('job');
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.group}>
                      👥 {group.name}
                    </Text>

                    <Text style={styles.muted}>
                      {(group.tasks || []).filter(
                        (task) => !task.completed
                      ).length} missions left
                    </Text>
                  </View>

                  <Text style={styles.teamArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </Card>

            {missionStep === 'job' && selectedGroup
              ? renderJobSelection(selectedGroup)
              : null}

            {missionStep === 'task' && selectedGroup
              ? renderGroup(selectedGroup)
              : null}

            {missionStep === 'done'
              ? renderWaitingForTeacher()
              : null}
          </>
        ) : (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>
              {groups.length ? 'No matching group tasks' : 'No group assigned yet'}
            </Text>
            <Text style={styles.muted}>
              {groups.length
                ? 'Try a different search or filter to find your group activity.'
                : 'Your teacher can add you to a group and assign collaborative tasks.'}
            </Text>

            {hasFilters ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.85}>
                <Text style={styles.clearButtonText}>Clear search and filters</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  screen: { flex: 1, backgroundColor: '#F6FFF5' },
  content: {
    padding: 16,
    paddingTop: 32,
    paddingBottom: 44,
  },
  header: {
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 26,
    padding: 20,
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  toolsCard: {
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#DDE7D8',
    borderWidth: 1,
    borderRadius: 18,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterRow: {
    gap: 8,
    paddingTop: 12,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  filterChipActive: {
    backgroundColor: colors.secondary,
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  notice: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  noticeError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  noticeText: {
    color: '#166534',
    fontWeight: '800',
  },
  noticeErrorText: {
    color: '#B91C1C',
  },
  groupCard: {
    marginBottom: 14,
  },
  groupHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  groupIconWrap: {
    backgroundColor: '#DCFCE7',
    borderRadius: 18,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIcon: {
    fontSize: 22,
  },
  groupTitleBlock: {
    flex: 1,
  },
  group: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
  },
  muted: {
    color: colors.muted,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  role: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  inner: {
    backgroundColor: '#fff7df',
    marginTop: 12,
  },
  taskHeader: {
    gap: 8,
    marginBottom: 8,
  },
  task: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  taskDescription: {
    color: colors.ink,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  taskXp: {
    color: colors.green,
    fontWeight: '900',
  },
  revisionText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '900',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusDone: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
  },
  statusPendingText: {
    color: '#B45309',
  },
  statusDoneText: {
    color: '#166534',
  },
  emptyMini: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    marginTop: 12,
    padding: 14,
  },
  emptyMiniTitle: {
    color: colors.ink,
    fontWeight: '900',
    marginBottom: 4,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorCard: {
    gap: 12,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: colors.secondary,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },


  jobScreen: {
    marginBottom: 14,
  },

  jobTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 6,
  },

  jobSubtitle: {
    color: colors.muted,
    marginBottom: 18,
  },

  jobGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  jobCard: {
    width: '48%',
    backgroundColor: '#F8FFFA',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    alignItems: 'center',
  },

  jobIcon: {
    fontSize: 34,
    marginBottom: 10,
  },

  jobCardTitle: {
    color: colors.ink,
    fontWeight: '900',
    marginBottom: 6,
  },

  jobCardDescription: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },


  waitingCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 14,
  },

  waitingIcon: {
    fontSize: 60,
    marginBottom: 12,
  },

  waitingTitle: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 8,
  },

  waitingSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 20,
  },

  teamMissionCard: {
    marginBottom: 14,
  },

  teamMissionTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },

  teamMissionSubtitle: {
    color: colors.muted,
    marginBottom: 16,
  },

  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },

  stepPill: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDE7D8',
    paddingVertical: 12,
    alignItems: 'center',
  },

  stepText: {
    fontWeight: '900',
    color: colors.ink,
  },

  stepDone: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  stepDoneText: {
    fontWeight: '900',
    color: '#166534',
  },

  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFFA',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
  },

  teamArrow: {
    fontSize: 22,
    fontWeight: '900',
  },

});
